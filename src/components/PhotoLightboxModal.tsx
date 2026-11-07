import React, { useState, useEffect } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  Info,
  Heart,
  Play,
  Pause,
  Maximize2,
  Minimize2,
  Calendar,
  Camera,
  HardDrive,
} from 'lucide-react';
import { StoredFileItem, formatBytes } from '../utils/storageEngine';

interface PhotoLightboxModalProps {
  photos: StoredFileItem[];
  currentPhotoIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (index: number) => void;
  onToggleFavorite?: (id: string) => void;
}

export const PhotoLightboxModal: React.FC<PhotoLightboxModalProps> = ({
  photos,
  currentPhotoIndex,
  isOpen,
  onClose,
  onNavigate,
  onToggleFavorite,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [showInfo, setShowInfo] = useState<boolean>(false);
  const [isSlideshow, setIsSlideshow] = useState<boolean>(false);

  const currentPhoto = photos[currentPhotoIndex];

  // Reset zoom & rotation when photo changes
  useEffect(() => {
    setZoomLevel(1);
    setRotation(0);
  }, [currentPhotoIndex]);

  // Slideshow timer
  useEffect(() => {
    if (!isOpen || !isSlideshow || photos.length <= 1) return;
    const timer = setInterval(() => {
      onNavigate((currentPhotoIndex + 1) % photos.length);
    }, 3200);
    return () => clearInterval(timer);
  }, [isOpen, isSlideshow, currentPhotoIndex, photos.length, onNavigate]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight' && photos.length > 1) {
        onNavigate((currentPhotoIndex + 1) % photos.length);
      } else if (e.key === 'ArrowLeft' && photos.length > 1) {
        onNavigate((currentPhotoIndex - 1 + photos.length) % photos.length);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentPhotoIndex, photos.length, onClose, onNavigate]);

  if (!isOpen || !currentPhoto) return null;

  const handleDownload = () => {
    if (currentPhoto.blobData) {
      const link = document.createElement('a');
      link.href = currentPhoto.blobData;
      link.download = currentPhoto.name;
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/95 backdrop-blur-xl animate-fadeIn select-none">
      {/* Top Lightbox Navigation Bar */}
      <div className="flex items-center justify-between border-b border-slate-800/80 bg-slate-950/80 px-4 py-3 sm:px-6">
        <div className="flex items-center space-x-3 overflow-hidden">
          <span className="rounded-full bg-cyan-500/20 px-2.5 py-0.5 text-xs font-mono font-bold text-cyan-300">
            {currentPhotoIndex + 1} / {photos.length}
          </span>
          <h3 className="text-xs sm:text-sm font-bold text-white truncate max-w-xs sm:max-w-md">
            {currentPhoto.name}
          </h3>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center space-x-1 sm:space-x-2">
          {/* Slideshow button */}
          <button
            onClick={() => setIsSlideshow(!isSlideshow)}
            title={isSlideshow ? 'Hentikan Salindia (Slideshow)' : 'Mulai Salindia (Slideshow)'}
            className={`flex items-center space-x-1.5 rounded-xl px-2.5 py-1.5 text-xs font-semibold transition-all ${
              isSlideshow
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                : 'text-slate-300 hover:bg-slate-850 hover:text-white'
            }`}
          >
            {isSlideshow ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{isSlideshow ? 'Jeda' : 'Salindia'}</span>
          </button>

          {/* Zoom In */}
          <button
            onClick={() => setZoomLevel((z) => Math.min(3, z + 0.25))}
            title="Perbesar (Zoom In)"
            className="rounded-xl p-2 text-slate-300 hover:bg-slate-850 hover:text-white"
          >
            <ZoomIn className="h-4 w-4" />
          </button>

          {/* Zoom Out */}
          <button
            onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.25))}
            title="Perkecil (Zoom Out)"
            className="rounded-xl p-2 text-slate-300 hover:bg-slate-850 hover:text-white"
          >
            <ZoomOut className="h-4 w-4" />
          </button>

          {/* Rotate */}
          <button
            onClick={() => setRotation((r) => (r + 90) % 360)}
            title="Putar 90 Derajat"
            className="rounded-xl p-2 text-slate-300 hover:bg-slate-850 hover:text-white"
          >
            <RotateCw className="h-4 w-4" />
          </button>

          {/* EXIF Info Drawer Toggle */}
          <button
            onClick={() => setShowInfo(!showInfo)}
            title="Detail Foto & EXIF"
            className={`rounded-xl p-2 transition-colors ${
              showInfo ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-300 hover:bg-slate-850 hover:text-white'
            }`}
          >
            <Info className="h-4 w-4" />
          </button>

          {/* Download */}
          <button
            onClick={handleDownload}
            title="Unduh Foto Resolusi Penuh"
            className="rounded-xl p-2 text-slate-300 hover:bg-slate-850 hover:text-cyan-300"
          >
            <Download className="h-4 w-4" />
          </button>

          {/* Close */}
          <button
            onClick={onClose}
            aria-label="Tutup penampil foto"
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Main Image Viewport */}
      <div className="relative flex-1 flex items-center justify-center p-4 overflow-hidden">
        {/* Previous Navigation Button */}
        {photos.length > 1 && (
          <button
            onClick={() => onNavigate((currentPhotoIndex - 1 + photos.length) % photos.length)}
            aria-label="Foto Sebelumnya"
            className="absolute left-4 z-20 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900/80 text-white shadow-xl backdrop-blur-md border border-slate-700/60 hover:bg-cyan-500 hover:text-slate-950 transition-all active:scale-95"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}

        {/* The Photo Container with Smooth Transform */}
        <div className="relative flex items-center justify-center max-h-[82vh] max-w-[88vw] overflow-hidden transition-all duration-300">
          <img
            src={currentPhoto.blobData || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1600'}
            alt={currentPhoto.name}
            style={{
              transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
              transition: 'transform 0.25s ease-out',
            }}
            className="max-h-[80vh] max-w-[85vw] object-contain rounded-2xl shadow-2xl ring-1 ring-white/10"
          />
        </div>

        {/* Next Navigation Button */}
        {photos.length > 1 && (
          <button
            onClick={() => onNavigate((currentPhotoIndex + 1) % photos.length)}
            aria-label="Foto Berikutnya"
            className="absolute right-4 z-20 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900/80 text-white shadow-xl backdrop-blur-md border border-slate-700/60 hover:bg-cyan-500 hover:text-slate-950 transition-all active:scale-95"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}

        {/* Info Overlay Panel */}
        {showInfo && (
          <div className="absolute right-6 top-6 z-30 w-80 rounded-3xl border border-slate-700/80 bg-slate-900/95 p-5 shadow-2xl backdrop-blur-md space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Detail Metadata Foto</h4>
              <button
                onClick={() => setShowInfo(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-[10px] uppercase text-slate-500 font-semibold block">Nama Berkas</span>
                <span className="font-semibold text-white truncate block">{currentPhoto.name}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-2.5">
                  <span className="text-[10px] uppercase text-slate-500 font-semibold block">Ukuran</span>
                  <span className="font-mono font-bold text-cyan-400">{formatBytes(currentPhoto.size)}</span>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-2.5">
                  <span className="text-[10px] uppercase text-slate-500 font-semibold block">Resolusi</span>
                  <span className="font-bold text-white">{currentPhoto.meta?.resolution || '4K Ultra-HD'}</span>
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-2.5 space-y-1">
                <div className="flex items-center space-x-1.5 text-slate-400">
                  <Camera className="h-3.5 w-3.5 text-cyan-400" />
                  <span className="text-[11px] font-semibold text-slate-200">{currentPhoto.meta?.camera || 'HyperLens 200MP'}</span>
                </div>
                {currentPhoto.meta?.iso && (
                  <div className="text-[10px] text-slate-400 font-mono">
                    ISO {currentPhoto.meta.iso} • f/1.7 • 1/250s
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-2.5 flex items-center justify-between">
                <div className="flex items-center space-x-1.5 text-slate-400">
                  <Calendar className="h-3.5 w-3.5 text-slate-500" />
                  <span className="text-[11px]">{new Date(currentPhoto.createdAt).toLocaleDateString('id-ID')}</span>
                </div>
                <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-[9px] font-bold text-cyan-300">
                  {currentPhoto.meta?.album || 'Kamera'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Thumbnail Strip */}
      {photos.length > 1 && (
        <div className="border-t border-slate-800/80 bg-slate-950/80 px-4 py-2.5 flex items-center justify-center space-x-2 overflow-x-auto scrollbar-none">
          {photos.map((p, idx) => (
            <button
              key={p.id}
              onClick={() => onNavigate(idx)}
              className={`relative h-12 w-12 shrink-0 rounded-xl overflow-hidden border-2 transition-all ${
                idx === currentPhotoIndex
                  ? 'border-cyan-400 scale-105 shadow-md shadow-cyan-500/30'
                  : 'border-slate-800 opacity-50 hover:opacity-100'
              }`}
            >
              <img
                src={p.blobData}
                alt={p.name}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
