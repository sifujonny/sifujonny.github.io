/**
 * STATS VIEW
 * Aggregate insights from the health inspection dataset.
 * Calculates 6 key statistics and an inspection-type breakdown table.
 */
function showStats(data) {

  const total = data.length;

  // Stat 1 & 2: Total restaurants + unique cities
  const cities = new Set(data.map(r => r.city).filter(Boolean));

  // Stat 3: Restaurants with critical violations (as a percentage)
  const critical = data.filter(r =>
    r.inspection_results && r.inspection_results.toLowerCase().includes('critical')
  ).length;
  const criticalPct = Math.round((critical / total) * 100);

  // Stat 4: Hand-washing compliance rate
  const hwInspected = data.filter(r => r.proper_hand_washing && r.proper_hand_washing !== '------').length;
  const hwPass = data.filter(r => r.proper_hand_washing === 'In Compliance').length;
  const hwPct = hwInspected > 0 ? Math.round((hwPass / hwInspected) * 100) : 0;

  // Stat 5: Cold-holding temperature compliance rate
  const chInspected = data.filter(r => r.cold_holding_temperature && r.cold_holding_temperature !== '------').length;
  const chPass = data.filter(r => r.cold_holding_temperature === 'In Compliance').length;
  const chPct = chInspected > 0 ? Math.round((chPass / chInspected) * 100) : 0;

  // Stat 6: Facilities that were closed and later reopened
  const reopened = data.filter(r =>
    r.inspection_results && r.inspection_results.toLowerCase().includes('reopen')
  ).length;

  // Breakdown table: count by inspection_type
  const typeBreakdown = {};
  data.forEach(r => {
    const t = r.inspection_type || 'N/A';
    typeBreakdown[t] = (typeBreakdown[t] || 0) + 1;
  });
  const typeRows = Object.entries(typeBreakdown)
    .sort((a, b) => b[1] - a[1])
    .map(([type, count]) => `
      <tr>
        <td>${type}</td>
        <td><strong>${count}</strong></td>
        <td>${Math.round((count / total) * 100)}%</td>
      </tr>
    `).join('');

  return `
    <h2 class="view-title">Statistics View</h2>
    <p class="view-description">Aggregate insights from ${total} restaurant health inspections in Maryland.</p>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-number">${total}</div>
        <div class="stat-label">Total Establishments</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">${cities.size}</div>
        <div class="stat-label">Cities Covered</div>
      </div>
      <div class="stat-card stat-card-warn">
        <div class="stat-number">${criticalPct}%</div>
        <div class="stat-label">Had Critical Violations</div>
      </div>
      <div class="stat-card stat-card-good">
        <div class="stat-number">${hwPct}%</div>
        <div class="stat-label">Hand Washing Compliance</div>
      </div>
      <div class="stat-card stat-card-good">
        <div class="stat-number">${chPct}%</div>
        <div class="stat-label">Cold Holding Compliance</div>
      </div>
      <div class="stat-card stat-card-warn">
        <div class="stat-number">${reopened}</div>
        <div class="stat-label">Facilities Reopened After Closure</div>
      </div>
    </div>

    <div class="stats-breakdown">
      <h3>Inspection Types Breakdown</h3>
      <table class="restaurant-table">
        <thead>
          <tr><th>Inspection Type</th><th>Count</th><th>% of Total</th></tr>
        </thead>
        <tbody>
          ${typeRows}
        </tbody>
      </table>
    </div>
  `;
}

export default showStats;
