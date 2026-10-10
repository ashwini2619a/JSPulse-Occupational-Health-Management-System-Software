import * as XLSX from 'xlsx';

export const exportToExcel = async (data, columns, fileName = 'Export', forceDownload = false) => {
  if (!data || data.length === 0) return;

  // Dynamically map data to column labels
  const formattedData = data.map(item => {
    const rowObj = {};
    columns.forEach(col => {
      rowObj[col.label] = item[col.key] || '';
    });
    return rowObj;
  });

  // Convert JSON to Worksheet
  const worksheet = XLSX.utils.json_to_sheet(formattedData);

  // Auto-fit column widths
  const colWidths = columns.map(col => {
    const headerLen = col.label.length;
    const maxContentLen = formattedData.reduce((max, row) => {
      const val = row[col.label] ? row[col.label].toString().length : 0;
      return Math.max(max, val);
    }, headerLen);
    return { wch: maxContentLen + 2 }; 
  });
  worksheet['!cols'] = colWidths;

  // Freeze the first header row
  worksheet['!freeze'] = { xSplit: 0, ySplit: 1, topLeftCell: 'A2', activePane: 'bottomLeft', state: 'frozen' };

  // Create a new Workbook and append the worksheet
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

  // Generate timestamped filename
  const today = new Date().toISOString().split('T')[0];
  const finalFileName = `${fileName}_${today}.xlsx`;

  // Request Save Location Window
  try {
    const isElectron = navigator.userAgent.toLowerCase().includes('electron');
    if (isElectron && (window.electron || window['require'])) {
      const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      let result;
      if (window.electron) {
        result = await window.electron.saveAndOpenExcel(buffer, finalFileName);
      } else {
        const { ipcRenderer } = window['require']('electron');
        result = await ipcRenderer.invoke('save-and-open-excel', { 
          buffer: buffer, 
          defaultName: finalFileName 
        });
      }
      if (!result.success && !result.canceled) {
        throw new Error("Failed to save via IPC");
      }
    } else if (window.showSaveFilePicker && !forceDownload) {
      const opts = {
        suggestedName: finalFileName,
        types: [{
          description: 'Excel Workbook',
          accept: {'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']},
        }],
      };
      const handle = await window.showSaveFilePicker(opts);
      const writable = await handle.createWritable();
      
      const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      await writable.write(buffer);
      await writable.close();
    } else {
      // Fallback for unsupported browsers
      XLSX.writeFile(workbook, finalFileName);
    }
  } catch (err) {
    if (err.name !== 'AbortError' && err.message !== 'The user aborted a request.') {
      console.error(err);
      throw err;
    }
  }
};
