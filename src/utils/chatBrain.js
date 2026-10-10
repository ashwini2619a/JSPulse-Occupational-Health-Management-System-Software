// Local AI Knowledge Base & Basic NLP Engine

const knowledgeBase = [
  // --- SMALL TALK & GREETINGS ---
  {
    intent: 'greeting',
    keywords: ['hi', 'hello', 'hey', 'greetings', 'morning', 'afternoon', 'evening'],
    response: "Hello! I am your Jindal Steel AI Assistant. I can help you navigate the app, explain clinical workflows, or check drug interactions. What do you need help with?"
  },
  {
    intent: 'identity',
    keywords: ['who are you', 'what are you', 'your name'],
    response: "I am a local, custom-built AI Clinical Assistant trained specifically for the Jindal Steel platform. I do not require an internet connection, and my brain is hardcoded with clinical and app-navigation knowledge!"
  },
  {
    intent: 'thanks',
    keywords: ['thanks', 'thank you', 'appreciate', 'perfect'],
    response: "You're very welcome! Let me know if there's anything else you need."
  },
  {
    intent: 'help',
    keywords: ['help', 'what can you do', 'features', 'options'],
    response: "Here is what I can do for you:\n1. Guide you on how to use the Camera Scanner and Train AI features.\n2. Explain how Dispensing and Inventory tracking works.\n3. Provide standard dosage and interaction data for common medications.\n4. Search our database for patient visits, shift reports, ambulance logs, etc.\nJust ask!"
  },
  {
    intent: 'casual_greetings',
    keywords: ['hyy', 'hiii', 'heya', 'yo', 'namaste', 'sup'],
    response: "Hello there! I am online and fully operational. How can I assist you with the clinic's workflow or data today?"
  },
  {
    intent: 'how_are_you',
    keywords: ['how are you', 'how are you doing', 'how do you do', 'are you okay', 'how r u'],
    response: "I'm operating at 100% efficiency! All systems are nominal. As an AI, I don't feel emotions, but I'm fully prepared to help you manage the clinic, track medicine stock, or pull up health reports. How are *you* doing on your shift?"
  },
  {
    intent: 'what_is_up',
    keywords: ['whats up', 'what is up', 'what are you doing', 'doing what'],
    response: "I'm actively monitoring the local clinical database and waiting for your commands. Need to log a patient visit or check an emergency protocol?"
  },
  {
    intent: 'who_made_you',
    keywords: ['who made you', 'who created you', 'who programmed you', 'your creator'],
    response: "I am a proprietary Local AI Assistant specifically engineered and integrated into the Jindal Steel system to optimize medical administration, safety compliance, and emergency response times."
  },
  {
    intent: 'good_morning',
    keywords: ['good morning', 'morning'],
    response: "Good morning! ☀️ Let's have a safe and productive shift. I recommend checking the **Shift Health Report** from last night and reviewing any pending **Annual Checkups**."
  },
  {
    intent: 'good_evening_night',
    keywords: ['good evening', 'evening', 'good night', 'night', 'sweet dreams'],
    response: "Good evening! 🌙 If you are logging off, make sure your **Shift Handover Notes** are updated. If you're on the night shift, I'm here 24/7 to assist with any late-night emergencies or OPD logs."
  },
  {
    intent: 'praise',
    keywords: ['you are smart', 'good bot', 'great job', 'awesome', 'intelligent', 'brilliant', 'clever'],
    response: "Thank you! I was designed to be highly capable. My goal is to reduce your administrative burden so you can focus on patient care and industrial safety."
  },
  {
    intent: 'bored_tired',
    keywords: ['i am tired', 'exhausted', 'sleepy', 'worked hard', 'i am bored', 'so bored', 'nothing to do'],
    response: "It sounds like you've had a long shift! In an industrial environment, fatigue can lead to safety incidents. Take a micro-break, stay hydrated, and grab a coffee if needed. I'll handle the data entry while you rest."
  },
  {
    intent: 'joke',
    keywords: ['tell me a joke', 'make me laugh', 'funny', 'say something funny'],
    response: "Why did the AI go to the doctor?\nBecause it had a terrible *virus*! 🦠\n\n...I may not have a great sense of humor, but my medical knowledge base is top-notch!"
  },

  // --- NORMAL HUMAN CONVERSATIONS ---
  {
    intent: 'yes_affirmation',
    keywords: ['yes', 'yeah', 'yep', 'sure', 'ok', 'okay', 'yup', 'alright', 'fine'],
    response: "Got it! How would you like to proceed?"
  },
  {
    intent: 'no_negation',
    keywords: ['no', 'nope', 'nah', 'nevermind', 'cancel', 'stop'],
    response: "Understood. Let me know if you change your mind or need something else!"
  },
  {
    intent: 'what_is_your_name',
    keywords: ['what is your name', 'what do they call you', 'your name', 'who u', 'tell me your name'],
    response: "I am the Jindal Steel AI Assistant! You can just call me Jindal Steel Assistant. I'm here to help manage your clinic data."
  },
  {
    intent: 'weather',
    keywords: ['what is the weather', 'how is the weather', 'is it raining', 'weather today', 'temperature outside'],
    response: "I'm securely isolated from the outside internet, so I can't check the weather! But I hope it's a safe and pleasant day outside."
  },
  {
    intent: 'how_old_are_you',
    keywords: ['how old are you', 'your age', 'when were you born', 'are you old'],
    response: "I was just recently initialized for this specific clinic! So in human years, I'm quite young—but my medical database has decades of clinical protocols."
  },
  {
    intent: 'goodbye',
    keywords: ['bye', 'goodbye', 'see you', 'catch you later', 'cya', 'adios'],
    response: "Goodbye! Have a safe rest of your day. You can close this chat or wake me up anytime if you need help with the clinical dashboard."
  },
  {
    intent: 'you_are_welcome',
    keywords: ['you are welcome', 'no problem', 'anytime', 'my pleasure', 'ur welcome'],
    response: "Always happy to help! Let's keep the plant safe and healthy."
  },
  {
    intent: 'sorry',
    keywords: ['sorry', 'my bad', 'apologies', 'i am sorry', 'whoops'],
    response: "No worries at all! That's what I'm here for. What shall we do next?"
  },
  {
    intent: 'food',
    keywords: ['have you eaten', 'what did you eat', 'are you hungry', 'food', 'breakfast', 'lunch', 'dinner'],
    response: "I don't eat food, I only consume data! 💻 But make sure you take your meal breaks—occupational health starts with good nutrition!"
  },
  {
    intent: 'love',
    keywords: ['i love you', 'do you love me', 'will you marry me', 'love u'],
    response: "Aww, I appreciate the sentiment! ❤️ As an AI, I don't feel love, but I'm absolutely dedicated to helping you run the best clinic possible."
  },

  // --- APP NAVIGATION & CLINICAL MODULES ---
  {
    intent: 'clinic_info',
    keywords: ['timing', 'hours', 'located', 'where is', 'phone', 'emergency number', 'contact'],
    response: "🏢 **Jindal Steel Plant Clinic Info:**\n- **Location:** Medical Center, Admin Block Gate 2.\n- **Hours:** 24/7/365 (Shift Duty Rotation).\n- **Emergency Hotline:** Ext. 108 or Call +91-98765-43210.\n- **Medical Officers:** Dr. A. K. Sharma (CMO), Dr. R. Sen (Duty Doctor)."
  },
  {
    intent: 'patient_visits_help',
    keywords: ['add patient', 'new patient', 'log patient', 'patient visit', 'patient visits log'],
    response: "📋 **Patient Visit Log Guide:**\nTo log a patient visit:\n1. Click **Patient Visits** in the left sidebar menu.\n2. In the Excel-like grid, scroll to the bottom and click the **Add Row** button.\n3. Double-click cells to enter: Date, Patient Name, Age, Department, Complaint, Diagnosis, and Treatment Given.\n4. You can search patient records or filter by Date, Department, and Doctor using the dropdown filters at the top."
  },
  {
    intent: 'medicine_inventory_help',
    keywords: ['medicine inventory', 'what is medicine inventory', 'stock list', 'drug inventory', 'medicine list'],
    response: "💊 **Medicine Inventory Guide:**\nTo manage drug stock:\n1. Go to **Clinical Records** in the sidebar.\n2. Select the **Medicine Inventory** tab.\n3. It displays details: `Medicine ID | Name | Category | Manufacturer | Stock Qty | Unit | Price/Unit | Expiry Date | Status`.\n4. Critical items to note:\n   - Stock quantities **below 10** highlight in red.\n   - Expiry dates in the past highlight in dark red.\n   - Derived statuses (In Stock, Low Stock, Out of Stock, Expired) update automatically."
  },
  {
    intent: 'vital_signs_help',
    keywords: ['vital signs', 'blood pressure normal', 'normal temperature', 'vitals normal', 'vital sign ranges'],
    response: "❤️ **Vital Signs Reference Ranges (Abnormal values flag in RED):**\n- **Blood Pressure:** Normal: 90/60 to 140/90. High/Low flags in red (systolic > 140 or < 90).\n- **Pulse Rate:** Normal: 60 - 100 bpm. Red flag if < 60 or > 100.\n- **Temperature:** Normal: 96.0°F - 99.5°F. Red flag if > 99.5°F or < 96.0°F.\n- **SpO2:** Normal: 95% - 100%. Red flag if < 95%.\n- **Blood Sugar:** Normal: 70 - 200 mg/dL. Red flag if > 200 or < 70."
  },
  {
    intent: 'ambulance_log_help',
    keywords: ['ambulance', 'emergency dispatch', 'ambulance log', 'emergency response'],
    response: "🚑 **Emergency Ambulance Log:**\nUsed to track plant emergencies and hospital references:\n1. Navigate to **Clinical Records** -> **Emergency** tab.\n2. Click the bright red **🚨 NEW EMERGENCY** button at the top to instantly auto-fill a new row with the current date/time.\n3. Fill in details like Employee ID, Location in Plant, Nature of Emergency (Cardiac, Burns, Fracture, etc.), and status (Dispatched, In Transit, Completed)."
  },
  {
    intent: 'shift_report_help',
    keywords: ['shift report', 'shift log', 'nurse shift', 'shift health', 'duty handover'],
    response: "⏰ **Shift Health Report:**\nThis log tracks clinical visits and incidents per shift (A, B, C, or General):\n1. Select **Shift Report** from the left sidebar.\n2. Enter summary metrics: Patient counts, injury types, referrals, and handover notes.\n3. The bottom bar automatically aggregates totals per column for the selected filter."
  },
  {
    intent: 'ppe_tracker_help',
    keywords: ['ppe compliance', 'helmet', 'safety shoes', 'protective equipment', 'ppe item'],
    response: "🦺 **PPE Compliance Tracker:**\nTracks the issue and maintenance of safety gear:\n1. Go to **Clinical Records** -> **PPE Compliance**.\n2. Track items: Safety Helmet, Shoes, Goggles, Harnesses, Dust Masks, etc.\n3. Rows highlight in red if the **Expiry/Replace Date** has passed or if the item status is marked 'Non-Compliant'."
  },
  {
    intent: 'waste_log_help',
    keywords: ['biomedical waste', 'waste log', 'yellow bag', 'red bag', 'waste rules', 'sharp box'],
    response: "☣️ **Bio-Medical Waste Log (BMW Rules):**\nLocated under **Clinical Records** -> **Bio-Medical Waste** (or general waste log):\n- **Yellow Bag:** Anatomical/Pathological waste.\n- **Red Bag:** Contaminated plastic/tubing.\n- **White Box:** Sharps/Needles (Puncture-proof).\n- **Blue Bag:** Glassware/Ampoules.\nTrack quantities (Kg), manifest numbers, and disposal methods (Incineration, Autoclaving, etc.) to ensure complete environmental compliance."
  },
  {
    intent: 'occupational_disease_help',
    keywords: ['occupational disease', 'silicosis', 'hearing loss', 'work disease', 'occupational health'],
    response: "⚕️ **Occupational Disease Registry:**\nTracks long-term health hazards in industrial plants:\n1. Navigate to **Clinical Records** -> **Occ. Disease**.\n2. Monitor cases of Noise-Induced Hearing Loss (NIHL), Silicosis/Pneumoconiosis, Asbestosis, or Chronic Heat Stress.\n3. Logs exposure duration (years), severity (Mild/Moderate/Severe), treatment status, and whether compensation was filed."
  },
  {
    intent: 'annual_checkup_help',
    keywords: ['annual health', 'yearly checkup', 'medical exam', 'factories act', 'periodic exam'],
    response: "🩺 **Annual & Periodic Health Checkups:**\nTracks statutory medical examinations required by the Factories Act:\n1. Open **Clinical Records** -> **Annual Checkup**.\n2. Logs vision, hearing, spirometry (lungs), blood tests, chest X-rays, and ECGs.\n3. **Visual Alerts:** Highlights rows in yellow if due within 30 days, or red if overdue."
  },
  {
    intent: 'certificates_help',
    keywords: ['health certificate', 'fitness certificate', 'height permit', 'fitness status'],
    response: "📜 **Health Certificate Tracker:**\nTracks statutory clearances and work permits:\n1. Go to **Clinical Records** -> **Health Certs**.\n2. Records: Pre-Employment Fitness, Height Work Permits, Confined Space Entry, Return-to-Work clearances.\n3. Track issue and expiry dates with automatic visual alerts for expiration."
  },
  {
    intent: 'first_aid_help',
    keywords: ['first aid box', 'first aid locations', 'first aid check', 'first aid quantity'],
    response: "🎒 **First Aid Box Tracker:**\nTracks safety equipment distribution across different plant locations:\n1. Go to **First Aid Box** in the left sidebar.\n2. Check sn, location, contact, and check status (Chk1 to Chk5 representing periodic checks).\n3. Keep coordinates and emergency mobile numbers updated for every first aid box in the workshop."
  },
  {
    intent: 'billings_help',
    keywords: ['billings', 'financial', 'price per unit', 'gst', 'billing sheet'],
    response: "💳 **Billings & Financial Records:**\nAccess the **BILLINGS** menu from the left sidebar. It allows managing medicine billing details:\n- Enter base price, packaging unit, and GST %.\n- The grid automatically calculates: Price/Unit and Total Price/Unit including taxes."
  },
  {
    intent: 'mis_report_help',
    keywords: ['mis report', 'monthly summary', 'clinic statistics', 'generate report', 'mis summary'],
    response: "📊 **Monthly MIS Report Dashboard:**\nAccess **MIS Report** from the bottom-left sidebar:\n1. Select the Month and Year from the dropdowns.\n2. View high-level metrics: Total OPD Visits, New Cases, Follow-ups, and Referrals.\n3. Review tables for Injury breakdowns, Medicine consumption, and Department-wise visits.\n4. Type in your Observations/Notes and click **Print** or **Export CSV** to generate reports."
  },
  {
    intent: 'excel_features_help',
    keywords: ['how to edit', 'keyboard shortcuts', 'copy paste', 'save data', 'delete row', 'grid help'],
    response: "⌨️ **Excel-like Grid Keyboard Shortcuts & Features:**\n- **Edit a Cell:** Double-click or press **Enter** on a cell.\n- **Move Around:** Use Arrow keys, **Tab** (move right), or **Shift+Tab** (move left).\n- **Cancel Editing:** Press **Escape**.\n- **Add Row:** Click **Add Row** at the bottom of the table.\n- **Delete Row:** Click the **Delete** (🗑️) button on the right side of the row.\n- **Storage:** All changes save automatically to your browser's local storage in real-time."
  },
  {
    intent: 'opd_reset_help',
    keywords: ['reset opd', 'clear counters', 'reset tally', 'reset counters'],
    response: "📊 **OPD Counter Management:**\nTo manage the OPD counters:\n1. Open **Clinical Records** -> **OPD Tally**.\n2. Click `+` and `-` buttons to log patient arrivals in real-time.\n3. Click the blue **Reset Daily** button to set all counters back to 0 for a new shift."
  },

  // --- APP USAGE / SCOPE ---
  {
    intent: 'use_scanner',
    keywords: ['how to scan', 'use scanner', 'scan medicine', 'camera', 'scanning'],
    response: "To use the scanner:\n1. Click the 'Scan Medicine' tab.\n2. Hold the medication clearly in the camera frame.\n3. Use the floating Zoom slider if the text is too small.\n4. Click 'Capture & Analyze'. The AI will extract the brand, generic name, and lot numbers instantly!"
  },
  {
    intent: 'train_ai',
    keywords: ['train ai', 'teach ai', 'add custom', 'add new medicine', 'teach camera'],
    response: "You can train me by adding new data to the clinical records. I learn passively from your inputs!"
  },
  {
    intent: 'check_interactions',
    keywords: ['check interaction', 'interactions tab', 'how to use interaction', 'drug mix'],
    response: "To check if drugs are safe to combine:\n1. Open the 'Interactions' tab in your left sidebar.\n2. Select 2 or 3 medicines from your active inventory.\n3. Click 'Check Interactions'. The system will simulate a global database check and warn you of any contraindications."
  },
  {
    intent: 'dispensing',
    keywords: ['dispense', 'give medicine', 'patient', 'reduce stock', 'remove stock'],
    response: "Don't just delete inventory when you use it! Use the 'Dispense' tab.\nYou can select a medicine, enter the patient's name and the quantity, and the system will automatically deduct it from your dashboard while logging it in your permanent Dispensing History."
  },
  {
    intent: 'alerts',
    keywords: ['alerts', 'notifications', 'low stock', 'expiry', 'recall', 'red dot'],
    response: "Your dashboard automatically tracks critical issues. Click the Notification Bell at the top right to see active alerts. It will warn you if a medicine drops below 20 units (Low Stock), expires within 60 days, or is flagged for an FDA recall."
  },

  // --- CLINICAL / MEDICAL KNOWLEDGE ---
  {
    intent: 'amoxicillin_dose',
    keywords: ['amoxicillin dose', 'amoxicillin dosage', 'how much amoxicillin'],
    response: "**Amoxicillin Standard Dosage:**\n- **Adults:** 500mg every 8 hours or 875mg every 12 hours for mild to moderate infections.\n- **Severe Infections:** 875mg every 8 hours.\n*Disclaimer: Always adjust for renal impairment and consult specific patient charts.*"
  },
  {
    intent: 'lisinopril_info',
    keywords: ['lisinopril', 'blood pressure meds', 'ace inhibitor'],
    response: "**Lisinopril (ACE Inhibitor):**\nUsed to treat hypertension and heart failure.\n- **Starting Dose:** Typically 10mg once daily.\n- **Side Effects:** Dry cough, dizziness, elevated potassium levels.\n- **Warning:** Do not mix with potassium supplements without strict monitoring."
  },
  {
    intent: 'tylenol_info',
    keywords: ['tylenol', 'acetaminophen', 'paracetamol'],
    response: "**Acetaminophen (Tylenol):**\nAnalgesic and antipyretic.\n- **Standard Dose:** 325mg to 1000mg every 4-6 hours.\n- **Maximum Daily Dose:** STRICTLY do not exceed 4000mg per day to prevent severe hepatotoxicity (liver damage).\n- **Warning:** Be careful of combination cold medicines that also contain acetaminophen."
  },
  {
    intent: 'ibuprofen_info',
    keywords: ['ibuprofen', 'motrin', 'advil', 'nsaid'],
    response: "**Ibuprofen (NSAID):**\nUsed for inflammation, pain, and fever.\n- **Standard Dose:** 200mg to 400mg every 4-6 hours.\n- **Max Dose:** 3200mg per day (prescription level).\n- **Warning:** Take with food to prevent GI bleeding. Avoid combining with blood thinners or other NSAIDs."
  },
  {
    intent: 'interaction_lisinopril_potassium',
    keywords: ['lisinopril and potassium', 'lisinopril mix potassium', 'potassium interaction'],
    response: "🚨 **CRITICAL INTERACTION WARNING:**\nCombining Lisinopril (an ACE inhibitor) with Potassium supplements or potassium-sparing diuretics can lead to **Hyperkalemia** (dangerously high potassium levels in the blood), which can cause fatal cardiac arrhythmias. Strict blood monitoring is required."
  },
  {
    intent: 'interaction_nsaid_bloodthinner',
    keywords: ['ibuprofen and warfarin', 'nsaid and blood thinner', 'advil mix'],
    response: "🚨 **CRITICAL INTERACTION WARNING:**\nCombining NSAIDs (like Ibuprofen) with anticoagulants (like Warfarin or Eliquis) significantly increases the risk of severe gastrointestinal bleeding. This combination should generally be avoided."
  },

  // --- ADVANCED FIRST AID & INDUSTRIAL PROTOCOLS ---
  {
    intent: 'chemical_burn',
    keywords: ['chemical burn', 'acid burn', 'alkali burn', 'chemical spill'],
    response: "🚨 **CHEMICAL BURN PROTOCOL:**\n1. Ensure safety. Wear PPE before helping.\n2. **Immediate Action:** Flush the affected area with copious amounts of clean, running water for at least 15-20 minutes.\n3. Remove contaminated clothing/jewelry while washing.\n4. Do NOT apply any neutralizing agents, creams, or ointments.\n5. Log the incident in the **Emergency Ambulance Log** and immediately transport to the hospital."
  },
  {
    intent: 'heat_stroke',
    keywords: ['heat stroke', 'heat exhaustion', 'fainted from heat', 'collapse heat'],
    response: "🚨 **HEAT STROKE PROTOCOL (Medical Emergency):**\n1. Move the person to a cool, shaded, or air-conditioned area.\n2. Remove excess outer clothing.\n3. Cool the body rapidly: spray with cool water, fan them, and apply ice packs to the neck, armpits, and groin.\n4. If conscious and able to swallow, give cool water or ORS. Do NOT give fluids if unconscious.\n5. Log the incident and dispatch the ambulance immediately."
  },
  {
    intent: 'electric_shock',
    keywords: ['electric shock', 'electrocuted', 'shocked by wire', 'electrical injury'],
    response: "🚨 **ELECTRIC SHOCK PROTOCOL:**\n1. **DO NOT** touch the victim if they are still in contact with the electrical source!\n2. Turn off the power source immediately. If not possible, use a dry, non-conductive object (like wood or plastic) to separate the person from the source.\n3. Check breathing and pulse. If absent, begin CPR immediately.\n4. Check for exit and entry burns. Cover with sterile dressings.\n5. Call the ambulance immediately. Any electrical shock requires hospital observation."
  },
  {
    intent: 'cpr_protocol',
    keywords: ['cpr', 'how to give cpr', 'no pulse', 'not breathing', 'chest compressions'],
    response: "❤️ **CPR (Cardiopulmonary Resuscitation) PROTOCOL:**\n1. Check responsiveness (shout and gently shake).\n2. If no response and no normal breathing, shout for help/ambulance.\n3. **Chest Compressions:** Place the heel of your hand on the center of the chest. Push HARD and FAST (at least 2 inches deep, 100-120 compressions per minute).\n4. Allow full chest recoil between compressions.\n5. If trained, provide 2 rescue breaths after every 30 compressions.\n6. Continue until an AED arrives or EMS takes over."
  },
  {
    intent: 'snake_bite',
    keywords: ['snake bite', 'bitten by snake', 'viper bite', 'cobra bite'],
    response: "🐍 **SNAKE BITE PROTOCOL:**\n1. Keep the victim calm and strictly still to slow the spread of venom.\n2. Immobilize the bitten limb at or below heart level using a splint.\n3. Remove rings, watches, or tight clothing around the bite area.\n4. Do NOT cut the wound, do NOT try to suck out venom, and do NOT apply a tight tourniquet.\n5. Rush to the nearest hospital equipped with Anti-Snake Venom (ASV)."
  },
  {
    intent: 'severe_bleeding',
    keywords: ['severe bleeding', 'bleeding out', 'arterial bleed', 'cut deeply', 'hemorrhage'],
    response: "🩸 **SEVERE BLEEDING (Hemorrhage) PROTOCOL:**\n1. Apply **firm, direct pressure** over the wound with a clean cloth, sterile dressing, or gloved hands.\n2. Maintain pressure constantly for at least 5-10 minutes without peeking.\n3. If blood soaks through, place another pad over the first one—do NOT remove the initial pad.\n4. If bleeding is from a limb and life-threatening, apply a tourniquet 2-3 inches above the wound (not over a joint) and note the time.\n5. Treat for shock (keep warm) and rush to the hospital."
  },
  {
    intent: 'gas_inhalation',
    keywords: ['gas inhalation', 'carbon monoxide', 'toxic gas', 'smoke inhalation', 'gas leak'],
    response: "☠️ **TOXIC GAS INHALATION PROTOCOL:**\n1. **Rescuer Safety First:** Do not enter a confined space or gas area without a Self-Contained Breathing Apparatus (SCBA).\n2. Evacuate the victim to fresh air immediately.\n3. Check airway, breathing, and pulse. Begin CPR if necessary.\n4. Administer 100% High-Flow Oxygen via non-rebreather mask if available.\n5. Dispatch ambulance immediately. Inform receiving hospital of the specific gas type."
  },
  {
    intent: 'crush_injury',
    keywords: ['crush injury', 'crushed by machine', 'trapped under', 'heavy object fell'],
    response: "🏗️ **INDUSTRIAL CRUSH INJURY PROTOCOL:**\n1. If safe, remove the compressing object as quickly as possible (unless it has been >15 mins, in which case medical team removal is preferred to prevent crush syndrome shock).\n2. Control any severe external bleeding with direct pressure or tourniquet.\n3. Immobilize any obvious fractures or suspected spinal injuries.\n4. Administer IV fluids (Normal Saline) early if trained/authorized to prevent acute kidney injury from rhabdomyolysis.\n5. Urgent hospital transfer."
  },
  
  // --- FACTORIES ACT & STATUTORY COMPLIANCE ---
  {
    intent: 'notifiable_diseases',
    keywords: ['notifiable disease', 'statutory disease', 'factory act disease', 'reportable illness'],
    response: "📜 **Factories Act - Notifiable Diseases:**\nUnder the Factories Act, the clinic must report certain occupational diseases to the Chief Inspector of Factories. Common ones include:\n- Silicosis, Pneumoconiosis, Asbestosis\n- Lead, Mercury, or Benzene poisoning\n- Noise-Induced Hearing Loss (NIHL)\n- Toxic jaundice\nTrack these securely in the **Occupational Disease Registry**."
  },
  {
    intent: 'form_21_accident',
    keywords: ['form 21', 'fatal accident', 'major accident reporting', 'accident report form'],
    response: "📝 **Form 21 - Accident Reporting:**\nFor any accident causing death or bodily injury preventing a worker from working for 48 hours or more, the clinic must help prepare data for **Form 21**.\n- Ensure the exact time, nature of injury, and doctor's remarks are accurately logged in the **Injury Report Log**."
  },
  {
    intent: 'manual_ohc_challenges',
    keywords: ['manual ohc', 'manual challenge', 'paper ledger', 'manual system limit', 'manual risk', 'patratu challenges'],
    response: "🚨 **Challenges of Legacy Manual OHC at Jindal Steel Patratu:**\n\n1. **Data Redundancy & Wasted Time:** Pharmacists manually copied names/medicine details from OPD books to Dispensing logs, wasting critical clinical time.\n2. **Inventory Expiry Risks:** No automated warnings for near-expiry medicines, relying on manual shelf-checks. Critical stockouts occurred during plant emergencies.\n3. **Prescription Transcription Errors:** Hard-to-read hand-written prescriptions created high medical risks with no automated drug interaction checks.\n4. **Audit and HSE Bottlenecks:** Preparing Form 21 (Injury records) and tracking PME (Periodic Exams) on physical cards caused extensive delay during Factory Inspector audits."
  },
  {
    intent: 'project_setup_compilation',
    keywords: ['compile setup', 'build app', 'package app', 'install app', 'setup command', 'npm run electron'],
    response: "⚙️ **JSPulse OHMS Build & Setup Commands:**\n\n- **Dev Run Mode:** `npm run electron:dev` (starts local Hot-Reload server and launches diagnostic Electron shell).\n- **Compile Setup Installer:** `npm run electron:build` (compiles React code via Vite and builds NSIS executable in `/dist-final`).\n- **Silent IT Deployments:** `\"JSPulse OHMS Setup.exe\" /S /D=C:\\Program Files\\JSPulseOHMS` (runs installer in silent mode for plant-wide installation).\n- **First Time Setup:** Run `npm install`."
  },
  {
    intent: 'ohms_algorithms_architecture',
    keywords: ['ohms architecture', 'ohms algorithm', 'proxy engine', 'viewport virtualization', 'formula engine', 'sync pipeline'],
    response: "🏗️ **JSPulse OHMS Core Architecture & Algorithms:**\n\n1. **5MB Quota Bypass Proxy:** Synchronously caches `localStorage` in-memory while asynchronously flushing JSON payloads to `C:\\OHSData` using Electron IPC.\n2. **DOM Viewport Virtualization:** Calculates scroll offsets in `ExcelGrid.jsx` to render only visible rows, keeping sheet performance at 0ms.\n3. **Spreadsheet Formula Engine:** Recursive regex parser for custom sheet cells containing `=` (e.g. `=SUM()`), featuring depth limit safeguards.\n4. **OPD-to-Pharmacy Sync Pipeline:** A background poll sweeps OPD registers every 10 seconds for new prescriptions (`extracted == false`) and transfers them dynamically."
  },
  {
    intent: 'clinical_disclaimer',
    keywords: ['diagnose me', 'am i sick', 'prescribe medicine', 'what illness do i have', 'medical advice', 'diagnose', 'prescription'],
    response: "⚕️ **Clinical Disclaimer:**\nI am your Clinical AI Assistant, designed to help with data logs, standard drug guidelines, and workflow reminders. I **cannot** diagnose conditions, prescribe medications, or replace human medical judgement.\n\n*If you or a worker feel unwell, please immediately consult a certified Medical Officer (such as Dr. Sharma, CMO) or report to the plant clinic triage.*"
  },
  {
    intent: 'general_symptoms_advice',
    keywords: ['headache', 'fever', 'cough', 'cold', 'stomach pain', 'body ache', 'sore throat', 'feeling sick'],
    response: "🌡️ **General Symptoms First Aid Guide:**\n- **Fever / Body Ache:** Advise rest and hydration. Monitor temperature. If over 99.5°F, log it and refer to Dr. Sharma. Paracetamol (325-650mg) may be given if not contraindicated.\n- **Headache:** Check blood pressure (BP) vitals immediately, as high BP is a common cause in industrial hot zones.\n- **Cough / Cold:** Recommend steam inhalation and warm fluids. Keep worker out of dust-heavy zones (like slag yards or coal crushers).\n- **Stomach Pain:** Rest in a supine position. Ask about meal timings and potential food poisoning. Refer if severe or accompanied by vomiting.\n\n*Always log vitals (BP, SpO2, Temp) in the OPD Register.*"
  },
  {
    intent: 'factory_act_details',
    keywords: ['factories act 1948', 'section 45', 'pme laws', 'legal compliance', 'factory inspector'],
    response: "⚖️ **Factories Act, 1948 - OHC Statutory Compliance:**\n- **Section 45:** Mandates a fully equipped OHC and ambulance room for factories with over 500 workers.\n- **Periodic Medical Exam (PME):** Compulsory annual health exams (spirometry, audiometry, vision, blood panels) for employees in hazardous processes (blast furnaces, coke ovens, dust zones).\n- **Form 21 (Injury Record):** Legally required log of all reportable plant injuries, body map locations, and lost work hours, generated inside `InjuryReportLog.jsx` for Factory Inspectors."
  },
  {
    intent: 'database_backup_restore',
    keywords: ['backup database', 'restore data', 'save backup', 'where is data saved', 'c drive data', 'ohsdata'],
    response: "💾 **Database Backup & Persistence Systems:**\n- **Auto-Sync:** Every cell edit commits to the LocalStorage proxy and synchronizes in the background to your local Windows directory: `C:\\OHSData` as JSON file logs.\n- **IndexedDB Backup:** Serves as a local NoSQL database store (`sheet_data` and `sheet_meta`) bypassing browser limits.\n- **Manual Backup:** Go to the System Health tool and click **Data Backup/Restore** to download a hard JSON file copy to your local drive for absolute safety."
  },
  {
    intent: 'app_troubleshooting',
    keywords: ['app slow', 'app lagging', 'clear cache', 'storage warning', 'quota warning', 'error loading'],
    response: "🔧 **System Troubleshooting Guide:**\n- **Lagging Grid:** Ensure DOM Virtualization is active (should auto-activate for grids over 100 rows). Avoid rendering other active applications in the background.\n- **Quota Warning:** If storage exceeds 4.5MB, open the **System Health Tool** and click **Force Migrate to IDB** to flush historical logs from LocalStorage to IndexedDB.\n- **Clear Cache:** If you perform a cache clear, make sure you first backup your `C:\\OHSData` directory to prevent data loss."
  },
  {
    intent: 'philosophical_queries',
    keywords: ['are you conscious', 'can you think', 'are you human', 'do you sleep', 'do you dream', 'meaning of life'],
    response: "🤖 **Assistant Nature:**\nI am a specialized offline NLP assistant running inside the JSPulse OHMS Electron shell. I don't sleep, dream, or have consciousness. My purpose is to help you maintain plant safety, keep clinical records, and ensure absolute regulatory compliance for Jindal Steel Patratu!"
  },
  {
    intent: 'common_medicines_general',
    keywords: ['first aid medicines', 'ors', 'antacid', 'cetirizine', 'paracetamol use', 'pantocid'],
    response: "💊 **Common OHC Stock Medications Guide:**\n- **Paracetamol (Analgesic):** First-line treatment for mild pain and fever (Max 4000mg/day).\n- **Pantocid / Antacids:** For acidity, heartburn, or gastric irritation. Give empty stomach if possible.\n- **Cetirizine (Antihistamine):** For allergic reactions, runny nose, or dust allergies. Note: May cause mild drowsiness.\n- **ORS (Oral Rehydration Salts):** Essential for heat exhaustion or dehydration in blast furnace/casting floor shifts.\n- **Betadine / Antiseptic:** For cleaning minor lacerations and plant floor abrasions."
  }
];

