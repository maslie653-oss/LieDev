import React, { useState, useEffect, useRef } from 'react';
import {
  initStorage,
  addStoredFile,
  deleteStoredFile,
  renameStoredFile,
  addContact,
  deleteContact,
  sendChatMessage,
  optimizeAndCleanStorage,
  recordCloneSession,
  CloneSessionLog,
} from './utils/indexedDb';
import {
  StoredFileItem,
  ContactItem,
  MessageItem,
  AppItem,
  DeviceProfile,
  TOTAL_MEGA_STORAGE_BYTES,
  calculateStorageBreakdown,
  analyzeStorageOptimization,
  formatBytes,
} from './utils/storageEngine';
import { Header } from './components/Header';
import { StorageOverview } from './components/StorageOverview';
import { FileManager } from './components/FileManager';
import { PhoneDataViewer } from './components/PhoneDataViewer';
import { CloneWizardModal } from './components/CloneWizardModal';
import { StorageCleanerModal } from './components/StorageCleanerModal';
import { BackupRestoreModal } from './components/BackupRestoreModal';
import { FilePreviewModal } from './components/FilePreviewModal';
import { MediaHub } from './components/MediaHub';
import { GoogleSyncModal } from './components/GoogleSyncModal';
import { initAuth } from './utils/googleAuth';
import { User } from 'firebase/auth';
import {
  HardDrive,
  Smartphone,
  Sparkles,
  Zap,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  FolderOpen,
  Film,
  Music,
  Image as ImageIcon,
} from 'lucide-react';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<DeviceProfile>({
    deviceName: 'HyperPhone 16 Pro Max Ultra',
    model: 'HP-TITANIUM-5TB',
    osVersion: 'HyperOS 2.5 (Android 15)',
    batteryLevel: 94,
    cpuModel: 'Snapdragon 8 Gen 4 (3nm Octa-Core)',
    ramGb: 16,
    totalStorageBytes: TOTAL_MEGA_STORAGE_BYTES,
    allocatedStorageGb: 5120,
    storageType: 'Ultra-Fast NVMe Cloud & Local UFS 4.0',
    connectionSpeed: 'Wi-Fi 7 (1.2 Gbps Direct)',
  });

  const [files, setFiles] = useState<StoredFileItem[]>([]);
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [apps, setApps] = useState<AppItem[]>([]);
  const [history, setHistory] = useState<CloneSessionLog[]>([]);

  // View state
  const [mainTab, setMainTab] = useState<'storage' | 'media' | 'phone_data'>('storage');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Modals state
  const [isCloneWizardOpen, setIsCloneWizardOpen] = useState(false);
  const [isCleanerOpen, setIsCleanerOpen] = useState(false);
  const [isBackupRestoreOpen, setIsBackupRestoreOpen] = useState(false);
  const [isGoogleSyncOpen, setIsGoogleSyncOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<StoredFileItem | null>(null);

  // Auth state
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fileInputTriggerRef = useRef<HTMLInputElement>(null);

  // Initialize data on mount
  useEffect(() => {
    async function loadData() {
      try {
        const data = await initStorage();
        setFiles(data.files);
        setContacts(data.contacts);
        setMessages(data.messages);
        setApps(data.apps);
        setProfile(data.profile);
        setHistory(data.history);
      } catch (err) {
        console.error('Failed to init storage:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();

    // Subscribe to Google Firebase Auth
    const unsubAuth = initAuth(
      (user) => setCurrentUser(user),
      () => setCurrentUser(null)
    );

    return () => {
      unsubAuth();
    };
  }, []);

  // Show temporary toast
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Calculate storage metrics
  const breakdown = calculateStorageBreakdown(files, TOTAL_MEGA_STORAGE_BYTES);
  const optimization = analyzeStorageOptimization(files);

  const totalUsedBytes = breakdown
    .filter((b) => b.category !== 'free')
    .reduce((sum, b) => sum + b.bytes, 0);

  const availableBytes = Math.max(0, TOTAL_MEGA_STORAGE_BYTES - totalUsedBytes);
  const usedPercentage = Number(((totalUsedBytes / TOTAL_MEGA_STORAGE_BYTES) * 100).toFixed(2));

  // Handle uploading real files
  const handleUploadFiles = async (fileList: FileList) => {
    const uploadedArray: StoredFileItem[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      let cat: 'photos' | 'videos' | 'audio' | 'documents' | 'apps' | 'system' = 'documents';

      if (file.type.startsWith('image/')) cat = 'photos';
      else if (file.type.startsWith('video/')) cat = 'videos';
      else if (file.type.startsWith('audio/')) cat = 'audio';
      else if (file.name.endsWith('.apk') || file.type.includes('package-archive')) cat = 'apps';
      else if (file.name.endsWith('.bin') || file.name.endsWith('.tmp')) cat = 'system';

      // Read as Data URL for preview if image or audio or small file
      let blobUrl = '';
      if (file.type.startsWith('image/') || file.type.startsWith('audio/')) {
        try {
          blobUrl = await readFileAsDataUrl(file);
        } catch {
          blobUrl = '';
        }
      }

      const newStoredItem: StoredFileItem = {
        id: `file_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        category: cat,
        createdAt: Date.now(),
        lastModified: file.lastModified,
        blobData: blobUrl || undefined,
        isRealUpload: true,
      };

      uploadedArray.push(newStoredItem);
    }

    let updatedList = [...files];
    for (const item of uploadedArray) {
      updatedList = await addStoredFile(item);
    }

    setFiles(updatedList);
    showToast(`Berhasil mengunggah ${uploadedArray.length} berkas ke penyimpanan 5 TB!`);
  };

  const readFileAsDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Delete file
  const handleDeleteFile = async (id: string) => {
    const updated = await deleteStoredFile(id);
    setFiles(updated);
    showToast('Berkas berhasil dihapus.');
  };

  // Rename file
  const handleRenameFile = async (id: string, newName: string) => {
    const updated = await renameStoredFile(id, newName);
    setFiles(updated);
    showToast('Nama berkas diperbarui.');
  };

  // Add contact
  const handleAddContact = async (contact: ContactItem) => {
    const updated = await addContact(contact);
    setContacts(updated);
    showToast(`Kontak "${contact.name}" berhasil ditambahkan.`);
  };

  // Delete contact
  const handleDeleteContact = async (id: string) => {
    const updated = await deleteContact(id);
    setContacts(updated);
    showToast('Kontak dihapus.');
  };

  // Send message
  const handleSendMessage = async (threadId: string, text: string) => {
    const updated = await sendChatMessage(threadId, text);
    setMessages(updated);
  };

  // Storage Cleaner handler
  const handleCleanStorage = async (cleanDuplicates: boolean, cleanCache: boolean) => {
    const res = await optimizeAndCleanStorage(cleanDuplicates, cleanCache);
    setFiles(res.updatedFiles);
    showToast(`Berhasil membersihkan ${res.deletedCount} berkas sampah (${formatBytes(res.reclaimedBytes)})!`);
    return res.reclaimedBytes;
  };

  // Clone success handler
  const handleCloneSuccess = async (summary: {
    itemsCount: number;
    totalBytes: number;
    categories: string[];
  }) => {
    const newLog: CloneSessionLog = {
      id: `clone_${Date.now()}`,
      sourceDevice: 'Galaxy S24 Ultra (Ponsel Lama)',
      targetDevice: profile.deviceName,
      timestamp: Date.now(),
      totalTransferredBytes: summary.totalBytes,
      itemsCloned: summary.itemsCount,
      categories: summary.categories,
      durationSeconds: 14,
      averageSpeedMbs: 102.5,
      status: 'completed',
    };

    const updatedHistory = await recordCloneSession(newLog);
    setHistory(updatedHistory);
    showToast(`Kloning selesai! ${summary.itemsCount.toLocaleString()} item berhasil dipindahkan.`);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="text-center space-y-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent mx-auto" />
          <p className="text-sm font-semibold text-slate-300">Memuat Brankas HyperClone 5 TB...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-slate-950 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 right-4 z-50 flex items-center space-x-2 rounded-2xl border border-cyan-500/40 bg-slate-900/95 px-4 py-3 text-xs font-semibold text-cyan-300 shadow-2xl backdrop-blur-md animate-slideDown">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header with Device Telemetry & Quick Action */}
      <Header
        profile={profile}
        totalUsedFormatted={formatBytes(totalUsedBytes, 1)}
        totalCapacityFormatted="5.0 TB"
        usedPercentage={usedPercentage}
        currentUser={currentUser}
        onOpenCloneWizard={() => setIsCloneWizardOpen(true)}
        onOpenCleaner={() => setIsCleanerOpen(true)}
        onOpenBackupRestore={() => setIsBackupRestoreOpen(true)}
        onOpenGoogleSync={() => setIsGoogleSyncOpen(true)}
      />

      {/* Main Container */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8 space-y-7">
        {/* Storage Hero Overview (Massive 5 TB Showcase) */}
        <StorageOverview
          breakdown={breakdown}
          totalBytes={TOTAL_MEGA_STORAGE_BYTES}
          usedBytes={totalUsedBytes}
          availableBytes={availableBytes}
          reclaimableBytes={optimization.totalReclaimableBytes}
          onSelectCategory={(cat) => {
            if (cat === 'photos' || cat === 'videos' || cat === 'audio') {
              setMainTab('media');
            } else {
              setSelectedCategory(cat);
              setMainTab('storage');
            }
          }}
          onOpenCleaner={() => setIsCleanerOpen(true)}
          onOpenCloneWizard={() => setIsCloneWizardOpen(true)}
          onTriggerUpload={() => {
            setMainTab('storage');
            fileInputTriggerRef.current?.click();
          }}
        />

        {/* Hidden File Picker triggered by hero CTA */}
        <input
          type="file"
          ref={fileInputTriggerRef}
          multiple
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleUploadFiles(e.target.files);
            }
          }}
          className="hidden"
        />

        {/* Navigation Switcher: Mega Storage Files vs Media Player vs Cloned Phone Data */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-1.5 overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/80 p-1.5 text-xs font-bold scrollbar-none">
            <button
              onClick={() => setMainTab('storage')}
              className={`flex items-center space-x-2 rounded-xl px-4 py-2 transition-all shrink-0 ${
                mainTab === 'storage'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <HardDrive className="h-4 w-4" />
              <span>Penyimpanan 5 TB & Berkas ({files.length})</span>
            </button>

            <button
              onClick={() => setMainTab('media')}
              className={`flex items-center space-x-2 rounded-xl px-4 py-2 transition-all shrink-0 ${
                mainTab === 'media'
                  ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-md shadow-purple-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Film className="h-4 w-4" />
              <span>Galeri & Pemutar Media (Musik, Video, Foto)</span>
            </button>

            <button
              onClick={() => setMainTab('phone_data')}
              className={`flex items-center space-x-2 rounded-xl px-4 py-2 transition-all shrink-0 ${
                mainTab === 'phone_data'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="h-4 w-4" />
              <span>Konten Ponsel (Kontak, Pesan, Aplikasi)</span>
            </button>
          </div>

          <div className="flex items-center space-x-3 text-xs text-slate-400">
            <span className="flex items-center text-emerald-400 font-medium">
              <ShieldCheck className="h-3.5 w-3.5 mr-1" />
              Enkripsi Hardware NVMe Aktif
            </span>
            <span>•</span>
            <span className="font-mono text-cyan-400">
              Tersisa: {formatBytes(availableBytes, 2)}
            </span>
          </div>
        </div>

        {/* Tab 1: Mega Storage File Explorer */}
        {mainTab === 'storage' && (
          <section aria-label="Manajer Berkas Penyimpanan 5 TB">
            <FileManager
              files={files}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              onUploadFiles={handleUploadFiles}
              onDeleteFile={handleDeleteFile}
              onRenameFile={handleRenameFile}
              onPreviewFile={(f) => setPreviewFile(f)}
            />
          </section>
        )}

        {/* Tab 2: Dedicated Media Hub (Photos, Videos, and Audio) */}
        {mainTab === 'media' && (
          <section aria-label="Pusat Multimedia dan Pemutar Media">
            <MediaHub
              files={files}
              onUploadMedia={() => fileInputTriggerRef.current?.click()}
            />
          </section>
        )}

        {/* Tab 3: Cloned Phone Content Viewer */}
        {mainTab === 'phone_data' && (
          <section aria-label="Konten Ponsel Terkloning">
            <PhoneDataViewer
              contacts={contacts}
              messages={messages}
              apps={apps}
              history={history}
              onAddContact={handleAddContact}
              onDeleteContact={handleDeleteContact}
              onSendMessage={handleSendMessage}
              onOpenGoogleSync={() => setIsGoogleSyncOpen(true)}
            />
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2 text-slate-400">
            <Smartphone className="h-4 w-4 text-cyan-400" />
            <span className="font-bold text-white">HyperClone</span>
            <span>— Solusi Kloning Ponsel dengan Penyimpanan 5 TB Terintegrasi</span>
          </div>
          <div className="flex items-center space-x-4 text-[11px] text-slate-500">
            <span>UFS 4.0 NVMe Multi-Tier</span>
            <span>•</span>
            <span>Wi-Fi 7 Direct Ultra-Speed</span>
            <span>•</span>
            <span>Backup Terenkripsi AES-256</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <CloneWizardModal
        isOpen={isCloneWizardOpen}
        onClose={() => setIsCloneWizardOpen(false)}
        onCloneSuccess={handleCloneSuccess}
      />

      <StorageCleanerModal
        isOpen={isCleanerOpen}
        onClose={() => setIsCleanerOpen(false)}
        files={files}
        onCleanStorage={handleCleanStorage}
      />

      <BackupRestoreModal
        isOpen={isBackupRestoreOpen}
        onClose={() => setIsBackupRestoreOpen(false)}
        onDataRestored={(restored) => {
          setFiles(restored.files);
          setContacts(restored.contacts);
          setMessages(restored.messages);
          setApps(restored.apps);
          showToast('Data berhasil diperbarui dari cadangan!');
        }}
      />

      <FilePreviewModal
        file={previewFile}
        onClose={() => setPreviewFile(null)}
      />

      <GoogleSyncModal
        isOpen={isGoogleSyncOpen}
        onClose={() => setIsGoogleSyncOpen(false)}
        files={files}
        contacts={contacts}
        messages={messages}
        apps={apps}
        onContactsUpdated={(updated) => setContacts(updated)}
        onDataRestored={(restored) => {
          setFiles(restored.files);
          setContacts(restored.contacts);
          setMessages(restored.messages);
          setApps(restored.apps);
          showToast('Data berhasil dipulihkan dari Google Drive!');
        }}
        showToast={showToast}
      />
    </div>
  );
}
