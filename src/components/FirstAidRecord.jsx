import React from 'react';
import ExcelGrid from './clinical/ExcelGrid';

const initialData = [];

const columns = [
  { key: 'id', label: 'Record ID', letter: 'A', width: 90, type: 'text' },
  { key: 'medicine', label: 'Medicine', letter: 'B', width: 200, type: 'text' },
  { key: 'type', label: 'Type', letter: 'C', width: 110, type: 'select', options: ['Tablet', 'Syrup', 'Injection', 'Drops', 'Ointment', 'Other'] },
  { key: 'packing', label: 'Packing', letter: 'D', width: 80, type: 'number' },
  { key: 'price', label: 'Price', letter: 'E', width: 90, type: 'number' },
  { key: 'pricePerUnit', label: 'Price/Unit', letter: 'F', width: 100, type: 'number' },
  { key: 'gst', label: 'GST %', letter: 'G', width: 80, type: 'number' },
  { key: 'totalPricePerUnit', label: 'Total/Unit', letter: 'H', width: 110, type: 'number' },
];

const computeRow = (row) => {
  const numPacking = parseFloat(row.packing) || 1;
  const numPrice = parseFloat(row.price) || 0;
  const numGst = parseFloat(row.gst) || 0;

  const pricePerUnit = numPrice / numPacking;
  const totalGstAmount = (numPrice * numGst) / 100;
  const totalPriceWithGst = numPrice + totalGstAmount;
  const totalPricePerUnit = totalPriceWithGst / numPacking;

  return {
    ...row,
    pricePerUnit: parseFloat(pricePerUnit.toFixed(2)),
    totalPricePerUnit: parseFloat(totalPricePerUnit.toFixed(2))
  };
};

const FirstAidRecord = () => {
  return (
    <div className="animate-fade-in" style={{ height: '100%' }}>
      <ExcelGrid 
        title="Billings & Financial Records"
        storageKey="cms_billings_data"
        initialData={initialData}
        columns={columns}
        idPrefix="BILL-"
        computeRow={computeRow}
      />
    </div>
  );
};

export default FirstAidRecord;
