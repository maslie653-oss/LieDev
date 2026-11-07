import React, { useState } from 'react';
import {
  X,
  Trash2,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Zap,
  HardDrive,
} from 'lucide-react';
import { StoredFileItem, formatBytes } from '../utils/storageEngine';
import { fireCelebrationConfetti } from '../utils/confetti';

interface StorageCleanerModalProps {
  isOpen: boolean;
  onClose: () => void;
  files: StoredFileItem[];
  onCleanStorage: (cleanDuplicates: boolean, cleanCache: boolean) => Promise<number>;
}

export const StorageCleanerModal: React.FC<StorageCleanerModalProps> = ({
  isOpen,
  onClose,
  files,
  onCleanStorage,
}) => {
  const [cleanDuplicates, setCleanDuplicates] = useState(true);
  const [cleanCache, setCleanCache] = useState(true);
  const [isCleaning, setIsCleaning] = useState(false);
  const [cleanResult, setCleanResult] = useState<{ bytesReclaimed: number } | null>(null);

  if (!isOpen) return null;

  const duplicates = files.filter((f) => f.isDuplicate);
  const cacheFiles = files.filter((f) => f.isCache || f.name.toLowerCase().includes('cache') || f.name.toLowerCase().includes('.tmp'));

  const duplicateBytes = duplicates.reduce((acc, f) => acc + f.size, 0);
  const cacheBytes = cacheFiles.reduce((acc, f) => acc + f.size, 0);

  let selectedReclaimable = 0;
  if (cleanDuplicates) selectedReclaimable += duplicateBytes;
  if (cleanCache) selectedReclaimable += cacheBytes;

  const handleExecuteClean = async () => {
    setIsCleaning(true);
    const reclaimed = await onCleanStorage(cleanDuplicates, cleanCache);
    setIsCleaning(false);
    setCleanResult({ bytesReclaimed: reclaimed });
    fireCelebrationConfetti();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-amber-500/30 bg-slate-900 shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/70 px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Turbo Cleaner & Optimasi Ruang</h3>
              <p className="text-xs text-slate-400">Bersihkan duplikat kloning dan berkas sampah</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup pembersih ruang"
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {cleanResult ? (
            <div className="py-6 text-center space-y-3">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h4 className="text-xl font-bold text-white">Pembersihan Selesai!</h4>
              <p className="text-xs text-slate-400">
                Berhasil mengosongkan{' '}
                <span className="font-bold text-emerald-400 font-mono">
                  {formatBytes(cleanResult.bytesReclaimed)}
                </span>{' '}
                ruang di penyimpanan 5 TB Anda.
              </p>
              <button
                onClick={onClose}
                className="mt-2 rounded-xl bg-cyan-500 px-5 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-400"
              >
                Selesai
              </button>
            </div>
          ) : (
            <>
              {/* Summary Strip */}
              <div className="rounded-2xl border border-amber-500/20 bg-amber-950/20 p-4 flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase font-semibold text-amber-400">Total Ruang Sampah Ditemukan</div>
                  <div className="text-xl font-extrabold text-white mt-0.5">
                    {formatBytes(duplicateBytes + cacheBytes)}
                  </div>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-300">
                  <HardDrive className="h-5 w-5" />
                </div>
              </div>

              {/* Items checklist */}
              <div className="space-y-3 pt-1">
                {/* Duplicates */}
                <label className="cursor-pointer flex items-start space-x-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-3.5 hover:border-slate-700">
                  <input
                    type="checkbox"
                    checked={cleanDuplicates}
                    onChange={(e) => setCleanDuplicates(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-slate-700 text-amber-500 focus:ring-amber-400"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center space-x-1.5">
                        <Copy className="h-3.5 w-3.5 text-amber-400" />
                        <span>Berkas Duplikat</span>
                      </span>
                      <span className="text-xs font-mono font-semibold text-amber-400">
                        {formatBytes(duplicateBytes)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {duplicates.length} berkas salinan ganda dari migrasi ponsel lama.
                    </p>
                  </div>
                </label>

                {/* Cache files */}
                <label className="cursor-pointer flex items-start space-x-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-3.5 hover:border-slate-700">
                  <input
                    type="checkbox"
                    checked={cleanCache}
                    onChange={(e) => setCleanCache(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-slate-700 text-amber-500 focus:ring-amber-400"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center space-x-1.5">
                        <Trash2 className="h-3.5 w-3.5 text-rose-400" />
                        <span>Cache & Berkas Sementara</span>
                      </span>
                      <span className="text-xs font-mono font-semibold text-rose-400">
                        {formatBytes(cacheBytes)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {cacheFiles.length} berkas cache thumbnail dan residu transfer yang aman dihapus.
                    </p>
                  </div>
                </label>
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Batal
                </button>
                <button
                  onClick={handleExecuteClean}
                  disabled={selectedReclaimable === 0 || isCleaning}
                  aria-label="Bersihkan ruang sekarang"
                  className="flex items-center space-x-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
                >
                  <Zap className="h-4 w-4" />
                  <span>
                    {isCleaning ? 'Membersihkan...' : `Bersihkan ${formatBytes(selectedReclaimable)}`}
                  </span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
