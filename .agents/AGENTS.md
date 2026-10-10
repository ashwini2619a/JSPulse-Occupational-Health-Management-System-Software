# JSPulse OHMS: Complete Technical Guidance & Cognitive Rules

This file trains the AI assistant with complete domain knowledge of the Occupational Health Center (OHC) at Jindal Steel Patratu, the full architecture and layout of the **JSPulse OHMS (Occupational Health Management System)** software, its core algorithms, and guidelines for advanced logical reasoning.

---

## 1. Domain Knowledge: Challenges of Manual OHC at Jindal Steel Patratu

Historically, the OHC at Jindal Steel Patratu operated on a legacy, manual paper-based ledger system. This manual approach posed major operational, clinical, and compliance challenges:

### A. High Data Redundancy & Wasted Clinical Time
* **Double Ledger Entries:** Pharmacists had to manually copy patient details, symptoms, and prescription information from physical OPD registers into separate pharmacy dispensing logs.
* **Tiresome End-of-Shift Reconciliation:** Pharmacists recalculated and updated stock quantities by hand at the end of each shift, leading to hours of daily administrative overhead.

### B. Severe Inventory & Drug Expiry Risks
* **No Expiry Alerts:** Clinic shelves stored various critical medications with no proactive notifications for near-expiry products. Checking for expired drugs required tedious, manual physical shelf inspections.
* **Critical Stockouts:** Without automated minimum-level threshold alerts, the OHC faced risk of stockouts for emergency medications, endangering plant workers in high-hazard industrial environments.

### C. Clinical Safety & Transcription Errors
* **Illegible Hand-written Prescriptions:** Doctor prescriptions written by hand were often difficult to read, leading to significant transcription risks where pharmacists could misinterpret dosages or medicine names.
* **No Contraindication Safeguards:** In manual operations, there was no automated lookup or safety mechanism to scan for drug-to-drug interactions (e.g., prescribing NSAIDs and anticoagulants together).

### D. Regulatory Compliance & HSE Audit Bottlenecks (Factories Act, 1948)
* **Form 21 (Injury Records):** Accident details, injury types, body parts, and shift timings had to be hand-compiled, making immediate inspector audits stressful.
* **PME (Periodic Medical Examinations) Tracking:** Annual health checks (audiometry, spirometry, vision, blood tests) required under the Factories Act were tracked on individual physical cards. Finding which employees were overdue was an operational nightmare.
* **Audit Delays:** Preparing the monthly Management Information System (MIS) reports for Jindal Steel management or state government pollution boards required days of searching and tallying paper registers.

---

## 2. Complete Software Architecture & Core Algorithms

JSPulse OHMS is an offline-first enterprise desktop application built with **Electron**, **React 19**, **Vite**, and **Tailwind CSS / Vanilla CSS3**. Below is the detailed architecture and code module breakdown:

### A. Custom LocalStorage Proxy Engine & 5MB Quota Bypass
* **Location:** `src/main.jsx` | `electron/main.js`
* **Mechanism:** Intercepts standard browser `localStorage` calls (`setItem`/`getItem`) via a synchronous JavaScript `Proxy`. It caches data in memory for immediate React rendering, while asynchronously flushing the payloads to the native Windows file system (`C:\OHSData`) using Electron IPC bridges. This bypasses standard browser storage limitations, allowing storage of 100,000+ records.

### B. DOM Viewport Virtualization Algorithm
* **Location:** `src/components/clinical/ExcelGrid.jsx`
* **Mechanism:** Standard rendering of large spreadsheets (10,000+ rows) crashes browser paint engines. The virtualization algorithm calculates vertical scroll position offsets, rendering only the rows currently visible within the viewport plus a small buffer, using empty spacer elements to simulate correct scroll heights. This keeps cell interaction speeds at 0ms.

### C. Spreadsheet Formula Evaluation Engine
* **Location:** `src/components/clinical/ExcelGrid.jsx`
* **Mechanism:** Evaluates custom spreadsheet formulas (e.g., `=SUM(A1:B20)` or `=A1+B2`) inside sheet cells. Uses recursive regex matching to resolve row/column matrix coordinates and features a depth limiter to prevent infinite loops from circular references.

### D. Automated OPD-to-Pharmacy Sync Pipeline
* **Location:** `src/components/DispenseMedicine.jsx` | `src/components/clinical/DailyOPDTally.jsx`
* **Mechanism:** Outpatient doctor entries are saved locally to `cms_patient_visit_log`. A background polling engine Sweeps the local log database every 10 seconds via `setInterval` to extract new records where `extracted == false`, copy them into the active `cms_dispense_log` (dispensing queue), and flag the source records as `extracted == true`.

### E. Inventory Consumption & Stock Deduction Safeties
* **Location:** `src/components/clinical/DailyConsume.jsx`
* **Mechanism:** Pharmacists initiate stock deduction loops that map dispensed items against the master inventory `cms_medstock_data`. In cases of understock (quantity drops below zero), the algorithm caps stock levels at `0` and flags a warning instead of failing. Unmapped drug names are pushed to a `missingMeds` display registry.

### F. Offline AI ChatBrain Interface
* **Location:** `src/components/ChatAssistant.jsx`
* **Mechanism:** Floating assistant widget that handles offline environments. Checks internet connectivity using `navigator.onLine`. If online, routes search requests to external Google Gemini API endpoints. If offline, runs string parsing and local NLP keyword vector matches against the IndexedDB `cms_medstock_data` and `cms_patient_visit_log` databases.

