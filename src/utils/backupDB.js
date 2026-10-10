/**
 * IndexedDB helper for storing auto-backups.
 * Moves backup snapshots out of localStorage to prevent quota exhaustion.
 * IndexedDB has a much larger quota (~50MB+ vs 5-10MB for localStorage).
 */

const DB_NAME = 'JSPulseOHMS_Backups';
const DB_VERSION = 1;
const STORE_NAME = 'auto_backups';

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Save a backup snapshot to IndexedDB.
 * Keeps only the most recent `maxBackups` entries.
 */
export async function saveBackupToIDB(snapshot, maxBackups = 3) {
  const db = await openDB();
  const entry = {
    id: Date.now(),
    timestamp: new Date().toISOString(),
    keysCount: Object.keys(snapshot).length,
    data: snapshot
  };

  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  store.add(entry);
  await new Promise((resolve, reject) => {
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });

  // Prune old backups beyond maxBackups using the same open connection
  const allBackups = await new Promise((resolve, reject) => {
    const readTx = db.transaction(STORE_NAME, 'readonly');
    const readStore = readTx.objectStore(STORE_NAME);
    const req = readStore.getAll();
    req.onsuccess = () => {
      const results = req.result || [];
      results.sort((a, b) => b.id - a.id);
      resolve(results);
    };
    req.onerror = () => reject(req.error);
  });

  if (allBackups.length > maxBackups) {
    const toDelete = allBackups.slice(maxBackups); // allBackups is sorted newest-first
    const deleteTx = db.transaction(STORE_NAME, 'readwrite');
    const deleteStore = deleteTx.objectStore(STORE_NAME);
    toDelete.forEach(b => deleteStore.delete(b.id));
    await new Promise((resolve, reject) => {
      deleteTx.oncomplete = resolve;
      deleteTx.onerror = () => reject(deleteTx.error);
    });
  }

  db.close();
  return entry;
}

/**
 * Get all backups from IndexedDB, sorted newest-first.
 */
export async function getAllBackupsFromIDB() {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const store = tx.objectStore(STORE_NAME);
  const request = store.getAll();

  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      const results = request.result || [];
      // Sort newest first
      results.sort((a, b) => b.id - a.id);
      db.close();
      resolve(results);
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

/**
 * Delete a specific backup by ID from IndexedDB.
 */
export async function deleteBackupFromIDB(id) {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  store.delete(id);
  await new Promise((resolve, reject) => {
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

/**
 * Clear all backups from IndexedDB.
 */
export async function clearAllBackupsFromIDB() {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  store.clear();
  await new Promise((resolve, reject) => {
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

/**
 * Migrate existing auto-backups from localStorage to IndexedDB.
 * Call this once on startup to move old backups and free localStorage space.
 */
export async function migrateLocalStorageBackupsToIDB() {
  const OLD_KEY = '_auto_backups';
  const raw = localStorage.getItem(OLD_KEY);
  if (!raw) return false;

  try {
    const oldBackups = JSON.parse(raw);
    if (!Array.isArray(oldBackups) || oldBackups.length === 0) {
      localStorage.removeItem(OLD_KEY);
      return false;
    }

    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    for (const backup of oldBackups) {
      // Ensure each backup has an id
      if (!backup.id) backup.id = Date.now() + Math.random();
      store.put(backup);
    }

    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });

    db.close();

    // Remove the old localStorage key to free space
    localStorage.removeItem(OLD_KEY);
    console.log(`[BackupDB] Migrated ${oldBackups.length} backups from localStorage to IndexedDB`);
    return true;
  } catch (e) {
    console.error('[BackupDB] Migration failed:', e);
    // Still try to remove to free space even if migration fails
    localStorage.removeItem(OLD_KEY);
    return false;
  }
}

/**
 * Estimate remaining localStorage quota.
 * Returns { used, remaining, total, percentUsed, isElectron } in bytes (approximate).
 */
export function estimateLocalStorageQuota() {
  let totalSize = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    const value = localStorage.getItem(key);
    totalSize += (key.length + (value ? value.length : 0)) * 2; // UTF-16 = 2 bytes per char
  }
  const isElectron = typeof window !== 'undefined' && window.electron && window.electron.isElectron;
  // Hardcoded 1.5GB limit check as requested
  const estimatedLimit = 1.5 * 1024 * 1024 * 1024;
  return {
    used: totalSize,
    remaining: Math.max(0, estimatedLimit - totalSize),
    total: estimatedLimit,
    percentUsed: Math.min(100, Math.round((totalSize / estimatedLimit) * 100)),
    isElectron
  };
}

/**
 * Attempt to free localStorage space by removing non-essential keys.
 * Returns the number of bytes freed.
 */
export function freeLocalStorageSpace() {
  let freed = 0;

  // 1. Remove old auto-backup key if still present
  const autoBackup = localStorage.getItem('_auto_backups');
  if (autoBackup) {
    freed += autoBackup.length * 2;
    localStorage.removeItem('_auto_backups');
  }

  // 2. Remove orphaned _nextid and _columns keys that have no matching data
  const keysToCheck = [];
  for (let i = 0; i < localStorage.length; i++) {
    keysToCheck.push(localStorage.key(i));
  }

  keysToCheck.forEach(key => {
    if (key.endsWith('_nextid')) {
      const baseKey = key.replace('_nextid', '');
      if (!localStorage.getItem(baseKey)) {
        const val = localStorage.getItem(key);
        freed += (key.length + (val ? val.length : 0)) * 2;
        localStorage.removeItem(key);
      }
    }
    if (key.endsWith('_active_tab_id')) {
      const baseKey = key.replace('_active_tab_id', '');
      if (!localStorage.getItem(baseKey)) {
        const val = localStorage.getItem(key);
        freed += (key.length + (val ? val.length : 0)) * 2;
        localStorage.removeItem(key);
      }
    }
  });

  return freed;
}
