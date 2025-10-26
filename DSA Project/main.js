// ------------------------------
// Config and state
// ------------------------------
const CAMPUS_BOUNDS = { north: 12.846, south: 12.838, east: 80.159, west: 80.146 };

let locations = [];
let gpsAllowed = false;
let useCampusGPS = false;
let currentGPS = null;
let nearestAtGrant = null;
const askedKey = "askedGeolocOnce";
const hasAskedThisSession = () => sessionStorage.getItem(askedKey) === "1";
const markAskedThisSession = () => sessionStorage.setItem(askedKey, "1");

// ------------------------------
// Data load
// ------------------------------
fetch("cordinates.json")
  .then(res => res.json())
  .then(data => (locations = Array.isArray(data) ? data : []))
  .catch(err => console.error("Error loading cordinates.json:", err));

// ------------------------------
// UI references
// ------------------------------
const fromInput = document.getElementById("from");
const toInput = document.getElementById("to");
const findPathBtn = document.getElementById("findPath");
fromInput.addEventListener("focus", () => {
});

// ------------------------------
// Permissions-aware GPS request (only on button click)
// ------------------------------
useGPSBtn.addEventListener("click", async () => {
  if (!("geolocation" in navigator)) {
    alert("Your browser does not support GPS.");
    gpsAllowed = false;
    useCampusGPS = false;
    currentGPS = null;
    nearestAtGrant = null;
    return;
  }

  let state = "prompt";
  if (navigator.permissions && navigator.permissions.query) {
    try {
      const result = await navigator.permissions.query({ name: "geolocation" });
      state = result.state; // 'granted' | 'denied' | 'prompt'
    } catch {
      state = "prompt";
    }
  }

  if (state === "granted") {
    navigator.geolocation.getCurrentPosition(successGPS, errorGPS, { enableHighAccuracy: true, timeout: 20000, maximumAge: 10000 });
  } else if (state === "denied") {
    gpsAllowed = false;
    useCampusGPS = false;
    currentGPS = null;
    nearestAtGrant = null;
    alert("Location permission is blocked. Type your start location or enable location in your browser settings.");
  } else {
    if (hasAskedThisSession()) {
      alert("Type your start location, or enable location in your browser settings to use GPS.");
      return;
    }
    markAskedThisSession();
    navigator.geolocation.getCurrentPosition(successGPS, errorGPS, { enableHighAccuracy: true, timeout: 20000, maximumAge: 10000 });
  }
});

function successGPS(pos) {
  gpsAllowed = true;
  const lat = pos.coords.latitude;
  const lon = pos.coords.longitude;

  const inside =
    lat <= CAMPUS_BOUNDS.north &&
    lat >= CAMPUS_BOUNDS.south &&
    lon <= CAMPUS_BOUNDS.east &&
    lon >= CAMPUS_BOUNDS.west;

  if (!inside) {
    useCampusGPS = false;
    currentGPS = null;
    nearestAtGrant = null;
    alert("You appear to be outside campus. Please type your start location manually.");
    return;
  }

  useCampusGPS = true;
  currentGPS = { lat, lon };
  const nearest = findNearestBuilding(lat, lon, locations);
  nearestAtGrant = nearest || null;
  if (nearest) {
    fromInput.value = nearest.name;
    console.log("Nearest building:", nearest.name);
  } else {
    fromInput.placeholder = "Your location (GPS inside campus)";
  }
}

function errorGPS(err) {
  gpsAllowed = false;
  useCampusGPS = false;
  currentGPS = null;
  nearestAtGrant = null;
  console.warn("GPS error:", err);
  alert("Unable to get your location. Please type your start location.");
}

// ------------------------------
// Card click -> fill To input
// Works for any element with data-location-name or class "destination"
// ------------------------------
document.addEventListener("click", (e) => {
  const card = e.target.closest("[data-location-name], .destination");
  if (!card) return;

  const name = card.dataset && card.dataset.locationName
    ? card.dataset.locationName
    : (card.textContent || "").trim();

  if (!name) return;

  toInput.value = name;

  const match = findByName(locations, name);
  if (!match) console.warn("Clicked location not found in locations list:", name);
});

