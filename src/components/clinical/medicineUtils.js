export const getMedicineStatus = (quantity, expiryDate) => {
  const qty = Number(quantity) || 0;
  
  if (expiryDate && new Date(expiryDate) < new Date()) {
    return 'Expired';
  }
  
  if (qty === 0) {
    return 'Out of Stock';
  } else if (qty >= 1 && qty <= 10) {
    return 'Low Stock';
  } else {
    return 'In Stock';
  }
};

export const generateMedicineId = (index) => {
  return `MED-${String(index + 1).padStart(3, '0')}`;
};
