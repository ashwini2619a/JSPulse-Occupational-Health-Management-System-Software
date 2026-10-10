import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

import { Settings, FileSpreadsheet, ZoomIn, ZoomOut, Undo2, Redo2, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Type, PaintBucket, Minus, Plus, Printer, Calculator, Sigma, Search, Replace, Maximize, Minimize, Edit, Eraser, ArrowLeft, ArrowRight, Eye, RotateCcw } from 'lucide-react';
import { getSheetData, saveSheetData, getSheetMeta, saveSheetMeta, deleteSheet } from '../../utils/sheetDB';

const evaluateFormula = (formulaStr, allData, cols, depth = 0) => {
  if (depth > 50) return 0;
  if (!formulaStr || !String(formulaStr).startsWith('=')) return formulaStr;
  try {
    let expr = String(formulaStr).substring(1).toUpperCase();
    
    expr = expr.replace(/SUM\(([A-Z]+)(\d+):([A-Z]+)(\d+)\)/g, (match, c1, r1, c2, r2) => {
      let sum = 0;
      const startR = Math.min(parseInt(r1), parseInt(r2)) - 1;
      const endR = Math.max(parseInt(r1), parseInt(r2)) - 1;
      const c1Idx = cols.findIndex(c => c.letter === c1);
      const c2Idx = cols.findIndex(c => c.letter === c2);
      if (c1Idx === -1 || c2Idx === -1) return 0;
      const startC = Math.min(c1Idx, c2Idx);
      const endC = Math.max(c1Idx, c2Idx);
      for (let r = startR; r <= endR; r++) {
        if (!allData[r]) continue;
        for (let c = startC; c <= endC; c++) {
          const val = allData[r][cols[c].key];
          let numVal = val;
          if (String(val).startsWith('=')) numVal = evaluateFormula(val, allData, cols, depth + 1);
          const num = parseFloat(numVal);
          if (!isNaN(num)) sum += num;
        }
      }
      return sum;
    });

    expr = expr.replace(/([A-Z]+)(\d+)/g, (match, letter, rowStr) => {
      const col = cols.find(c => c.letter === letter);
      if (!col) return 0;
      const rIdx = parseInt(rowStr) - 1;
      if (!allData[rIdx]) return 0;
      const val = allData[rIdx][col.key];
      let numVal = val;
      if (String(val).startsWith('=')) numVal = evaluateFormula(val, allData, cols, depth + 1);
      const num = parseFloat(numVal);
      return isNaN(num) ? 0 : num;
    });

    const result = new Function(`return ${expr}`)();
    return Number.isFinite(result) ? Math.round(result * 100) / 100 : '#ERROR!';
  } catch (err) {
    return '#ERROR!';
  }
};

const getCleanData = (rawRows) => {
  if (!Array.isArray(rawRows)) return [];
  return rawRows.filter(row => {
    if (!row) return false;
    const hasData = Object.keys(row).some(k => {
      if (k === 'id' || k === 'extracted' || k === '_cellStyles' || k === 'status') return false;
      const val = row[k];
      return val !== null && val !== undefined && String(val).trim() !== '';
    });
    const hasStyles = row._cellStyles && Object.keys(row._cellStyles).length > 0;
    return hasData || hasStyles;
  });
};

const isRowEmpty = (row, cols) => {
  if (!row || typeof row !== 'object' || !Array.isArray(cols)) return true;
  return !cols.some(col => {
    if (!col || !col.key) return false;
    const key = String(col.key).toLowerCase();
    
    // Ignore ID, serial numbers, styles, and extraction flags
    if (key === 'id' || key === 'sn' || key === 's.n.' || key === 'serial' || key === 'extracted' || key === '_cellstyles') {
      return false;
    }
    
    // Ignore read-only columns (which are typically auto-calculated)
    if (col.readOnly) {
      return false;
    }
    
    // Ignore standard calculated summary/balance column keys
    if (
      key === 'total' || 
      key === 'totalincoming' || 
      key === 'totaloutgoing' || 
      key === 'finalbalance' || 
      key === 'monthlygrandtotal' || 
      key === 'expirystatus' ||
      key.endsWith('_total') ||
      key.endsWith('_balance')
    ) {
      return false;
    }
    
    const val = row[col.key];
    return val !== null && val !== undefined && String(val).trim() !== '';
  });
};

const getCleanGridData = (rows, cols) => {
  if (!Array.isArray(rows)) return [];
  return rows.filter(row => !isRowEmpty(row, cols));
};

