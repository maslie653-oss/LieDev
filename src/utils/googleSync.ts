import { ContactItem, StoredFileItem, MessageItem, AppItem } from './storageEngine';

export interface GoogleContactConnection {
  resourceName?: string;
  names?: Array<{ displayName?: string; familyName?: string; givenName?: string }>;
  phoneNumbers?: Array<{ value?: string; type?: string }>;
  emailAddresses?: Array<{ value?: string; type?: string }>;
  photos?: Array<{ url?: string; default?: boolean }>;
  organizations?: Array<{ name?: string; title?: string }>;
}

export interface GoogleDriveBackupFile {
  id: string;
  name: string;
  size?: string;
  createdTime?: string;
  webViewLink?: string;
}

export interface SyncSummary {
  importedContactsCount: number;
  updatedContactsCount: number;
  duplicateSkippedCount: number;
  driveBackupFileId?: string;
  driveBackupFileName?: string;
}

/**
 * Normalizes phone number string for duplicate comparison
 */
export function normalizePhone(phone: string): string {
  return phone.replace(/[^\d+]/g, '');
}

/**
 * Fetch contacts from Google People API
 */
export async function fetchGoogleContacts(accessToken: string): Promise<ContactItem[]> {
  const url =
    'https://people.googleapis.com/v1/people/me/connections?' +
    new URLSearchParams({
      personFields: 'names,phoneNumbers,emailAddresses,photos,organizations',
      pageSize: '100',
      sortOrder: 'FIRST_NAME_ASCENDING',
    });

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    let parsedMessage = errorText;
    try {
      const errJson = JSON.parse(errorText);
      parsedMessage = errJson.error?.message || errorText;
    } catch {
      // Keep errorText
    }
    throw new Error(`Gagal mengambil Google Contacts: ${parsedMessage}`);
  }

  const data = await response.json();
  const connections: GoogleContactConnection[] = data.connections || [];

  const mappedContacts: ContactItem[] = connections
    .map((person, index) => {
      const name = person.names?.[0]?.displayName || 'Kontak Tanpa Nama';
      const phone = person.phoneNumbers?.[0]?.value || '';
      const email = person.emailAddresses?.[0]?.value;
      const avatar = person.photos?.[0]?.url;
      const org = person.organizations?.[0]?.name;

      return {
        id: `gcontact_${Date.now()}_${index}`,
        name,
        phone: phone || '(Tidak ada nomor)',
        email,
        avatar,
        group: org ? 'Bisnis' : 'Google Cloud',
        favorite: false,
      };
    })
    .filter((c) => c.name !== 'Kontak Tanpa Nama' || c.phone !== '(Tidak ada nomor)');

  return mappedContacts;
}

/**
 * Smart merge contacts: avoids duplicates by matching phone or email or exact name
 */
export function mergeContactsIntelligently(
  existingContacts: ContactItem[],
  incomingContacts: ContactItem[]
): {
  merged: ContactItem[];
  importedCount: number;
  skippedCount: number;
} {
  const merged = [...existingContacts];
  let importedCount = 0;
  let skippedCount = 0;

  for (const incoming of incomingContacts) {
    const incomingNormPhone = normalizePhone(incoming.phone);
    const incomingEmail = incoming.email?.trim().toLowerCase();
    const incomingName = incoming.name.trim().toLowerCase();

    const isDuplicate = merged.some((existing) => {
      if (incomingNormPhone && incomingNormPhone.length >= 7) {
        const existingNorm = normalizePhone(existing.phone);
        if (existingNorm === incomingNormPhone) return true;
      }
      if (incomingEmail && existing.email) {
        if (existing.email.trim().toLowerCase() === incomingEmail) return true;
      }
      if (existing.name.trim().toLowerCase() === incomingName) {
        return true;
      }
      return false;
    });

    if (isDuplicate) {
      skippedCount++;
    } else {
      merged.push(incoming);
      importedCount++;
    }
  }

  return { merged, importedCount, skippedCount };
}

/**
 * Upload backup payload to Google Drive using multipart upload
 */
export async function uploadBackupToGoogleDrive(
  accessToken: string,
  backupData: {
    files: StoredFileItem[];
    contacts: ContactItem[];
    messages: MessageItem[];
    apps: AppItem[];
  },
  customFileName?: string
): Promise<GoogleDriveBackupFile> {
  const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = customFileName || `HyperClone_5TB_Backup_${dateStr}.json`;

  const payload = {
    app: 'HyperClone 5TB Phone Vault',
    version: '2.5.0',
    exportTimestamp: Date.now(),
    exportDateFormatted: new Date().toLocaleString('id-ID'),
    totalFiles: backupData.files.length,
    totalContacts: backupData.contacts.length,
    totalMessages: backupData.messages.length,
    totalApps: backupData.apps.length,
    data: backupData,
  };

  const metadata = {
    name: fileName,
    mimeType: 'application/json',
    description: 'Cadangan cloud resmi dari aplikasi HyperClone 5TB Phone Clone',
  };

  const boundary = '-------HyperCloneVaultMultipartBoundary' + Math.random().toString(36).substring(2);
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: application/json\r\n\r\n' +
    JSON.stringify(payload) +
    closeDelimiter;

  const response = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    let msg = errorText;
    try {
      const errJson = JSON.parse(errorText);
      msg = errJson.error?.message || errorText;
    } catch {
      // Keep errorText
    }
    throw new Error(`Gagal mengunggah cadangan ke Google Drive: ${msg}`);
  }

  const result = await response.json();
  return {
    id: result.id,
    name: result.name || fileName,
    webViewLink: result.webViewLink,
  };
}

/**
 * List existing HyperClone backups stored in user's Google Drive
 */
export async function listGoogleDriveBackups(
  accessToken: string
): Promise<GoogleDriveBackupFile[]> {
  const q = "name contains 'HyperClone_5TB_Backup_' and trashed = false";
  const url =
    'https://www.googleapis.com/drive/v3/files?' +
    new URLSearchParams({
      q,
      fields: 'files(id, name, size, createdTime, webViewLink)',
      orderBy: 'createdTime desc',
      pageSize: '10',
    });

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gagal membaca daftar cadangan Google Drive: ${errorText}`);
  }

  const data = await response.json();
  return data.files || [];
}

/**
 * Download a backup file content from Google Drive
 */
export async function downloadGoogleDriveBackup(
  accessToken: string,
  fileId: string
): Promise<any> {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gagal mengunduh berkas cadangan dari Google Drive: ${errorText}`);
  }

  return response.json();
}
