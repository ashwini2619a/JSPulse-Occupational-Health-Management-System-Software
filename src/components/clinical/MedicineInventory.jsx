import React from 'react';
import MedicineConsumptionGrid from './MedicineConsumptionGrid';

const MedicineInventory = () => {
  return (
    <div className="animate-fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
      <MedicineConsumptionGrid />
    </div>
  );
};

export default MedicineInventory;
