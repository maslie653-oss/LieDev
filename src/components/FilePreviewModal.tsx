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
} from 'lucide-react';
import { StoredFileItem, formatBytes } from '../utils/storageEngine';

interface FilePreviewModalProps {
  file: StoredFileItem | null;
  onClose: () => void;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({ file, onClose }) => {
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
              ) : file.category === 'apps' ? (
                <Layers className="h-5 w-5" />
              ) : (
                <FileText className="h-5 w-5" />
              )}
            </div>
            <div className="overflow-hidden">
              <h3 className="text-sm font-bold text-white truncate">{file.name}</h3>
              <p className="text-xs text-slate-400 font-mono">
                {formatBytes(file.size)} • {file.type || 'Berkas Terarsip'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
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
                src={file.blobData || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'}
                controls
                playsInline
                className="max-h-[380px] w-full object-contain"
              />
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
                src={file.blobData || 'https://actions.google.com/sounds/v1/ambient/rain_heavy.ogg'}
              >
                Browser Anda tidak mendukung tag audio.
              </audio>
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
