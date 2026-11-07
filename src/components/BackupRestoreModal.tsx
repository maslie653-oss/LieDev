import React, { useState, useRef } from 'react';
import {
  X,
  Download,
  Upload,
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileJson,
} from 'lucide-react';
import { exportFullBackupJson, importFullBackupJson, resetAllToDefault } from '../utils/indexedDb';
import { StoredFileItem, ContactItem, MessageItem, AppItem } from '../utils/storageEngine';
import { fireCelebrationConfetti } from '../utils/confetti';

interface BackupRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataRestored: (data: {
    files: StoredFileItem[];
    contacts: ContactItem[];
    messages: MessageItem[];
    apps: AppItem[];
  }) => void;
}

export const BackupRestoreModal: React.FC<BackupRestoreModalProps> = ({
  isOpen,
  onClose,
  onDataRestored,
}) => {
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Export JSON backup file
  const handleExportBackup = () => {
    try {
      const jsonStr = exportFullBackupJson();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `HyperClone_Backup_5TB_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      setStatusMessage({
        type: 'success',
        text: 'Berkas cadangan JSON berhasil diunduh ke perangkat Anda!',
      });
      fireCelebrationConfetti();
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: 'Gagal membuat berkas cadangan: ' + err.message,
      });
    }
  };

  // Import JSON backup file
  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setStatusMessage(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const res = await importFullBackupJson(text);
        setIsProcessing(false);

        if (res.success) {
          setStatusMessage({ type: 'success', text: res.message });
          fireCelebrationConfetti();
          // Reload window data
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } else {
          setStatusMessage({ type: 'error', text: res.message });
        }
      } catch (err: any) {
        setIsProcessing(false);
        setStatusMessage({ type: 'error', text: 'Gagal membaca berkas: ' + err.message });
      }
    };
    reader.readAsText(file);
  };

  // Reset to original seed
  const handleResetData = async () => {
    if (confirm('Apakah Anda yakin ingin mengatur ulang data ke kondisi awal demo?')) {
      setIsProcessing(true);
      const res = await resetAllToDefault();
      setIsProcessing(false);
      onDataRestored(res);
      setStatusMessage({
        type: 'success',
        text: 'Data penyimpanan berhasil direset ke kondisi awal.',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-cyan-500/30 bg-slate-900 shadow-2xl">
        {/* Hidden input */}
        <input
          type="file"
          ref={fileInputRef}
          accept=".json"
          onChange={handleFileImport}
          className="hidden"
        />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/70 px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Cadangan & Pemulihan Sistem</h3>
              <p className="text-xs text-slate-400">Amankan dan pulihkan seluruh arsip 5 TB Anda</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup pencadangan dan pemulihan"
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-4">
          {statusMessage && (
            <div
              className={`rounded-2xl p-3.5 flex items-start space-x-3 text-xs ${
                statusMessage.type === 'success'
                  ? 'border border-emerald-500/30 bg-emerald-950/30 text-emerald-300'
                  : 'border border-rose-500/30 bg-rose-950/30 text-rose-300'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
              )}
              <span className="leading-relaxed">{statusMessage.text}</span>
            </div>
          )}

          <div className="space-y-3">
            {/* Action 1: Export Full Backup */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <FileJson className="h-4 w-4 text-cyan-400" />
                  <span className="text-xs font-bold text-white">Unduh Cadangan Lengkap (.json)</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Simpan seluruh snapshot kontak, pesan, daftar aplikasi, dan metadata berkas ke komputer/ponsel.
                </p>
              </div>
              <button
                onClick={handleExportBackup}
                className="ml-3 shrink-0 flex items-center space-x-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 px-3.5 py-2 text-xs font-bold text-slate-950 shadow-md transition-all active:scale-95"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Unduh</span>
              </button>
            </div>

            {/* Action 2: Import Backup */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <Upload className="h-4 w-4 text-blue-400" />
                  <span className="text-xs font-bold text-white">Pulihkan dari Berkas Cadangan</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Pilih berkas JSON cadangan HyperClone yang pernah Anda simpan sebelumnya.
                </p>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="ml-3 shrink-0 flex items-center space-x-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3.5 py-2 text-xs font-semibold text-white transition-all active:scale-95"
              >
                <Upload className="h-3.5 w-3.5" />
                <span>Pulihkan</span>
              </button>
            </div>

            {/* Action 3: Reset to Initial Data */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <RefreshCw className="h-4 w-4 text-amber-400" />
                  <span className="text-xs font-bold text-white">Reset ke Data Awal Demo</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Kembalikan semua daftar berkas contoh, kontak, dan pesan ke pengaturan awal.
                </p>
              </div>
              <button
                onClick={handleResetData}
                disabled={isProcessing}
                className="ml-3 shrink-0 flex items-center space-x-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-3.5 py-2 text-xs font-semibold text-amber-300 transition-all active:scale-95"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          <div className="pt-2 text-right">
            <button
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
