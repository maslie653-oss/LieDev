import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Cloud,
  Download,
  Upload,
  LogOut,
  Smartphone,
  HardDrive,
  Users,
  FileCheck,
  RefreshCw,
  X,
  Sparkles,
  Lock,
} from 'lucide-react';
import {
  FacebookUserProfile,
  loginWithFacebook,
  logoutFacebook,
  getFacebookUser,
} from '../utils/facebookAuth';
import {
  saveFacebookCloudBackup,
  getFacebookCloudBackup,
  restoreDataFromFacebookCloud,
  simulatePhoneReset,
  FacebookVaultBackupSnapshot,
} from '../utils/facebookCloudVault';
import {
  StoredFileItem,
  ContactItem,
  MessageItem,
  AppItem,
  DeviceProfile,
  formatBytes,
} from '../utils/storageEngine';

interface FacebookLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  files: StoredFileItem[];
  contacts: ContactItem[];
  messages: MessageItem[];
  apps: AppItem[];
  profile: DeviceProfile;
  onRestoreCompleted: (restoredData: {
    files: StoredFileItem[];
    contacts: ContactItem[];
    messages: MessageItem[];
    apps: AppItem[];
    profile?: DeviceProfile;
  }) => void;
  showToast: (msg: string) => void;
}

export const FacebookLoginModal: React.FC<FacebookLoginModalProps> = ({
  isOpen,
  onClose,
  files,
  contacts,
  messages,
  apps,
  profile,
  onRestoreCompleted,
  showToast,
}) => {
  const [currentUser, setCurrentUser] = useState<FacebookUserProfile | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Cloud snapshot state
  const [cloudBackup, setCloudBackup] = useState<FacebookVaultBackupSnapshot | null>(null);

  // Custom login inputs (for interactive custom name/ID)
  const [showCustomConnect, setShowCustomConnect] = useState(false);
  const [fbNameInput, setFbNameInput] = useState('');
  const [fbEmailInput, setFbEmailInput] = useState('');

  // Confirmation dialog state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'reset' | 'restore';
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: 'reset',
    title: '',
    message: '',
  });

  // Sync user state on open
  useEffect(() => {
    if (isOpen) {
      const user = getFacebookUser();
      setCurrentUser(user);
      if (user) {
        const existingBackup = getFacebookCloudBackup(user.id);
        setCloudBackup(existingBackup);
      }
    }
  }, [isOpen]);

  const handleFacebookLogin = async () => {
    setIsLoggingIn(true);
    try {
      const user = await loginWithFacebook(
        fbNameInput.trim()
          ? {
              name: fbNameInput.trim(),
              email: fbEmailInput.trim() || undefined,
            }
          : undefined
      );
      setCurrentUser(user);

      // Auto-check for existing cloud backup
      const existing = getFacebookCloudBackup(user.id);
      if (existing) {
        setCloudBackup(existing);
        showToast(`Selamat datang kembali, ${user.name}! Brankas cloud Anda siap.`);
      } else {
        // Auto-create initial cloud snapshot
        const snapshot = saveFacebookCloudBackup(user, {
          files,
          contacts,
          messages,
          apps,
          profile,
        });
        setCloudBackup(snapshot);
        showToast(`Login Facebook berhasil! Seluruh file brankas otomatis terlindungi.`);
      }
    } catch (err: any) {
      console.error('Facebook Login Error:', err);
      showToast('Gagal terhubung dengan Facebook. Silakan coba kembali.');
    } finally {
      setIsLoggingIn(false);
      setShowCustomConnect(false);
    }
  };

  const handleLogout = async () => {
    await logoutFacebook();
    setCurrentUser(null);
    setCloudBackup(null);
    showToast('Telah keluar dari akun Facebook.');
  };

  const handleManualCloudBackup = () => {
    if (!currentUser) return;
    setIsBackingUp(true);

    try {
      const snapshot = saveFacebookCloudBackup(currentUser, {
        files,
        contacts,
        messages,
        apps,
        profile,
      });
      setCloudBackup(snapshot);
      showToast(`Berhasil mencadangkan ${files.length} file ke Cloud Vault Facebook!`);
    } catch (err: any) {
      console.error('Backup error:', err);
      showToast('Gagal menyimpan cadangan cloud.');
    } finally {
      setIsBackingUp(false);
    }
  };

  const executeRestore = async () => {
    if (!cloudBackup) {
      showToast('Tidak ada data cadangan di akun Facebook ini.');
      return;
    }

    setIsRestoring(true);
    try {
      const restored = await restoreDataFromFacebookCloud(cloudBackup);
      onRestoreCompleted(restored);
      showToast(`Semua file (${restored.files.length} file, ${restored.contacts.length} kontak) berhasil dipulihkan dari akun Facebook!`);
      setConfirmModal((prev) => ({ ...prev, isOpen: false }));
    } catch (err) {
      console.error('Restore error:', err);
      showToast('Gagal memulihkan berkas dari akun Facebook.');
    } finally {
      setIsRestoring(false);
    }
  };

  const executeFactoryResetSimulation = async () => {
    setIsResetting(true);
    try {
      // Before wiping local device, ensure cloud vault has the latest backup
      if (currentUser) {
        const snapshot = saveFacebookCloudBackup(currentUser, {
          files,
          contacts,
          messages,
          apps,
          profile,
        });
        setCloudBackup(snapshot);
      }

      await simulatePhoneReset();

      // Clear local memory state to demonstrate wipe
      onRestoreCompleted({
        files: [],
        contacts: [],
        messages: [],
        apps: [],
      });

      setCurrentUser(null);
      setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      showToast('Simulasi Reset HP Selesai: Seluruh memori lokal HP telah kosong bersih!');
    } catch (err) {
      console.error('Reset simulation error:', err);
    } finally {
      setIsResetting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-blue-500/30 bg-slate-900 shadow-2xl shadow-blue-500/10 flex flex-col max-h-[90vh]">
        {/* Header with Official Facebook Theme */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950/40 px-6 py-4">
          <div className="flex items-center space-x-3">
            {/* Facebook F Badge */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#1877F2] text-white shadow-lg shadow-blue-500/30 font-black text-xl">
              f
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white">Login Akun Facebook</h3>
                <span className="rounded-full border border-blue-500/40 bg-blue-950/60 px-2.5 py-0.5 text-[10px] font-bold text-blue-300">
                  Brankas Anti-Reset HP
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Lindungi seluruh 5 TB berkas Anda agar tidak hilang saat HP di-reset atau ganti HP baru
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Tutup modal"
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Main Account Status Card */}
          {currentUser ? (
            <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-b from-blue-950/20 to-slate-950 p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-3.5">
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.name}
                    className="h-14 w-14 rounded-2xl ring-2 ring-blue-500/50 object-cover shadow-lg"
                  />
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="text-base font-bold text-white">{currentUser.name}</h4>
                      <span className="inline-flex items-center rounded-full bg-blue-500/20 border border-blue-500/40 px-2 py-0.5 text-[10px] font-bold text-blue-300">
                        <CheckCircle2 className="mr-1 h-3 w-3 text-blue-400" />
                        Terhubung Facebook
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-mono">{currentUser.email}</p>
                    <div className="mt-1 flex items-center text-[11px] text-emerald-400 font-medium">
                      <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                      Status Perlindungan: Aktif (Aman dari Reset HP)
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center space-x-1.5 rounded-xl border border-slate-700 bg-slate-850 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:border-red-500/40 hover:bg-red-950/30 hover:text-red-300 transition-all"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Keluar Akun</span>
                </button>
              </div>

              {/* Protection Metrics Pill Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800">
                <div className="rounded-xl bg-slate-900/80 p-2.5 text-center border border-slate-800">
                  <span className="text-[10px] uppercase text-slate-400">Berkas Tersimpan</span>
                  <div className="text-sm font-bold text-white mt-0.5">{files.length} File</div>
                </div>
                <div className="rounded-xl bg-slate-900/80 p-2.5 text-center border border-slate-800">
                  <span className="text-[10px] uppercase text-slate-400">Total Ukuran</span>
                  <div className="text-sm font-bold text-blue-400 mt-0.5">
                    {formatBytes(files.reduce((s, f) => s + f.size, 0))}
                  </div>
                </div>
                <div className="rounded-xl bg-slate-900/80 p-2.5 text-center border border-slate-800">
                  <span className="text-[10px] uppercase text-slate-400">Kontak Aman</span>
                  <div className="text-sm font-bold text-white mt-0.5">{contacts.length} Kontak</div>
                </div>
                <div className="rounded-xl bg-slate-900/80 p-2.5 text-center border border-slate-800">
                  <span className="text-[10px] uppercase text-slate-400">Status Cadangan</span>
                  <div className="text-sm font-bold text-emerald-400 mt-0.5">Tersinkron</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6 text-center space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1877F2]/10 border border-[#1877F2]/30 text-[#1877F2]">
                <span className="font-black text-2xl">f</span>
              </div>
              <div>
                <h4 className="text-base font-bold text-white">Hubungkan Akun Facebook Anda</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                  Semua berkas 5 TB, foto liburan, musik, video, dan buku kontak Anda akan otomatis dikaitkan dengan identitas akun Facebook Anda. Saat HP di-reset ke setelan pabrik, Anda cukup login kembali ke Facebook untuk memulihkan seluruh data secara utuh!
                </p>
              </div>

              {/* Login Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  onClick={handleFacebookLogin}
                  disabled={isLoggingIn}
                  aria-label="Masuk dengan Akun Facebook"
                  className="w-full sm:w-auto inline-flex items-center justify-center space-x-2.5 rounded-2xl bg-[#1877F2] hover:bg-[#166fe5] px-6 py-3 text-xs font-bold text-white shadow-lg shadow-blue-500/25 active:scale-95 transition-all disabled:opacity-50"
                >
                  <span className="font-black text-sm">f</span>
                  <span>{isLoggingIn ? 'Menghubungkan...' : 'Masuk dengan Facebook'}</span>
                </button>

                <button
                  onClick={() => setShowCustomConnect(!showCustomConnect)}
                  className="w-full sm:w-auto rounded-2xl border border-slate-700 bg-slate-850 px-4 py-3 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
                >
                  {showCustomConnect ? 'Tutup Pilihan ID' : 'Gunakan ID Facebook Kustom'}
                </button>
              </div>

              {/* Custom Facebook ID Connect Form */}
              {showCustomConnect && (
                <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/90 p-4 text-left space-y-3 max-w-md mx-auto animate-scaleUp">
                  <div className="text-xs font-semibold text-white flex items-center space-x-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-blue-400" />
                    <span>Masuk dengan Nama / Profil Facebook Anda</span>
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Nama Akun Facebook</label>
                    <input
                      type="text"
                      placeholder="Contoh: Alfin Bajo"
                      value={fbNameInput}
                      onChange={(e) => setFbNameInput(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Email Facebook (Opsional)</label>
                    <input
                      type="email"
                      placeholder="alfinbajo@gmail.com"
                      value={fbEmailInput}
                      onChange={(e) => setFbEmailInput(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <button
                    onClick={handleFacebookLogin}
                    disabled={!fbNameInput.trim()}
                    className="w-full rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-2 text-xs font-bold text-white transition-all disabled:opacity-40"
                  >
                    Konfirmasi & Masuk
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Cloud Vault & Anti-Reset Actions Section */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Operasi Perlindungan Cloud & Pemulihan Reset HP
            </h4>

            {/* Action 1: Manual Cloud Vault Sync */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition-all">
              <div className="flex items-start space-x-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <Upload className="h-5 w-5" />
                </div>
                <div>
                  <h5 className="text-sm font-semibold text-white">
                    Sinkronkan Cadangan ke Facebook Cloud Vault
                  </h5>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Perbarui snapshot cloud dari seluruh berkas, kontak, dan pesan terkini di akun Facebook Anda.
                  </p>
                </div>
              </div>

              <button
                onClick={handleManualCloudBackup}
                disabled={!currentUser || isBackingUp}
                className="flex shrink-0 items-center justify-center space-x-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-500 active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none"
              >
                <Upload className={`h-4 w-4 ${isBackingUp ? 'animate-bounce' : ''}`} />
                <span>{isBackingUp ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}</span>
              </button>
            </div>

            {/* Action 2: Restore from Cloud Vault */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition-all">
              <div className="flex items-start space-x-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Download className="h-5 w-5" />
                </div>
                <div>
                  <h5 className="text-sm font-semibold text-white">
                    Pulihkan Seluruh Berkas dari Akun Facebook
                  </h5>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Gunakan fitur ini setelah reset HP atau saat membuka di perangkat baru untuk mengembalikan seluruh data.
                  </p>
                  {cloudBackup && (
                    <div className="mt-1 text-[11px] text-emerald-400 flex items-center space-x-2">
                      <span>Tersedia: {cloudBackup.totalFiles} berkas ({cloudBackup.formattedSize})</span>
                      <span>•</span>
                      <span>Dibuat: {cloudBackup.formattedBackupDate}</span>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() =>
                  setConfirmModal({
                    isOpen: true,
                    type: 'restore',
                    title: 'Pulihkan Seluruh Berkas dari Facebook?',
                    message: `Sistem akan memuat ${cloudBackup?.totalFiles || 0} berkas, ${cloudBackup?.totalContacts || 0} kontak, dan ${cloudBackup?.totalMessages || 0} pesan dari Cloud Vault akun Facebook Anda.`,
                  })
                }
                disabled={!cloudBackup || isRestoring}
                className="flex shrink-0 items-center justify-center space-x-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-500 active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none"
              >
                <Download className={`h-4 w-4 ${isRestoring ? 'animate-bounce' : ''}`} />
                <span>{isRestoring ? 'Memulihkan...' : 'Pulihkan Berkas'}</span>
              </button>
            </div>

            {/* Action 3: Interactive Phone Reset Simulation */}
            <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start space-x-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <RotateCcw className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h5 className="text-sm font-bold text-amber-300">
                      Uji Coba: Simulasi Reset Pabrik HP
                    </h5>
                    <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                      Fitur Pengujian
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Kosongkan seluruh penyimpanan lokal HP untuk membuktikan bahwa berkas Anda tidak akan hilang dan dapat dipulihkan kapan saja dengan login Facebook.
                  </p>
                </div>
              </div>

              <button
                onClick={() =>
                  setConfirmModal({
                    isOpen: true,
                    type: 'reset',
                    title: 'Mulai Simulasi Reset Pabrik HP?',
                    message:
                      'Aplikasi akan menghapus data penyimpanan lokal di browser ini seolah-olah HP baru selesai di-factory reset. Anda dapat login kembali ke akun Facebook untuk memulihkan seluruh file!',
                  })
                }
                disabled={isResetting}
                className="flex shrink-0 items-center justify-center space-x-1.5 rounded-xl border border-amber-500/40 bg-amber-900/40 px-4 py-2.5 text-xs font-bold text-amber-300 hover:bg-amber-900/60 active:scale-95 transition-all disabled:opacity-50"
              >
                <RotateCcw className={`h-4 w-4 ${isResetting ? 'animate-spin' : ''}`} />
                <span>Simulasi Reset HP</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-950/90 px-6 py-4">
          <div className="text-[11px] text-slate-400 flex items-center space-x-1.5">
            <Lock className="h-3 w-3 text-blue-400" />
            <span>Enkripsi Cloud Vault Terintegrasi dengan Akun Facebook</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-750 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl border border-blue-500/40 bg-slate-900 p-6 shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-start space-x-3.5">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  confirmModal.type === 'reset'
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                }`}
              >
                {confirmModal.type === 'reset' ? (
                  <AlertTriangle className="h-5 w-5" />
                ) : (
                  <CheckCircle2 className="h-5 w-5" />
                )}
              </div>
              <div>
                <h4 className="text-base font-bold text-white">{confirmModal.title}</h4>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  {confirmModal.message}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
                className="rounded-xl border border-slate-700 bg-slate-850 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800"
              >
                Batal
              </button>
              <button
                onClick={
                  confirmModal.type === 'reset'
                    ? executeFactoryResetSimulation
                    : executeRestore
                }
                className={`rounded-xl px-4 py-2 text-xs font-bold text-white shadow-md active:scale-95 transition-all ${
                  confirmModal.type === 'reset'
                    ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-500/20'
                    : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20'
                }`}
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
