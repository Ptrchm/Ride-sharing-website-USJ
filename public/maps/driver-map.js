// Driver Map (production): uses Xano as source of truth.
// - Shows passengers where isLookingForRide=true
// - Lets verified drivers create/publish routes to Xano
// - Shows incoming ride requests and supports accept/decline

/* =====================================================================
   CONSTANTS
===================================================================== */
const CAMPUS_LAT = 33.8654840;
const CAMPUS_LNG = 35.5631210;
const CAMPUS = { lat: CAMPUS_LAT, lng: CAMPUS_LNG };
const OSRM_BASE = "https://router.project-osrm.org/route/v1/driving";

/* =====================================================================
   STATE
===================================================================== */
let map;
let campusMarker;
let driverMarker;
let driverLat = null;
let driverLng = null;
let tripType = "to_campus"; // to_campus | from_campus

let createRideOpen = false;
let createMode = "automatic"; // automatic | manual
let manualPickMode = null; // null | "driver" | "stop"

let stopPoints = []; // [{lat,lng}]
let stopMarkers = [];

let routeLine = null;
let currentRoutePreview = null; // {coords:[[lat,lng]], geojson, distanceKm, durationMin, start,end, stop_points}
let publishedRoute = null; // Xano route record

let selectedRideCapacity = null;
let selectedRideDate = null; // "YYYY-MM-DD"
let selectedRideTime = null; // "HH:mm"
let selectedRidePrice = null;

let cachedPassengers = [];
let selectedPassenger = null;

let me = null;
let driverDetail = null;
let hasActiveRide = false;

let pollingTimer = null;

/* =====================================================================
   UI HELPERS
===================================================================== */
function $(id) {
  return document.getElementById(id);
}

function setStatus(text, type) {
  const box = $("statusBox");
  const dot = $("statusDot");
  const label = $("statusText");
  if (!box || !dot || !label) return;

  label.textContent = text;
  dot.classList.remove("ok", "warn", "err");
  if (type === "success") dot.classList.add("ok");
  else if (type === "error") dot.classList.add("err");
  else dot.classList.add("warn");
}

function setCreateRideNote(text) {
  const el = $("createRideNote");
  if (el) el.textContent = text;
}

function setPublishEnabled(enabled) {
  const btn = $("btnPublishRide");
  if (btn) btn.disabled = !enabled;
}

function setCreateRideEnabled(enabled) {
  const btn = $("btnCreateRide");
  if (btn) btn.disabled = !enabled;
}

function syncRideControls() {
  const createBtn = $("btnCreateRide");
  const cancelBtn = $("btnCancelActiveRide");
  const banner = $("activeRideBanner");
  const createPanel = $("createRidePanel");

  if (createBtn) createBtn.classList.toggle("hidden", hasActiveRide);
  if (cancelBtn) cancelBtn.classList.toggle("hidden", !hasActiveRide);
  if (banner) banner.classList.toggle("hidden", !hasActiveRide);
  if (createPanel && hasActiveRide) {
    createRideOpen = false;
    createPanel.classList.add("hidden");
  }

  setCreateRideEnabled(!hasActiveRide && Number.isFinite(driverLat) && Number.isFinite(driverLng));
}

function formatTime(value) {
  const v = String(value || "").trim();
  if (!/^\d{2}:\d{2}$/.test(v)) return null;
  return v;
}