const ExcelGrid = ({ 
  title = "Records", 
  storageKey, 
  initialData = [], 
  columns = [], 
  idPrefix = "ID-",
  getRowStyle = () => ({}),
  getCustomCellContent = null,
  computeRow = null,
  onDataChange = null,
  filters = [],
  toolbarRight = null,
  disableTabs = false,
  disableRenameTabs = true,
  refreshTrigger = 0
}) => {
  const getActiveTabStorageKeyOnMount = () => {
    if (disableTabs) return storageKey;
    try {
      const activeId = localStorage.getItem(`${storageKey}_active_tab_id`) || 'default';
      const savedIndex = localStorage.getItem(`${storageKey}_tabs_index`);
      if (savedIndex) {
        const parsed = JSON.parse(savedIndex);
        if (Array.isArray(parsed)) {
          const found = parsed.find(t => t && t.id === activeId);
          if (found) return found.storageKey;
        }
      }
    } catch (e) {}
    return storageKey;
  };

  const initialActiveStorageKey = getActiveTabStorageKeyOnMount();

  const TABS_INDEX_KEY = `${storageKey}_tabs_index`;

  const [tabs, setTabs] = useState(() => {
    if (disableTabs) return [{ id: 'default', name: title, storageKey: storageKey }];
    try {
      const saved = localStorage.getItem(TABS_INDEX_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [{ id: 'default', name: title, storageKey: storageKey }];
  });

  const [activeTabId, setActiveTabId] = useState(() => {
    if (disableTabs) return 'default';
    try {
      const saved = localStorage.getItem(`${storageKey}_active_tab_id`);
      if (saved) return saved;
    } catch (e) {}
    return 'default';
  });

  const activeTab = (Array.isArray(tabs) ? tabs.find(t => t && t.id === activeTabId) : null) || (Array.isArray(tabs) && tabs[0]) || { id: 'default', name: title, storageKey: storageKey };
  const activeStorageKey = activeTab.storageKey;

  const [data, setData] = useState(() => {
    // Initial loading placeholder: 20 empty rows
    const initialRows = [];
    for (let i = 0; i < 20; i++) {
      const emptyRow = {};
      columns.forEach(c => emptyRow[c.key] = '');
      initialRows.push(emptyRow);
    }
    return initialRows;
  });
  
  const [nextIdNum, setNextIdNum] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(600);
  const [isPrinting, setIsPrinting] = useState(false);
  const [printScale, setPrintScale] = useState(1);
  const [printLayout, setPrintLayout] = useState('landscape');
  
  const [selectedCell, setSelectedCell] = useState(null);
  const [editingCell, setEditingCellState] = useState(null);
  const editStartTimeRef = useRef(0);
  const pendingEditRef = useRef(false); // Track transition into edit mode to buffer keystrokes
  const setEditingCell = useCallback((cell) => {
    setEditingCellState(cell);
    editStartTimeRef.current = cell ? Date.now() : 0;
    if (cell) pendingEditRef.current = true;
  }, []);
  const [rangeStart, setRangeStart] = useState(null);
  const [rangeEnd, setRangeEnd] = useState(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const dragOriginRef = useRef(null); // Track mouse-down origin for drag threshold
  const isDraggingRef = useRef(false); // Only true after mouse moves past threshold
  const [isEraserMode, setIsEraserMode] = useState(false);
  const [activeColor, setActiveColor] = useState('#fef08a');
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [highlightUndoStack, setHighlightUndoStack] = useState([]);
  const [highlightRedoStack, setHighlightRedoStack] = useState([]);
  const [draggingColIdx, setDraggingColIdx] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [hasUnsaved, setHasUnsaved] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [contextMenu, setContextMenu] = useState({ show: false, x: 0, y: 0, row: null, col: null });
  const [toast, setToast] = useState('');
  const [selectionType, setSelectionType] = useState('cell'); // 'cell', 'row', 'column'
  const [zoomLevel, setZoomLevel] = useState(1);
  const [activeFilters, setActiveFilters] = useState({});
  const [editingHeader, setEditingHeader] = useState(null);
  const [editingGroup, setEditingGroup] = useState(null);
  const [editingSuperGroup, setEditingSuperGroup] = useState(null);
  
  const [customColumns, setCustomColumns] = useState(() => columns.map(c => ({ ...c })));
  const [colWidths, setColWidths] = useState(() => {
    const widths = {};
    columns.forEach(col => {
      widths[col.key] = col.width || 120;
    });
    return widths;
  });
  const [rowHeights, setRowHeights] = useState({});
  const [resizingCol, setResizingCol] = useState(null);
  const [resizingRow, setResizingRow] = useState(null);
  const [dragStart, setDragStart] = useState(0);
  const [sizeStart, setSizeStart] = useState(0);

  // Adjustable Import State
  const [importModalData, setImportModalData] = useState(null); // { headers: [], rows: [] }
  const [importMapping, setImportMapping] = useState({}); // { systemColKey: fileColIdx }
  const [pendingWorkbook, setPendingWorkbook] = useState(null); // { workbook, sheetNames: [], fileName }
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Sync customColumns and colWidths when columns prop changes or active tab changes
  useEffect(() => {
    async function loadCols() {
      try {
        // Use global storageKey for column metadata (shared across all tabs)
        let savedCols = await getSheetMeta(`${storageKey}_columns`);
        
        // Migration fallback: check old per-tab key and migrate to global key
        if (!savedCols && activeStorageKey !== storageKey) {
          savedCols = await getSheetMeta(`${activeStorageKey}_columns`);
          if (savedCols) {
            await saveSheetMeta(`${storageKey}_columns`, savedCols);
          }
        }
        
        // Migration fallback from localStorage
        if (!savedCols) {
          const savedLocal = localStorage.getItem(`${storageKey}_columns`) || localStorage.getItem(`${activeStorageKey}_columns`);
          if (savedLocal) {
            try {
              const parsed = JSON.parse(savedLocal);
              if (Array.isArray(parsed)) {
                savedCols = parsed;
                await saveSheetMeta(`${storageKey}_columns`, parsed);
                localStorage.removeItem(`${storageKey}_columns`);
                localStorage.removeItem(`${activeStorageKey}_columns`);
              }
            } catch (e) {}
          }
        }

        if (savedCols) {
          setCustomColumns(columns.map(c => {
            const matched = savedCols.find(p => p && p.key === c.key);
            return matched ? { ...c, label: matched.label, group: matched.group || c.group, superGroup: matched.superGroup || c.superGroup, width: matched.width !== undefined ? matched.width : c.width } : c;
          }));
          
          setColWidths(prev => {
            const widths = { ...prev };
            savedCols.forEach(col => {
              if (col && col.key) {
                widths[col.key] = col.width !== undefined ? col.width : (widths[col.key] || col.width || 120);
              }
            });
            return widths;
          });
        } else {
          setCustomColumns(columns.map(c => ({ ...c })));
          setColWidths(prev => {
            const widths = { ...prev };
            columns.forEach(col => {
              if (col && col.key) {
                widths[col.key] = col.width || 120;
              }
            });
            return widths;
          });
        }
      } catch (err) {
        console.error("Failed to load columns:", err);
      }
    }

    loadCols();
  }, [columns, activeStorageKey]);

  // Handle pending search from dashboard alerts deep-linking
  useEffect(() => {
    const pendingSearch = localStorage.getItem('cms_pending_grid_search');
    if (!pendingSearch) return;

    // Safety timeout to clear pending search if no match is found after 2 seconds
    const timeoutId = setTimeout(() => {
      localStorage.removeItem('cms_pending_grid_search');
    }, 2000);

    const termLower = pendingSearch.toLowerCase();
    const matchedRowIdx = data.findIndex(row => {
      return customColumns.some(col => {
        const val = row[col.key];
        if (val === null || val === undefined) return false;
        return String(val).toLowerCase().includes(termLower);
      });
    });

    if (matchedRowIdx !== -1) {
      setSearchTerm(pendingSearch);
      
      const colIdx = customColumns.length > 2 ? 2 : (customColumns.length > 1 ? 1 : 0);
      setSelectedCell({ row: matchedRowIdx, col: colIdx });
      setRangeStart({ row: matchedRowIdx, col: colIdx });
      setRangeEnd({ row: matchedRowIdx, col: colIdx });
      
      localStorage.removeItem('cms_pending_grid_search');
      clearTimeout(timeoutId);

      setTimeout(() => {
        const selectedEl = document.querySelector('.cell-selected, [data-selected="true"]');
        if (selectedEl) {
          selectedEl.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' });
        }
      }, 300);
    }

    return () => clearTimeout(timeoutId);
  }, [activeStorageKey, data, customColumns]);

  // Sync when activeTabId changes
  useEffect(() => {
    if (disableTabs) return;
    try {
      localStorage.setItem(`${storageKey}_active_tab_id`, activeTabId);
    } catch (e) {
      console.error('[ExcelGrid] Failed to save active tab ID:', e);
    }
    
    setSelectedCell(null);
    setEditingCell(null);
    setRangeStart(null);
    setRangeEnd(null);

    // Reset scroll tracking values for the new tab
    lastScrollLeftRef.current = 0;
    lastScrollTopRef.current = 0;
  }, [activeTabId, activeStorageKey, disableTabs]);

  // Handle mouse movements for column/row resizing
  useEffect(() => {
    if (resizingCol === null && resizingRow === null) return;

    const handleMouseMove = (e) => {
      if (resizingCol !== null) {
        const delta = e.clientX - dragStart;
        const newWidth = Math.max(60, sizeStart + delta);
        setColWidths(prev => ({ ...prev, [resizingCol]: newWidth }));
        latestWidthRef.current = newWidth;
      } else if (resizingRow !== null) {
        const delta = e.clientY - dragStart;
        const newHeight = Math.max(24, sizeStart + delta);
        setRowHeights(prev => ({ ...prev, [resizingRow]: newHeight }));
      }
    };

    const handleMouseUp = () => {
      if (resizingCol !== null && latestWidthRef.current !== undefined) {
        const finalWidth = latestWidthRef.current;
        setCustomColumns(prevCols => {
          const newCols = prevCols.map(c => c.key === resizingCol ? { ...c, width: finalWidth } : c);
          saveSheetMeta(`${storageKey}_columns`, newCols).catch(err => console.error(err));
          return newCols;
        });
        latestWidthRef.current = undefined;
      }
      setResizingCol(null);
      setResizingRow(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingCol, resizingRow, dragStart, sizeStart]);

  // Tab management logic inside ExcelGrid
  const saveTabsIndex = (updatedTabs) => {
    try {
      localStorage.setItem(TABS_INDEX_KEY, JSON.stringify(updatedTabs));
    } catch (e) {
      console.error('[ExcelGrid] Failed to save tabs index:', e);
    }
  };

  const handleCreateTab = async () => {
    let sheetName = `Sheet ${tabs.length + 1}`;
    if (!disableRenameTabs) {
      try {
        const input = prompt("Enter a name for the new sheet:", sheetName);
        if (input === null) return; // Cancelled
        const trimmed = input.trim();
        if (trimmed) sheetName = trimmed;
      } catch (err) {
        console.warn("Prompt blocked, using default name:", err);
      }
    }

    const id = 'tab_' + Date.now();
    const tabStorageKey = `${storageKey}_tab_${id}`;
    
    const newTab = {
      id,
      name: sheetName,
      storageKey: tabStorageKey
    };

    const emptyRows = [];
    for (let r = 0; r < 20; r++) {
      const emptyRow = {};
      customColumns.forEach(c => emptyRow[c.key] = '');
      emptyRows.push(emptyRow);
    }
    await saveSheetData(tabStorageKey, emptyRows);
    await saveSheetMeta(`${tabStorageKey}_nextid`, 1);

    const updated = [...tabs, newTab];
    setTabs(updated);
    saveTabsIndex(updated);
    setActiveTabId(id);
  };

  const handleDeleteTab = (id) => {
    if (id === 'default') {
      alert("Cannot delete the default sheet.");
      return;
    }
    if (tabs.length <= 1) {
      alert("Cannot delete the last remaining sheet.");
      return;
    }
    if (!confirm('Delete this sheet and all its data?')) return;
    
    const tab = tabs.find(t => t.id === id);
    if (tab) {
      deleteSheet(tab.storageKey);
    }

    const updated = tabs.filter(t => t.id !== id);
    setTabs(updated);
    saveTabsIndex(updated);

    if (activeTabId === id) {
      setActiveTabId(updated[0].id);
    }
  };

  const [editingTabId, setEditingTabId] = useState(null);
  const [editingTabName, setEditingTabName] = useState('');

  const handleRenameTab = (id) => {
    if (!editingTabName.trim()) return;
    const updated = tabs.map(t => t.id === id ? { ...t, name: editingTabName.trim() } : t);
    setTabs(updated);
    saveTabsIndex(updated);
    setEditingTabId(null);
  };

  // Notify parent of data changes instantly to avoid race conditions with toolbar action buttons
  useEffect(() => {
    if (!isLoading && onDataChange) {
      onDataChange(getCleanGridData(data, customColumns));
    }
  }, [data, customColumns, isLoading, onDataChange]);

  // Force reset unsaved state, close active editor, and refocus grid when parent triggers a refresh
  const lastRefreshTriggerRef = useRef(refreshTrigger);
  useEffect(() => {
    if (refreshTrigger !== lastRefreshTriggerRef.current) {
      lastRefreshTriggerRef.current = refreshTrigger;
      setHasUnsaved(false);
      setEditingCell(null);
      setTimeout(() => {
        if (gridContainerRef.current) {
          gridContainerRef.current.focus({ preventScroll: true });
        }
      }, 50);
    }
  }, [refreshTrigger]);

  // Focus the grid container on mount or when loading completes
  useEffect(() => {
    if (!isLoading && gridContainerRef.current) {
      const timer = setTimeout(() => {
        if (gridContainerRef.current) {
          gridContainerRef.current.focus({ preventScroll: true });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  // Debounced auto-save strictly to IndexedDB to bypass localStorage limits and prevent main-thread lag
  useEffect(() => {
    if (isLoading) return; // Don't save while initial data is still loading

    const timer = setTimeout(async () => {
      try {
        const cleanData = getCleanGridData(data, customColumns);
        await saveSheetData(activeStorageKey, cleanData);
        await saveSheetMeta(`${activeStorageKey}_nextid`, nextIdNum);
        await saveSheetMeta(`${storageKey}_columns`, customColumns);
      } catch (e) {
        console.error('Failed to auto-save to IndexedDB:', e);
        setToast('❌ Critical: Database auto-save failed!');
      }
    }, 1000); // 1-second debounce to smooth out consecutive edits

    return () => clearTimeout(timer);
  }, [data, activeStorageKey, nextIdNum, customColumns, isLoading]);

  const editingCellRef = useRef(editingCell);
  useEffect(() => {
    editingCellRef.current = editingCell;
  }, [editingCell]);

  const hasUnsavedRef = useRef(hasUnsaved);
  useEffect(() => {
    hasUnsavedRef.current = hasUnsaved;
  }, [hasUnsaved]);

  const lastStorageKeyRef = useRef(activeStorageKey);

  // Asynchronous primary data loading from IndexedDB (with localStorage migration fallback)
  useEffect(() => {
    let active = true;
    
    // Only show full loading overlay if the sheet key actually changed (switching tabs or months)
    if (lastStorageKeyRef.current !== activeStorageKey) {
      setIsLoading(true);
      lastStorageKeyRef.current = activeStorageKey;
    }

    async function loadData() {
      if (editingCellRef.current || hasUnsavedRef.current) {
        return;
      }
      try {
        // 1. Try to load from IndexedDB first
        let loadedData = await getSheetData(activeStorageKey);
        let nextId = await getSheetMeta(`${activeStorageKey}_nextid`);
        let loadedCols = await getSheetMeta(`${storageKey}_columns`);

        // 2. Migration fallback: check if data exists in localStorage but not in IndexedDB
        if (!loadedData) {
          const savedLocal = localStorage.getItem(activeStorageKey);
          if (savedLocal) {
            try {
              const parsed = JSON.parse(savedLocal);
              if (Array.isArray(parsed)) {
                loadedData = parsed;
                await saveSheetData(activeStorageKey, parsed);
                localStorage.removeItem(activeStorageKey);
                console.log(`[SheetDB] Migrated sheet data for ${activeStorageKey} to IndexedDB.`);
              }
            } catch (e) {}
          }
        }

        if (!nextId) {
          const savedLocalNextId = localStorage.getItem(`${activeStorageKey}_nextid`);
          if (savedLocalNextId) {
            nextId = parseInt(savedLocalNextId) || 1;
            await saveSheetMeta(`${activeStorageKey}_nextid`, nextId);
            localStorage.removeItem(`${activeStorageKey}_nextid`);
          }
        }

        if (!loadedCols) {
          // Migration: check old per-tab key in IndexedDB
          if (activeStorageKey !== storageKey) {
            loadedCols = await getSheetMeta(`${activeStorageKey}_columns`);
            if (loadedCols) {
              await saveSheetMeta(`${storageKey}_columns`, loadedCols);
            }
          }
        }
        if (!loadedCols) {
          const savedLocalCols = localStorage.getItem(`${storageKey}_columns`) || localStorage.getItem(`${activeStorageKey}_columns`);
          if (savedLocalCols) {
            try {
              const parsed = JSON.parse(savedLocalCols);
              if (Array.isArray(parsed)) {
                loadedCols = parsed;
                await saveSheetMeta(`${storageKey}_columns`, parsed);
                localStorage.removeItem(`${storageKey}_columns`);
                localStorage.removeItem(`${activeStorageKey}_columns`);
              }
            } catch (e) {}
          }
        }

        // 3. Process the loaded data
        if (!loadedData || loadedData.length === 0) {
          loadedData = initialData || [];
        }
        loadedData = getCleanGridData(loadedData, columns);

        if (computeRow && loadedData.length > 0) {
          loadedData = loadedData.map(r => {
            try {
              return computeRow(r);
            } catch (e) {
              return r;
            }
          });
        }

        // Pad to minimum 20 rows
        const padded = [...loadedData];
        while (padded.length < 20) {
          const emptyRow = {};
          columns.forEach(c => emptyRow[c.key] = '');
          padded.push(emptyRow);
        }

        if (active) {
          setData(padded);
          setNextIdNum(nextId || 1);
          if (loadedCols) {
            setCustomColumns(columns.map(c => {
              const matched = loadedCols.find(p => p && p.key === c.key);
              return matched ? { ...c, label: matched.label, group: matched.group || c.group, superGroup: matched.superGroup || c.superGroup, width: matched.width !== undefined ? matched.width : c.width } : c;
            }));
            setColWidths(prev => {
              const widths = { ...prev };
              loadedCols.forEach(col => {
                if (col && col.key) {
                  widths[col.key] = col.width !== undefined ? col.width : (widths[col.key] || col.width || 120);
                }
              });
              return widths;
            });
          } else {
            setCustomColumns(columns.map(c => ({ ...c })));
            setColWidths(prev => {
              const widths = { ...prev };
              columns.forEach(col => {
                if (col && col.key) {
                  widths[col.key] = col.width || 120;
                }
              });
              return widths;
            });
          }
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Failed to load spreadsheet from IndexedDB, attempting auto-repair:", err);
        if (active) {
          try {
            let fallbackData = initialData || [];
            fallbackData = getCleanGridData(fallbackData, columns);
            if (computeRow && fallbackData.length > 0) {
              fallbackData = fallbackData.map(r => {
                try { return computeRow(r); } catch { return r; }
              });
            }
            const padded = [...fallbackData];
            while (padded.length < 20) {
              const emptyRow = {};
              columns.forEach(c => emptyRow[c.key] = '');
              padded.push(emptyRow);
            }
            setData(padded);
            setNextIdNum(1);
            saveSheetData(activeStorageKey, padded).catch(saveErr => console.error('[ExcelGrid] Repair save failed:', saveErr));
            showToast('Sheet data recovered from database corruption.');
          } catch (repairErr) {
            console.error('Database auto-repair failed:', repairErr);
          }
          setIsLoading(false);
        }
      }
    }

    loadData();
    return () => {
      active = false;
    };
  }, [activeStorageKey, columns, computeRow, refreshTrigger]);


  const tableRef = useRef(null);
  const editInputRef = useRef(null);
  const gridContainerRef = useRef(null);
  const lastScrollLeftRef = useRef(0);
  const lastScrollTopRef = useRef(0);
  const latestWidthRef = useRef(undefined);
  const isFocusTransitionRef = useRef(false);
  const mousePositionRef = useRef({ x: 0, y: 0 });
  const scrollIntervalRef = useRef(null);

  const term = searchTerm.toLowerCase();
  const filteredData = useMemo(() => {
    let result = data;
    
    // Apply column filters
    if (Object.keys(activeFilters).length > 0) {
      result = result.filter(row => {
        for (const [key, val] of Object.entries(activeFilters)) {
          if (val && val !== '' && row[key] !== val) return false;
        }
        return true;
      });
    }

    // Apply search term
    if (term !== '') {
      result = result.filter(row => {
        return customColumns.some(col => {
          const val = row[col.key];
          if (val === null || val === undefined) return false;
          return String(val).toLowerCase().includes(term);
        });
      });
    }
    
    return result;
  }, [data, term, customColumns, activeFilters]);

  // O(1) row to absolute index map
  const rowToIndexMap = useMemo(() => {
    const map = new Map();
    for (let i = 0; i < data.length; i++) {
      map.set(data[i], i);
    }
    return map;
  }, [data]);

  // O(1) row to filtered index map
  const rowToFilteredIndexMap = useMemo(() => {
    const map = new Map();
    for (let i = 0; i < filteredData.length; i++) {
      map.set(filteredData[i], i);
    }
    return map;
  }, [filteredData]);

  // Precomputed range selection bounds for O(1) cell selection checks
  const selectionBounds = useMemo(() => {
    if (!rangeStart || !rangeEnd) return null;
    const startRowObj = data[rangeStart.row];
    const endRowObj = data[rangeEnd.row];
    if (!startRowObj || !endRowObj) return null;
    const startFIdx = rowToFilteredIndexMap.get(startRowObj);
    const endFIdx = rowToFilteredIndexMap.get(endRowObj);
    if (startFIdx === undefined || endFIdx === undefined) return null;
    return {
      minF: Math.min(startFIdx, endFIdx),
      maxF: Math.max(startFIdx, endFIdx),
      minC: Math.min(rangeStart.col, rangeEnd.col),
      maxC: Math.max(rangeStart.col, rangeEnd.col)
    };
  }, [rangeStart, rangeEnd, data, rowToFilteredIndexMap]);

  // O(1) check if a cell is inside the selected range
  const isCellInRange = useCallback((originalIdx, col) => {
    if (!selectionBounds) return false;
    const rowObj = data[originalIdx];
    if (!rowObj) return false;
    const fIdx = rowToFilteredIndexMap.get(rowObj);
    if (fIdx === undefined) return false;
    return fIdx >= selectionBounds.minF && fIdx <= selectionBounds.maxF && col >= selectionBounds.minC && col <= selectionBounds.maxC;
  }, [selectionBounds, data, rowToFilteredIndexMap]);

  // Calculate selection metrics
  const selectionMetrics = useMemo(() => {
    if (!rangeStart || !rangeEnd) return null;
    let r1 = Math.min(rangeStart.row, rangeEnd.row);
    let r2 = Math.max(rangeStart.row, rangeEnd.row);
    let c1 = Math.min(rangeStart.col, rangeEnd.col);
    let c2 = Math.max(rangeStart.col, rangeEnd.col);

    // If it's a single cell, don't show metrics
    if (r1 === r2 && c1 === c2) return null;

    let sum = 0;
    let count = 0;
    let countA = 0;
    let min = Infinity;
    let max = -Infinity;
    const numericValues = [];

    for (let r = r1; r <= r2; r++) {
      const rowData = data[r];
      if (!rowData) continue;

      for (let c = c1; c <= c2; c++) {
        if (c >= customColumns.length) continue;
        const val = rowData[customColumns[c].key];
        if (val !== null && val !== undefined && val !== '') {
          countA++;
          const num = Number(val);
          if (!isNaN(num)) {
            sum += num;
            count++;
            numericValues.push(num);
            if (num < min) min = num;
            if (num > max) max = num;
          }
        }
      }
    }

    if (countA === 0) return null;

    // Calculate MEDIAN
    let median = null;
    if (numericValues.length > 0) {
      const sorted = [...numericValues].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      median = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    }

    // Calculate STDEV (sample standard deviation)
    let stdev = null;
    if (numericValues.length > 1) {
      const mean = sum / count;
      const squaredDiffs = numericValues.map(v => Math.pow(v - mean, 2));
      const variance = squaredDiffs.reduce((a, b) => a + b, 0) / (numericValues.length - 1);
      stdev = Math.sqrt(variance);
    }

    return {
      sum: count > 0 ? sum : null,
      avg: count > 0 ? (sum / count) : null,
      count: count,
      countA: countA,
      min: count > 0 ? min : null,
      max: count > 0 ? max : null,
      median: median,
      stdev: stdev
    };
  }, [rangeStart, rangeEnd, data, customColumns]);

  const [showTotals, setShowTotals] = useState(false);

  // Sync with parent is handled by the auto-save useEffect, so this is redundant

  // Focus input when editing starts
  useEffect(() => {
    if (editingCell && editInputRef.current) {
      editInputRef.current.focus();
      if (editInputRef.current.type === 'text') {
        const val = editInputRef.current.value || '';
        try {
          editInputRef.current.setSelectionRange(val.length, val.length);
        } catch (e) {
          // Ignore DOMExceptions for unsupported input types
        }
      }
      // Clear the pending-edit flag now that the input is focused
      pendingEditRef.current = false;
    }
  }, [editingCell]);

  // Handle global clicks to close context menu
  useEffect(() => {
    const handleClick = () => {
      if (contextMenu.show) setContextMenu(prev => ({ ...prev, show: false }));
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [contextMenu.show]);

  // Handle global mouse up for selection
  useEffect(() => {
    const handleMouseUp = () => {
      setIsSelecting(false);
      isDraggingRef.current = false;
      dragOriginRef.current = null;
    };
    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, []);

  // Handle auto-scroll and selection updates during drag selection
  useEffect(() => {
    if (!isSelecting) {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
        scrollIntervalRef.current = null;
      }
      return;
    }

    const handleMouseMove = (e) => {
      mousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    window.addEventListener('mousemove', handleMouseMove);

    const container = gridContainerRef.current;
    if (!container) return;

    scrollIntervalRef.current = setInterval(() => {
      if (!isDraggingRef.current) return;

      const rect = container.getBoundingClientRect();
      const { x: clientX, y: clientY } = mousePositionRef.current;

      const edgeThreshold = 40; // px
      const maxScrollSpeed = 20; // px per tick

      let scrollX = 0;
      let scrollY = 0;

      if (clientY > rect.bottom - edgeThreshold) {
        scrollY = Math.min(maxScrollSpeed, ((clientY - (rect.bottom - edgeThreshold)) / edgeThreshold) * maxScrollSpeed);
        if (scrollY < 4) scrollY = 4;
      } else if (clientY < rect.top + edgeThreshold) {
        scrollY = -Math.min(maxScrollSpeed, (((rect.top + edgeThreshold) - clientY) / edgeThreshold) * maxScrollSpeed);
        if (scrollY > -4) scrollY = -4;
      }

      if (clientX > rect.right - edgeThreshold) {
        scrollX = Math.min(maxScrollSpeed, ((clientX - (rect.right - edgeThreshold)) / edgeThreshold) * maxScrollSpeed);
        if (scrollX < 4) scrollX = 4;
      } else if (clientX < rect.left + edgeThreshold) {
        scrollX = -Math.min(maxScrollSpeed, (((rect.left + edgeThreshold) - clientX) / edgeThreshold) * maxScrollSpeed);
        if (scrollX > -4) scrollX = -4;
      }

      if (scrollX !== 0 || scrollY !== 0) {
        container.scrollLeft += scrollX;
        container.scrollTop += scrollY;

        try {
          const element = document.elementFromPoint(clientX, clientY);
          if (element) {
            const td = element.closest('td');
            if (td && td.id) {
              const match = td.id.match(/cell-.+-(\d+)-(\d+)$/);
              if (match) {
                const row = parseInt(match[1], 10);
                const col = parseInt(match[2], 10);
                setRangeEnd({ row, col });
              }
            }
          }
        } catch (err) {
          console.error("Error updating cell selection: ", err);
        }
      }
    }, 16);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
        scrollIntervalRef.current = null;
      }
    };
  }, [isSelecting, activeStorageKey]);

  // Scroll and Resize observer for virtualization container measurements
  useEffect(() => {
    const container = gridContainerRef.current;
    if (!container) return;
    
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setContainerHeight(entry.contentRect.height || 600);
      }
    });
    resizeObserver.observe(container);
    
    const handleScrollEvent = () => {
      setScrollTop(container.scrollTop);
      // Always track scroll position unless we are in a programmatic focus transition
      if (!isFocusTransitionRef.current) {
        lastScrollLeftRef.current = container.scrollLeft;
        lastScrollTopRef.current = container.scrollTop;
      }
    };
    
    container.addEventListener('scroll', handleScrollEvent, { passive: true });
    // Initial dimensions
    setContainerHeight(container.clientHeight || 600);
    setScrollTop(container.scrollTop);
    
    return () => {
      resizeObserver.disconnect();
      container.removeEventListener('scroll', handleScrollEvent);
    };
  }, []);

  // Print detection to disable virtualization, ensuring all rows render for print/PDF export
  useEffect(() => {
    const handleBeforePrint = () => setIsPrinting(true);
    const handleAfterPrint = () => setIsPrinting(false);
    
    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleAfterPrint);
    
    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, []);

  // Prevent browser scroll jumps when editing ends
  useEffect(() => {
    if (!editingCell && !editingHeader && !editingGroup && !editingSuperGroup && gridContainerRef.current) {
      gridContainerRef.current.focus({ preventScroll: true });
    }
  }, [editingCell, editingHeader, editingGroup, editingSuperGroup]);

  // Viewport alignment on keyboard selectedCell change removed to prevent auto-scrolling on mouse click

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  }

  const pushUndo = useCallback(() => {
    setUndoStack(prev => {
      const newStack = [...prev, { data: JSON.parse(JSON.stringify(data)), columns: JSON.parse(JSON.stringify(customColumns)) }];
      if (newStack.length > 30) newStack.shift();
      return newStack;
    });
    setRedoStack([]);
  }, [data, customColumns]);

  const pushHighlightUndo = useCallback(() => {
    const bgState = data.map(row => {
      const bgStyles = {};
      if (row._cellStyles) {
        Object.keys(row._cellStyles).forEach(colKey => {
          const style = row._cellStyles[colKey];
          if (typeof style === 'string') {
            bgStyles[colKey] = style;
          } else if (style && style.background) {
            bgStyles[colKey] = style.background;
          }
        });
      }
      return bgStyles;
    });
    setHighlightUndoStack(prev => {
      const newStack = [...prev, bgState];
      if (newStack.length > 30) newStack.shift();
      return newStack;
    });
    setHighlightRedoStack([]);
  }, [data]);

  const handleHighlightUndo = useCallback(() => {
    if (highlightUndoStack.length === 0) return;
    const currentBgState = data.map(row => {
      const bgStyles = {};
      if (row._cellStyles) {
        Object.keys(row._cellStyles).forEach(colKey => {
          const style = row._cellStyles[colKey];
          if (typeof style === 'string') {
            bgStyles[colKey] = style;
          } else if (style && style.background) {
            bgStyles[colKey] = style.background;
          }
        });
      }
      return bgStyles;
    });
    setHighlightRedoStack(prev => [...prev, currentBgState]);
    const previousBgState = highlightUndoStack[highlightUndoStack.length - 1];
    setData(prev => prev.map((row, idx) => {
      if (idx >= previousBgState.length) return row;
      const updatedRow = { ...row };
      updatedRow._cellStyles = { ...row._cellStyles };
      Object.keys(updatedRow._cellStyles).forEach(colKey => {
        const style = updatedRow._cellStyles[colKey];
        if (typeof style === 'string') {
          delete updatedRow._cellStyles[colKey];
        } else if (style) {
          const newStyle = { ...style };
          delete newStyle.background;
          updatedRow._cellStyles[colKey] = newStyle;
        }
      });
      const rowBgs = previousBgState[idx];
      Object.keys(rowBgs).forEach(colKey => {
        let currentStyle = updatedRow._cellStyles[colKey];
        if (typeof currentStyle === 'string') {
          currentStyle = { background: currentStyle };
        } else if (!currentStyle) {
          currentStyle = {};
        }
        updatedRow._cellStyles[colKey] = { ...currentStyle, background: rowBgs[colKey] };
      });
      return updatedRow;
    }));
    setHighlightUndoStack(prev => prev.slice(0, -1));
    setHasUnsaved(true);
  }, [data, highlightUndoStack]);

  const handleHighlightRedo = useCallback(() => {
    if (highlightRedoStack.length === 0) return;
    const currentBgState = data.map(row => {
      const bgStyles = {};
      if (row._cellStyles) {
        Object.keys(row._cellStyles).forEach(colKey => {
          const style = row._cellStyles[colKey];
          if (typeof style === 'string') {
            bgStyles[colKey] = style;
          } else if (style && style.background) {
            bgStyles[colKey] = style.background;
          }
        });
      }
      return bgStyles;
    });
    setHighlightUndoStack(prev => [...prev, currentBgState]);
    const nextBgState = highlightRedoStack[highlightRedoStack.length - 1];
    setData(prev => prev.map((row, idx) => {
      if (idx >= nextBgState.length) return row;
      const updatedRow = { ...row };
      updatedRow._cellStyles = { ...row._cellStyles };
      Object.keys(updatedRow._cellStyles).forEach(colKey => {
        const style = updatedRow._cellStyles[colKey];
        if (typeof style === 'string') {
          delete updatedRow._cellStyles[colKey];
        } else if (style) {
          const newStyle = { ...style };
          delete newStyle.background;
          updatedRow._cellStyles[colKey] = newStyle;
        }
      });
      const rowBgs = nextBgState[idx];
      Object.keys(rowBgs).forEach(colKey => {
        let currentStyle = updatedRow._cellStyles[colKey];
        if (typeof currentStyle === 'string') {
          currentStyle = { background: currentStyle };
        } else if (!currentStyle) {
          currentStyle = {};
        }
        updatedRow._cellStyles[colKey] = { ...currentStyle, background: rowBgs[colKey] };
      });
      return updatedRow;
    }));
    setHighlightRedoStack(prev => prev.slice(0, -1));
    setHasUnsaved(true);
  }, [data, highlightRedoStack]);

  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    setRedoStack(prev => [...prev, { data: JSON.parse(JSON.stringify(data)), columns: JSON.parse(JSON.stringify(customColumns)) }]);
    const previousState = undoStack[undoStack.length - 1];
    
    if (Array.isArray(previousState)) {
      setData(previousState);
    } else {
      setData(previousState.data);
      setCustomColumns(previousState.columns);
    }
    
    setUndoStack(prev => prev.slice(0, -1));
    setEditingCell(null);
    setHasUnsaved(true);
  }, [data, customColumns, undoStack]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    setUndoStack(prev => [...prev, { data: JSON.parse(JSON.stringify(data)), columns: JSON.parse(JSON.stringify(customColumns)) }]);
    const nextState = redoStack[redoStack.length - 1];
    
    if (Array.isArray(nextState)) {
      setData(nextState);
    } else {
      setData(nextState.data);
      setCustomColumns(nextState.columns);
    }
    
    setRedoStack(prev => prev.slice(0, -1));
    setEditingCell(null);
    setHasUnsaved(true);
  }, [data, customColumns, redoStack]);

  const [showAnalysisMenu, setShowAnalysisMenu] = useState(false);
  
  const handleAnalyze = (action) => {
    setShowAnalysisMenu(false);
    if (!selectedCell && !rangeStart) {
      showToast('Please select a column to analyze.');
      return;
    }
    const cIdx = selectedCell ? selectedCell.col : rangeStart.col;
    if (cIdx >= customColumns.length) return;
    
    const colKey = customColumns[cIdx].key;
    const colLabel = customColumns[cIdx].label;

    // Smart detection: block math operations on logical fields
    const skipPatterns = [
      'age', 'mobile', 'phone', 'tel', 'contact', 'pin', 'zip', 'code',
      'id', 'empid', 'employee_id', 'employeeid', 's.n', 'sn', 'serial', 'sr',
      'date', 'time', 'year', 'month', 'day', 'dob', 'joining',
      'name', 'patient', 'employee', 'doctor', 'nurse', 'person',
      'department', 'dept', 'designation', 'shift', 'location', 'address',
      'remark', 'note', 'observation', 'status', 'gender', 'sex',
      'blood', 'group', 'batch', 'lot', 'rack', 'manufacturer',
      'complaint', 'diagnosis', 'treatment', 'medicine', 'prescribed',
      'referred', 'reported', 'checked', 'escorted', 'administered',
      'allerg', 'condition', 'effect', 'signature', 'ambulance',
      'body', 'part', 'nature', 'type', 'category', 'unit', 'dose',
      'vaccine', 'item', 'ppe', 'complian', 'fitness', 'vision',
      'hearing', 'lung', 'x-ray', 'ecg', 'overall', 'test', 'result',
      'expiry', 'replace', 'issue', 'emergency', 'response',
      'lastupdate', 'last_update', 'lastupdated',
      'handover', 'outside', 'g.code', 'gcode',
    ];
    
    const k = colKey.toLowerCase().replace(/[_\-\s]/g, '');
    const l = colLabel.toLowerCase().replace(/[_\-\s]/g, '');
    const isLogicalCol = customColumns[cIdx].type === 'date' || 
                         customColumns[cIdx].type === 'datetime-local' || 
                         customColumns[cIdx].type === 'select' || 
                         skipPatterns.some(p => {
                           const pattern = p.replace(/[_\-\s]/g, '');
                           return k.includes(pattern) || l.includes(pattern);
                         });

    const mathActions = ['running_total', 'rank', 'percent_total', 'sumif', 'averageif', 'top3', 'bottom3', 'math_multiply', 'math_add', 'math_subtract', 'math_divide', 'math_constant', 'quick_stats'];
    
    if (mathActions.includes(action) && isLogicalCol) {
      showToast(`Cannot perform mathematical operations on a logical or descriptive column ("${colLabel}"). Please select a numerical column like Quantity or Amount.`, 'error');
      return;
    }

    pushUndo();
    
    if (action === 'running_total') {
      const newKey = `customCol_${Date.now()}`;
      const newCol = { key: newKey, label: `Running Total (${colLabel})`, width: 150, type: 'number' };
      setCustomColumns(prev => [...prev, newCol]);
      setColWidths(prev => ({ ...prev, [newKey]: 150 }));
      
      let runningSum = 0;
      setData(prev => prev.map(row => {
        const val = Number(row[colKey]);
        if (!isNaN(val)) runningSum += val;
        return { ...row, [newKey]: runningSum };
      }));
    } 
    else if (action === 'rank') {
      const newKey = `customCol_${Date.now()}`;
      const newCol = { key: newKey, label: `Rank (${colLabel})`, width: 120, type: 'number' };
      setCustomColumns(prev => [...prev, newCol]);
      setColWidths(prev => ({ ...prev, [newKey]: 120 }));
      
      // Proper dense ranking: sort unique values, map each to its rank
      const allNums = data.map(r => Number(r[colKey])).filter(n => !isNaN(n));
      const uniqueSorted = [...new Set(allNums)].sort((a, b) => b - a);
      const rankMap = new Map();
      uniqueSorted.forEach((v, i) => rankMap.set(v, i + 1));
      
      setData(prev => prev.map(row => {
        const val = Number(row[colKey]);
        return { ...row, [newKey]: !isNaN(val) ? rankMap.get(val) : '' };
      }));
    }
    else if (action === 'percent_total') {
      const newKey = `customCol_${Date.now()}`;
      const newCol = { key: newKey, label: `% of Total (${colLabel})`, width: 150, type: 'text' };
      setCustomColumns(prev => [...prev, newCol]);
      setColWidths(prev => ({ ...prev, [newKey]: 150 }));
      
      const total = data.reduce((sum, r) => {
        const val = Number(r[colKey]);
        return sum + (isNaN(val) ? 0 : val);
      }, 0);

      setData(prev => prev.map(row => {
        const val = Number(row[colKey]);
        let pct = '';
        if (!isNaN(val) && total !== 0) {
          pct = ((val / total) * 100).toFixed(2) + '%';
        }
        return { ...row, [newKey]: pct };
      }));
    }
    else if (action === 'top3' || action === 'bottom3') {
      const isTop = action === 'top3';
      const allNums = data.map(r => Number(r[colKey])).filter(n => !isNaN(n));
      const uniqueSorted = [...new Set(allNums)].sort((a, b) => isTop ? b - a : a - b);
      const thresholdSet = new Set(uniqueSorted.slice(0, 3));
      
      setData(prev => prev.map(row => {
        const val = Number(row[colKey]);
        if (!isNaN(val) && thresholdSet.has(val)) {
          const currentStyle = row._cellStyles ? row._cellStyles[colKey] : {};
          return {
            ...row,
            _cellStyles: {
              ...row._cellStyles,
              [colKey]: { ...currentStyle, background: isTop ? '#dcfce7' : '#fee2e2', color: isTop ? '#166534' : '#991b1b', bold: true }
            }
          };
        }
        return row;
      }));
    }
    else if (action === 'countif') {
      const searchVal = prompt(`Count cells in "${colLabel}" that match value:`);
      if (searchVal === null) return;
      const matchCount = data.filter(r => String(r[colKey] || '').toLowerCase() === searchVal.toLowerCase()).length;
      showToast(`COUNTIF result: ${matchCount} rows match "${searchVal}" in ${colLabel}`);
      return; // No data modification
    }
    else if (action === 'sumif') {
      const searchVal = prompt(`Sum "${colLabel}" where value in which column matches? Enter column name:`);
      if (searchVal === null) return;
      const condCol = customColumns.find(c => c.label.toLowerCase() === searchVal.toLowerCase());
      if (!condCol) { showToast(`Column "${searchVal}" not found.`); return; }
      const condVal = prompt(`Sum "${colLabel}" where "${condCol.label}" equals:`);
      if (condVal === null) return;
      const result = data.reduce((sum, r) => {
        if (String(r[condCol.key] || '').toLowerCase() === condVal.toLowerCase()) {
          const num = Number(r[colKey]);
          if (!isNaN(num)) sum += num;
        }
        return sum;
      }, 0);
      showToast(`SUMIF result: ${result.toLocaleString()} (Sum of ${colLabel} where ${condCol.label} = "${condVal}")`);
      return;
    }
    else if (action === 'math_multiply' || action === 'math_add' || action === 'math_subtract' || action === 'math_divide') {
      const targetColLabel = prompt(`Enter the exact name of the column you want to ${action === 'math_multiply' ? 'multiply' : action === 'math_add' ? 'add' : action === 'math_subtract' ? 'subtract' : 'divide'} "${colLabel}" with/by:`);
      if (!targetColLabel) return;
      
      const targetCol = customColumns.find(c => c.label.toLowerCase() === targetColLabel.trim().toLowerCase());
      if (!targetCol) {
        showToast(`Column "${targetColLabel}" not found.`, 'error');
        return;
      }
      
      const newKey = `customCol_${Date.now()}`;
      let operator = action === 'math_multiply' ? '×' : action === 'math_add' ? '+' : action === 'math_subtract' ? '-' : '÷';
      const newCol = { key: newKey, label: `${colLabel} ${operator} ${targetCol.label}`, width: 120, type: 'number' };
      setCustomColumns(prev => [...prev, newCol]);
      setColWidths(prev => ({ ...prev, [newKey]: 120 }));
      
      setData(prev => prev.map(row => {
        const val1 = Number(row[colKey]);
        const val2 = Number(row[targetCol.key]);
        let result = '';
        if (!isNaN(val1) && !isNaN(val2)) {
          if (action === 'math_multiply') result = val1 * val2;
          else if (action === 'math_add') result = val1 + val2;
          else if (action === 'math_subtract') result = val1 - val2;
          else if (action === 'math_divide') result = val2 !== 0 ? val1 / val2 : 'Error';
          
          if (typeof result === 'number' && !Number.isInteger(result)) result = result.toFixed(2);
        }
        return { ...row, [newKey]: result };
      }));
    }
    else if (action === 'math_constant') {
      const constantStr = prompt(`Enter a number to multiply "${colLabel}" by:`);
      if (!constantStr || isNaN(Number(constantStr))) {
        showToast("Invalid number", "error");
        return;
      }
      const constant = Number(constantStr);
      
      const newKey = `customCol_${Date.now()}`;
      const newCol = { key: newKey, label: `${colLabel} × ${constant}`, width: 120, type: 'number' };
      setCustomColumns(prev => [...prev, newCol]);
      setColWidths(prev => ({ ...prev, [newKey]: 120 }));
      
      setData(prev => prev.map(row => {
        const val1 = Number(row[colKey]);
        let result = '';
        if (!isNaN(val1)) {
          result = val1 * constant;
          if (!Number.isInteger(result)) result = result.toFixed(2);
        }
        return { ...row, [newKey]: result };
      }));
    }
    else if (action === 'quick_stats') {
      const allNums = data.map(r => Number(r[colKey])).filter(n => !isNaN(n));
      if (allNums.length === 0) {
        showToast("No numeric data found in this column", "error");
        return;
      }
      const min = Math.min(...allNums);
      const max = Math.max(...allNums);
      const avg = allNums.reduce((a, b) => a + b, 0) / allNums.length;
      alert(`Statistics for "${colLabel}":\n\nMin: ${min}\nMax: ${max}\nAverage: ${avg.toFixed(2)}\nCount: ${allNums.length} valid numbers\nSum: ${allNums.reduce((a, b) => a + b, 0)}`);
      return;
    }
    else if (action === 'dedup') {
      const seen = new Set();
      let dupsRemoved = 0;
      const newData = data.filter(row => {
        const val = String(row[colKey] || '').toLowerCase().trim();
        if (val === '') return true;
        if (seen.has(val)) { dupsRemoved++; return false; }
        seen.add(val);
        return true;
      });
      if (dupsRemoved === 0) { showToast(`No duplicates found in "${colLabel}".`); return; }
      if (!window.confirm(`Found ${dupsRemoved} duplicate(s) in "${colLabel}". Remove them?`)) return;
      setData(newData);
    }
    
    setHasUnsaved(true);
  };

  const handleCopy = async () => {
    if (!selectedCell && !rangeStart) return;
    let r1 = selectedCell ? selectedCell.row : rangeStart.row;
    let r2 = r1;
    let c1 = selectedCell ? selectedCell.col : rangeStart.col;
    let c2 = c1;
    if (rangeStart && rangeEnd) {
      r1 = Math.min(rangeStart.row, rangeEnd.row);
      r2 = Math.max(rangeStart.row, rangeEnd.row);
      c1 = Math.min(rangeStart.col, rangeEnd.col);
      c2 = Math.max(rangeStart.col, rangeEnd.col);
    }
    let tsv = '';
    for (let r = r1; r <= r2; r++) {
      const row = data[r];
      if (!row) continue;
      const rowData = [];
      for (let c = c1; c <= c2; c++) {
        rowData.push(row[customColumns[c].key] || '');
      }
      tsv += rowData.join('\t') + '\n';
    }
    try {
      await navigator.clipboard.writeText(tsv);
      showToast('Copied to clipboard');
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleCut = async () => {
    if (!selectedCell && !rangeStart) return;
    let r1 = selectedCell ? selectedCell.row : rangeStart.row;
    let r2 = r1;
    if (rangeStart && rangeEnd) {
      r1 = Math.min(rangeStart.row, rangeEnd.row);
      r2 = Math.max(rangeStart.row, rangeEnd.row);
    }
    let hasDeducted = false;
    for (let r = r1; r <= r2; r++) {
      if (data[r] && data[r].status === 'Deducted') hasDeducted = true;
    }
    if (hasDeducted) {
      showToast('Cannot cut from already deducted row(s). Please undo deduction first.', 'warning');
      return;
    }
    await handleCopy();
    pushUndo();
    let c1 = selectedCell ? selectedCell.col : rangeStart.col;
    let c2 = c1;
    if (rangeStart && rangeEnd) {
      c1 = Math.min(rangeStart.col, rangeEnd.col);
      c2 = Math.max(rangeStart.col, rangeEnd.col);
    }
    setData(prev => prev.map((row, idx) => {
      if (idx >= r1 && idx <= r2) {
        let updatedRow = { ...row };
        for (let c = c1; c <= c2; c++) {
          updatedRow[customColumns[c].key] = '';
        }
        if (computeRow) {
          try {
            updatedRow = computeRow(updatedRow);
          } catch (err) {
            console.error("Error computing row on cut", err);
          }
        }
        return updatedRow;
      }
      return row;
    }));
    setHasUnsaved(true);
  };

  const handlePaste = async () => {
    if (!selectedCell) return;
    try {
      const text = await navigator.clipboard.readText();
      if (!text) return;
      const rows = text.split('\n').map(r => r.split('\t'));
      if (rows.length > 0 && rows[rows.length - 1].length === 1 && rows[rows.length - 1][0] === '') {
        rows.pop(); // remove trailing newline
      }
      
      let startRow = selectedCell.row;
      let endRow = Math.min(startRow + rows.length - 1, data.length - 1);
      let hasDeducted = false;
      for (let r = startRow; r <= endRow; r++) {
        if (data[r] && data[r].status === 'Deducted') hasDeducted = true;
      }
      if (hasDeducted) {
        showToast('Cannot paste into already deducted row(s). Please undo deduction first.', 'warning');
        return;
      }

      pushUndo();
      let startCol = selectedCell.col;
      
      setData(prev => {
        const newData = [...prev];
        for (let i = 0; i < rows.length; i++) {
          const r = startRow + i;
          if (r >= newData.length) break;
          let updatedRow = { ...newData[r] };
          for (let j = 0; j < rows[i].length; j++) {
            const c = startCol + j;
            if (c >= customColumns.length) break;
            updatedRow[customColumns[c].key] = rows[i][j];
          }
          if (computeRow) {
            try {
              updatedRow = computeRow(updatedRow);
            } catch (err) {
              console.error("Error computing row on paste", err);
            }
          }
          newData[r] = updatedRow;
        }
        return newData;
      });
      setHasUnsaved(true);
    } catch (err) {
      console.error('Failed to paste', err);
    }
  };

  const exportToPDF = () => {
    import('jspdf').then(({ jsPDF }) => {
      import('jspdf-autotable').then(({ default: autoTable }) => {
        const doc = new jsPDF({ orientation: customColumns.length > 6 ? 'landscape' : 'portrait' });
        
        // Add header
        doc.setFontSize(18);
        doc.setTextColor(40);
        doc.text(`Jindal Steel - ${title}`, 14, 22);
        
        doc.setFontSize(10);
        doc.setTextColor(100);
        const date = new Date().toLocaleString();
        doc.text(`Generated on: ${date}`, 14, 30);
        
        // Add table
        const tableColumn = customColumns.map(col => col.label);
        const tableRows = filteredData.map(row => {
          return customColumns.map(col => {
            const val = row[col.key];
            return val !== null && val !== undefined ? String(val) : '';
          });
        });

        autoTable(doc, {
          head: [tableColumn],
          body: tableRows,
          startY: 35,
          theme: 'grid',
          styles: { fontSize: 8, cellPadding: 2 },
          headStyles: { fillColor: [37, 99, 235], textColor: 255 }
        });
        
        doc.save(`Jindal_Steel_${title.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`);
        showToast('PDF Exported Successfully!');
      });
    }).catch(err => {
      console.error('Failed to load jspdf', err);
      showToast('Error exporting PDF');
    });
  };

  const commitEdit = (value, force = false) => {
    if (!editingCell) return;

    // Guard against immediate blur events (within 100ms) to prevent focus jitter from closing the editor
    if (!force && editStartTimeRef.current && (Date.now() - editStartTimeRef.current < 100)) {
      if (editInputRef.current && document.activeElement !== editInputRef.current) {
        try {
          editInputRef.current.focus();
        } catch (e) {
          console.warn('[ExcelGrid] Failed to re-focus input on jitter:', e);
        }
      }
      return;
    }

    const col = customColumns[editingCell.col];
    let finalValue = value;

    if ((col.type === 'select' || col.type === 'status') && col.options && (finalValue === 'Other' || finalValue === 'other')) {
      const customVal = window.prompt(`Enter new custom value for ${col.label || col.letter}:`);
      if (customVal && customVal.trim() !== '') {
        const trimmedVal = customVal.trim();
        const capitalizedVal = trimmedVal.charAt(0).toUpperCase() + trimmedVal.slice(1);
        
        if (!col.options.includes(capitalizedVal)) {
          const otherIdx = col.options.findIndex(opt => opt.toLowerCase() === 'other');
          let newOptions = [...col.options];
          if (otherIdx !== -1) {
            newOptions.splice(otherIdx, 0, capitalizedVal);
          } else {
            newOptions.push(capitalizedVal);
          }
          
          const newCols = customColumns.map(c => {
            if (c.key === col.key) {
              return { ...c, options: newOptions };
            }
            return c;
          });
          setCustomColumns(newCols);
          saveSheetMeta(`${storageKey}_columns`, newCols).catch(err => console.error(err));
        }
        finalValue = capitalizedVal;
      } else {
        finalValue = data[editingCell.row][col.key] || col.options[0];
      }
    }

    if (col.type === 'number') {
      if (value === '') {
        finalValue = '';
      } else {
        const num = Number(value);
        finalValue = isNaN(num) ? '' : num;
      }
    } else if ((!col.type || col.type === 'text') && typeof finalValue === 'string' && finalValue.length > 0) {
      finalValue = finalValue.charAt(0).toUpperCase() + finalValue.slice(1);
    }

    if (data[editingCell.row][col.key] !== finalValue) {
      let newData = [...data];
      let updatedRow = { ...newData[editingCell.row], [col.key]: finalValue };
      if (updatedRow.extracted !== undefined) {
        updatedRow.extracted = false;
      }
      
      if (customColumns.some(c => c.key === 'lastUpdated')) {
         const d = new Date();
         const offset = d.getTimezoneOffset();
         const localDate = new Date(d.getTime() - (offset * 60 * 1000));
         updatedRow['lastUpdated'] = localDate.toISOString().split('T')[0];
      }

      // Auto-populate the "date" column with today's local date if it exists, is currently empty,
      // and is not the specific column being edited (to allow manual clearing).
      const dateCol = customColumns.find(c => c && c.key === 'date');
      if (dateCol && col.key !== dateCol.key && (!updatedRow[dateCol.key] || String(updatedRow[dateCol.key]).trim() === '')) {
         const d = new Date();
         const offset = d.getTimezoneOffset();
         const localDate = new Date(d.getTime() - (offset * 60 * 1000));
         updatedRow[dateCol.key] = localDate.toISOString().split('T')[0];
      }
      
      if (computeRow) {
        try {
          updatedRow = computeRow(updatedRow);
        } catch (e) {
          console.error("Error computing row on edit", e);
        }
      }
      
      newData[editingCell.row] = updatedRow;
      setData(newData);
      setHasUnsaved(true);
    }
    setEditingCell(null);
  };

  const moveSelection = useCallback((dx, dy) => {
    if (!selectedCell) return;
    
    const selectedRowObj = data[selectedCell.row];
    const currentFilteredIdx = selectedRowObj ? rowToFilteredIndexMap.get(selectedRowObj) : -1;
    if (currentFilteredIdx === -1 || currentFilteredIdx === undefined) return; 

    let newCol = selectedCell.col + dx;
    let newFilteredIdx = currentFilteredIdx + dy;

    if (newCol >= customColumns.length) { newCol = 0; newFilteredIdx++; }
    if (newCol < 0) { newCol = customColumns.length - 1; newFilteredIdx--; }

    if (newFilteredIdx < 0) newFilteredIdx = 0;
    if (newFilteredIdx >= filteredData.length) newFilteredIdx = filteredData.length - 1;

    const newRowObj = filteredData[newFilteredIdx];
    const newRowAbsolute = newRowObj ? rowToIndexMap.get(newRowObj) : -1;
    
    const newCell = { row: newRowAbsolute, col: newCol };
    setSelectedCell(newCell);
    setRangeStart(newCell);
    setRangeEnd(newCell);
    
      setTimeout(() => {
        const cellId = `cell-${activeStorageKey}-${newRowAbsolute}-${newCol}`;
        const cellElement = document.getElementById(cellId);
        if (cellElement && gridContainerRef.current) {
          const container = gridContainerRef.current;
          const cellRect = cellElement.getBoundingClientRect();
          const containerRect = container.getBoundingClientRect();
          
          const topBuffer = 80;
          const bottomBuffer = 140;
          const leftBuffer = 60;
          const rightBuffer = 60;

          if (cellRect.top < containerRect.top + topBuffer) {
            container.scrollTop -= (containerRect.top + topBuffer - cellRect.top);
          } else if (cellRect.bottom > containerRect.bottom - bottomBuffer) {
            container.scrollTop += (cellRect.bottom - (containerRect.bottom - bottomBuffer));
          }

          if (cellRect.left < containerRect.left + leftBuffer) {
            container.scrollLeft -= (containerRect.left + leftBuffer - cellRect.left);
          } else if (cellRect.right > containerRect.right - rightBuffer) {
            container.scrollLeft += (cellRect.right - (containerRect.right - rightBuffer));
          }
        }
      }, 0);
  }, [selectedCell, customColumns.length, data, filteredData, activeStorageKey, rowToIndexMap, rowToFilteredIndexMap]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      // If we just set editingCell and the input hasn't focused yet (pendingEditRef),
      // let the browser deliver the key to the input natively — don't intercept it.
      if (pendingEditRef.current && e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
        return;
      }

      // Ignore keypresses if the user is typing in an external input (like a chatbox or search bar)
      // BUT do not ignore if they are typing inside the cell edit input!
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable)) {
        if (e.target !== editInputRef.current) {
          return;
        }
      }

      const key = e.key.toLowerCase();
      if (e.ctrlKey && (key === 'y' || (e.shiftKey && key === 'z'))) {
        e.preventDefault();
        handleRedo();
        return;
      }
      if (e.ctrlKey && key === 'z') {
        e.preventDefault();
        handleUndo();
        return;
      }
      if (e.ctrlKey && key === 'a') {
        e.preventDefault();
        selectAll();
        return;
      }
      if (e.ctrlKey && key === 'c' && !editingCell) {
        e.preventDefault();
        handleCopy();
        return;
      }
      if (e.ctrlKey && key === 'x' && !editingCell) {
        e.preventDefault();
        handleCut();
        return;
      }
      if (e.ctrlKey && key === 'v' && !editingCell) {
        e.preventDefault();
        handlePaste();
        return;
      }
      if (e.ctrlKey && key === 's') {
        e.preventDefault();
        saveData();
        return;
      }
      if (e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        moveColumn('left');
        return;
      }
      if (e.altKey && e.key === 'ArrowRight') {
        e.preventDefault();
        moveColumn('right');
        return;
      }
      if (e.ctrlKey && key === 'd') {
        e.preventDefault();
        if (!selectedCell) return;
        pushUndo();
        let r1 = selectedCell.row;
        let r2 = selectedCell.row;
        let c1 = selectedCell.col;
        let c2 = selectedCell.col;
        if (rangeStart && rangeEnd) {
          r1 = Math.min(rangeStart.row, rangeEnd.row);
          r2 = Math.max(rangeStart.row, rangeEnd.row);
          c1 = Math.min(rangeStart.col, rangeEnd.col);
          c2 = Math.max(rangeStart.col, rangeEnd.col);
        }
        if (r1 !== r2) {
          setData(prev => {
            const newData = [...prev];
            for (let c = c1; c <= c2; c++) {
              const colKey = customColumns[c].key;
              const sourceVal = newData[r1][colKey];
              for (let r = r1 + 1; r <= r2; r++) {
                newData[r] = { ...newData[r], [colKey]: sourceVal };
                if (computeRow) {
                  try {
                    newData[r] = computeRow(newData[r]);
                  } catch (e) {
                    console.error("Error computing row on fill", e);
                  }
                }
              }
            }
            return newData;
          });
          setHasUnsaved(true);
        }
        return;
      }

      if (editingCell) {
        if (e.key === 'Enter') {
          e.preventDefault();
          commitEdit(editInputRef.current.value, true);
          moveSelection(e.shiftKey ? -1 : 1, 0); // Enter moves RIGHT
        } else if (e.key === 'Tab') {
          e.preventDefault();
          commitEdit(editInputRef.current.value, true);
          moveSelection(e.shiftKey ? -1 : 1, 0); // Tab moves RIGHT
        } else if (e.key === 'Escape') {
          e.preventDefault();
          setEditingCell(null);
        }
        return;
      }

      if (!selectedCell) return;

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        moveSelection(0, -1);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        moveSelection(0, 1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        moveSelection(-1, 0);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        moveSelection(1, 0);
      } else if (e.key === 'Tab') {
        e.preventDefault();
        moveSelection(e.shiftKey ? -1 : 1, 0);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (e.shiftKey) {
          moveSelection(-1, 0); // Shift+Enter moves LEFT
        } else {
          const col = customColumns[selectedCell.col];
          if (col && !col.readOnly) {
            const rowObj = data[selectedCell.row];
            if (rowObj && rowObj.status === 'Deducted' && col.key !== 'status') {
              showToast('This row is already deducted. Please undo deduction first to edit.', 'warning');
              return;
            }
            pushUndo();
            setEditingCell({ ...selectedCell });
          }
        }
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        let r1 = selectedCell.row;
        let r2 = selectedCell.row;
        let c1 = selectedCell.col;
        let c2 = selectedCell.col;
        if (rangeStart && rangeEnd) {
          r1 = Math.min(rangeStart.row, rangeEnd.row);
          r2 = Math.max(rangeStart.row, rangeEnd.row);
          c1 = Math.min(rangeStart.col, rangeEnd.col);
          c2 = Math.max(rangeStart.col, rangeEnd.col);
        }
        let hasReadOnly = false;
        for (let c = c1; c <= c2; c++) {
          if (customColumns[c]?.readOnly) hasReadOnly = true;
        }
        if (hasReadOnly) return;

        let hasDeducted = false;
        for (let r = r1; r <= r2; r++) {
          if (data[r] && data[r].status === 'Deducted') hasDeducted = true;
        }
        if (hasDeducted) {
          showToast('Cannot delete from already deducted row(s). Please undo deduction first.', 'warning');
          return;
        }

        pushUndo();
        setData(prev => prev.map((row, idx) => {
          if (idx >= r1 && idx <= r2) {
            let updatedRow = { ...row };
            for (let c = c1; c <= c2; c++) {
              updatedRow[customColumns[c].key] = '';
            }
            if (computeRow) {
              try {
                updatedRow = computeRow(updatedRow);
              } catch (err) {
                console.error("Error computing row on delete", err);
              }
            }
            return updatedRow;
          }
          return row;
        }));
        setHasUnsaved(true);
      } else if (e.key === 'Escape') {
        setSelectedCell(null);
        setRangeStart(null);
        setRangeEnd(null);
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
        const col = customColumns[selectedCell.col];
        if (col && !col.readOnly) {
          const rowObj = data[selectedCell.row];
          if (rowObj && rowObj.status === 'Deducted' && col.key !== 'status') {
            showToast('This row is already deducted. Please undo deduction first to edit.', 'warning');
            return;
          }
          e.preventDefault();
          pushUndo();
          // Pass the typed key into the editing state so it becomes the initial value
          setEditingCell({ ...selectedCell, initialValue: e.key });
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [
    editingCell, selectedCell, data, undoStack, redoStack, moveSelection, pushUndo,
    handleUndo, handleRedo, customColumns, rangeStart, rangeEnd, computeRow, saveData,
    selectAll, handleCopy, handleCut, handlePaste, moveColumn, commitEdit
  ]);

  const onCellMouseDown = (e, row, col) => {
    if (e.button === 2) return; 

    // If clicking the cell currently being edited, let the user interact with the input (position cursor, select text, open dropdown etc.)
    if (editingCell && editingCell.row === row && editingCell.col === col) {
      return;
    }

    // Focus the grid container instead of blurring to prevent focus-drop scroll reset.
    // Avoid re-focusing if the container already has focus.
    if (gridContainerRef.current) {
      const container = gridContainerRef.current;
      if (document.activeElement !== container) {
        container.focus({ preventScroll: true });
      }
    } else if (document.activeElement && typeof document.activeElement.blur === 'function') {
      document.activeElement.blur();
    }

    e.preventDefault();
    if (contextMenu.show) setContextMenu({ ...contextMenu, show: false });

    if (editingCell && (editingCell.row !== row || editingCell.col !== col)) {
      if (editInputRef.current) commitEdit(editInputRef.current.value, true);
    }

    const cell = { row, col };
    setSelectedCell(cell);
    setRangeStart(cell);
    setRangeEnd(cell);
    // Record the mouse-down position; only activate drag-selection after the mouse moves past a threshold
    dragOriginRef.current = { x: e.clientX, y: e.clientY };
    mousePositionRef.current = { x: e.clientX, y: e.clientY };
    isDraggingRef.current = false;
    setIsSelecting(true);
    setEditingCell(null);
    setSelectionType('cell');

    if (isEraserMode) {
      pushUndo();
      pushHighlightUndo();
      eraseCellHighlight(row, col);
    }
  };

  const onCellMouseOver = (e, row, col) => {
    if (!isSelecting) return;

    // Require the mouse to move at least 5px from the initial click before starting drag-selection.
    // This prevents accidental selection jumps caused by micro-movements during a normal click.
    if (!isDraggingRef.current && dragOriginRef.current) {
      const dx = Math.abs(e.clientX - dragOriginRef.current.x);
      const dy = Math.abs(e.clientY - dragOriginRef.current.y);
      if (dx < 5 && dy < 5) return; // Not a real drag yet
      isDraggingRef.current = true;
    }

    setRangeEnd({ row, col });
    if (isEraserMode) {
      eraseCellHighlight(row, col);
    }
  };

  const selectWholeRow = (rowIdx) => {
    if (editingCell && editInputRef.current) {
      commitEdit(editInputRef.current.value, true);
    }
    const cellStart = { row: rowIdx, col: 0 };
    const cellEnd = { row: rowIdx, col: customColumns.length - 1 };
    setSelectedCell(cellStart);
    setRangeStart(cellStart);
    setRangeEnd(cellEnd);
    setIsSelecting(false);
    setEditingCell(null);
    setSelectionType('row');
  };

  const selectWholeColumn = (colIdx) => {
    if (filteredData.length === 0) return;
    if (editingCell && editInputRef.current) {
      commitEdit(editInputRef.current.value, true);
    }
    const firstVisibleRowAbs = rowToIndexMap.get(filteredData[0]);
    const lastVisibleRowAbs = rowToIndexMap.get(filteredData[filteredData.length - 1]);
    const cellStart = { row: firstVisibleRowAbs, col: colIdx };
    const cellEnd = { row: lastVisibleRowAbs, col: colIdx };
    setSelectedCell(cellStart);
    setRangeStart(cellStart);
    setRangeEnd(cellEnd);
    setIsSelecting(false);
    setEditingCell(null);
    setSelectionType('column');
  };

  function selectAll() {
    if (filteredData.length === 0) return;
    if (editingCell && editInputRef.current) {
      commitEdit(editInputRef.current.value, true);
    }
    const firstVisibleRowAbs = rowToIndexMap.get(filteredData[0]);
    const lastVisibleRowAbs = rowToIndexMap.get(filteredData[filteredData.length - 1]);
    const cellStart = { row: firstVisibleRowAbs, col: 0 };
    const cellEnd = { row: lastVisibleRowAbs, col: customColumns.length - 1 };
    setSelectedCell(cellStart);
    setRangeStart(cellStart);
    setRangeEnd(cellEnd);
    setIsSelecting(false);
    setEditingCell(null);
    setSelectionType('cell');
  };

  // isCellInRange has been moved above and optimized for O(1) performance

  const handleContextMenu = (e, row, col) => {
    e.preventDefault();
    const cell = { row, col };
    const isInsideRange = isCellInRange(row, col);
    if (!isInsideRange) {
      setSelectedCell(cell);
      setRangeStart(cell);
      setRangeEnd(cell);
    }
    setContextMenu({ show: true, x: e.clientX, y: e.clientY, row, col });
  };

  const getEmptyRow = (idNum) => {
    const newRow = {};
    customColumns.forEach(c => {
      newRow[c.key] = '';
      if (c.options && c.options.length > 0 && c.type !== 'status') {
         newRow[c.key] = c.options[0];
      }
    });
    
    const idCol = customColumns.find(c => c.key === 'id');
    if (idCol) {
      newRow[idCol.key] = `${idPrefix}${String(idNum).padStart(3, '0')}`;
    }
    
    // Automatically populate date and time columns with current local date/time
    customColumns.forEach(c => {
      const k = c.key.toLowerCase();
      if (!k.includes('expiry') && !k.includes('due') && !k.includes('dob')) {
        const d = new Date();
        const offset = d.getTimezoneOffset();
        const localDate = new Date(d.getTime() - (offset * 60 * 1000));
        
        if (c.type === 'date' || k === 'date') {
          newRow[c.key] = localDate.toISOString().split('T')[0];
        } else if (c.type === 'time' || k === 'time') {
          newRow[c.key] = localDate.toISOString().split('T')[1].substring(0, 5);
        } else if (c.type === 'datetime-local') {
          newRow[c.key] = localDate.toISOString().substring(0, 16);
        }
      }
    });
    
    const statusCol = customColumns.find(c => c.type === 'status');
    if (statusCol && statusCol.options && statusCol.options.length > 0) {
      newRow[statusCol.key] = statusCol.options[0];
    }
    
    if (computeRow) {
      try {
        return computeRow(newRow);
      } catch (err) {
        console.error("Error computing row on empty creation", err);
      }
    }
    return newRow;
  };

  const contextAction = (action) => {
    const { row, col } = contextMenu;
    if (action === 'moveColLeft') {
      moveColumn('left');
      setContextMenu({ ...contextMenu, show: false });
      return;
    }
    if (action === 'moveColRight') {
      moveColumn('right');
      setContextMenu({ ...contextMenu, show: false });
      return;
    }

    // Integrity checks for already Deducted rows
    if (action === 'deleteRow') {
      let rowsToDelete = new Set();
      if (rangeStart && rangeEnd) {
         const startFIdx = filteredData.findIndex(r => data.indexOf(r) === rangeStart.row);
         const endFIdx = filteredData.findIndex(r => data.indexOf(r) === rangeEnd.row);
         const minF = Math.min(startFIdx, endFIdx);
         const maxF = Math.max(startFIdx, endFIdx);
         for(let i=minF; i<=maxF; i++) {
            if (i !== -1) rowsToDelete.add(data.indexOf(filteredData[i]));
         }
      } else {
         rowsToDelete.add(row);
      }
      rowsToDelete.delete(-1);
      
      let hasDeducted = false;
      rowsToDelete.forEach(r => {
        if (data[r] && data[r].status === 'Deducted') hasDeducted = true;
      });
      if (hasDeducted) {
        showToast('Cannot delete already deducted row(s). Please undo deduction first.', 'warning');
        setContextMenu({ ...contextMenu, show: false });
        return;
      }
    } else if (action === 'clearCell') {
      let r1 = row;
      let r2 = row;
      if (rangeStart && rangeEnd) {
        r1 = Math.min(rangeStart.row, rangeEnd.row);
        r2 = Math.max(rangeStart.row, rangeEnd.row);
      }
      let hasDeducted = false;
      for (let r = r1; r <= r2; r++) {
        if (data[r] && data[r].status === 'Deducted') hasDeducted = true;
      }
      if (hasDeducted) {
        showToast('Cannot clear cells in already deducted row(s). Please undo deduction first.', 'warning');
        setContextMenu({ ...contextMenu, show: false });
        return;
      }
    } else if (action === 'clearColumn') {
      let hasDeducted = false;
      for (let r = 0; r < data.length; r++) {
        if (data[r] && data[r].status === 'Deducted' && data[r][customColumns[col].key] !== '') {
          hasDeducted = true;
        }
      }
      if (hasDeducted) {
        showToast('Cannot clear column values for already deducted row(s). Please undo deduction first.', 'warning');
        setContextMenu({ ...contextMenu, show: false });
        return;
      }
    } else if (action === 'fillDown') {
      let r1 = row;
      let r2 = row;
      if (rangeStart && rangeEnd) {
        r1 = Math.min(rangeStart.row, rangeEnd.row);
        r2 = Math.max(rangeStart.row, rangeEnd.row);
      }
      let hasDeducted = false;
      for (let r = r1; r <= r2; r++) {
        if (data[r] && data[r].status === 'Deducted') hasDeducted = true;
      }
      if (hasDeducted) {
        showToast('Cannot fill down into already deducted row(s). Please undo deduction first.', 'warning');
        setContextMenu({ ...contextMenu, show: false });
        return;
      }
    }

    pushUndo();
    const newData = [...data];
    let newIdNum = nextIdNum;

    if (action === 'insertAbove') {
      newData.splice(row, 0, getEmptyRow(newIdNum++));
    } else if (action === 'insertBelow') {
      newData.splice(row + 1, 0, getEmptyRow(newIdNum++));
    } else if (action === 'deleteRow') {
      let rowsToDelete = new Set();
      if (rangeStart && rangeEnd) {
         const startFIdx = filteredData.findIndex(r => data.indexOf(r) === rangeStart.row);
         const endFIdx = filteredData.findIndex(r => data.indexOf(r) === rangeEnd.row);
         const minF = Math.min(startFIdx, endFIdx);
         const maxF = Math.max(startFIdx, endFIdx);
         for(let i=minF; i<=maxF; i++) {
            if (i !== -1) rowsToDelete.add(data.indexOf(filteredData[i]));
         }
      } else {
         rowsToDelete.add(row);
      }
      rowsToDelete.delete(-1);
      if (rowsToDelete.size > 0) {
        const sortedRows = Array.from(rowsToDelete).sort((a, b) => b - a);
        sortedRows.forEach(r => newData.splice(r, 1));
      }
      setSelectedCell(null);
      setRangeStart(null);
      setRangeEnd(null);
    } else if (action === 'insertColLeft' || action === 'insertColRight') {
      const insertAt = action === 'insertColLeft' ? col : col + 1;
      const newCols = [...customColumns];
      newCols.splice(insertAt, 0, {
        key: 'custom_' + Date.now(),
        label: 'New Column',
        width: 120,
        type: 'text'
      });
      newCols.forEach((c, i) => {
        let letter = '';
        let temp = i;
        while (temp >= 0) {
          letter = String.fromCharCode((temp % 26) + 65) + letter;
          temp = Math.floor(temp / 26) - 1;
        }
        c.letter = letter;
      });
      setCustomColumns(newCols);
      saveSheetMeta(`${storageKey}_columns`, newCols);
      setHasUnsaved(true);
      return;
    } else if (action === 'deleteCol') {
      const newCols = [...customColumns];
      newCols.splice(col, 1);
      newCols.forEach((c, i) => {
        let letter = '';
        let temp = i;
        while (temp >= 0) {
          letter = String.fromCharCode((temp % 26) + 65) + letter;
          temp = Math.floor(temp / 26) - 1;
        }
        c.letter = letter;
      });
      setCustomColumns(newCols);
      saveSheetMeta(`${storageKey}_columns`, newCols);
      setHasUnsaved(true);
      return;
    } else if (action === 'clearCell') {
      let r1 = row;
      let r2 = row;
      let c1 = col;
      let c2 = col;
      if (rangeStart && rangeEnd) {
        r1 = Math.min(rangeStart.row, rangeEnd.row);
        r2 = Math.max(rangeStart.row, rangeEnd.row);
        c1 = Math.min(rangeStart.col, rangeEnd.col);
        c2 = Math.max(rangeStart.col, rangeEnd.col);
      }
      for (let r = r1; r <= r2; r++) {
        for (let c = c1; c <= c2; c++) {
          newData[r] = { ...newData[r], [customColumns[c].key]: '' };
        }
      }
    } else if (action === 'clearColumn') {
      const colKey = customColumns[col].key;
      for (let r = 0; r < newData.length; r++) {
        newData[r] = { ...newData[r], [colKey]: '' };
      }
    } else if (action === 'fillDown') {
      let r1 = row;
      let r2 = row;
      let c1 = col;
      let c2 = col;
      if (rangeStart && rangeEnd) {
        r1 = Math.min(rangeStart.row, rangeEnd.row);
        r2 = Math.max(rangeStart.row, rangeEnd.row);
        c1 = Math.min(rangeStart.col, rangeEnd.col);
        c2 = Math.max(rangeStart.col, rangeEnd.col);
      }
      if (r1 !== r2) {
        for (let c = c1; c <= c2; c++) {
          const colKey = customColumns[c].key;
          const sourceVal = newData[r1][colKey];
          const sourceStyle = newData[r1]._cellStyles ? newData[r1]._cellStyles[colKey] : null;
          for (let r = r1 + 1; r <= r2; r++) {
            newData[r] = { ...newData[r], [colKey]: sourceVal };
            if (sourceStyle) {
              if (!newData[r]._cellStyles) newData[r]._cellStyles = {};
              newData[r]._cellStyles[colKey] = { ...sourceStyle };
            }
            if (computeRow) {
              try {
                newData[r] = computeRow(newData[r]);
              } catch (e) {
                console.error("Error computing row on fill", e);
              }
            }
          }
        }
      }
    } else if (action === 'fillSeries') {
      let r1 = row;
      let r2 = row;
      let c1 = col;
      let c2 = col;
      if (rangeStart && rangeEnd) {
        r1 = Math.min(rangeStart.row, rangeEnd.row);
        r2 = Math.max(rangeStart.row, rangeEnd.row);
        c1 = Math.min(rangeStart.col, rangeEnd.col);
        c2 = Math.max(rangeStart.col, rangeEnd.col);
      }
      if (r1 !== r2) {
        const incrementValue = (val, step) => {
          if (val === null || val === undefined || val === '') return '';
          const numMatch = String(val).match(/^(.*?)(\d+)$/);
          if (numMatch && isNaN(val)) {
            const prefix = numMatch[1];
            const numStr = numMatch[2];
            const nextNum = parseInt(numStr) + step;
            return prefix + String(nextNum).padStart(numStr.length, '0');
          }
          if (!isNaN(val) && val !== '') {
            return Number(val) + step;
          }
          const dateReg = /^\d{4}-\d{2}-\d{2}$/;
          if (dateReg.test(val)) {
            const d = new Date(val);
            if (!isNaN(d.getTime())) {
              d.setDate(d.getDate() + step);
              return d.toISOString().split('T')[0];
            }
          }
          return val;
        };

        for (let c = c1; c <= c2; c++) {
          const colKey = customColumns[c].key;
          const sourceVal = newData[r1][colKey];
          const sourceStyle = newData[r1]._cellStyles ? newData[r1]._cellStyles[colKey] : null;
          let step = 1;
          for (let r = r1 + 1; r <= r2; r++) {
            newData[r] = { ...newData[r], [colKey]: incrementValue(sourceVal, step++) };
            if (sourceStyle) {
              if (!newData[r]._cellStyles) newData[r]._cellStyles = {};
              newData[r]._cellStyles[colKey] = { ...sourceStyle };
            }
            if (computeRow) {
              try {
                newData[r] = computeRow(newData[r]);
              } catch (e) {
                console.error("Error computing row on fill", e);
              }
            }
          }
        }
      }
    } else if (action === 'copyRow') {
      const copy = { ...newData[row] };
      const idCol = customColumns.find(c => c.key.toLowerCase() === 'id' || c.key.toLowerCase().includes('id'));
      if (idCol) {
         copy[idCol.key] = `${idPrefix}${String(newIdNum++).padStart(3, '0')}`;
      }
      newData.splice(row + 1, 0, copy);
    }

    setNextIdNum(newIdNum);
    setData(newData);
    setHasUnsaved(true);
    setContextMenu({ ...contextMenu, show: false });
  };

  const highlightEntireRow = (color) => {
    if (!selectedCell) return;
    pushUndo();
    pushHighlightUndo();
    const targetRow = selectedCell.row;
    setData(prev => prev.map((row, idx) => {
      if (idx === targetRow) {
        const updatedRow = { ...row };
        if (!updatedRow._cellStyles) updatedRow._cellStyles = { ...row._cellStyles };
        customColumns.forEach(col => {
          let currentStyle = updatedRow._cellStyles[col.key];
          if (typeof currentStyle === 'string') currentStyle = { background: currentStyle };
          else if (!currentStyle) currentStyle = {};
          updatedRow._cellStyles[col.key] = { ...currentStyle, background: color };
        });
        return updatedRow;
      }
      return row;
    }));
    setHasUnsaved(true);
  };

  const highlightEntireCol = (color) => {
    if (!selectedCell) return;
    pushUndo();
    pushHighlightUndo();
    const targetColKey = customColumns[selectedCell.col].key;
    setData(prev => prev.map(row => {
      const updatedRow = { ...row };
      if (!updatedRow._cellStyles) updatedRow._cellStyles = { ...row._cellStyles };
      let currentStyle = updatedRow._cellStyles[targetColKey];
      if (typeof currentStyle === 'string') currentStyle = { background: currentStyle };
      else if (!currentStyle) currentStyle = {};
      updatedRow._cellStyles[targetColKey] = { ...currentStyle, background: color };
      return updatedRow;
    }));
    setHasUnsaved(true);
  };

  const eraseCellHighlight = (rowIdx, colIdx) => {
    const colKey = customColumns[colIdx].key;
    setData(prev => prev.map((row, idx) => {
      if (idx === rowIdx) {
        if (!row._cellStyles || !row._cellStyles[colKey]) return row;
        const updatedRow = { ...row };
        updatedRow._cellStyles = { ...row._cellStyles };
        
        let currentStyle = updatedRow._cellStyles[colKey];
        if (typeof currentStyle === 'string') {
          delete updatedRow._cellStyles[colKey];
        } else if (currentStyle) {
          const newStyle = { ...currentStyle };
          delete newStyle.background;
          updatedRow._cellStyles[colKey] = newStyle;
        }
        return updatedRow;
      }
      return row;
    }));
    setHasUnsaved(true);
  };

  const applyColor = (color) => {
    if (!selectedCell && !rangeStart) return;
    pushUndo();
    pushHighlightUndo();
    
    let r1 = selectedCell ? selectedCell.row : (rangeStart ? rangeStart.row : 0);
    let r2 = r1;
    let c1 = selectedCell ? selectedCell.col : (rangeStart ? rangeStart.col : 0);
    let c2 = c1;

    if (rangeStart && rangeEnd) {
      r1 = Math.min(rangeStart.row, rangeEnd.row);
      r2 = Math.max(rangeStart.row, rangeEnd.row);
      c1 = Math.min(rangeStart.col, rangeEnd.col);
      c2 = Math.max(rangeStart.col, rangeEnd.col);
    }

    // Convert from absolute grid rows to currently filtered rows if selection was done via filter
    // Wait, the selection is tracked in absolute data indices (`row` and `col` are data.indexOf).
    // rangeStart.row is the absolute index in data array.
    
    setData(prev => prev.map((row, idx) => {
      if (idx >= r1 && idx <= r2) {
        const updatedRow = { ...row };
        if (!updatedRow._cellStyles) updatedRow._cellStyles = { ...row._cellStyles };
        
        let changed = false;
        for (let c = c1; c <= c2; c++) {
          const colKey = customColumns[c].key;
          let currentStyle = updatedRow._cellStyles[colKey];
          
          if (typeof currentStyle === 'string') {
            currentStyle = { background: currentStyle };
          } else if (!currentStyle) {
            currentStyle = {};
          }
          
          if (currentStyle.background !== color) {
            updatedRow._cellStyles[colKey] = { ...currentStyle, background: color };
            changed = true;
          }
        }
        return changed ? updatedRow : row;
      }
      return row;
    }));
    setHasUnsaved(true);
  };

  const applyFormat = (formatType, value) => {
    if (!selectedCell && !rangeStart) return;
    pushUndo();
    
    let r1 = selectedCell ? selectedCell.row : (rangeStart ? rangeStart.row : 0);
    let r2 = r1;
    let c1 = selectedCell ? selectedCell.col : (rangeStart ? rangeStart.col : 0);
    let c2 = c1;

    if (rangeStart && rangeEnd) {
      r1 = Math.min(rangeStart.row, rangeEnd.row);
      r2 = Math.max(rangeStart.row, rangeEnd.row);
      c1 = Math.min(rangeStart.col, rangeEnd.col);
      c2 = Math.max(rangeStart.col, rangeEnd.col);
    }

    setData(prev => prev.map((row, idx) => {
      if (idx >= r1 && idx <= r2) {
        const updatedRow = { ...row };
        if (!updatedRow._cellStyles) updatedRow._cellStyles = { ...row._cellStyles };
        
        let changed = false;
        for (let c = c1; c <= c2; c++) {
          const colKey = customColumns[c].key;
          let currentStyle = updatedRow._cellStyles[colKey];
          
          if (typeof currentStyle === 'string') {
            currentStyle = { background: currentStyle };
          } else if (!currentStyle) {
            currentStyle = {};
          }
          
          if (formatType === 'fontSize') {
             const currentSize = currentStyle.fontSize || 13;
             const newSize = value === '+' ? Math.min(36, currentSize + 1) : Math.max(8, currentSize - 1);
             updatedRow._cellStyles[colKey] = { ...currentStyle, fontSize: newSize };
             changed = true;
          } else if (currentStyle[formatType] !== value) {
            updatedRow._cellStyles[colKey] = { ...currentStyle, [formatType]: value };
            changed = true;
          } else if (formatType === 'bold' || formatType === 'italic' || formatType === 'underline') {
             // Toggle behavior for booleans if value is same (it won't be same due to currentStyle check, but handle toggle logic)
             updatedRow._cellStyles[colKey] = { ...currentStyle, [formatType]: !currentStyle[formatType] };
             changed = true;
          }
        }
        return changed ? updatedRow : row;
      }
      return row;
    }));
    setHasUnsaved(true);
  };

  const addRow = () => {
    pushUndo();
    setSearchTerm('');
    setData([...data, getEmptyRow(nextIdNum)]);
    setNextIdNum(prev => prev + 1);
    setHasUnsaved(true);
    const newRowIdx = data.length;
    const cell = { row: newRowIdx, col: 0 };
    setSelectedCell(cell);
    setRangeStart(cell);
    setRangeEnd(cell);
    setTimeout(() => {
      if (tableRef.current) tableRef.current.parentElement.scrollTop = tableRef.current.parentElement.scrollHeight;
    }, 50);
  };

  const addColumn = () => {
    pushUndo();
    const newColIdx = customColumns.length;
    const getLetter = (num) => {
      let letter = '';
      while (num >= 0) {
        letter = String.fromCharCode(65 + (num % 26)) + letter;
        num = Math.floor(num / 26) - 1;
      }
      return letter;
    };
    const letter = getLetter(newColIdx);
    const newKey = `customCol_${Date.now()}`;
    const newCol = { key: newKey, label: 'New Column', letter: letter, width: 120, type: 'text' };
    
    setCustomColumns(prev => [...prev, newCol]);
    setColWidths(prev => ({ ...prev, [newKey]: 120 }));
    setHasUnsaved(true);
    
    // Automatically focus the new header for renaming
    setTimeout(() => {
      setEditingHeader(newColIdx);
      if (tableRef.current) tableRef.current.parentElement.scrollLeft = tableRef.current.parentElement.scrollWidth;
    }, 50);
  };

  const deleteColumn = () => {
    if (!selectedCell && !rangeStart) {
      alert('Please select a cell or range in the column(s) you want to delete.');
      return;
    }
    
    let c1 = selectedCell ? selectedCell.col : rangeStart.col;
    let c2 = c1;
    if (rangeStart && rangeEnd) {
      c1 = Math.min(rangeStart.col, rangeEnd.col);
      c2 = Math.max(rangeStart.col, rangeEnd.col);
    }

    const colIndices = [];
    const colLabels = [];
    const keysToDelete = [];
    for (let i = c1; i <= c2; i++) {
      if (customColumns[i]) {
        colIndices.push(i);
        colLabels.push(customColumns[i].label || customColumns[i].letter);
        keysToDelete.push(customColumns[i].key);
      }
    }

    if (colIndices.length === 0) return;

    if (!window.confirm(`Are you sure you want to delete the column(s): ${colLabels.join(', ')} and all their data? This action can be undone.`)) {
      return;
    }

    pushUndo();

    // 1. Remove from customColumns
    const newColumns = customColumns.filter((_, idx) => !colIndices.includes(idx));
    
    // Recalculate letters for remaining columns
    const getLetter = (num) => {
      let letter = '';
      while (num >= 0) {
        letter = String.fromCharCode(65 + (num % 26)) + letter;
        num = Math.floor(num / 26) - 1;
      }
      return letter;
    };
    
    const updatedColumns = newColumns.map((col, idx) => ({
      ...col,
      letter: getLetter(idx)
    }));

    setCustomColumns(updatedColumns);

    // 2. Remove from row data properties
    setData(prev => prev.map(row => {
      const updatedRow = { ...row };
      keysToDelete.forEach(key => {
        delete updatedRow[key];
        if (updatedRow._cellStyles) {
          updatedRow._cellStyles = { ...updatedRow._cellStyles };
          delete updatedRow._cellStyles[key];
        }
      });
      return updatedRow;
    }));

    // Reset selection to safe cell
    setSelectedCell(prev => prev ? { row: prev.row, col: Math.max(0, c1 - 1) } : null);
    setRangeStart(null);
    setRangeEnd(null);
    setHasUnsaved(true);
    showToast(`Deleted ${colIndices.length} column(s).`);
  };

  function moveColumn(direction, skipPushUndo = false) {
    if (!selectedCell) {
      alert('Please select a cell in the column you want to move.');
      return;
    }
    const colIdx = selectedCell.col;
    if (direction === 'left' && colIdx === 0) return;
    if (direction === 'right' && colIdx === customColumns.length - 1) return;

    if (!skipPushUndo) pushUndo();

    const newColumns = [...customColumns];
    const targetIdx = direction === 'left' ? colIdx - 1 : colIdx + 1;
    
    // Swap columns
    const temp = newColumns[colIdx];
    newColumns[colIdx] = newColumns[targetIdx];
    newColumns[targetIdx] = temp;

    // Recalculate letters for columns
    const getLetter = (num) => {
      let letter = '';
      while (num >= 0) {
        letter = String.fromCharCode(65 + (num % 26)) + letter;
        num = Math.floor(num / 26) - 1;
      }
      return letter;
    };
    
    const updatedColumns = newColumns.map((col, idx) => ({
      ...col,
      letter: getLetter(idx)
    }));

    setCustomColumns(updatedColumns);
    saveSheetMeta(`${storageKey}_columns`, updatedColumns).catch(err => console.error(err));

    // Update selected cell location
    const newCell = { ...selectedCell, col: targetIdx };
    setSelectedCell(newCell);
    setRangeStart(newCell);
    setRangeEnd(newCell);
    setHasUnsaved(true);
    showToast(`Column moved ${direction}.`);
  };

  const handleDropColumn = (sourceIdx, targetIdx) => {
    if (sourceIdx === targetIdx || isNaN(sourceIdx)) return;
    
    pushUndo();
    
    const newColumns = [...customColumns];
    const [draggedCol] = newColumns.splice(sourceIdx, 1);
    newColumns.splice(targetIdx, 0, draggedCol);
    
    const getLetter = (num) => {
      let letter = '';
      while (num >= 0) {
        letter = String.fromCharCode(65 + (num % 26)) + letter;
        num = Math.floor(num / 26) - 1;
      }
      return letter;
    };
    
    const updatedColumns = newColumns.map((col, idx) => ({
      ...col,
      letter: getLetter(idx)
    }));
    
    setCustomColumns(updatedColumns);
    saveSheetMeta(`${storageKey}_columns`, updatedColumns).catch(err => console.error(err));
    
    setSelectedCell(prev => prev ? { ...prev, col: targetIdx } : null);
    setRangeStart(null);
    setRangeEnd(null);
    setHasUnsaved(true);
    showToast(`Column moved successfully.`);
  };

  const deleteSelected = () => {
    if (!selectedCell && !rangeStart) return;
    
    if (selectionType === 'column') {
      let c1 = selectedCell.col;
      let c2 = selectedCell.col;
      if (rangeStart && rangeEnd) {
        c1 = Math.min(rangeStart.col, rangeEnd.col);
        c2 = Math.max(rangeStart.col, rangeEnd.col);
      }
      
      const colLabels = [];
      for (let i = c1; i <= c2; i++) {
        colLabels.push(customColumns[i].label);
      }
      
      if (!window.confirm(`Clear all values in column(s): ${colLabels.join(', ')}?`)) return;
      
      pushUndo();
      setData(prev => prev.map(row => {
        const updatedRow = { ...row };
        for (let i = c1; i <= c2; i++) {
          updatedRow[customColumns[i].key] = '';
        }
        return updatedRow;
      }));
      setHasUnsaved(true);
      showToast('Column(s) cleared successfully!');
      return;
    }

    let rowsToDelete = new Set();
    if (rangeStart && rangeEnd) {
       const startFIdx = filteredData.findIndex(r => data.indexOf(r) === rangeStart.row);
       const endFIdx = filteredData.findIndex(r => data.indexOf(r) === rangeEnd.row);
       const minF = Math.min(startFIdx, endFIdx);
       const maxF = Math.max(startFIdx, endFIdx);
       for(let i=minF; i<=maxF; i++) {
          if (i !== -1) {
             rowsToDelete.add(data.indexOf(filteredData[i]));
          }
       }
    } else {
       rowsToDelete.add(selectedCell.row);
    }
    
    rowsToDelete.delete(-1);
    if (rowsToDelete.size === 0) return;
    
    if (!window.confirm(`Delete ${rowsToDelete.size} row(s)?`)) return;
    
    pushUndo();
    const newData = data.filter((_, idx) => !rowsToDelete.has(idx));
    setData(newData);
    setSelectedCell(null);
    setRangeStart(null);
    setRangeEnd(null);
    setEditingCell(null);
    setHasUnsaved(true);
  };

  const [fileHandle, setFileHandle] = useState(null);
  const fileInputRef = useRef(null);

  const handleSerialize = () => {
    if (!rangeStart || !rangeEnd) {
      showToast('Please select a range of cells vertically to serialize first.');
      return;
    }
    
    let r1 = Math.min(rangeStart.row, rangeEnd.row);
    let r2 = Math.max(rangeStart.row, rangeEnd.row);
    let c1 = Math.min(rangeStart.col, rangeEnd.col);
    let c2 = Math.max(rangeStart.col, rangeEnd.col);
    
    if (r1 === r2) {
      showToast('Please select at least two cells vertically to serialize.');
      return;
    }

    pushUndo();
    
    const incrementValue = (val, step) => {
      if (val === null || val === undefined || val === '') return step;
      const numMatch = String(val).match(/^(.*?)(\d+)$/);
      if (numMatch && isNaN(val)) {
        const prefix = numMatch[1];
        const numStr = numMatch[2];
        const nextNum = parseInt(numStr) + step;
        return prefix + String(nextNum).padStart(numStr.length, '0');
      }
      if (!isNaN(val) && val !== '') {
        return Number(val) + step;
      }
      const dateReg = /^\d{4}-\d{2}-\d{2}$/;
      if (dateReg.test(val)) {
        const d = new Date(val);
        if (!isNaN(d.getTime())) {
          d.setDate(d.getDate() + step);
          return d.toISOString().split('T')[0];
        }
      }
      return val;
    };

    setData(prev => {
      const newData = [...prev];
      for (let c = c1; c <= c2; c++) {
        const colKey = customColumns[c].key;
        let sourceVal = newData[r1][colKey];
        if (sourceVal === null || sourceVal === undefined || sourceVal === '') {
          sourceVal = '1';
          newData[r1] = { ...newData[r1], [colKey]: '1' };
        }
        const sourceStyle = newData[r1]._cellStyles ? newData[r1]._cellStyles[colKey] : null;
        let step = 1;
        for (let r = r1 + 1; r <= r2; r++) {
          newData[r] = { ...newData[r], [colKey]: incrementValue(sourceVal, step++) };
          if (sourceStyle) {
            if (!newData[r]._cellStyles) newData[r]._cellStyles = {};
            newData[r]._cellStyles[colKey] = { ...sourceStyle };
          }
          if (computeRow) {
            try {
              newData[r] = computeRow(newData[r]);
            } catch (e) {
              console.error("Error computing row on serialize", e);
            }
          }
        }
      }
      return newData;
    });
    setHasUnsaved(true);
    showToast('Serialization complete!');
  };

  const triggerImport = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const getInitialMapping = (rawHeaders) => {
    const headersLower = rawHeaders.map(h => String(h || '').trim().toLowerCase());
    const initialMapping = {};
    customColumns.forEach(col => {
      const label = String(col.label || '').trim().toLowerCase();
      const idx = headersLower.indexOf(label);
      if (idx !== -1) {
        initialMapping[col.key] = idx;
      } else {
        const letter = String(col.letter || '').trim().toLowerCase();
        const letterIdx = headersLower.indexOf(letter);
        if (letterIdx !== -1) {
          initialMapping[col.key] = letterIdx;
        }
      }
    });
    return initialMapping;
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      import('xlsx').then((XLSX) => {
        try {
          const dataBytes = new Uint8Array(evt.target.result);
          const activeXLSX = XLSX.default || XLSX;
          const workbook = activeXLSX.read(dataBytes, { type: 'array', cellDates: true });
          
          if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
            showToast('Import failed: Excel file contains no sheets.');
            return;
          }

          const parsedSheets = workbook.SheetNames.map(sheetName => {
            const worksheet = workbook.Sheets[sheetName];
            if (!worksheet) return null;
            const json = activeXLSX.utils.sheet_to_json(worksheet, { header: 1 });
            if (json.length < 2) return null;
            return {
              name: sheetName,
              headers: json[0],
              rows: json.slice(1)
            };
          }).filter(Boolean);

          if (parsedSheets.length === 0) {
            showToast('Import failed: Selected file contains no valid sheets or lacks headers.');
            return;
          }

          if (parsedSheets.length > 1) {
            setPendingWorkbook({ fileName: file.name, sheets: parsedSheets });
          } else {
            const sheet = parsedSheets[0];
            setImportModalData({ headers: sheet.headers, rows: sheet.rows, fileName: file.name });
            setImportMapping(getInitialMapping(sheet.headers));
          }
        } catch (err) {
          console.error(err);
          showToast('Import failed: Invalid file format or parsing error.');
        }
      });
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  const executeImport = async (mode) => {
    if (!importModalData) return;

    try {
      const parsedData = importModalData.rows.map(rowArr => {
        const newRow = {};
        customColumns.forEach(col => {
          if (!col || !col.key) return;
          const fileColIdx = importMapping[col.key];
          let val = (rowArr && fileColIdx !== undefined && fileColIdx !== '') ? rowArr[fileColIdx] : undefined;
          
          if (val instanceof Date) {
            val = val.toISOString().split('T')[0];
          } else if (typeof val === 'string') {
            val = val.trim();
          }
          newRow[col.key] = (val === undefined || val === null) ? '' : val;
        });
        return newRow;
      });

      let nextId = nextIdNum;
      const idCol = customColumns.find(c => c && c.key && (c.key.toLowerCase() === 'id' || c.key.toLowerCase().includes('id')));
      const updatedParsedData = parsedData.map(row => {
        let updatedRow = { ...row };
        if (idCol && (!updatedRow[idCol.key] || String(updatedRow[idCol.key]).trim() === '')) {
          updatedRow[idCol.key] = `${idPrefix}${String(nextId++).padStart(3, '0')}`;
        }
        if (computeRow) {
          try {
            updatedRow = computeRow(updatedRow);
          } catch (e) {
            console.error("Error computing row on import", e);
          }
        }
        return updatedRow;
      });

      pushUndo();
      let finalData = [];

      if (mode === 'append') {
        const cleanPrev = getCleanGridData(data, customColumns);
        const combined = [...cleanPrev, ...updatedParsedData];
        const padded = [...combined];
        while (padded.length < 20) {
          const emptyRow = {};
          customColumns.forEach(c => emptyRow[c.key] = '');
          padded.push(emptyRow);
        }
        finalData = padded;

        // Save to IndexedDB immediately to prevent database sync delays
        await saveSheetData(activeStorageKey, getCleanGridData(finalData, customColumns));
        await saveSheetMeta(`${activeStorageKey}_nextid`, nextId);

        // Notify parent of data change instantly
        if (onDataChange) {
          onDataChange(getCleanGridData(finalData, customColumns));
        }

        setData(finalData);
      } else if (mode === 'replace') {
        const proceedReplace = window.confirm("Are you sure you want to delete all existing rows and replace them with the imported data?");
        if (!proceedReplace) return;
        
        const padded = [...updatedParsedData];
        while (padded.length < 20) {
          const emptyRow = {};
          customColumns.forEach(c => emptyRow[c.key] = '');
          padded.push(emptyRow);
        }
        finalData = padded;

        // Save to IndexedDB immediately to prevent database sync delays
        await saveSheetData(activeStorageKey, getCleanGridData(finalData, customColumns));
        await saveSheetMeta(`${activeStorageKey}_nextid`, nextId);

        // Notify parent of data change instantly
        if (onDataChange) {
          onDataChange(getCleanGridData(finalData, customColumns));
        }

        setData(finalData);
      } else if (mode === 'new_sheet') {
        const newTabId = `tab_${Date.now()}`;
        let newTabName = `Sheet${tabs.length + 1}`;
        if (importModalData.fileName) {
          const baseName = importModalData.fileName.replace(/\.[^/.]+$/, "");
          newTabName = baseName.substring(0, 20); 
        }
        const tabStorageKey = `${storageKey}_tab_${newTabId}`;
        const newTab = { id: newTabId, name: newTabName, storageKey: tabStorageKey };
        const newTabs = [...tabs, newTab];
        setTabs(newTabs);
        saveTabsIndex(newTabs);
        
        const padded = [...updatedParsedData];
        while (padded.length < 20) {
          const emptyRow = {};
          customColumns.forEach(c => emptyRow[c.key] = '');
          padded.push(emptyRow);
        }
        finalData = padded;
        
        await saveSheetData(tabStorageKey, getCleanGridData(finalData, customColumns));
        await saveSheetMeta(`${tabStorageKey}_nextid`, nextId);
        
        setActiveTabId(newTabId);
        setData(padded);
      }
      
      setNextIdNum(nextId);
      setHasUnsaved(false); // Saved synchronously above
      setImportModalData(null);
      setImportMapping({});
      showToast(`Successfully imported ${updatedParsedData.length} row(s)!`);
    } catch (err) {
      console.error(err);
      showToast('Import processing failed.');
    }
  };

  const handleResetSheet = async () => {
    try {
      const baseData = initialData || [];
      const padded = [...baseData];
      while (padded.length < 20) {
        const emptyRow = {};
        customColumns.forEach(c => {
          if (c && c.key) {
            emptyRow[c.key] = '';
          }
        });
        padded.push(emptyRow);
      }
      
      // Save empty/initial state to IndexedDB
      await saveSheetData(activeStorageKey, getCleanGridData(padded, customColumns));
      await saveSheetMeta(`${activeStorageKey}_nextid`, 1);
      
      // Clear localStorage cache/fallback to ensure dashboard and other components sync correctly
      localStorage.removeItem(activeStorageKey);
      localStorage.removeItem(`${activeStorageKey}_nextid`);
      
      // Reset component state
      setData(padded);
      setNextIdNum(1);
      setHasUnsaved(false);
      setUndoStack([]);
      setRedoStack([]);
      setHighlightUndoStack([]);
      setHighlightRedoStack([]);
      setEditingCell(null);
      
      const firstEditableColIdx = customColumns.findIndex(c => c && !c.readOnly && c.key !== 'id' && c.key !== 'sn' && c.key !== 's.n.');
      const targetColIdx = firstEditableColIdx !== -1 ? firstEditableColIdx : 0;
      setSelectedCell({ row: 0, col: targetColIdx });
      
      showToast("Sheet data reset successfully.");
      // Re-focus the grid container so keyboard input continues to work
      if (gridContainerRef.current) {
        gridContainerRef.current.focus({ preventScroll: true });
      }
    } catch (err) {
      console.error("Failed to reset sheet:", err);
      showToast("Failed to reset sheet.", "error");
    }
  };

  async function saveData() {
    // Save to IndexedDB
    await saveSheetData(activeStorageKey, getCleanGridData(data, customColumns));
    await saveSheetMeta(`${activeStorageKey}_nextid`, nextIdNum);
    await saveSheetMeta(`${storageKey}_columns`, customColumns);
    setHasUnsaved(false);
    showToast('Data saved successfully!');

    // Re-focus the grid container so keyboard input continues to work
    if (gridContainerRef.current) {
      gridContainerRef.current.focus({ preventScroll: true });
    }
  };

  const exportExcel = async () => {
    setIsExporting(true);
    setTimeout(async () => {
      try {
        const { exportToExcel } = await import('../../utils/exportUtils');
        await exportToExcel(filteredData, customColumns, title, true);
        showToast('Exported successfully!');
      } catch (err) {
        showToast('Failed to export to Excel.');
      }
      setIsExporting(false);
      // Re-focus the grid container so keyboard input continues to work
      if (gridContainerRef.current) {
        gridContainerRef.current.focus({ preventScroll: true });
      }
    }, 300);
  };

  const getStatusBadge = (status) => {
    if (!status) return null;
    let bg = '#f1f5f9', color = '#475569', icon = '';
    
    const s = status.toLowerCase();
    if (s.includes('active') || s.includes('good') || s.includes('complete') || s === 'open' || s.includes('fit') || s.includes('recovered')) { bg = '#dcfce7'; color = '#166534'; icon = '🟢'; }
    if (s.includes('critical') || s.includes('unfit') || s.includes('replace') || s.includes('overdue') || s.includes('chronic') || s.includes('severe')) { bg = '#fee2e2'; color = '#991b1b'; icon = '🔴'; }
    if (s.includes('follow-up') || s.includes('fair') || s.includes('pending') || s.includes('review') || s.includes('mild')) { bg = '#fef9c3'; color = '#854d0e'; icon = '🟡'; }
    if (s.includes('discharged') || s === 'closed' || s.includes('suspended')) { bg = '#f1f5f9'; color = '#475569'; icon = '⚪'; }

    return <span style={{ background: bg, color: color, padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 500, whiteSpace: 'nowrap' }}>{icon} {status}</span>;
  };

  const formatDateDisplay = (val) => {
    if (!val) return '';
    const match = String(val).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (match) {
      return `${match[3]}-${match[2]}-${match[1]}`;
    }
    return val;
  };

  // Calculate cumulative heights of all filtered rows for virtualization
  const { visibleRows, topSpacerHeight, bottomSpacerHeight } = useMemo(() => {
    if (isPrinting) {
      return {
        visibleRows: filteredData,
        topSpacerHeight: 0,
        bottomSpacerHeight: 0
      };
    }

    const offsets = [0];
    let current = 0;
    for (let i = 0; i < filteredData.length; i++) {
      const originalIdx = rowToIndexMap.get(filteredData[i]);
      const height = rowHeights[originalIdx] || 30;
      current += height;
      offsets.push(current);
    }
    const totalHeight = current;

    const bufferHeight = 150; // extra rows buffer
    const viewportTop = Math.max(0, scrollTop - bufferHeight);
    const viewportBottom = scrollTop + containerHeight + bufferHeight;

    let startIndex = 0;
    for (let i = 0; i < offsets.length; i++) {
      if (offsets[i] > viewportTop) {
        startIndex = Math.max(0, i - 1);
        break;
      }
    }

    let endIndex = filteredData.length;
    for (let i = startIndex; i < offsets.length; i++) {
      if (offsets[i] > viewportBottom) {
        endIndex = Math.min(filteredData.length, i);
        break;
      }
    }

    const topSpacer = offsets[startIndex] || 0;
    const bottomSpacer = Math.max(0, totalHeight - offsets[endIndex]);
    const sliced = filteredData.slice(startIndex, endIndex);

    return {
      visibleRows: sliced,
      topSpacerHeight: topSpacer,
      bottomSpacerHeight: bottomSpacer
    };
  }, [filteredData, rowToIndexMap, rowHeights, scrollTop, containerHeight, isPrinting]);

  return (
    <div className="print-wrapper" style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: 'Inter, sans-serif' }}>
      
      {!disableTabs && (
        <div className="print-hide" style={{
          display: 'flex', alignItems: 'flex-end', gap: '0',
          background: '#e2e8f0', paddingLeft: '8px', paddingTop: '6px',
          overflowX: 'auto', flexShrink: 0, borderBottom: '1px solid #cbd5e1'
        }}>
          {tabs.map(tab => (
            <div
              key={tab.id}
              onClick={() => { setActiveTabId(tab.id); setEditingTabId(null); }}
              onDoubleClick={() => { if (!disableRenameTabs || tab.id !== 'default') { setEditingTabId(tab.id); setEditingTabName(tab.name); } }}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 16px', cursor: 'pointer',
                background: activeTabId === tab.id ? 'white' : '#f1f5f9',
                borderTop: activeTabId === tab.id ? '3px solid #3b82f6' : '3px solid transparent',
                borderLeft: '1px solid #cbd5e1', borderRight: '1px solid #cbd5e1',
                fontWeight: activeTabId === tab.id ? 700 : 500,
                color: activeTabId === tab.id ? '#1e293b' : '#64748b',
                fontSize: '13px', whiteSpace: 'nowrap',
                borderRadius: '8px 8px 0 0', transition: 'all 0.15s',
                marginRight: '-1px', position: 'relative'
              }}
            >
              {editingTabId === tab.id ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }} onClick={e => e.stopPropagation()}>
                  <input
                    autoFocus
                    value={editingTabName}
                    onChange={e => setEditingTabName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleRenameTab(tab.id); if (e.key === 'Escape') setEditingTabId(null); }}
                    style={{ padding: '2px 6px', border: '1px solid #3b82f6', borderRadius: '4px', fontSize: '12px', width: '100px', outline: 'none' }}
                  />
                  <button
                    onClick={() => handleRenameTab(tab.id)}
                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  >
                    <span style={{ color: '#10b981', fontSize: '14px', fontWeight: 'bold' }}>✓</span>
                  </button>
                  <button
                    onClick={() => setEditingTabId(null)}
                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  >
                    <span style={{ color: '#ef4444', fontSize: '14px', fontWeight: 'bold' }}>✗</span>
                  </button>
                </div>
              ) : (
                <>
                  <FileSpreadsheet size={14} />
                  {tab.name}
                  
                  {/* Edit/Rename icon */}
                  {(!disableRenameTabs || tab.id !== 'default') && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditingTabId(tab.id); setEditingTabName(tab.name); }}
                      style={{
                        background: 'none', border: 'none', padding: '2px', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        marginLeft: '4px', color: '#94a3b8', transition: 'color 0.15s'
                      }}
                      onMouseOver={e => e.currentTarget.style.color = '#3b82f6'}
                      onMouseOut={e => e.currentTarget.style.color = '#94a3b8'}
                      title="Rename sheet"
                    >
                      <Edit size={12} />
                    </button>
                  )}

                  {tabs.length > 1 && tab.id !== 'default' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteTab(tab.id); }}
                      style={{
                        background: 'none', border: 'none', padding: '2px', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        marginLeft: '2px', color: '#94a3b8', fontSize: '12px', lineHeight: 1
                      }}
                      onMouseOver={e => e.currentTarget.style.color = '#ef4444'}
                      onMouseOut={e => e.currentTarget.style.color = '#94a3b8'}
                      title="Delete sheet"
                    >
                      ×
                    </button>
                  )}
                </>
              )}
            </div>
          ))}

          <div
            onClick={handleCreateTab}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '6px 14px', cursor: 'pointer', color: '#64748b',
              fontSize: '18px', fontWeight: 700, borderRadius: '8px 8px 0 0',
              transition: 'all 0.15s', marginLeft: '4px', background: '#f1f5f9',
              alignSelf: 'stretch'
            }}
            onMouseOver={e => { e.currentTarget.style.background = '#dbeafe'; e.currentTarget.style.color = '#2563eb'; }}
            onMouseOut={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#64748b'; }}
            title="Add new empty sheet"
          >
            +
          </div>

          <div
            onClick={triggerImport}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '6px 14px', cursor: 'pointer', color: '#10b981',
              fontSize: '14px', fontWeight: 700, borderRadius: '8px 8px 0 0',
              transition: 'all 0.15s', marginLeft: '2px', background: '#f1f5f9',
              alignSelf: 'stretch', gap: '4px'
            }}
            onMouseOver={e => { e.currentTarget.style.background = '#d1fae5'; e.currentTarget.style.color = '#059669'; }}
            onMouseOut={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#10b981'; }}
            title="Import Excel file as a new sheet"
          >
            <FileSpreadsheet size={16} /> +
          </div>
        </div>
      )}

      {toast && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', background: '#059669', color: 'white',
          padding: '12px 20px', borderRadius: '8px', fontWeight: 500, zIndex: 9999,
          boxShadow: '0 10px 25px rgba(0,0,0,0.15)'
        }}>✅ {toast}</div>
      )}

      <div className="print-hide" style={{ padding: '12px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '1.1rem', marginRight: '16px' }}>{title}</div>
        <div style={{ width: '250px', minWidth: '150px', display: 'flex', alignItems: 'center', position: 'relative' }}>
          <span style={{ position: 'absolute', left: '10px' }}>🔍</span>
          <input 
            type="text" 
            placeholder="Search..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '8px 12px 8px 36px', border: '1px solid #d1d5db', borderRadius: '6px', outline: 'none' }}
          />
        </div>

        {filters.length > 0 && filters.map(f => (
          <select 
            key={f.key}
            value={activeFilters[f.key] || ''}
            onChange={e => setActiveFilters(prev => ({ ...prev, [f.key]: e.target.value }))}
            style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', outline: 'none', background: 'white', color: '#475569', fontWeight: 500 }}
          >
            <option value="">{f.label}</option>
            {f.options.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        ))}
        
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center', background: 'white', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '6px' }}>
          <button onClick={handleUndo} disabled={undoStack.length === 0} style={{ background: 'transparent', border: 'none', cursor: undoStack.length === 0 ? 'not-allowed' : 'pointer', opacity: undoStack.length === 0 ? 0.5 : 1, padding: '4px' }} title="Undo (Ctrl+Z)">
            <Undo2 size={16} color="#475569" />
          </button>
          <button onClick={handleRedo} disabled={redoStack.length === 0} style={{ background: 'transparent', border: 'none', cursor: redoStack.length === 0 ? 'not-allowed' : 'pointer', opacity: redoStack.length === 0 ? 0.5 : 1, padding: '4px' }} title="Redo (Ctrl+Y)">
            <Redo2 size={16} color="#475569" />
          </button>
        </div>

        <button onClick={addRow} style={{ padding: '8px 16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}>Add Row</button>
        <button onClick={addColumn} style={{ padding: '8px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}>Add Column</button>
        <button onClick={deleteSelected} style={{ padding: '8px 16px', background: 'white', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }} title="Delete Selected Row(s)">Delete Row</button>
        <button onClick={deleteColumn} style={{ padding: '8px 16px', background: 'white', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }} title="Delete Selected Column(s) entirely from the spreadsheet">Delete Column</button>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center', background: 'white', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '6px' }} title="Shift Selected Column">
          <button 
            onClick={() => moveColumn('left')} 
            disabled={!selectedCell || selectedCell.col === 0} 
            style={{ 
              background: 'transparent', border: 'none', 
              cursor: (!selectedCell || selectedCell.col === 0) ? 'not-allowed' : 'pointer', 
              opacity: (!selectedCell || selectedCell.col === 0) ? 0.5 : 1, 
              padding: '4px', display: 'flex', alignItems: 'center' 
            }} 
            title="Move Column Left"
          >
            <ArrowLeft size={16} color="#475569" />
          </button>
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#475569', padding: '0 2px' }}>Shift Col</span>
          <button 
            onClick={() => moveColumn('right')} 
            disabled={!selectedCell || selectedCell.col === customColumns.length - 1} 
            style={{ 
              background: 'transparent', border: 'none', 
              cursor: (!selectedCell || selectedCell.col === customColumns.length - 1) ? 'not-allowed' : 'pointer', 
              opacity: (!selectedCell || selectedCell.col === customColumns.length - 1) ? 0.5 : 1, 
              padding: '4px', display: 'flex', alignItems: 'center' 
            }} 
            title="Move Column Right"
          >
            <ArrowRight size={16} color="#475569" />
          </button>
        </div>
        <button onClick={handleSerialize} style={{ padding: '8px 16px', background: 'white', color: '#16a34a', border: '1px solid #86efac', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }} title="Fill Series Down">Serialize</button>
        
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center', background: 'white', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '6px' }}>
          <button onClick={() => setShowTotals(!showTotals)} style={{ padding: '4px 8px', background: showTotals ? '#2563eb' : 'transparent', color: showTotals ? 'white' : '#475569', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }} title="Toggle Grand Totals Row">
            <Sigma size={16} /> Totals
          </button>
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowAnalysisMenu(!showAnalysisMenu)} style={{ padding: '4px 8px', background: 'transparent', color: '#475569', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }} title="Data Analysis Tools">
              <Calculator size={16} /> Analyze
            </button>
            {showAnalysisMenu && (
              <div style={{ position: 'absolute', top: '100%', left: 0, background: 'white', border: '1px solid #cbd5e1', borderRadius: '6px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', padding: '4px 0', zIndex: 50, minWidth: '200px' }}>
                <div style={{ padding: '4px 12px', fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Insert Calculation Column</div>
                <div onClick={() => handleAnalyze('running_total')} style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '13px' }} onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'} onMouseOut={e => e.currentTarget.style.background = 'white'}>📈 Running Total</div>
                <div onClick={() => handleAnalyze('rank')} style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '13px' }} onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'} onMouseOut={e => e.currentTarget.style.background = 'white'}>🔢 Rank Column</div>
                <div onClick={() => handleAnalyze('percent_total')} style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '13px' }} onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'} onMouseOut={e => e.currentTarget.style.background = 'white'}>📊 % of Total</div>
                <div style={{ height: '1px', background: '#e2e8f0', margin: '4px 0' }}></div>
                <div style={{ padding: '4px 12px', fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Conditional Functions</div>
                <div onClick={() => handleAnalyze('countif')} style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '13px' }} onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'} onMouseOut={e => e.currentTarget.style.background = 'white'}>🔍 COUNTIF</div>
                <div onClick={() => handleAnalyze('sumif')} style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '13px' }} onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'} onMouseOut={e => e.currentTarget.style.background = 'white'}>➕ SUMIF</div>
                <div style={{ height: '1px', background: '#e2e8f0', margin: '4px 0' }}></div>
                <div style={{ padding: '4px 12px', fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Math Operations</div>
                <div onClick={() => handleAnalyze('math_multiply')} style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '13px' }} onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'} onMouseOut={e => e.currentTarget.style.background = 'white'}>✖️ Multiply by Column</div>
                <div onClick={() => handleAnalyze('math_add')} style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '13px' }} onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'} onMouseOut={e => e.currentTarget.style.background = 'white'}>➕ Add Column</div>
                <div onClick={() => handleAnalyze('math_subtract')} style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '13px' }} onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'} onMouseOut={e => e.currentTarget.style.background = 'white'}>➖ Subtract Column</div>
                <div onClick={() => handleAnalyze('math_divide')} style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '13px' }} onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'} onMouseOut={e => e.currentTarget.style.background = 'white'}>➗ Divide by Column</div>
                <div onClick={() => handleAnalyze('math_constant')} style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '13px' }} onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'} onMouseOut={e => e.currentTarget.style.background = 'white'}>🔢 Multiply by Constant</div>
                <div onClick={() => handleAnalyze('quick_stats')} style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '13px' }} onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'} onMouseOut={e => e.currentTarget.style.background = 'white'}>📌 Quick Stats (Min/Max/Avg/Sum)</div>
                <div style={{ height: '1px', background: '#e2e8f0', margin: '4px 0' }}></div>
                <div style={{ padding: '4px 12px', fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Formatting & Cleanup</div>
                <div onClick={() => handleAnalyze('top3')} style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '13px', color: '#166534' }} onMouseOver={e => e.currentTarget.style.background = '#dcfce7'} onMouseOut={e => e.currentTarget.style.background = 'white'}>🟢 Highlight Top 3</div>
                <div onClick={() => handleAnalyze('bottom3')} style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '13px', color: '#991b1b' }} onMouseOver={e => e.currentTarget.style.background = '#fee2e2'} onMouseOut={e => e.currentTarget.style.background = 'white'}>🔴 Highlight Bottom 3</div>
                <div onClick={() => handleAnalyze('dedup')} style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '13px' }} onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'} onMouseOut={e => e.currentTarget.style.background = 'white'}>🧹 Remove Duplicates</div>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '4px', alignItems: 'center', background: 'white', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '6px' }}>
          <button onClick={() => setZoomLevel(z => Math.max(0.5, z - 0.1))} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }} title="Zoom Out">
            <ZoomOut size={16} color="#475569" />
          </button>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', minWidth: '40px', textAlign: 'center' }}>
            {Math.round(zoomLevel * 100)}%
          </span>
          <button onClick={() => setZoomLevel(z => Math.min(2, z + 0.1))} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }} title="Zoom In">
            <ZoomIn size={16} color="#475569" />
          </button>
        </div>
        
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center', background: 'white', padding: '4px 8px', border: '1px solid #cbd5e1', borderRadius: '6px' }}>
          {/* Text Style */}
          <button onClick={() => applyFormat('bold', true)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '4px' }} onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'} onMouseOut={e => e.currentTarget.style.background = 'transparent'} title="Bold (Ctrl+B)">
            <Bold size={16} color="#475569" />
          </button>
          <button onClick={() => applyFormat('italic', true)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '4px' }} onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'} onMouseOut={e => e.currentTarget.style.background = 'transparent'} title="Italic (Ctrl+I)">
            <Italic size={16} color="#475569" />
          </button>
          <button onClick={() => applyFormat('underline', true)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '4px' }} onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'} onMouseOut={e => e.currentTarget.style.background = 'transparent'} title="Underline (Ctrl+U)">
            <Underline size={16} color="#475569" />
          </button>
          
          <div style={{ width: '1px', height: '16px', background: '#cbd5e1', margin: '0 4px' }}></div>
          
          {/* Font Size */}
          <button onClick={() => applyFormat('fontSize', '-')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }} title="Decrease Font Size">
            <Type size={14} color="#475569" /><Minus size={10} color="#475569" />
          </button>
          <button onClick={() => applyFormat('fontSize', '+')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }} title="Increase Font Size">
            <Type size={18} color="#475569" /><Plus size={10} color="#475569" />
          </button>
          
          <div style={{ width: '1px', height: '16px', background: '#cbd5e1', margin: '0 4px' }}></div>
          
          {/* Alignment */}
          <button onClick={() => applyFormat('textAlign', 'left')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px' }} title="Align Left">
            <AlignLeft size={16} color="#475569" />
          </button>
          <button onClick={() => applyFormat('textAlign', 'center')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px' }} title="Align Center">
            <AlignCenter size={16} color="#475569" />
          </button>
          <button onClick={() => applyFormat('textAlign', 'right')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px' }} title="Align Right">
            <AlignRight size={16} color="#475569" />
          </button>

          <div style={{ width: '1px', height: '16px', background: '#cbd5e1', margin: '0 4px' }}></div>
          
          {/* Colors */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <PaintBucket size={16} color="#475569" title="Background Color" />
            <button onClick={() => { applyColor('#fef08a'); setActiveColor('#fef08a'); }} style={{width:'18px', height:'18px', borderRadius:'50%', background:'#fef08a', border:'1px solid #eab308', cursor:'pointer'}} title="Highlight Yellow"></button>
            <button onClick={() => { applyColor('#dcfce7'); setActiveColor('#dcfce7'); }} style={{width:'18px', height:'18px', borderRadius:'50%', background:'#dcfce7', border:'1px solid #22c55e', cursor:'pointer'}} title="Highlight Green"></button>
            <button onClick={() => { applyColor('#fee2e2'); setActiveColor('#fee2e2'); }} style={{width:'18px', height:'18px', borderRadius:'50%', background:'#fee2e2', border:'1px solid #ef4444', cursor:'pointer'}} title="Highlight Red"></button>
            <button onClick={() => { applyColor('#dbeafe'); setActiveColor('#dbeafe'); }} style={{width:'18px', height:'18px', borderRadius:'50%', background:'#dbeafe', border:'1px solid #3b82f6', cursor:'pointer'}} title="Highlight Blue"></button>
            <button onClick={() => { applyColor('#ffedd5'); setActiveColor('#ffedd5'); }} style={{width:'18px', height:'18px', borderRadius:'50%', background:'#ffedd5', border:'1px solid #f97316', cursor:'pointer'}} title="Highlight Orange"></button>
            <button onClick={() => { applyColor(''); setActiveColor(''); }} style={{width:'18px', height:'18px', borderRadius:'50%', background:'white', border:'1px solid #cbd5e1', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px'}} title="Clear Highlight">🚫</button>
            <button 
              onClick={() => setIsEraserMode(!isEraserMode)} 
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '4px', border: '1px solid #cbd5e1', borderRadius: '4px',
                background: isEraserMode ? '#3b82f6' : 'white',
                color: isEraserMode ? 'white' : '#475569',
                cursor: 'pointer'
              }}
              title="Toggle Interactive Highlighter Eraser Mode (Click & drag to erase highlights)"
            >
              <Eraser size={14} />
            </button>
            <div style={{ width: '1px', height: '16px', background: '#cbd5e1', margin: '0 2px' }}></div>
            <button 
              onClick={handleHighlightUndo} 
              disabled={highlightUndoStack.length === 0} 
              style={{ 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '4px', border: '1px solid #cbd5e1', borderRadius: '4px',
                background: 'white',
                color: '#475569',
                cursor: highlightUndoStack.length === 0 ? 'not-allowed' : 'pointer',
                opacity: highlightUndoStack.length === 0 ? 0.5 : 1
              }} 
              title="Undo Highlight Only"
            >
              <Undo2 size={12} color="#dc2626" />
            </button>
            <button 
              onClick={handleHighlightRedo} 
              disabled={highlightRedoStack.length === 0} 
              style={{ 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '4px', border: '1px solid #cbd5e1', borderRadius: '4px',
                background: 'white',
                color: '#475569',
                cursor: highlightRedoStack.length === 0 ? 'not-allowed' : 'pointer',
                opacity: highlightRedoStack.length === 0 ? 0.5 : 1
              }} 
              title="Redo Highlight Only"
            >
              <Redo2 size={12} color="#16a34a" />
            </button>
          </div>
          
          <div style={{ width: '1px', height: '16px', background: '#cbd5e1', margin: '0 4px' }}></div>
          <button onClick={() => highlightEntireRow(activeColor)} style={{ padding: '6px 10px', background: 'white', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 600, color: '#475569' }} title="Highlight Selected Cell's Entire Row">Highlight Row</button>
          <button onClick={() => highlightEntireCol(activeColor)} style={{ padding: '6px 10px', background: 'white', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 600, color: '#475569' }} title="Highlight Selected Cell's Entire Column">Highlight Col</button>
          
          <div style={{ width: '1px', height: '16px', background: '#cbd5e1', margin: '0 4px' }}></div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ position: 'relative' }}>
              <input type="color" onChange={(e) => applyFormat('color', e.target.value)} style={{ width: '24px', height: '24px', padding: 0, border: 'none', cursor: 'pointer', background: 'transparent' }} title="Text Color" />
            </div>
          </div>
        </div>

        <button 
          onClick={triggerImport} 
          style={{ padding: '8px 16px', background: 'white', color: '#2563eb', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          📥 Import Excel/CSV
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleImport} 
          style={{ display: 'none' }} 
          accept=".xlsx, .xls, .csv" 
        />
        <button 
          onClick={exportExcel} 
          disabled={isExporting}
          style={{ padding: '8px 16px', background: isExporting ? '#9ca3af' : '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: isExporting ? 'not-allowed' : 'pointer', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <FileSpreadsheet size={16} /> 
          {isExporting ? 'Exporting...' : 'Export'}
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc', padding: '4px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
            <Settings size={14} color="#64748b" />
            <select 
              value={printLayout} 
              onChange={(e) => setPrintLayout(e.target.value)}
              style={{ padding: '2px', borderRadius: '4px', border: '1px solid #cbd5e1', outline: 'none', background: 'white', fontSize: '13px' }}
            >
              <option value="portrait">Portrait</option>
              <option value="landscape">Landscape</option>
            </select>
            <select 
              value={printScale} 
              onChange={(e) => setPrintScale(parseFloat(e.target.value))}
              style={{ padding: '2px', borderRadius: '4px', border: '1px solid #cbd5e1', outline: 'none', background: 'white', fontSize: '13px' }}
            >
              <option value={0.5}>50%</option>
              <option value={0.6}>60%</option>
              <option value={0.7}>70%</option>
              <option value={0.8}>80%</option>
              <option value={0.9}>90%</option>
              <option value={1}>100%</option>
            </select>
          </div>
        <button 
          onClick={exportToPDF} 
          style={{ padding: '8px 16px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}
          title="Export as PDF"
        >
          📄 PDF
        </button>
        <button 
          onClick={() => {
            setIsPrinting(true);
            setTimeout(() => {
              try {
                if (window.electron && typeof window.electron.printCommand === 'function') {
                  window.electron.printCommand({ landscape: printLayout === 'landscape' });
                } else {
                  window.print();
                }
              } catch (err) {
                console.error(err);
                window.print();
              }
              setTimeout(() => {
                setIsPrinting(false);
                if (gridContainerRef.current) gridContainerRef.current.focus({ preventScroll: true });
              }, 1000);
            }, 300);
          }} 
          style={{ padding: '8px 16px', background: 'white', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Printer size={16} /> Print
        </button>
        <button 
          onClick={() => {
            setIsPrinting(true);
            setTimeout(() => {
              try {
                if (window.electron && typeof window.electron.previewPrint === 'function') {
                  window.electron.previewPrint({ landscape: printLayout === 'landscape' });
                } else {
                  window.print();
                }
              } catch (err) {
                console.error(err);
                window.print();
              }
              setTimeout(() => {
                setIsPrinting(false);
                if (gridContainerRef.current) gridContainerRef.current.focus({ preventScroll: true });
              }, 1000);
            }, 300);
          }} 
          style={{ padding: '8px 16px', background: 'white', color: '#1e40af', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}
          title="Print Preview"
        >
          <Eye size={16} /> Print Preview
        </button>
        <button 
          onClick={() => setShowResetConfirm(true)} 
          disabled={isExporting}
          style={{ 
            padding: '8px 16px', 
            background: 'white', 
            color: '#dc2626', 
            border: '1px solid #fca5a5', 
            borderRadius: '6px', 
            cursor: isExporting ? 'not-allowed' : 'pointer', 
            fontWeight: 500, 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            if (!isExporting) {
              e.currentTarget.style.background = '#fef2f2';
              e.currentTarget.style.border = '1px solid #ef4444';
            }
          }}
          onMouseLeave={(e) => {
            if (!isExporting) {
              e.currentTarget.style.background = 'white';
              e.currentTarget.style.border = '1px solid #fca5a5';
            }
          }}
          title="Reset sheet to default template"
        >
          <RotateCcw size={16} /> Reset Sheet
        </button>
        <button 
          onClick={saveData} 
          style={{ padding: '8px 16px', background: !hasUnsaved ? '#059669' : '#047857', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          💾 {`Save ${hasUnsaved ? '*' : ''}`}
        </button>
        {toolbarRight && toolbarRight}
      </div>

      <div ref={gridContainerRef} tabIndex={-1} className="print-wrapper" style={{ flex: 1, overflow: 'auto', background: '#f1f5f9', position: 'relative', outline: 'none' }}
        onClick={(e) => {
          // Re-focus the grid container when clicked, to recover from focus loss after dialogs/alerts
          if (document.activeElement !== gridContainerRef.current && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'SELECT') {
            gridContainerRef.current.focus({ preventScroll: true });
          }
        }}
      >
        <style dangerouslySetInnerHTML={{__html: `
          @media print {
            @page { size: A4 ${printLayout}; margin: 10mm; }
            .print-wrapper table {
              zoom: ${printScale};
            }
          }
        `}} />
        {isLoading && (
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(255, 255, 255, 0.75)', backdropFilter: 'blur(4px)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            zIndex: 100, gap: '16px'
          }}>
            <div style={{
              width: '40px', height: '40px', border: '3px solid #e2e8f0',
              borderTopColor: '#2563eb', borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            <div style={{ fontWeight: 600, color: '#334155', fontSize: '14px' }}>Loading spreadsheet records...</div>
            <style>{`
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        )}
        <table ref={tableRef} style={{ borderCollapse: 'collapse', width: 'max-content', minWidth: '100%', fontSize: '13px', fontFamily: 'Calibri, Arial, sans-serif', background: 'white', zoom: zoomLevel }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#f8fafc' }}>
            {(() => {
              const hasSuperGroups = customColumns.some(c => c.superGroup);
              if (!hasSuperGroups) return null;
              
              const sGroups = [];
              let currentSGroup = customColumns[0]?.superGroup;
              let colspan = 0;
              customColumns.forEach((col) => {
                if (col.superGroup === currentSGroup) {
                  colspan++;
                } else {
                  sGroups.push({ title: currentSGroup, colspan });
                  currentSGroup = col.superGroup;
                  colspan = 1;
                }
              });
              if (colspan > 0) sGroups.push({ title: currentSGroup, colspan });

              return (
                <tr>
                  <th style={{ background: '#94a3b8', border: '1px solid #64748b', position: 'sticky', left: 0, zIndex: 12 }}></th>
                  {sGroups.map((g, i) => {
                    const isEditing = editingSuperGroup === `${i}-${g.title}`;
                    return (
                      <th 
                        key={i} 
                        colSpan={g.colspan} 
                        onClick={() => setEditingSuperGroup(`${i}-${g.title}`)}
                        title="Click to rename"
                        style={{ background: '#cbd5e1', color: '#0f172a', border: '1px solid #94a3b8', padding: isEditing ? 0 : '10px 12px', textAlign: 'center', fontWeight: 'bold', fontSize: '15px', textTransform: 'uppercase', letterSpacing: '2px', cursor: 'pointer', position: 'relative' }}
                      >
                        {isEditing ? (
                          <input
                            type="text"
                            defaultValue={g.title}
                            autoFocus
                            onBlur={(e) => {
                              const newTitle = e.target.value.trim();
                              if (newTitle && newTitle !== g.title) {
                                setCustomColumns(prev => {
                                  const newCols = prev.map(c => c.superGroup === g.title ? { ...c, superGroup: newTitle } : c);
                                  saveSheetMeta(`${storageKey}_columns`, newCols);
                                  return newCols;
                                });
                              }
                              setEditingSuperGroup(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') e.target.blur();
                              if (e.key === 'Escape') setEditingSuperGroup(null);
                            }}
                            style={{ width: '100%', height: '100%', border: 'none', outline: 'none', background: 'white', textAlign: 'center', font: 'inherit', textTransform: 'uppercase' }}
                          />
                        ) : (
                          g.title || ''
                        )}
                      </th>
                    );
                  })}
                </tr>
              );
            })()}
            {(() => {
              const hasGroups = customColumns.some(c => c.group);
              if (!hasGroups) return null;
              
              const groups = [];
              let currentGroup = customColumns[0]?.group;
              let colspan = 0;
              customColumns.forEach((col) => {
                if (col.group === currentGroup) {
                  colspan++;
                } else {
                  groups.push({ title: currentGroup, colspan });
                  currentGroup = col.group;
                  colspan = 1;
                }
              });
              if (colspan > 0) groups.push({ title: currentGroup, colspan });

              return (
                <tr>
                  <th style={{ background: '#cbd5e1', border: '1px solid #94a3b8', position: 'sticky', left: 0, zIndex: 12 }}></th>
                  {groups.map((g, i) => {
                    const isEditing = editingGroup === `${i}-${g.title}`;
                    return (
                      <th 
                        key={i} 
                        colSpan={g.colspan} 
                        onClick={() => setEditingGroup(`${i}-${g.title}`)}
                        title="Click to rename"
                        style={{ background: '#e2e8f0', color: '#0f172a', border: '1px solid #cbd5e1', padding: isEditing ? 0 : '8px 12px', textAlign: 'center', fontWeight: 'bold', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px', cursor: 'pointer', position: 'relative' }}
                      >
                        {isEditing ? (
                          <input
                            type="text"
                            defaultValue={g.title}
                            autoFocus
                            onBlur={(e) => {
                              const newTitle = e.target.value.trim();
                              if (newTitle && newTitle !== g.title) {
                                setCustomColumns(prev => {
                                  const newCols = prev.map(c => c.group === g.title ? { ...c, group: newTitle } : c);
                                  saveSheetMeta(`${storageKey}_columns`, newCols);
                                  return newCols;
                                });
                              }
                              setEditingGroup(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') e.target.blur();
                              if (e.key === 'Escape') setEditingGroup(null);
                            }}
                            style={{ width: '100%', height: '100%', border: 'none', outline: 'none', background: 'white', textAlign: 'center', font: 'inherit', textTransform: 'uppercase' }}
                          />
                        ) : (
                          g.title || ''
                        )}
                      </th>
                    );
                  })}
                </tr>
              );
            })()}
            <tr>
              <th 
                onClick={selectAll}
                style={{ background: '#e2e8f0', color: '#64748b', width: '45px', border: '1px solid #cbd5e1', position: 'sticky', left: 0, zIndex: 12, cursor: 'pointer' }}
                title="Select All"
              >
                #
              </th>
              {customColumns.map((col, colIdx) => {
                const isEditingHeader = editingHeader === colIdx;
                const width = colWidths[col.key] || 120;
                
                return (
                  <th 
                    key={col.key} 
                    draggable={!isEditingHeader}
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/plain", colIdx);
                      setDraggingColIdx(colIdx);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                    }}
                    onDragEnter={(e) => {
                      e.preventDefault();
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      const sourceIdx = parseInt(e.dataTransfer.getData("text/plain"));
                      handleDropColumn(sourceIdx, colIdx);
                      setDraggingColIdx(null);
                    }}
                    onDragEnd={() => setDraggingColIdx(null)}
                    style={{ 
                      background: draggingColIdx === colIdx ? '#e2e8f0' : '#f8fafc', 
                      opacity: draggingColIdx === colIdx ? 0.5 : 1,
                      color: '#334155', border: '1px solid #cbd5e1', 
                      padding: isEditingHeader ? 0 : '6px 12px', textAlign: 'left', fontWeight: 600, 
                      cursor: isEditingHeader ? 'text' : 'grab', position: 'relative', width: `${width}px`, minWidth: `${width}px`
                    }}
                    title={isEditingHeader ? "" : `Drag header to move column. Double click to rename.`}
                  >
                    {isEditingHeader ? (
                      <input
                        type="text"
                        defaultValue={col.label}
                        autoFocus
                        onBlur={(e) => {
                          const newLabel = e.target.value.trim();
                          if (newLabel) {
                            setCustomColumns(prev => {
                              const newCols = prev.map((c, idx) => idx === colIdx ? { ...c, label: newLabel } : c);
                              saveSheetMeta(`${storageKey}_columns`, newCols);
                              return newCols;
                            });
                          }
                          setEditingHeader(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const newLabel = e.target.value.trim();
                            if (newLabel) {
                              setCustomColumns(prev => prev.map((c, idx) => idx === colIdx ? { ...c, label: newLabel } : c));
                            }
                            setEditingHeader(null);
                          } else if (e.key === 'Escape') {
                            setEditingHeader(null);
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                        style={{ width: '100%', height: '100%', border: 'none', outline: 'none', background: 'white', padding: '6px 12px', font: 'inherit' }}
                      />
                    ) : (
                      <div 
                        onClick={() => selectWholeColumn(colIdx)}
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '100%' }}
                      >
                        <div 
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingHeader(colIdx);
                          }}
                          title="Click to rename"
                          style={{ flex: 1, display: 'flex', alignItems: 'center' }}
                        >
                          {col.label}
                        </div>
                        <span style={{ color: '#94a3b8', fontSize: '11px' }}>{col.letter}</span>
                      </div>
                    )}
                    
                    {/* Column Resize Handle */}
                    <div
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setResizingCol(col.key);
                        setDragStart(e.clientX);
                        setSizeStart(width);
                      }}
                      style={{
                        position: 'absolute', right: 0, top: 0, bottom: 0, width: '4px',
                        cursor: 'col-resize', background: resizingCol === col.key ? '#2563eb' : 'transparent',
                        zIndex: 10
                      }}
                      title="Drag to resize column"
                    />
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={customColumns.length + 1} style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>
                  No matching records found.
                </td>
              </tr>
            ) : (
              <>
                {topSpacerHeight > 0 && (
                  <tr style={{ height: `${topSpacerHeight}px` }}>
                    <td colSpan={customColumns.length + 1} style={{ height: `${topSpacerHeight}px`, padding: 0, border: 'none' }}></td>
                  </tr>
                )}
                {visibleRows.map((row) => {
                  const originalIdx = rowToIndexMap.get(row);
                  const customRowStyle = getRowStyle(row);
                  const rowHeight = rowHeights[originalIdx] || 30;
                  
                  return (
                    <tr 
                      key={originalIdx} 
                      style={{ 
                        background: originalIdx % 2 === 0 ? 'white' : '#f8fafc', 
                        height: `${rowHeight}px`,
                        ...customRowStyle 
                      }}
                    >
                  <td 
                    onClick={() => selectWholeRow(originalIdx)}
                    style={{ 
                      background: '#f1f5f9', color: '#64748b', textAlign: 'center', 
                      borderRight: '2px solid #cbd5e1', borderBottom: '1px solid #e2e8f0', 
                      position: 'sticky', left: 0, zIndex: 5, cursor: 'pointer' 
                    }}
                    title={`Select Row ${originalIdx + 1}`}
                  >
                    {originalIdx + 1}
                    
                    {/* Row Resize Handle */}
                    <div
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setResizingRow(originalIdx);
                        setDragStart(e.clientY);
                        setSizeStart(rowHeight);
                      }}
                      style={{
                        position: 'absolute', bottom: 0, left: 0, right: 0, height: '4px',
                        cursor: 'row-resize', background: resizingRow === originalIdx ? '#2563eb' : 'transparent',
                        zIndex: 10
                      }}
                      title="Drag to resize row height"
                    />
                  </td>
                  {customColumns.map((col, colIdx) => {
                    const isSelected = selectedCell && selectedCell.row === originalIdx && selectedCell.col === colIdx;
                    const isEditing = editingCell && editingCell.row === originalIdx && editingCell.col === colIdx;
                    const isInRange = isCellInRange(originalIdx, colIdx);
                    const isMatch = term && String(row[col.key] || '').toLowerCase().includes(term);
                    const storedStyleObj = row._cellStyles ? row._cellStyles[col.key] : null;
                    
                    const getTemporalDefault = (type) => {
                      const d = new Date();
                      const offset = d.getTimezoneOffset();
                      const localDate = new Date(d.getTime() - (offset * 60 * 1000));
                      if (type === 'date') return localDate.toISOString().split('T')[0];
                      if (type === 'datetime-local') return localDate.toISOString().substring(0, 16);
                      if (type === 'time') return localDate.toISOString().split('T')[1].substring(0, 5);
                      return '';
                    };

                    let cellBackground = 'inherit';
                    let additionalStyles = { fontSize: '13px' };
                    
                    if (storedStyleObj) {
                      if (typeof storedStyleObj === 'string') {
                        cellBackground = storedStyleObj;
                      } else {
                        if (storedStyleObj.background) cellBackground = storedStyleObj.background;
                        if (storedStyleObj.bold) additionalStyles.fontWeight = 'bold';
                        if (storedStyleObj.italic) additionalStyles.fontStyle = 'italic';
                        if (storedStyleObj.underline) additionalStyles.textDecoration = 'underline';
                        if (storedStyleObj.color) additionalStyles.color = storedStyleObj.color;
                        if (storedStyleObj.fontSize) additionalStyles.fontSize = `${storedStyleObj.fontSize}px`;
                        if (storedStyleObj.textAlign) additionalStyles.textAlign = storedStyleObj.textAlign;
                      }
                    }
                    
                    let cellStyle = {
                      border: '1px solid #e2e8f0', height: '30px', padding: 0, position: 'relative', cursor: isEraserMode ? 'not-allowed' : 'cell',
                      background: cellBackground,
                      ...additionalStyles
                    };

                    if (isMatch) cellStyle = { ...cellStyle, background: '#fef08a', color: '#0f172a' };
                    else if (isInRange) cellStyle = { ...cellStyle, background: '#dbeafe', color: '#0f172a' };
                    
                    if (isSelected) cellStyle = { ...cellStyle, outline: '2px solid #2563eb', outlineOffset: '-1px', background: '#eff6ff', zIndex: 2, color: '#0f172a' };
                    if (isEditing) cellStyle = { ...cellStyle, outline: '2px solid #2563eb', outlineOffset: '-1px', background: 'white', zIndex: 3, color: '#0f172a' };

                    return (
                      <td 
                        key={col.key} id={`cell-${activeStorageKey}-${originalIdx}-${colIdx}`}
                        style={cellStyle}
                        onMouseDown={(e) => onCellMouseDown(e, originalIdx, colIdx)}
                        onMouseOver={(e) => onCellMouseOver(e, originalIdx, colIdx)}
                        onDoubleClick={() => { 
                          if (col.readOnly) return;
                          if (row.status === 'Deducted' && col.key !== 'status') {
                            showToast('This row is already deducted. Please undo deduction first to edit.', 'warning');
                            return;
                          }
                          pushUndo(); 
                          setEditingCell({ row: originalIdx, col: colIdx }); 
                        }}
                        onContextMenu={(e) => handleContextMenu(e, originalIdx, colIdx)}
                      >
                        {isEditing ? (
                          col.type === 'select' ? (
                            <>
                              <input 
                                ref={editInputRef} type="text" 
                                defaultValue={editingCell.initialValue !== undefined ? editingCell.initialValue : row[col.key]}
                                list={`list-${col.key}-${originalIdx}`}
                                onBlur={(e) => commitEdit(e.target.value)}
                                style={{ width: '100%', height: '100%', border: 'none', outline: 'none', background: 'transparent', padding: '0 8px', fontSize: '13px', color: '#0f172a', userSelect: 'text' }}
                                autoFocus
                              />
                              <datalist id={`list-${col.key}-${originalIdx}`}>
                                {col.options && col.options.map(o => <option key={o} value={o} />)}
                              </datalist>
                            </>
                          ) : col.type === 'status' ? (
                            <select 
                              ref={editInputRef} defaultValue={row[col.key]} 
                              onChange={(e) => commitEdit(e.target.value, true)}
                              onBlur={(e) => commitEdit(e.target.value)}
                              style={{ width: '100%', height: '100%', border: 'none', outline: 'none', background: 'transparent', padding: '0 8px', fontSize: '13px', color: '#0f172a', userSelect: 'text' }}
                              autoFocus
                            >
                              {col.options && col.options.map(o => <option key={o} value={o}>{o}</option>)}
                            </select>
                          ) : col.type === 'date' || col.type === 'datetime-local' ? (
                            <input 
                              ref={editInputRef} type={col.type} 
                              defaultValue={row[col.key] || getTemporalDefault(col.type)} 
                              onBlur={(e) => commitEdit(e.target.value)}
                              style={{ width: '100%', height: '100%', border: 'none', outline: 'none', background: 'transparent', padding: '0 8px', fontSize: '13px', color: '#0f172a', userSelect: 'text' }}
                              autoFocus
                            />
                          ) : (
                            <input
                              ref={editInputRef}
                              type="text"
                              inputMode={col.type === 'number' ? 'decimal' : 'text'}
                              defaultValue={editingCell.initialValue !== undefined ? editingCell.initialValue : row[col.key]}
                              autoFocus
                              style={{ width: '100%', height: '100%', border: 'none', outline: 'none', background: 'transparent', padding: '0 8px', font: 'inherit', color: '#0f172a', textAlign: 'inherit', userSelect: 'text' }}
                              onBlur={(e) => {
                                commitEdit(e.target.value);
                              }}
                            />
                          )
                        ) : (
                          <div style={{ padding: '4px 8px', minHeight: '28px', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', justifyContent: additionalStyles.textAlign === 'center' ? 'center' : (additionalStyles.textAlign === 'right' ? 'flex-end' : 'flex-start') }}>
                            {getCustomCellContent ? (
                               getCustomCellContent(col, row[col.key], row) || (col.type === 'status' ? getStatusBadge(row[col.key]) : (col.type === 'date' ? formatDateDisplay(row[col.key]) : evaluateFormula(row[col.key], data, customColumns)))
                            ) : (
                               col.type === 'status' ? getStatusBadge(row[col.key]) : (col.type === 'date' ? formatDateDisplay(row[col.key]) : evaluateFormula(row[col.key], data, customColumns))
                            )}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
            {bottomSpacerHeight > 0 && (
              <tr style={{ height: `${bottomSpacerHeight}px` }}>
                <td colSpan={customColumns.length + 1} style={{ height: `${bottomSpacerHeight}px`, padding: 0, border: 'none' }}></td>
              </tr>
            )}
              </>
            )}
            
            {showTotals && filteredData.length > 0 && (() => {
              // Smart detection: these column key/label patterns should NEVER be summed
              const skipPatterns = [
                'age', 'mobile', 'phone', 'tel', 'contact', 'pin', 'zip', 'code',
                'id', 'empid', 'employee_id', 'employeeid', 's.n', 'sn', 'serial', 'sr',
                'date', 'time', 'year', 'month', 'day', 'dob', 'joining',
                'name', 'patient', 'employee', 'doctor', 'nurse', 'person',
                'department', 'dept', 'designation', 'shift', 'location', 'address',
                'remark', 'note', 'observation', 'status', 'gender', 'sex',
                'blood', 'group', 'batch', 'lot', 'rack', 'manufacturer',
                'complaint', 'diagnosis', 'treatment', 'medicine', 'prescribed',
                'referred', 'reported', 'checked', 'escorted', 'administered',
                'allerg', 'condition', 'effect', 'signature', 'ambulance',
                'body', 'part', 'nature', 'type', 'category', 'unit', 'dose',
                'vaccine', 'item', 'ppe', 'complian', 'fitness', 'vision',
                'hearing', 'lung', 'x-ray', 'ecg', 'overall', 'test', 'result',
                'expiry', 'replace', 'issue', 'emergency', 'response',
                'lastupdate', 'last_update', 'lastupdated',
                'handover', 'outside', 'g.code', 'gcode',
              ];
              
              const shouldSkip = (col) => {
                const k = (col.key || '').toLowerCase().replace(/[_\-\s]/g, '');
                const l = (col.label || '').toLowerCase().replace(/[_\-\s]/g, '');
                // Skip date/select type columns
                if (col.type === 'date' || col.type === 'datetime-local') return true;
                if (col.type === 'select') return true;
                // Check against patterns
                return skipPatterns.some(p => {
                  const pattern = p.replace(/[_\-\s]/g, '');
                  return k.includes(pattern) || l.includes(pattern);
                });
              };

              return (
                <tr style={{ background: '#f1f5f9', fontWeight: 'bold', borderTop: '2px solid #94a3b8', position: 'sticky', bottom: 0, zIndex: 11 }}>
                  <td style={{ background: '#e2e8f0', color: '#334155', textAlign: 'center', borderRight: '2px solid #cbd5e1', position: 'sticky', left: 0, zIndex: 12 }}>
                    ∑
                  </td>
                  {customColumns.map((col, colIdx) => {
                    // Check if this column should be skipped
                    if (shouldSkip(col)) {
                      return (
                        <td key={`total-${col.key}`} style={{ padding: '6px 8px', border: '1px solid #cbd5e1', color: '#94a3b8', fontSize: '11px', textAlign: 'center' }}>
                          {colIdx === 0 ? 'Grand Total' : '—'}
                        </td>
                      );
                    }

                    let sum = 0;
                    let hasNumeric = false;
                    filteredData.forEach(row => {
                      const val = row[col.key];
                      if (val !== null && val !== undefined && val !== '') {
                        const num = Number(String(val).replace(/[,%₹$]/g, ''));
                        if (!isNaN(num)) {
                          sum += num;
                          hasNumeric = true;
                        }
                      }
                    });
                    return (
                      <td key={`total-${col.key}`} style={{ padding: '6px 8px', border: '1px solid #cbd5e1', textAlign: hasNumeric ? 'right' : 'center', color: hasNumeric ? '#1e293b' : '#94a3b8', fontSize: hasNumeric ? '13px' : '11px' }}>
                        {hasNumeric ? sum.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '—'}
                      </td>
                    );
                  })}
                </tr>
              );
            })()}
          </tbody>
        </table>
        {/* Add new row button at bottom of grid */}
        <div 
          className="print-hide"
          onClick={addRow}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            padding: '8px 0', cursor: 'pointer', color: '#64748b',
            borderTop: '1px dashed #cbd5e1', background: '#f8fafc',
            fontSize: '13px', fontWeight: 600, transition: 'all 0.2s',
            userSelect: 'none', position: 'sticky', left: 0
          }}
          onMouseOver={e => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.color = '#2563eb'; }}
          onMouseOut={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#64748b'; }}
          title="Add a new blank row"
        >
          <span style={{ fontSize: '18px', lineHeight: 1 }}>+</span> New Row
        </div>
      </div>

      <div className="print-hide" style={{ background: 'white', borderTop: '1px solid #e2e8f0', padding: '8px 16px', fontSize: '12px', color: '#64748b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', overflowX: 'auto' }}>
        <div style={{ display: 'flex', gap: '24px' }}>
          <span><kbd style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>Tab</kbd> Next</span>
          <span><kbd style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>Enter</kbd> Next</span>
          <span><kbd style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>Shift+Tab</kbd> Previous</span>
          <span><kbd style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>Esc</kbd> Cancel</span>
          <span><kbd style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>Ctrl+Z</kbd> Undo</span>
          <span><kbd style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>Ctrl+S</kbd> Save</span>
          <span><kbd style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>Arrows</kbd> Navigate</span>
          <span style={{ fontWeight: 600, color: '#475569', background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px' }}>
            {filteredData.length === data.length
              ? `${data.length} records`
              : `Showing ${filteredData.length} of ${data.length}`
            } · {customColumns.length} cols
          </span>
        </div>
        
        {selectionMetrics && (
          <div style={{ display: 'flex', gap: '12px', fontWeight: 600, color: '#334155', fontSize: '11.5px', flexWrap: 'wrap' }}>
            {selectionMetrics.sum !== null && <span style={{ background: '#eff6ff', padding: '2px 8px', borderRadius: '4px', border: '1px solid #bfdbfe' }}>Sum: {(Math.round(selectionMetrics.sum * 100) / 100).toLocaleString()}</span>}
            {selectionMetrics.avg !== null && <span style={{ background: '#f0fdf4', padding: '2px 8px', borderRadius: '4px', border: '1px solid #bbf7d0' }}>Avg: {(Math.round(selectionMetrics.avg * 100) / 100).toLocaleString()}</span>}
            {selectionMetrics.median !== null && <span style={{ background: '#fef3c7', padding: '2px 8px', borderRadius: '4px', border: '1px solid #fde68a' }}>Median: {(Math.round(selectionMetrics.median * 100) / 100).toLocaleString()}</span>}
            {selectionMetrics.countA !== null && <span>Count: {selectionMetrics.countA}</span>}
            {selectionMetrics.min !== null && <span>Min: {selectionMetrics.min.toLocaleString()}</span>}
            {selectionMetrics.max !== null && <span>Max: {selectionMetrics.max.toLocaleString()}</span>}
            {selectionMetrics.stdev !== null && <span style={{ background: '#fdf2f8', padding: '2px 8px', borderRadius: '4px', border: '1px solid #fbcfe8' }}>StDev: {(Math.round(selectionMetrics.stdev * 100) / 100).toLocaleString()}</span>}
          </div>
        )}
      </div>

      {contextMenu.show && (
        <div style={{ position: 'fixed', left: contextMenu.x, top: contextMenu.y, background: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', boxShadow: '0 10px 40px rgba(0,0,0,0.15)', padding: '4px 0', zIndex: 9999, minWidth: '180px', fontSize: '13px' }}>
          <div onClick={() => contextAction('insertAbove')} style={{ padding: '8px 16px', cursor: 'pointer' }}>⬆️ Insert Row Above</div>
          <div onClick={() => contextAction('insertBelow')} style={{ padding: '8px 16px', cursor: 'pointer' }}>⬇️ Insert Row Below</div>
          <div style={{ height: '1px', background: '#e2e8f0', margin: '4px 0' }}></div>
          <div onClick={() => contextAction('insertColLeft')} style={{ padding: '8px 16px', cursor: 'pointer' }}>⬅️ Insert Column Left</div>
          <div onClick={() => contextAction('insertColRight')} style={{ padding: '8px 16px', cursor: 'pointer' }}>➡️ Insert Column Right</div>
          <div style={{ height: '1px', background: '#e2e8f0', margin: '4px 0' }}></div>
          <div onClick={() => contextAction('copyRow')} style={{ padding: '8px 16px', cursor: 'pointer' }}>📋 Copy Row</div>
          <div onClick={() => contextAction('clearCell')} style={{ padding: '8px 16px', cursor: 'pointer' }}>🧹 Clear Cell / Selection</div>
          <div onClick={() => contextAction('clearColumn')} style={{ padding: '8px 16px', cursor: 'pointer' }}>🧹 Clear Entire Column</div>
          <div style={{ height: '1px', background: '#e2e8f0', margin: '4px 0' }}></div>
          <div onClick={() => contextAction('fillDown')} style={{ padding: '8px 16px', cursor: 'pointer' }}>➡️ Fill Down (Ctrl+D)</div>
          <div onClick={() => contextAction('fillSeries')} style={{ padding: '8px 16px', cursor: 'pointer' }}>➡️ Fill Series (1, 2, 3...)</div>
          <div style={{ height: '1px', background: '#e2e8f0', margin: '4px 0' }}></div>
          <div onClick={() => contextAction('deleteRow')} style={{ padding: '8px 16px', cursor: 'pointer', color: '#dc2626' }}>🗑 Delete Row(s)</div>
          <div onClick={deleteColumn} style={{ padding: '8px 16px', cursor: 'pointer', color: '#dc2626' }}>🗑 Delete Column</div>
          <div style={{ height: '1px', background: '#e2e8f0', margin: '4px 0' }}></div>
          <div onClick={() => contextAction('moveColLeft')} style={{ padding: '8px 16px', cursor: 'pointer' }}>◀️ Move Column Left (Alt+◀)</div>
          <div onClick={() => contextAction('moveColRight')} style={{ padding: '8px 16px', cursor: 'pointer' }}>▶️ Move Column Right (Alt+▶)</div>
        </div>
      )}

      {importModalData && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.7)', zIndex: 10000, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'white', padding: '32px', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', width: '600px', maxWidth: '90vw', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ margin: '0 0 8px 0', color: '#0f172a', fontSize: '1.5rem' }}>Import Data: Map Columns</h2>
            <p style={{ margin: '0 0 24px 0', color: '#64748b', fontSize: '0.95rem' }}>
              We found {importModalData.headers.length} columns in your file. Match them to the grid's columns below.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
              <div style={{ fontWeight: 'bold', color: '#475569', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px' }}>System Column</div>
              <div style={{ fontWeight: 'bold', color: '#475569', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px' }}>File Column</div>
              
              {customColumns.map(col => (
                <React.Fragment key={col.key}>
                  <div style={{ display: 'flex', alignItems: 'center', fontSize: '0.95rem', color: '#334155', fontWeight: 500 }}>
                    {col.label} {col.key && col.key.toLowerCase().includes('id') && <span style={{ color: '#94a3b8', fontSize: '0.75rem', marginLeft: '6px', fontWeight: 'normal' }}>(Auto if empty)</span>}
                  </div>
                  <div>
                    <select
                      value={importMapping[col.key] !== undefined ? importMapping[col.key] : ''}
                      onChange={(e) => {
                        const val = e.target.value === '' ? '' : Number(e.target.value);
                        setImportMapping(prev => ({ ...prev, [col.key]: val }));
                      }}
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', outline: 'none', background: '#f8fafc', color: '#0f172a', fontSize: '0.95rem' }}
                    >
                      <option value="">-- Ignore / Skip --</option>
                      {importModalData.headers.map((h, i) => (
                        <option key={i} value={i}>{h ? String(h) : `(Column ${i + 1})`}</option>
                      ))}
                    </select>
                  </div>
                </React.Fragment>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '24px' }}>
              <button 
                onClick={() => { setImportModalData(null); setImportMapping({}); }} 
                style={{ padding: '12px 20px', background: 'white', border: '1px solid #cbd5e1', color: '#475569', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, transition: 'background 0.2s' }}
                onMouseOver={e => e.currentTarget.style.background = '#f8fafc'}
                onMouseOut={e => e.currentTarget.style.background = 'white'}
              >
                Cancel
              </button>
              <button 
                onClick={() => executeImport('append')} 
                style={{ padding: '12px 20px', background: '#3b82f6', border: 'none', color: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, transition: 'background 0.2s', boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3)' }}
                onMouseOver={e => e.currentTarget.style.background = '#2563eb'}
                onMouseOut={e => e.currentTarget.style.background = '#3b82f6'}
              >
                Append Data
              </button>
              <button 
                onClick={() => executeImport('replace')} 
                style={{ padding: '12px 20px', background: '#ef4444', border: 'none', color: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, transition: 'background 0.2s', boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.3)' }}
                onMouseOver={e => e.currentTarget.style.background = '#dc2626'}
                onMouseOut={e => e.currentTarget.style.background = '#ef4444'}
              >
                Replace Data
              </button>
              <button 
                onClick={() => executeImport('new_sheet')} 
                style={{ padding: '12px 20px', background: '#10b981', border: 'none', color: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, transition: 'background 0.2s', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3)' }}
                onMouseOver={e => e.currentTarget.style.background = '#059669'}
                onMouseOut={e => e.currentTarget.style.background = '#10b981'}
              >
                Create New Sheet
              </button>
            </div>
          </div>
        </div>
      )}

      {showResetConfirm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.7)', zIndex: 10002, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'white', padding: '32px', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', width: '450px', maxWidth: '90vw', textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '60px', height: '60px', borderRadius: '50%', background: '#fee2e2', color: '#ef4444', marginBottom: '20px' }}>
              <RotateCcw size={32} />
            </div>
            <h2 style={{ margin: '0 0 12px 0', color: '#0f172a', fontSize: '1.4rem', fontWeight: 700 }}>Reset Sheet Data?</h2>
            <p style={{ margin: '0 0 28px 0', color: '#64748b', fontSize: '0.95rem', lineHeight: '1.5' }}>
              Are you sure you want to reset the sheet <strong>"{title}"</strong>? This will permanently delete all records on this tab. This action cannot be undone.
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button 
                onClick={() => {
                  setShowResetConfirm(false);
                  if (gridContainerRef.current) {
                    gridContainerRef.current.focus({ preventScroll: true });
                  }
                }} 
                style={{ padding: '12px 24px', background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#475569', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, transition: 'background 0.2s', flex: 1 }}
                onMouseOver={e => e.currentTarget.style.background = '#e2e8f0'}
                onMouseOut={e => e.currentTarget.style.background = '#f1f5f9'}
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  setShowResetConfirm(false);
                  await handleResetSheet();
                }} 
                style={{ padding: '12px 24px', background: '#ef4444', border: 'none', color: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, transition: 'background 0.2s', boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.3)', flex: 1 }}
                onMouseOver={e => e.currentTarget.style.background = '#dc2626'}
                onMouseOut={e => e.currentTarget.style.background = '#ef4444'}
              >
                Yes, Reset Sheet
              </button>
            </div>
          </div>
        </div>
      )}

      {pendingWorkbook && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.7)', zIndex: 10001, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'white', padding: '32px', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', width: '500px', maxWidth: '90vw', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ margin: '0 0 12px 0', color: '#0f172a', fontSize: '1.5rem' }}>Select Excel Sheet</h2>
            <p style={{ margin: '0 0 24px 0', color: '#64748b', fontSize: '0.95rem' }}>
              The workbook "<strong>{pendingWorkbook.fileName}</strong>" contains multiple sheets. Please choose the one you want to import:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
              {pendingWorkbook.sheets.map((sheet, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setImportModalData({ headers: sheet.headers, rows: sheet.rows, fileName: pendingWorkbook.fileName });
                    setImportMapping(getInitialMapping(sheet.headers));
                    setPendingWorkbook(null);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 20px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '12px',
                    background: '#f8fafc',
                    color: '#0f172a',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                  }}
                  onMouseOver={e => {
                    e.currentTarget.style.background = '#eff6ff';
                    e.currentTarget.style.borderColor = '#3b82f6';
                    e.currentTarget.style.color = '#1e3a8a';
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.background = '#f8fafc';
                    e.currentTarget.style.borderColor = '#cbd5e1';
                    e.currentTarget.style.color = '#0f172a';
                  }}
                >
                  <span>📄 {sheet.name}</span>
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 'normal' }}>Click to select &rarr;</span>
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
              <button 
                onClick={() => setPendingWorkbook(null)} 
                style={{ padding: '12px 20px', background: 'white', border: '1px solid #cbd5e1', color: '#475569', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, transition: 'background 0.2s' }}
                onMouseOver={e => e.currentTarget.style.background = '#f8fafc'}
                onMouseOut={e => e.currentTarget.style.background = 'white'}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExcelGrid;
