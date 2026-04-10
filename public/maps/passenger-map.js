// Passenger Map (production): uses Xano as source of truth.
// - Shows drivers only when they have published a valid route
// - Lets passengers set presence (isLookingForRide) only with a location
// - Lets passengers request to join a route (ride_request)

/* =====================================================================
   CONSTANTS
===================================================================== */
const CAMPUS_LAT = 33.8654840;
const CAMPUS_LNG = 35.5631210;
const CAMPUS = { lat: CAMPUS_LAT, lng: CAMPUS_LNG };
const LOCATION_SYNC_MS = 15000;

/* =====================================================================
   STATE
===================================================================== */
let map;
let passengerMarker;
let passengerLat = null;
let passengerLng = null;
let tripType = 'to_campus';

let me = null;
let lookingForRide = false;
let driverActiveRoute = null;

let routeMarkers = [];
let routeLine = null;
let routesCache = [];
let selectedRoute = null;

let pollingTimer = null;
let locationSyncTimer = null;

/* =====================================================================
   UI HELPERS
===================================================================== */
function $(id) { return document.getElementById(id); }

function isBlockedByDriverRide() {
  return !!driverActiveRoute;
}

function setStatus(text, type) {
  const dot = $('statusDot');
  const label = $('statusText');
  if (label) label.textContent = text;
  if (dot) {
    dot.classList.remove('ok', 'warn', 'err');
    if (type === 'success') dot.classList.add('ok');
    else if (type === 'error') dot.classList.add('err');
    else dot.classList.add('warn');
  }
}

