import React, { useCallback } from 'react';
import ExcelGrid from './ExcelGrid';

const initialData = [];

const columns = [
  { key: 'medicine', label: 'Medicine', letter: 'A', width: 180, type: 'text' },
  { key: 'jan', label: 'Jan', letter: 'B', width: 60, type: 'number' },
  { key: 'janDate', label: 'Last Updated in Jan', letter: 'C', width: 160, type: 'date' },
  { key: 'janType', label: 'Type in Jan', letter: 'D', width: 110, type: 'select', options: ['Tablet', 'Syrup', 'Injection', 'Drops', 'Ointment', 'Other'] },
  { key: 'feb', label: 'Feb', letter: 'E', width: 60, type: 'number' },
  { key: 'febDate', label: 'Last Updated in Feb', letter: 'F', width: 160, type: 'date' },
  { key: 'febType', label: 'Type in Feb', letter: 'G', width: 110, type: 'select', options: ['Tablet', 'Syrup', 'Injection', 'Drops', 'Ointment', 'Other'] },
  { key: 'mar', label: 'Mar', letter: 'H', width: 60, type: 'number' },
  { key: 'marDate', label: 'Last Updated in Mar', letter: 'I', width: 160, type: 'date' },
  { key: 'marType', label: 'Type in Mar', letter: 'J', width: 110, type: 'select', options: ['Tablet', 'Syrup', 'Injection', 'Drops', 'Ointment', 'Other'] },
  { key: 'apr', label: 'Apr', letter: 'K', width: 60, type: 'number' },
  { key: 'aprDate', label: 'Last Updated in Apr', letter: 'L', width: 160, type: 'date' },
  { key: 'aprType', label: 'Type in Apr', letter: 'M', width: 110, type: 'select', options: ['Tablet', 'Syrup', 'Injection', 'Drops', 'Ointment', 'Other'] },
  { key: 'may', label: 'May', letter: 'N', width: 60, type: 'number' },
  { key: 'mayDate', label: 'Last Updated in May', letter: 'O', width: 160, type: 'date' },
  { key: 'mayType', label: 'Type in May', letter: 'P', width: 110, type: 'select', options: ['Tablet', 'Syrup', 'Injection', 'Drops', 'Ointment', 'Other'] },
  { key: 'jun', label: 'Jun', letter: 'Q', width: 60, type: 'number' },
  { key: 'junDate', label: 'Last Updated in Jun', letter: 'R', width: 160, type: 'date' },
  { key: 'junType', label: 'Type in Jun', letter: 'S', width: 110, type: 'select', options: ['Tablet', 'Syrup', 'Injection', 'Drops', 'Ointment', 'Other'] },
  { key: 'jul', label: 'Jul', letter: 'T', width: 60, type: 'number' },
  { key: 'julDate', label: 'Last Updated in Jul', letter: 'U', width: 160, type: 'date' },
  { key: 'julType', label: 'Type in Jul', letter: 'V', width: 110, type: 'select', options: ['Tablet', 'Syrup', 'Injection', 'Drops', 'Ointment', 'Other'] },
  { key: 'aug', label: 'Aug', letter: 'W', width: 60, type: 'number' },
  { key: 'augDate', label: 'Last Updated in Aug', letter: 'X', width: 160, type: 'date' },
  { key: 'augType', label: 'Type in Aug', letter: 'Y', width: 110, type: 'select', options: ['Tablet', 'Syrup', 'Injection', 'Drops', 'Ointment', 'Other'] },
  { key: 'sep', label: 'Sep', letter: 'Z', width: 60, type: 'number' },
  { key: 'sepDate', label: 'Last Updated in Sep', letter: 'AA', width: 160, type: 'date' },
  { key: 'sepType', label: 'Type in Sep', letter: 'AB', width: 110, type: 'select', options: ['Tablet', 'Syrup', 'Injection', 'Drops', 'Ointment', 'Other'] },
  { key: 'oct', label: 'Oct', letter: 'AC', width: 60, type: 'number' },
  { key: 'octDate', label: 'Last Updated in Oct', letter: 'AD', width: 160, type: 'date' },
  { key: 'octType', label: 'Type in Oct', letter: 'AE', width: 110, type: 'select', options: ['Tablet', 'Syrup', 'Injection', 'Drops', 'Ointment', 'Other'] },
  { key: 'nov', label: 'Nov', letter: 'AF', width: 60, type: 'number' },
  { key: 'novDate', label: 'Last Updated in Nov', letter: 'AG', width: 160, type: 'date' },
  { key: 'novType', label: 'Type in Nov', letter: 'AH', width: 110, type: 'select', options: ['Tablet', 'Syrup', 'Injection', 'Drops', 'Ointment', 'Other'] },
  { key: 'dec', label: 'Dec', letter: 'AI', width: 60, type: 'number' },
  { key: 'decDate', label: 'Last Updated in Dec', letter: 'AJ', width: 160, type: 'date' },
  { key: 'decType', label: 'Type in Dec', letter: 'AK', width: 110, type: 'select', options: ['Tablet', 'Syrup', 'Injection', 'Drops', 'Ointment', 'Other'] },
  { key: 'total', label: 'Total', letter: 'AL', width: 80, type: 'number' }
];