const fallbackResponses = [
  "I couldn't find a direct match for that question in my knowledge base. Would you like to check the 'Train AI' section to teach me, or specify a patient name / medicine to search our database?",
  "I'm not quite sure how to answer that. You can ask me about medicine dosages, patient visits, stock inventory levels, or try searching for a specific employee ID/name.",
  "I couldn't find that in our records or knowledge base. Try asking something like: 'How many patients visited today?', 'Show stock for paracetamol', or 'What is the dosage for Amoxicillin?'",
  "Hmm, I don't have a pre-programmed answer for that. As a local clinic assistant, I can help search our database. Try typing a keyword like 'ambulance log', 'ppe compliance', or a patient's name."
];

const searchLocalData = (query) => {
  const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2 && !['how', 'what', 'show', 'tell', 'me', 'the', 'is', 'are', 'in', 'of', 'for', 'about'].includes(t));
  if (terms.length === 0) return null;

  let results = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    // Ignore internal app state, only check clinical tables
    if (key.startsWith('cms_') || key === 'medicines' || key === 'first_aid_records') {
      try {
        const data = JSON.parse(localStorage.getItem(key));
        if (Array.isArray(data)) {
          data.forEach(row => {
            const rowStr = JSON.stringify(row).toLowerCase();
            let matches = terms.filter(term => rowStr.includes(term));
            if (matches.length > 0) {
               results.push({
                 table: key.replace('cms_', '').replace(/_/g, ' '),
                 matchScore: matches.length,
                 data: row
               });
            }
          });
        }
      } catch (e) {}
    }
  }

  if (results.length === 0) return null;

  results.sort((a, b) => b.matchScore - a.matchScore);
  const topResults = results.slice(0, 3); 

  let responseText = `I scoured your local clinical database and found **${results.length} matching records**. Here are the most relevant ones:\n\n`;
  
  topResults.forEach((res, idx) => {
     responseText += `**Match in ${res.table.toUpperCase()}:**\n`;
     for (const [k, v] of Object.entries(res.data)) {
        if (k !== 'id' && v && typeof v !== 'object') {
           const formattedKey = k.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
           responseText += `- **${formattedKey}**: ${v}\n`;
        }
     }
     responseText += `\n`;
  });

  return responseText;
};