// ------------------------------
// Always open Google Maps in directions preview (no auto-start)
// ------------------------------
function openInGoogleMapsPreview(fromLoc, toLoc) {
  const origin = `${fromLoc.lat},${fromLoc.lon}`;
  const dest = `${toLoc.lat},${toLoc.lon}`;
  const webUrl =
    `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}` +
    `&destination=${encodeURIComponent(dest)}&travelmode=walking`;

  const ua = navigator.userAgent || "";
  const isAndroid = /Android/i.test(ua);
  const isIOS = /iPhone|iPad|iPod/i.test(ua);

  const tryOpen = (appUrl) => {
    const t = setTimeout(() => { window.location.assign(webUrl); }, 1200);
    window.location.href = appUrl;
  };

  if (isAndroid) {
    const intentUrl =
      `intent://maps.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}` +
      `&destination=${encodeURIComponent(dest)}&travelmode=walking#Intent;scheme=https;package=com.google.android.apps.maps;end`;
    tryOpen(intentUrl);
  } else if (isIOS) {
    const iosUrl =
      `comgooglemaps://?saddr=${encodeURIComponent(origin)}` +
      `&daddr=${encodeURIComponent(dest)}&directionsmode=walking`;
    tryOpen(iosUrl);
  } else {
    window.open(webUrl, "_blank");
  }
}

// ------------------------------
// Find Path click -> resolve origin by rules and open preview
// ------------------------------
findPathBtn.addEventListener("click", () => {
  const from = (fromInput.value || "").trim();
  const to = (toInput.value || "").trim();

  if (!to) {
    alert("Please enter your destination.");
    return;
  }

  const toLoc = findByName(locations, to);
  if (!toLoc || toLoc.lat == null || toLoc.lon == null) {
    alert("Destination not found. Please select a valid place.");
    return;
  }

  let origin = null;

  if (gpsAllowed && useCampusGPS && currentGPS) {
    const nearest = nearestAtGrant || findNearestBuilding(currentGPS.lat, currentGPS.lon, locations);
    if (nearest && nearest.lat != null && nearest.lon != null) {
      origin = { lat: parseFloat(nearest.lat), lon: parseFloat(nearest.lon) };
      fromInput.value = nearest.name;
    } else {
      origin = { lat: currentGPS.lat, lon: currentGPS.lon };
    }
  } else {
    if (!from) {
      alert("Please enter your start location.");
      return;
    }
    const fromLoc = findByName(locations, from);
    if (!fromLoc || fromLoc.lat == null || fromLoc.lon == null) {
      alert("Start location not found. Please select a valid place.");
      return;
    }
    origin = { lat: parseFloat(fromLoc.lat), lon: parseFloat(fromLoc.lon) };
  }

  openInGoogleMapsPreview(origin, { lat: parseFloat(toLoc.lat), lon: parseFloat(toLoc.lon) });
});

// ------------------------------
// Lookup helpers
// ------------------------------
function findByName(list, name) {
  const low = (name || "").toLowerCase();
  return list.find(l => (l.name || "").toLowerCase() === low);
}

function findNearestBuilding(lat, lon, list) {
  let nearest = null, minDist = Infinity;
  for (const loc of list) {
    if (!loc || loc.lat == null || loc.lon == null) continue;
    const d = haversine(lat, lon, parseFloat(loc.lat), parseFloat(loc.lon));
    if (d < minDist) { minDist = d; nearest = loc; }
  }
  return nearest;
}

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const toRad = x => (x * Math.PI) / 180;
  const dφ = toRad(lat2 - lat1), dλ = toRad(lon2 - lon1);
  const φ1 = toRad(lat1), φ2 = toRad(lat2);
  const a = Math.sin(dφ/2)**2 + Math.cos(φ1)*Math.cos(φ2)*Math.sin(dλ/2)**2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
