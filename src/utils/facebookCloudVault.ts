import {
  StoredFileItem,
  ContactItem,
  MessageItem,
  AppItem,
  DeviceProfile,
  formatBytes,
} from './storageEngine';
import { FacebookUserProfile } from './facebookAuth';
import {
  openDB,
  saveContactsBulk,
  addStoredFile,
} from './indexedDb';

export interface FacebookVaultBackupSnapshot {
  signature: 'HYPERCLONE_FB_VAULT_V1';
  facebookUserId: string;
  facebookUserName: string;
  facebookEmail: string;
  backupTimestamp: number;
  formattedBackupDate: string;
  totalFiles: number;
  totalContacts: number;
  totalMessages: number;
  totalApps: number;
  totalBytes: number;
  formattedSize: string;
  deviceSource: string;
  data: {
    files: StoredFileItem[];
    contacts: ContactItem[];
    messages: MessageItem[];
    apps: AppItem[];
    profile?: DeviceProfile;
  };
}

export const FB_CLOUD_STORAGE_PREFIX = 'hyperclone_fb_cloud_vault_';

/**
 * Persist Facebook Cloud Vault snapshot
 */
export function saveFacebookCloudBackup(
  user: FacebookUserProfile,
  data: {
    files: StoredFileItem[];
    contacts: ContactItem[];
    messages: MessageItem[];
    apps: AppItem[];
    profile?: DeviceProfile;
  }
): FacebookVaultBackupSnapshot {
  const totalBytes = data.files.reduce((sum, f) => sum + (f.size || 0), 0);
  const now = Date.now();

  const snapshot: FacebookVaultBackupSnapshot = {
    signature: 'HYPERCLONE_FB_VAULT_V1',
    facebookUserId: user.id,
    facebookUserName: user.name,
    facebookEmail: user.email,
    backupTimestamp: now,
    formattedBackupDate: new Date(now).toLocaleString('id-ID'),
    totalFiles: data.files.length,
    totalContacts: data.contacts.length,
    totalMessages: data.messages.length,
    totalApps: data.apps.length,
    totalBytes,
    formattedSize: formatBytes(totalBytes),
    deviceSource: data.profile?.deviceName || 'HyperPhone 16 Pro Max Ultra',
    data,
  };

  try {
    const key = `${FB_CLOUD_STORAGE_PREFIX}${user.id}`;
    localStorage.setItem(key, JSON.stringify(snapshot));
    // Also save an active global cloud pointer
    localStorage.setItem('hyperclone_fb_last_cloud_user', user.id);
  } catch (err) {
    console.warn('LocalStorage save failed, snapshot retained in runtime memory:', err);
  }

  return snapshot;
}

/**
 * Fetch existing Facebook Cloud Vault backup for a user
 */
export function getFacebookCloudBackup(userId: string): FacebookVaultBackupSnapshot | null {
  try {
    const key = `${FB_CLOUD_STORAGE_PREFIX}${userId}`;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.signature === 'HYPERCLONE_FB_VAULT_V1') {
      return parsed;
    }
  } catch (err) {
    console.warn('Failed to parse Facebook Cloud Vault backup:', err);
  }
  return null;
}

/**
 * Restore data from Facebook Cloud Vault into local database and state
 */
export async function restoreDataFromFacebookCloud(
  snapshot: FacebookVaultBackupSnapshot
): Promise<{
  files: StoredFileItem[];
  contacts: ContactItem[];
  messages: MessageItem[];
  apps: AppItem[];
  profile?: DeviceProfile;
}> {
  const { files, contacts, messages, apps, profile } = snapshot.data;

  try {
    const db = await openDB();
    if (db) {
      // Restore files
      const fileTx = db.transaction('files', 'readwrite');
      const fileStore = fileTx.objectStore('files');
      fileStore.clear();
      files.forEach((f) => fileStore.put(f));

      // Restore contacts
      const contactTx = db.transaction('contacts', 'readwrite');
      const contactStore = contactTx.objectStore('contacts');
      contactStore.clear();
      contacts.forEach((c) => contactStore.put(c));

      // Restore messages
      const msgTx = db.transaction('messages', 'readwrite');
      const msgStore = msgTx.objectStore('messages');
      msgStore.clear();
      messages.forEach((m) => msgStore.put(m));

      // Restore apps
      const appTx = db.transaction('apps', 'readwrite');
      const appStore = appTx.objectStore('apps');
      appStore.clear();
      apps.forEach((a) => appStore.put(a));
    }
  } catch (err) {
    console.warn('IndexedDB bulk restore encountered an issue, returning in-memory data:', err);
  }

  return { files, contacts, messages, apps, profile };
}

/**
 * Simulates a complete phone factory reset / device wipe.
 * Clears local IndexedDB database stores and local session,
 * BUT leaves the Facebook Cloud Vault intact in remote/cloud storage!
 */
export async function simulatePhoneReset(): Promise<void> {
  try {
    const db = await openDB();
    if (db) {
      const stores = ['files', 'contacts', 'messages', 'apps', 'cloneHistory'];
      stores.forEach((storeName) => {
        try {
          const tx = db.transaction(storeName, 'readwrite');
          tx.objectStore(storeName).clear();
        } catch {
          // Ignore
        }
      });
    }
  } catch (e) {
    console.warn('Reset IndexedDB warning:', e);
  }

  // Clear local device active session (simulate phone wiped clean)
  sessionStorage.clear();
  localStorage.removeItem('hyperclone_fb_active_session');
}
