// Mock AI Image Analysis with Realistic Internet Data

export const analyzeMedicineImage = async (imageSrc) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // 25% chance to fail simulating "no medicine detected"
      if (Math.random() < 0.25) {
        reject(new Error("No valid pharmaceutical product detected in the field of view. Please ensure the medicine is clearly visible and well-lit."));
        return;
      }

      const mockMedicines = [
        {
          id: Date.now().toString() + '1',
          name: 'Tylenol Extra Strength',
          dosage: '500mg',
          type: 'Caplet',
          quantity: 100,
          expiry: '2026-08-01',
          // New detailed fields for the AI analysis report
          brandName: "Tylenol Extra Strength",
          genericName: "Acetaminophen 500mg",
          manufacturer: "McNeil Consumer Healthcare (Johnson & Johnson)",
          dosageForm: "Caplet (Solid oral)",
          identifiedCodes: "Lot: M12345, EXP 08/2026, NDC 50580-449-10",
          globalMatch: "RxNorm: 313782 (Acetaminophen 500 MG Oral Tablet)",
          confidenceLevel: "High - Clear text and standard packaging detected. No glare.",
          visualFlags: "None. Packaging appears intact and authentic.",
          imageUrl: "https://upload.wikimedia.org/wikipedia/commons/4/4e/Tylenol_bottle_closeup.jpg"
        },
        {
          id: Date.now().toString() + '2',
          name: 'Augmentin',
          dosage: '875mg/125mg',
          type: 'Tablet',
          quantity: 20,
          expiry: '2025-11-15',
          brandName: "Augmentin",
          genericName: "Amoxicillin 875mg / Clavulanate Potassium 125mg",
          manufacturer: "GlaxoSmithKline (GSK)",
          dosageForm: "Scored film-coated tablet",
          identifiedCodes: "Lot: 8B9V, EXP 11/2025, Barcode: 310719038147",
          globalMatch: "RxNorm: 580005 (Amoxicillin 875 MG / Clavulanate 125 MG Oral Tablet)",
          confidenceLevel: "High - Distinctive blister pack and logo identified.",
          visualFlags: "Slight crease on the foil back, but sealing is uncompromised.",
          imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Amoxicillin_875_mg_-_Clavulanic_acid_125_mg.jpg/800px-Amoxicillin_875_mg_-_Clavulanic_acid_125_mg.jpg"
        },
        {
          id: Date.now().toString() + '3',
          name: 'Lisinopril',
          dosage: '10mg',
          type: 'Tablet',
          quantity: 30,
          expiry: '2026-01-20',
          brandName: "Prinivil / Zestril (Generic)",
          genericName: "Lisinopril 10mg",
          manufacturer: "Lupin Pharmaceuticals",
          dosageForm: "Round, pink, scored tablet",
          identifiedCodes: "Imprint: LUPIN 10, Lot: 449012, EXP 01/2026",
          globalMatch: "RxNorm: 311354 (Lisinopril 10 MG Oral Tablet)",
          confidenceLevel: "Medium - Imprint is slightly worn but readable under processing.",
          visualFlags: "None. Standard pharmacy dispensing bottle.",
          imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Lisinopril_10_mg_tablets.jpg/800px-Lisinopril_10_mg_tablets.jpg"
        }
      ];
      
      let trainedMedicines = [];
      try {
        const stored = localStorage.getItem('trained_medicines');
        if (stored) trainedMedicines = JSON.parse(stored);
      } catch(e) {}
      
      const allMedicines = [...trainedMedicines, ...mockMedicines];
      const randomIndex = Math.floor(Math.random() * allMedicines.length);
      resolve(allMedicines[randomIndex]);
    }, 2500); 
  });
};
