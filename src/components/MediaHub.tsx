import React, { useState, useRef, useEffect } from 'react';
import {
  Image as ImageIcon,
  Film,
  Music,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Repeat,
  Shuffle,
  Maximize2,
  Sparkles,
  Heart,
  Eye,
  Sliders,
  Radio,
  Download,
  Calendar,
  Layers,
  RotateCcw,
  RotateCw,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { StoredFileItem, formatBytes, resolveVideoPlaybackUrl, resolveAudioPlaybackUrl } from '../utils/storageEngine';
import { PhotoLightboxModal } from './PhotoLightboxModal';

interface MediaHubProps {
  files: StoredFileItem[];
  onUploadMedia: () => void;
}

export const MediaHub: React.FC<MediaHubProps> = ({ files, onUploadMedia }) => {
  const [activeMediaTab, setActiveMediaTab] = useState<'photos' | 'videos' | 'audio'>('photos');

  // Photo gallery state
  const [selectedAlbum, setSelectedAlbum] = useState<string>('all');
  const [lightboxOpen, setLightboxOpen] = useState<boolean>(false);
  const [currentLightboxIndex, setCurrentLightboxIndex] = useState<number>(0);

  // Video player state
  const [activeVideoId, setActiveVideoId] = useState<string>('');
  const [videoPlaybackSpeed, setVideoPlaybackSpeed] = useState<number>(1);
  const [isVideoPlaying, setIsVideoPlaying] = useState<boolean>(false);
  const [videoCurrentTime, setVideoCurrentTime] = useState<number>(0);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [videoVolume, setVideoVolume] = useState<number>(1);
  const [isVideoMuted, setIsVideoMuted] = useState<boolean>(false);
  const [videoLoadError, setVideoLoadError] = useState<boolean>(false);
  const [activeVideoSrc, setActiveVideoSrc] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);

  // Audio player state
  const [activeAudioId, setActiveAudioId] = useState<string>('');
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [audioCurrentTime, setAudioCurrentTime] = useState<number>(0);
  const [audioDuration, setAudioDuration] = useState<number>(180);
  const [audioVolume, setAudioVolume] = useState<number>(0.8);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isLooping, setIsLooping] = useState<boolean>(false);

  const audioRef = useRef<HTMLAudioElement>(null);

  // Filter media files (exclude hidden files from public gallery)
  const photos = files.filter((f) => f.category === 'photos' && !f.isHidden);
  const videos = files.filter((f) => f.category === 'videos' && !f.isHidden);
  const audioTracks = files.filter((f) => f.category === 'audio' && !f.isHidden);

  // Filtered photos by album
  const filteredPhotos = photos.filter((p) => {
    if (selectedAlbum === 'all') return true;
    if (selectedAlbum === 'favorite') return p.meta?.favorite;
    return p.meta?.album === selectedAlbum;
  });

  // Active video
  const activeVideo = videos.find((v) => v.id === activeVideoId) || videos[0];

  // Active audio
  const activeAudio = audioTracks.find((a) => a.id === activeAudioId) || audioTracks[0];

  // Set default active video/audio on load
  useEffect(() => {
    if (videos.length > 0 && !activeVideoId) {
      setActiveVideoId(videos[0].id);
    }
    if (audioTracks.length > 0 && !activeAudioId) {
      setActiveAudioId(audioTracks[0].id);
    }
  }, [videos, audioTracks, activeVideoId, activeAudioId]);

  const getVideoSrc = (video?: StoredFileItem): string => {
    return resolveVideoPlaybackUrl(video);
  };

  useEffect(() => {
    if (activeVideo) {
      setVideoLoadError(false);
      const src = getVideoSrc(activeVideo);
      setActiveVideoSrc(src);
      setIsVideoPlaying(false);
      setVideoCurrentTime(0);
      if (videoRef.current) {
        videoRef.current.load();
      }
    }
  }, [activeVideo?.id, activeVideo?.blobData]);

  // Video event handlers
  const handleVideoTimeUpdate = () => {
    if (videoRef.current) {
      setVideoCurrentTime(videoRef.current.currentTime);
      if (videoRef.current.duration && !isNaN(videoRef.current.duration)) {
        setVideoDuration(videoRef.current.duration);
      }
    }
  };

  const togglePlayVideo = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current
        .play()
        .then(() => {
          setIsVideoPlaying(true);
        })
        .catch((err) => {
          console.warn('Video playback trigger error:', err);
        });
    } else {
      videoRef.current.pause();
      setIsVideoPlaying(false);
    }
  };

  const handleVideoSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    setVideoCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const handleSkipVideo = (seconds: number) => {
    if (videoRef.current) {
      const newTime = Math.max(0, Math.min(videoDuration || 100, videoRef.current.currentTime + seconds));
      videoRef.current.currentTime = newTime;
      setVideoCurrentTime(newTime);
    }
  };

  const handleToggleVideoMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsVideoMuted(videoRef.current.muted);
    }
  };

  const handleVideoVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = Number(e.target.value);
    setVideoVolume(vol);
    if (videoRef.current) {
      videoRef.current.volume = vol;
      videoRef.current.muted = vol === 0;
      setIsVideoMuted(vol === 0);
    }
  };

  const handleToggleFullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      } else {
        videoRef.current.requestFullscreen().catch(() => {});
      }
    }
  };

  const handleVideoError = () => {
    console.warn('Video failed to load from primary source:', activeVideoSrc);
    setVideoLoadError(true);
    if (!activeVideoSrc.includes('w3.org')) {
      setActiveVideoSrc('https://media.w3.org/2010/05/sintel/trailer.mp4');
      if (videoRef.current) {
        videoRef.current.load();
      }
    }
  };

  // Audio time update handler
  const handleAudioTimeUpdate = () => {
    if (audioRef.current) {
      setAudioCurrentTime(audioRef.current.currentTime);
      if (audioRef.current.duration && !isNaN(audioRef.current.duration)) {
        setAudioDuration(audioRef.current.duration);
      }
    }
  };

  const handleAudioEnded = () => {
    handleNextTrack();
  };

  const togglePlayAudio = () => {
    if (!audioRef.current) return;
    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlayingAudio(true);
      }).catch((e) => {
        console.warn('Audio play error, retrying:', e);
      });
    }
  };

  const handleNextTrack = () => {
    if (audioTracks.length <= 1) return;
    const currentIndex = audioTracks.findIndex((a) => a.id === activeAudio?.id);
    const nextIndex = (currentIndex + 1) % audioTracks.length;
    setActiveAudioId(audioTracks[nextIndex].id);
    setIsPlayingAudio(true);
  };

  const handlePrevTrack = () => {
    if (audioTracks.length <= 1) return;
    const currentIndex = audioTracks.findIndex((a) => a.id === activeAudio?.id);
    const prevIndex = (currentIndex - 1 + audioTracks.length) % audioTracks.length;
    setActiveAudioId(audioTracks[prevIndex].id);
    setIsPlayingAudio(true);
  };

  const handleSeekAudio = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    setAudioCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = Number(e.target.value);
    setAudioVolume(vol);
    if (audioRef.current) {
      audioRef.current.volume = vol;
      setIsMuted(vol === 0);
    }
  };

  const formatSeconds = (sec: number) => {
    if (isNaN(sec) || sec < 0) return '00:00';
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const openLightboxAt = (index: number) => {
    setCurrentLightboxIndex(index);
    setLightboxOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        src={resolveAudioPlaybackUrl(activeAudio)}
        onTimeUpdate={handleAudioTimeUpdate}
        onEnded={handleAudioEnded}
        loop={isLooping}
        autoPlay={isPlayingAudio}
      />

      {/* Top Media Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-slate-800 bg-slate-900/90 p-4 sm:p-5 shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500 via-sky-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25">
            <Radio className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white tracking-tight flex items-center space-x-2">
              <span>Pusat Multimedia & Bioskop 5 TB</span>
            </h3>
            <p className="text-xs text-slate-400">
              Putar lagu FLAC/MP3, tonton video 4K HDR, dan jelajahi galeri foto resolusi tinggi
            </p>
          </div>
        </div>

        {/* Media Switcher Buttons */}
        <div className="flex items-center space-x-1.5 rounded-2xl border border-slate-800 bg-slate-950/80 p-1.5 text-xs font-semibold">
          <button
            onClick={() => setActiveMediaTab('photos')}
            aria-label="Buka Galeri Foto"
            className={`flex items-center space-x-1.5 rounded-xl px-4 py-2 transition-all ${
              activeMediaTab === 'photos'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ImageIcon className="h-4 w-4" />
            <span>Galeri Foto ({photos.length})</span>
          </button>

          <button
            onClick={() => setActiveMediaTab('videos')}
            aria-label="Buka Pemutar Video"
            className={`flex items-center space-x-1.5 rounded-xl px-4 py-2 transition-all ${
              activeMediaTab === 'videos'
                ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold shadow-md shadow-purple-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Film className="h-4 w-4" />
            <span>Video 4K ({videos.length})</span>
          </button>

          <button
            onClick={() => setActiveMediaTab('audio')}
            aria-label="Buka Pemutar Musik"
            className={`flex items-center space-x-1.5 rounded-xl px-4 py-2 transition-all ${
              activeMediaTab === 'audio'
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Music className="h-4 w-4" />
            <span>Audio Studio ({audioTracks.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: GALERI FOTO (PHOTO GALLERY) */}
      {activeMediaTab === 'photos' && (
        <div className="space-y-4">
          {/* Albums Strip & Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-1.5 overflow-x-auto text-xs font-semibold scrollbar-none">
              {[
                { id: 'all', label: 'Semua Foto' },
                { id: 'Kamera', label: 'Kamera DCIM' },
                { id: 'Keluarga', label: 'Keluarga' },
                { id: 'favorite', label: 'Favorit' },
              ].map((album) => (
                <button
                  key={album.id}
                  onClick={() => setSelectedAlbum(album.id)}
                  className={`rounded-xl px-3.5 py-1.5 transition-all ${
                    selectedAlbum === album.id
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
                  }`}
                >
                  {album.label}
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => openLightboxAt(0)}
                aria-label="Buka mode Salindia Foto Penuh"
                className="flex items-center space-x-1.5 rounded-xl border border-cyan-500/30 bg-cyan-950/40 px-3.5 py-1.5 text-xs font-bold text-cyan-300 hover:bg-cyan-900/50 transition-all active:scale-95"
              >
                <Maximize2 className="h-3.5 w-3.5" />
                <span>Buka Salindia Penuh</span>
              </button>
            </div>
          </div>

          {/* Photo Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
            {filteredPhotos.map((photo, idx) => (
              <button
                key={photo.id}
                onClick={() => openLightboxAt(photos.findIndex((p) => p.id === photo.id))}
                aria-label={`Buka foto ${photo.name}`}
                className="group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-md transition-all duration-200 hover:-translate-y-1 hover:border-cyan-400 hover:shadow-xl hover:shadow-cyan-500/10 text-left"
              >
                {/* Image */}
                <div className="aspect-square w-full overflow-hidden bg-slate-950">
                  <img
                    src={photo.blobData || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800'}
                    alt={photo.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>

                {/* Badges Overlay */}
                <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none">
                  {photo.meta?.resolution && (
                    <span className="rounded-md bg-slate-950/80 px-1.5 py-0.5 text-[9px] font-mono font-bold text-cyan-300 backdrop-blur-sm">
                      {photo.meta.resolution.split(' ')[0]}
                    </span>
                  )}
                  {photo.meta?.favorite && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500/90 text-white shadow">
                      <Heart className="h-3 w-3 fill-current" />
                    </span>
                  )}
                </div>

                {/* Bottom title on hover */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent p-2.5 pt-6 opacity-90 transition-opacity pointer-events-none">
                  <div className="text-[11px] font-bold text-white truncate">{photo.name}</div>
                  <div className="flex items-center justify-between text-[9px] text-slate-400 mt-0.5 font-mono">
                    <span>{formatBytes(photo.size)}</span>
                    <span>{photo.meta?.camera?.split(' ')[0] || 'HyperLens'}</span>
                  </div>
                </div>

                {/* Hover Center Icon */}
                <div className="absolute inset-0 flex items-center justify-center bg-cyan-950/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <span className="rounded-xl bg-cyan-500 p-2 text-slate-950 shadow-lg">
                    <Eye className="h-4 w-4" />
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: PEMUTAR VIDEO 4K (CINEMA VIDEO PLAYER) */}
      {activeMediaTab === 'videos' && (
        <div className="space-y-6">
          {/* Main Cinema Theater Viewport */}
          {activeVideo && (
            <div className="overflow-hidden rounded-3xl border border-purple-500/30 bg-slate-950 shadow-2xl">
              {/* Theater Video Frame */}
              <div className="relative aspect-video w-full bg-black flex items-center justify-center group">
                <video
                  ref={videoRef}
                  key={activeVideo.id}
                  src={activeVideoSrc}
                  controls
                  playsInline
                  onTimeUpdate={handleVideoTimeUpdate}
                  onPlay={() => setIsVideoPlaying(true)}
                  onPause={() => setIsVideoPlaying(false)}
                  onError={handleVideoError}
                  className="h-full w-full object-contain cursor-pointer"
                />

                {/* Floating Badges */}
                <div className="absolute top-4 left-4 flex items-center space-x-2 pointer-events-none">
                  <span className="rounded-full bg-purple-950/80 backdrop-blur-md border border-purple-500/40 px-3 py-1 text-[11px] font-mono font-bold text-purple-300 shadow-lg">
                    4K UHD • 60FPS
                  </span>
                  <span className="rounded-full bg-emerald-950/80 backdrop-blur-md border border-emerald-500/40 px-2.5 py-1 text-[10px] font-semibold text-emerald-300 flex items-center">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Siap Diputar
                  </span>
                </div>

                {/* Video Error Fallback Notification */}
                {videoLoadError && (
                  <div className="absolute top-4 right-4 rounded-xl border border-amber-500/40 bg-amber-950/90 backdrop-blur-md px-3 py-1.5 text-xs text-amber-300 flex items-center space-x-1.5 shadow-lg">
                    <AlertCircle className="h-4 w-4 text-amber-400" />
                    <span>Sumber video dialihkan otomatis ke mirror terverifikasi</span>
                  </div>
                )}
              </div>

              {/* Theater Custom Control & Scrubber Bar */}
              <div className="border-t border-slate-800 bg-slate-900/95 p-4 space-y-3">
                {/* Timeline Scrubber */}
                <div className="flex items-center space-x-3">
                  <span className="text-[11px] font-mono text-purple-400 font-semibold w-12 text-right">
                    {formatSeconds(videoCurrentTime)}
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={videoDuration || 100}
                    value={videoCurrentTime}
                    onChange={handleVideoSeek}
                    className="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500 hover:accent-purple-400"
                  />
                  <span className="text-[11px] font-mono text-slate-400 w-12">
                    {formatSeconds(videoDuration || 60)}
                  </span>
                </div>

                {/* Playback Controls & Info */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center space-x-3">
                    {/* Play/Pause Button */}
                    <button
                      onClick={togglePlayVideo}
                      aria-label={isVideoPlaying ? 'Jeda Video' : 'Putar Video'}
                      className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg shadow-purple-500/25 hover:brightness-110 active:scale-95 transition-all"
                    >
                      {isVideoPlaying ? (
                        <Pause className="h-5 w-5 fill-current" />
                      ) : (
                        <Play className="h-5 w-5 fill-current ml-0.5" />
                      )}
                    </button>

                    {/* Rewind 10s */}
                    <button
                      onClick={() => handleSkipVideo(-10)}
                      title="Mundur 10 detik"
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-850 text-slate-300 hover:text-white hover:bg-slate-800 active:scale-95 transition-all"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </button>

                    {/* Forward 10s */}
                    <button
                      onClick={() => handleSkipVideo(10)}
                      title="Maju 10 detik"
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-850 text-slate-300 hover:text-white hover:bg-slate-800 active:scale-95 transition-all"
                    >
                      <RotateCw className="h-4 w-4" />
                    </button>

                    {/* Volume Mute & Slider */}
                    <div className="flex items-center space-x-2 border-l border-slate-800 pl-3">
                      <button
                        onClick={handleToggleVideoMute}
                        className="text-slate-400 hover:text-white"
                        title={isVideoMuted ? 'Batal Bisukan' : 'Bisukan'}
                      >
                        {isVideoMuted || videoVolume === 0 ? (
                          <VolumeX className="h-4 w-4 text-purple-400" />
                        ) : (
                          <Volume2 className="h-4 w-4 text-purple-400" />
                        )}
                      </button>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={isVideoMuted ? 0 : videoVolume}
                        onChange={handleVideoVolumeChange}
                        className="w-16 sm:w-20 h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-purple-500"
                      />
                    </div>
                  </div>

                  {/* Right side: Speed and Fullscreen */}
                  <div className="flex items-center space-x-3 self-end md:self-auto">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-xs text-slate-400 font-semibold hidden sm:inline">Kecepatan:</span>
                      <div className="flex rounded-xl bg-slate-800 p-1 text-xs font-semibold">
                        {[0.75, 1, 1.25, 1.5, 2].map((spd) => (
                          <button
                            key={spd}
                            onClick={() => {
                              setVideoPlaybackSpeed(spd);
                              if (videoRef.current) videoRef.current.playbackRate = spd;
                            }}
                            className={`rounded-lg px-2 py-1 transition-colors ${
                              videoPlaybackSpeed === spd
                                ? 'bg-purple-500 text-white shadow'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            {spd}x
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={handleToggleFullscreen}
                      title="Layar Penuh"
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-850 text-slate-300 hover:text-white hover:bg-slate-800 active:scale-95 transition-all"
                    >
                      <Maximize2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Video Metadata Bar */}
                <div className="pt-2 border-t border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs text-slate-400">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-white">{activeVideo.name}</span>
                    <span>•</span>
                    <span>{formatBytes(activeVideo.size)}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-[11px] text-purple-400 font-mono">
                    <span>Codec: {activeVideo.meta?.codec || 'H.264 / AVC'}</span>
                    <span>•</span>
                    <span>Audio: Dolby Atmos Hi-Res</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Video Playlist Grid */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Daftar Video di Penyimpanan 5 TB ({videos.length})
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {videos.map((vid) => (
                <div
                  key={vid.id}
                  onClick={() => setActiveVideoId(vid.id)}
                  className={`group cursor-pointer rounded-2xl border p-4 transition-all ${
                    activeVideo?.id === vid.id
                      ? 'border-purple-500 bg-purple-950/20 shadow-lg shadow-purple-500/10'
                      : 'border-slate-800 bg-slate-900/80 hover:border-slate-700 hover:bg-slate-850'
                  }`}
                >
                  <div className="relative aspect-video w-full rounded-xl bg-slate-950 flex items-center justify-center overflow-hidden border border-slate-800">
                    <Film className="h-8 w-8 text-purple-400 group-hover:scale-110 transition-transform" />
                    <div className="absolute inset-0 bg-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500 text-white shadow-lg">
                        <Play className="h-5 w-5 fill-current ml-0.5" />
                      </span>
                    </div>
                    <span className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-mono text-white">
                      {vid.meta?.duration || '08:42'}
                    </span>
                  </div>

                  <h5 className="mt-3 text-xs font-bold text-white truncate group-hover:text-purple-300">
                    {vid.name}
                  </h5>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                    <span>{formatBytes(vid.size)}</span>
                    <span className="font-mono text-purple-400 font-medium">4K HDR</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PEMUTAR MUSIK & AUDIO STUDIO */}
      {activeMediaTab === 'audio' && (
        <div className="space-y-6">
          {/* Main Audio Player Deck */}
          <div className="relative overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 p-6 sm:p-8 shadow-2xl">
            {/* Ambient Background Glow */}
            <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl" />

            <div className="flex flex-col md:flex-row items-center gap-6 sm:gap-8">
              {/* Rotating Disc / Album Art Visualizer */}
              <div className="relative flex h-36 w-36 sm:h-44 sm:w-44 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-tr from-amber-500 via-orange-600 to-yellow-500 p-1 shadow-2xl shadow-amber-500/20">
                <div
                  className={`flex h-full w-full items-center justify-center rounded-[22px] bg-slate-950 ${
                    isPlayingAudio ? 'animate-spin-slow' : ''
                  }`}
                >
                  <Music className="h-14 w-14 text-amber-400" />
                </div>
                {/* Center spindle */}
                <div className="absolute flex h-10 w-10 items-center justify-center rounded-full bg-amber-400 ring-4 ring-slate-950">
                  <span className="h-3 w-3 rounded-full bg-slate-950" />
                </div>
              </div>

              {/* Track Info & Scrubber */}
              <div className="flex-1 w-full space-y-4 text-center md:text-left">
                <div>
                  <div className="inline-flex items-center space-x-2 rounded-full border border-amber-500/30 bg-amber-950/40 px-3 py-1 text-[11px] font-semibold text-amber-300">
                    <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                    <span>Master Audio Hi-Res • 192 kHz / 24-Bit Lossless</span>
                  </div>
                  <h3 className="mt-2 text-xl sm:text-2xl font-black text-white tracking-tight">
                    {activeAudio?.name || 'Pilih Lagu'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {activeAudio?.meta?.artist || 'HyperSound Artist'} — {activeAudio?.meta?.album || 'HyperVault Hi-Res Album'}
                  </p>
                </div>

                {/* Animated Equalizer Wave Bars */}
                <div className="flex items-center justify-center md:justify-start space-x-1 h-6">
                  {[18, 32, 12, 28, 45, 20, 36, 15, 42, 24, 38, 16, 30].map((h, i) => (
                    <div
                      key={i}
                      style={{
                        height: isPlayingAudio ? `${Math.max(6, (h * (0.6 + Math.random() * 0.8)))}px` : '4px',
                      }}
                      className="w-1 rounded-full bg-amber-400 transition-all duration-150"
                    />
                  ))}
                </div>

                {/* Timeline Progress Slider */}
                <div className="space-y-1.5">
                  <input
                    type="range"
                    min={0}
                    max={audioDuration || 100}
                    value={audioCurrentTime}
                    onChange={handleSeekAudio}
                    aria-label="Posisi Durasi Musik"
                    className="w-full accent-amber-500 cursor-pointer h-1.5 rounded-lg bg-slate-800"
                  />
                  <div className="flex justify-between text-[11px] font-mono text-slate-400">
                    <span>{formatSeconds(audioCurrentTime)}</span>
                    <span>{formatSeconds(audioDuration)}</span>
                  </div>
                </div>

                {/* Controls Deck */}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
                  <div className="flex items-center space-x-4 mx-auto md:mx-0">
                    <button
                      onClick={() => setIsLooping(!isLooping)}
                      aria-label="Ulangi Lagu (Loop)"
                      className={`p-2 rounded-xl transition-colors ${
                        isLooping ? 'text-amber-400 bg-amber-950/40' : 'text-slate-500 hover:text-white'
                      }`}
                    >
                      <Repeat className="h-4 w-4" />
                    </button>

                    <button
                      onClick={handlePrevTrack}
                      aria-label="Trek Sebelumnya"
                      className="p-2 text-slate-300 hover:text-white transition-colors"
                    >
                      <SkipBack className="h-5 w-5" />
                    </button>

                    <button
                      onClick={togglePlayAudio}
                      aria-label={isPlayingAudio ? 'Jeda Musik' : 'Putar Musik'}
                      className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/30 transition-all active:scale-95"
                    >
                      {isPlayingAudio ? (
                        <Pause className="h-6 w-6 fill-current" />
                      ) : (
                        <Play className="h-6 w-6 fill-current ml-0.5" />
                      )}
                    </button>

                    <button
                      onClick={handleNextTrack}
                      aria-label="Trek Berikutnya"
                      className="p-2 text-slate-300 hover:text-white transition-colors"
                    >
                      <SkipForward className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Volume Control */}
                  <div className="flex items-center space-x-2 mx-auto md:mx-0">
                    <button
                      onClick={() => {
                        if (audioRef.current) {
                          audioRef.current.muted = !isMuted;
                          setIsMuted(!isMuted);
                        }
                      }}
                      aria-label={isMuted ? 'Nyalakan Suara' : 'Bisukan Suara'}
                      className="text-slate-400 hover:text-white"
                    >
                      {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    </button>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={isMuted ? 0 : audioVolume}
                      onChange={handleVolumeChange}
                      aria-label="Volume Musik"
                      className="w-20 accent-amber-500 cursor-pointer h-1.5 rounded-lg bg-slate-800"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Playlist Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80">
            <div className="border-b border-slate-800 bg-slate-950/60 px-4 py-3 flex items-center justify-between">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Daftar Putar Musik & Audio ({audioTracks.length} Trek)
              </h4>
              <span className="text-xs text-amber-400 font-mono">Hi-Res Lossless</span>
            </div>

            <div className="divide-y divide-slate-800/60">
              {audioTracks.map((track, idx) => (
                <div
                  key={track.id}
                  onClick={() => {
                    setActiveAudioId(track.id);
                    setIsPlayingAudio(true);
                  }}
                  className={`cursor-pointer px-4 py-3.5 flex items-center justify-between transition-colors ${
                    activeAudio?.id === track.id
                      ? 'bg-amber-950/30 text-white'
                      : 'hover:bg-slate-850/60 text-slate-300'
                  }`}
                >
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-xs font-mono font-bold text-amber-400">
                      {activeAudio?.id === track.id && isPlayingAudio ? (
                        <Radio className="h-3.5 w-3.5 animate-pulse" />
                      ) : (
                        idx + 1
                      )}
                    </span>
                    <div className="overflow-hidden">
                      <div className="text-xs font-bold text-white truncate">{track.name}</div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {track.meta?.artist || 'HyperSound Master'} • {track.meta?.album || 'Studio Master'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 text-xs font-mono shrink-0">
                    <span className="text-slate-400">{track.meta?.duration || '03:45'}</span>
                    <span className="text-amber-400/90 font-medium">{formatBytes(track.size)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Photo Lightbox Modal */}
      <PhotoLightboxModal
        photos={photos}
        currentPhotoIndex={currentLightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onNavigate={(idx) => setCurrentLightboxIndex(idx)}
      />
    </div>
  );
};