function formatDate(value) {
  const v = String(value || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
  return v;
}

function departureTimestampFromDateTime(dateValue, timeValue) {
  const date = formatDate(dateValue);
  const time = formatTime(timeValue);
  if (!date || !time) return null;
  const parsed = new Date(`${date}T${time}:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.getTime();
}

function getTodayDateInputValue() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function isFutureDeparture(dateValue, timeValue) {
  const timestampMs = departureTimestampFromDateTime(dateValue, timeValue);
  if (!timestampMs) return false;
  return timestampMs > Date.now();
}

function formatDateSummary(dateValue) {
  const date = formatDate(dateValue);
  if (!date) return null;
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDepartureSummary(dateValue, timeValue) {
  const timestampMs = departureTimestampFromDateTime(dateValue, timeValue);
  if (!timestampMs) return null;
  const parsed = new Date(timestampMs);
  return parsed.toLocaleString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function todayTimestampFromTime(hhmm) {
  const t = formatTime(hhmm);
  if (!t) return null;
  const [hh, mm] = t.split(":").map((x) => Number.parseInt(x, 10));
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hh, mm, 0, 0);
  // If time already passed today, schedule for tomorrow.
  if (d.getTime() <= Date.now()) d.setDate(d.getDate() + 1);
  return d.toISOString();
}

function haversineKm(a, b) {
  const R = 6371;
  const toRad = (x) => (x * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s1 = Math.sin(dLat / 2);
  const s2 = Math.sin(dLng / 2);
  const aa = s1 * s1 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * s2 * s2;
  return 2 * R * Math.asin(Math.sqrt(aa));
}

/* =====================================================================
   DETOUR MATCHING HELPERS
===================================================================== */

/* Haversine distance between two lat/lng points (for polyline calculations) */
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/* Minimum distance from a point to any node in a polyline (km) */
function distToPolyline(lat, lng, poly) {
  let min = Infinity;
  for (const pt of poly) {
    const d = haversine(lat, lng, pt[0], pt[1]);
    if (d < min) min = d;
  }
  return min;
}

/* Compute detour-based match score */
function computeMatchScore(timeDetourPct, distanceDetourPct) {
  // Weighted formula: 75% weight on time, 25% weight on distance
  return (0.75 * timeDetourPct) + (0.25 * distanceDetourPct);
}

/* =====================================================================
   MAP INIT
===================================================================== */
function initMap() {
  map = L.map("map", { zoomControl: false }).setView([CAMPUS_LAT, CAMPUS_LNG], 14);
  L.control.zoom({ position: "bottomright" }).addTo(map);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; <a href=\"https://openstreetmap.org\">OpenStreetMap</a>",
    maxZoom: 19,
  }).addTo(map);

  const campusIcon = L.divIcon({
    className: "",
    html: `<svg width="34" height="42" viewBox="0 0 34 42">
      <defs>
        <filter id="cs" x="-40%" y="-30%" width="180%" height="160%">
          <feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="rgba(0,43,89,0.4)"/>
        </filter>
      </defs>
      <path d="M17 2C9.55 2 3.5 8.05 3.5 15.5c0 10.5 13.5 24.5 13.5 24.5S30.5 26 30.5 15.5C30.5 8.05 24.45 2 17 2z"
            fill="#002b59" filter="url(#cs)" stroke="#fff" stroke-width="1.2"/>
      <text x="17" y="19" text-anchor="middle" fill="#fff" font-size="9"
            font-family="Inter,system-ui,sans-serif" font-weight="800">USJ</text>
    </svg>`,
    iconSize: [34, 42],
    iconAnchor: [17, 42],
  });

  campusMarker = L.marker([CAMPUS_LAT, CAMPUS_LNG], { icon: campusIcon }).addTo(map);

  map.on("click", (e) => {
    if (manualPickMode === "driver") {
      setDriverLocation(e.latlng.lat, e.latlng.lng, { zoom: true });
      manualPickMode = null;
      setStatus("Driver location set.", "success");
      return;
    }
    if (manualPickMode === "stop") {
      addStopPoint(e.latlng.lat, e.latlng.lng);
      return;
    }
  });
}

function setDriverLocation(lat, lng, { zoom } = { zoom: false }) {
  driverLat = lat;
  driverLng = lng;
  const icon = L.divIcon({
    className: "",
    html: `<svg width="38" height="46" viewBox="0 0 38 46">
      <defs>
        <filter id="ds" x="-40%" y="-30%" width="180%" height="160%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="rgba(0,0,0,0.32)"/>
        </filter>
        <radialGradient id="dg" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stop-color="#1e9de0"/>
          <stop offset="100%" stop-color="#0b69a3"/>
        </radialGradient>
      </defs>
      <path d="M19 2C11.27 2 5 8.27 5 16c0 11.8 14 28 14 28S33 27.8 33 16C33 8.27 26.73 2 19 2z"
            fill="url(#dg)" filter="url(#ds)" stroke="rgba(255,255,255,0.85)" stroke-width="1.4"/>
      <circle cx="19" cy="16" r="6.5" fill="rgba(255,255,255,0.95)"/>
      <path d="M13.5 22.5c0-3.04 2.46-5.5 5.5-5.5s5.5 2.46 5.5 5.5" fill="#0b69a3"/>
    </svg>`,
    iconSize: [38, 46],
    iconAnchor: [19, 46],
  });

  if (!driverMarker) {
    driverMarker = L.marker([lat, lng], { icon }).addTo(map);
  } else {
    driverMarker.setLatLng([lat, lng]);
  }

  if (zoom) map.setView([lat, lng], 15);

  // Unlock actions.
  $("btnFindPassengers").disabled = false;
  syncRideControls();

  // Any location change invalidates preview until rebuilt.
  clearRoutePreview();
}

/* =====================================================================
   PASSENGERS (XANO)
===================================================================== */
async function fetchPassengers() {
  const rows = await XANO.getLookingPassengers();
  const list = Array.isArray(rows) ? rows : [];

  // Normalize
  cachedPassengers = list
    .map((p) => ({
      id: p.id ?? p.user_id ?? null,
      user_id: p.user_id ?? null,
      name: p.name ?? p.fullName ?? "Passenger",
      email: p.email ?? "",
      phone: p.phone ?? p.phone_number ?? p.mobile ?? null,
      pickup_location_name: p.pickup_location_name ?? p.pickup_location ?? null,
      lat: Number(p.latitude ?? p.lat ?? p.last_known_latitude),
      lng: Number(p.longitude ?? p.lng ?? p.last_known_longitude),
    }))
    .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));

  renderPassengerMarkers();
  return cachedPassengers;
}

let passengerMarkers = [];
function clearPassengerMarkers() {
  passengerMarkers.forEach((m) => map.removeLayer(m));
  passengerMarkers = [];
}

function renderPassengerMarkers() {
  clearPassengerMarkers();

  const icon = L.divIcon({
    className: "",
    html: `<svg width="38" height="46" viewBox="0 0 38 46">
      <defs>
        <filter id="ps" x="-40%" y="-30%" width="180%" height="160%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="rgba(0,0,0,0.30)"/>
        </filter>
        <radialGradient id="pg" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stop-color="#f87171"/>
          <stop offset="100%" stop-color="#b91c1c"/>
        </radialGradient>
      </defs>
      <path d="M19 2C11.27 2 5 8.27 5 16c0 11.8 14 28 14 28S33 27.8 33 16C33 8.27 26.73 2 19 2z"
            fill="url(#pg)" filter="url(#ps)" stroke="rgba(255,255,255,0.80)" stroke-width="1.2"/>
      <circle cx="19" cy="14" r="4.5" fill="rgba(255,255,255,0.95)"/>
      <path d="M13.5 22.5c0-3.04 2.46-5.5 5.5-5.5s5.5 2.46 5.5 5.5" fill="rgba(255,255,255,0.95)"/>
    </svg>`,
    iconSize: [38, 46],
    iconAnchor: [19, 46],
  });

  cachedPassengers.forEach((p) => {
    const marker = L.marker([p.lat, p.lng], { icon }).addTo(map);
    marker.on("click", () => showPassengerDetails(p));
    passengerMarkers.push(marker);
  });

  // Update nearby panel count
  const countEl = $("passengerRankCount");
  if (countEl) countEl.textContent = String(cachedPassengers.length);
}

async function rankPassengers() {
  if (!Number.isFinite(driverLat) || !Number.isFinite(driverLng)) return [];

  /* Step 1: Compute baseline route (driver → campus) */
  let baselineRoute = null;
  let baselineDurationMin = 0;
  let baselineDistanceKm = 0;

  try {
    const routes = await osrmRoute([
      { lat: driverLat, lng: driverLng },
      { lat: CAMPUS_LAT, lng: CAMPUS_LNG }
    ]);
    if (routes.length > 0) {
      baselineRoute = routes[0];
      baselineDurationMin = baselineRoute.duration / 60;
      baselineDistanceKm = baselineRoute.distance / 1000;
      console.log(`[Baseline] Driver → Campus: ${baselineDistanceKm.toFixed(1)}km / ${baselineDurationMin.toFixed(1)}min`);
    }
  } catch (err) {
    console.warn("Failed to compute baseline route:", err);
    return [];
  }

  if (!baselineRoute) return [];
  const baselineCoords = baselineRoute.geometry.coordinates.map(c => [c[1], c[0]]);

  /* Step 2: Score each passenger based on detour */
  const scoredPassengers = [];
  const skippedPassengers = [];

  for (const p of cachedPassengers) {
    /* Filter 1: Is passenger within 2km of driver's baseline route? */
    const distFromRoute = distToPolyline(p.lat, p.lng, baselineCoords);
    if (distFromRoute > 2.0) {
      skippedPassengers.push({
        ...p,
        distanceFromRoute: distFromRoute,
        score: 100 // Red color (invalid match)
      });
      continue;
    }

    /* Calculate detour: driver → passenger → campus */
    let timeDetourPct = 0;
    let distanceDetourPct = 0;
    let pickupDurationMin = null;
    let pickupDistanceKm = null;

    try {
      const detourRoutes = await osrmRoute([
        { lat: driverLat, lng: driverLng },
        { lat: p.lat, lng: p.lng },
        { lat: CAMPUS_LAT, lng: CAMPUS_LNG }
      ]);
      if (detourRoutes.length > 0) {
        const detourRoute = detourRoutes[0];
        pickupDurationMin = detourRoute.duration / 60;
        pickupDistanceKm = detourRoute.distance / 1000;

        if (baselineDurationMin > 0) {
          timeDetourPct = Math.max(0, ((pickupDurationMin - baselineDurationMin) / baselineDurationMin) * 100);
        }
        if (baselineDistanceKm > 0) {
          distanceDetourPct = Math.max(0, ((pickupDistanceKm - baselineDistanceKm) / baselineDistanceKm) * 100);
        }

        console.log(`[Detour] ${p.name}: baseline ${baselineDistanceKm.toFixed(1)}km/${baselineDurationMin.toFixed(1)}min → with pickup ${pickupDistanceKm.toFixed(1)}km/${pickupDurationMin.toFixed(1)}min → detour ${timeDetourPct.toFixed(0)}% time / ${distanceDetourPct.toFixed(0)}% distance`);
      }
    } catch (err) {
      console.warn(`Failed to compute detour for ${p.name}:`, err);
      // Continue with zero detour percentages
    }

    const score = computeMatchScore(timeDetourPct, distanceDetourPct);
    scoredPassengers.push({
      ...p,
      kmAway: distFromRoute, // Keep kmAway for backward compatibility
      score,
      timeDetourPct,
      distanceDetourPct,
      pickupDurationMin,
      pickupDistanceKm
    });
  }

  /* Combine and sort: good matches first (score < 25), then bad matches and skipped */
  const goodMatches = scoredPassengers.filter(p => p.score < 25);
  const badMatches = scoredPassengers.filter(p => p.score >= 25);

  goodMatches.sort((a, b) => a.score - b.score);
  badMatches.sort((a, b) => a.score - b.score);

  return [...goodMatches, ...badMatches, ...skippedPassengers];
}

async function renderPassengerRankList() {
  const rowsEl = $("passengerRankRows");
  const emptyEl = $("passengerRankEmpty");
  if (!rowsEl) return;

  const ranked = await rankPassengers();
  rowsEl.innerHTML = "";

  if (ranked.length === 0) {
    if (emptyEl) emptyEl.style.display = "block";
    return;
  }
  if (emptyEl) emptyEl.style.display = "none";

  /* Display only good matches (score < 25) and skipped passengers (red dots) */
  const goodMatches = ranked.filter(p => p.score !== undefined && p.score < 25);
  const badMatches = ranked.filter(p => p.score !== undefined && p.score >= 25);
  const skippedPassengers = ranked.filter(p => p.distanceFromRoute !== undefined);

  /* Render good match rows in main list */
  goodMatches.forEach((p, idx) => {
    const row = document.createElement("button");
    row.type = "button";
    row.className = "rank-row";
    
    /* Color-code badge based on score */
    let badgeColor = "#16a34a"; // green for score < 15
    if (p.score >= 15 && p.score < 25) {
      badgeColor = "#f59e0b"; // orange for 15 <= score < 25
    }
    
    const badgeStyle = `background: ${badgeColor}; color: white; padding: 4px 8px; border-radius: 4px; font-weight: 600; font-size: 12px; min-width: 40px; text-align: center;`;
    
    row.innerHTML = `
      <div class="rank-main">
        <div class="rank-name">${escapeHtml(p.name)}</div>
        <div class="rank-sub">${p.pickupDistanceKm ? `${p.pickupDistanceKm.toFixed(1)} km` : p.kmAway ? `${p.kmAway.toFixed(2)} km away` : 'Distance unknown'}</div>
      </div>
      <div style="display: flex; gap: 8px; align-items: center;">
        <div style="${badgeStyle}">${p.score.toFixed(1)}</div>
        <div class="rank-meta" style="min-width: 60px; text-align: right;">${escapeHtml(p.email || "")}</div>
      </div>
    `;
    row.addEventListener("click", () => showPassengerDetails(p));
    rowsEl.appendChild(row);
  });

  /* Show summary if there are bad matches or skipped passengers */
  if (badMatches.length > 0 || skippedPassengers.length > 0) {
    const summaryRow = document.createElement("div");
    summaryRow.style.padding = "12px 16px";
    summaryRow.style.fontSize = "13px";
    summaryRow.style.color = "#666";
    summaryRow.style.borderTop = "1px solid #e0e0e0";
    summaryRow.innerHTML = `
      ${goodMatches.length} good match${goodMatches.length !== 1 ? 'es' : ''} shown. 
      ${badMatches.length > 0 ? `${badMatches.length} more with high detour (${(badMatches[0].score || 0).toFixed(0)}%+)` : ''}
      ${skippedPassengers.length > 0 ? `${skippedPassengers.length} more too far from your route` : ''}
    `;
    rowsEl.appendChild(summaryRow);
  }
}

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function showPassengerDetails(p) {
  selectedPassenger = p;

  // Switch panel views
  $("panelHeadList").classList.add("hidden");
  $("panelHeadDetails").classList.remove("hidden");
  $("passengerListView").classList.add("hidden");
  $("passengerDetailsView").classList.remove("hidden");

  $("panelPassengerName").textContent = p.name || "Passenger";

  // Phone (try several common field names)
  const phone = p.phone || p.phone_number || p.mobile || p.cell || p.contact || p.telephone || p.phoneNumber || p.email || "";
  const phoneEl = $("panelPassengerPhone");
  const phoneLinkEl = $("panelPassengerPhoneLink");
  const callBtn = $("panelCallBtn");
  if (phoneEl) phoneEl.textContent = phone ? String(phone) : "";
  if (phoneLinkEl) phoneLinkEl.href = phone ? `tel:${String(phone).replace(/\s+/g, '')}` : '#';
  if (callBtn) callBtn.href = phone ? `tel:${String(phone).replace(/\s+/g, '')}` : '#';

  // Pickup / destination info (prefer explicit pickup location)
  $("panelPassengerDestination").textContent = p.pickup_location_name || p.pickup_location || p.email || "";
  
  /* Display detour information if available */
  if (p.score !== undefined) {
    const distText = p.pickupDistanceKm ? `${p.pickupDistanceKm.toFixed(1)} km` : '—';
    const timeText = p.pickupDurationMin ? `~${p.pickupDurationMin.toFixed(0)} min` : '—';
    const scoreColor = p.score < 15 ? '#16a34a' : p.score < 25 ? '#f59e0b' : '#dc2626';
    
    $("panelPassengerFit").textContent = `${distText} · ${timeText} · Score: ${p.score.toFixed(1)}`;
    $("panelPassengerFit").style.color = scoreColor;
    
    if (p.timeDetourPct !== undefined && p.distanceDetourPct !== undefined) {
      const detourText = `Detour: ${p.timeDetourPct.toFixed(0)}% time · ${p.distanceDetourPct.toFixed(0)}% distance`;
      $("panelRequestNote").textContent = detourText;
    }
  } else if (p.distanceFromRoute !== undefined) {
    // Skipped passenger (too far from route)
    $("panelPassengerFit").textContent = `Too far from route: ${p.distanceFromRoute.toFixed(1)} km`;
    $("panelPassengerFit").style.color = '#dc2626';
    $("panelRequestNote").textContent = 'This passenger is too far from your planned route.';
  } else {
    // Fallback (backward compatibility)
    $("panelPassengerFit").textContent = p.kmAway ? `${p.kmAway.toFixed(2)} km away` : '';
  }
}

function backToPassengerList() {
  selectedPassenger = null;
  $("panelHeadList").classList.remove("hidden");
  $("panelHeadDetails").classList.add("hidden");
  $("passengerListView").classList.remove("hidden");
  $("passengerDetailsView").classList.add("hidden");
}

/* =====================================================================
   ROUTING (OSRM)
===================================================================== */
async function osrmRoute(latlngs) {
  const coords = latlngs.map((p) => `${p.lng},${p.lat}`).join(";");
  const url = `${OSRM_BASE}/${coords}?overview=full&geometries=geojson&alternatives=true&steps=false`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Routing failed (HTTP ${res.status})`);
  const data = await res.json();
  if (!data || !Array.isArray(data.routes) || data.routes.length === 0) throw new Error("No route found");
  return data.routes;
}

/* =====================================================================
   ROUTE ORDERING HELPERS
   - calculateRouteDistance(points): returns distance in km for an ordered array of {lat,lng}
   - orderPassengerPickupsNearestFirst(driverStart, passengers): tries all permutations and picks minimal distance
   - updateRouteWithPassengers(routeId, orderedPassengers): persists stop_points and updated route geometry/distance
===================================================================== */

async function calculateRouteDistance(points) {
  // points: [{lat,lng}, ...] - returns distance in km (number)
  if (!Array.isArray(points) || points.length < 2) return 0;
  const routes = await osrmRoute(points);
  if (!routes || routes.length === 0) return Infinity;
  return (routes[0].distance || 0) / 1000;
}

function permuteArray(arr) {
  const results = [];
  function permute(cur, remaining) {
    if (remaining.length === 0) {
      results.push(cur);
      return;
    }
    for (let i = 0; i < remaining.length; i++) {
      const next = remaining[i];
      const rest = remaining.slice(0, i).concat(remaining.slice(i + 1));
      permute(cur.concat([next]), rest);
    }
  }
  permute([], arr);
  return results;
}

// Clean, explicit permutation-based ordering (safe override for earlier definitions)
async function orderPassengerPickupsNearestFirst(driverStart, passengers) {
  if (!Array.isArray(passengers) || passengers.length === 0) return [];
  const perms = permuteArray(passengers);
  let best = null;
  let bestDist = Infinity;
  for (const perm of perms) {
    try {
      const points = [driverStart, ...perm.map(p => ({ lat: p.lat, lng: p.lng })), { lat: CAMPUS_LAT, lng: CAMPUS_LNG }];
      const dist = await calculateRouteDistance(points);
      if (Number.isFinite(dist) && dist < bestDist) {
        bestDist = dist;
        best = perm;
      }
    } catch (err) {
      console.warn('[orderPassengerPickupsNearestFirst] perm failed', err);
    }
  }
  const ordered = (best || passengers).map((p, idx) => ({ ...p, order: idx + 1 }));
  return ordered;
}


async function updateRouteWithPassengers(routeId, orderedPassengers) {
  // Build stop_points structure and recompute route geometry & metrics, then PATCH the route record.
  if (!routeId) return;
  const stop_points = orderedPassengers.map((p, idx) => ({
    lat: p.lat,
    lng: p.lng,
    order_index: idx,
    ride_request_id: p.ride_request_id,
    passenger_user_id: p.passenger_user_id,
    pickup_location_name: p.pickup_location_name || null,
  }));

  // Compose points for routing: driver start -> pickups -> campus/end depending on tripType
  const start = tripType === "to_campus" ? { lat: driverLat, lng: driverLng } : CAMPUS;
  const end = tripType === "to_campus" ? CAMPUS : { lat: driverLat, lng: driverLng };
  const routePoints = [start, ...orderedPassengers.map(p => ({ lat: p.lat, lng: p.lng })), end];

  try {
    const routes = await osrmRoute(routePoints);
    const r = routes && routes[0];
    const payload = {
      stop_points,
      distance_km: r ? Number(((r.distance || 0) / 1000).toFixed(3)) : undefined,
      duration_min: r ? Number(((r.duration || 0) / 60).toFixed(3)) : undefined,
      route_geojson: r ? { type: "LineString", coordinates: r.geometry.coordinates } : undefined,
    };
    await XANO.updateRoute(Number(routeId), payload);
    console.log('[updateRouteWithPassengers] Route updated with pickups', payload);
  } catch (err) {
    console.error('[updateRouteWithPassengers] Failed to update route:', err);
  }
}

function clearRoutePreview() {
  currentRoutePreview = null;
  if (routeLine) {
    map.removeLayer(routeLine);
    routeLine = null;
  }
  setPublishEnabled(false);
}

async function loadDriverActiveRoute() {
  try {
    const route = await XANO.getDriverActiveRoute();
    publishedRoute = route && route.id ? route : null;
    hasActiveRide = !!publishedRoute;
  } catch {
    publishedRoute = null;
    hasActiveRide = false;
  }

  syncRideControls();
  return publishedRoute;
}

function renderRouteLine(geojson) {
  if (routeLine) map.removeLayer(routeLine);
  const coords = geojson?.coordinates;
  if (!coords || coords.length < 2) return;
  const latlngs = coords.map(([lng, lat]) => [lat, lng]);
  routeLine = L.polyline(latlngs, { color: "#1e9de0", weight: 5, opacity: 0.95 }).addTo(map);
}

async function buildAutomaticRouteOptions() {
  const optionsEl = $("autoRouteOptions");
  if (!optionsEl) return;
  optionsEl.innerHTML = "";

  if (!Number.isFinite(driverLat) || !Number.isFinite(driverLng)) {
    optionsEl.innerHTML = `<div class="panel-empty">Set your location first.</div>`;
    return;
  }

  const start = tripType === "to_campus" ? { lat: driverLat, lng: driverLng } : CAMPUS;
  const end = tripType === "to_campus" ? CAMPUS : { lat: driverLat, lng: driverLng };

  setCreateRideNote("Computing route options...");
  try {
    const routes = await osrmRoute([start, end]);
    const top = routes.slice(0, 3);

    top.forEach((r, idx) => {
      const km = (r.distance || 0) / 1000;
      const min = (r.duration || 0) / 60;

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "route-option";
      btn.innerHTML = `<div class="route-option-title">Option ${idx + 1} · ${km.toFixed(1)} km</div><div class="route-option-sub">~${min.toFixed(0)} min</div>`;
      btn.addEventListener("click", () => {
        currentRoutePreview = {
          start,
          end,
          stop_points: stopPoints,
          distanceKm: km,
          durationMin: min,
          geojson: r.geometry,
        };
        renderRouteLine(r.geometry);
        setCreateRideNote("Route selected. Set seats, price, time, then publish.");
        maybeEnablePublish();
      });
      optionsEl.appendChild(btn);
    });

    setCreateRideNote("Choose an automatic route option.");
  } catch (err) {
    console.error(err);
    setCreateRideNote("Failed to compute routes. Try again.");
    setStatus(err.message || "Routing failed", "error");
  }
}

async function rebuildManualRoute() {
  if (!Number.isFinite(driverLat) || !Number.isFinite(driverLng)) return;

  const start = tripType === "to_campus" ? { lat: driverLat, lng: driverLng } : CAMPUS;
  const end = tripType === "to_campus" ? CAMPUS : { lat: driverLat, lng: driverLng };

  const points = [start, ...stopPoints, end];
  if (points.length < 2) return;

  setCreateRideNote("Recalculating manual route...");
  try {
    const routes = await osrmRoute(points);
    const r = routes[0];
    const km = (r.distance || 0) / 1000;
    const min = (r.duration || 0) / 60;

    currentRoutePreview = {
      start,
      end,
      stop_points: stopPoints,
      distanceKm: km,
      durationMin: min,
      geojson: r.geometry,
    };
    renderRouteLine(r.geometry);
    setCreateRideNote("Manual route ready. Set seats, price, time, then publish.");
    maybeEnablePublish();
  } catch (err) {
    console.error(err);
    setCreateRideNote("Failed to compute manual route.");
    setStatus(err.message || "Routing failed", "error");
  }
}

function addStopPoint(lat, lng) {
  stopPoints.push({ lat, lng });
  const m = L.circleMarker([lat, lng], { radius: 7, color: "#0b69a3", weight: 2, fillColor: "#1e9de0", fillOpacity: 0.9 }).addTo(map);
  stopMarkers.push(m);
  rebuildManualRoute();
}

function clearManualRoutePoints() {
  stopPoints = [];
  stopMarkers.forEach((m) => map.removeLayer(m));
  stopMarkers = [];
  clearRoutePreview();
  setCreateRideNote("Stops cleared. Rebuild your manual route.");
}

/* =====================================================================
   REQUESTS (XANO)
===================================================================== */
async function fetchIncomingRequests() {
  if (!publishedRoute?.id) {
    updateRideStats([]);
    renderJoinRequests([]);
    return;
  }

  const all = await XANO.getRideRequests();
  const list = Array.isArray(all) ? all : [];

  const mine = list
    .filter((r) => Number(r.route_id) === Number(publishedRoute.id))
    .sort((a, b) => Number(b.id || 0) - Number(a.id || 0));

  updateRideStats(mine);
  renderJoinRequests(mine);
}

function updateRideStats(requests) {
  const note = $("startRideNote");
  if (!note) return;

  const seatsLeft = Number(publishedRoute?.available_seats ?? selectedRideCapacity ?? 0);
  const acceptedCount = Array.isArray(requests)
    ? requests.filter((req) => String(req.status || "").toLowerCase() === "accepted").length
    : 0;
  const capacity = acceptedCount + Math.max(seatsLeft, 0);

  note.textContent = `Passengers: ${acceptedCount} / ${capacity} · Seats left: ${Math.max(seatsLeft, 0)}`;
}

function renderJoinRequests(requests) {
  const listEl = $("joinRequestList");
  const countEl = $("joinRequestCount");
  if (countEl) countEl.textContent = String(requests.length);
  if (!listEl) return;

  listEl.innerHTML = "";
  if (requests.length === 0) {
    listEl.innerHTML = `<p class="panel-empty">No join requests yet.</p>`;
    return;
  }

  requests.slice(0, 30).forEach((req) => {
    const status = String(req.status || "pending").toLowerCase();
    const row = document.createElement("div");
    row.className = "request-row";

    const title = document.createElement("div");
    title.className = "request-title";
    title.textContent = `Passenger #${req.passenger_user_id} · ${status}`;

    const sub = document.createElement("div");
    sub.className = "request-sub";
    sub.textContent = req.pickup_location_name || "Pickup selected";

    const actions = document.createElement("div");
    actions.className = "request-actions";

    const acceptBtn = document.createElement("button");
    acceptBtn.type = "button";
    acceptBtn.className = "btn btn-primary";
    acceptBtn.textContent = "Accept";
    acceptBtn.disabled = status !== "pending";
    acceptBtn.addEventListener("click", async () => {
      try {
        await XANO.acceptRideRequest(Number(req.id));
        await XANO.logEvent("ride_request_accepted", { ride_request_id: req.id, route_id: req.route_id });
        setStatus("Request accepted", "success");

        // After accepting, recompute optimal pickup order and update the published route with ordered pickups.
        try {
          // Fetch the latest requests for this route to get current accepted passengers.
          const all = await XANO.getRideRequests();
          const list = Array.isArray(all) ? all : [];
          const acceptedRequests = list
            .filter((x) => Number(x.route_id) === Number(publishedRoute?.id))
            .filter((x) => String(x.status || "").toLowerCase() === "accepted");

          // Build array of pickups with coordinates
          const pickups = acceptedRequests
            .map((x) => ({
              ride_request_id: x.id,
              passenger_user_id: x.passenger_user_id,
              lat: Number(x.pickup_lat),
              lng: Number(x.pickup_lng),
              pickup_location_name: x.pickup_location_name,
            }))
            .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));

          const driverStart = tripType === "to_campus" ? { lat: driverLat, lng: driverLng } : CAMPUS;

          if (pickups.length > 0) {
            const ordered = await orderPassengerPickupsNearestFirst(driverStart, pickups);
            await updateRouteWithPassengers(Number(publishedRoute.id), ordered);
            // Refresh route after update so UI shows new ordering
            await refreshPublishedRoute();
          }
        } catch (err2) {
          console.warn('Failed to recompute route after accept:', err2);
        }

        await fetchIncomingRequests();
      } catch (err) {
        setStatus(err.message || "Failed to accept", "error");
      }
    });

    const declineBtn = document.createElement("button");
    declineBtn.type = "button";
    declineBtn.className = "btn btn-outline";
    declineBtn.textContent = "Decline";
    declineBtn.disabled = status !== "pending";
    declineBtn.addEventListener("click", async () => {
      try {
        await XANO.declineRideRequest(Number(req.id));
        await XANO.logEvent("ride_request_declined", { ride_request_id: req.id, route_id: req.route_id });
        setStatus("Request declined", "success");
        await fetchIncomingRequests();
      } catch (err) {
        setStatus(err.message || "Failed to decline", "error");
      }
    });

    actions.appendChild(acceptBtn);
    actions.appendChild(declineBtn);

    row.appendChild(title);
    row.appendChild(sub);
    row.appendChild(actions);
    listEl.appendChild(row);
  });
}

