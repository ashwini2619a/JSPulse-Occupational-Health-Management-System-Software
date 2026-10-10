const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');

app.setPath('userData', path.join(process.env.APPDATA, 'jspulse-ohms'));

app.whenReady().then(() => {
  const win = new BrowserWindow({
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  win.loadFile(path.join(__dirname, '../dist/index.html')).then(() => {
    win.webContents.executeJavaScript(`
      new Promise((resolve, reject) => {
        const req = indexedDB.open('JSPulseOHMS_Sheets', 1);
        req.onsuccess = (e) => {
          const db = e.target.result;
          try {
            const tx = db.transaction('sheet_data', 'readonly');
            const store = tx.objectStore('sheet_data');
            const getReq = store.get('cms_medicine_inventory');
            getReq.onsuccess = () => resolve(getReq.result ? getReq.result.data : []);
            getReq.onerror = () => resolve([]);
          } catch(err) {
            resolve([]);
          }
        };
        req.onerror = () => resolve([]);
      })
    `).then(data => {
      fs.writeFileSync('C:/Users/ashwi/Videos/movies/JSPL/medstock_dump.json', JSON.stringify(data, null, 2));
      console.log('Successfully dumped to medstock_dump.json');
      app.quit();
    }).catch(err => {
      console.error('Error executing JS:', err);
      app.quit();
    });
  });
});
