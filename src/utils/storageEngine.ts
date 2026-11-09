/**
 * HyperClone Storage Engine
 * Core calculations, formatters, storage metrics, deduplication, and backup schemas.
 */

export interface StorageCategoryBreakdown {
  category: 'photos' | 'videos' | 'audio' | 'documents' | 'apps' | 'system' | 'free';
  label: string;
  bytes: number;
  formattedSize: string;
  percentage: number;
  color: string;
  itemCount: number;
}

export interface StoredFileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  category: 'photos' | 'videos' | 'audio' | 'documents' | 'apps' | 'system';
  createdAt: number;
  lastModified?: number;
  blobData?: string; // Base64 or object URL for real preview
  isRealUpload?: boolean;
  isDuplicate?: boolean;
  isCache?: boolean;
  hash?: string;
  meta?: Record<string, any>;
  isHidden?: boolean;
  isGame?: boolean;
  gameType?: 'space_shooter' | 'cyber_runner' | 'brick_breaker';
}

export interface ContactItem {
  id: string;
  name: string;
  phone: string;
  email?: string;
  avatarColor?: string;
  group?: string;
}

export interface MessageItem {
  id: string;
  sender: string;
  senderPhone: string;
  preview: string;
  timestamp: number;
  unread?: boolean;
  messages: Array<{
    id: string;
    text: string;
    fromMe: boolean;
    timestamp: number;
  }>;
}

export interface AppItem {
  id: string;
  name: string;
  packageName: string;
  version: string;
  size: number;
  iconName: string;
  category: string;
  hasData: boolean;
  dataSize: number;
  isHidden?: boolean;
  isGame?: boolean;
  gameType?: 'space_shooter' | 'cyber_runner' | 'brick_breaker';
}

export interface DeviceProfile {
  deviceName: string;
  model: string;
  osVersion: string;
  batteryLevel: number;
  cpuModel: string;
  ramGb: number;
  totalStorageBytes: number; // e.g. 5 TB = 5 * 1024^4 = 5,497,558,138,880 bytes
  allocatedStorageGb: number; // 5000 or 5120 GB
  storageType: 'Ultra-Fast NVMe Cloud & Local UFS 4.0' | 'Terabyte Super Storage';
  connectionSpeed: string;
}

// 5 TB default virtual storage
export const TOTAL_MEGA_STORAGE_BYTES = 5 * 1024 * 1024 * 1024 * 1024; // 5 TB

/**
 * Format bytes into human readable string with appropriate units up to TB/PB
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes <= 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const safeI = Math.min(i, sizes.length - 1);
  return `${parseFloat((bytes / Math.pow(k, safeI)).toFixed(dm))} ${sizes[safeI]}`;
}

/**
 * Calculate category breakdown from stored files and fixed system reservation
 */
export function calculateStorageBreakdown(
  files: StoredFileItem[],
  totalBytes: number = TOTAL_MEGA_STORAGE_BYTES,
  systemReservedBytes = 28 * 1024 * 1024 * 1024 // 28 GB for OS & system clone core
): StorageCategoryBreakdown[] {
  const categoryMap: Record<
    'photos' | 'videos' | 'audio' | 'documents' | 'apps' | 'system',
    { bytes: number; count: number; label: string; color: string }
  > = {
    photos: { bytes: 0, count: 0, label: 'Foto & Galeri', color: '#06b6d4' }, // cyan-500
    videos: { bytes: 0, count: 0, label: 'Video HD / 4K', color: '#a855f7' }, // purple-500
    audio: { bytes: 0, count: 0, label: 'Musik & Audio', color: '#f59e0b' }, // amber-500
    documents: { bytes: 0, count: 0, label: 'Dokumen & Arsip', color: '#10b981' }, // emerald-500
    apps: { bytes: 0, count: 0, label: 'Aplikasi & Data', color: '#f43f5e' }, // rose-500
    system: { bytes: systemReservedBytes, count: 1, label: 'Sistem & Firmware', color: '#64748b' }, // slate-500
  };

  for (const f of files) {
    if (categoryMap[f.category]) {
      categoryMap[f.category].bytes += f.size;
      categoryMap[f.category].count += 1;
    } else {
      categoryMap.documents.bytes += f.size;
      categoryMap.documents.count += 1;
    }
  }

  let totalUsed = 0;
  Object.values(categoryMap).forEach((cat) => {
    totalUsed += cat.bytes;
  });

  const freeBytes = Math.max(0, totalBytes - totalUsed);

  const result: StorageCategoryBreakdown[] = (
    Object.keys(categoryMap) as Array<'photos' | 'videos' | 'audio' | 'documents' | 'apps' | 'system'>
  ).map((catKey) => {
    const item = categoryMap[catKey];
    const percentage = totalBytes > 0 ? (item.bytes / totalBytes) * 100 : 0;
    return {
      category: catKey,
      label: item.label,
      bytes: item.bytes,
      formattedSize: formatBytes(item.bytes, 2),
      percentage: Number(percentage.toFixed(2)),
      color: item.color,
      itemCount: item.count,
    };
  });

  const freePercentage = totalBytes > 0 ? (freeBytes / totalBytes) * 100 : 0;
  result.push({
    category: 'free',
    label: 'Ruang Tersedia',
    bytes: freeBytes,
    formattedSize: formatBytes(freeBytes, 2),
    percentage: Number(freePercentage.toFixed(2)),
    color: '#1e293b', // slate-800
    itemCount: 0,
  });

  return result;
}

/**
 * Identify duplicate files, cache files, and large files to optimize storage
 */
