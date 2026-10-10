import React, { useState, useRef, useEffect } from 'react';
import { Download, Printer, Upload, RefreshCw, AlertTriangle, ShieldCheck, HeartPulse, Eye } from 'lucide-react';
import { getAllSheets } from '../../utils/sheetDB';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const years = Array.from({ length: 31 }, (_, i) => 2020 + i);

const initialInjuryData = [
  { type: 'Minor Cuts', count: 15, percentage: '30%' },
  { type: 'Burns', count: 8, percentage: '16%' },
  { type: 'Fractures', count: 3, percentage: '6%' },
  { type: 'Chemical Exposure', count: 5, percentage: '10%' },
  { type: 'Heat Stroke', count: 7, percentage: '14%' },
  { type: 'Eye Injury', count: 4, percentage: '8%' },
  { type: 'Others', count: 8, percentage: '16%' },
];

const initialMedicineData = [
  { name: 'Paracetamol 500mg', opening: 2000, received: 500, consumed: 850, closing: 1650 },
  { name: 'Ibuprofen 400mg', opening: 1500, received: 300, consumed: 620, closing: 1180 },
  { name: 'ORS Packets', opening: 3000, received: 1000, consumed: 1800, closing: 2200 },
  { name: 'Betadine Solution 100ml', opening: 200, received: 50, consumed: 85, closing: 165 },
  { name: 'Diclofenac Gel 30g', opening: 300, received: 100, consumed: 140, closing: 260 },
];

const initialDeptData = [
  { department: 'Blast Furnace', visits: 85, percentage: '22%' },
  { department: 'Steel Melting Shop', visits: 72, percentage: '18%' },
  { department: 'Coke Oven', visits: 58, percentage: '15%' },
  { department: 'Rolling Mill', visits: 65, percentage: '17%' },
  { department: 'Power Plant', visits: 45, percentage: '12%' },
  { department: 'Maintenance', visits: 63, percentage: '16%' },
];

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#6366f1'];