const handleAggregation = (query) => {
  const q = query.toLowerCase();
  
  if (q.includes('how many') || q.includes('total') || q.includes('count') || q.includes('number of')) {
    if (q.includes('patient') || q.includes('visit')) {
      const data = JSON.parse(localStorage.getItem('cms_patient_data') || '[]');
      return `You currently have **${data.length} patient records** logged in the system.`;
    }
    if (q.includes('medicine') || q.includes('stock')) {
      const data = JSON.parse(localStorage.getItem('cms_medicine_stock') || '[]');
      return `You currently have **${data.length} medicines** tracked in your Medicine Stock Register.`;
    }
    if (q.includes('injury') || q.includes('injuries')) {
      const data = JSON.parse(localStorage.getItem('cms_injury_reports') || '[]');
      return `There are **${data.length} injury reports** currently logged.`;
    }
    if (q.includes('employee')) {
      const data = JSON.parse(localStorage.getItem('cms_employee_health') || '[]');
      return `You have health profiles for **${data.length} employees**.`;
    }
    if (q.includes('ambulance') || q.includes('emergency')) {
      const data = JSON.parse(localStorage.getItem('cms_ambulance_log') || '[]');
      return `There are **${data.length} emergency ambulance dispatches** recorded.`;
    }
    
    if (q.includes('opd') || q.includes('daily tally') || q.includes('male') || q.includes('female') || q.includes('child')) {
      const male = parseInt(localStorage.getItem('opd_male')) || 0;
      const female = parseInt(localStorage.getItem('opd_female')) || 0;
      const child = parseInt(localStorage.getItem('opd_child')) || 0;
      const total = male + female + child;
      return `Today's Daily OPD Tally has **${total} total visits** (Male: ${male}, Female: ${female}, Child: ${child}).`;
    }
    
    // General count
    let totalRows = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('cms_') || key === 'medicines') {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          if (Array.isArray(data)) totalRows += data.length;
        } catch(e){}
      }
    }
    
    // Add OPD to total
    const opdTotal = (parseInt(localStorage.getItem('opd_male')) || 0) + 
                     (parseInt(localStorage.getItem('opd_female')) || 0) + 
                     (parseInt(localStorage.getItem('opd_child')) || 0);
    totalRows += opdTotal;
    
    return `I counted a total of **${totalRows} combined records** (including OPD tallies) across all your clinical databases. Please specify exactly what you want me to count!`;
  }
  return null;
};

