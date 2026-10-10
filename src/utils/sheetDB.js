/**
 * IndexedDB helper for primary spreadsheet data storage.
 * Bypasses localStorage 5MB quota to support 100,000+ data rows with no lag.
 * 
 * Uses a persistent connection pool with automatic reconnection to prevent
 * the "can't write after days" bug caused by stale IndexedDB connections.
 */

const DB_NAME = 'JSPulseOHMS_Sheets';
const DB_VERSION = 1;
const DATA_STORE = 'sheet_data';
const META_STORE = 'sheet_meta';

// Persistent connection singleton
let _dbInstance = null;
let _dbPromise = null;

/**
 * Get or create a persistent database connection.
 * Re-uses the existing connection if it's still alive.
 * Automatically reconnects if the connection was closed or went stale.
 */
function getDB() {
  // If we already have a connection, test if it is still alive
  if (_dbInstance) {
    try {
      // Create a test transaction to verify the connection is active
      const testTx = _dbInstance.transaction(DATA_STORE, 'readonly');
      testTx.abort(); // Immediately abort to minimize overhead
      return Promise.resolve(_dbInstance);
    } catch (e) {
      console.warn('[SheetDB] Stale database connection detected via test transaction. Reconnecting...', e);
      try {
        _dbInstance.close();
      } catch (err) {
        console.warn('[SheetDB] Error closing stale DB connection:', err);
      }
      _dbInstance = null;
      _dbPromise = null;
    }
  }

  // If a connection attempt is already in progress, wait for it
  if (_dbPromise) return _dbPromise;

  _dbPromise = new Promise((resolve, reject) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(DATA_STORE)) {
          db.createObjectStore(DATA_STORE);
        }
        if (!db.objectStoreNames.contains(META_STORE)) {
          db.createObjectStore(META_STORE);
        }
      };
      request.onsuccess = () => {
        _dbInstance = request.result;
        
        // Listen for unexpected close events so we can reconnect next time
        _dbInstance.onclose = () => {
          console.warn('[SheetDB] Database connection closed unexpectedly. Will reconnect on next operation.');
          _dbInstance = null;
          _dbPromise = null;
        };
        
        // Handle version change (another tab upgrades the DB)
        _dbInstance.onversionchange = () => {
          if (_dbInstance) {
            _dbInstance.close();
          }
          _dbInstance = null;
          _dbPromise = null;
        };
        
        resolve(_dbInstance);
      };
      request.onerror = () => {
        _dbInstance = null;
        _dbPromise = null;
        reject(request.error);
      };
      request.onblocked = () => {
        console.warn('[SheetDB] Database open blocked. Another connection may be preventing upgrade.');
        _dbPromise = null;
        reject(new Error('IndexedDB open blocked by another connection. Please ensure only one window is open.'));
      };
    } catch (e) {
      _dbInstance = null;
      _dbPromise = null;
      reject(e);
    }
  });

  // Clear the promise reference once resolved/rejected so future calls retry if needed
  _dbPromise.then(() => {
    _dbPromise = null;
  }).catch(() => {
    _dbPromise = null;
  });

  return _dbPromise;
}

/**
 * Execute a database operation with automatic retry on stale connections.
 * If the first attempt fails due to a stale connection, it will:
 * 1. Close and discard the old connection
 * 2. Open a fresh connection
 * 3. Retry the operation once
 */
async function withRetry(operation) {
  try {
    const db = await getDB();
    return await operation(db);
  } catch (err) {
    console.warn('[SheetDB] Operation failed. Attempting connection recovery and retry...', err);
    try {
      if (_dbInstance) _dbInstance.close();
    } catch (e) {
      console.warn('[SheetDB] Error closing connection for retry:', e);
    }
    _dbInstance = null;
    _dbPromise = null;
    
    try {
      const db = await getDB();
      return await operation(db);
    } catch (retryErr) {
      console.error('[SheetDB] Retry operation failed permanently:', retryErr);
      throw retryErr;
    }
  }
}

export async function getSheetData(key) {
  return withRetry((db) => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(DATA_STORE, 'readonly');
      const store = tx.objectStore(DATA_STORE);
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  });
}

export async function saveSheetData(key, data) {
  return withRetry((db) => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(DATA_STORE, 'readwrite');
      const store = tx.objectStore(DATA_STORE);
      store.put(data, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  });
}

export async function getSheetMeta(key) {
  return withRetry((db) => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(META_STORE, 'readonly');
      const store = tx.objectStore(META_STORE);
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result !== undefined ? request.result : null);
      request.onerror = () => reject(request.error);
    });
  });
}

export async function saveSheetMeta(key, value) {
  return withRetry((db) => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(META_STORE, 'readwrite');
      const store = tx.objectStore(META_STORE);
      store.put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  });
}

export async function deleteSheet(key) {
  return withRetry((db) => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction([DATA_STORE, META_STORE], 'readwrite');
      tx.objectStore(DATA_STORE).delete(key);
      tx.objectStore(META_STORE).delete(key);
      tx.objectStore(META_STORE).delete(`${key}_nextid`);
      tx.objectStore(META_STORE).delete(`${key}_columns`);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  });
}

export async function getAllSheets() {
  return withRetry((db) => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(DATA_STORE, 'readonly');
      const store = tx.objectStore(DATA_STORE);
      const request = store.getAllKeys();
      
      request.onsuccess = () => {
        const keys = request.result || [];
        const dataRequest = store.getAll();
        dataRequest.onsuccess = () => {
          const values = dataRequest.result || [];
          const result = {};
          keys.forEach((key, index) => {
            result[key] = values[index];
          });
          resolve(result);
        };
        dataRequest.onerror = () => reject(dataRequest.error);
      };
      request.onerror = () => reject(request.error);
    });
  });
}

export function resetDBConnection() {
  if (_dbInstance) {
    try {
      _dbInstance.close();
    } catch (e) {
      console.warn('[SheetDB] Error closing connection during reset:', e);
    }
    _dbInstance = null;
  }
  _dbPromise = null;
  console.log('[SheetDB] Database connection reset successfully.');
}
