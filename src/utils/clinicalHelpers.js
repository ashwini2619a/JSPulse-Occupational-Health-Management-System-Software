/**
 * Clinical Records — Shared Utilities
 */

/**
 * Export data to CSV and trigger download
 */
export const exportToCSV = (data, columnDefs, filename) => {
  if (!data.length) {
    alert('No data to export.');
    return;
  }

  const headers = columnDefs.map(c => c.label);
  const rows = data.map(row =>
    columnDefs.map(c => {
      const val = row[c.key] ?? '';
      return `"${String(val).replace(/"/g, '""')}"`;
    }).join(',')
  );

  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

/**
 * Print the current page
 */
export const handlePrint = () => {
  window.print();
};

/**
 * Filter data rows by a search term across all column values
 */
export const filterData = (data, searchTerm) => {
  if (!searchTerm.trim()) return data;
  const term = searchTerm.toLowerCase();
  return data.filter(row =>
    Object.values(row).some(val =>
      val !== null && val !== undefined && String(val).toLowerCase().includes(term)
    )
  );
};