const MonthlyMISReport = () => {
  const [selectedMonth, setSelectedMonth] = useState('June');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [plantLocation, setPlantLocation] = useState('Jindal Steel Patratu');
  const [observations, setObservations] = useState('');

  const [opdStats, setOpdStats] = useState({
    totalVisits: 0,
    newCases: 0,
    followUps: 0,
    referrals: 0,
  });

  const [trends, setTrends] = useState({
    totalVisits: '0%',
    newCases: '0%',
    followUps: '0%',
    referrals: '0%',
    totalVisitsUp: true,
    newCasesUp: true,
    followUpsUp: true,
    referralsUp: true,
  });

  const [injuryData, setInjuryData] = useState(initialInjuryData);
  const [medicineData, setMedicineData] = useState(initialMedicineData);
  const [deptData, setDeptData] = useState(initialDeptData);

  // Section 5 - Compliance Metrics State
  const [complianceStats, setComplianceStats] = useState({
    ambulanceDispatches: 0,
    bioMedicalWaste: 0,
    activeOccDiseases: 0,
    overdueHealthCertificates: 0,
  });

  const handlePrint = () => {
    const isElectron = navigator.userAgent.toLowerCase().includes('electron');
    try {
      if (isElectron && window.electron) {
        window.electron.printCommand();
      } else if (isElectron && window['require']) {
        const { ipcRenderer } = window['require']('electron');
        ipcRenderer.send('print-command');
      } else if (!isElectron) {
        window.print();
      } else {
        alert("Print failed: Electron IPC not available. Please check contextBridge preload configurations.");
      }
    } catch (err) {
      console.error(err);
      if (!isElectron) {
        window.print();
      } else {
        alert("Print failed: " + err.message);
      }
    }
  };

  const handlePrintPreview = () => {
    const isElectron = navigator.userAgent.toLowerCase().includes('electron');
    try {
      if (isElectron && window.electron) {
        if (window.electron.previewPrint) {
          window.electron.previewPrint();
        } else {
          window.electron.printCommand();
        }
      } else if (isElectron && window['require']) {
        const { ipcRenderer } = window['require']('electron');
        ipcRenderer.send('preview-print');
      } else {
        window.print();
      }
    } catch (err) {
      console.error(err);
      alert("Preview failed: " + err.message);
    }
  };

  const handleAutoSync = async (silent = false) => {
    try {
      const monthIdx = months.indexOf(selectedMonth);
      const monthStr = String(monthIdx + 1).padStart(2, '0');
      const datePrefix = `${selectedYear}-${monthStr}`;
      const incomingMonthKey = selectedMonth.substring(0, 3).toLowerCase();

      // Get Previous Month details for Trend calculation
      const prevMonthIdx = (monthIdx - 1 + 12) % 12;
      const prevYear = monthIdx === 0 ? selectedYear - 1 : selectedYear;
      const prevMonthStr = String(prevMonthIdx + 1).padStart(2, '0');
      const prevDatePrefix = `${prevYear}-${prevMonthStr}`;

      // Fetch all sheets from IndexedDB
      const allSheets = await getAllSheets();
      const allKeys = Object.keys(allSheets);

      // 1. Gather all OPD data
      let opdRows = [];
      allKeys.forEach(key => {
        if (
          key === 'cms_daily_opd_sheet' || key.startsWith('cms_daily_opd_sheet_tab_') ||
          key === 'cms_patient_visit_log' || key.startsWith('cms_patient_visit_log_tab_')
        ) {
          const parsed = allSheets[key];
          if (Array.isArray(parsed)) {
            // Strictly ignore empty rows (must have either a name or employee code to count)
            const filtered = parsed.filter(r => r && (
              (r.patientName && typeof r.patientName === 'string' && r.patientName.trim() !== '') || 
              (r.empCode && typeof r.empCode === 'string' && r.empCode.trim() !== '') ||
              (r.patientname && typeof r.patientname === 'string' && r.patientname.trim() !== '') || 
              (r.empId && typeof r.empId === 'string' && r.empId.trim() !== '')
            ));
            opdRows = [...opdRows, ...filtered];
          }
        }
      });

      // Filter OPD rows matching current month
      const currentMonthOpd = opdRows.filter(r => r && r.date && String(r.date).startsWith(datePrefix));
      const totalVisits = currentMonthOpd.length;

      // Identify New Cases vs Follow-ups
      let previousPatients = new Set();
      opdRows.forEach(r => {
        if (r && r.date && String(r.date) < datePrefix) {
          const patientKey = String(r.patientName || r.patientname || r.empCode || r.empId || '').trim().toLowerCase();
          if (patientKey) {
            previousPatients.add(patientKey);
          }
        }
      });

      let newCasesCount = 0;
      let followUpsCount = 0;
      currentMonthOpd.forEach(r => {
        const key = String(r.patientName || r.patientname || r.empCode || r.empId || '').trim().toLowerCase();
        if (key) {
          if (previousPatients.has(key)) {
            followUpsCount++;
          } else {
            newCasesCount++;
            previousPatients.add(key);
          }
        }
      });

      // Gather Injury data
      let injuryRows = [];
      allKeys.forEach(key => {
        if (key === 'cms_injury_data' || key.startsWith('cms_injury_data_tab_') || key === 'cms_injury_report_log' || key.startsWith('cms_injury_report_log_tab_')) {
          const parsed = allSheets[key];
          if (Array.isArray(parsed)) {
            const filtered = parsed.filter(r => r && (
              (r.employeeName && typeof r.employeeName === 'string' && r.employeeName.trim() !== '') || 
              (r.empCode && typeof r.empCode === 'string' && r.empCode.trim() !== '')
            ));
            injuryRows = [...injuryRows, ...filtered];
          }
        }
      });

      const currentMonthInjuries = injuryRows.filter(r => r && r.date && String(r.date).startsWith(datePrefix));
      const injuryReferredCount = currentMonthInjuries.filter(r => String(r.referred || '').toLowerCase() === 'yes').length;
      
      const opdReferredCount = currentMonthOpd.filter(r => {
        const diag = String(r.diagnosis || '').toLowerCase();
        const med = String(r.medicinesDetails || r.medicinePrescribed || r.medicineprescribed || '').toLowerCase();
        const isReferred = String(r.referred || '').toLowerCase() === 'yes';
        return diag.includes('refer') || diag.includes('hosp') || med.includes('refer') || med.includes('hosp') || isReferred;
      }).length;
      
      const referrals = injuryReferredCount + opdReferredCount;

      setOpdStats({
        totalVisits,
        newCases: newCasesCount,
        followUps: followUpsCount,
        referrals
      });

      // Calculate Trends comparing to previous month
      const prevMonthOpd = opdRows.filter(r => r && r.date && String(r.date).startsWith(prevDatePrefix));
      const prevTotalVisits = prevMonthOpd.length;

      let prevNewCases = 0;
      let prevFollowUps = 0;
      let prevPatientsForTrend = new Set();
      opdRows.forEach(r => {
        if (r && r.date && String(r.date) < prevDatePrefix) {
          const patientKey = String(r.patientName || r.patientname || r.empCode || r.empId || '').trim().toLowerCase();
          if (patientKey) {
            prevPatientsForTrend.add(patientKey);
          }
        }
      });
      prevMonthOpd.forEach(r => {
        const key = String(r.patientName || r.patientname || r.empCode || r.empId || '').trim().toLowerCase();
        if (key) {
          if (prevPatientsForTrend.has(key)) {
            prevFollowUps++;
          } else {
            prevNewCases++;
            prevPatientsForTrend.add(key);
          }
        }
      });

      const prevMonthInjuries = injuryRows.filter(r => r && r.date && String(r.date).startsWith(prevDatePrefix));
      const prevInjuryReferredCount = prevMonthInjuries.filter(r => String(r.referred || '').toLowerCase() === 'yes').length;
      const prevOpdReferredCount = prevMonthOpd.filter(r => {
        const diag = String(r.diagnosis || '').toLowerCase();
        const med = String(r.medicinesDetails || r.medicinePrescribed || r.medicineprescribed || '').toLowerCase();
        const isReferred = String(r.referred || '').toLowerCase() === 'yes';
        return diag.includes('refer') || diag.includes('hosp') || med.includes('refer') || med.includes('hosp') || isReferred;
      }).length;
      const prevReferrals = prevInjuryReferredCount + prevOpdReferredCount;

      const calcTrend = (curr, prev) => {
        if (prev === 0) return { text: '0%', up: true };
        const diff = curr - prev;
        const pct = Math.round((diff / prev) * 100);
        return {
          text: `${pct >= 0 ? '+' : ''}${pct}%`,
          up: pct >= 0
        };
      };

      const visitTrend = calcTrend(totalVisits, prevTotalVisits);
      const newTrend = calcTrend(newCasesCount, prevNewCases);
      const followTrend = calcTrend(followUpsCount, prevFollowUps);
      const referralTrend = calcTrend(referrals, prevReferrals);

      setTrends({
        totalVisits: visitTrend.text,
        newCases: newTrend.text,
        followUps: followTrend.text,
        referrals: referralTrend.text,
        totalVisitsUp: visitTrend.up,
        newCasesUp: newTrend.up,
        followUpsUp: followTrend.up,
        referralsUp: referralTrend.up,
      });

      // 2. Aggregate Injury Data by Nature of Injury
      const injuryCounts = {};
      currentMonthInjuries.forEach(r => {
        const type = r.natureOfInjury || 'Others';
        injuryCounts[type] = (injuryCounts[type] || 0) + 1;
      });

      const totalMonthInjuries = currentMonthInjuries.length;
      const formattedInjuryData = Object.keys(injuryCounts).map(type => {
        const count = injuryCounts[type];
        const percentage = totalMonthInjuries > 0 ? `${Math.round((count / totalMonthInjuries) * 100)}%` : '0%';
        return { type, count, percentage };
      });

      setInjuryData(formattedInjuryData);

      // 3. Gather Medicine Data
      let stockList = [];
      allKeys.forEach(key => {
        if (key === 'cms_medstock_data' || key.startsWith('cms_medstock_data_tab_')) {
          const parsed = allSheets[key];
          if (Array.isArray(parsed)) {
            const filtered = parsed.filter(s => s && s.medicineName && typeof s.medicineName === 'string' && s.medicineName.trim() !== '');
            stockList = [...stockList, ...filtered];
          }
        }
      });

      let incomingList = [];
      allKeys.forEach(key => {
        if (key === 'cms_medicine_incoming_data' || key.startsWith('cms_medicine_incoming_data_tab_')) {
          const parsed = allSheets[key];
          if (Array.isArray(parsed)) {
            const filtered = parsed.filter(i => i && i.medicine && typeof i.medicine === 'string' && i.medicine.trim() !== '');
            incomingList = [...incomingList, ...filtered];
          }
        }
      });

      let consumeList = [];
      const consumeKeyPrefix = `cms_monthly_consume_data_${selectedYear}_${selectedMonth}`;
      allKeys.forEach(key => {
        if (key === consumeKeyPrefix || key.startsWith(`${consumeKeyPrefix}_tab_`)) {
          const parsed = allSheets[key];
          if (Array.isArray(parsed)) {
            const filtered = parsed.filter(c => c && c.medicineName && typeof c.medicineName === 'string' && c.medicineName.trim() !== '');
            consumeList = [...consumeList, ...filtered];
          }
        }
      });

      const formattedMedData = stockList.slice(0, 10).map(s => {
        const name = s.medicineName;
        const closing = Number(s.quantity) || 0;

        const incomingMatch = incomingList.find(i => i && String(i.medicine).toLowerCase().trim() === name.toLowerCase().trim());
        const received = incomingMatch ? (Number(incomingMatch[incomingMonthKey]) || 0) : 0;

        const consumeMatch = consumeList.find(c => c && String(c.medicineName).toLowerCase().trim() === name.toLowerCase().trim());
        const consumed = consumeMatch ? (Number(consumeMatch.monthlyGrandTotal) || 0) : 0;

        const opening = closing + consumed - received;

        return { name, opening, received, consumed, closing };
      });

      if (formattedMedData.length > 0) {
        setMedicineData(formattedMedData);
      } else {
        setMedicineData([
          { name: 'Paracetamol 500mg', opening: 0, received: 0, consumed: 0, closing: 0 },
          { name: 'Ibuprofen 400mg', opening: 0, received: 0, consumed: 0, closing: 0 },
          { name: 'ORS Packets', opening: 0, received: 0, consumed: 0, closing: 0 },
          { name: 'Betadine Solution 100ml', opening: 0, received: 0, consumed: 0, closing: 0 },
          { name: 'Diclofenac Gel 30g', opening: 0, received: 0, consumed: 0, closing: 0 }
        ]);
      }

      // 4. Aggregate Department-wise Visits
      const deptCounts = {};
      currentMonthOpd.forEach(r => {
        const dept = r.department || 'Others';
        deptCounts[dept] = (deptCounts[dept] || 0) + 1;
      });

      const totalMonthOpd = currentMonthOpd.length;
      const formattedDeptData = Object.keys(deptCounts).map(department => {
        const visits = deptCounts[department];
        const percentage = totalMonthOpd > 0 ? `${Math.round((visits / totalMonthOpd) * 100)}%` : '0%';
        return { department, visits, percentage };
      });

      setDeptData(formattedDeptData);

      // 5. Gather Emergency Tally (Ambulance, BMW, Disease, Certificates)
      let ambulanceRows = [];
      allKeys.forEach(key => {
        if (key === 'cms_ambulance_data' || key.startsWith('cms_ambulance_data_tab_')) {
          const parsed = allSheets[key];
          if (Array.isArray(parsed)) {
            ambulanceRows = [...ambulanceRows, ...parsed];
          }
        }
      });
      const monthAmbulance = ambulanceRows.filter(r => r && r.dateTime && String(r.dateTime).startsWith(datePrefix)).length;

      let bmwRows = [];
      allKeys.forEach(key => {
        if (key === 'cms_bmw_data' || key.startsWith('cms_bmw_data_tab_')) {
          const parsed = allSheets[key];
          if (Array.isArray(parsed)) {
            bmwRows = [...bmwRows, ...parsed];
          }
        }
      });
      const monthBmwWeight = bmwRows
        .filter(r => r && r.date && String(r.date).startsWith(datePrefix))
        .reduce((sum, r) => sum + (Number(r.weight) || 0), 0);

      let diseaseRows = [];
      allKeys.forEach(key => {
        if (key === 'cms_occ_disease_data' || key.startsWith('cms_occ_disease_data_tab_')) {
          const parsed = allSheets[key];
          if (Array.isArray(parsed)) {
            diseaseRows = [...diseaseRows, ...parsed];
          }
        }
      });
      const activeDiseases = diseaseRows.filter(r => r && String(r.status).toLowerCase() === 'active').length;

      let certRows = [];
      allKeys.forEach(key => {
        if (key === 'cms_health_cert_data' || key.startsWith('cms_health_cert_data_tab_')) {
          const parsed = allSheets[key];
          if (Array.isArray(parsed)) {
            certRows = [...certRows, ...parsed];
          }
        }
      });
      
      const overdueCertificates = certRows.filter(r => {
        if (!r || !r.validUntil) return false;
        return new Date(r.validUntil) < new Date();
      }).length;

      setComplianceStats({
        ambulanceDispatches: monthAmbulance,
        bioMedicalWaste: Number(monthBmwWeight.toFixed(2)),
        activeOccDiseases: activeDiseases,
        overdueHealthCertificates: overdueCertificates,
      });

      // 6. Generate Observations based on the calculated data
      let autoObservations = [];
      autoObservations.push(`1. OPD footfall recorded at ${totalVisits} visits for the month of ${selectedMonth} ${selectedYear}.`);
      autoObservations.push(`2. Case distribution consists of ${newCasesCount} new patient registrations and ${followUpsCount} follow-up visits.`);
      if (referrals > 0) {
        autoObservations.push(`3. ${referrals} patient cases were referred to external hospital facilities for advanced care.`);
      }
      if (currentMonthInjuries.length > 0) {
        autoObservations.push(`4. Total of ${currentMonthInjuries.length} work-related injuries reported and logged. First aid administered in all cases.`);
      }
      if (monthAmbulance > 0) {
        autoObservations.push(`5. Emergency Ambulance dispatches triggered ${monthAmbulance} times for critical response.`);
      }
      if (overdueCertificates > 0) {
        autoObservations.push(`6. Compliance alert: ${overdueCertificates} health certificates are currently overdue or expired.`);
      }
      const lowStockMedicines = stockList.filter(s => Number(s.quantity) <= Number(s.reorder)).map(s => s.medicineName);
      if (lowStockMedicines.length > 0) {
        autoObservations.push(`7. Critical stock warning: Reordered levels reached for: ${lowStockMedicines.slice(0, 3).join(', ')}.`);
      }

      setObservations(autoObservations.join('\n'));

      if (!silent) {
        alert(`MIS Report automated and synced for ${selectedMonth} ${selectedYear}!`);
      }
    } catch (err) {
      console.error(err);
      if (!silent) {
        alert('Error aggregating data: ' + err.message);
      }
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      handleAutoSync(true);
    }, 0);
    return () => clearTimeout(timer);
  }, [selectedMonth, selectedYear]);

  const exportCSV = () => {
    let csv = `Monthly MIS Report - ${selectedMonth} ${selectedYear}\n`;
    csv += `Plant Location: ${plantLocation}\n\n`;

    csv += 'OPD Summary\n';
    csv += 'Metric,Value\n';
    csv += `Total OPD Visits,${opdStats.totalVisits}\n`;
    csv += `New Cases,${opdStats.newCases}\n`;
    csv += `Follow-ups,${opdStats.followUps}\n`;
    csv += `Referrals,${opdStats.referrals}\n\n`;

    csv += 'Injury Summary\n';
    csv += 'Type of Injury,Count,Percentage\n';
    injuryData.forEach(r => { csv += `"${r.type}",${r.count},${r.percentage}\n`; });
    csv += '\n';

    csv += 'Medicine Consumption\n';
    csv += 'Medicine Name,Opening Stock,Received,Consumed,Closing Stock\n';
    medicineData.forEach(r => { csv += `"${r.name}",${r.opening},${r.received},${r.consumed},${r.closing}\n`; });
    csv += '\n';

    csv += 'Department-wise Visits\n';
    csv += 'Department,Visits,Percentage\n';
    deptData.forEach(r => { csv += `"${r.department}",${r.visits},${r.percentage}\n`; });
    csv += '\n';

    csv += 'Compliance & Safety Tally\n';
    csv += 'Metric,Value\n';
    csv += `Ambulance Calls,${complianceStats.ambulanceDispatches}\n`;
    csv += `Biomedical Waste (kg),${complianceStats.bioMedicalWaste}\n`;
    csv += `Active Occupational Diseases,${complianceStats.activeOccDiseases}\n`;
    csv += `Overdue Health Certificates,${complianceStats.overdueHealthCertificates}\n\n`;

    csv += 'Key Observations\n';
    csv += `"${observations.replace(/"/g, '""')}"\n`;

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `MIS_Report_${selectedMonth}_${selectedYear}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const fileInputRef = useRef(null);

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const lines = text.split('\n');
      let currentSection = '';
      
      let newOpd = { ...opdStats };
      let newInjury = [];
      let newMed = [];
      let newDept = [];
      let newBmw = { ...complianceStats };
      let newObs = [];
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (line.startsWith('OPD Summary')) { currentSection = 'opd'; continue; }
        if (line.startsWith('Injury Summary')) { currentSection = 'injury'; continue; }
        if (line.startsWith('Medicine Consumption')) { currentSection = 'medicine'; continue; }
        if (line.startsWith('Department-wise Visits')) { currentSection = 'dept'; continue; }
        if (line.startsWith('Compliance & Safety Tally')) { currentSection = 'compliance'; continue; }
        if (line.startsWith('Key Observations')) { currentSection = 'obs'; continue; }
        
        if (line === '') continue;

        if (line.startsWith('Metric,Value') || line.startsWith('Type of Injury,Count') || line.startsWith('Medicine Name,Opening') || line.startsWith('Department,Visits')) {
          continue;
        }

        if (currentSection === 'opd') {
          const parts = line.split(',');
          if (parts.length >= 2) {
            const val = parseInt(parts[1], 10);
            if (parts[0] === 'Total OPD Visits') newOpd.totalVisits = val;
            if (parts[0] === 'New Cases') newOpd.newCases = val;
            if (parts[0] === 'Follow-ups') newOpd.followUps = val;
            if (parts[0] === 'Referrals') newOpd.referrals = val;
          }
        } else if (currentSection === 'injury') {
          const match = line.match(/^"([^"]+)",(\d+),([^,]+)$/) || line.match(/^([^,]+),(\d+),([^,]+)$/);
          if (match) {
            newInjury.push({ type: match[1], count: parseInt(match[2], 10), percentage: match[3] });
          }
        } else if (currentSection === 'medicine') {
          const match = line.match(/^"([^"]+)",(\d+),(\d+),(\d+),(\d+)$/) || line.match(/^([^,]+),(\d+),(\d+),(\d+),(\d+)$/);
          if (match) {
            newMed.push({ name: match[1], opening: parseInt(match[2], 10), received: parseInt(match[3], 10), consumed: parseInt(match[4], 10), closing: parseInt(match[5], 10) });
          }
        } else if (currentSection === 'dept') {
          const match = line.match(/^"([^"]+)",(\d+),([^,]+)$/) || line.match(/^([^,]+),(\d+),([^,]+)$/);
          if (match) {
            newDept.push({ department: match[1], visits: parseInt(match[2], 10), percentage: match[3] });
          }
        } else if (currentSection === 'compliance') {
          const parts = line.split(',');
          if (parts.length >= 2) {
            const val = parseFloat(parts[1]) || 0;
            if (parts[0] === 'Ambulance Calls') newBmw.ambulanceDispatches = Math.round(val);
            if (parts[0] === 'Biomedical Waste (kg)') newBmw.bioMedicalWaste = val;
            if (parts[0] === 'Active Occupational Diseases') newBmw.activeOccDiseases = Math.round(val);
            if (parts[0] === 'Overdue Health Certificates') newBmw.overdueHealthCertificates = Math.round(val);
          }
        } else if (currentSection === 'obs') {
          let obsLine = line;
          if (obsLine.startsWith('"') && newObs.length === 0) obsLine = obsLine.substring(1);
          if (obsLine.endsWith('"')) obsLine = obsLine.substring(0, obsLine.length - 1);
          obsLine = obsLine.replace(/""/g, '"');
          newObs.push(obsLine);
        }
      }
      
      setOpdStats(newOpd);
      if (newInjury.length > 0) setInjuryData(newInjury);
      if (newMed.length > 0) setMedicineData(newMed);
      if (newDept.length > 0) setDeptData(newDept);
      setComplianceStats(newBmw);
      if (newObs.length > 0) setObservations(newObs.join('\n'));

      alert('MIS Report imported successfully!');
    };
    reader.readAsText(file);
    e.target.value = null; 
  };

  const statCards = [
    { label: 'Total OPD Visits', value: opdStats.totalVisits, key: 'totalVisits', gradient: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)', trend: trends.totalVisits, trendUp: trends.totalVisitsUp },
    { label: 'New Cases', value: opdStats.newCases, key: 'newCases', gradient: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)', trend: trends.newCases, trendUp: trends.newCasesUp },
    { label: 'Follow-ups', value: opdStats.followUps, key: 'followUps', gradient: 'linear-gradient(135deg, #b45309 0%, #f59e0b 100%)', trend: trends.followUps, trendUp: trends.followUpsUp },
    { label: 'Referrals', value: opdStats.referrals, key: 'referrals', gradient: 'linear-gradient(135deg, #be123c 0%, #f43f5e 100%)', trend: trends.referrals, trendUp: trends.referralsUp },
  ];

  const handleStatEdit = (key, newValue) => {
    const num = parseInt(newValue, 10);
    if (!isNaN(num)) {
      setOpdStats(prev => ({ ...prev, [key]: num }));
    }
  };

  return (
    <div className="animate-fade-in" style={{ padding: '28px 32px', fontFamily: "'Inter', sans-serif", backgroundColor: 'var(--bg)', minHeight: '100vh' }}>
      {/* Header Container */}
      <div className="glass-card animate-slide-in" style={{ background: 'linear-gradient(135deg, rgba(30, 64, 175, 0.9) 0%, rgba(30, 58, 138, 0.9) 100%)', color: 'white', padding: '28px 32px', borderRadius: '20px', marginBottom: '28px', boxShadow: '0 8px 30px rgba(30,64,175,0.12)', border: '1px solid rgba(255,255,255,0.15)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <h1 className="gradient-text-animated-light" style={{ margin: 0, fontSize: '26px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
              📊 Monthly MIS Report
            </h1>
            <p style={{ margin: '6px 0 0', fontSize: '13px', opacity: 0.9, fontWeight: 600 }}>
              Occupational Health Centre — Medical & Compliance Analytics Dashboard
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <button onClick={() => handleAutoSync(false)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px', background: 'linear-gradient(135deg, #eab308, #ca8a04)', color: '#1e3a8a', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: 700, transition: 'transform 0.2s', boxShadow: '0 4px 12px rgba(234,179,8,0.3)' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
              <RefreshCw size={15} /> Sync & Automate
            </button>
            <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="glass-input" style={{ color: 'white', background: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.3)', padding: '8px 14px', borderRadius: '10px', fontSize: '13px', cursor: 'pointer', outline: 'none' }}>
              {months.map(m => <option key={m} value={m} style={{ color: '#1e40af' }}>{m}</option>)}
            </select>
            <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} className="glass-input" style={{ color: 'white', background: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.3)', padding: '8px 14px', borderRadius: '10px', fontSize: '13px', cursor: 'pointer', outline: 'none' }}>
              {years.map(y => <option key={y} value={y} style={{ color: '#1e40af' }}>{y}</option>)}
            </select>
            <input type="text" value={plantLocation} onChange={e => setPlantLocation(e.target.value)} placeholder="Plant Location" className="glass-input" style={{ color: 'white', background: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.3)', padding: '8px 14px', borderRadius: '10px', fontSize: '13px', width: '180px', outline: 'none' }} />
            <button onClick={() => fileInputRef.current?.click()} className="glass-input" style={{ color: 'white', background: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 14px', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
              <Upload size={15} /> Import
            </button>
            <input type="file" ref={fileInputRef} onChange={handleImport} accept=".csv" style={{ display: 'none' }} />
            <button onClick={exportCSV} className="glass-input" style={{ color: 'white', background: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 14px', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
              <Download size={15} /> Export
            </button>
            <button onClick={handlePrint} className="glass-input" style={{ color: 'white', background: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 14px', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
              <Printer size={15} /> Print
            </button>
            <button onClick={handlePrintPreview} className="glass-input" style={{ color: 'white', background: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 14px', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
              <Eye size={15} /> Print Preview
            </button>
          </div>
        </div>
      </div>

      {/* Main Report Dashboard */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
        
        {/* Section 1 - OPD Summary Cards */}
        <div className="glass-card animate-slide-in-stagger-1" style={{ padding: '28px', background: 'white' }}>
          <h2 className="text-shine" style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 20px 0', borderBottom: '1px solid rgba(226,232,240,0.8)', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            📋 Section 1 — OPD Summary
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
            {statCards.map((card, i) => (
              <div key={card.key} className="glass-card animate-float" style={{ 
                background: card.gradient, 
                borderRadius: '16px', 
                padding: '24px', 
                color: 'white', 
                position: 'relative', 
                overflow: 'hidden', 
                boxShadow: '0 8px 25px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.15)',
                border: '1px solid rgba(255,255,255,0.15)',
                transition: 'all 0.3s',
                animationDelay: `${i * 0.1}s`
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-6px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <p style={{ margin: '0 0 8px', fontSize: '13px', opacity: 0.9, fontWeight: 700, letterSpacing: '0.75px', textTransform: 'uppercase' }}>
                  {card.label}
                </p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                  <input
                    type="number"
                    value={card.value}
                    onChange={e => handleStatEdit(card.key, e.target.value)}
                    className="animate-number-pop"
                    style={{ fontSize: '38px', fontWeight: 800, color: 'white', backgroundColor: 'transparent', border: 'none', outline: 'none', width: '120px', padding: 0 }}
                  />
                </div>
                <div style={{ marginTop: '12px', fontSize: '12px', display: 'flex', alignItems: 'center' }}>
                  <span style={{ padding: '3px 10px', borderRadius: '20px', backgroundColor: 'rgba(255, 255, 255, 0.25)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    {card.trendUp ? '▲' : '▼'} {card.trend} MoM
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Visual Charts Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
          
          {/* Chart 1: Department-wise Footfall */}
          <div className="glass-card glow-blue animate-slide-in-stagger-2" style={{ padding: '24px', background: 'white' }}>
            <h3 className="text-shine" style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 20px 0', borderBottom: '1px solid rgba(226,232,240,0.8)', paddingBottom: '10px' }}>
              🏭 Department-wise OPD Visits
            </h3>
            <div style={{ width: '100%', height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(226,232,240,0.4)" />
                  <XAxis dataKey="department" stroke="#64748b" fontSize={11} fontWeight={600} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} fontWeight={600} tickLine={false} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(241, 245, 249, 0.4)' }}
                    contentStyle={{
                      borderRadius: '10px',
                      border: '1px solid rgba(255,255,255,0.4)',
                      background: 'rgba(255,255,255,0.9)',
                      backdropFilter: 'blur(8px)',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                      fontWeight: 600
                    }}
                  />
                  <Bar dataKey="visits" name="Visits" fill="url(#deptVisitsGrad)" radius={[4, 4, 0, 0]} />
                  <defs>
                    <linearGradient id="deptVisitsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#1e3a8a" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Injury Types Distribution */}
          <div className="glass-card glow-green animate-slide-in-stagger-2" style={{ padding: '24px', background: 'white' }}>
            <h3 className="text-shine" style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 20px 0', borderBottom: '1px solid rgba(226,232,240,0.8)', paddingBottom: '10px' }}>
              🩹 Injury Nature & Distribution
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px', flexWrap: 'wrap', gap: '20px' }}>
              <div style={{ width: '200px', height: '200px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={injuryData} dataKey="count" nameKey="type" cx="50%" cy="50%" outerRadius={80} fill="#8884d8">
                      {injuryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.05))' }} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{
                        borderRadius: '10px',
                        border: '1px solid rgba(255,255,255,0.4)',
                        background: 'rgba(255,255,255,0.9)',
                        backdropFilter: 'blur(8px)',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                        fontWeight: 600
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto', flex: 1, minWidth: '180px', paddingRight: '4px' }}>
                {injuryData.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#334155', fontWeight: 600 }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: CHART_COLORS[idx % CHART_COLORS.length], display: 'inline-block' }} />
                      {item.type}
                    </span>
                    <span style={{ fontWeight: 700, color: '#64748b' }}>{item.count} ({item.percentage})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Section 2 - Injury Summary Table */}
        <div className="glass-card animate-slide-in-stagger-3" style={{ padding: '28px', background: 'white' }}>
          <h2 className="text-shine" style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 20px 0', borderBottom: '1px solid rgba(226,232,240,0.8)', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            📋 Section 2 — Injury Summary Tally
          </h2>
          <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid rgba(226, 232, 240, 0.8)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc' }}>
                  <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '13px', color: '#475569', fontWeight: 700 }}>Type of Injury</th>
                  <th style={{ padding: '14px 20px', textAlign: 'center', fontSize: '13px', color: '#475569', fontWeight: 700, width: '160px' }}>Count</th>
                  <th style={{ padding: '14px 20px', textAlign: 'center', fontSize: '13px', color: '#475569', fontWeight: 700, width: '160px' }}>Percentage</th>
                </tr>
              </thead>
              <tbody>
                {injuryData.map((row, idx) => (
                  <tr key={idx} style={{ borderTop: '1px solid #e2e8f0', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(248, 250, 252, 0.5)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '14px 20px', fontSize: '13px', color: '#1e293b', fontWeight: 600 }}>{row.type}</td>
                    <td style={{ padding: '10px 20px', textAlign: 'center' }}>
                      <input 
                        type="number" 
                        value={row.count} 
                        onChange={e => { const nd = [...injuryData]; nd[idx] = { ...nd[idx], count: parseInt(e.target.value, 10) || 0 }; setInjuryData(nd); }} 
                        style={{ width: '90px', textAlign: 'center', border: '1px solid rgba(203, 213, 225, 0.7)', borderRadius: '8px', padding: '6px', fontSize: '13px', fontWeight: 700, background: 'rgba(255,255,255,0.7)', outline: 'none', transition: 'all 0.2s' }} 
                        onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 8px rgba(2, 132, 199, 0.15)'; }}
                        onBlur={e => { e.target.style.borderColor = 'rgba(203,213,225,0.7)'; e.target.style.boxShadow = 'none'; }}
                      />
                    </td>
                    <td style={{ padding: '10px 20px', textAlign: 'center' }}>
                      <input 
                        type="text" 
                        value={row.percentage} 
                        onChange={e => { const nd = [...injuryData]; nd[idx] = { ...nd[idx], percentage: e.target.value }; setInjuryData(nd); }} 
                        style={{ width: '90px', textAlign: 'center', border: '1px solid rgba(203, 213, 225, 0.7)', borderRadius: '8px', padding: '6px', fontSize: '13px', background: 'rgba(255,255,255,0.7)', outline: 'none', transition: 'all 0.2s' }} 
                        onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 8px rgba(2, 132, 199, 0.15)'; }}
                        onBlur={e => { e.target.style.borderColor = 'rgba(203,213,225,0.7)'; e.target.style.boxShadow = 'none'; }}
                      />
                    </td>
                  </tr>
                ))}
                <tr style={{ backgroundColor: 'rgba(239, 246, 255, 0.8)', borderTop: '2px solid #bfdbfe' }}>
                  <td style={{ padding: '16px 20px', fontWeight: 700, fontSize: '13px', color: '#1e40af' }}>Total Month Work Injuries</td>
                  <td style={{ padding: '16px 20px', textAlign: 'center', fontWeight: 700, fontSize: '13px', color: '#1e40af' }}>{injuryData.reduce((sum, r) => sum + (r.count || 0), 0)}</td>
                  <td style={{ padding: '16px 20px', textAlign: 'center', fontWeight: 700, fontSize: '13px', color: '#1e40af' }}>100%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 3 - Medicine Consumption Table */}
        <div className="glass-card animate-slide-in-stagger-3" style={{ padding: '28px', background: 'white' }}>
          <h2 className="text-shine" style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 20px 0', borderBottom: '1px solid rgba(226,232,240,0.8)', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            💊 Section 3 — Medicine Consumption & Ledger Balance
          </h2>
          <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid rgba(226, 232, 240, 0.8)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc' }}>
                  <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '13px', color: '#475569', fontWeight: 700 }}>Medicine Name</th>
                  <th style={{ padding: '14px 20px', textAlign: 'center', fontSize: '13px', color: '#475569', fontWeight: 700 }}>Opening Stock</th>
                  <th style={{ padding: '14px 20px', textAlign: 'center', fontSize: '13px', color: '#475569', fontWeight: 700 }}>Received (+)</th>
                  <th style={{ padding: '14px 20px', textAlign: 'center', fontSize: '13px', color: '#475569', fontWeight: 700 }}>Consumed (-)</th>
                  <th style={{ padding: '14px 20px', textAlign: 'center', fontSize: '13px', color: '#475569', fontWeight: 700 }}>Closing Stock (=)</th>
                </tr>
              </thead>
              <tbody>
                {medicineData.map((row, idx) => (
                  <tr key={idx} style={{ borderTop: '1px solid #e2e8f0', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(248, 250, 252, 0.5)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '14px 20px', fontSize: '13px', color: '#1e293b', fontWeight: 600 }}>
                      <input 
                        type="text" 
                        value={row.name} 
                        onChange={e => { const nd = [...medicineData]; nd[idx] = { ...nd[idx], name: e.target.value }; setMedicineData(nd); }} 
                        style={{ width: '100%', border: 'none', outline: 'none', backgroundColor: 'transparent', fontSize: '13px', fontWeight: 600, color: '#1e293b' }} 
                      />
                    </td>
                    {['opening', 'received', 'consumed', 'closing'].map(field => (
                      <td key={field} style={{ padding: '10px 20px', textAlign: 'center' }}>
                        <input 
                          type="number" 
                          value={row[field]} 
                          onChange={e => { const nd = [...medicineData]; nd[idx] = { ...nd[idx], [field]: parseInt(e.target.value, 10) || 0 }; setMedicineData(nd); }} 
                          style={{ width: '100px', textAlign: 'center', border: '1px solid rgba(203, 213, 225, 0.7)', borderRadius: '8px', padding: '6px', fontSize: '13px', fontWeight: 600, background: 'rgba(255,255,255,0.7)', outline: 'none', transition: 'all 0.2s' }} 
                          onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 8px rgba(2, 132, 199, 0.15)'; }}
                          onBlur={e => { e.target.style.borderColor = 'rgba(203,213,225,0.7)'; e.target.style.boxShadow = 'none'; }}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 4 - Department Visits & Section 5 - Key Compliance & Safety Tracker */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
          
          {/* Department-wise Table */}
          <div className="glass-card animate-slide-in-stagger-3" style={{ padding: '28px', background: 'white' }}>
            <h2 className="text-shine" style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 20px 0', borderBottom: '1px solid rgba(226,232,240,0.8)', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🏭 Section 4 — Department Visits
            </h2>
            <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid rgba(226, 232, 240, 0.8)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc' }}>
                    <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '13px', color: '#475569', fontWeight: 700 }}>Department</th>
                    <th style={{ padding: '14px 20px', textAlign: 'center', fontSize: '13px', color: '#475569', fontWeight: 700, width: '110px' }}>Visits</th>
                    <th style={{ padding: '14px 20px', textAlign: 'center', fontSize: '13px', color: '#475569', fontWeight: 700, width: '110px' }}>Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {deptData.map((row, idx) => (
                    <tr key={idx} style={{ borderTop: '1px solid #e2e8f0', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(248, 250, 252, 0.5)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '14px 20px', fontSize: '13px', color: '#1e293b', fontWeight: 600 }}>
                        <input 
                          type="text" 
                          value={row.department} 
                          onChange={e => { const nd = [...deptData]; nd[idx] = { ...nd[idx], department: e.target.value }; setDeptData(nd); }} 
                          style={{ width: '100%', border: 'none', outline: 'none', backgroundColor: 'transparent', fontSize: '13px', fontWeight: 600 }} 
                        />
                      </td>
                      <td style={{ padding: '10px 20px', textAlign: 'center' }}>
                        <input 
                          type="number" 
                          value={row.visits} 
                          onChange={e => { const nd = [...deptData]; nd[idx] = { ...nd[idx], visits: parseInt(e.target.value, 10) || 0 }; setDeptData(nd); }} 
                          style={{ width: '80px', textAlign: 'center', border: '1px solid rgba(203, 213, 225, 0.7)', borderRadius: '8px', padding: '6px', fontSize: '13px', fontWeight: 600, background: 'rgba(255,255,255,0.7)', outline: 'none', transition: 'all 0.2s' }} 
                          onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 8px rgba(2, 132, 199, 0.15)'; }}
                          onBlur={e => { e.target.style.borderColor = 'rgba(203,213,225,0.7)'; e.target.style.boxShadow = 'none'; }}
                        />
                      </td>
                      <td style={{ padding: '10px 20px', textAlign: 'center' }}>
                        <input 
                          type="text" 
                          value={row.percentage} 
                          onChange={e => { const nd = [...deptData]; nd[idx] = { ...nd[idx], percentage: e.target.value }; setDeptData(nd); }} 
                          style={{ width: '80px', textAlign: 'center', border: '1px solid rgba(203, 213, 225, 0.7)', borderRadius: '8px', padding: '6px', fontSize: '13px', background: 'rgba(255,255,255,0.7)', outline: 'none', transition: 'all 0.2s' }} 
                          onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 8px rgba(2, 132, 199, 0.15)'; }}
                          onBlur={e => { e.target.style.borderColor = 'rgba(203,213,225,0.7)'; e.target.style.boxShadow = 'none'; }}
                        />
                      </td>
                    </tr>
                  ))}
                  <tr style={{ backgroundColor: 'rgba(239, 246, 255, 0.8)', borderTop: '2px solid #bfdbfe' }}>
                    <td style={{ padding: '16px 20px', fontWeight: 700, fontSize: '13px', color: '#1e40af' }}>Total Visits</td>
                    <td style={{ padding: '16px 20px', textAlign: 'center', fontWeight: 700, fontSize: '13px', color: '#1e40af' }}>{deptData.reduce((sum, r) => sum + (r.visits || 0), 0)}</td>
                    <td style={{ padding: '16px 20px', textAlign: 'center', fontWeight: 700, fontSize: '13px', color: '#1e40af' }}>100%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 5 - Compliance Safety Metric Block */}
          <div className="glass-card animate-slide-in-stagger-3" style={{ padding: '28px', background: 'white' }}>
            <h2 className="text-shine" style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 20px 0', borderBottom: '1px solid rgba(226,232,240,0.8)', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🛡️ Section 5 — Health, Safety & Compliance
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', height: 'calc(100% - 40px)' }}>
              
              <div style={{ border: '1px solid rgba(226, 232, 240, 0.8)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'center', background: 'rgba(248, 250, 252, 0.4)', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <HeartPulse size={20} color="#3b82f6" style={{ filter: 'drop-shadow(0 2px 4px rgba(59,130,246,0.2))' }} />
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ambulance Calls</span>
                </div>
                <input type="number" value={complianceStats.ambulanceDispatches} onChange={e => setComplianceStats(prev => ({ ...prev, ambulanceDispatches: parseInt(e.target.value, 10) || 0 }))} style={{ fontSize: '28px', fontWeight: 800, color: '#1e293b', border: 'none', width: '100%', outline: 'none', background: 'transparent' }} />
                <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', fontWeight: 500 }}>Emergency dispatches</span>
              </div>

              <div style={{ border: '1px solid rgba(226, 232, 240, 0.8)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'center', background: 'rgba(248, 250, 252, 0.4)', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <AlertTriangle size={20} color="#eab308" style={{ filter: 'drop-shadow(0 2px 4px rgba(234,179,8,0.2))' }} />
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Bio-Medical Waste</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                  <input type="number" step="0.1" value={complianceStats.bioMedicalWaste} onChange={e => setComplianceStats(prev => ({ ...prev, bioMedicalWaste: parseFloat(e.target.value) || 0 }))} style={{ fontSize: '28px', fontWeight: 800, color: '#1e293b', border: 'none', width: '120px', outline: 'none', background: 'transparent' }} />
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#64748b' }}>kg</span>
                </div>
                <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', fontWeight: 500 }}>Total clinical waste disposed</span>
              </div>

              <div style={{ border: '1px solid rgba(226, 232, 240, 0.8)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'center', background: 'rgba(248, 250, 252, 0.4)', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <ShieldCheck size={20} color="#10b981" style={{ filter: 'drop-shadow(0 2px 4px rgba(16,185,129,0.2))' }} />
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Occ. Diseases</span>
                </div>
                <input type="number" value={complianceStats.activeOccDiseases} onChange={e => setComplianceStats(prev => ({ ...prev, activeOccDiseases: parseInt(e.target.value, 10) || 0 }))} style={{ fontSize: '28px', fontWeight: 800, color: '#1e293b', border: 'none', width: '100%', outline: 'none', background: 'transparent' }} />
                <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', fontWeight: 500 }}>Active registered cases</span>
              </div>

              <div style={{ border: '1px solid rgba(226, 232, 240, 0.8)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'center', backgroundColor: complianceStats.overdueHealthCertificates > 0 ? 'rgba(254,242,242,0.8)' : 'rgba(248, 250, 252, 0.4)', borderColor: complianceStats.overdueHealthCertificates > 0 ? '#fca5a5' : 'rgba(226,232,240,0.8)', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <AlertTriangle size={20} color={complianceStats.overdueHealthCertificates > 0 ? '#ef4444' : '#64748b'} />
                  <span style={{ fontSize: '12px', color: complianceStats.overdueHealthCertificates > 0 ? '#dc2626' : '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Overdue Exams</span>
                </div>
                <input type="number" value={complianceStats.overdueHealthCertificates} onChange={e => setComplianceStats(prev => ({ ...prev, overdueHealthCertificates: parseInt(e.target.value, 10) || 0 }))} style={{ fontSize: '28px', fontWeight: 800, color: complianceStats.overdueHealthCertificates > 0 ? '#b91c1c' : '#1e293b', border: 'none', width: '100%', outline: 'none', backgroundColor: 'transparent' }} />
                <span style={{ fontSize: '11px', color: complianceStats.overdueHealthCertificates > 0 ? '#b91c1c' : '#64748b', marginTop: '4px', fontWeight: 500 }}>Overdue fit certificates</span>
              </div>

            </div>
          </div>

        </div>

        {/* Section 6 - Key Observations */}
        <div className="glass-card animate-slide-in-stagger-3" style={{ padding: '28px', background: 'white' }}>
          <h2 className="text-shine" style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 20px 0', borderBottom: '1px solid rgba(226,232,240,0.8)', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            📝 Section 6 — Key Observations & Recommendations
          </h2>
          <textarea
            value={observations}
            onChange={e => setObservations(e.target.value)}
            rows={7}
            placeholder="Enter monthly findings, observations, and recommendations..."
            style={{
              width: '100%', padding: '16px', border: '1px solid rgba(203,213,225,0.8)', borderRadius: '12px',
              fontSize: '14px', lineHeight: '1.6', fontFamily: 'inherit',
              outline: 'none', resize: 'vertical', backgroundColor: 'rgba(248, 250, 252, 0.5)', boxSizing: 'border-box',
              transition: 'all 0.25s'
            }}
            onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.backgroundColor = '#fff'; e.target.style.boxShadow = '0 0 12px rgba(2, 132, 199, 0.15)'; }}
            onBlur={e => { e.target.style.borderColor = 'rgba(203,213,225,0.8)'; e.target.style.backgroundColor = 'rgba(248,250,252,0.5)'; e.target.style.boxShadow = 'none'; }}
          />
        </div>

        {/* Report Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 0 0', borderTop: '1px solid rgba(226,232,240,0.8)', marginTop: '16px', fontSize: '13px', color: '#64748b', fontWeight: 600 }}>
          <span>Report Generated: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
          <span>{plantLocation} — {selectedMonth} {selectedYear}</span>
        </div>

      </div>
    </div>
  );
};

export default MonthlyMISReport;