function escapeHtml(s) {
  return String(s ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
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

function parseXanoDateToMs(v) {
  if (typeof v === 'number' && Number.isFinite(v)) {
    return v > 1e12 ? v : v * 1000;
  }
  if (typeof v === 'string' && /^\d+$/.test(v.trim())) {
    const n = Number(v);
    return n > 1e12 ? n : n * 1000;
  }
  const d = new Date(v);
  const t = d.getTime();
  return Number.isFinite(t) ? t : null;
}

function toFiniteNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function getPersistedPassengerLat(record) {
  return toFiniteNumber(record?.latitude ?? record?.last_known_latitude);
}

function getPersistedPassengerLng(record) {
  return toFiniteNumber(record?.longitude ?? record?.last_known_longitude);
}

/* =====================================================================
   MAP INIT
===================================================================== */
function initMap() {
  map = L.map('map', { zoomControl: false }).setView([CAMPUS_LAT, CAMPUS_LNG], 14);
  L.control.zoom({ position: 'bottomright' }).addTo(map);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>',
    maxZoom: 19,
  }).addTo(map);

  const campusIcon = L.divIcon({
    className: '',
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

  L.marker([CAMPUS_LAT, CAMPUS_LNG], { icon: campusIcon }).addTo(map);

  map.on('click', (e) => {
    if (clickPlaceEnabled) {
      setPassengerLocation(e.latlng.lat, e.latlng.lng, { zoom: true });
      clickPlaceEnabled = false;
      setStatus('Location set.', 'success');
    }
  });
}

function setPassengerLocation(lat, lng, { zoom } = { zoom: false }) {
  passengerLat = lat;
  passengerLng = lng;

  const passengerIcon = L.divIcon({
    className: '',
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

  if (!passengerMarker) passengerMarker = L.marker([lat, lng], { icon: passengerIcon }).addTo(map);
  else passengerMarker.setLatLng([lat, lng]);

  if (zoom) map.setView([lat, lng], 15);

  $('btnFindRide').disabled = false;
  updateVisibilityNote();
}

let clickPlaceEnabled = false;
function enableClick() {
  clickPlaceEnabled = true;
  setStatus('Click on the map to set your location.', 'warn');
}

function locatePassenger() {
  if (!navigator.geolocation) {
    setStatus('Geolocation not supported', 'error');
    return;
  }
  setStatus('Getting your location...', 'warn');
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      setPassengerLocation(pos.coords.latitude, pos.coords.longitude, { zoom: true });
      setStatus('Location set', 'success');
    },
    () => setStatus('Could not get location. Use Place Manually.', 'error'),
    { enableHighAccuracy: true, timeout: 12000 }
  );
}

/* =====================================================================
   ROUTES (XANO)
===================================================================== */
function normalizeRoute(r) {
  const start_lat = Number(r.start_lat);
  const start_lng = Number(r.start_lng);
  const end_lat = Number(r.end_lat);
  const end_lng = Number(r.end_lng);

  const departureMs = parseXanoDateToMs(r.departure_time);
  const isFuture = departureMs ? departureMs > Date.now() : true;
  const seats = Number(r.available_seats ?? 0);

  const geo = r.route_geojson;
  const geoCoords = geo && geo.coordinates && Array.isArray(geo.coordinates) ? geo.coordinates : null;

  return {
    id: r.id,
    user_id: r.user_id,
    trip_type: r.trip_type || null,
    available_seats: seats,
    price_per_seat: r.price_per_seat ?? null,
    departure_time: r.departure_time ?? null,
    start: Number.isFinite(start_lat) && Number.isFinite(start_lng) ? { lat: start_lat, lng: start_lng } : null,
    end: Number.isFinite(end_lat) && Number.isFinite(end_lng) ? { lat: end_lat, lng: end_lng } : null,
    stop_points: Array.isArray(r.stop_points) ? r.stop_points : [],
    route_geojson: geoCoords ? { type: 'LineString', coordinates: geoCoords } : null,
    isFuture,
  };
}

async function fetchRoutes() {
  const rows = await XANO.getRoutes();
  const list = Array.isArray(rows) ? rows : [];

  routesCache = list
    .map(normalizeRoute)
    .filter((r) => r.id && r.start && r.end)
    .filter((r) => (tripType ? r.trip_type === tripType : true))
    .filter((r) => r.isFuture)
    .filter((r) => r.available_seats > 0)
    .filter((r) => me && r.user_id !== me.id); // can't join own ride

  renderRoutes();
  return routesCache;
}

function clearRouteMarkers() {
  routeMarkers.forEach((m) => map.removeLayer(m));
  routeMarkers = [];
}

function renderRoutes() {
  clearRouteMarkers();

  const rowsEl = $('driverRows');
  const emptyEl = $('driverListEmpty');
  const countEl = $('driverNearbyCount');
  if (countEl) countEl.textContent = String(routesCache.length);
  if (rowsEl) rowsEl.innerHTML = '';

  if (!routesCache.length) {
    if (emptyEl) emptyEl.style.display = 'block';
    return;
  }
  if (emptyEl) emptyEl.style.display = 'none';

  const origin = (Number.isFinite(passengerLat) && Number.isFinite(passengerLng)) ? { lat: passengerLat, lng: passengerLng } : null;
  const ranked = routesCache
    .map((r) => ({
      ...r,
      kmAway: origin ? haversineKm(origin, r.start) : null,
    }))
    .sort((a, b) => (a.kmAway ?? 1e9) - (b.kmAway ?? 1e9));

  const driverIcon = L.divIcon({
    className: '',
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
      <circle cx="19" cy="16" r="3.5" fill="#0b69a3"/>
    </svg>`,
    iconSize: [38, 46],
    iconAnchor: [19, 46],
  });

  ranked.slice(0, 50).forEach((r) => {
    const m = L.marker([r.start.lat, r.start.lng], { icon: driverIcon }).addTo(map);
    m.on('click', () => showRouteDetails(r));
    routeMarkers.push(m);

    if (rowsEl) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'driver-row';
      const dist = r.kmAway != null ? `${r.kmAway.toFixed(2)} km away` : 'Distance unknown';
      btn.innerHTML = `
        <div class="driver-row-main">
          <div class="driver-row-name">Driver #${escapeHtml(r.user_id)}</div>
          <div class="driver-row-sub">${escapeHtml(dist)} · Seats: ${escapeHtml(r.available_seats)}</div>
        </div>
        <div class="driver-row-meta">$${escapeHtml(r.price_per_seat ?? '-')}/seat</div>
      `;
      btn.addEventListener('click', () => showRouteDetails(r));
      rowsEl.appendChild(btn);
    }
  });
}

function renderRouteLine(geojson) {
  if (routeLine) {
    map.removeLayer(routeLine);
    routeLine = null;
  }
  const coords = geojson?.coordinates;
  if (!coords || coords.length < 2) return;
  const latlngs = coords.map(([lng, lat]) => [lat, lng]);
  routeLine = L.polyline(latlngs, { color: '#1e9de0', weight: 5, opacity: 0.95 }).addTo(map);
}

function showRouteDetails(r) {
  selectedRoute = r;

  $('panelHeadList').classList.add('hidden');
  $('panelHeadDetails').classList.remove('hidden');
  $('driverListView').classList.add('hidden');
  $('driverDetailsView').classList.remove('hidden');

  $('panelDriverName').textContent = `Driver #${r.user_id}`;
  $('panelDriverPhone').textContent = 'Available after acceptance';
  $('panelDriverPhoneLink').href = '#';
  $('panelDriverCar').textContent = 'Available after acceptance';
  $('panelDriverPlate').textContent = 'Available after acceptance';
  $('panelDriverFit').textContent = '';
  $('panelDriverSeats').textContent = `Seats left: ${r.available_seats}`;
  $('panelPassengerCount').textContent = '0';
  $('panelPickupPosition').textContent = passengerLat && passengerLng ? 'Your pickup is set' : 'Set your location first';
  $('panelJoinNote').textContent = '';

  renderRouteLine(r.route_geojson);
}

function backToDriverList() {
  selectedRoute = null;
  $('panelHeadList').classList.remove('hidden');
  $('panelHeadDetails').classList.add('hidden');
  $('driverListView').classList.remove('hidden');
  $('driverDetailsView').classList.add('hidden');
}

/* =====================================================================
   REQUESTS (XANO)
===================================================================== */
async function requestSelectedDriver() {
  if (isBlockedByDriverRide()) {
    setStatus('You cannot use passenger features while you have an active driver ride.', 'error');
    return;
  }

  if (!selectedRoute) {
    setStatus('Select a driver first', 'error');
    return;
  }
  if (!Number.isFinite(passengerLat) || !Number.isFinite(passengerLng)) {
    setStatus('Set your location first', 'error');
    $('panelJoinNote').textContent = 'You must set your location before requesting a ride.';
    return;
  }

  setStatus('Sending request...', 'warn');
  try {
    const payload = {
      route_id: selectedRoute.id,
      passenger_user_id: me.id,
      driver_user_id: selectedRoute.user_id,
      pickup_lat: passengerLat,
      pickup_lng: passengerLng,
      pickup_location_name: 'Passenger pickup',
    };
    await XANO.createRideRequest(payload);
    await XANO.logEvent('ride_request_created', { route_id: selectedRoute.id, driver_user_id: selectedRoute.user_id });
    $('panelJoinNote').textContent = 'Request sent. Wait for the driver to accept or decline.';
    setStatus('Request sent', 'success');
    await refreshRequestsPanel();
  } catch (err) {
    $('panelJoinNote').textContent = err.message || 'Failed to create request.';
    setStatus(err.message || 'Failed to create request', 'error');
  }
}

async function refreshRequestsPanel() {
  const listEl = $('requestList');
  const countEl = $('requestCount');

  let rows = [];
  try {
    const all = await XANO.getRideRequests();
    const list = Array.isArray(all) ? all : [];
    rows = list
      .filter((r) => Number(r.passenger_user_id) === Number(me.id))
      .sort((a, b) => Number(b.id || 0) - Number(a.id || 0));
  } catch {
    rows = [];
  }

  if (countEl) countEl.textContent = String(rows.length);
  if (!listEl) return;

  listEl.innerHTML = '';
  if (!rows.length) {
    listEl.innerHTML = '<div class="panel-empty">No requests yet.</div>';
    return;
  }

  rows.slice(0, 30).forEach((r) => {
      const status = String(r.status || 'pending').toLowerCase();
      const requestType = String(r.request_type || 'passenger_request').toLowerCase();
      const card = document.createElement('div');
      card.className = 'request-card';
      card.innerHTML = `
        <div class="request-card-title">Route #${escapeHtml(r.route_id)} · ${escapeHtml(status)}</div>
        <div class="request-card-sub">Pickup: ${escapeHtml(r.pickup_location_name || 'selected')}</div>
      `;

      if (status === 'pending' && requestType === 'driver_invite') {
        const accept = document.createElement('button');
        accept.type = 'button';
        accept.className = 'btn btn-primary';
        accept.textContent = 'Accept Invite';
        accept.addEventListener('click', async () => {
          try {
            await XANO.acceptInvite(Number(r.id));
            applyPassengerStatusRecord({ isLookingForRide: false });
            await XANO.logEvent('ride_invite_accepted', { ride_request_id: r.id, route_id: r.route_id });
            setStatus('Invite accepted', 'success');
            await refreshRequestsPanel();
            await fetchRoutes();
          } catch (err) {
            setStatus(err.message || 'Failed to accept invite', 'error');
          }
        });
        card.appendChild(accept);
      }
  
      if (status === 'accepted') {
        const cta = document.createElement('a');
        cta.className = 'btn btn-primary';
        cta.href = 'my-map.html';
        cta.textContent = 'Open My Map';
        card.appendChild(cta);
      }
  
      if (status === 'pending' || status === 'accepted') {
        const cancel = document.createElement('button');
        cancel.type = 'button';
        cancel.className = 'btn btn-outline';
        cancel.textContent = requestType === 'driver_invite' ? 'Reject' : 'Cancel';
        cancel.addEventListener('click', async () => {
          try {
            await XANO.cancelRideRequest(Number(r.id));
            await XANO.logEvent('ride_request_cancelled', { ride_request_id: r.id, route_id: r.route_id });
            setStatus(requestType === 'driver_invite' ? 'Invite rejected' : 'Request cancelled', 'success');
            await refreshRequestsPanel();
          } catch (err) {
            setStatus(err.message || 'Failed to cancel', 'error');
          }
        });
        card.appendChild(cancel);
      }

    listEl.appendChild(card);
  });

  const hasAssignedRide = rows.some((r) => String(r.status || '').toLowerCase() === 'accepted');
  if (hasAssignedRide && lookingForRide) {
    applyPassengerStatusRecord({ isLookingForRide: false });
    setStatus('You are no longer visible because your ride is assigned.', 'success');
  }
}

/* =====================================================================
   PRESENCE (PASSENGERS)
===================================================================== */
function applyPassengerStatusRecord(record, { zoom = false } = {}) {
  const lat = getPersistedPassengerLat(record);
  const lng = getPersistedPassengerLng(record);

  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    setPassengerLocation(lat, lng, { zoom });
  }

  lookingForRide = !!record?.isLookingForRide;
  updateVisibilityNote();

  if (lookingForRide) startLocationSync();
  else stopLocationSync();
}

async function persistPassengerPresence({ isLookingForRide, latitude = passengerLat, longitude = passengerLng, silent = false } = {}) {
  const payload = { isLookingForRide };
  if (Number.isFinite(latitude)) payload.latitude = latitude;
  if (Number.isFinite(longitude)) payload.longitude = longitude;

  const record = await XANO.upsertPassenger(payload);
  applyPassengerStatusRecord(record);

  if (!silent) {
    await XANO.logEvent('passenger_visibility_updated', {
      isLookingForRide: lookingForRide,
      latitude: passengerLat,
      longitude: passengerLng,
    });
  }

  return record;
}

async function syncCurrentLocation({ silent = false } = {}) {
  if (!lookingForRide || !navigator.geolocation) return;

  const position = await new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      resolve,
      reject,
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 10000 }
    );
  });

  const latitude = position.coords?.latitude;
  const longitude = position.coords?.longitude;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error('Unable to determine your location.');
  }

  setPassengerLocation(latitude, longitude, { zoom: false });
  return persistPassengerPresence({ isLookingForRide: true, latitude, longitude, silent });
}

