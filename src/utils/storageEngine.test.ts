import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatBytes,
  calculateStorageBreakdown,
  analyzeStorageOptimization,
  calculateTransferMetrics,
  validateBackupSchema,
  resolveVideoPlaybackUrl,
  TOTAL_MEGA_STORAGE_BYTES,
  StoredFileItem,
} from './storageEngine';

test('formatBytes formats various sizes correctly', () => {
  assert.equal(formatBytes(0), '0 B');
  assert.equal(formatBytes(1024), '1 KB');
  assert.equal(formatBytes(1024 * 1024), '1 MB');
  assert.equal(formatBytes(1024 * 1024 * 1024), '1 GB');
  assert.equal(formatBytes(5 * 1024 * 1024 * 1024 * 1024), '5 TB');
});

test('calculateStorageBreakdown handles empty and populated files', () => {
  const sampleFiles: StoredFileItem[] = [
    {
      id: '1',
      name: 'photo1.jpg',
      size: 5 * 1024 * 1024,
      type: 'image/jpeg',
      category: 'photos',
      createdAt: Date.now(),
    },
    {
      id: '2',
      name: 'video1.mp4',
      size: 100 * 1024 * 1024,
      type: 'video/mp4',
      category: 'videos',
      createdAt: Date.now(),
    },
    {
      id: '3',
      name: 'document.pdf',
      size: 2 * 1024 * 1024,
      type: 'application/pdf',
      category: 'documents',
      createdAt: Date.now(),
    },
  ];

  const breakdown = calculateStorageBreakdown(sampleFiles, TOTAL_MEGA_STORAGE_BYTES);
  assert.equal(breakdown.length, 7); // photos, videos, audio, documents, apps, system, free

  const photos = breakdown.find((b) => b.category === 'photos');
  assert.ok(photos);
  assert.equal(photos.bytes, 5 * 1024 * 1024);
  assert.equal(photos.itemCount, 1);

  const free = breakdown.find((b) => b.category === 'free');
  assert.ok(free);
  assert.ok(free.bytes > 0);
  assert.ok(free.percentage > 90); // 5TB has vast majority free
});

test('analyzeStorageOptimization finds duplicates and cache files', () => {
  const files: StoredFileItem[] = [
    {
      id: '1',
      name: 'report.pdf',
      size: 1024,
      type: 'application/pdf',
      category: 'documents',
      createdAt: Date.now(),
      hash: 'hash-abc',
    },
    {
      id: '2',
      name: 'report_copy.pdf',
      size: 1024,
      type: 'application/pdf',
      category: 'documents',
      createdAt: Date.now(),
      hash: 'hash-abc', // duplicate
    },
    {
      id: '3',
      name: 'browser_cache.tmp',
      size: 5000,
      type: 'application/octet-stream',
      category: 'system',
      createdAt: Date.now(),
      isCache: true,
    },
  ];

  const analysis = analyzeStorageOptimization(files);
  assert.equal(analysis.duplicates.length, 1);
  assert.equal(analysis.cacheFiles.length, 1);
  assert.equal(analysis.duplicateBytes, 1024);
  assert.equal(analysis.cacheBytes, 5000);
  assert.equal(analysis.totalReclaimableBytes, 6024);
});

test('calculateTransferMetrics computes speed and ETA accurately', () => {
  const total = 100 * 1024 * 1024; // 100 MB
  const transferred = 50 * 1024 * 1024; // 50 MB
  const elapsed = 2; // 2 seconds => 25 MB/s

  const metrics = calculateTransferMetrics(transferred, total, elapsed);
  assert.equal(metrics.progressPercent, 50);
  assert.ok(metrics.speedBps >= 24 * 1024 * 1024);
  assert.equal(metrics.remainingSeconds, 2);
  assert.equal(metrics.formattedEta, '2 dtk');
});

test('validateBackupSchema correctly identifies valid and invalid packages', () => {
  assert.equal(validateBackupSchema(null).valid, false);
  assert.equal(validateBackupSchema({ invalid: true }).valid, false);

  const validBackup = {
    signature: 'HYPERCLONE_BACKUP_V1',
    deviceName: 'Galaxy Ultra 5G',
    timestamp: Date.now(),
    totalBytes: 5000000,
    files: [{ id: '1', name: 'photo.jpg' }],
    contacts: [{ id: 'c1', name: 'Alfin' }],
  };

  const validation = validateBackupSchema(validBackup);
  assert.equal(validation.valid, true);
  assert.equal(validation.metadata?.contactCount, 1);
  assert.equal(validation.metadata?.fileCount, 1);
});

test('resolveVideoPlaybackUrl provides verified fallback for broken 403 endpoints', () => {
  // Test replacing broken commondatastorage.googleapis.com
  const brokenVideo = {
    id: 'f4',
    name: 'VID_20261102_Cinematic_Drone_4K60FPS.mp4',
    blobData: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  };
  assert.equal(resolveVideoPlaybackUrl(brokenVideo), '/videos/drone_ocean_cinematic.mp4');

  // Test concert video
  const concertVideo = {
    id: 'f5',
    name: 'VID_20261028_Konser_Live_Dolby_Atmos.mp4',
    blobData: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  };
  assert.equal(resolveVideoPlaybackUrl(concertVideo), '/videos/konser_live_music.mp4');

  // Test real user upload preserves valid blobData
  const uploadedVideo = {
    id: 'upload_1',
    name: 'my_vacation.mp4',
    blobData: 'blob:http://localhost:3000/123-abc-video',
  };
  assert.equal(resolveVideoPlaybackUrl(uploadedVideo), 'blob:http://localhost:3000/123-abc-video');
});