/* =====================================================================
   PUBLISHING
===================================================================== */
function maybeEnablePublish() {
  const ok =
    !!currentRoutePreview &&
    Number.isInteger(selectedRideCapacity) &&
    selectedRideCapacity > 0 &&
    typeof selectedRideDate === "string" &&
    !!formatDate(selectedRideDate) &&
    typeof selectedRideTime === "string" &&
    isFutureDeparture(selectedRideDate, selectedRideTime) &&
    typeof selectedRidePrice === "number" &&
    selectedRidePrice > 0;

  setPublishEnabled(ok);
}

function setRideDate(value) {
  selectedRideDate = formatDate(value);
  $("rideDateSummary").textContent = selectedRideDate
    ? `Departure date set to ${formatDateSummary(selectedRideDate)}.`
    : "Your ride date is not set yet. Choose a departure date.";
  maybeEnablePublish();
}

function setRideTime(value) {
  selectedRideTime = formatTime(value);
  if (selectedRideDate && selectedRideTime && isFutureDeparture(selectedRideDate, selectedRideTime)) {
    $("rideTimeSummary").textContent = `Departure set for ${formatDepartureSummary(selectedRideDate, selectedRideTime)}.`;
  } else if (selectedRideTime) {
    $("rideTimeSummary").textContent = "Choose a future departure time.";
  } else {
    $("rideTimeSummary").textContent = "Your ride time is not set yet. Choose a departure time.";
  }
  maybeEnablePublish();
}

