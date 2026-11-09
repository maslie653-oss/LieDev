import { StoredFileItem, ContactItem, MessageItem, AppItem, DeviceProfile, TOTAL_MEGA_STORAGE_BYTES } from './storageEngine';
import { INITIAL_FILES, INITIAL_CONTACTS, INITIAL_MESSAGES, INITIAL_APPS, DEFAULT_DEVICE_PROFILE } from './sampleData';

const DB_NAME = 'HyperCloneDB_v1';
const DB_VERSION = 1;

export interface CloneSessionLog {
  id: string;
  sourceDevice: string;
  targetDevice: string;
  timestamp: number;
  totalTransferredBytes: number;
  itemsCloned: number;
  categories: string[];
  durationSeconds: number;
  averageSpeedMbs: number;
  status: 'completed' | 'cancelled' | 'in_progress';
}

export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB tidak didukung pada lingkungan ini'));
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('files')) {
        db.createObjectStore('files', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('contacts')) {
        db.createObjectStore('contacts', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('messages')) {
        db.createObjectStore('messages', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('apps')) {
        db.createObjectStore('apps', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('deviceProfile')) {
        db.createObjectStore('deviceProfile', { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains('cloneHistory')) {
        db.createObjectStore('cloneHistory', { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Fallback in-memory or localStorage cache for fast rendering
let memoryFiles: StoredFileItem[] = [...INITIAL_FILES];
let memoryContacts: ContactItem[] = [...INITIAL_CONTACTS];
let memoryMessages: MessageItem[] = [...INITIAL_MESSAGES];
let memoryApps: AppItem[] = [...INITIAL_APPS];
let memoryProfile: DeviceProfile = { ...DEFAULT_DEVICE_PROFILE };
let memoryHistory: CloneSessionLog[] = [];

let isInitialized = false;

export async function initStorage(): Promise<{
  files: StoredFileItem[];
  contacts: ContactItem[];
  messages: MessageItem[];
  apps: AppItem[];
  profile: DeviceProfile;
  history: CloneSessionLog[];
}> {
  if (isInitialized) {
    return {
      files: memoryFiles,
      contacts: memoryContacts,
      messages: memoryMessages,
      apps: memoryApps,
      profile: memoryProfile,
      history: memoryHistory,
    };
  }

  try {
    const db = await openDB();

    // Check files
    const storedFiles = await getAllFromStore<StoredFileItem>(db, 'files');
    if (storedFiles.length > 0) {
      // Auto-migrate broken 403 video URLs and 404 audio URLs to local verified assets
      let hasMigrated = false;
      const updatedFiles = storedFiles.map((file) => {
        if (
          file.category === 'videos' &&
          (!file.blobData || file.blobData.includes('commondatastorage.googleapis.com/gtv-videos-bucket'))
        ) {
          hasMigrated = true;
          if (file.id === 'f4' || file.name.includes('Drone') || file.name.includes('VID_20261102')) {
            return { ...file, blobData: '/videos/drone_ocean_cinematic.mp4' };
          } else if (file.id === 'f5' || file.name.includes('Konser') || file.name.includes('VID_20261028')) {
            return { ...file, blobData: '/videos/konser_live_music.mp4' };
          } else {
            return { ...file, blobData: '/videos/nature_timelapse_4k.mp4' };
          }
        }
        if (
          file.category === 'audio' &&
          (!file.blobData || file.blobData.includes('actions.google.com'))
        ) {
          hasMigrated = true;
          if (file.id === 'f6' || file.name.includes('Studio') || file.name.includes('Symphony')) {
            return { ...file, blobData: '/audio/studio_master_symphony.mp3' };
          } else if (file.id === 'f7_b' || file.name.includes('LoFi') || file.name.includes('Chill')) {
            return { ...file, blobData: '/audio/lofi_chill_beats.mp3' };
          } else {
            return { ...file, blobData: '/audio/voice_memo_meeting.mp3' };
          }
        }
        return file;
      });

      if (hasMigrated) {
        await putAllToStore(db, 'files', updatedFiles);
        memoryFiles = updatedFiles;
      } else {
        memoryFiles = storedFiles;
      }
    } else {
      // Seed default files
      await putAllToStore(db, 'files', INITIAL_FILES);
      memoryFiles = [...INITIAL_FILES];
    }

    // Check contacts
    const storedContacts = await getAllFromStore<ContactItem>(db, 'contacts');
    if (storedContacts.length > 0) {
      memoryContacts = storedContacts;
    } else {
      await putAllToStore(db, 'contacts', INITIAL_CONTACTS);
      memoryContacts = [...INITIAL_CONTACTS];
    }

    // Check messages
    const storedMessages = await getAllFromStore<MessageItem>(db, 'messages');
    if (storedMessages.length > 0) {
      memoryMessages = storedMessages;
    } else {
      await putAllToStore(db, 'messages', INITIAL_MESSAGES);
      memoryMessages = [...INITIAL_MESSAGES];
    }

    // Check apps
    const storedApps = await getAllFromStore<AppItem>(db, 'apps');
    if (storedApps.length > 0) {
      memoryApps = storedApps;
    } else {
      await putAllToStore(db, 'apps', INITIAL_APPS);
      memoryApps = [...INITIAL_APPS];
    }

    // Check history
    memoryHistory = await getAllFromStore<CloneSessionLog>(db, 'cloneHistory');

    isInitialized = true;
  } catch (err) {
    console.warn('Gagal memuat IndexedDB, menggunakan data memori:', err);
    isInitialized = true;
  }

  return {
    files: memoryFiles,
    contacts: memoryContacts,
    messages: memoryMessages,
    apps: memoryApps,
    profile: memoryProfile,
    history: memoryHistory,
  };
}

function getAllFromStore<T>(db: IDBDatabase, storeName: string): Promise<T[]> {
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    } catch {
      resolve([]);
    }
  });
}

function putAllToStore<T>(db: IDBDatabase, storeName: string, items: T[]): Promise<void> {
  return new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      items.forEach((item) => store.put(item));
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

function putItem<T>(storeName: string, item: T): Promise<void> {
  return openDB().then((db) => {
    return new Promise<void>((resolve) => {
      try {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        store.put(item);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }).catch(() => {});
}

function deleteItem(storeName: string, key: string): Promise<void> {
  return openDB().then((db) => {
    return new Promise<void>((resolve) => {
      try {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        store.delete(key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }).catch(() => {});
}

export async function addStoredFile(file: StoredFileItem): Promise<StoredFileItem[]> {
  memoryFiles = [file, ...memoryFiles];
  await putItem('files', file);
  return memoryFiles;
}

export async function deleteStoredFile(id: string): Promise<StoredFileItem[]> {
  memoryFiles = memoryFiles.filter((f) => f.id !== id);
  await deleteItem('files', id);
  return memoryFiles;
}

export async function renameStoredFile(id: string, newName: string): Promise<StoredFileItem[]> {
  memoryFiles = memoryFiles.map((f) => (f.id === id ? { ...f, name: newName } : f));
  const updated = memoryFiles.find((f) => f.id === id);
  if (updated) {
    await putItem('files', updated);
  }
  return memoryFiles;
}

export async function toggleHideStoredFile(id: string, isHidden: boolean): Promise<StoredFileItem[]> {
  memoryFiles = memoryFiles.map((f) => (f.id === id ? { ...f, isHidden } : f));
  const updated = memoryFiles.find((f) => f.id === id);
  if (updated) {
    await putItem('files', updated);
  }
  return memoryFiles;
}

export async function toggleHideApp(id: string, isHidden: boolean): Promise<AppItem[]> {
  memoryApps = memoryApps.map((a) => (a.id === id ? { ...a, isHidden } : a));
  const updated = memoryApps.find((a) => a.id === id);
  if (updated) {
    await putItem('apps', updated);
  }
  return memoryApps;
}

export async function addContact(contact: ContactItem): Promise<ContactItem[]> {
  memoryContacts = [contact, ...memoryContacts];
  await putItem('contacts', contact);
  return memoryContacts;
}

export async function deleteContact(id: string): Promise<ContactItem[]> {
  memoryContacts = memoryContacts.filter((c) => c.id !== id);
  await deleteItem('contacts', id);
  return memoryContacts;
}

export async function saveContactsBulk(contacts: ContactItem[]): Promise<ContactItem[]> {
  memoryContacts = [...contacts];
  try {
    const db = await openDB();
    await putAllToStore(db, 'contacts', contacts);
  } catch {
    // Continue with in-memory contacts
  }
  return memoryContacts;
}

export async function sendChatMessage(threadId: string, text: string): Promise<MessageItem[]> {
  const newMsg = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    text,
    fromMe: true,
    timestamp: Date.now(),
  };

  memoryMessages = memoryMessages.map((m) => {
    if (m.id === threadId) {
      return {
        ...m,
        preview: text,
        timestamp: Date.now(),
        messages: [...m.messages, newMsg],
      };
    }
    return m;
  });

  const target = memoryMessages.find((m) => m.id === threadId);
  if (target) {
    await putItem('messages', target);
  }
  return memoryMessages;
}

export async function optimizeAndCleanStorage(cleanDuplicates: boolean, cleanCache: boolean): Promise<{
  updatedFiles: StoredFileItem[];
  reclaimedBytes: number;
  deletedCount: number;
}> {
  let reclaimedBytes = 0;
  let deletedCount = 0;
  const retainedFiles: StoredFileItem[] = [];

  for (const f of memoryFiles) {
    let shouldDelete = false;
    if (cleanDuplicates && f.isDuplicate) {
      shouldDelete = true;
    }
    if (cleanCache && (f.isCache || f.name.toLowerCase().includes('.tmp') || f.name.toLowerCase().includes('cache'))) {
      shouldDelete = true;
    }

    if (shouldDelete) {
      reclaimedBytes += f.size;
      deletedCount += 1;
      await deleteItem('files', f.id);
    } else {
      retainedFiles.push(f);
    }
  }

  memoryFiles = retainedFiles;
  return {
    updatedFiles: memoryFiles,
    reclaimedBytes,
    deletedCount,
  };
}

export async function recordCloneSession(log: CloneSessionLog): Promise<CloneSessionLog[]> {
  memoryHistory = [log, ...memoryHistory];
  await putItem('cloneHistory', log);
  return memoryHistory;
}

export function exportFullBackupJson(): string {
  const backupObject = {
    signature: 'HYPERCLONE_BACKUP_V1',
    createdAt: new Date().toISOString(),
    timestamp: Date.now(),
    deviceName: memoryProfile.deviceName,
    totalStorageBytes: TOTAL_MEGA_STORAGE_BYTES,
    files: memoryFiles,
    contacts: memoryContacts,
    messages: memoryMessages,
    apps: memoryApps,
    profile: memoryProfile,
  };
  return JSON.stringify(backupObject, null, 2);
}

export async function importFullBackupJson(jsonString: string): Promise<{ success: boolean; message: string }> {
  try {
    const data = JSON.parse(jsonString);
    if (data.signature !== 'HYPERCLONE_BACKUP_V1') {
      return { success: false, message: 'Format berkas cadangan tidak valid (signature tidak cocok)' };
    }

    const db = await openDB();
    if (Array.isArray(data.files)) {
      memoryFiles = data.files;
      await putAllToStore(db, 'files', memoryFiles);
    }
    if (Array.isArray(data.contacts)) {
      memoryContacts = data.contacts;
      await putAllToStore(db, 'contacts', memoryContacts);
    }
    if (Array.isArray(data.messages)) {
      memoryMessages = data.messages;
      await putAllToStore(db, 'messages', memoryMessages);
    }
    if (Array.isArray(data.apps)) {
      memoryApps = data.apps;
      await putAllToStore(db, 'apps', memoryApps);
    }

    return {
      success: true,
      message: `Pemulihan berhasil! Berhasil memuat ${data.files?.length || 0} berkas, ${data.contacts?.length || 0} kontak, dan ${data.messages?.length || 0} percakapan pesan.`,
    };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Gagal memproses berkas cadangan' };
  }
}

export async function resetAllToDefault(): Promise<{
  files: StoredFileItem[];
  contacts: ContactItem[];
  messages: MessageItem[];
  apps: AppItem[];
}> {
  memoryFiles = [...INITIAL_FILES];
  memoryContacts = [...INITIAL_CONTACTS];
  memoryMessages = [...INITIAL_MESSAGES];
  memoryApps = [...INITIAL_APPS];

  try {
    const db = await openDB();
    const clearStore = (name: string) => {
      const tx = db.transaction(name, 'readwrite');
      tx.objectStore(name).clear();
    };
    clearStore('files');
    clearStore('contacts');
    clearStore('messages');
    clearStore('apps');

    await putAllToStore(db, 'files', INITIAL_FILES);
    await putAllToStore(db, 'contacts', INITIAL_CONTACTS);
    await putAllToStore(db, 'messages', INITIAL_MESSAGES);
    await putAllToStore(db, 'apps', INITIAL_APPS);
  } catch (e) {
    console.error('Reset failed:', e);
  }

  return {
    files: memoryFiles,
    contacts: memoryContacts,
    messages: memoryMessages,
    apps: memoryApps,
  };
}
