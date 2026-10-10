import React from 'react';

const shortcutCategories = [
  {
    title: 'Navigation',
    shortcuts: [
      { keys: 'Arrows', desc: 'Move one cell up, down, left, or right' },
      { keys: 'Ctrl + Arrow', desc: 'Move to the edge of data region' },
      { keys: 'Home', desc: 'Move to the beginning of a row' },
      { keys: 'Ctrl + Home', desc: 'Move to the beginning of a worksheet' },
      { keys: 'Ctrl + End', desc: 'Move to the last cell with data' },
      { keys: 'Page Up/Down', desc: 'Move one screen up or down' },
      { keys: 'Alt + Page Up/Down', desc: 'Move one screen left or right' },
      { keys: 'Ctrl + Page Up/Down', desc: 'Move to previous/next sheet' },
    ]
  },
  {
    title: 'Selection',
    shortcuts: [
      { keys: 'Shift + Arrows', desc: 'Extend selection by one cell' },
      { keys: 'Ctrl + Shift + Arrow', desc: 'Extend selection to edge of data' },
      { keys: 'Ctrl + Space', desc: 'Select entire column' },
      { keys: 'Shift + Space', desc: 'Select entire row' },
      { keys: 'Ctrl + A', desc: 'Select entire worksheet / data region' },
    ]
  },
  {
    title: 'Formatting',
    shortcuts: [
      { keys: 'Ctrl + B', desc: 'Apply or remove Bold formatting' },
      { keys: 'Ctrl + I', desc: 'Apply or remove Italic formatting' },
      { keys: 'Ctrl + U', desc: 'Apply or remove Underline' },
      { keys: 'Ctrl + Shift + $', desc: 'Apply Currency format' },
      { keys: 'Ctrl + Shift + %', desc: 'Apply Percentage format' },
      { keys: 'Ctrl + 1', desc: 'Open Format Cells dialog' },
    ]
  },
  {
    title: 'Formula & Calculation',
    shortcuts: [
      { keys: '=', desc: 'Start a formula' },
      { keys: 'F4', desc: 'Cycle absolute/relative references ($A$1)' },
      { keys: 'Alt + =', desc: 'AutoSum' },
      { keys: 'Ctrl + `', desc: 'Toggle formula view' },
      { keys: 'Shift + F3', desc: 'Insert Function dialog' },
      { keys: 'F9', desc: 'Calculate all worksheets' },
    ]
  },
  {
    title: 'Data Entry & Editing',
    shortcuts: [
      { keys: 'F2', desc: 'Edit active cell' },
      { keys: 'Shift + F2', desc: 'Insert/Edit cell comment' },
      { keys: 'Enter', desc: 'Complete cell entry and move down' },
      { keys: 'Tab', desc: 'Complete cell entry and move right' },
      { keys: 'Esc', desc: 'Cancel cell entry' },
      { keys: 'Ctrl + D', desc: 'Fill down' },
      { keys: 'Ctrl + R', desc: 'Fill right' },
      { keys: 'Ctrl + ;', desc: 'Enter current date' },
      { keys: 'Ctrl + Shift + :', desc: 'Enter current time' },
    ]
  },
  {
    title: 'Workbook Management',
    shortcuts: [
      { keys: 'Ctrl + N', desc: 'Create a new workbook' },
      { keys: 'Ctrl + O', desc: 'Open an existing workbook' },
      { keys: 'Ctrl + S', desc: 'Save the active workbook' },
      { keys: 'F12', desc: 'Save As dialog' },
      { keys: 'Ctrl + W', desc: 'Close active workbook' },
      { keys: 'Ctrl + P', desc: 'Print' },
    ]
  },
  {
    title: 'Filter & Sort',
    shortcuts: [
      { keys: 'Ctrl + Shift + L', desc: 'Toggle AutoFilter' },
      { keys: 'Alt + Down Arrow', desc: 'Open filter dropdown menu' },
    ]
  },
  {
    title: 'Special Paste',
    shortcuts: [
      { keys: 'Ctrl + Alt + V', desc: 'Paste Special dialog' },
      { keys: 'Ctrl + Shift + V', desc: 'Paste Values (in some apps)' },
    ]
  },
  {
    title: 'Function Keys',
    shortcuts: [
      { keys: 'F1', desc: 'Help' },
      { keys: 'F5', desc: 'Go To dialog' },
      { keys: 'F7', desc: 'Spell Check' },
      { keys: 'F11', desc: 'Create Chart in new sheet' },
    ]
  }
];

const ShortcutsReference = () => {
  return (
    <div className="animate-fade-in" style={{ padding: '32px', height: '100%', overflowY: 'auto', background: '#f8fafc', color: '#334155' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ marginBottom: '32px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '2.5rem', color: '#1e293b', marginBottom: '8px', fontWeight: 800 }}>Excel Shortcuts Reference</h1>
          <p style={{ fontSize: '1.1rem', color: '#64748b' }}>Master these keyboard shortcuts to navigate and calculate at lightning speed.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
          {shortcutCategories.map((category, idx) => (
            <div key={idx} style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', border: '1px solid #e2e8f0' }}>
              <h2 style={{ fontSize: '1.25rem', color: '#2563eb', marginBottom: '16px', paddingBottom: '8px', borderBottom: '2px solid #eff6ff', fontWeight: 700 }}>
                {category.title}
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {category.shortcuts.map((shortcut, sIdx) => (
                  <div key={sIdx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                    <span style={{ fontSize: '0.9rem', color: '#475569', flex: 1, lineHeight: '1.4' }}>{shortcut.desc}</span>
                    <kbd style={{ 
                      background: '#f1f5f9', 
                      border: '1px solid #cbd5e1', 
                      borderRadius: '6px', 
                      padding: '4px 8px', 
                      fontSize: '0.85rem', 
                      fontFamily: 'monospace', 
                      fontWeight: 600,
                      color: '#0f172a',
                      whiteSpace: 'nowrap',
                      boxShadow: '0 2px 0 rgba(203, 213, 225, 0.4)'
                    }}>
                      {shortcut.keys}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <div style={{ marginTop: '48px', padding: '24px', background: '#eff6ff', borderRadius: '12px', border: '1px solid #bfdbfe', textAlign: 'center' }}>
          <h3 style={{ color: '#1e40af', marginBottom: '8px', fontSize: '1.1rem' }}>Pro Tip: Data Analysis Tools</h3>
          <p style={{ color: '#1e3a8a', fontSize: '0.95rem' }}>Use the <strong>"Analyze"</strong> button in any grid toolbar to automatically generate Running Totals, Ranks, Percentages, and Conditional Highlights without needing complex formulas!</p>
        </div>
      </div>
    </div>
  );
};

export default ShortcutsReference;