function setRideCapacity(value) {
  const parsed = Number.parseInt(String(value || "").trim(), 10);
  selectedRideCapacity = Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  $("rideCapacitySummary").textContent = selectedRideCapacity
    ? `Capacity set to ${selectedRideCapacity} seat${selectedRideCapacity !== 1 ? "s" : ""}.`
    : "Capacity is required and must be greater than 0.";
  maybeEnablePublish();
}

function setRidePrice(value) {
  const parsed = Number.parseFloat(String(value || "").trim());
  selectedRidePrice = Number.isFinite(parsed) ? parsed : null;
  $("ridePriceSummary").textContent = selectedRidePrice && selectedRidePrice > 0
    ? `Price set to ${selectedRidePrice.toFixed(2)}.`
    : "Price is required and must be greater than 0.";
  maybeEnablePublish();
}

async function publishRide() {
  if (hasActiveRide) {
    setStatus("You already have an active ride. Cancel it before creating another one.", "error");
    return;
  }

  if (!currentRoutePreview) {
    setStatus("Create a valid route first", "error");
    return;
  }
  if (!Number.isInteger(selectedRideCapacity) || selectedRideCapacity <= 0) {
    setStatus("Enter a valid capacity", "error");
    return;
  }
  if (!(typeof selectedRidePrice === "number") || selectedRidePrice <= 0) {
    setStatus("Enter a valid price", "error");
    return;
  }
  const departure_time = departureTimestampFromDateTime(selectedRideDate, selectedRideTime);
  if (!departure_time) {
    setStatus("Select a valid departure date and time", "error");
    return;
  }
  if (departure_time <= Date.now()) {
    setStatus("Departure must be in the future", "error");
    return;
  }

  const payload = {
    departure_location_name: tripType === "to_campus" ? "Driver Location" : "USJ Campus",
    arrival_location_name: tripType === "to_campus" ? "USJ Campus" : "Destination",
    departure_time,
    available_seats: selectedRideCapacity,
    price_per_seat: selectedRidePrice,
    trip_type: tripType,
    start_lat: currentRoutePreview.start.lat,
    start_lng: currentRoutePreview.start.lng,
    end_lat: currentRoutePreview.end.lat,
    end_lng: currentRoutePreview.end.lng,
    stop_points: currentRoutePreview.stop_points.map((stop, index) => ({
      lat: stop.lat,
      lng: stop.lng,
      order_index: index,
    })),
    distance_km: Number(currentRoutePreview.distanceKm.toFixed(3)),
    duration_min: Number(currentRoutePreview.durationMin.toFixed(3)),
    route_geojson: { type: "LineString", coordinates: currentRoutePreview.geojson.coordinates },
    created_via: "map_v2",
  };

  setStatus("Publishing ride...", "warn");
  try {
    const created = await XANO.createRoute(payload);
    publishedRoute = created;
    hasActiveRide = true;
    await XANO.logEvent("route_created", { route_id: created.id, trip_type: tripType });
    setStatus("Ride published", "success");
    setCreateRideNote("Ride published and visible to passengers.");
    updateRideStats([]);
    syncRideControls();

    // Start polling incoming requests
    await fetchIncomingRequests();
  } catch (err) {
    console.error(err);
    setStatus(err.message || "Failed to publish", "error");
  }
}