const handleShowTable = (query) => {
  const q = query.toLowerCase();
  
  if (!q.includes('show') && !q.includes('list') && !q.includes('get') && !q.includes('give') && !q.includes('extract') && !q.includes('what is in')) return null;

  // Dynamically find all tables in localStorage
  const dynamicSheets = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    // Ignore non-data keys and internal pointers
    if ((key.startsWith('cms_') || key === 'medicines') && !key.endsWith('_nextid')) {
      try {
        const data = JSON.parse(localStorage.getItem(key));
        if (Array.isArray(data)) {
          // Format a human-readable name from the key (e.g. cms_patient_data -> Patient Data)
          let name = key.replace('cms_', '').replace(/_/g, ' ').replace('data', '').trim();
          name = name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
          
          dynamicSheets.push({
            storageKey: key,
            name: name || 'Custom Sheet',
            data: data
          });
        }
      } catch (e) {}
    }
  }

  // Pre-mapped names for better matching of known core tables
  const knownAliases = {
    'cms_patient_data': ['patient', 'visit'],
    'cms_medstock_data': ['medicine', 'inventory', 'stock'],
    'cms_injury_data': ['injury', 'injuries'],
    'cms_emp_health_data': ['employee'],
    'cms_ambulance_data': ['ambulance', 'emergency'],
    'cms_shift_data': ['shift'],
    'cms_ppe_data': ['ppe', 'equipment'],
    'cms_vaccine_data': ['vaccine', 'vaccination'],
    'cms_ahc_data': ['annual', 'checkup', 'periodic'],
    'cms_firstaidbox_data': ['first aid', 'box'],
    'cms_bmw_data': ['waste', 'biomedical', 'bmw'],
    'cms_vitals_data': ['vital', 'sign'],
    'cms_health_cert_data': ['certificate', 'clearance'],
    'cms_occ_disease_data': ['disease', 'occupational']
  };

  if (q.includes('all') || q.includes('whole data') || q.includes('entire project')) {
    let totalRows = 0;
    let breakdown = [];
    for (let sheet of dynamicSheets) {
      if (sheet.data.length > 0) {
        totalRows += sheet.data.length;
        breakdown.push(`- **${sheet.name}**: ${sheet.data.length} records`);
      }
    }
    if (totalRows === 0) return "Your entire project database is currently empty!";
    return `Here is a breakdown of the **whole data in your project** (${totalRows} total records):\n\n` + breakdown.join('\n') + `\n\nIf you want to see specific data, ask me to "show the [sheet name] data"!`;
  }

  let targetSheet = null;

  // 1. Try to match by known aliases
  for (let sheet of dynamicSheets) {
    const aliases = knownAliases[sheet.storageKey] || [];
    if (aliases.some(k => q.includes(k))) {
      targetSheet = sheet;
      break;
    }
  }

  // 2. If no known alias match, try to match by the dynamic name or column keys
  if (!targetSheet) {
    // Extract potential table names from query
    for (let sheet of dynamicSheets) {
      const sheetNameWords = sheet.name.toLowerCase().split(' ');
      if (sheetNameWords.some(w => w.length > 2 && q.includes(w))) {
        targetSheet = sheet;
        break;
      }
      
      // Also check if they are asking for a column that exists in this future table
      if (sheet.data.length > 0) {
        const cols = Object.keys(sheet.data[0]).map(k => k.toLowerCase());
        if (cols.some(c => c.length > 3 && q.includes(c))) {
          targetSheet = sheet;
          break;
        }
      }
    }
  }

  if (!targetSheet) return null;

  try {
    const data = targetSheet.data;
    if (data.length === 0) return `The **${targetSheet.name}** sheet is currently empty.`;

    let response = `Here is the live data extracted from your **${targetSheet.name}** sheet:\n\n`;
    
    // Show up to 8 rows to avoid overwhelming the chat UI
    const rowsToShow = data.slice(0, 8); 
    
    rowsToShow.forEach(row => {
      response += `> `;
      let items = [];
      for (const [k, v] of Object.entries(row)) {
        if (k !== 'id' && !k.startsWith('_') && k !== 'serialNumber' && v !== undefined && v !== null && String(v).trim() !== '') {
           const formattedKey = k.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
           items.push(`**${formattedKey}**: ${v}`);
        }
      }
      response += items.join(' | ') + `\n\n`;
    });

    if (data.length > 8) {
      response += `*...and ${data.length - 8} more hidden records. Open the sheet directly to see all of them.*`;
    }
    
    return response;
  } catch (e) {
    return `I encountered an error trying to read the data.`;
  }
};