const AdvancedPatientRecords = () => {
  const computeRow = useCallback((row) => {
    const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    let total = 0;
    months.forEach(m => {
      total += parseInt(row[m]) || 0;
    });
    return { ...row, total: total.toString() };
  }, []);

  const handleDataChange = useCallback((newData) => {
    try {
      let balanceData = [];
      const rawBalance = localStorage.getItem('cms_yearly_monthly_balance');
      if (rawBalance) {
        const parsed = JSON.parse(rawBalance);
        if (Array.isArray(parsed)) {
          balanceData = parsed;
        }
      }
      const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
      
      let modified = false;

      newData.forEach(incRow => {
        if (!incRow.medicine || incRow.medicine.trim() === '') return;
        const medNameLower = incRow.medicine.toLowerCase().trim();
        
        let balanceRow = balanceData.find(b => (b.medicineName || '').toLowerCase().trim() === medNameLower);
        
        if (!balanceRow) {
          balanceRow = {
            id: 'MB-AUTO-' + Date.now() + Math.random().toString(36).substr(2, 5),
            medicineName: incRow.medicine,
            type: incRow.type || '',
            expiryDate: '',
            composition: '',
            initialBalance: '0'
          };
          months.forEach(m => {
            balanceRow[`${m}_incoming`] = '0';
            balanceRow[`${m}_outgoing`] = '0';
            balanceRow[`${m}_balance`] = '0';
          });
          balanceData.push(balanceRow);
          modified = true;
        }
        
        months.forEach(m => {
          const val = (parseInt(incRow[m]) || 0).toString();
          if (balanceRow[`${m}_incoming`] !== val) {
            balanceRow[`${m}_incoming`] = val;
            modified = true;
          }
        });

        if (modified) {
          let runningBalance = Number(balanceRow.initialBalance) || 0;
          let yearlyIncoming = 0;
          let yearlyOutgoing = 0;
          months.forEach(m => {
            const incoming = Number(balanceRow[`${m}_incoming`]) || 0;
            const outgoing = Number(balanceRow[`${m}_outgoing`]) || 0;
            yearlyIncoming += incoming;
            yearlyOutgoing += outgoing;
            runningBalance = runningBalance + incoming - outgoing;
            balanceRow[`${m}_balance`] = runningBalance.toString();
          });
          balanceRow.totalIncoming = yearlyIncoming.toString();
          balanceRow.totalOutgoing = yearlyOutgoing.toString();
          balanceRow.finalBalance = runningBalance.toString();
        }
      });

      if (modified) {
        localStorage.setItem('cms_yearly_monthly_balance', JSON.stringify(balanceData));
      }
    } catch (e) {
      console.error('Error syncing incoming meds to monthly balance:', e);
    }
  }, []);

  return (
    <div className="animate-fade-in" style={{ height: '100%' }}>
      <ExcelGrid 
        title="Medicine Incoming (Monthly Tracker)"
        storageKey="cms_medicine_incoming_data"
        initialData={initialData}
        columns={columns}
        idPrefix="MED-"
        computeRow={computeRow}
        onDataChange={handleDataChange}
      />
    </div>
  );
};

export default AdvancedPatientRecords;