async function refreshPublishedRoute() {
  if (!publishedRoute?.id) return;
  try {
    const r = await XANO.getRoute(Number(publishedRoute.id));
    if (r && r.id) {
      publishedRoute = r;
      hasActiveRide = !!r.isActive;
      syncRideControls();
    }
    updateRideStats();

    const seatsLeft = Number(publishedRoute.available_seats ?? 0);

    if (seatsLeft <= 0) {
      setStatus("Ride is full (no seats left)", "warn");
    }
  } catch {
    // ignore
  }
}

async function cancelActiveRoute() {
  if (!publishedRoute?.id) {
    setStatus("No active ride to cancel.", "warn");
    return;
  }

  setStatus("Cancelling active ride...", "warn");
  try {
    await XANO.cancelRoute(Number(publishedRoute.id));
    await XANO.logEvent("route_cancelled", { route_id: publishedRoute.id });
    publishedRoute = null;
    hasActiveRide = false;
    clearRoutePreview();
    updateRideStats([]);
    syncRideControls();
    await fetchIncomingRequests();
    setCreateRideNote("Your active ride was cancelled.");
    setStatus("Ride cancelled. You can create a new ride now.", "success");
  } catch (err) {
    setStatus(err.message || "Failed to cancel ride", "error");
  }
}