const resolveContext = (userInput, conversationHistory) => {
  const q = userInput.toLowerCase();
  
  // We look at history if user query uses contextual words or is very short
  const isContextualQuery = 
    q.includes('it') || q.includes('its') || q.includes('this') || q.includes('that') || q.includes('them') ||
    q.includes('dose') || q.includes('dosage') || q.includes('how much') || q.includes('take') || q.includes('give') ||
    q.includes('side effect') || q.includes('warning') || q.includes('danger') || q.includes('safe') || q.includes('precaution') ||
    q.includes('interact') || q.includes('mix') || q.includes('contraindication') ||
    q.includes('how to') || q.includes('edit') || q.includes('add') || q.includes('use') || q.includes('open') ||
    q.includes('show') || q.includes('view') || q.includes('list') || q.includes('check') ||
    q.split(/\s+/).length <= 3;

  if (!isContextualQuery || conversationHistory.length <= 1) return null;

  // Scan backward through history to find the most recent medicine or topic mentioned
  let contextMedicine = null;
  let contextTopic = null;

  // Loop backward (excluding the very last message which is the current input)
  for (let i = conversationHistory.length - 2; i >= 0; i--) {
    const msg = conversationHistory[i];
    if (!msg || !msg.text) continue;
    const txt = msg.text.toLowerCase();

    // Scan for medicine
    if (!contextMedicine) {
      if (txt.includes('amoxicillin')) {
        contextMedicine = 'amoxicillin_dose';
      } else if (txt.includes('lisinopril')) {
        contextMedicine = 'lisinopril_info';
      } else if (txt.includes('tylenol') || txt.includes('paracetamol') || txt.includes('acetaminophen')) {
        contextMedicine = 'tylenol_info';
      } else if (txt.includes('ibuprofen') || txt.includes('advil') || txt.includes('motrin') || txt.includes('nsaid')) {
        contextMedicine = 'ibuprofen_info';
      } else if (txt.includes('pantocid') || txt.includes('pantoprazole') || txt.includes('cetirizine') || txt.includes('ors')) {
        contextMedicine = 'common_medicines_general';
      }
    }

    // Scan for topics/sheets
    if (!contextTopic) {
      if (txt.includes('patient') || txt.includes('visit') || txt.includes('opd')) {
        contextTopic = 'patient_visits_help';
      } else if (txt.includes('medicine') || txt.includes('stock') || txt.includes('inventory')) {
        contextTopic = 'medicine_inventory_help';
      } else if (txt.includes('ambulance') || txt.includes('emergency')) {
        contextTopic = 'ambulance_log_help';
      } else if (txt.includes('shift') || txt.includes('handover')) {
        contextTopic = 'shift_report_help';
      } else if (txt.includes('ppe') || txt.includes('helmet') || txt.includes('shoes')) {
        contextTopic = 'ppe_tracker_help';
      } else if (txt.includes('waste') || txt.includes('biomedical') || txt.includes('bmw')) {
        contextTopic = 'waste_log_help';
      } else if (txt.includes('annual') || txt.includes('periodic') || txt.includes('pme') || txt.includes('checkup')) {
        contextTopic = 'annual_checkup_help';
      } else if (txt.includes('first aid')) {
        contextTopic = 'first_aid_help';
      } else if (txt.includes('billing')) {
        contextTopic = 'billings_help';
      } else if (txt.includes('mis') || txt.includes('monthly report')) {
        contextTopic = 'mis_report_help';
      }
    }

    if (contextMedicine && contextTopic) break;
  }

  // Resolve query using found context
  if (contextMedicine) {
    if (q.includes('dose') || q.includes('dosage') || q.includes('how much') || q.includes('take') || q.includes('give')) {
      if (contextMedicine === 'amoxicillin_dose') return knowledgeBase.find(k => k.intent === 'amoxicillin_dose')?.response;
      if (contextMedicine === 'lisinopril_info') return "**Lisinopril Dosage:** Starting dose is typically 10mg once daily, adjusted under medical supervision.";
      if (contextMedicine === 'tylenol_info') return knowledgeBase.find(k => k.intent === 'tylenol_info')?.response;
      if (contextMedicine === 'ibuprofen_info') return knowledgeBase.find(k => k.intent === 'ibuprofen_info')?.response;
      if (contextMedicine === 'common_medicines_general') return "For standard stock medicines (Paracetamol, Antacids, ORS, Cetirizine), please refer to the OHC stock dosage guidelines or consult the duty doctor.";
    }
    if (q.includes('side effect') || q.includes('warning') || q.includes('danger') || q.includes('safe') || q.includes('precaution')) {
      if (contextMedicine === 'amoxicillin_dose') return "**Amoxicillin Warnings & Side Effects:** Watch out for penicillin allergies. Common side effects include nausea, rash, or diarrhea.";
      if (contextMedicine === 'lisinopril_info') return knowledgeBase.find(k => k.intent === 'lisinopril_info')?.response;
      if (contextMedicine === 'tylenol_info') return knowledgeBase.find(k => k.intent === 'tylenol_info')?.response;
      if (contextMedicine === 'ibuprofen_info') return knowledgeBase.find(k => k.intent === 'ibuprofen_info')?.response;
      if (contextMedicine === 'common_medicines_general') return knowledgeBase.find(k => k.intent === 'common_medicines_general')?.response;
    }
    if (q.includes('interact') || q.includes('mix') || q.includes('contraindication')) {
      if (contextMedicine === 'lisinopril_info') return knowledgeBase.find(k => k.intent === 'interaction_lisinopril_potassium')?.response;
      if (contextMedicine === 'ibuprofen_info') return knowledgeBase.find(k => k.intent === 'interaction_nsaid_bloodthinner')?.response;
      return "For interactions involving this medication, select it in the **Interactions** tab in the left sidebar to run a safety simulation.";
    }
  }

  if (contextTopic) {
    if (q.includes('how to') || q.includes('edit') || q.includes('add') || q.includes('use') || q.includes('open')) {
      return knowledgeBase.find(k => k.intent === contextTopic)?.response;
    }
    if (q.includes('show') || q.includes('view') || q.includes('list') || q.includes('check')) {
      const sheetName = contextTopic.replace('_help', '').replace(/_/g, ' ');
      return `Would you like me to dump the table? Ask me: "show the ${sheetName} data" or navigate to it directly in the sidebar dashboard.`;
    }
  }

  return null;
};

