/**
 * EXTERNAL LIBRARY VIEW
 * Uses Leaflet.js to render an interactive map of all inspected restaurants.
 * Circle markers are color-coded by inspection result.
 * A city filter dropdown lets users focus on one area at a time.
 */
function showExternal(data) {

  // Color a marker based on the inspection result string
  function markerColor(result) {
    if (!result || result === '------') return 'gray';
    if (result.toLowerCase().includes('critical')) return '#c0392b';  // red
    if (result.toLowerCase().includes('reopen')) return '#f39c12';    // amber
    return '#1a6b3c';                                                  // green
  }

  // Add circle markers to the map for a subset of data
  function addMarkers(map, subset) {
    subset.forEach(r => {
      if (!r.lat || !r.lng) return;
      const circle = L.circleMarker([r.lat, r.lng], {
        radius: 6,
        fillColor: markerColor(r.inspection_results),
        color: '#fff',
        weight: 1,
        opacity: 1,
        fillOpacity: 0.85
      });
      circle.bindPopup(`
        <strong>${r.name || 'Unknown'}</strong><br>
        ${r.address_line_1 && r.address_line_1 !== '------' ? r.address_line_1 + ', ' : ''}${r.city || ''}<br>
        <em>Result: ${(r.inspection_results && r.inspection_results !== '------') ? r.inspection_results : 'No result'}</em><br>
        Owner: ${(r.owner && r.owner !== '------') ? r.owner : 'N/A'}
      `);
      circle.addTo(map);
    });
  }

  // Schedule map initialization after the DOM has rendered the map div
  setTimeout(() => {
    const mapEl = document.getElementById('restaurant-map');
    if (!mapEl || mapEl._leaflet_id) return; // prevent double-init

    const map = L.map('restaurant-map').setView([38.99, -76.88], 10);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Draw all markers on load
    addMarkers(map, data);

    // City filter: remove old markers, redraw filtered set
    document.getElementById('city-filter').addEventListener('change', function () {
      map.eachLayer(layer => {
        if (layer instanceof L.CircleMarker) map.removeLayer(layer);
      });
      const selected = this.value;
      const filtered = selected === 'all' ? data : data.filter(r => r.city === selected);
      addMarkers(map, filtered);
    });
  }, 100);

  // Build city options for the filter dropdown
  const cities = [...new Set(data.map(r => r.city).filter(Boolean))].sort();
  const cityOptions = cities.map(c => `<option value="${c}">${c}</option>`).join('');

  return `
    <h2 class="view-title">Map View: Restaurant Inspections</h2>
    <p class="view-description">
      Interactive map of all ${data.length} inspected restaurants in Maryland.
      Marker color = inspection result. Click any dot for details.
    </p>
    <div class="map-controls">
      <label for="city-filter"><strong>Filter by City:</strong></label>
      <select id="city-filter">
        <option value="all">All Cities</option>
        ${cityOptions}
      </select>
      <span class="legend">
        <span class="dot" style="background:#1a6b3c;"></span> Pass &nbsp;
        <span class="dot" style="background:#c0392b;"></span> Critical &nbsp;
        <span class="dot" style="background:#f39c12;"></span> Reopened &nbsp;
        <span class="dot" style="background:gray;"></span> No Result
      </span>
    </div>
    <div id="restaurant-map" style="height: 520px; width: 100%; border-radius: 8px; margin-top: 1rem;"></div>
  `;
}

export default showExternal;
