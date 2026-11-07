import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import {
  Cloud,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Users,
  HardDrive,
  Download,
  Upload,
  LogOut,
  ExternalLink,
  Shield,
  Clock,
  Sparkles,
  X,
  FileCheck,
} from 'lucide-react';
import {
  googleSignIn,
  logoutGoogle,
  getAccessToken,
  initAuth,
} from '../utils/googleAuth';
import {
  fetchGoogleContacts,
  mergeContactsIntelligently,
  uploadBackupToGoogleDrive,
  listGoogleDriveBackups,
  downloadGoogleDriveBackup,
  GoogleDriveBackupFile,
} from '../utils/googleSync';
import {
  ContactItem,
  StoredFileItem,
  MessageItem,
  AppItem,
  formatBytes,
} from '../utils/storageEngine';
import { saveContactsBulk, initStorage } from '../utils/indexedDb';

interface GoogleSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  files: StoredFileItem[];
  contacts: ContactItem[];
  messages: MessageItem[];
  apps: AppItem[];
  onContactsUpdated: (updatedContacts: ContactItem[]) => void;
  onDataRestored?: (restored: {
    files: StoredFileItem[];
    contacts: ContactItem[];
    messages: MessageItem[];
    apps: AppItem[];
  }) => void;
  showToast: (msg: string) => void;
}