function startLocationSync() {
  stopLocationSync();
  if (!lookingForRide) return;

  locationSyncTimer = window.setInterval(async () => {
    try {
      await syncCurrentLocation({ silent: true });
    } catch (err) {
      setStatus(err.message || 'Location sync will retry automatically.', 'warn');
    }
  }, LOCATION_SYNC_MS);
}

function stopLocationSync() {
  if (locationSyncTimer) {
    window.clearInterval(locationSyncTimer);
    locationSyncTimer = null;
  }
}

async function restorePassengerStatus() {
  let record = null;
  try {
    record = await XANO.getPassengerStatus();
  } catch (err) {
    updateVisibilityNote();
    setStatus(err.message || 'Could not restore your visibility state.', 'warn');
    return;
  }

  applyPassengerStatusRecord(record, { zoom: !!record?.isLookingForRide });

  if (record?.isLookingForRide) {
    setStatus('Looking for Ride restored from your account.', 'success');
    try {
      await syncCurrentLocation({ silent: true });
    } catch (err) {
      setStatus(err.message || 'Visibility restored. Live location will retry shortly.', 'warn');
    }
    return;
  }

  setStatus('Set your location to find nearby drivers', 'warn');
}

function updateVisibilityNote() {
  const label = $('visibilityToggleLabel');
  const note = $('visibilityNote');
  const btn = $('btnVisibilityToggle');

  if (label) label.textContent = lookingForRide ? 'Looking for Ride: ON' : 'Looking for Ride: OFF';
  if (btn) btn.classList.toggle('is-on', lookingForRide);

  if (!lookingForRide) {
    if (note) note.textContent = 'Drivers cannot see you right now. This setting is independent from Find Ride.';
    return;
  }

  if (!Number.isFinite(passengerLat) || !Number.isFinite(passengerLng)) {
    if (note) note.textContent = 'Set your location first, then enable Looking for Ride so drivers can see you.';
  } else {
    if (note) note.textContent = 'Drivers can see you on the driver map.';
  }
}

