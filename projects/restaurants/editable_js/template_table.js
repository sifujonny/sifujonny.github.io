/**
 * TABLE VIEW
 * Display data in sortable rows - good for scanning specific information
 */
function showTable(data) {

  // Helper: format ISO date string to readable date
  function formatDate(dateStr) {
    if (!dateStr || dateStr === '------') return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  }

  // Helper: return value or an em-dash for missing/blank data
  function safe(val) {
    return (!val || val === '------') ? '<span class="missing">N/A</span>' : val;
  }

  // Helper: color-coded badge based on inspection result text
  function resultBadge(result) {
    if (!result || result === '------') return '<span class="badge badge-na">No Result</span>';
    if (result.toLowerCase().includes('critical')) return `<span class="badge badge-fail">${result}</span>`;
    if (result.toLowerCase().includes('reopen')) return `<span class="badge badge-warn">${result}</span>`;
    return `<span class="badge badge-pass">${result}</span>`;
  }

  // Build one <tr> per restaurant
  const rows = data.map(r => `
    <tr>
      <td>${safe(r.name)}</td>
      <td>${safe(r.city)}</td>
      <td>${formatDate(r.inspection_date)}</td>
      <td>${resultBadge(r.inspection_results)}</td>
      <td>${safe(r.inspection_type)}</td>
      <td>${safe(r.owner)}</td>
    </tr>
  `).join('');

  return `
    <h2 class="view-title">Table View</h2>
    <p class="view-description">All ${data.length} restaurant inspection records. Scan and compare key details.</p>
    <div style="overflow-x: auto;">
      <table class="restaurant-table">
        <thead>
          <tr>
            <th>Restaurant</th>
            <th>City</th>
            <th>Inspection Date</th>
            <th>Result</th>
            <th>Inspection Type</th>
            <th>Owner</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
  `;
}

export default showTable;