export const GoogleSyncModal: React.FC<GoogleSyncModalProps> = ({
  isOpen,
  onClose,
  files,
  contacts,
  messages,
  apps,
  onContactsUpdated,
  onDataRestored,
  showToast,
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [activeTab, setActiveTab] = useState<'sync' | 'drive_backups'>('sync');

  // Operation states
  const [isSyncingContacts, setIsSyncingContacts] = useState(false);
  const [isBackingUpDrive, setIsBackingUpDrive] = useState(false);
  const [isLoadingBackups, setIsLoadingBackups] = useState(false);
  const [isRestoringBackupId, setIsRestoringBackupId] = useState<string | null>(null);

  // Drive backups list
  const [driveBackups, setDriveBackups] = useState<GoogleDriveBackupFile[]>([]);

  // Confirmation modal dialogs (Mandatory for mutating/uploading operations)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    type: 'contacts' | 'backup_drive' | 'restore_drive';
    title: string;
    description: string;
    itemCount?: number;
    targetId?: string;
  }>({
    isOpen: false,
    type: 'contacts',
    title: '',
    description: '',
  });

  // Result messages
  const [syncStatusMessage, setSyncStatusMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  // Subscribe to auth state on mount
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setCurrentUser(user);
        setAccessToken(token);
      },
      () => {
        setCurrentUser(null);
        setAccessToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // When user is authenticated & activeTab changes to backups, list Drive files
  useEffect(() => {
    if (accessToken && activeTab === 'drive_backups') {
      loadDriveBackups();
    }
  }, [accessToken, activeTab]);

  const handleGoogleLogin = async () => {
    setIsSigningIn(true);
    setSyncStatusMessage(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setCurrentUser(res.user);
        setAccessToken(res.accessToken);
        showToast(`Selamat datang, ${res.user.displayName || 'Pengguna Google'}!`);
      }
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      setSyncStatusMessage({
        type: 'error',
        text: err.message || 'Gagal login dengan Google. Pastikan izin popup browser aktif.',
      });
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleLogout = async () => {
    await logoutGoogle();
    setCurrentUser(null);
    setAccessToken(null);
    setDriveBackups([]);
    showToast('Telah keluar dari akun Google.');
  };

  const loadDriveBackups = async () => {
    if (!accessToken) return;
    setIsLoadingBackups(true);
    try {
      const list = await listGoogleDriveBackups(accessToken);
      setDriveBackups(list);
    } catch (err: any) {
      console.error('Failed to list backups:', err);
    } finally {
      setIsLoadingBackups(false);
    }
  };

  // Trigger confirmation for Contacts Sync
  const promptSyncContacts = () => {
    setConfirmDialog({
      isOpen: true,
      type: 'contacts',
      title: 'Sinkronkan Kontak dari Akun Google?',
      description:
        'Aplikasi akan membaca kontak dari Google Contacts Anda dan menggabungkannya secara cerdas ke dalam brankas HyperClone 5TB. Kontak duplikat akan difilter secara otomatis.',
    });
  };

  // Trigger confirmation for Drive Backup
  const promptBackupToDrive = () => {
    setConfirmDialog({
      isOpen: true,
      type: 'backup_drive',
      title: 'Unggah Cadangan ke Google Drive?',
      description: `Aplikasi akan membuat arsip cadangan resmi berisi ${files.length} berkas, ${contacts.length} kontak, ${messages.length} pesan, dan ${apps.length} aplikasi ke ruang penyimpanan Google Drive Anda (ruang lingkup aman app-only).`,
    });
  };

  // Trigger confirmation for Drive Restore
  const promptRestoreFromDrive = (file: GoogleDriveBackupFile) => {
    setConfirmDialog({
      isOpen: true,
      type: 'restore_drive',
      title: `Pulihkan Data dari "${file.name}"?`,
      description:
        'Data lokal Anda akan digantikan atau digabungkan dengan berkas cadangan dari Google Drive. Pastikan Anda telah menyimpan perubahan saat ini.',
      targetId: file.id,
    });
  };

  // Execute confirmed action
  const handleConfirmAction = async () => {
    const currentAction = confirmDialog.type;
    const targetId = confirmDialog.targetId;
    setConfirmDialog((prev) => ({ ...prev, isOpen: false }));

    if (currentAction === 'contacts') {
      await executeContactsSync();
    } else if (currentAction === 'backup_drive') {
      await executeDriveBackup();
    } else if (currentAction === 'restore_drive' && targetId) {
      await executeDriveRestore(targetId);
    }
  };

  const executeContactsSync = async () => {
    if (!accessToken) {
      setSyncStatusMessage({
        type: 'error',
        text: 'Sesi Google telah berakhir. Silakan login kembali.',
      });
      return;
    }

    setIsSyncingContacts(true);
    setSyncStatusMessage({
      type: 'info',
      text: 'Mengunduh kontak Google via Google People API...',
    });

    try {
      const googleContacts = await fetchGoogleContacts(accessToken);

      if (googleContacts.length === 0) {
        setSyncStatusMessage({
          type: 'info',
          text: 'Tidak ada kontak yang ditemukan di akun Google Anda atau buku kontak kosong.',
        });
        setIsSyncingContacts(false);
        return;
      }

      // Merge intelligently
      const { merged, importedCount, skippedCount } = mergeContactsIntelligently(
        contacts,
        googleContacts
      );

      // Persist in IndexedDB
      await saveContactsBulk(merged);
      onContactsUpdated(merged);

      setSyncStatusMessage({
        type: 'success',
        text: `Berhasil menyinkronkan! ${importedCount} kontak baru ditambahkan, ${skippedCount} kontak duplikat disaring secara cerdas.`,
      });
      showToast(`${importedCount} kontak Google berhasil disinkronkan!`);
    } catch (err: any) {
      console.error('Sync error:', err);
      setSyncStatusMessage({
        type: 'error',
        text: err.message || 'Gagal menyinkronkan Google Contacts.',
      });
    } finally {
      setIsSyncingContacts(false);
    }
  };

  const executeDriveBackup = async () => {
    if (!accessToken) {
      setSyncStatusMessage({
        type: 'error',
        text: 'Sesi Google telah berakhir. Silakan login kembali.',
      });
      return;
    }

    setIsBackingUpDrive(true);
    setSyncStatusMessage({
      type: 'info',
      text: 'Mengemas data 5 TB & mengunggah ke Google Drive...',
    });

    try {
      const result = await uploadBackupToGoogleDrive(accessToken, {
        files,
        contacts,
        messages,
        apps,
      });

      setSyncStatusMessage({
        type: 'success',
        text: `Cadangan cloud berhasil dibuat! Nama berkas: "${result.name}" tersimpan aman di Google Drive Anda.`,
      });
      showToast('Cadangan berhasil diunggah ke Google Drive!');
      // Refresh list
      loadDriveBackups();
    } catch (err: any) {
      console.error('Backup error:', err);
      setSyncStatusMessage({
        type: 'error',
        text: err.message || 'Gagal mengunggah cadangan ke Google Drive.',
      });
    } finally {
      setIsBackingUpDrive(false);
    }
  };

  const executeDriveRestore = async (fileId: string) => {
    if (!accessToken) return;
    setIsRestoringBackupId(fileId);
    try {
      const rawData = await downloadGoogleDriveBackup(accessToken, fileId);
      const backupData = rawData.data || rawData;

      if (!backupData || !backupData.files) {
        throw new Error('Format cadangan Google Drive tidak valid.');
      }

      if (onDataRestored) {
        onDataRestored({
          files: backupData.files || [],
          contacts: backupData.contacts || [],
          messages: backupData.messages || [],
          apps: backupData.apps || [],
        });
      }

      showToast('Data brankas berhasil dipulihkan dari Google Drive!');
      onClose();
    } catch (err: any) {
      console.error('Restore error:', err);
      setSyncStatusMessage({
        type: 'error',
        text: err.message || 'Gagal memulihkan cadangan dari Google Drive.',
      });
    } finally {
      setIsRestoringBackupId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-cyan-500/30 bg-slate-900 shadow-2xl shadow-cyan-500/10 animate-scaleUp">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20">
              <Cloud className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white">Sinkronisasi Cerdas & Cloud Vault</h3>
                <span className="rounded-full border border-cyan-500/30 bg-cyan-950/60 px-2 py-0.5 text-[10px] font-semibold text-cyan-300">
                  Google Workspace
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Hubungkan akun Google resmi untuk sinkronisasi kontak dan cadangan Google Drive
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup modal"
            className="rounded-xl p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="max-h-[75vh] overflow-y-auto p-6 space-y-6">
          {/* Account Profile Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
            {currentUser ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-3.5">
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.displayName || 'Avatar'}
                      className="h-12 w-12 rounded-full ring-2 ring-cyan-500/50"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-tr from-cyan-600 to-blue-700 text-base font-bold text-white">
                      {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-white">
                        {currentUser.displayName || 'Pengguna Google'}
                      </span>
                      <span className="inline-flex items-center rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        Terautentikasi Asli
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-mono">{currentUser.email}</p>
                    <p className="text-[11px] text-cyan-400/80 mt-0.5 flex items-center">
                      <Shield className="h-3 w-3 mr-1" />
                      Google Drive & Contacts API Aktif
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center space-x-1.5 rounded-xl border border-slate-700 bg-slate-850 px-3.5 py-2 text-xs font-semibold text-slate-300 transition-all hover:border-red-500/40 hover:bg-red-950/30 hover:text-red-300"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Keluar Akun</span>
                </button>
              </div>
            ) : (
              <div className="text-center py-4 space-y-4">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 border border-slate-700 text-cyan-400">
                  <Cloud className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-white">Belum Terhubung ke Akun Google</h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Masuk dengan akun Google asli Anda untuk mengaktifkan sinkronisasi otomatis buku kontak dan backup cloud ke Google Drive tanpa login palsu.
                  </p>
                </div>

                {/* Official Google Sign In Button */}
                <div className="flex justify-center pt-2">
                  <button
                    onClick={handleGoogleLogin}
                    disabled={isSigningIn}
                    aria-label="Sign in with Google"
                    className="inline-flex items-center space-x-3 rounded-full border border-slate-600 bg-white px-5 py-2.5 text-xs font-semibold text-slate-800 shadow-lg transition-all hover:bg-slate-100 hover:shadow-cyan-500/20 active:scale-95 disabled:opacity-50"
                  >
                    <svg
                      version="1.1"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 48 48"
                      className="h-4 w-4 shrink-0"
                    >
                      <path
                        fill="#EA4335"
                        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                      ></path>
                      <path
                        fill="#4285F4"
                        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                      ></path>
                      <path
                        fill="#FBBC05"
                        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                      ></path>
                      <path
                        fill="#34A853"
                        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                      ></path>
                      <path fill="none" d="M0 0h48v48H0z"></path>
                    </svg>
                    <span>{isSigningIn ? 'Menghubungkan...' : 'Sign in with Google'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Status feedback banner */}
          {syncStatusMessage && (
            <div
              className={`flex items-start space-x-3 rounded-2xl border p-4 text-xs ${
                syncStatusMessage.type === 'success'
                  ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-300'
                  : syncStatusMessage.type === 'error'
                  ? 'border-rose-500/40 bg-rose-950/30 text-rose-300'
                  : 'border-cyan-500/40 bg-cyan-950/30 text-cyan-300'
              }`}
            >
              {syncStatusMessage.type === 'success' ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400 mt-0.5" />
              ) : syncStatusMessage.type === 'error' ? (
                <AlertCircle className="h-5 w-5 shrink-0 text-rose-400 mt-0.5" />
              ) : (
                <RefreshCw className="h-5 w-5 shrink-0 text-cyan-400 animate-spin mt-0.5" />
              )}
              <div className="flex-1 font-medium">{syncStatusMessage.text}</div>
            </div>
          )}

          {/* Subtabs: Sync Hub vs Drive Cloud Vault */}
          <div className="flex space-x-2 border-b border-slate-800 pb-2">
            <button
              onClick={() => setActiveTab('sync')}
              className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                activeTab === 'sync'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Aksi Sinkronisasi Cerdas
            </button>
            <button
              onClick={() => setActiveTab('drive_backups')}
              className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                activeTab === 'drive_backups'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Berkas Google Drive Cloud ({driveBackups.length})
            </button>
          </div>

          {/* Tab 1: Smart Sync Actions */}
          {activeTab === 'sync' && (
            <div className="space-y-4">
              {/* Feature 1: Google Contacts Sync */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 transition-all hover:border-slate-700">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start space-x-3.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">
                        Sinkronisasi Kontak Google (People API)
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Impor kontak dari Google Contacts Anda dengan deteksi duplikat otomatis.
                      </p>
                      <div className="mt-2 flex items-center space-x-3 text-[11px] text-slate-400">
                        <span>Kontak saat ini: <strong className="text-white">{contacts.length}</strong></span>
                        <span>•</span>
                        <span className="text-cyan-400">Penyaringan Duplikasi Cerdas</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={promptSyncContacts}
                    disabled={!currentUser || isSyncingContacts}
                    className="flex shrink-0 items-center justify-center space-x-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition-all hover:bg-blue-500 active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
                  >
                    <RefreshCw className={`h-4 w-4 ${isSyncingContacts ? 'animate-spin' : ''}`} />
                    <span>{isSyncingContacts ? 'Menyinkronkan...' : 'Sinkronkan Kontak'}</span>
                  </button>
                </div>
              </div>

              {/* Feature 2: Google Drive Cloud Backup */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 transition-all hover:border-slate-700">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start space-x-3.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <Upload className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">
                        Cadangkan ke Google Drive Cloud
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Kirim arsip terenkripsi brankas ke folder Google Drive pribadi Anda untuk pemulihan instan kapan saja.
                      </p>
                      <div className="mt-2 flex items-center space-x-3 text-[11px] text-slate-400">
                        <span>Total Berkas: <strong className="text-white">{files.length}</strong></span>
                        <span>•</span>
                        <span>Total Pesan: <strong className="text-white">{messages.length}</strong></span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={promptBackupToDrive}
                    disabled={!currentUser || isBackingUpDrive}
                    className="flex shrink-0 items-center justify-center space-x-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-500/20 transition-all hover:bg-emerald-500 active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
                  >
                    <Upload className={`h-4 w-4 ${isBackingUpDrive ? 'animate-bounce' : ''}`} />
                    <span>{isBackingUpDrive ? 'Mengunggah...' : 'Cadangkan ke Drive'}</span>
                  </button>
                </div>
              </div>

              {/* Smart Sync Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-3 text-xs">
                  <div className="flex items-center space-x-2 text-cyan-400 font-semibold mb-1">
                    <Sparkles className="h-4 w-4" />
                    <span>Deteksi Duplikat Nomor & Email</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Membandingkan format nomor internasional (+62, 08xx) dan alamat email agar kontak tidak tercampur ganda.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-3 text-xs">
                  <div className="flex items-center space-x-2 text-indigo-400 font-semibold mb-1">
                    <Shield className="h-4 w-4" />
                    <span>Izin Terbatas (Least Privilege)</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Hanya menggunakan izin yang disetujui (drive.file dan contacts.readonly) untuk keamanan data pengguna.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Drive Backups List */}
          {activeTab === 'drive_backups' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Daftar arsip cadangan HyperClone yang tersimpan di Google Drive Anda:
                </span>
                <button
                  onClick={loadDriveBackups}
                  disabled={isLoadingBackups || !currentUser}
                  className="flex items-center space-x-1 text-xs text-cyan-400 hover:text-cyan-300 disabled:opacity-50"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isLoadingBackups ? 'animate-spin' : ''}`} />
                  <span>Segarkan</span>
                </button>
              </div>

              {isLoadingBackups ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  <RefreshCw className="h-6 w-6 animate-spin mx-auto text-cyan-400 mb-2" />
                  <span>Memeriksa Google Drive...</span>
                </div>
              ) : driveBackups.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-800 py-8 text-center">
                  <Cloud className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-400">
                    Belum ada cadangan di Google Drive
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Gunakan tombol "Cadangkan ke Drive" pada tab Aksi Sinkronisasi untuk membuat cadangan pertama Anda.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {driveBackups.map((bk) => (
                    <div
                      key={bk.id}
                      className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-3 transition-all hover:border-slate-700"
                    >
                      <div className="flex items-center space-x-3 overflow-hidden">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
                          <FileCheck className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-xs text-white truncate max-w-xs sm:max-w-md">
                            {bk.name}
                          </div>
                          <div className="flex items-center space-x-2 text-[10px] text-slate-400 mt-0.5">
                            <span className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {bk.createdTime
                                ? new Date(bk.createdTime).toLocaleString('id-ID')
                                : 'Tersimpan'}
                            </span>
                            {bk.size && (
                              <>
                                <span>•</span>
                                <span>{formatBytes(Number(bk.size))}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        {bk.webViewLink && (
                          <a
                            href={bk.webViewLink}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
                            title="Buka di Google Drive"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                        <button
                          onClick={() => promptRestoreFromDrive(bk)}
                          disabled={isRestoringBackupId === bk.id}
                          className="flex items-center space-x-1 rounded-lg bg-cyan-600/20 border border-cyan-500/30 px-3 py-1.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-600/30 active:scale-95 disabled:opacity-40"
                        >
                          <Download className="h-3 w-3" />
                          <span>{isRestoringBackupId === bk.id ? 'Memulihkan...' : 'Pulihkan'}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-900/90 px-6 py-4">
          <div className="text-[11px] text-slate-400">
            Terhubung melalui Firebase Client SDK & Google Workspace APIs
          </div>
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 transition-all hover:bg-slate-750"
          >
            Tutup
          </button>
        </div>
      </div>

      {/* Explicit User Confirmation Dialog (MANDATORY for Mutating / Cloud Upload Operations) */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl border border-cyan-500/40 bg-slate-900 p-6 shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-start space-x-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">{confirmDialog.title}</h4>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  {confirmDialog.description}
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-slate-950/60 p-3 text-[11px] text-slate-400 border border-slate-800">
              Operasi ini membutuhkan izin dari akun Google Anda dan akan mencatat perubahan ke penyimpanan HyperClone.
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
                className="rounded-xl border border-slate-700 bg-slate-850 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmAction}
                className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-cyan-500/20 hover:brightness-110 active:scale-95"
              >
                Lanjutkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