/* =====================================================================
   UI: CONTROL PANEL TOGGLES
===================================================================== */
function toggleCreateRidePanel() {
  if (hasActiveRide) {
    setStatus("Cancel your active ride before creating a new one.", "warn");
    return;
  }

  const panel = $("createRidePanel");
  if (!panel) return;
  createRideOpen = !createRideOpen;
  panel.classList.toggle("hidden", !createRideOpen);

  if (createRideOpen) {
    setStatus("Create Ride opened. Choose automatic or manual route.", "warn");
    if (createMode === "automatic") buildAutomaticRouteOptions();
    else rebuildManualRoute();
  }
}

function setCreateMode(mode) {
  createMode = mode === "manual" ? "manual" : "automatic";
  $("createModeAutoBtn")?.classList.toggle("active", createMode === "automatic");
  $("createModeManualBtn")?.classList.toggle("active", createMode === "manual");
  $("autoRouteBuilder")?.classList.toggle("hidden", createMode !== "automatic");
  $("manualRouteBuilder")?.classList.toggle("hidden", createMode !== "manual");

  clearRoutePreview();
  if (createMode === "automatic") buildAutomaticRouteOptions();
  else rebuildManualRoute();
}

function setTripType(next) {
  tripType = next === "from_campus" ? "from_campus" : "to_campus";
  $("tripTypeToClicked")?.classList.toggle("active", tripType === "to_campus");
  $("tripTypeFromClicked")?.classList.toggle("active", tripType === "from_campus");

  const note = $("tripTypeNote");
  if (note) {
    note.textContent = tripType === "to_campus"
      ? "Pick up passengers from various locations heading TO campus."
      : "Pick up passengers at campus and drop them off at different destinations.";
  }

  // Trip type change invalidates route.
  clearManualRoutePoints();
  clearRoutePreview();
  if (createRideOpen) {
    if (createMode === "automatic") buildAutomaticRouteOptions();
    else rebuildManualRoute();
  }
}