async function toggleLookingForRide() {
  if (isBlockedByDriverRide()) {
    setStatus('You cannot appear as a passenger while you have an active driver ride.', 'error');
    return;
  }

  const turningOn = !lookingForRide;

  if (turningOn && (!Number.isFinite(passengerLat) || !Number.isFinite(passengerLng))) {
    // Frontend enforcement + small notification.
    lookingForRide = false;
    updateVisibilityNote();
    setStatus('Set your location before enabling Looking for Ride.', 'error');
    return;
  }

  setStatus('Updating visibility...', 'warn');
  try {
    await persistPassengerPresence({
      isLookingForRide: turningOn,
      latitude: turningOn ? passengerLat : undefined,
      longitude: turningOn ? passengerLng : undefined,
    });
    setStatus(lookingForRide ? 'You are visible to drivers' : 'You are hidden from drivers', 'success');
  } catch (err) {
    setStatus(err.message || 'Failed to update visibility', 'error');
  }
}

/* =====================================================================
   CONTROLS
===================================================================== */
function setTripType(next) {
  tripType = next === 'from_campus' ? 'from_campus' : 'to_campus';
  $('tripTypeToClicked')?.classList.toggle('active', tripType === 'to_campus');
  $('tripTypeFromClicked')?.classList.toggle('active', tripType === 'from_campus');
}

