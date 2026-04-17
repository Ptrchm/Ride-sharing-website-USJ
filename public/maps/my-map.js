// My Map (production): displays the current ride using the route table as source of truth.

const CAMPUS_LAT = 33.8654840;
const CAMPUS_LNG = 35.5631210;
const CAMPUS = { lat: CAMPUS_LAT, lng: CAMPUS_LNG };
const OSRM_BASE = 'https://router.project-osrm.org/route/v1/driving';

let map;
let routeLine = null;
let me = null;
let activeAcceptedRide = null;
let activeRoute = null;
let role = null; // 'driver' | 'passenger'
let pollingTimer = null;
let activeRide = null;
let isDriver = false;
let isPassenger = false;
let driverMarker = null;
let passengerMarkers = {};
let campusMarker = null;

function $(id) { return document.getElementById(id); }

function parseXanoDate(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return new Date(value > 1e12 ? value : value * 1000);
  }
  if (typeof value === 'string' && /^\d+$/.test(value.trim())) {
    const numeric = Number(value);
    return new Date(numeric > 1e12 ? numeric : numeric * 1000);
  }
  return new Date(value);
}

function firstPresent(...values) {
  for (const value of values) {
    if (value !== null && value !== undefined && value !== '') return value;
  }
  return null;
}

function formatCoordLabel(lat, lng) {
  const a = Number(lat);
  const b = Number(lng);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return '—';
  return `${a.toFixed(5)}, ${b.toFixed(5)}`;
}

