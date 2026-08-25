/**
 * CATEGORY VIEW
 * Group restaurants by city. Shows geographic distribution and violation rates per area.
 */
function showCategories(data) {

  // Group restaurants into an object keyed by city name
  const groups = {};
  data.forEach(r => {
    const city = r.city || 'Unknown';
    if (!groups[city]) groups[city] = [];
    groups[city].push(r);
  });

  // Sort cities by number of restaurants (most first)
  const sortedCities = Object.entries(groups).sort((a, b) => b[1].length - a[1].length);

  // Build one card section per city
  const sections = sortedCities.map(([city, restaurants]) => {
    const total = restaurants.length;

    // Count how many had critical violations
    const critical = restaurants.filter(r =>
      r.inspection_results && r.inspection_results.toLowerCase().includes('critical')
    ).length;
    const criticalPct = total > 0 ? Math.round((critical / total) * 100) : 0;

    // Show up to 5 restaurants as a list
    const items = restaurants.slice(0, 5).map(r => `
      <li class="category-item">
        <strong>${r.name || 'Unknown'}</strong>
        <span class="item-detail">${(r.inspection_results && r.inspection_results !== '------') ? r.inspection_results : 'No result recorded'}</span>
      </li>
    `).join('');

    const moreCount = total > 5
      ? `<li class="category-more">+${total - 5} more establishments</li>`
      : '';

    const violationBadge = critical > 0
      ? `<span class="stat-badge stat-badge-warn">${criticalPct}% critical violations</span>`
      : `<span class="stat-badge stat-badge-good">No critical violations</span>`;

    return `
      <div class="category-section">
        <div class="category-header">
          <h3>${city}</h3>
          <div class="category-stats">
            <span class="stat-badge">${total} restaurant${total !== 1 ? 's' : ''}</span>
            ${violationBadge}
          </div>
        </div>
        <ul class="category-items">
          ${items}
          ${moreCount}
        </ul>
      </div>
    `;
  }).join('');

  return `
    <h2 class="view-title">Category View: By City</h2>
    <p class="view-description">Restaurants grouped by city. Shows top 5 establishments per city with their most recent inspection result.</p>
    <div class="category-grid">
      ${sections}
    </div>
  `;
}

export default showCategories;