function locateDriver() {
  if (!navigator.geolocation) {
    setStatus("Geolocation not supported", "error");
    return;
  }
  setStatus("Getting your location...", "warn");
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      setDriverLocation(pos.coords.latitude, pos.coords.longitude, { zoom: true });
      setStatus("Location set", "success");
    },
    () => {
      setStatus("Could not get location. Use Place Manually.", "error");
    },
    { enableHighAccuracy: true, timeout: 12000 }
  );
}

function enableClick() {
  manualPickMode = "driver";
  setStatus("Click on the map to set your location.", "warn");
}

function enableManualPointPick(kind) {
  if (kind !== "stop") return;
  manualPickMode = "stop";
  setStatus("Click on the map to add a stop.", "warn");
}

async function findPassengers() {
  if (!Number.isFinite(driverLat) || !Number.isFinite(driverLng)) {
    setStatus("Set your location first", "error");
    return;
  }
  setStatus("Fetching passengers...", "warn");
  try {
    await fetchPassengers();
    await renderPassengerRankList();
    setStatus("Passengers loaded", "success");
  } catch (err) {
    setStatus(err.message || "Failed to load passengers", "error");
  }
}

async function requestSelectedPassenger() {
  if (!publishedRoute?.id) {
    setStatus("Publish a ride first before inviting passengers.", "error");
    return;
  }
  if (!selectedPassenger) {
    setStatus("Select a passenger first.", "error");
    return;
  }
  const passengerUserId = Number(selectedPassenger.user_id);
  if (!Number.isFinite(passengerUserId) || passengerUserId <= 0) {
    setStatus("Passenger user id is missing. Passenger must be logged in and visible.", "error");
    return;
  }
  if (me && passengerUserId === Number(me.id)) {
    setStatus("You cannot invite yourself.", "error");
    return;
  }

  setStatus("Sending invite...", "warn");
  try {
    await XANO.invitePassenger({
      route_id: Number(publishedRoute.id),
      passenger_user_id: passengerUserId,
      pickup_lat: Number.isFinite(selectedPassenger.lat) ? selectedPassenger.lat : undefined,
      pickup_lng: Number.isFinite(selectedPassenger.lng) ? selectedPassenger.lng : undefined,
      pickup_location_name: "Pickup at passenger location",
    });
    await XANO.logEvent("ride_invite_created", { route_id: publishedRoute.id, passenger_user_id: passengerUserId });
    setStatus("Invite sent. Passenger can accept from their Requests panel.", "success");
    const note = $("panelRequestNote");
    if (note) note.textContent = "Invite sent. Waiting for passenger response.";
  } catch (err) {
    setStatus(err?.message || "Failed to send invite", "error");
  }
}

