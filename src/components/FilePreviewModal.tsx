import React from 'react';
import {
  X,
  Download,
  Calendar,
  HardDrive,
  FileText,
  Music,
  Film,
  Image as ImageIcon,
  Layers,
  Sparkles,
  Gamepad2,
  Play,
  Lock,
  Unlock,
} from 'lucide-react';
import { StoredFileItem, formatBytes, resolveVideoPlaybackUrl, resolveAudioPlaybackUrl } from '../utils/storageEngine';
import { GameKey } from './GamePlayerModal';

interface FilePreviewModalProps {
  file: StoredFileItem | null;
  onClose: () => void;
  onPlayGame?: (gameTitle: string, gameKey?: GameKey) => void;
  onToggleHideFile?: (id: string, isHidden: boolean) => void;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  file,
  onClose,
  onPlayGame,
  onToggleHideFile,
}) => {
  if (!file) return null;

  const handleDownload = () => {
    if (file.blobData) {
      const link = document.createElement('a');
      link.href = file.blobData;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } else {
      const blob = new Blob([`Simulasi konten berkas cadangan HP untuk ${file.name}`], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    }
  };

  const isApkOrGame = file.category === 'apps' || file.name.endsWith('.apk') || file.isGame;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/70 px-6 py-4">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">
              {file.category === 'photos' ? (
                <ImageIcon className="h-5 w-5" />
              ) : file.category === 'videos' ? (
                <Film className="h-5 w-5" />
              ) : file.category === 'audio' ? (
                <Music className="h-5 w-5" />
              ) : isApkOrGame ? (
                <Gamepad2 className="h-5 w-5 text-emerald-400" />
              ) : (
                <FileText className="h-5 w-5" />
              )}
            </div>
            <div className="overflow-hidden">
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-white truncate">{file.name}</h3>
                {file.isHidden && (
                  <span className="rounded-full bg-purple-500/20 border border-purple-500/40 px-2 py-0.5 text-[9px] font-bold text-purple-300">
                    Tersembunyi
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-mono">
                {formatBytes(file.size)} • {file.type || 'Berkas Terarsip'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {onToggleHideFile && (
              <button
                onClick={() => onToggleHideFile(file.id, !file.isHidden)}
                title={file.isHidden ? 'Keluarkan dari Brankas Rahasia' : 'Sembunyikan ke Brankas Rahasia'}
                className={`rounded-xl p-2 text-xs font-semibold transition-all ${
                  file.isHidden
                    ? 'bg-purple-900/40 text-purple-300 border border-purple-500/40'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-purple-300'
                }`}
              >
                {file.isHidden ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
              </button>
            )}
            <button
              onClick={handleDownload}
              title="Unduh Berkas"
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-cyan-300 transition-colors"
            >
              <Download className="h-5 w-5" />
            </button>
            <button
              onClick={onClose}
              aria-label="Tutup pratinjau"
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Media Preview Box */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {file.category === 'photos' && file.blobData ? (
            <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 flex items-center justify-center max-h-[400px]">
              <img
                src={file.blobData}
                alt={file.name}
                className="max-h-[380px] w-auto object-contain rounded-xl"
              />
            </div>
          ) : file.category === 'videos' ? (
            <div className="overflow-hidden rounded-2xl border border-purple-500/30 bg-black flex flex-col items-center justify-center">
              <video
                src={resolveVideoPlaybackUrl(file)}
                controls
                playsInline
                className="max-h-[380px] w-full object-contain"
              >
                Browser Anda tidak mendukung tag video.
              </video>
            </div>
          ) : file.category === 'audio' ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-6 text-center space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400">
                <Music className="h-8 w-8 animate-pulse" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">{file.name}</h4>
                <p className="text-xs text-slate-400 mt-1">Pemutar Audio HyperSound Hi-Res</p>
              </div>
              <audio
                controls
                className="w-full mt-2"
                src={resolveAudioPlaybackUrl(file)}
              >
                Browser Anda tidak mendukung tag audio.
              </audio>
            </div>
          ) : isApkOrGame ? (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-6 text-center space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 text-slate-950 shadow-lg">
                <Gamepad2 className="h-8 w-8" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">{file.name}</h4>
                <p className="text-xs text-emerald-300 mt-1">
                  Paket APK Game / Aplikasi Terpasang — Siap Dimainkan Langsung
                </p>
              </div>

              {onPlayGame && (
                <button
                  onClick={() => {
                    onClose();
                    onPlayGame(file.name, file.gameType || 'space_shooter');
                  }}
                  className="inline-flex items-center space-x-2 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 px-6 py-3 text-xs font-bold text-slate-950 shadow-lg shadow-emerald-500/25 hover:brightness-110 active:scale-95 transition-all"
                >
                  <Play className="h-4 w-4 fill-current" />
                  <span>Mainkan Game Ini Sekarang (Emulator 60 FPS)</span>
                </button>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-8 text-center space-y-3">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800 text-slate-400">
                <FileText className="h-8 w-8" />
              </div>
              <h4 className="text-sm font-bold text-white">{file.name}</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Berkas ini disimpan dan dilindungi secara aman di dalam brankas 5 TB Anda dengan enkripsi end-to-end.
              </p>
            </div>
          )}

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
              <div className="text-[10px] uppercase text-slate-500 font-semibold">Ukuran Berkas</div>
              <div className="text-xs font-bold text-white mt-0.5 font-mono">{formatBytes(file.size)}</div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
              <div className="text-[10px] uppercase text-slate-500 font-semibold">Tanggal Pembuatan</div>
              <div className="text-xs font-bold text-white mt-0.5">
                {new Date(file.createdAt).toLocaleString('id-ID')}
              </div>
            </div>

            {file.meta &&
              Object.entries(file.meta).map(([key, val]) => (
                <div key={key} className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                  <div className="text-[10px] uppercase text-slate-500 font-semibold capitalize">
                    {key.replace(/([A-Z])/g, ' $1')}
                  </div>
                  <div className="text-xs font-bold text-cyan-300 mt-0.5 truncate">{String(val)}</div>
                </div>
              ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-800 bg-slate-950/70 px-6 py-3 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 flex items-center space-x-1">
            <Sparkles className="h-3 w-3 text-cyan-400" />
            <span>Tersimpan di Brankas HyperClone 5 TB</span>
          </span>
          <button
            onClick={onClose}
            className="rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-2 text-xs font-semibold text-white transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
