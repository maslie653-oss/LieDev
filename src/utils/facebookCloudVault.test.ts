import test from 'node:test';
import assert from 'node:assert/strict';
import {
  saveFacebookCloudBackup,
  getFacebookCloudBackup,
  FacebookVaultBackupSnapshot,
} from './facebookCloudVault';
import { FacebookUserProfile } from './facebookAuth';

// Mock localStorage for Node test runner environment
if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map<string, string>();
  globalThis.localStorage = {
    getItem: (key: string) => store.get(key) || null,
    setItem: (key: string, val: string) => store.set(key, String(val)),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
    key: (i: number) => Array.from(store.keys())[i] || null,
    length: 0,
  } as any;
}

test('saveFacebookCloudBackup packages user files and metadata securely', () => {
  const dummyUser: FacebookUserProfile = {
    id: 'fb_test_123',
    name: 'Alfin Bajo',
    email: 'alfin@example.com',
    avatarUrl: 'https://example.com/avatar.jpg',
    provider: 'facebook',
    connectedAt: Date.now(),
  };

  const dummyData = {
    files: [
      {
        id: 'f1',
        name: 'video_pantai.mp4',
        size: 50 * 1024 * 1024,
        type: 'video/mp4',
        category: 'videos' as const,
        createdAt: Date.now(),
      },
    ],
    contacts: [
      {
        id: 'c1',
        name: 'Budi Santoso',
        phone: '08123456789',
        group: 'Teman',
      },
    ],
    messages: [],
    apps: [],
  };

  const snapshot = saveFacebookCloudBackup(dummyUser, dummyData);

  assert.equal(snapshot.signature, 'HYPERCLONE_FB_VAULT_V1');
  assert.equal(snapshot.facebookUserId, 'fb_test_123');
  assert.equal(snapshot.totalFiles, 1);
  assert.equal(snapshot.totalContacts, 1);
  assert.equal(snapshot.totalBytes, 50 * 1024 * 1024);

  // Retrieve back
  const retrieved = getFacebookCloudBackup('fb_test_123');
  assert.ok(retrieved);
  assert.equal(retrieved?.facebookUserName, 'Alfin Bajo');
  assert.equal(retrieved?.data.files.length, 1);
  assert.equal(retrieved?.data.files[0].name, 'video_pantai.mp4');
});