export function analyzeStorageOptimization(files: StoredFileItem[]) {
  const duplicates: StoredFileItem[] = [];
  const cacheFiles: StoredFileItem[] = [];
  const largeFiles: StoredFileItem[] = [];

  const seenKeys = new Map<string, string>(); // size_name or hash -> fileId

  const LARGE_THRESHOLD = 50 * 1024 * 1024; // > 50 MB

  for (const file of files) {
    if (file.isCache || file.name.toLowerCase().includes('cache') || file.name.toLowerCase().includes('.tmp')) {
      cacheFiles.push(file);
    }

    const key = file.hash || `${file.size}_${file.name}`;
    if (seenKeys.has(key)) {
      duplicates.push(file);
    } else {
      seenKeys.set(key, file.id);
    }

    if (file.size >= LARGE_THRESHOLD) {
      largeFiles.push(file);
    }
  }

  const duplicateBytes = duplicates.reduce((acc, f) => acc + f.size, 0);
  const cacheBytes = cacheFiles.reduce((acc, f) => acc + f.size, 0);
  const totalReclaimableBytes = duplicateBytes + cacheBytes;

  return {
    duplicates,
    cacheFiles,
    largeFiles,
    duplicateBytes,
    cacheBytes,
    totalReclaimableBytes,
    formattedReclaimable: formatBytes(totalReclaimableBytes),
  };
}

/**
 * Calculate transfer ETA and smoothed speed
 */
export function calculateTransferMetrics(
  transferredBytes: number,
  totalBytes: number,
  elapsedSeconds: number
): {
  speedBps: number;
  formattedSpeed: string;
  remainingSeconds: number;
  formattedEta: string;
  progressPercent: number;
} {
  const safeElapsed = Math.max(0.1, elapsedSeconds);
  const speedBps = transferredBytes / safeElapsed;
  const remainingBytes = Math.max(0, totalBytes - transferredBytes);
  const remainingSeconds = speedBps > 0 ? Math.ceil(remainingBytes / speedBps) : 0;

  const progressPercent = totalBytes > 0 ? Math.min(100, (transferredBytes / totalBytes) * 100) : 0;

  let formattedEta = 'Menghitung...';
  if (remainingSeconds <= 0 && progressPercent >= 99.9) {
    formattedEta = 'Selesai';
  } else if (remainingSeconds < 60) {
    formattedEta = `${remainingSeconds} dtk`;
  } else {
    const mins = Math.floor(remainingSeconds / 60);
    const secs = remainingSeconds % 60;
    formattedEta = `${mins}m ${secs}d`;
  }

  return {
    speedBps,
    formattedSpeed: `${formatBytes(speedBps)}/s`,
    remainingSeconds,
    formattedEta,
    progressPercent: Number(progressPercent.toFixed(1)),
  };
}

/**
 * Validate backup JSON schema
 */
export function validateBackupSchema(data: any): { valid: boolean; error?: string; metadata?: any } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Format berkas cadangan tidak valid (bukan JSON objek)' };
  }
  if (data.signature !== 'HYPERCLONE_BACKUP_V1') {
    return { valid: false, error: 'Format cadangan tidak dikenali atau versi tidak didukung' };
  }
  if (!Array.isArray(data.files) && !Array.isArray(data.contacts)) {
    return { valid: false, error: 'Berkas cadangan tidak memiliki konten berkas atau kontak' };
  }
  return {
    valid: true,
    metadata: {
      deviceName: data.deviceName || 'Unknown Phone',
      timestamp: data.timestamp || Date.now(),
      fileCount: (data.files || []).length,
      contactCount: (data.contacts || []).length,
      totalBytes: data.totalBytes || 0,
    },
  };
}

/**
 * Safely resolves a working video playback URL, replacing broken 403 endpoints with verified assets
 */
export function resolveVideoPlaybackUrl(file?: {
  id?: string;
  name?: string;
  blobData?: string;
}): string {
  if (!file) return '/videos/drone_ocean_cinematic.mp4';
  if (file.blobData && !file.blobData.includes('commondatastorage.googleapis.com')) {
    return file.blobData;
  }
  const name = file.name || '';
  if (file.id === 'f4' || name.includes('Drone') || name.includes('VID_20261102')) {
    return '/videos/drone_ocean_cinematic.mp4';
  }
  if (file.id === 'f5' || name.includes('Konser') || name.includes('VID_20261028')) {
    return '/videos/konser_live_music.mp4';
  }
  return '/videos/nature_timelapse_4k.mp4';
}

/**
 * Safely resolves a working audio playback URL, replacing broken 404/403 endpoints with local verified assets
 */
export function resolveAudioPlaybackUrl(file?: {
  id?: string;
  name?: string;
  blobData?: string;
}): string {
  if (!file) return '/audio/studio_master_symphony.mp3';
  if (
    file.blobData &&
    !file.blobData.includes('actions.google.com') &&
    !file.blobData.includes('commondatastorage.googleapis.com')
  ) {
    return file.blobData;
  }
  const name = file.name || '';
  if (file.id === 'f6' || name.includes('Studio') || name.includes('Symphony') || name.includes('Flac')) {
    return '/audio/studio_master_symphony.mp3';
  }
  if (file.id === 'f7_b' || name.includes('LoFi') || name.includes('Chill')) {
    return '/audio/lofi_chill_beats.mp3';
  }
  if (file.id === 'f7' || name.includes('Voice') || name.includes('Memo') || name.includes('Meeting')) {
    return '/audio/voice_memo_meeting.mp3';
  }
  return '/audio/studio_master_symphony.mp3';
}
