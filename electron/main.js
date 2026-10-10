/* eslint-env node */
import { app, BrowserWindow, ipcMain, shell, dialog } from 'electron';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import fs from 'fs';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;

// Request single instance lock to prevent duplicate processes from locking the database
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    // Focus existing window if user attempts to run a second copy of the app
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

// Disable hardware acceleration to bypass slow GPU driver initialization on Windows systems
app.disableHardwareAcceleration();

function createWindow() {
  if (!gotTheLock) return; // Prevent window creation if we didn't get the lock
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: 'JSPulse OHMS',
    show: true, // Show instantly for faster response
    backgroundColor: '#0f172a', // Clean dark theme color matching the React app background
    icon: path.join(__dirname, process.env.NODE_ENV === 'development' ? '../public/logo.png' : '../dist/logo.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      plugins: true, // Enables native PDF viewer
      backgroundThrottling: false // Prevents intervals from freezing when minimized or screen turns off
    }
  });

  // Remove the default Windows menu (File, Edit, View, etc.)
  mainWindow.setMenuBarVisibility(false);

  // Toggle Developer Tools with F12 or Ctrl+Shift+I for diagnostics
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F12' || (input.control && input.shift && input.key.toLowerCase() === 'i')) {
      mainWindow.webContents.toggleDevTools();
      event.preventDefault();
    }
  });

  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
    // In development, load the Vite dev server
    mainWindow.loadURL('http://localhost:5173');
    // Open DevTools automatically in dev
    // mainWindow.webContents.openDevTools();
  } else {
    // In production, load the built index.html
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Maximize the window automatically
  mainWindow.maximize();

  // Nullify reference when window is closed to prevent stale access
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Ensure app runs gracefully when all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

const storagePath = path.join(app.getPath('userData'), 'localstorage.json');

// In-memory cache to avoid blocking file reads on every IPC call
let _storageCache = null;

// Helper to read storage file synchronously
function readStorage() {
  if (_storageCache !== null) return _storageCache;
  try {
    if (fs.existsSync(storagePath)) {
      _storageCache = JSON.parse(fs.readFileSync(storagePath, 'utf8'));
      return _storageCache;
    }
  } catch (e) {
    console.error('Error reading localstorage.json', e);
  }
  _storageCache = {};
  return _storageCache;
}

// Helper to write storage file synchronously
function writeStorage(data) {
  _storageCache = data;
  try {
    const dir = path.dirname(storagePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(storagePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error('Error writing localstorage.json', e);
  }
}

// Track temp PDF files for cleanup on exit
const _tempFiles = new Set();

app.whenReady().then(() => {
  createWindow();

  // Synchronous IPC handlers for custom desktop localStorage
  ipcMain.on('sync-storage-get', (event, key) => {
    const store = readStorage();
    event.returnValue = store[key] !== undefined ? store[key] : null;
  });

  ipcMain.on('sync-storage-set', (event, key, value) => {
    const store = readStorage();
    store[key] = value;
    writeStorage(store);
    event.returnValue = true;
  });

  ipcMain.on('sync-storage-remove', (event, key) => {
    const store = readStorage();
    delete store[key];
    writeStorage(store);
    event.returnValue = true;
  });

  ipcMain.on('sync-storage-clear', (event) => {
    writeStorage({});
    event.returnValue = true;
  });

  ipcMain.on('sync-storage-key', (event, index) => {
    const store = readStorage();
    const keys = Object.keys(store);
    event.returnValue = keys[index] !== undefined ? keys[index] : null;
  });

  ipcMain.on('sync-storage-length', (event) => {
    const store = readStorage();
    event.returnValue = Object.keys(store).length;
  });

  ipcMain.on('sync-storage-all', (event) => {
    event.returnValue = readStorage();
  });

  ipcMain.on('print-command', (event, options) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
      win.webContents.print({
        silent: false,
        printBackground: true,
        deviceName: '',
        landscape: options && options.landscape !== undefined ? options.landscape : true
      });
    }
  });

  ipcMain.handle('save-and-open-excel', async (event, { buffer, defaultName }) => {
    try {
      const win = BrowserWindow.fromWebContents(event.sender);
      const dialogOptions = {
        defaultPath: defaultName,
        filters: [{ name: 'Excel Workbook', extensions: ['xlsx'] }]
      };
      const { canceled, filePath } = win
        ? await dialog.showSaveDialog(win, dialogOptions)
        : await dialog.showSaveDialog(dialogOptions);

      if (!canceled && filePath) {
        fs.writeFileSync(filePath, Buffer.from(buffer));
        shell.openPath(filePath);
        return { success: true, filePath };
      }
      return { success: false, canceled: true };
    } catch (error) {
      console.error('save-and-open-excel failed:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.on('preview-print', async (event, options) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return;
    
    const isLandscape = options && options.landscape !== undefined ? options.landscape : true;
    
    try {
      const pdfData = await win.webContents.printToPDF({
        printBackground: true,
        pageSize: 'A4',
        landscape: isLandscape
      });
      
      const tempPath = path.join(os.tmpdir(), `print-preview-${Date.now()}.pdf`);
      fs.writeFileSync(tempPath, pdfData);
      _tempFiles.add(tempPath);
      
      // Try to open a dedicated preview window inside Electron
      try {
        const previewWin = new BrowserWindow({
          width: isLandscape ? 1100 : 850,
          height: isLandscape ? 750 : 950,
          title: 'Print Preview',
          parent: win,
          modal: false,
          autoHideMenuBar: true,
          webPreferences: {
            plugins: true, // Enables native PDF viewer in Chromium
            sandbox: true
          }
        });
        previewWin.loadURL(pathToFileURL(tempPath).toString());
        
        // Clean up temp file when preview window is closed
        previewWin.on('closed', () => {
          _tempFiles.delete(tempPath);
          try { fs.unlinkSync(tempPath); } catch { /* ignore */ }
        });
      } catch (previewErr) {
        // Fallback: open with system's default PDF viewer
        console.warn('Preview window failed, opening with system viewer:', previewErr);
        const err = await shell.openPath(tempPath);
        if (err) {
          // eslint-disable-next-line preserve-caught-error
          throw new Error(err);
        }
      }
    } catch (error) {
      console.error('Failed to generate preview, falling back to native print:', error);
      // Fallback to standard print dialog
      if (win && !win.isDestroyed()) {
        win.webContents.print({ silent: false, printBackground: true, landscape: isLandscape });
      }
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Clean up leaked temp files on exit
app.on('will-quit', () => {
  for (const f of _tempFiles) {
    try { fs.unlinkSync(f); } catch { /* ignore */ }
  }
});

// Protect against uncaught exceptions and unhandled promise rejections crashing the application
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception in Main Process:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
