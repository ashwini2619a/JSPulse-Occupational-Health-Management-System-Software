import React, { useState, useEffect } from 'react';
import ExcelGrid from './clinical/ExcelGrid';
import { FileSpreadsheet, Trash2, Check, X } from 'lucide-react';

const SHEETS_INDEX_KEY = 'cms_custom_sheets_index';

const getSheetIndex = () => {
  try {
    return JSON.parse(localStorage.getItem(SHEETS_INDEX_KEY) || '[]');
  } catch { return []; }
};

const saveSheetIndex = (index) => {
  localStorage.setItem(SHEETS_INDEX_KEY, JSON.stringify(index));
};

const defaultColumns = [
  { key: 'sn', label: 'S.N.', letter: 'A', width: 70, type: 'number' },
  { key: 'date', label: 'Date', letter: 'B', width: 120, type: 'date' },
  { key: 'name', label: 'Name', letter: 'C', width: 180, type: 'text' },
  { key: 'department', label: 'Department', letter: 'D', width: 150, type: 'text' },
  { key: 'description', label: 'Description', letter: 'E', width: 220, type: 'text' },
  { key: 'quantity', label: 'Quantity', letter: 'F', width: 100, type: 'number' },
  { key: 'remarks', label: 'Remarks', letter: 'G', width: 200, type: 'text' },
];

const CustomSheets = () => {
  const [sheets, setSheets] = useState(getSheetIndex);
  const [activeSheetId, setActiveSheetId] = useState(null);
  const [editingTab, setEditingTab] = useState(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    const idx = getSheetIndex();
    if (idx.length > 0) {
      setSheets(idx);
      if (!activeSheetId) {
        setActiveSheetId(idx[0].id);
      }
    } else {
      const id = 'sheet_' + Date.now();
      const storageKey = `cms_custom_${id}`;
      const newSheet = {
        id,
        name: 'Sheet 1',
        storageKey,
        columns: defaultColumns,
        createdAt: new Date().toISOString()
      };
      const updated = [newSheet];
      setSheets(updated);
      saveSheetIndex(updated);
      setActiveSheetId(id);
    }
  }, []);

  const handleCreateSheet = () => {
    const count = sheets.length + 1;
    const id = 'sheet_' + Date.now();
    const storageKey = `cms_custom_${id}`;

    const newSheet = {
      id,
      name: `Sheet ${count}`,
      storageKey,
      columns: defaultColumns,
      createdAt: new Date().toISOString()
    };

    const updated = [...sheets, newSheet];
    setSheets(updated);
    saveSheetIndex(updated);
    setActiveSheetId(id);
  };

  const handleDeleteSheet = (id) => {
    if (!confirm('Delete this sheet and all its data?')) return;
    const sheet = sheets.find(s => s.id === id);
    if (sheet) localStorage.removeItem(sheet.storageKey);
    const updated = sheets.filter(s => s.id !== id);
    setSheets(updated);
    saveSheetIndex(updated);
    if (activeSheetId === id) {
      setActiveSheetId(updated.length > 0 ? updated[0].id : null);
    }
  };

  const handleRenameSheet = (id) => {
    if (!editName.trim()) return;
    const updated = sheets.map(s => s.id === id ? { ...s, name: editName.trim() } : s);
    setSheets(updated);
    saveSheetIndex(updated);
    setEditingTab(null);
  };

  const activeSheet = sheets.find(s => s.id === activeSheetId);

  // If no sheets yet, create one automatically
  if (sheets.length === 0) {
    return (
      <div className="animate-fade-in" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <FileSpreadsheet size={48} color="#3b82f6" style={{ marginBottom: '12px' }} />
          <h3 style={{ margin: '0 0 16px', color: '#1e293b' }}>No custom sheets yet</h3>
          <button
            onClick={handleCreateSheet}
            style={{
              padding: '12px 28px', background: '#3b82f6', color: 'white',
              border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '15px',
              cursor: 'pointer', boxShadow: '0 4px 12px rgba(59,130,246,0.3)'
            }}
          >
            + Create Sheet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      
      {/* Sheet Tabs */}
      <div style={{
        display: 'flex', alignItems: 'flex-end', gap: '0',
        background: '#e2e8f0', paddingLeft: '8px', paddingTop: '6px',
        overflowX: 'auto', flexShrink: 0
      }}>
        {sheets.map(sheet => (
          <div
            key={sheet.id}
            onClick={() => { setActiveSheetId(sheet.id); setEditingTab(null); }}
            onDoubleClick={() => { setEditingTab(sheet.id); setEditName(sheet.name); }}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '9px 16px', cursor: 'pointer',
              background: activeSheetId === sheet.id ? 'white' : '#f1f5f9',
              borderTop: activeSheetId === sheet.id ? '3px solid #3b82f6' : '3px solid transparent',
              borderLeft: '1px solid #cbd5e1', borderRight: '1px solid #cbd5e1',
              fontWeight: activeSheetId === sheet.id ? 700 : 500,
              color: activeSheetId === sheet.id ? '#1e293b' : '#64748b',
              fontSize: '13px', whiteSpace: 'nowrap',
              borderRadius: '8px 8px 0 0', transition: 'all 0.15s',
              marginRight: '-1px'
            }}
          >
            {editingTab === sheet.id ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }} onClick={e => e.stopPropagation()}>
                <input
                  autoFocus
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleRenameSheet(sheet.id); if (e.key === 'Escape') setEditingTab(null); }}
                  style={{ padding: '2px 6px', border: '1px solid #3b82f6', borderRadius: '4px', fontSize: '12px', width: '100px', outline: 'none' }}
                />
                <Check size={14} color="#10b981" style={{ cursor: 'pointer' }} onClick={() => handleRenameSheet(sheet.id)} />
                <X size={14} color="#ef4444" style={{ cursor: 'pointer' }} onClick={() => setEditingTab(null)} />
              </div>
            ) : (
              <>
                <FileSpreadsheet size={14} />
                {sheet.name}
                <Trash2
                  size={12} color="#94a3b8"
                  style={{ cursor: 'pointer', marginLeft: '2px' }}
                  onClick={(e) => { e.stopPropagation(); handleDeleteSheet(sheet.id); }}
                  onMouseOver={e => e.currentTarget.style.color = '#ef4444'}
                  onMouseOut={e => e.currentTarget.style.color = '#94a3b8'}
                />
              </>
            )}
          </div>
        ))}

        {/* + button */}
        <div
          onClick={handleCreateSheet}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '8px 16px', cursor: 'pointer', color: '#64748b',
            fontSize: '20px', fontWeight: 700, borderRadius: '8px 8px 0 0',
            transition: 'all 0.15s', marginLeft: '2px', background: '#f1f5f9'
          }}
          onMouseOver={e => { e.currentTarget.style.background = '#dbeafe'; e.currentTarget.style.color = '#2563eb'; }}
          onMouseOut={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#64748b'; }}
          title="Add new sheet"
        >
          +
        </div>
      </div>

      {/* Active Sheet */}
      {activeSheet && (
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <ExcelGrid
            key={activeSheet.id}
            title={activeSheet.name}
            storageKey={activeSheet.storageKey}
            initialData={[]}
            columns={activeSheet.columns}
            idPrefix="CS-"
          />
        </div>
      )}
    </div>
  );
};

export default CustomSheets;