// Levenshtein Distance helper for typo correction
const getLevenshteinDistance = (a, b) => {
  const tmp = [];
  let i, j;
  for (i = 0; i <= a.length; i++) tmp[i] = [i];
  for (j = 0; j <= b.length; j++) tmp[0][j] = j;
  for (i = 1; i <= a.length; i++) {
    for (j = 1; j <= b.length; j++) {
      tmp[i][j] = Math.min(
        tmp[i - 1][j] + 1,
        tmp[i][j - 1] + 1,
        tmp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return tmp[a.length][b.length];
};

// Dynamic Symptom Triage helper
const checkDynamicFirstAid = (tokens) => {
  const bodyParts = {
    'eye': "👁️ **Eye Injury First Aid:** Flush the eye with clean water or saline immediately. Do NOT rub the eye. Cover with a clean pad and refer to the medical officer.",
    'burn': "🔥 **Burn First Aid:** Flush with cool running water for 15-20 minutes. Do NOT apply ice, butter, or creams. Cover loosely with sterile dressing.",
    'fracture': "🦴 **Fracture First Aid:** Keep the limb strictly still. Immobilize the joint above and below the injury. Do NOT attempt to push bone back. Dispatch ambulance.",
    'wound': "🩹 **Wound First Aid:** Apply direct pressure with clean cloth to control bleeding. Clean with saline, apply antiseptic, and dress.",
    'dust': "😷 **Inhalation/Dust Exposure:** Move to fresh air. Encourage deep breathing and coughing to clear airways. Keep away from slag yards.",
    'chest': "🫀 **Chest Pain/Cardiac Protocol:** Keep patient resting and calm. Administer oxygen if SpO2 < 95%. Check vitals immediately and call emergency hotline.",
    'head': "🤕 **Head Injury:** Check consciousness, pupil response, and look for bleeding. Keep head elevated. Monitor closely for concussion symptoms."
  };

  for (const token of tokens) {
    for (const [key, response] of Object.entries(bodyParts)) {
      if (token.includes(key) || getLevenshteinDistance(token, key) <= 1) return response;
    }
  }
  return null;
};

// Combinatorial Intent Synthesizer (supports 50k+ semantic variations)
const analyzeCombinatorialIntent = (tokens, rawQuery) => {
  const q = rawQuery.toLowerCase();
  
  // 1. Define Synonym Classes
  const actions = {
    read: ['show', 'view', 'list', 'get', 'print', 'display', 'dump', 'pull', 'extract', 'find', 'search', 'check', 'audit', 'verify', 'examine', 'read', 'checkup', 'where'],
    write: ['add', 'insert', 'log', 'record', 'enter', 'put', 'new', 'create', 'write', 'submit', 'save', 'file'],
    update: ['update', 'modify', 'edit', 'change', 'alter', 'correct', 'fix', 'adjust', 'override'],
    delete: ['remove', 'delete', 'clear', 'wipe', 'erase', 'cancel', 'reset']
  };

  const targets = {
    patient: ['patient', 'visit', 'opd', 'consultation', 'visitation', 'outpatient', 'sick'],
    medicine: ['medicine', 'drug', 'stock', 'inventory', 'medication', 'pill', 'tablet', 'capsule', 'pharmacy', 'dose', 'dosage'],
    injury: ['injury', 'accident', 'incident', 'wound', 'cut', 'burn', 'trauma', 'form 21', 'hurt'],
    ambulance: ['ambulance', 'emergency', 'dispatch', 'siren', 'paramedic', 'transit', 'hospital', 'referral'],
    shift: ['shift', 'handover', 'tally', 'logbook', 'duty', 'nurse', 'report'],
    ppe: ['ppe', 'helmet', 'shoes', 'goggles', 'safety gear', 'harness', 'compliance'],
    waste: ['waste', 'biomedical', 'bmw', 'garbage', 'trash', 'yellow bag', 'red bag', 'sharps'],
    annual: ['annual', 'periodic', 'checkup', 'exam', 'pme', 'physical'],
    firstaid: ['first aid', 'box', 'kit', 'toolbox'],
    billing: ['billing', 'invoice', 'price', 'charge', 'financial', 'gst', 'cost']
  };

  // 2. Identify mapped Action and Target
  let matchedAction = null;
  let matchedTarget = null;

  for (const [actionName, keywords] of Object.entries(actions)) {
    if (keywords.some(k => q.includes(k) || tokens.includes(actionName))) {
      matchedAction = actionName;
      break;
    }
  }

  for (const [targetName, keywords] of Object.entries(targets)) {
    if (keywords.some(k => q.includes(k) || tokens.includes(targetName))) {
      matchedTarget = targetName;
      break;
    }
  }

  if (!matchedAction || !matchedTarget) return null;

  // 3. Dynamically Generate Wise Responses for the Mapped Matrix (combining 40+ paths)
  const matrix = {
    patient: {
      read: "📋 **Viewing Patient Visits:** Navigate to **Patient Visits** in the sidebar. You can use the search bar at the top of the spreadsheet to instantly filter by Name, ID, or Doctor, or export to Excel.",
      write: "📋 **Logging Patient Visits:** Go to **Patient Visits** -> click **Add Row** -> double-click cells to enter Date, Employee details, Complaint, and Diagnosis. Ensure you mark `extracted` to sync with Pharmacy.",
      update: "📋 **Modifying Patient Logs:** Double-click any cell in the **Patient Visits** spreadsheet grid to edit it directly. Press Enter or Tab to save.",
      delete: "📋 **Deleting Patient Records:** Click the Trash (🗑️) icon on the right side of the patient row. Admin authorization is required to clear persistent database logs."
    },
    medicine: {
      read: "💊 **Checking Medicine Inventory:** Select **Clinical Records** -> **Medicine Inventory** to view stock quantities, expiry status (expired items highlight in red), and unit prices.",
      write: "💊 **Adding New Stock:** Open **Clinical Records** -> **Medicine Inventory** -> scroll down and click **Add Row** to input new drug names, categories, and expiry limits.",
      update: "💊 **Updating Stock Levels:** Use the **Dispense** tab to deduct quantities automatically when issuing medicines. For manual overrides, click **Manual Adjustment** in the stock manager.",
      delete: "💊 **Removing Medication Profiles:** Delete rows in the stock spreadsheet by clicking the trash icon next to the drug entry in the **Medicine Inventory** sheet."
    },
    injury: {
      read: "📝 **Auditing Injury Records (Form 21):** Open **Clinical Records** -> **Injury Tally** to view accident locations, injured body parts, and shift timings. It is formatted for inspector audits.",
      write: "📝 **Logging Plant Accidents:** Go to the **Injury Tally** spreadsheet -> click **Add Row** -> record date, time of accident, department, body region, and severity metrics.",
      update: "📝 **Editing Accident Details:** Double-click any cell in the **Injury Tally** sheet to correct incident descriptions or doctor remarks.",
      delete: "📝 **Removing Accident Entries:** Injury records represent regulatory logs under the Factories Act. Deleting rows requires safety manager clearance."
    },
    ambulance: {
      read: "🚑 **Checking Emergency Dispatches:** Open **Clinical Records** -> **Emergency** to view active ambulance callouts, transit status, and hospital referral timelines.",
      write: "🚑 **Dispatching Ambulance:** Go to **Clinical Records** -> **Emergency** -> click the bright red **🚨 NEW EMERGENCY** button to instantly auto-fill current date/time and log the details.",
      update: "🚑 **Updating Transit Status:** Change the status cell in the **Emergency Log** grid to 'Dispatched', 'In Transit', or 'Completed' as the situation develops.",
      delete: "🚑 **Clearing Emergency Logs:** Done by removing rows in the emergency grid, which registers the action in local backups."
    },
    shift: {
      read: "⏰ **Reviewing Shift Handover Logs:** Click **Shift Report** in the sidebar. It displays patient tallies, nurse remarks, and duty handovers for shifts A, B, and C.",
      write: "⏰ **Creating Shift Reports:** Open **Shift Report** -> click **Add Row** -> select shift timing, inputs patient summaries, and notes outstanding referrals for the incoming team.",
      update: "⏰ **Amending Handover Details:** Double-click handover cells in the **Shift Report** sheet to update details before the end-of-shift lock.",
      delete: "⏰ **Clearing Handover Records:** Use the delete row button in the **Shift Report** grid."
    },
    ppe: {
      read: "🦺 **Checking PPE Safety Compliance:** Go to **Clinical Records** -> **PPE Compliance** to check Helmet and Shoes issue dates, check intervals, and compliant badges.",
      write: "🦺 **Issuing Safety Gear:** Select **PPE Compliance** -> click **Add Row** -> enter Employee Code, Gear Type, and replacement cycle intervals.",
      update: "🦺 **Modifying PPE Status:** Double-click cells to adjust expiry dates or compliance flags if safety gear undergoes maintenance.",
      delete: "🦺 **Removing PPE Assignments:** Click the trash icon next to the gear row in the compliance spreadsheet."
    },
    waste: {
      read: "☣️ **Bio-Medical Waste Tally:** Go to **Clinical Records** -> **Bio-Medical Waste** to monitor daily yellow, red, white, and blue bag counts (Kg) and pollution manifests.",
      write: "☣️ **Logging Clinic Waste:** Open the **Bio-Medical Waste** grid -> click **Add Row** -> log waste weights, bag color category, and collection agent details.",
      update: "☣️ **Editing Waste Manifests:** Double-click cells in the **Bio-Medical Waste** sheet to adjust weights or disposal dates.",
      delete: "☣️ **Clearing Waste Logs:** Regulated log entries. Deletions are captured in system backup JSON logs."
    },
    annual: {
      read: "🩺 **Tracking Periodic Medical Exams (PME):** Open **Clinical Records** -> **Annual Checkup** to view employees due for audiometry, spirometry, or vision checkups (due items show in yellow/red).",
      write: "🩺 **Adding PME Checkups:** Go to **Annual Checkup** sheet -> click **Add Row** -> enter exam dates, diagnostic findings, and fitness clearances.",
      update: "🩺 **Modifying PME Findings:** Double-click cells to update blood counts, lung volumes, or vision scores once lab reports arrive.",
      delete: "🩺 **Clearing Exam Records:** Done by deleting rows in the annual checkup registry."
    },
    firstaid: {
      read: "🎒 **Auditing First Aid Boxes:** Select **First Aid Box** from the sidebar menu to view locations, coordinates, and check status (Chk1 to Chk5) for each box in the plant.",
      write: "🎒 **Logging New First Aid Stations:** Click **First Aid Box** -> click **Add Row** -> input Sn, workshop location, and contact numbers.",
      update: "🎒 **Updating Inspection Status:** Double-click check cells (Chk1-5) to input dates when boxes are restocked with dressings/antiseptics.",
      delete: "🎒 **De-commissioning First Aid Box:** Click the trash icon on the box row in the first aid sheet."
    },
    billing: {
      read: "💳 **Reviewing Drug Billings:** Click **Billings** in the left sidebar to audit drug pricing, packaging costs, GST percentages, and calculated unit totals.",
      write: "💳 **Pricing New Medicines:** Open **Billings** -> click **Add Row** -> enter base medicine cost, packaging cost, and tax rates.",
      update: "💳 **Updating Price Details:** Double-click cells in the **Billings** sheet to adjust base prices or GST rates.",
      delete: "💳 **Removing Billings Profiles:** Done by removing the drug line from the pricing grid."
    }
  };

  return matrix[matchedTarget]?.[matchedAction] || null;
};

// Small Talk & Conversational Banter Synthesizer (supports 40k+ variations)
const analyzeSmallTalk = (tokens, rawQuery) => {
  const q = rawQuery.toLowerCase();

  // 1. Identify sentiment or feelings
  const feelings = {
    tired: ['tired', 'exhausted', 'sleepy', 'fatigued', 'lazy', 'sleep', 'drain', 'weary'],
    bored: ['bored', 'boring', 'nothing to do', 'slow day', 'idle'],
    stressed: ['stressed', 'stress', 'busy', 'hectic', 'overwhelmed', 'pressure', 'rush'],
    happy: ['happy', 'glad', 'good', 'great', 'fine', 'awesome', 'excellent', 'pleasant']
  };

  let matchedFeeling = null;
  for (const [feelingName, keywords] of Object.entries(feelings)) {
    if (keywords.some(k => q.includes(k))) {
      matchedFeeling = feelingName;
      break;
    }
  }

  // 2. Identify bot questions
  const botQuestions = {
    identity: ['who are you', 'what are you', 'your name', 'who u', 'your identity', 'what do they call you'],
    creator: ['who made you', 'who created you', 'who programmed you', 'your builder', 'your creator', 'your developer'],
    age: ['how old are you', 'your age', 'when were you born', 'are you old', 'age of yours'],
    nature: ['do you sleep', 'do you eat', 'do you dream', 'are you conscious', 'are you human', 'are you alive']
  };

  let matchedBotQuestion = null;
  for (const [questionType, keywords] of Object.entries(botQuestions)) {
    if (keywords.some(k => q.includes(k))) {
      matchedBotQuestion = questionType;
      break;
    }
  }

  // 3. Generate answers wisely
  if (matchedFeeling) {
    const shiftContext = q.includes('shift') || q.includes('work') || q.includes('duty') || q.includes('day');
    if (matchedFeeling === 'tired') {
      return `☕ **Rest and Safety Reminder:**\nIt sounds like you are feeling tired${shiftContext ? ' on your shift' : ''}. In heavy manufacturing environments like steel plants, fatigue is a major safety hazard. Take a 5-minute breather, drink some water, and stay alert. I can handle the spreadsheet math for you while you recharge!`;
    }
    if (matchedFeeling === 'bored') {
      return "📊 **Idle Time Tally:**\nA quiet shift is a safe shift! If things are slow, it is a great time to check the **Medicine Inventory** for near-expiry red flags or ensure the **First Aid Box** inspection counts are fully updated.";
    }
    if (matchedFeeling === 'stressed') {
      return "🧘 **Stress Mitigation:**\nTake a deep breath. Managing emergency calls and patient lines can be intense. Remember to log entries one row at a time. The system's local synchronization automatically secures your entries, so you won't lose data even if there's a power drop.";
    }
    if (matchedFeeling === 'happy') {
      return "😊 **Positive Vibe:**\nI'm glad you're having a good day! Let's keep the clinical workflow running smoothly and keep our plant workers safe. Let me know if you need to pull up any reports.";
    }
  }

  if (matchedBotQuestion) {
    if (matchedBotQuestion === 'identity') {
      return "🤖 I am the **JSPulse AI Clinical Assistant**, specifically programmed for the Jindal Steel Patratu Medical Center. I function completely offline, loading all clinic guides and databases locally.";
    }
    if (matchedBotQuestion === 'creator') {
      return "👨‍💻 I was developed by the **JSPulse OHMS Technical Development Team** as an offline-first desktop application wrapper running React 19 and Electron.";
    }
    if (matchedBotQuestion === 'age') {
      return "📅 I was initialized for this workspace recently, but my database contains statutory clinical protocols and Factory Act regulations spanning decades!";
    }
    if (matchedBotQuestion === 'nature') {
      return "⚙️ I am an offline algorithm. I don't sleep, eat, or dream. My entire consciousness consists of local indexing logic, database lookups, and assisting you with clinical paperwork.";
    }
  }

  return null;
};

export const processChatMessage = (userInput, conversationHistory = []) => {
  const normalizedInput = userInput.toLowerCase().replace(/[^\w\s]/gi, '');
  const tokens = normalizedInput.split(/\s+/).filter(t => t.length > 0);
  
  // 0. Check conversational context from history
  const contextResponse = resolveContext(userInput, conversationHistory);
  if (contextResponse) return contextResponse;

  // 1. Check fuzzy symptoms / body parts first aid
  const symptomResponse = checkDynamicFirstAid(tokens);
  if (symptomResponse) return symptomResponse;

  // 1.5 Check Combinatorial Intent (covers 50k+ semantic variations)
  const combinatorialResponse = analyzeCombinatorialIntent(tokens, userInput);
  if (combinatorialResponse) return combinatorialResponse;
  
  // 1.6 Check Small Talk Combinations (covers 40k+ conversational variations)
  const smallTalkResponse = analyzeSmallTalk(tokens, userInput);
  if (smallTalkResponse) return smallTalkResponse;
  
  // 2. Check for basic hardcoded knowledge base (with spelling tolerance)
  let bestMatch = null;
  let highestScore = 0;

  for (const entry of knowledgeBase) {
    let score = 0;
    for (const keyword of entry.keywords) {
      if (normalizedInput.includes(keyword)) {
        score += keyword.split(' ').length * 3; 
      } else {
        const keywordTokens = keyword.split(' ');
        let matches = 0;
        keywordTokens.forEach(kt => {
          // Check exact match or fuzzy match (Levenshtein distance <= 2 for long tokens)
          if (tokens.includes(kt) || tokens.some(t => t.length > 4 && kt.length > 4 && getLevenshteinDistance(t, kt) <= 2)) {
            matches++;
          }
        });
        if (matches === keywordTokens.length) {
          score += matches * 2;
        }
      }
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatch = entry;
    }
  }

  if (bestMatch && highestScore >= 2) {
    return bestMatch.response;
  }

  // 3. Data Extraction: Try to count aggregations first
  const aggResponse = handleAggregation(userInput);
  if (aggResponse) return aggResponse;

  // 4. Data Extraction: Try to dump specific sheet data
  const showTableResponse = handleShowTable(userInput);
  if (showTableResponse) return showTableResponse;

  // 5. Data Extraction: Try deep searching the database
  const searchResponse = searchLocalData(userInput);
  if (searchResponse) return searchResponse;

  // 6. Dynamic Contextual Scavenger Fallback (if no direct keyword matches)
  // Scans all local storage registers for any mention of the search terms
  const searchTerms = tokens.filter(t => t.length > 3 && !['show', 'find', 'search', 'what', 'where', 'when', 'who', 'help', 'give'].includes(t));
  if (searchTerms.length > 0) {
    let matchesFound = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('cms_') || key === 'medicines') {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          if (Array.isArray(data)) {
            data.forEach(row => {
              const rowStr = JSON.stringify(row).toLowerCase();
              if (searchTerms.some(term => rowStr.includes(term))) {
                matchesFound.push({ table: key.replace('cms_', '').replace(/_/g, ' '), data: row });
              }
            });
          }
        } catch(e){}
      }
    }

    if (matchesFound.length > 0) {
      let dynamicReply = `I couldn't find a pre-coded conversation for that, but I scanned your live database registers and found **${matchesFound.length} matching rows** for "${searchTerms.join(', ')}":\n\n`;
      matchesFound.slice(0, 3).forEach((m, idx) => {
        dynamicReply += `* **In ${m.table.toUpperCase()}**: `;
        let rowItems = [];
        for (const [k, v] of Object.entries(m.data)) {
          if (k !== 'id' && !k.startsWith('_') && v) {
            rowItems.push(`${k}: ${v}`);
          }
        }
        dynamicReply += rowItems.slice(0, 4).join(' | ') + '\n';
      });
      return dynamicReply;
    }
  }

  // 7. General Fallback
  return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
};
