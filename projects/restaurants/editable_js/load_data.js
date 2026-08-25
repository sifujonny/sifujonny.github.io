// ============================================
// DATA LOADING
// ============================================

async function loadData() {
  try {
    const response = await fetch('./data.json');
    const data = await response.json();
    console.log("data loaded", data);

    // data.json is a GeoJSON FeatureCollection.
    // Extract the features array and flatten each feature into a plain object
    // with all .properties fields plus lat/lng from .geometry.coordinates.
    const restaurants = data.features.map(feature => ({
      ...feature.properties,
      lat: feature.geometry ? feature.geometry.coordinates[1] : null,
      lng: feature.geometry ? feature.geometry.coordinates[0] : null
    }));

    console.log("restaurants array:", restaurants.length, "records");
    return restaurants;
  } catch (error) {
    console.error("Failed to load data:", error);
    throw new Error("Could not load data from API");
  }
}

export default loadData;