/* =====================================================================
   AUTH BOOTSTRAP
===================================================================== */
async function bootstrap() {
  try {
    me = await XANO.getMe();
  } catch {
    setStatus("Please log in first.", "error");
    window.location.href = "/login";
    return;
  }

  try {
    const verify = await XANO.verifyDriver();
    if (!verify?.is_driver) {
      setStatus("Driver verification required before creating a ride.", "error");
      window.location.href = "/create-ride-form";
      return;
    }
    driverDetail = verify?.driver_detail || null;
  } catch {
    // If verifydriver missing, rely on RequireDriver route guard in React.
    driverDetail = null;
  }

  await loadDriverActiveRoute();
  if (publishedRoute?.id) {
    await fetchIncomingRequests();
    await refreshPublishedRoute();
  }

  if (publishedRoute?.id) {
    setStatus("Your active ride was restored from the backend.", "success");
  } else {
    setStatus("Set your location to find nearby passengers", "warn");
  }
}

function startPolling() {
  stopPolling();
  pollingTimer = window.setInterval(async () => {
    try {
      await fetchIncomingRequests();
      await refreshPublishedRoute();
    } catch {
      // ignore
    }
  }, 5000);
}

function stopPolling() {
  if (pollingTimer) {
    window.clearInterval(pollingTimer);
    pollingTimer = null;
  }
}

/* =====================================================================
   INIT
===================================================================== */
document.addEventListener("DOMContentLoaded", async () => {
  initMap();

  const rideDepartureDateInput = $("rideDepartureDate");
  if (rideDepartureDateInput) {
    const today = getTodayDateInputValue();
    rideDepartureDateInput.min = today;
    rideDepartureDateInput.value = today;
    setRideDate(today);
  }

  // Panel collapse listeners (keep existing UI behavior)
  $("driverControlsCollapseBtn")?.addEventListener("click", () => document.querySelector(".controls")?.classList.toggle("collapsed"));
  $("passengerRankCollapseBtn")?.addEventListener("click", () => $("passengerRankPanel")?.classList.toggle("collapsed"));
  $("passengerDetailCollapseBtn")?.addEventListener("click", () => $("passengerRankPanel")?.classList.toggle("collapsed"));
  $("requestInboxCollapseBtn")?.addEventListener("click", () => $("requestInbox")?.classList.toggle("collapsed"));

  await bootstrap();
  startPolling();
});

// Expose functions used by inline onclick handlers.
window.locateDriver = locateDriver;
window.enableClick = enableClick;
window.setTripType = setTripType;
window.findPassengers = findPassengers;
window.toggleCreateRidePanel = toggleCreateRidePanel;
window.setCreateMode = setCreateMode;
window.enableManualPointPick = enableManualPointPick;
window.clearManualRoutePoints = clearManualRoutePoints;
window.publishRide = publishRide;
window.cancelActiveRoute = cancelActiveRoute;
window.setRideCapacity = setRideCapacity;
window.setRideDate = setRideDate;
window.setRideTime = setRideTime;
window.setRidePrice = setRidePrice;
window.backToPassengerList = backToPassengerList;
window.requestSelectedPassenger = requestSelectedPassenger;
