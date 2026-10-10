const STORAGE_KEY = 'medicine_inventory';

export const getMedicines = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error reading from localStorage', error);
    return [];
  }
};

export const saveMedicine = (medicine) => {
  try {
    const medicines = getMedicines();
    const newMedicine = {
      ...medicine,
      id: Date.now().toString(),
      addedAt: new Date().toISOString()
    };
    medicines.push(newMedicine);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(medicines));
    return newMedicine;
  } catch (error) {
    console.error('Error saving to localStorage', error);
    return null;
  }
};

export const deleteMedicine = (id) => {
  try {
    const medicines = getMedicines();
    const filtered = medicines.filter(m => m.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting from localStorage', error);
  }
};

export const getDispenseLogs = () => {
  try {
    const data = localStorage.getItem('dispensed_log');
    return data ? JSON.parse(data) : [];
  } catch (error) {
    return [];
  }
};

export const dispenseMedicine = (medicineId, quantityToDispense, patientName) => {
  try {
    const medicines = getMedicines();
    const index = medicines.findIndex(m => m.id === medicineId);
    if (index === -1) throw new Error('Medicine not found');
    
    const medicine = medicines[index];
    if (medicine.quantity < quantityToDispense) {
      throw new Error('Insufficient quantity in stock');
    }
    
    // Deduct quantity
    medicines[index].quantity -= quantityToDispense;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(medicines));
    
    // Log dispensing
    const logs = getDispenseLogs();
    logs.push({
      id: Date.now().toString(),
      medicineId,
      medicineName: medicine.name,
      dosage: medicine.dosage,
      quantity: quantityToDispense,
      patientName,
      date: new Date().toISOString()
    });
    localStorage.setItem('dispensed_log', JSON.stringify(logs));
    
    return true;
  } catch (error) {
    console.error('Error dispensing medicine', error);
    throw error;
  }
};

// --- First Aid Records ---
export const getFirstAidRecords = () => {
  try {
    const data = localStorage.getItem('first_aid_records');
    return data ? JSON.parse(data) : [];
  } catch (error) {
    return [];
  }
};

export const saveFirstAidRecord = (record) => {
  try {
    const records = getFirstAidRecords();
    const newRecord = { ...record, id: Date.now().toString() };
    records.push(newRecord);
    localStorage.setItem('first_aid_records', JSON.stringify(records));
    return newRecord;
  } catch (error) {
    console.error('Error saving first aid record', error);
    return null;
  }
};

export const deleteFirstAidRecord = (id) => {
  try {
    const records = getFirstAidRecords();
    const filtered = records.filter(r => r.id !== id);
    localStorage.setItem('first_aid_records', JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting first aid record', error);
  }
};

export const getPlantLocation = () => {
  return localStorage.getItem('plant_location') || 'Main Plant';
};

export const savePlantLocation = (location) => {
  localStorage.setItem('plant_location', location);
};