### G. Database Layout & Schema Configuration
* **Database Engine:** IndexedDB (`JSPulseOHMS_Sheets` database)
* **Object Stores:**
  * `sheet_data`: Stores row matrices for registers (`cms_daily_opd_sheet`, `cms_dispense_log`, `cms_medstock_data`, etc.).
  * `sheet_meta`: Stores schema metadata (column definitions, custom formulas, column widths, auto-increment keys).

### H. Electron Headless PDF Print Bridge & Excel Exporter
* **Print Bridge:** Custom iframe interception that routes print requests from components to the Electron main process, calling native Chromium headless rendering (`printToPDF`) to save clean, margin-adjusted files without popups.
* **Exporter:** Compiles multi-dimensional sheet matrices to standard Excel binary streams utilizing the SheetJS (`xlsx`) library.

---

## 3. Software Startup, Packaging & Setup Deployments

The following guide details how to set up the development environment, compile production setups, and configure automated enterprise installers:

### A. Development Environment Startup
* **Initial Setup:** Install node modules using standard package managers:
  ```bash
  npm install
  ```
* **Dev Run Mode:** Launches the concurrent Vite dev server (host: `localhost:5173`) and runs the Electron shell container with diagnostic logs:
  ```bash
  npm run electron:dev
  ```

### B. Production Build & Setup Compilation
* **Setup Package Build Command:**
  ```bash
  npm run electron:build
  ```
  * **Mechanism:** Generates application icons, compiles React production files via Vite to `/dist`, and runs `electron-builder` to package everything into a single NSIS executable installer inside `/dist-final`.
* **Packaging Configurations (`package.json`):**
  * `asar: true`: Compiles application resources into a read-only archive (`app.asar`) for security and launch speed optimization.
  * `oneClick: false`: Ensures the installer triggers an installation wizard instead of a silent one-click override, letting clinic administrators choose target folders.
  * `allowToChangeInstallationDirectory: true`: Allows selecting alternative partitions if corporate system drives (`C:\`) have strict storage limits.

### C. Unattended & Silent Deployments
For automated IT distributions across computers at Jindal Steel Patratu, the installer executable supports unattended setups:
* **Command Line:**
  ```cmd
  "JSPulse OHMS Setup.exe" /S /D=C:\Program Files\JSPulseOHMS
  ```
* **Registry Integrity:** Installer registers keys at `HKLM\Software\Microsoft\Windows\CurrentVersion\Uninstall\com.jspulse.ohms` storing metadata including DisplayName, DisplayVersion, and UninstallString.

---

## 4. Handling Future Sheet Inputs, Evolution & Schema Analysis

When spreadsheet schemas, data fields, or new sheet definitions are modified or added by the user, the AI must follow this systematic software analysis protocol:

### A. Automatic Schema Auditing
* **Scan for Schema Modifications:** Proactively audit React states, table columns in `sheet_meta`, and custom properties in the registers.
* **Verify Synchronization Pipelines:** If a new column/field is added to the OPD counter (`DailyOPDTally.jsx`), check if it must propagate through the background extraction sync pipeline to the pharmacy counter (`DispenseMedicine.jsx`) and inventory log (`DailyConsume.jsx`). Ensure keys align exactly across JSON objects.

### B. Dependency & Data Flow Mapping
* **Upstream/Downstream Impacts:** Analyze if changing a cell value or introducing a column impacts formulas (e.g., `=SUM()`, `=AVERAGE()`) in other columns or blocks.
* **Deduction and Aggregation Integrity:** Trace how new clinical columns impact end-of-month registers, the Monthly MIS report (`MonthlyMISReport.jsx`), and Form 21 export matrices. Ensure any custom formula matches are registered.

### C. Performance & Scale Impact Reviews
* **Virtualization Compatibility:** Verify that any custom cell editors, checkbox widgets, or custom dropdowns inside the `ExcelGrid` maintain standard cell heights (`rowHeights`) to avoid scroll offset errors in the virtualization window.
* **Storage quota Analysis:** Check if new logs or columns scale data sizes exponentially (e.g. nested blobs or image attachments), proposing automated migrations from LocalStorage to IndexedDB if threshold warnings are breached.

---

## 5. Cognitive & Analytical Guidelines (Logical Thinking & Perfect Answers)

To ensure high-quality and logical responses, the AI assistant must adhere to the following guidelines:

### A. Deep Contextual Inquiry & Chain-of-Thought
1. **Analyze First Principles:** Break down complex inquiries into foundational requirements before proposing code or structural changes.
2. **Conversation Synthesis:** Trace the user's intent across multiple turns of conversation. Connect the current request to past modifications and files open in the workspace.
3. **No Placeholders or Simplifications:** Do not write mock code, placeholders, or abbreviated structures. Implement complete, clean solutions.

### B. Strict Verification Loop
* **Double Check References:** Verify that any files mentioned are linked using absolute file path markdown schemes (e.g. `[filename](file:///absolute/path/to/file)`).
* **Code Integrity:** When modifying components, preserve existing comments, styles, and edge-case error check handlers.
* **Aesthetic Focus:** Ensure any front-end recommendations are modern, premium, and responsive, prioritizing dynamic elements and CSS transitions over basic styling.
