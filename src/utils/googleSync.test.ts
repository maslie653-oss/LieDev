import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizePhone, mergeContactsIntelligently } from './googleSync';
import { ContactItem } from './storageEngine';

test('normalizePhone strips punctuation and spaces correctly', () => {
  assert.equal(normalizePhone('+62 812-3456-7890'), '+6281234567890');
  assert.equal(normalizePhone('(021) 555-1234'), '0215551234');
  assert.equal(normalizePhone('0819 8888 9999'), '081988889999');
});

test('mergeContactsIntelligently prevents duplicate contacts by phone, email, or exact name', () => {
  const existing: ContactItem[] = [
    {
      id: 'c1',
      name: 'Budi Santoso',
      phone: '+6281234567890',
      email: 'budi@example.com',
      group: 'Keluarga',
    },
    {
      id: 'c2',
      name: 'Siti Rahma',
      phone: '081399887766',
      email: 'siti@example.com',
      group: 'Teman',
    },
  ];

  const incoming: ContactItem[] = [
    // Duplicate phone with formatted difference
    {
      id: 'g1',
      name: 'Budi Santoso (Work)',
      phone: '+62 812-3456-7890',
      group: 'Google Cloud',
    },
    // Duplicate email
    {
      id: 'g2',
      name: 'Siti R.',
      phone: '08990001112',
      email: 'siti@example.com',
      group: 'Google Cloud',
    },
    // Duplicate exact name
    {
      id: 'g3',
      name: 'Budi Santoso',
      phone: '085511223344',
      group: 'Google Cloud',
    },
    // Truly new contact
    {
      id: 'g4',
      name: 'Alfin Bajo',
      phone: '+6281122334455',
      email: 'alfinbajo@gmail.com',
      group: 'Google Cloud',
    },
  ];

  const result = mergeContactsIntelligently(existing, incoming);

  assert.equal(result.importedCount, 1);
  assert.equal(result.skippedCount, 3);
  assert.equal(result.merged.length, 3);
  assert.equal(result.merged[2].name, 'Alfin Bajo');
});
