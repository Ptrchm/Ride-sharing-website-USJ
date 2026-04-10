// My Map (production): displays the current ride using the route table as source of truth.

const CAMPUS_LAT = 33.8654840;
const CAMPUS_LNG = 35.5631210;

let map;
let routeLine = null;
let me = null;
let activeAcceptedRide = null;
let activeRoute = null;
let role = null; // 'driver' | 'passenger'
let pollingTimer = null;

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

    const accepted = list
      .filter((r) => Number(r.route_id) === Number(activeRoute?.id))
      .filter((r) => String(r.status || '').toLowerCase() === 'accepted')
      .sort((a, b) => Number(a.id || 0) - Number(b.id || 0));

    setPanelValue('passengerCount', String(accepted.length));

    accepted.forEach((r, idx) => {
      const card = document.createElement('div');
      card.className = 'participant-card';
      card.innerHTML = `
        <span class="participant-label">Pickup #${idx + 1}</span>
        <div class="participant-details">
          <span class="participant-name">Passenger #${escapeHtml(r.passenger_user_id)}</span>
          <span class="participant-car">${escapeHtml(r.pickup_location_name || '')}</span>
        </div>
      `;
      listEl.appendChild(card);
    });

    if (accepted.length === 0) {
      listEl.innerHTML = '<div class="participant-empty">No passengers yet.</div>';
    }
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
  setStatus('Confirm Pickup is not enabled yet.', 'warn');
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
