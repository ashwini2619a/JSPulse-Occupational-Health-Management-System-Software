/* eslint-env node */
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  printCommand: (options) => ipcRenderer.send('print-command', options || {}),
  previewPrint: (options) => ipcRenderer.send('preview-print', options || {}),
  saveAndOpenExcel: (buffer, defaultName) => ipcRenderer.invoke('save-and-open-excel', { buffer, defaultName }),
  storageGet: (key) => ipcRenderer.sendSync('sync-storage-get', key),
  storageSet: (key, value) => ipcRenderer.sendSync('sync-storage-set', key, value),
  storageRemove: (key) => ipcRenderer.sendSync('sync-storage-remove', key),
  storageClear: () => ipcRenderer.sendSync('sync-storage-clear'),
  storageKey: (index) => ipcRenderer.sendSync('sync-storage-key', index),
  storageLength: () => ipcRenderer.sendSync('sync-storage-length'),
  storageAll: () => ipcRenderer.sendSync('sync-storage-all'),
  isElectron: true
});