function normalizeRoute(route) {
  if (!route) return null;

  return {
    ...route,
    departure_name: firstPresent(route.departure_name, route.departure_location_name),
    destination_name: firstPresent(route.destination_name, route.arrival_location_name),
    departure_lat: firstPresent(route.departure_lat, route.start_lat),
    departure_lng: firstPresent(route.departure_lng, route.start_lng),
    destination_lat: firstPresent(route.destination_lat, route.end_lat),
    destination_lng: firstPresent(route.destination_lng, route.end_lng),
    total_seats: firstPresent(route.total_seats, route.available_seats),
    distance: firstPresent(route.distance, route.distance_km),
  };
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

/* Recalculate route when passenger is added (OSRM-based detour calculation) */
function recalculateRouteWithPickup(driverStart, passengerPickup, callback) {
  // Calculate route: driver start -> passenger pickup -> campus
  const url = `${OSRM_BASE}/${driverStart.lng},${driverStart.lat};${passengerPickup.lng},${passengerPickup.lat};${CAMPUS_LNG},${CAMPUS_LAT}?overview=full&geometries=geojson`;
  
  console.log('[RECALC_ROUTE] Fetching URL:', url);
  
  fetch(url)
    .then(res => {
      console.log('[RECALC_ROUTE] Response status:', res.status);
      return res.json();
    })
    .then(data => {
      console.log('[RECALC_ROUTE] Response data:', data);
      if (data.code !== 'Ok') {
        console.error('[RECALC_ROUTE] OSRM error:', data.code, data.message);
        if (callback) callback();
        return;
      }
      
      const geometry = data.routes[0].geometry;
      const coords = geometry.coordinates.map(c => [c[1], c[0]]); // Convert [lng,lat] to [lat,lng]
      
      const distance = data.routes[0].distance / 1000; // meters to km
      const duration = data.routes[0].duration / 60; // seconds to minutes
      
      console.log('[RECALC_ROUTE] Route calculated - distance:', distance, 'km, duration:', duration, 'min, coords:', coords.length);
      
      // Update activeRoute with new coordinates
      if (activeRoute) {
        activeRoute.coords = coords;
        activeRoute.distanceKm = distance;
        activeRoute.durationMin = duration;
        console.log('[RECALC_ROUTE] Updated activeRoute:', activeRoute);
      }
      
      if (callback) callback();
    })
    .catch(err => {
      console.error('[RECALC_ROUTE] Fetch error:', err);
      if (callback) callback();
    });
}

function initMap() {
  map = L.map('map', { zoomControl: false }).setView([CAMPUS_LAT, CAMPUS_LNG], 13);
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
}

function renderRouteLine(routeGeojson) {
  if (routeLine) {
    map.removeLayer(routeLine);
    routeLine = null;
  }

  const coords = routeGeojson?.coordinates;
  if (!coords || coords.length < 2) return;

  const latlngs = coords.map(([lng, lat]) => [lat, lng]);
  routeLine = L.polyline(latlngs, { color: '#1e9de0', weight: 5, opacity: 0.95 }).addTo(map);
  map.fitBounds(routeLine.getBounds(), { padding: [40, 40] });
}

function setRolePill(text) {
  const pill = $('rolePill');
  if (pill) pill.textContent = text;
}

function setPanelValue(id, val) {
  const el = $(id);
  if (el) el.textContent = val;
}

function showDriverCard(show) {
  const card = $('driverCard');
  if (card) card.style.display = show ? 'flex' : 'none';
}

function setStartButtons() {
  $('btnStartRide').style.display = role === 'driver' ? 'inline-flex' : 'none';
  $('btnConfirmPickup').style.display = 'none';
  $('btnEndRide').style.display = 'none';
}

async function loadDriverRoute() {
  try {
    const route = await XANO.getRouteByDriver(Number(me.id));
    activeRoute = normalizeRoute(route);
    console.log('[My Map] getRouteByDriver response:', activeRoute);
  } catch (err) {
    console.log('[My Map] getRouteByDriver failed:', err);
    activeRoute = null;
  }
}

async function loadPassengerRoute() {
  const accepted = await XANO.getAcceptedRides();
  const list = Array.isArray(accepted) ? accepted : [];

  const mine = list
    .filter((r) => String(r.status || '').toLowerCase() === 'confirmed')
    .filter((r) => Number(r.passenger_user_id) === Number(me.id))
    .sort((a, b) => Number(b.id || 0) - Number(a.id || 0));

  activeAcceptedRide = mine[0] || null;
  if (!activeAcceptedRide) {
    activeRoute = null;
    return;
  }

  try {
    activeRoute = normalizeRoute(await XANO.getRoute(Number(activeAcceptedRide.route_id)));
    console.log('[My Map] passenger route response:', activeRoute);
  } catch (err) {
    console.log('[My Map] passenger route fetch failed:', err);
    activeRoute = null;
  }
}

async function loadActiveRide() {
  activeAcceptedRide = null;
  role = null;
  await loadDriverRoute();

  if (activeRoute?.id) {
    role = 'driver';
    renderActiveRide();
    return;
  }

  await loadPassengerRoute();
  if (activeRoute?.id) {
    role = 'passenger';
    renderActiveRide();
    return;
  }

  renderNoRide();
}

function clearPanelForNoRide() {
  setPanelValue('rideTypeValue', '—');
  setPanelValue('passengerCount', '0');
  setPanelValue('capacityValue', '—');
  setPanelValue('departureValue', '—');
  setPanelValue('destinationValue', '—');
  setPanelValue('priceValue', '—');
  setPanelValue('stopsValue', '—');
  setPanelValue('estTimeValue', '—');
  setPanelValue('distanceValue', '—');
  setPanelValue('departureTimeValue', '—');
}

function renderNoRide() {
  setRolePill('Active Ride');
  setStatus('No active ride.', 'warn');
  clearPanelForNoRide();
  showDriverCard(false);
  $('passengersList').innerHTML = '';
  setStartButtons();

  if (routeLine) {
    map.removeLayer(routeLine);
    routeLine = null;
  }
}

async function renderActiveRide() {
  const route = normalizeRoute(activeRoute);
  console.log('[My Map] normalized route used for UI:', route);

  setRolePill(role === 'driver' ? 'DRIVER' : 'PASSENGER');

  const tripType = String(route?.trip_type || '').toLowerCase();
  setPanelValue('rideTypeValue', tripType === 'from_campus' ? 'From Campus' : 'To Campus');
  setPanelValue('departureValue', route?.departure_name || formatCoordLabel(route?.departure_lat, route?.departure_lng));
  setPanelValue('destinationValue', route?.destination_name || formatCoordLabel(route?.destination_lat, route?.destination_lng));
  setPanelValue('priceValue', route?.price_per_seat != null ? `${Number(route.price_per_seat).toLocaleString()} LBP` : '—');
  setPanelValue('stopsValue', Array.isArray(route?.stop_points) ? String(route.stop_points.length) : '0');
  setPanelValue('capacityValue', route?.total_seats != null ? String(route.total_seats) : (route?.available_seats != null ? String(route.available_seats) : '—'));

  const departureTime = route?.departure_time ? parseXanoDate(route.departure_time) : null;
  setPanelValue('departureTimeValue', departureTime && !Number.isNaN(departureTime.getTime())
    ? departureTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '—');

  const durationMin = route?.duration_min != null ? Number(route.duration_min) : null;
  const distanceKm = route?.distance != null ? Number(route.distance) : null;
  setPanelValue('estTimeValue', durationMin != null && Number.isFinite(durationMin) ? `~${durationMin.toFixed(0)} min` : '—');
  setPanelValue('distanceValue', distanceKm != null && Number.isFinite(distanceKm) ? `${distanceKm.toFixed(1)} km` : '—');

  if (route?.route_geojson?.coordinates && Array.isArray(route.route_geojson.coordinates)) {
    renderRouteLine(route.route_geojson);
  } else if (routeLine) {
    map.removeLayer(routeLine);
    routeLine = null;
  }

  if (role === 'passenger') {
    showDriverCard(true);
    setPanelValue('driverName', `Driver #${activeAcceptedRide.driver_user_id}`);
    setPanelValue('driverCar', route?.departure_name && route?.destination_name ? `${route.departure_name} -> ${route.destination_name}` : 'Current ride');
    $('driverCallBtn').href = '#';
    $('passengersList').innerHTML = '';
    setPanelValue('passengerCount', '—');
  } else {
    showDriverCard(false);
    await renderPassengersForDriver();
  }

  setStartButtons();
  setPanelValue('rideInfoNote', 'Ride data loaded from Xano route table.');
  setStatus('Active ride loaded.', 'success');
}

async function renderPassengersForDriver() {
  const listEl = $('passengersList');
  if (!listEl) return;
  listEl.innerHTML = '';

  try {
    const requests = await XANO.getRideRequests();
    const list = Array.isArray(requests) ? requests : [];

    // Filter accepted requests for this active route
    const accepted = list
      .filter((r) => Number(r.route_id) === Number(activeRoute?.id))
      .filter((r) => String(r.status || '').toLowerCase() === 'accepted');

    // If route has stop_points saved (ordered pickups), use that order. Otherwise fallback to id order.
    let orderedRequests = [];
    const routeStopPoints = Array.isArray(activeRoute?.stop_points) ? activeRoute.stop_points : null;
    if (routeStopPoints && routeStopPoints.length > 0) {
      // Sort stop_points by order_index then map to matching request by ride_request_id
      const sortedStops = routeStopPoints.slice().sort((a, b) => (Number(a.order_index || 0) - Number(b.order_index || 0)));
      for (const stop of sortedStops) {
        const match = accepted.find((r) => Number(r.id) === Number(stop.ride_request_id));
        if (match) orderedRequests.push({ req: match, stop });
      }
      // Append any accepted requests that weren't present in stop_points at the end (preserve some order)
      const remaining = accepted.filter((r) => !orderedRequests.some((o) => Number(o.req.id) === Number(r.id)));
      remaining.sort((a, b) => Number(a.id || 0) - Number(b.id || 0));
      for (const r of remaining) orderedRequests.push({ req: r, stop: null });
    } else {
      // Fallback: order by id (old behavior)
      const sorted = accepted.slice().sort((a, b) => Number(a.id || 0) - Number(b.id || 0));
      orderedRequests = sorted.map((r) => ({ req: r, stop: null }));
    }

    setPanelValue('passengerCount', String(accepted.length));

    if (orderedRequests.length === 0) {
      listEl.innerHTML = '<div class="participant-empty">No passengers yet.</div>';
      return;
    }

    orderedRequests.forEach((item, idx) => {
      const r = item.req;
      const stop = item.stop;
      const pickupNumber = stop && (Number(stop.order_index) + 1) ? (Number(stop.order_index) + 1) : (idx + 1);
      const card = document.createElement('div');
      card.className = 'participant-card';
      card.innerHTML = `
        <span class="participant-label">Pickup #${pickupNumber}</span>
        <div class="participant-details">
          <span class="participant-name">Passenger #${escapeHtml(r.passenger_user_id)}</span>
          <span class="participant-car">${escapeHtml(r.pickup_location_name || '')}</span>
        </div>
      `;
      listEl.appendChild(card);
    });
  } catch (err) {
    console.log('[My Map] passenger list fetch failed:', err);
    listEl.innerHTML = '<div class="participant-empty">Could not load passengers.</div>';
    setPanelValue('passengerCount', '0');
  }
}

async function cancelRide() {
  if (role === 'passenger') {
    if (!activeAcceptedRide?.ride_request_id) {
      setStatus('No active passenger ride to cancel.', 'warn');
      return;
    }

    setStatus('Cancelling ride...', 'warn');
    try {
      await XANO.cancelRideRequest(Number(activeAcceptedRide.ride_request_id));
      await XANO.logEvent('ride_cancelled_by_passenger', { ride_request_id: activeAcceptedRide.ride_request_id, route_id: activeAcceptedRide.route_id });
      setStatus('Ride cancelled.', 'success');
      await loadActiveRide();
    } catch (err) {
      setStatus(err.message || 'Failed to cancel ride', 'error');
    }
    return;
  }

  if (!activeRoute?.id) {
    setStatus('No active driver ride to cancel.', 'warn');
    return;
  }

  setStatus('Cancelling ride as driver...', 'warn');
  try {
    await XANO.cancelRoute(Number(activeRoute.id));
    await XANO.logEvent('ride_cancelled_by_driver', { route_id: activeRoute.id });
    setStatus('Ride cancelled.', 'success');
    await loadActiveRide();
  } catch (err) {
    setStatus(err.message || 'Failed to cancel ride', 'error');
  }
}

function startRide() {
  setStatus('Start Ride is a UI-only action for now.', 'warn');
}

function confirmPickup() {
  // Placeholder for now, but with route recalculation capability
  // When integrated with backend, this would:
  // 1. Find the passenger being picked up
  // 2. Get their location
  // 3. Recalculate route through their pickup point
  // 4. Update UI with new distance/time
  
  if (!activeRoute) {
    setStatus('No active ride to confirm pickup.', 'warn');
    return;
  }
  
  if (role === 'passenger') {
    setStatus('Passengers cannot confirm pickups.', 'warn');
    return;
  }
  
  // Driver-side: Recalculate route if there's a pending passenger request
  if (activeAcceptedRide?.pickup_lat && activeAcceptedRide?.pickup_lng) {
    const driverStart = {
      lat: activeRoute.departure_lat || activeRoute.start_lat || CAMPUS_LAT,
      lng: activeRoute.departure_lng || activeRoute.start_lng || CAMPUS_LNG
    };
    
    const passengerLocation = {
      lat: Number(activeAcceptedRide.pickup_lat),
      lng: Number(activeAcceptedRide.pickup_lng)
    };
    
    setStatus('Recalculating route with pickup...', 'warn');
    recalculateRouteWithPickup(driverStart, passengerLocation, () => {
      // Update UI with new route info
      if (activeRoute.distanceKm) {
        const distEl = $('distanceValue');
        if (distEl) distEl.textContent = `${activeRoute.distanceKm.toFixed(1)} km`;
      }
      
      if (activeRoute.durationMin) {
        const timeEl = $('estTimeValue');
        if (timeEl) timeEl.textContent = `~${activeRoute.durationMin.toFixed(0)} min`;
      }
      
      // Re-render the route on map
      if (activeRoute.coords && Array.isArray(activeRoute.coords)) {
        const geojson = {
          type: 'LineString',
          coordinates: activeRoute.coords.map(c => [c[1], c[0]]) // Convert back to [lng,lat]
        };
        renderRouteLine(geojson);
      }
      
      setStatus('Pickup confirmed. Route updated.', 'success');
    });
  } else {
    setStatus('Confirm Pickup is not enabled yet.', 'warn');
  }
}

function endRide() {
  setStatus('End Ride is not enabled yet.', 'warn');
}

function startPolling() {
  stopPolling();
  pollingTimer = window.setInterval(async () => {
    try {
      await loadActiveRide();
    } catch {
      // ignore
    }
  }, 7000);
}

function stopPolling() {
  if (pollingTimer) {
    window.clearInterval(pollingTimer);
    pollingTimer = null;
  }
}

async function bootstrap() {
  try {
    me = await XANO.getMe();
  } catch {
    setStatus('Please log in first.', 'error');
    window.location.href = '/login';
    return;
  }

  await loadActiveRide();
}

document.addEventListener('DOMContentLoaded', async () => {
  initMap();
  $('rideInfoCollapseBtn')?.addEventListener('click', () => $('rideInfoPanel')?.classList.toggle('collapsed'));

  await bootstrap();
  startPolling();
});

window.cancelRide = cancelRide;
window.startRide = startRide;
window.confirmPickup = confirmPickup;
window.endRide = endRide;
