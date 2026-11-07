import React from 'react';
import {
  HardDrive,
  Image as ImageIcon,
  Film,
  Music,
  FileText,
  Layers,
  Sparkles,
  ShieldCheck,
  Zap,
  ArrowUpRight,
  Database,
  CheckCircle2,
} from 'lucide-react';
import { StorageCategoryBreakdown, formatBytes } from '../utils/storageEngine';

interface StorageOverviewProps {
  breakdown: StorageCategoryBreakdown[];
  totalBytes: number;
  usedBytes: number;
  availableBytes: number;
  reclaimableBytes: number;
  onSelectCategory: (cat: string) => void;
  onOpenCleaner: () => void;
  onOpenCloneWizard: () => void;
  onTriggerUpload: () => void;
}

export const StorageOverview: React.FC<StorageOverviewProps> = ({
  breakdown,
  totalBytes,
  usedBytes,
  availableBytes,
  reclaimableBytes,
  onSelectCategory,
  onOpenCleaner,
  onOpenCloneWizard,
  onTriggerUpload,
}) => {
  const usedPercentage = Number(((usedBytes / totalBytes) * 100).toFixed(2));
  const availablePercentage = Number(((availableBytes / totalBytes) * 100).toFixed(2));

  // Find category specific details
  const photos = breakdown.find((b) => b.category === 'photos');
  const videos = breakdown.find((b) => b.category === 'videos');
  const audio = breakdown.find((b) => b.category === 'audio');
  const documents = breakdown.find((b) => b.category === 'documents');
  const apps = breakdown.find((b) => b.category === 'apps');
  const system = breakdown.find((b) => b.category === 'system');

  return (
    <div className="relative overflow-hidden rounded-3xl border border-cyan-500/20 bg-gradient-to-b from-slate-900/95 via-slate-900/80 to-slate-950/90 p-5 sm:p-7 shadow-2xl backdrop-blur-xl">
      {/* Decorative ambient background glows */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -left-20 -bottom-20 h-72 w-72 rounded-full bg-blue-600/10 blur-3xl" />

      {/* Main headline banner */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 pb-6 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center space-x-2 rounded-full border border-cyan-500/30 bg-cyan-950/40 px-3 py-1 text-xs font-semibold text-cyan-300 mb-3">
            <Database className="h-3.5 w-3.5 text-cyan-400" />
            <span>Penyimpanan Raksasa Multi-Tier Terpasang</span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center flex-wrap gap-2">
            <span>Kapasitas Penyimpanan</span>
            <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500 bg-clip-text text-transparent">
              5.0 TB (5,120 GB)
            </span>
          </h2>
          <p className="mt-1.5 text-sm text-slate-400 max-w-2xl leading-relaxed">
            Didukung arsitektur UFS 4.0 NVMe lokal dipadukan brankas sinkronisasi cloud pribadi berkecepatan tinggi. Bebas simpan ribuan video 4K, foto resolusi tinggi, cadangan aplikasi, dan kloning HP lengkap tanpa khawatir kehabisan ruang.
          </p>
        </div>

        {/* Quick CTA Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onTriggerUpload}
            aria-label="Unggah Berkas Baru ke Penyimpanan 5 TB"
            className="flex items-center space-x-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 px-4 py-2.5 text-xs font-semibold text-white shadow-md transition-all active:scale-95"
          >
            <ArrowUpRight className="h-4 w-4 text-cyan-400" />
            <span>Unggah Berkas</span>
          </button>

          {reclaimableBytes > 0 && (
            <button
              onClick={onOpenCleaner}
              aria-label="Optimasi dan Bersihkan Ruang Sampah"
              className="flex items-center space-x-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-4 py-2.5 text-xs font-semibold text-amber-300 shadow-md transition-all active:scale-95"
            >
              <Sparkles className="h-4 w-4 text-amber-400" />
              <span>Bersihkan {formatBytes(reclaimableBytes)}</span>
            </button>
          )}

          <button
            onClick={onOpenCloneWizard}
            aria-label="Mulai Kloning Ponsel Sekarang"
            className="flex items-center space-x-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-cyan-500/25 transition-all active:scale-95"
          >
            <Zap className="h-4 w-4" />
            <span>Kloning Data Ponsel</span>
          </button>
        </div>
      </div>

      {/* Storage Gauge Section */}
      <div className="py-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-3">
          <div>
            <div className="text-xs uppercase tracking-wider text-slate-400 font-medium">Status Penggunaan Storage</div>
            <div className="flex items-baseline space-x-2 mt-0.5">
              <span className="text-3xl font-extrabold text-white tracking-tight">{formatBytes(usedBytes, 2)}</span>
              <span className="text-sm font-medium text-slate-400">terpakai dari {formatBytes(totalBytes, 0)} ({usedPercentage}%)</span>
            </div>
          </div>
          <div className="text-right sm:text-right">
            <div className="text-xs uppercase tracking-wider text-emerald-400/90 font-medium flex items-center justify-start sm:justify-end">
              <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-400" />
              Ruang Super Luas Tersedia
            </div>
            <div className="text-xl font-bold text-emerald-400 mt-0.5">
              {formatBytes(availableBytes, 2)} ({availablePercentage}%)
            </div>
          </div>
        </div>

        {/* Visual Multi-Segment Storage Progress Bar */}
        <div className="relative h-5 w-full overflow-hidden rounded-full bg-slate-800/80 p-0.5 shadow-inner ring-1 ring-slate-700/50">
          <div className="flex h-full w-full rounded-full overflow-hidden">
            {breakdown
              .filter((b) => b.category !== 'free' && b.percentage > 0)
              .map((segment) => (
                <div
                  key={segment.category}
                  style={{
                    width: `${Math.max(1, segment.percentage)}%`,
                    backgroundColor: segment.color,
                  }}
                  className="h-full transition-all duration-700 relative group cursor-pointer hover:brightness-125"
                  title={`${segment.label}: ${segment.formattedSize} (${segment.percentage}%)`}
                />
              ))}
            {/* Free space representation */}
            <div
              style={{ width: `${Math.max(0, availablePercentage)}%` }}
              className="h-full bg-slate-800/90 hover:bg-slate-750 transition-all"
              title={`Ruang Bebas: ${formatBytes(availableBytes, 2)} (${availablePercentage}%)`}
            />
          </div>
        </div>

        {/* Legend pills below bar */}
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
          {breakdown.map((item) => (
            <button
              key={item.category}
              onClick={() => onSelectCategory(item.category)}
              aria-label={`Pilih kategori ${item.label}`}
              className="flex items-center space-x-2 text-slate-300 hover:text-white transition-colors cursor-pointer group"
            >
              <span
                className="h-2.5 w-2.5 rounded-full ring-1 ring-white/20 group-hover:scale-125 transition-transform"
                style={{ backgroundColor: item.color }}
              />
              <span className="font-medium">{item.label}:</span>
              <span className="font-semibold text-slate-200">{item.formattedSize}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Category Grid Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 pt-2">
        {/* Foto */}
        <div
          onClick={() => onSelectCategory('photos')}
          className="cursor-pointer group relative rounded-2xl border border-cyan-500/20 bg-slate-850/60 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-cyan-400 hover:bg-slate-800/80 hover:shadow-lg hover:shadow-cyan-500/10"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 group-hover:scale-110 transition-transform">
            <ImageIcon className="h-5 w-5" />
          </div>
          <div className="mt-3">
            <div className="text-xs font-semibold text-slate-300 group-hover:text-white">Foto & Galeri</div>
            <div className="text-base font-bold text-white mt-0.5">{photos?.formattedSize || '0 B'}</div>
            <div className="text-[11px] text-cyan-400/80">{photos?.itemCount || 0} berkas</div>
          </div>
        </div>

        {/* Video */}
        <div
          onClick={() => onSelectCategory('videos')}
          className="cursor-pointer group relative rounded-2xl border border-purple-500/20 bg-slate-850/60 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-purple-400 hover:bg-slate-800/80 hover:shadow-lg hover:shadow-purple-500/10"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 group-hover:scale-110 transition-transform">
            <Film className="h-5 w-5" />
          </div>
          <div className="mt-3">
            <div className="text-xs font-semibold text-slate-300 group-hover:text-white">Video 4K / HD</div>
            <div className="text-base font-bold text-white mt-0.5">{videos?.formattedSize || '0 B'}</div>
            <div className="text-[11px] text-purple-400/80">{videos?.itemCount || 0} video</div>
          </div>
        </div>

        {/* Audio */}
        <div
          onClick={() => onSelectCategory('audio')}
          className="cursor-pointer group relative rounded-2xl border border-amber-500/20 bg-slate-850/60 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-400 hover:bg-slate-800/80 hover:shadow-lg hover:shadow-amber-500/10"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 group-hover:scale-110 transition-transform">
            <Music className="h-5 w-5" />
          </div>
          <div className="mt-3">
            <div className="text-xs font-semibold text-slate-300 group-hover:text-white">Musik & Audio</div>
            <div className="text-base font-bold text-white mt-0.5">{audio?.formattedSize || '0 B'}</div>
            <div className="text-[11px] text-amber-400/80">{audio?.itemCount || 0} trek</div>
          </div>
        </div>

        {/* Dokumen */}
        <div
          onClick={() => onSelectCategory('documents')}
          className="cursor-pointer group relative rounded-2xl border border-emerald-500/20 bg-slate-850/60 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-400 hover:bg-slate-800/80 hover:shadow-lg hover:shadow-emerald-500/10"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
            <FileText className="h-5 w-5" />
          </div>
          <div className="mt-3">
            <div className="text-xs font-semibold text-slate-300 group-hover:text-white">Dokumen Kerja</div>
            <div className="text-base font-bold text-white mt-0.5">{documents?.formattedSize || '0 B'}</div>
            <div className="text-[11px] text-emerald-400/80">{documents?.itemCount || 0} dokumen</div>
          </div>
        </div>

        {/* Aplikasi */}
        <div
          onClick={() => onSelectCategory('apps')}
          className="cursor-pointer group relative rounded-2xl border border-rose-500/20 bg-slate-850/60 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-rose-400 hover:bg-slate-800/80 hover:shadow-lg hover:shadow-rose-500/10"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400 group-hover:scale-110 transition-transform">
            <Layers className="h-5 w-5" />
          </div>
          <div className="mt-3">
            <div className="text-xs font-semibold text-slate-300 group-hover:text-white">Aplikasi & Data</div>
            <div className="text-base font-bold text-white mt-0.5">{apps?.formattedSize || '0 B'}</div>
            <div className="text-[11px] text-rose-400/80">{apps?.itemCount || 0} aplikasi</div>
          </div>
        </div>

        {/* Sistem & Cadangan */}
        <div
          onClick={() => onSelectCategory('system')}
          className="cursor-pointer group relative rounded-2xl border border-slate-700/40 bg-slate-850/60 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-500 hover:bg-slate-800/80 hover:shadow-lg hover:shadow-slate-500/10"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-500/10 text-slate-400 group-hover:scale-110 transition-transform">
            <HardDrive className="h-5 w-5" />
          </div>
          <div className="mt-3">
            <div className="text-xs font-semibold text-slate-300 group-hover:text-white">Sistem & OS</div>
            <div className="text-base font-bold text-white mt-0.5">{system?.formattedSize || '0 B'}</div>
            <div className="text-[11px] text-slate-400">Firmware Core</div>
          </div>
        </div>
      </div>

      {/* Enterprise Specs Footer */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-800/80 bg-slate-950/60 px-4 py-2.5 text-xs text-slate-400">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <span>Brankas Terenkripsi: AES-256 Bit GCM dengan Enkripsi Kunci Perangkat</span>
        </div>
        <div className="flex items-center space-x-4">
          <span>Kecepatan Baca: 7,500 MB/s</span>
          <span>•</span>
          <span>Kecepatan Tulis: 6,800 MB/s</span>
          <span>•</span>
          <span className="text-emerald-400 font-semibold">Kesehatan Storage: 100% Optimal</span>
        </div>
      </div>
    </div>
  );
};
