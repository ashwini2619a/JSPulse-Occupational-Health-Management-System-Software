import React from 'react';
import ExcelGrid from './ExcelGrid';

const getExcelCol = (n) => {
  let s = '', t;
  while (n > 0) {
    t = (n - 1) % 26;
    s = String.fromCharCode(65 + t) + s;
    n = (n - t)/26 | 0;
  }
  return s || undefined;
};

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const columns = [
  { key: 'medicineName', label: 'Medicine', letter: 'A', width: 200, type: 'text', superGroup: 'BASIC DETAILS', group: 'Info' },
  { key: 'type', label: 'Type', letter: 'B', width: 100, type: 'select', options: ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Ointment', 'Drops', 'Other'], superGroup: 'BASIC DETAILS', group: 'Info' },
  { key: 'expiryDate', label: 'Expiry Date', letter: 'C', width: 120, type: 'date', superGroup: 'BASIC DETAILS', group: 'Info' },
  { key: 'composition', label: 'Molecule/Composition', letter: 'D', width: 200, type: 'text', superGroup: 'BASIC DETAILS', group: 'Info' },
  { key: 'initialBalance', label: 'Balance', letter: 'E', width: 120, type: 'number', superGroup: 'BASIC DETAILS', group: 'Stock' }
];

let colNum = 6;
months.forEach(m => {
  const prefix = m.substring(0, 3).toLowerCase();
  columns.push({
    key: `${prefix}_incoming`, label: 'Incoming', letter: getExcelCol(colNum++), width: 90, type: 'number', superGroup: m.toUpperCase(), group: 'Stock In'
  });
  columns.push({
    key: `${prefix}_outgoing`, label: 'Outgoing', letter: getExcelCol(colNum++), width: 90, type: 'number', superGroup: m.toUpperCase(), group: 'Stock Out'
  });
  columns.push({
    key: `${prefix}_balance`, label: 'Balance', letter: getExcelCol(colNum++), width: 90, type: 'number', readOnly: true, superGroup: m.toUpperCase(), group: 'Remaining'
  });
});

columns.push({ key: 'totalIncoming', label: 'Total Incoming', letter: getExcelCol(colNum++), width: 120, type: 'number', readOnly: true, superGroup: 'YEARLY TOTALS', group: 'Summary' });
columns.push({ key: 'totalOutgoing', label: 'Total Outgoing', letter: getExcelCol(colNum++), width: 120, type: 'number', readOnly: true, superGroup: 'YEARLY TOTALS', group: 'Summary' });
columns.push({ key: 'finalBalance', label: 'Final Balance', letter: getExcelCol(colNum++), width: 120, type: 'number', readOnly: true, superGroup: 'YEARLY TOTALS', group: 'Summary' });

const computeRow = (row) => {
  const newRow = { ...row };
  let runningBalance = Number(newRow.initialBalance) || 0;
  let yearlyIncoming = 0;
  let yearlyOutgoing = 0;

  months.forEach(m => {
    const prefix = m.substring(0, 3).toLowerCase();
    const incoming = Number(newRow[`${prefix}_incoming`]) || 0;
    const outgoing = Number(newRow[`${prefix}_outgoing`]) || 0;
    
    yearlyIncoming += incoming;
    yearlyOutgoing += outgoing;
    
    runningBalance = runningBalance + incoming - outgoing;
    newRow[`${prefix}_balance`] = runningBalance.toString();
  });

  newRow.totalIncoming = yearlyIncoming.toString();
  newRow.totalOutgoing = yearlyOutgoing.toString();
  newRow.finalBalance = runningBalance.toString();

  return newRow;
};

const initialData = [];

const getRowStyle = (row) => {
  // Highlight red if the current month's balance drops below 0
  const currentMonthPrefix = months[new Date().getMonth()].substring(0, 3).toLowerCase();
  if (row[`${currentMonthPrefix}_balance`] !== undefined && Number(row[`${currentMonthPrefix}_balance`]) < 0) {
    return { background: '#fef2f2', color: '#dc2626' };
  }
  return {};
};

const MonthlyBalance = () => {
  return (
    <div className="animate-fade-in" style={{ height: '100%' }}>
      <ExcelGrid 
        title="Yearly Medicine Ledger (Monthly Balance)"
        storageKey="cms_yearly_monthly_balance"
        initialData={initialData}
        columns={columns}
        idPrefix="MB-"
        getRowStyle={getRowStyle}
        computeRow={computeRow}
        filters={[]}
        showTotals={true}
      />
    </div>
  );
};

export default MonthlyBalance;