async function findRide() {
  if (isBlockedByDriverRide()) {
    setStatus('Passenger ride search is disabled while your driver ride is active.', 'error');
    return;
  }

  if (!Number.isFinite(passengerLat) || !Number.isFinite(passengerLng)) {
    setStatus('Set your location first', 'error');
    return;
  }
  setStatus('Loading available rides...', 'warn');
  try {
    await fetchRoutes();
    await refreshRequestsPanel();
    setStatus('Rides loaded', 'success');
  } catch (err) {
    setStatus(err.message || 'Failed to load rides', 'error');
  }
}

function clearRideTimeFilter() {
  // Placeholder: UI has a filter, but filtering is handled server-side by future/seat rules.
  setStatus('Time filter cleared', 'success');
}

/* =====================================================================
   AUTH + POLLING
===================================================================== */
async function bootstrap() {
  try {
    me = await XANO.getMe();
  } catch {
    setStatus('Please log in first.', 'error');
    window.location.href = '/login';
    return;
  }

  try {
    driverActiveRoute = await XANO.getDriverActiveRoute();
  } catch {
    driverActiveRoute = null;
  }

  if (driverActiveRoute?.id) {
    $('btnFindRide').disabled = true;
    $('btnVisibilityToggle')?.setAttribute('disabled', 'disabled');
    setStatus('Passenger mode is blocked while your active driver ride is running.', 'warn');
    updateVisibilityNote();
    return;
  }

  updateVisibilityNote();
  $('btnFindRide').disabled = true;

  // Best effort: refresh requests panel
  await refreshRequestsPanel();
  await restorePassengerStatus();
}

function startPolling() {
  stopPolling();
  pollingTimer = window.setInterval(async () => {
    try {
      await refreshRequestsPanel();
      await fetchRoutes();
    } catch {
      // ignore
    }
  }, 6000);
}

function stopPolling() {
  if (pollingTimer) {
    window.clearInterval(pollingTimer);
    pollingTimer = null;
  }
  stopLocationSync();
}

/* =====================================================================
   INIT
===================================================================== */
document.addEventListener('DOMContentLoaded', async () => {
  initMap();

  // Collapse listeners
  $('passengerControlsCollapseBtn')?.addEventListener('click', () => document.querySelector('.controls')?.classList.toggle('collapsed'));
  $('requestPanelCollapseBtn')?.addEventListener('click', () => document.querySelector('.request-panel')?.classList.toggle('collapsed'));
  $('driverNearbyCollapseBtn')?.addEventListener('click', () => $('driverNearbyPanel')?.classList.toggle('collapsed'));
  $('driverDetailCollapseBtn')?.addEventListener('click', () => $('driverNearbyPanel')?.classList.toggle('collapsed'));

  await bootstrap();
  startPolling();
});

// Expose functions used by inline onclick handlers.
window.locatePassenger = locatePassenger;
window.enableClick = enableClick;
window.setTripType = setTripType;
window.findRide = findRide;
window.toggleLookingForRide = toggleLookingForRide;
window.backToDriverList = backToDriverList;
window.clearRideTimeFilter = clearRideTimeFilter;
window.requestSelectedDriver = requestSelectedDriver;
