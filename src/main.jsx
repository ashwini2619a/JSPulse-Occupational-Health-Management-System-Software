// Unregister any active service worker to prevent local asset caching bugs
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (let registration of registrations) {
      registration.unregister();
    }
  }).catch(err => console.warn('Service worker unregistration failed:', err));
}

// Global LocalStorage Safe Guard for non-Electron or fallback environments
try {
  const originalSetItem = Storage.prototype.setItem;
  Storage.prototype.setItem = function(key, value) {
    try {
      originalSetItem.call(this, key, value);
    } catch (e) {
      console.error('[Storage Safe] Native localStorage.setItem failed:', e);
    }
  };
} catch (e) {
  console.warn('[Storage Safe] Failed to patch Storage.prototype.setItem:', e);
}

// ----------------- Desktop Storage Override -----------------
// Overrides the standard window.localStorage with a persistent desktop file storage backend
// when running inside the Electron container, bypassing the 5MB browser quota.
if (window.electron && window.electron.isElectron) {
  const nativeLocalStorage = window.localStorage;

  // 1. One-time transparent migration of existing browser data to file storage
  try {
    const fileStorageLength = window.electron.storageLength();
    if (fileStorageLength === 0 && nativeLocalStorage && nativeLocalStorage.length > 0) {
      console.log('[Desktop Storage] Empty desktop database found. Migrating data from browser localStorage...');
      for (let i = 0; i < nativeLocalStorage.length; i++) {
        const key = nativeLocalStorage.key(i);
        const val = nativeLocalStorage.getItem(key);
        if (key && val !== null) {
          window.electron.storageSet(key, val);
        }
      }
      console.log('[Desktop Storage] Data migration completed successfully.');
    }
  } catch (err) {
    console.warn('[Desktop Storage] Error during data migration:', err);
  }

  // 1.5. Initialize the in-memory cache from desktop file storage
  let _cache = {};
  try {
    _cache = window.electron.storageAll() || {};
  } catch (e) {
    console.error('[Desktop Storage] Failed to initialize cache:', e);
  }

  // 2. Create the localStorage Proxy wrapper with in-memory caching to prevent synchronous file IO bottlenecks
  const customLocalStorage = new Proxy({}, {
    get(target, prop) {
      if (target === null) return undefined;
      if (prop === 'getItem') {
        return (key) => {
          const val = _cache[key];
          return val !== undefined ? val : null;
        };
      }
      if (prop === 'setItem') {
        return (key, value) => {
          const strVal = String(value);
          _cache[key] = strVal;
          try {
            window.electron.storageSet(key, strVal);
          } catch (e) {
            console.error('[Desktop Storage] setItem failed:', e);
          }
        };
      }
      if (prop === 'removeItem') {
        return (key) => {
          delete _cache[key];
          try {
            window.electron.storageRemove(key);
          } catch (e) {
            console.error('[Desktop Storage] removeItem failed:', e);
          }
        };
      }
      if (prop === 'clear') {
        return () => {
          Object.keys(_cache).forEach(k => delete _cache[k]);
          try {
            window.electron.storageClear();
          } catch (e) {
            console.error('[Desktop Storage] clear failed:', e);
          }
        };
      }
      if (prop === 'key') {
        return (index) => {
          const keys = Object.keys(_cache);
          return keys[index] !== undefined ? keys[index] : null;
        };
      }
      if (prop === 'length') {
        return Object.keys(_cache).length;
      }
      // Direct property access fallback (e.g., localStorage.someKey)
      if (typeof prop === 'string') {
        if (prop in Object.prototype) {
          return undefined;
        }
        return _cache[prop];
      }
      return undefined;
    },
    set(target, prop, value) {
      if (target === null) return false;
      if (typeof prop === 'string') {
        const strVal = String(value);
        _cache[prop] = strVal;
        try {
          window.electron.storageSet(prop, strVal);
        } catch (e) {
          console.error('[Desktop Storage] property set failed:', e);
        }
        return true;
      }
      return false;
    },
    deleteProperty(target, prop) {
      if (target === null) return false;
      if (typeof prop === 'string') {
        delete _cache[prop];
        try {
          window.electron.storageRemove(prop);
        } catch (e) {
          console.error('[Desktop Storage] property delete failed:', e);
        }
        return true;
      }
      return false;
    },
    ownKeys() {
      return Object.keys(_cache);
    },
    getOwnPropertyDescriptor(target, prop) {
      if (target === null) return undefined;
      if (prop in _cache) {
        return {
          value: _cache[prop],
          writable: true,
          enumerable: true,
          configurable: true
        };
      }
      return undefined;
    }
  });

  // 3. Override window.localStorage
  try {
    Object.defineProperty(window, 'localStorage', {
      value: customLocalStorage,
      configurable: true,
      writable: true,
      enumerable: true
    });
    console.log('[Desktop Storage] Successfully bypassed 5MB limit by routing localStorage to local file system.');
  } catch (e) {
    console.error('[Desktop Storage] Failed to override localStorage:', e);
  }
}
// -------------------------------------------------------------

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

const rootEl = document.getElementById('root');
if (rootEl) {
  createRoot(rootEl).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>,
  );
} else {
  console.error('[JSPulse OHMS] Fatal: Root element #root not found in document.');
}
