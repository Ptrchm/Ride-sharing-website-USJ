

    /* =====================================================================
       CONSTANTS
    ===================================================================== */
    const CAMPUS_LAT = 33.8654840;
    const CAMPUS_LNG = 35.5631210;
    const OSRM_BASE  = 'https://router.project-osrm.org/route/v1/driving';
    const REQUEST_STORAGE_KEY = 'usj-rideshare-driver-requests';
    const PASSENGER_VISIBILITY_KEY = 'usj-rideshare-passenger-visibility';
    const JOIN_REQUEST_STORAGE_KEY = 'usj-rideshare-passenger-join-requests';
    const RIDE_PUBLISH_STORAGE_KEY = 'usj-rideshare-driver-published-rides';
    const ACTIVE_RIDE_STORAGE_KEY = 'usj-rideshare-active-ride';
    const ACTIVE_RIDE_POSITIONS_KEY = 'usj-rideshare-active-ride-positions';
    const PASSENGER_PROFILE = {
      id: 'passenger-live',
      fullName: 'Current Passenger',
      phone: '+96170111000',
    };

    const DRIVERS_DATA = [
      { id: 'driver-a', fullName: 'Nabil Haddad',  phone: '+96170991001', carName: 'Toyota Corolla',  licensePlate: 'B 421983', lat: 33.9000,   lng: 35.5400,   arrivalTime: '07:45' },
      { id: 'driver-b', fullName: 'Mira Tohme',    phone: '+96170991002', carName: 'Honda Civic',     licensePlate: 'J 174625', lat: 33.8600,   lng: 35.5800,   arrivalTime: '08:10' },
      { id: 'driver-c', fullName: 'Elias Nader',   phone: '+96170991003', carName: 'Kia Rio',         licensePlate: 'M 582310', lat: 33.8400,   lng: 35.5400,   arrivalTime: '08:30' },
      { id: 'driver-d', fullName: 'Ralph Chehab',  phone: '+96170991004', carName: 'Nissan Sunny',    licensePlate: 'T 308714', lat: 33.8800,   lng: 35.5100,   arrivalTime: '08:55' },
      { id: 'driver-e', fullName: 'Lara Akl',      phone: '+96170991005', carName: 'Hyundai Elantra', licensePlate: 'K 119406', lat: 33.9100,   lng: 35.5600,   arrivalTime: '09:20' },
      { id: 'driver-f', fullName: 'Charbel Azar',  phone: '+96170991006', carName: 'Mazda 3',         licensePlate: 'S 883257', lat: 33.879583, lng: 35.559944, arrivalTime: '09:40' },
    ];

    /* =====================================================================
       COLLAPSE/EXPAND PANEL FUNCTIONS
    ===================================================================== */
    // Consolidated into driverNearbyPanel - function kept for compatibility but not used

    function toggleRequestPanel() {
      const panel = document.querySelector('.request-panel');
      panel.classList.toggle('collapsed');
      localStorage.setItem('usj-rideshare-passenger-request-panel-collapsed', panel.classList.contains('collapsed'));
    }

    function togglePassengerControls() {
      const controls = document.querySelector('.controls');
      controls.classList.toggle('collapsed');
      localStorage.setItem('usj-rideshare-passenger-controls-collapsed', controls.classList.contains('collapsed'));
    }

    // Consolidated into driverNearbyPanel - function kept for compatibility but not used

    function toggleDriverNearbyPanel() {
      const panel = document.getElementById('driverNearbyPanel');
      panel.classList.toggle('collapsed');
      localStorage.setItem('usj-rideshare-driver-nearby-panel-collapsed', panel.classList.contains('collapsed'));
    }

    /* Initialize collapse button listeners */
    document.addEventListener('DOMContentLoaded', () => {
      document.getElementById('passengerControlsCollapseBtn')?.addEventListener('click', togglePassengerControls);
      document.getElementById('requestPanelCollapseBtn')?.addEventListener('click', toggleRequestPanel);
      document.getElementById('driverNearbyCollapseBtn')?.addEventListener('click', toggleDriverNearbyPanel);

      // Clear drivers panel collapsed state to show it by default (start hidden via CSS .visible class)
      localStorage.removeItem('usj-rideshare-drivers-panel-collapsed');
      
      // Restore collapsed states from localStorage
      if (localStorage.getItem('usj-rideshare-passenger-controls-collapsed') === 'true') {
        document.querySelector('.controls')?.classList.add('collapsed');
      }
      if (localStorage.getItem('usj-rideshare-passenger-request-panel-collapsed') === 'true') {
        document.querySelector('.request-panel')?.classList.add('collapsed');
      }
      if (localStorage.getItem('usj-rideshare-driver-nearby-panel-collapsed') === 'true') {
        document.getElementById('driverNearbyPanel')?.classList.add('collapsed');
      }
    });

    /* =====================================================================
       MAP INITIALISATION
    ===================================================================== */
    const map = L.map('map', { zoomControl: false }).setView([CAMPUS_LAT, CAMPUS_LNG], 14);
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    /* Campus marker */
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
      iconSize: [34, 42], iconAnchor: [17, 42],
    });

    L.marker([CAMPUS_LAT, CAMPUS_LNG], { icon: campusIcon })
      .addTo(map)
      .bindPopup('<strong style="font-family:Inter,sans-serif;color:#002b59">Campus USJ</strong>');

    /* Passenger icon — red pin with person silhouette */
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
        <path d="M13.5 22.5c0-3.04 2.46-5.5 5.5-5.5s5.5 2.46 5.5 5.5"
              fill="rgba(255,255,255,0.95)" stroke="none"/>
      </svg>`,
      iconSize: [38, 46], iconAnchor: [19, 46],
    });

    /* Driver icon — blue circle with car */
    const driverIcon = L.divIcon({
      className: '',
      html: `<svg width="42" height="42" viewBox="0 0 56 56">
        <defs>
          <linearGradient id="dg" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stop-color="#1e9de0"/>
            <stop offset="100%" stop-color="#002b59"/>
          </linearGradient>
          <filter id="dsh" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="rgba(0,0,0,0.28)"/>
          </filter>
        </defs>
        <circle cx="28" cy="28" r="22" fill="url(#dg)" filter="url(#dsh)"/>
        <path d="M16 33h24l2-9-6-6H20l-6 6 2 9z" fill="rgba(255,255,255,0.95)"/>
        <circle cx="22" cy="35.5" r="2.8" fill="rgba(255,255,255,0.95)"/>
        <circle cx="34" cy="35.5" r="2.8" fill="rgba(255,255,255,0.95)"/>
      </svg>`,
      iconSize: [42, 42], iconAnchor: [21, 21],
    });

    /* =====================================================================
       STATE
    ===================================================================== */
    let passengerLat      = null;
    let passengerLng      = null;
    let passengerMarker   = null;
    let driverRoutes      = [];
    let driverLines       = [];
    let driverMarkers     = [];
    let nearestPtMarker   = null;
    let clickMode         = false;
    let isLookingForRide  = false;
    let selectedDriver    = null;
    let rideTimeFilter    = '';
    const requestedDriverIds = new Set();

    /* =====================================================================
       UI HELPERS
    ===================================================================== */
    function setStatus(text, state = 'default') {
      document.getElementById('statusText').textContent = text;
      const box = document.getElementById('statusBox');
      box.className = state !== 'default' ? `state-${state}` : '';
    }

    function btnLoading(id, loading) {
      const btn = document.getElementById(id);
      if (loading) btn.setAttribute('data-loading', '');
      else btn.removeAttribute('data-loading');
    }

    function sanitizePhoneForWhatsApp(phone) {
      return String(phone || '').replace(/[^\d]/g, '');
    }

    function isValidTimeValue(value) {
      return /^([01]\d|2[0-3]):([0-5]\d)$/.test(String(value || ''));
    }

    function formatTime(value) {
      return isValidTimeValue(value) ? value : '';
    }

    function renderRideTime(value) {
      const formatted = formatTime(value);
      return formatted ? `Arrival Time: ${formatted}` : 'Arrival Time: Not set';
    }

    function timeToMinutes(value) {
      if (!isValidTimeValue(value)) return null;
      const [hh, mm] = value.split(':').map(Number);
      return (hh * 60) + mm;
    }

    function sortRidesByTime(rides) {
      return [...rides].sort((a, b) => {
        const aMin = timeToMinutes(a.arrivalTime);
        const bMin = timeToMinutes(b.arrivalTime);
        if (aMin === null && bMin === null) return 0;
        if (aMin === null) return 1;
        if (bMin === null) return -1;
        return aMin - bMin;
      });
    }

    function setRideTime(value) {
      rideTimeFilter = formatTime(value);
      applyDriverTimeFilter();
    }

    function clearRideTimeFilter() {
      rideTimeFilter = '';
      const input = document.getElementById('rideTimeFilter');
      if (input) input.value = '';
      applyDriverTimeFilter();
    }

    function applyDriverTimeFilter() {
      const rows = [...document.querySelectorAll('#driverRows .driver-row')];
      const note = document.getElementById('rideTimeFilterNote');
      let visible = 0;
      rows.forEach(row => {
        const rowTime = formatTime(row.dataset.arrivalTime || '');
        const include = !rideTimeFilter
          ? true
          : (rowTime ? timeToMinutes(rowTime) <= timeToMinutes(rideTimeFilter) : false);
        row.classList.toggle('hidden-by-time', !include);
        if (include) visible += 1;
      });
      document.getElementById('driverCount').textContent = String(visible);
      if (!note) return;
      note.textContent = rideTimeFilter
        ? `Showing rides arriving before ${rideTimeFilter}.`
        : 'Rides are sorted by arrival time (earliest to latest). Unscheduled rides appear last.';
    }

    function getWhatsAppUrl(phone) {
      const digits = sanitizePhoneForWhatsApp(phone);
      return digits ? `https://wa.me/${digits}` : '#';
    }

    function openWhatsAppChat(phone) {
      const url = getWhatsAppUrl(phone);
      if (url === '#') {
        setStatus('Phone number unavailable for chat', 'error');
        return;
      }
      window.open(url, '_blank', 'noopener');
    }

    function readJoinRequests() {
      try {
        const raw = localStorage.getItem(JOIN_REQUEST_STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }

    function getJoinRequestStatus(request) {
      return request?.status || 'pending';
    }

    function loadRequestedDriverIds() {
      requestedDriverIds.clear();
      readJoinRequests().forEach(request => {
        if (request?.driverId) requestedDriverIds.add(request.driverId);
      });
    }

    function readPublishedRides() {
      try {
        const raw = localStorage.getItem(RIDE_PUBLISH_STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }

    function normalizeRide(ride) {
      if (!ride) return null;
      const capacityRaw = ride.capacity ?? ride.availableSeats ?? 0;
      const capacity = Number.isInteger(Number(capacityRaw)) ? Number(capacityRaw) : Number.parseInt(String(capacityRaw), 10);
      const passengers = (Array.isArray(ride.passengers) ? ride.passengers : [])
        .map(entry => {
          if (!entry) return null;
          const id = entry.id || entry.passengerId;
          if (!id) return null;
          const lat = entry.location?.lat ?? entry.lat;
          const lng = entry.location?.lng ?? entry.lng;
          return {
            id,
            name: entry.name || entry.fullName || entry.passengerName || 'Passenger',
            phone: entry.phone || entry.passengerPhone || '+96170000000',
            location: {
              lat: typeof lat === 'number' ? lat : null,
              lng: typeof lng === 'number' ? lng : null,
            },
          };
        })
        .filter(Boolean)
        .filter((entry, index, arr) => arr.findIndex(item => item.id === entry.id) === index);
      const routeCoords = Array.isArray(ride.route?.coords)
        ? ride.route.coords
        : (Array.isArray(ride.coords) ? ride.coords : []);
      const route = {
        start: ride.route?.start || ride.start || null,
        destination: ride.route?.destination || ride.destination || { lat: CAMPUS_LAT, lng: CAMPUS_LNG },
        pickupPoints: Array.isArray(ride.route?.pickupPoints) ? ride.route.pickupPoints : [],
        coords: routeCoords,
        durationMin: Number(ride.route?.durationMin ?? ride.durationMin ?? 0),
        distanceKm: Number(ride.route?.distanceKm ?? ride.distanceKm ?? 0),
      };
      return {
        ...ride,
        capacity: Number.isInteger(capacity) && capacity > 0 ? capacity : 1,
        passengers,
        status: ride.status || 'waiting',
        route,
        coords: routeCoords,
      };
    }

    function persistUpdatedRide(updatedRide) {
      if (!updatedRide?.rideId) return false;
      const rides = readPublishedRides();
      let found = false;
      const next = rides.map(ride => {
        if (ride?.rideId !== updatedRide.rideId) return ride;
        found = true;
        return updatedRide;
      });
      if (!found) next.push(updatedRide);
      try {
        localStorage.setItem(RIDE_PUBLISH_STORAGE_KEY, JSON.stringify(next.slice(-40)));
        return true;
      } catch {
        return false;
      }
    }

    function calcDistanceKm(a, b) {
      if (!a || !b) return Infinity;
      const toRad = value => (value * Math.PI) / 180;
      const dLat = toRad((b.lat || 0) - (a.lat || 0));
      const dLng = toRad((b.lng || 0) - (a.lng || 0));
      const rLatA = toRad(a.lat || 0);
      const rLatB = toRad(b.lat || 0);
      const h = Math.sin(dLat / 2) ** 2 + Math.cos(rLatA) * Math.cos(rLatB) * Math.sin(dLng / 2) ** 2;
      return 6371 * (2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h)));
    }

    function orderPassengerPickupsNearestFirst(startPoint, passengers) {
      const remaining = [...passengers];
      const ordered = [];
      let current = { lat: startPoint?.lat, lng: startPoint?.lng };
      while (remaining.length) {
        let bestIndex = 0;
        let bestDist = Infinity;
        remaining.forEach((passenger, index) => {
          const dist = calcDistanceKm(current, {
            lat: passenger.location?.lat,
            lng: passenger.location?.lng,
          });
          if (dist < bestDist) {
            bestDist = dist;
            bestIndex = index;
          }
        });
        const [nextPassenger] = remaining.splice(bestIndex, 1);
        ordered.push(nextPassenger);
        current = {
          lat: nextPassenger.location?.lat,
          lng: nextPassenger.location?.lng,
        };
      }
      return ordered;
    }

    async function updateRouteWithPassengers(ride) {
      const normalized = normalizeRide(ride);
      if (!normalized) return null;
      const start = normalized.route.start;
      const destination = normalized.route.destination || { lat: CAMPUS_LAT, lng: CAMPUS_LNG };
      if (!start || typeof start.lat !== 'number' || typeof start.lng !== 'number') {
        return normalized;
      }
      const validPassengers = normalized.passengers.filter(passenger =>
        typeof passenger.location?.lat === 'number' && typeof passenger.location?.lng === 'number'
      );
      const orderedPassengers = orderPassengerPickupsNearestFirst(start, validPassengers);
      const routePoints = [
        { lat: start.lat, lng: start.lng },
        ...orderedPassengers.map(passenger => ({ lat: passenger.location.lat, lng: passenger.location.lng })),
        { lat: destination.lat, lng: destination.lng },
      ];
      const coordString = routePoints.map(point => `${point.lng},${point.lat}`).join(';');
      let coords = Array.isArray(normalized.route.coords) ? normalized.route.coords : [];
      let durationMin = Number(normalized.route.durationMin || 0);
      let distanceKm = Number(normalized.route.distanceKm || 0);
      try {
        const res = await fetch(`${OSRM_BASE}/${coordString}?overview=full&geometries=geojson`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.routes) && data.routes[0]) {
            coords = data.routes[0].geometry.coordinates.map(point => [point[1], point[0]]);
            durationMin = data.routes[0].duration / 60;
            distanceKm = data.routes[0].distance / 1000;
          }
        }
      } catch {
        // Keep current route if route service is not available.
      }
      return {
        ...normalized,
        coords,
        durationMin: Number(durationMin.toFixed(1)),
        distanceKm: Number(distanceKm.toFixed(2)),
        route: {
          ...normalized.route,
          pickupPoints: orderedPassengers.map((passenger, index) => ({
            order: index + 1,
            passengerId: passenger.id,
            name: passenger.name,
            phone: passenger.phone,
            lat: passenger.location?.lat,
            lng: passenger.location?.lng,
          })),
          coords,
          durationMin: Number(durationMin.toFixed(1)),
          distanceKm: Number(distanceKm.toFixed(2)),
        },
      };
    }

    async function addPassengerToRide(ride, passenger) {
      const normalized = normalizeRide(ride);
      if (!normalized || !passenger?.id) {
        return { ok: false, message: 'Invalid join request', ride: normalized };
      }
      if (normalized.status !== 'waiting') {
        return { ok: false, message: 'Ride already started', ride: normalized };
      }
      if (normalized.passengers.some(entry => entry.id === passenger.id)) {
        return { ok: true, message: 'Already joined', ride: normalized };
      }
      if (normalized.passengers.length >= normalized.capacity) {
        return { ok: false, message: 'Ride is full', ride: normalized };
      }
      const nextRide = {
        ...normalized,
        passengers: [
          ...normalized.passengers,
          {
            id: passenger.id,
            name: passenger.name,
            phone: passenger.phone,
            location: {
              lat: passenger.location?.lat,
              lng: passenger.location?.lng,
            },
          },
        ],
      };
      const routed = await updateRouteWithPassengers(nextRide);
      return { ok: true, message: 'Joined ride', ride: routed || nextRide };
    }

    function removePassengerFromRide(ride, passengerId) {
      const normalized = normalizeRide(ride);
      if (!normalized) return null;
      return {
        ...normalized,
        passengers: normalized.passengers.filter(passenger => passenger.id !== passengerId),
      };
    }

    function updateSeatCount(ride) {
      const normalized = normalizeRide(ride);
      if (!normalized) return { capacity: 0, passengers: 0, seatsLeft: 0 };
      const passengers = normalized.passengers.length;
      const capacity = normalized.capacity;
      const seatsLeft = Math.max(0, capacity - passengers);
      return { capacity, passengers, seatsLeft };
    }

    function getPassengerPickupInfo(ride, passengerId) {
      const pickupPoints = Array.isArray(ride?.route?.pickupPoints) ? ride.route.pickupPoints : [];
      const found = pickupPoints.find(point => point?.passengerId === passengerId);
      if (!found) {
        return {
          order: null,
          total: pickupPoints.length,
          text: pickupPoints.length ? 'Pickup order will update shortly.' : 'Not assigned yet',
        };
      }
      return {
        order: found.order || null,
        total: pickupPoints.length,
        text: `Pickup #${found.order || '?'} of ${pickupPoints.length}`,
      };
    }

    function getDriverKey(driver) {
      return driver?.driverId || driver?.id;
    }

    function hasAcceptedConnectionWithDriver(driver) {
      if (!driver) return false;
      const driverKey = getDriverKey(driver);
      const passengerPhone = PASSENGER_PROFILE.phone;
      const acceptedJoin = readJoinRequests().some(request =>
        request &&
        (request.status || 'pending') === 'accepted' &&
        request.driverId === driverKey &&
        (request.passengerId === PASSENGER_PROFILE.id || request.passengerPhone === passengerPhone)
      );
      if (acceptedJoin) return true;
      const acceptedDriverInvite = readRideRequests().some(request =>
        request &&
        (request.status || 'pending') === 'accepted' &&
        request.driverId === driverKey &&
        (request.passengerId === PASSENGER_PROFILE.id || request.phone === passengerPhone)
      );
      return acceptedDriverInvite;
    }

    function setDriverPanelEmpty(message, badge = 'Waiting') {
      selectedDriver = null;
      // Ensure we're showing the list view, not details view
      document.getElementById('panelHeadList').classList.remove('hidden');
      document.getElementById('panelHeadDetails').classList.add('hidden');
      document.getElementById('driverListView').classList.remove('hidden');
      document.getElementById('driverDetailsView').classList.add('hidden');
      // Show the panel
      document.getElementById('driverNearbyPanel').classList.add('visible');
      // Clear join note
      document.getElementById('panelJoinNote').textContent = '';
      document.getElementById('panelJoinNote').className = 'panel-note';
      refreshJoinButton();
      document.getElementById('driverListEmpty').innerHTML = message;
      document.getElementById('driverListEmpty').classList.remove('hidden');
    }

    function setJoinNote(text, state = '') {
      const note = document.getElementById('panelJoinNote');
      note.textContent = text;
      note.className = state ? `panel-note state-${state}` : 'panel-note';
    }

    function refreshJoinButton() {
      const button = document.getElementById('panelJoinBtn');
      if (!selectedDriver) {
        button.disabled = true;
        button.textContent = 'Request to Join';
        return;
      }
      const requested = requestedDriverIds.has(getDriverKey(selectedDriver));
      button.disabled = requested;
      button.textContent = requested ? 'Request Sent' : 'Request to Join';
    }

    function renderDriverDetails(driver) {
      const canSharePhone = hasAcceptedConnectionWithDriver(driver);
      const seatInfo = updateSeatCount(driver);
      const pickupInfo = getPassengerPickupInfo(driver, PASSENGER_PROFILE.id);
      // Switch to details view
      document.getElementById('panelHeadList').classList.add('hidden');
      document.getElementById('panelHeadDetails').classList.remove('hidden');
      document.getElementById('driverListView').classList.add('hidden');
      document.getElementById('driverDetailsView').classList.remove('hidden');
      document.getElementById('panelDriverName').textContent = driver.fullName;
      document.getElementById('panelDriverPhone').textContent = canSharePhone ? driver.phone : 'Hidden until request is accepted';
      document.getElementById('panelDriverPhoneLink').href = canSharePhone ? `tel:${driver.phone}` : '#';
      const callBtn = document.getElementById('panelDriverCallBtn');
      callBtn.href = canSharePhone ? `tel:${driver.phone}` : '#';
      callBtn.classList.toggle('is-disabled', !canSharePhone);
      document.getElementById('panelDriverCar').textContent = driver.carName;
      document.getElementById('panelDriverPlate').textContent = driver.licensePlate;
      const destinationText = driver.isPublishedRide ? 'destination' : 'campus';
      document.getElementById('panelDriverFit').textContent = `${driver.pickupDistanceKm?.toFixed(2) || '—'} km · ~${driver.pickupDurationMin?.toFixed(0) || '—'} min${destinationText} · ${renderRideTime(driver.arrivalTime)}`;
      document.getElementById('panelDriverSeats').textContent = `Seats left: ${seatInfo.seatsLeft}`;
      document.getElementById('panelPassengerCount').textContent = `${seatInfo.passengers} / ${seatInfo.capacity}`;
      document.getElementById('panelPickupPosition').textContent = pickupInfo.text;
      setJoinNote(
        requestedDriverIds.has(getDriverKey(driver))
          ? 'Join request already sent to this driver.'
          : (canSharePhone
              ? 'Request accepted. You can now call or chat with this driver.'
              : 'Phone and call become available after request acceptance.'),
        requestedDriverIds.has(getDriverKey(driver)) ? 'success' : ''
      );
      refreshJoinButton();
    }

    function backToDriverList() {
      selectedDriver = null;
      document.getElementById('panelHeadList').classList.remove('hidden');
      document.getElementById('panelHeadDetails').classList.add('hidden');
      document.getElementById('driverListView').classList.remove('hidden');
      document.getElementById('driverDetailsView').classList.add('hidden');
      driverMarkers.forEach(item => item.marker.setOpacity(0.78));
      if (driverLines.length) {
        driverLines.forEach(line => line.setStyle({ weight: 5, opacity: 0.45 }));
      }
    }

    function selectDriver(driverId) {
      const entry = driverMarkers.find(item => item.driver.id === driverId);
      if (!entry) return;
      selectedDriver = entry.driver;
      driverMarkers.forEach(item => item.marker.setOpacity(0.78));
      entry.marker.setOpacity(1);
      renderDriverDetails(entry.driver);
      entry.marker.openPopup();
      if (entry.line) {
        driverLines.forEach(line => line.setStyle({ weight: 5, opacity: 0.45 }));
        entry.line.setStyle({ weight: 7, opacity: 1 });
      }
    }

    async function requestSelectedDriver() {
      if (!selectedDriver) {
        setStatus('Select a driver marker first', 'error');
        return;
      }
      const driverKey = getDriverKey(selectedDriver);
      if (requestedDriverIds.has(driverKey)) {
        setJoinNote('Join request already sent to this driver.', 'success');
        return;
      }

      if (selectedDriver.isPublishedRide) {
        const ride = normalizeRide(readPublishedRides().find(item => item?.rideId === selectedDriver.rideId));
        if (!ride) {
          setStatus('Ride is unavailable. Refresh the list.', 'error');
          return;
        }
        const joinResult = await addPassengerToRide(ride, {
          id: PASSENGER_PROFILE.id,
          name: PASSENGER_PROFILE.fullName,
          phone: PASSENGER_PROFILE.phone,
          location: {
            lat: typeof passengerLat === 'number' ? passengerLat : null,
            lng: typeof passengerLng === 'number' ? passengerLng : null,
          },
        });
        if (!joinResult.ok) {
          const message = joinResult.message || 'Could not join ride';
          setJoinNote(message, '');
          setStatus(message === 'Ride is full' ? 'Ride is full' : message, 'error');
          return;
        }
        const updatedRide = normalizeRide(joinResult.ride);
        if (!persistUpdatedRide(updatedRide)) {
          setStatus('Could not save your join request in this browser', 'error');
          return;
        }
        const joinRequests = readJoinRequests().filter(request =>
          !(request?.driverId === driverKey && (request?.passengerId === PASSENGER_PROFILE.id || request?.passengerPhone === PASSENGER_PROFILE.phone))
        );
        joinRequests.push({
          requestId: `join-${Date.now()}`,
          driverId: driverKey,
          rideId: updatedRide.rideId || null,
          driverName: selectedDriver.fullName,
          driverPhone: selectedDriver.phone,
          carName: selectedDriver.carName,
          licensePlate: selectedDriver.licensePlate,
          arrivalTime: formatTime(selectedDriver.arrivalTime) || null,
          passengerId: PASSENGER_PROFILE.id,
          passengerName: PASSENGER_PROFILE.fullName,
          passengerPhone: PASSENGER_PROFILE.phone,
          distanceKm: Number(selectedDriver.dKm.toFixed(2)),
          status: 'accepted',
          driverConfirmed: false,
          passengerConfirmed: false,
          rideStartedAt: null,
          requestedAt: new Date().toISOString(),
          respondedAt: new Date().toISOString(),
        });
        try {
          localStorage.setItem(JOIN_REQUEST_STORAGE_KEY, JSON.stringify(joinRequests.slice(-40)));
        } catch {
          setStatus('Could not sync join updates in this browser', 'error');
        }
        requestedDriverIds.add(driverKey);
        refreshJoinButton();
        setJoinNote(`Joined ${selectedDriver.fullName}. Seats left: ${updateSeatCount(updatedRide).seatsLeft}.`, 'success');
        setStatus(`Joined ${selectedDriver.fullName}.`, 'success');
        renderRideRequests();
        findRide();
        return;
      }

      const requests = readJoinRequests().filter(request => request?.driverId !== driverKey);
      requests.push({
        requestId: `join-${Date.now()}`,
        driverId: driverKey,
        rideId: selectedDriver.rideId || null,
        driverName: selectedDriver.fullName,
        driverPhone: selectedDriver.phone,
        carName: selectedDriver.carName,
        licensePlate: selectedDriver.licensePlate,
        arrivalTime: formatTime(selectedDriver.arrivalTime) || null,
        passengerId: PASSENGER_PROFILE.id,
        passengerName: PASSENGER_PROFILE.fullName,
        passengerPhone: PASSENGER_PROFILE.phone,
        distanceKm: Number(selectedDriver.dKm.toFixed(2)),
        status: 'pending',
        driverConfirmed: false,
        passengerConfirmed: false,
        rideStartedAt: null,
        requestedAt: new Date().toISOString(),
      });
      try {
        localStorage.setItem(JOIN_REQUEST_STORAGE_KEY, JSON.stringify(requests.slice(-20)));
      } catch {
        setStatus('Join request could not be stored in this browser', 'error');
        return;
      }
      requestedDriverIds.add(driverKey);
      refreshJoinButton();
      setJoinNote(`Join request sent to ${selectedDriver.fullName}.`, 'success');
      setStatus(`Join request sent to ${selectedDriver.fullName}`, 'success');
    }

    function readVisibilityState() {
      try {
        const raw = localStorage.getItem(PASSENGER_VISIBILITY_KEY);
        if (!raw) return { visible: false, lat: null, lng: null };
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object'
          ? { visible: Boolean(parsed.visible), lat: parsed.lat ?? null, lng: parsed.lng ?? null }
          : { visible: false, lat: null, lng: null };
      } catch {
        return { visible: false, lat: null, lng: null };
      }
    }

    function writeVisibilityState() {
      const payload = {
        ...PASSENGER_PROFILE,
        visible: isLookingForRide,
        lat: passengerLat,
        lng: passengerLng,
        updatedAt: new Date().toISOString(),
      };
      try {
        localStorage.setItem(PASSENGER_VISIBILITY_KEY, JSON.stringify(payload));
      } catch {
        setStatus('Visibility status could not be saved in this browser', 'error');
      }
    }

    function updateVisibilityUI() {
      const button = document.getElementById('btnVisibilityToggle');
      const label = document.getElementById('visibilityToggleLabel');
      const note = document.getElementById('visibilityNote');
      label.textContent = `Looking for Ride: ${isLookingForRide ? 'ON' : 'OFF'}`;
      button.classList.toggle('btn-toggle-active', isLookingForRide);
      note.classList.toggle('state-on', isLookingForRide);
      note.textContent = isLookingForRide
        ? (passengerLat === null
            ? 'Drivers will see you after you set your location. This setting stays independent from Find Ride.'
            : 'Drivers can see you on the driver map when they search. This setting is independent from Find Ride.')
        : 'Drivers cannot see you right now. This setting is independent from Find Ride.';
    }

    function toggleLookingForRide() {
      isLookingForRide = !isLookingForRide;
      updateVisibilityUI();
      writeVisibilityState();
      setStatus(
        isLookingForRide
          ? (passengerLat === null ? 'Visibility on — set your location to appear to drivers' : 'Visibility on — drivers can now see you')
          : 'Visibility off — hidden from drivers',
        isLookingForRide ? 'success' : 'default'
      );
    }

    function readRideRequests() {
      try {
        const raw = localStorage.getItem(REQUEST_STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }

    function readActiveRide() {
      try {
        const raw = localStorage.getItem(ACTIVE_RIDE_STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    }

    function clearActiveRideIfMatches(requestId) {
      const activeRide = readActiveRide();
      if (!activeRide) return;
      if (activeRide.sourceRequestId !== requestId) return;
      localStorage.removeItem(ACTIVE_RIDE_STORAGE_KEY);
      localStorage.removeItem(ACTIVE_RIDE_POSITIONS_KEY);
    }

    function writeInitialRidePositions(activeRide) {
      if (!activeRide) return;
      let existing = {};
      try {
        existing = JSON.parse(localStorage.getItem(ACTIVE_RIDE_POSITIONS_KEY) || '{}') || {};
      } catch {
        existing = {};
      }
      const next = {
        ...existing,
        rideId: activeRide.rideId,
      };
      if (typeof activeRide.passenger?.lat === 'number' && typeof activeRide.passenger?.lng === 'number') {
        next.passenger = {
          lat: activeRide.passenger.lat,
          lng: activeRide.passenger.lng,
          updatedAt: new Date().toISOString(),
        };
      }
      if (typeof activeRide.driver?.lat === 'number' && typeof activeRide.driver?.lng === 'number') {
        next.driver = {
          lat: activeRide.driver.lat,
          lng: activeRide.driver.lng,
          updatedAt: new Date().toISOString(),
        };
      }
      localStorage.setItem(ACTIVE_RIDE_POSITIONS_KEY, JSON.stringify(next));
    }

    function buildPassengerActiveRide(requestType, request) {
      const driverId = request.driverId || null;
      const published = normalizeRide(readPublishedRides().find(ride => ride?.driverId === driverId)) || null;
      const fallbackDriver = DRIVERS_DATA.find(driver =>
        (driverId && driver.id === driverId) ||
        (request.driverPhone && driver.phone === request.driverPhone) ||
        (request.driverName && driver.fullName === request.driverName)
      ) || null;
      const rideId = `active-${request.requestId || Date.now()}`;
      return {
        rideId,
        sourceType: requestType,
        sourceRequestId: request.requestId,
        status: 'in-progress',
        startedAt: request.rideStartedAt || new Date().toISOString(),
        role: 'passenger',
        capacity: published?.capacity || null,
        passengers: published?.passengers || [],
        driver: {
          id: driverId || fallbackDriver?.id || 'driver-live',
          fullName: request.driverName || fallbackDriver?.fullName || 'Driver',
          phone: request.driverPhone || fallbackDriver?.phone || '+96170000000',
          carName: request.carName || fallbackDriver?.carName || 'Vehicle',
          licensePlate: request.licensePlate || fallbackDriver?.licensePlate || 'N/A',
          lat: published?.start?.lat ?? fallbackDriver?.lat ?? null,
          lng: published?.start?.lng ?? fallbackDriver?.lng ?? null,
        },
        passenger: {
          id: PASSENGER_PROFILE.id,
          fullName: PASSENGER_PROFILE.fullName,
          phone: PASSENGER_PROFILE.phone,
          lat: typeof passengerLat === 'number' ? passengerLat : null,
          lng: typeof passengerLng === 'number' ? passengerLng : null,
        },
        routeCoords: Array.isArray(published?.coords) ? published.coords : [],
        route: published?.route || null,
      };
    }

    function buildPassengerActiveRideFromPublishedRide(ride) {
      const normalized = normalizeRide(ride);
      if (!normalized) return null;
      const me = normalized.passengers.find(passenger => passenger.id === PASSENGER_PROFILE.id) || null;
      if (!me) return null;
      return {
        rideId: normalized.rideId,
        sourceType: 'carpool-published-ride',
        sourceRequestId: normalized.rideId,
        status: 'in_progress',
        startedAt: normalized.startedAt || new Date().toISOString(),
        role: 'passenger',
        capacity: normalized.capacity,
        passengers: normalized.passengers,
        driver: {
          id: normalized.driverId,
          fullName: normalized.fullName,
          phone: normalized.phone,
          carName: normalized.carName,
          licensePlate: normalized.licensePlate,
          lat: normalized.route?.start?.lat ?? normalized.start?.lat ?? null,
          lng: normalized.route?.start?.lng ?? normalized.start?.lng ?? null,
        },
        passenger: {
          id: me.id,
          fullName: me.name,
          phone: me.phone,
          lat: me.location?.lat,
          lng: me.location?.lng,
        },
        routeCoords: Array.isArray(normalized.route?.coords) ? normalized.route.coords : [],
        route: normalized.route,
      };
    }

    function activatePassengerRide(requestType, request) {
      const activeRide = buildPassengerActiveRide(requestType, request);
      localStorage.setItem(ACTIVE_RIDE_STORAGE_KEY, JSON.stringify(activeRide));
      writeInitialRidePositions(activeRide);
      window.location.href = 'my-map.html';
    }

    function maybeActivatePassengerRideAndRedirect() {
      const activeCarpoolRide = readPublishedRides()
        .map(normalizeRide)
        .filter(Boolean)
        .find(ride =>
          ride.status === 'in_progress' &&
          ride.passengers.some(passenger => passenger.id === PASSENGER_PROFILE.id)
        );
      if (activeCarpoolRide) {
        const activeRide = buildPassengerActiveRideFromPublishedRide(activeCarpoolRide);
        if (activeRide) {
          localStorage.setItem(ACTIVE_RIDE_STORAGE_KEY, JSON.stringify(activeRide));
          writeInitialRidePositions(activeRide);
          window.location.href = 'my-map.html';
          return true;
        }
      }
      return false;
    }

    function respondToDriverRequest(requestId, status) {
      const requests = readRideRequests();
      let driverName = 'Driver';
      const updatedRequests = requests.map(request => {
        if (request?.requestId !== requestId) return request;
        driverName = request.driverName || driverName;
        return {
          ...request,
          status,
          respondedAt: new Date().toISOString(),
          passengerConfirmed: status === 'accepted' ? false : request.passengerConfirmed,
          driverConfirmed: status === 'accepted' ? Boolean(request.driverConfirmed) : request.driverConfirmed,
          rideStartedAt: status === 'accepted' ? (request.rideStartedAt || null) : request.rideStartedAt,
        };
      });
      try {
        localStorage.setItem(REQUEST_STORAGE_KEY, JSON.stringify(updatedRequests.slice(-20)));
      } catch {
        setStatus('Could not update driver request', 'error');
        return;
      }
      renderRideRequests();
      setStatus(`${driverName} request ${status}`, status === 'accepted' ? 'success' : 'default');
    }

    function deleteDriverRequest(requestId) {
      const requests = readRideRequests().filter(request => request?.requestId !== requestId);
      try {
        localStorage.setItem(REQUEST_STORAGE_KEY, JSON.stringify(requests.slice(-20)));
      } catch {
        setStatus('Could not delete driver request', 'error');
        return;
      }
      clearActiveRideIfMatches(requestId);
      renderRideRequests();
      setStatus('Driver request deleted', 'default');
    }

    function deleteJoinUpdate(requestId) {
      const requests = readJoinRequests().filter(request => request?.requestId !== requestId);
      try {
        localStorage.setItem(JOIN_REQUEST_STORAGE_KEY, JSON.stringify(requests.slice(-20)));
      } catch {
        setStatus('Could not delete join update', 'error');
        return;
      }
      clearActiveRideIfMatches(requestId);
      loadRequestedDriverIds();
      renderRideRequests();
      setStatus('Join update deleted', 'default');
    }

    function formatRequestTime(timestamp) {
      const date = new Date(timestamp);
      if (Number.isNaN(date.getTime())) return 'Just now';
      return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    }

    function confirmPassengerRide(requestType, requestId) {
      if (requestType === 'join-update') {
        const requests = readJoinRequests();
        const updated = requests.map(request => {
          if (request?.requestId !== requestId) return request;
          const passengerConfirmed = true;
          const driverConfirmed = Boolean(request.driverConfirmed);
          return {
            ...request,
            passengerConfirmed,
            passengerConfirmedAt: new Date().toISOString(),
            rideStartedAt: passengerConfirmed && driverConfirmed ? (request.rideStartedAt || new Date().toISOString()) : request.rideStartedAt,
          };
        });
        try {
          localStorage.setItem(JOIN_REQUEST_STORAGE_KEY, JSON.stringify(updated.slice(-20)));
        } catch {
          setStatus('Could not confirm ride', 'error');
          return;
        }
      } else {
        const requests = readRideRequests();
        const updated = requests.map(request => {
          if (request?.requestId !== requestId) return request;
          const passengerConfirmed = true;
          const driverConfirmed = Boolean(request.driverConfirmed);
          return {
            ...request,
            passengerConfirmed,
            passengerConfirmedAt: new Date().toISOString(),
            rideStartedAt: passengerConfirmed && driverConfirmed ? (request.rideStartedAt || new Date().toISOString()) : request.rideStartedAt,
          };
        });
        try {
          localStorage.setItem(REQUEST_STORAGE_KEY, JSON.stringify(updated.slice(-20)));
        } catch {
          setStatus('Could not confirm ride', 'error');
          return;
        }
      }
      renderRideRequests();
      if (selectedDriver) renderDriverDetails(selectedDriver);
      maybeActivatePassengerRideAndRedirect();
      setStatus('Ride confirmed from your side', 'success');
    }

    function cancelPassengerRide(requestType, requestId) {
      if (requestType === 'join-update') {
        const requests = readJoinRequests();
        const updated = requests.map(request => {
          if (request?.requestId !== requestId) return request;
          return {
            ...request,
            status: 'cancelled',
            cancelledAt: new Date().toISOString(),
            passengerConfirmed: false,
            driverConfirmed: false,
            rideStartedAt: null,
          };
        });
        try {
          localStorage.setItem(JOIN_REQUEST_STORAGE_KEY, JSON.stringify(updated.slice(-20)));
        } catch {
          setStatus('Could not cancel ride', 'error');
          return;
        }
      } else {
        const requests = readRideRequests();
        const updated = requests.map(request => {
          if (request?.requestId !== requestId) return request;
          return {
            ...request,
            status: 'cancelled',
            cancelledAt: new Date().toISOString(),
            passengerConfirmed: false,
            driverConfirmed: false,
            rideStartedAt: null,
          };
        });
        try {
          localStorage.setItem(REQUEST_STORAGE_KEY, JSON.stringify(updated.slice(-20)));
        } catch {
          setStatus('Could not cancel ride', 'error');
          return;
        }
      }
      renderRideRequests();
      if (selectedDriver) renderDriverDetails(selectedDriver);
      clearActiveRideIfMatches(requestId);
      setStatus('Ride cancelled', 'default');
    }

    function endRideAsPassenger(requestType, requestId) {
      if (requestType === 'join-update') {
        const requests = readJoinRequests();
        const updated = requests.map(request => {
          if (request?.requestId !== requestId) return request;
          return {
            ...request,
            status: 'completed',
            completedAt: new Date().toISOString(),
          };
        });
        try {
          localStorage.setItem(JOIN_REQUEST_STORAGE_KEY, JSON.stringify(updated.slice(-20)));
        } catch {
          setStatus('Could not end ride', 'error');
          return;
        }
      } else {
        const requests = readRideRequests();
        const updated = requests.map(request => {
          if (request?.requestId !== requestId) return request;
          return {
            ...request,
            status: 'completed',
            completedAt: new Date().toISOString(),
          };
        });
        try {
          localStorage.setItem(REQUEST_STORAGE_KEY, JSON.stringify(updated.slice(-20)));
        } catch {
          setStatus('Could not end ride', 'error');
          return;
        }
      }
      renderRideRequests();
      if (selectedDriver) renderDriverDetails(selectedDriver);
      clearActiveRideIfMatches(requestId);
      setStatus('Ride marked as completed', 'success');
    }

    function renderRideRequests() {
      const driverRequests = readRideRequests()
        .filter(request => request?.passengerId === PASSENGER_PROFILE.id || request?.phone === PASSENGER_PROFILE.phone)
        .map(request => ({
          type: 'driver-request',
          requestId: request.requestId,
          title: request.driverName || request.fullName,
          phone: request.driverPhone || request.phone,
          sub: `${request.carName || 'Vehicle'} · ${(request.status || 'pending') === 'accepted' ? (request.driverPhone || request.phone) : 'Phone hidden until accepted'}`,
          meta: (request.status || 'pending') === 'pending'
            ? `Driver invite received at ${formatRequestTime(request.requestedAt)} · ${request.routeDistanceKm ?? '--'} km from route`
            : `${request.driverName || request.fullName} ${request.status} at ${formatRequestTime(request.respondedAt || request.requestedAt)}`,
          status: request.status || 'pending',
          statusLabel: (request.status || 'pending') === 'accepted' ? 'Accepted' : (request.status || 'pending') === 'rejected' ? 'Rejected' : (request.status || 'pending') === 'cancelled' ? 'Cancelled' : (request.status || 'pending') === 'completed' ? 'Completed' : 'Pending',
          arrivalTime: formatTime(request.arrivalTime) || null,
          passengerConfirmed: Boolean(request.passengerConfirmed),
          driverConfirmed: Boolean(request.driverConfirmed),
          rideStartedAt: request.rideStartedAt || null,
          sortAt: request.respondedAt || request.requestedAt,
        }));
      const joinUpdates = readJoinRequests()
        .filter(request => request?.passengerId === PASSENGER_PROFILE.id || request?.passengerPhone === PASSENGER_PROFILE.phone)
        .map(request => {
          const status = getJoinRequestStatus(request);
          return {
            type: 'join-update',
            requestId: request.requestId,
            title: request.driverName,
            phone: request.driverPhone,
            sub: `${request.carName} · ${status === 'accepted' ? request.driverPhone : 'Phone hidden until accepted'}`,
            meta: status === 'pending'
              ? `Waiting for ${request.driverName} to respond`
              : `${request.driverName} ${status} your request at ${formatRequestTime(request.respondedAt || request.requestedAt)}`,
            status,
            statusLabel: status === 'accepted' ? 'Accepted' : status === 'rejected' ? 'Rejected' : status === 'cancelled' ? 'Cancelled' : status === 'completed' ? 'Completed' : 'Pending',
            arrivalTime: formatTime(request.arrivalTime) || null,
            passengerConfirmed: Boolean(request.passengerConfirmed),
            driverConfirmed: Boolean(request.driverConfirmed),
            rideStartedAt: request.rideStartedAt || null,
            sortAt: request.respondedAt || request.requestedAt,
          };
        });
      const requests = [...joinUpdates, ...driverRequests]
        .sort((a, b) => new Date(b.sortAt).getTime() - new Date(a.sortAt).getTime());
      const list = document.getElementById('requestList');
      document.getElementById('requestCount').textContent = String(requests.length);
      if (!requests.length) {
        list.innerHTML = '<div class="panel-empty">Driver requests and ride updates will appear here.</div>';
        return;
      }
      list.innerHTML = requests.map(request => `
        <div class="request-row">
          <div class="request-top">
            <div class="request-name">${request.title}</div>
            <span class="request-status ${request.status}">${request.statusLabel}</span>
          </div>
          <div class="request-sub">${request.sub}</div>
          <div class="request-meta">${request.meta}</div>
          <div class="request-meta">${renderRideTime(request.arrivalTime)}</div>
          ${request.status === 'accepted' ? `<div class="request-meta">Confirmations: You ${request.passengerConfirmed ? 'confirmed' : 'pending'} · Other side ${request.driverConfirmed ? 'confirmed' : 'pending'}${request.rideStartedAt ? ` · Ride started ${formatRequestTime(request.rideStartedAt)}` : ''}</div>` : ''}
          ${request.type === 'driver-request' && request.status === 'pending' ? `
            <div class="request-actions">
              <button class="request-action-btn accept" type="button" onclick="respondToDriverRequest('${request.requestId}','accepted')">Accept</button>
              <button class="request-action-btn reject" type="button" onclick="respondToDriverRequest('${request.requestId}','rejected')">Reject</button>
            </div>
          ` : request.status === 'accepted' ? `
            <div class="request-actions">
              <button class="request-action-btn chat" type="button" onclick="openWhatsAppChat('${request.phone || ''}')">Chat</button>
              <button class="request-action-btn ${request.passengerConfirmed ? 'confirmed' : 'confirm'}" type="button" onclick="confirmPassengerRide('${request.type}','${request.requestId}')" ${request.passengerConfirmed ? 'disabled' : ''}>${request.passengerConfirmed ? 'Confirmed' : 'Confirm Ride'}</button>
              ${request.rideStartedAt
                ? `<button class="request-action-btn endride" type="button" onclick="endRideAsPassenger('${request.type}','${request.requestId}')">End Ride</button>`
                : `<button class="request-action-btn cancel" type="button" onclick="cancelPassengerRide('${request.type}','${request.requestId}')">Cancel</button>`}
            </div>
          ` : (request.status === 'rejected' || request.status === 'cancelled' || request.status === 'completed') ? `
            <div class="request-actions">
              <button class="request-action-btn delete" type="button" onclick="${request.type === 'driver-request' ? `deleteDriverRequest('${request.requestId}')` : `deleteJoinUpdate('${request.requestId}')`}">Delete</button>
            </div>
          ` : ''}
        </div>
      `).join('');
    }

    /* Update location status chip */
    function setLocStatus(text, state) {
      const el = document.getElementById('locStatus');
      el.className = 'loc-status' + (state ? ` state-${state}` : '');
      document.getElementById('locText').textContent = text;
    }

    /* Reveal Step 2 once a location method is chosen */
    /* Unlock the Find Ride button with a pop animation */
    function onLocationAcquired() {
      const btn = document.getElementById('btnFindRide');
      btn.disabled = false;
      btn.classList.add('btn-unlock-anim');
      btn.addEventListener('animationend', () => btn.classList.remove('btn-unlock-anim'), { once: true });
    }

    /* =====================================================================
       GEOMETRY HELPERS
    ===================================================================== */

   
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/* Minimum distance from passenger to a driver's OSRM route */
function distToPolyline(lat, lng, poly) {
  let min = Infinity;
  for (const pt of poly) {
    const d = haversine(lat, lng, pt[0], pt[1]);
    if (d < min) min = d;
  }
  return min;
}
    /* =====================================================================
        MATCH SCORING:
        */
       function matchScore(timeDetourPct, distanceDetourPct) {
        score=0.75*timeDetourPct+0.25*distanceDetourPct;
        return score;
       }

    /* ===================================================================== 
    
       PLACE PASSENGER MARKER
    ===================================================================== */
    function setPassenger(lat, lng) {
      passengerLat = lat;
      passengerLng = lng;
      if (passengerMarker) map.removeLayer(passengerMarker);
      passengerMarker = L.marker([lat, lng], { icon: passengerIcon }).addTo(map);
      updateVisibilityUI();
      writeVisibilityState();
    }

    /* =====================================================================
       CLICK-TO-PLACE  (toggle: press again to cancel)
    ===================================================================== */
    function enableClick() {
      const btn = document.getElementById('btnClickPlace');
      if (clickMode) {
        clickMode = false;
        btn.removeAttribute('data-loading');
        setStatus('Location placement cancelled');
        return;
      }
      clickMode = true;
      btn.setAttribute('data-loading', '');
      setStatus('Click anywhere on the map to set your location', 'loading');
    }

    map.on('click', e => {
      if (!clickMode) return;
      clickMode = false;
      document.getElementById('btnClickPlace').removeAttribute('data-loading');
      document.getElementById('btnClickPlace').classList.add('btn-loc-active');
      document.getElementById('btnLocate').classList.remove('btn-loc-active');
      setPassenger(e.latlng.lat, e.latlng.lng);
      map.setView(e.latlng, 14);
      onLocationAcquired();
      setStatus('Location placed — tap "Find Ride"', 'success');
    });

    /* =====================================================================
       LOCATE PASSENGER  (toggle: press again to cancel)
    ===================================================================== */
    let _locateWatchId = null;

    function locatePassenger() {
      const btn = document.getElementById('btnLocate');
      if (btn.hasAttribute('data-loading')) {
        if (_locateWatchId !== null) { navigator.geolocation.clearWatch(_locateWatchId); _locateWatchId = null; }
        btn.removeAttribute('data-loading');
        setStatus('Location search cancelled');
        return;
      }
      if (!navigator.geolocation) {
        setLocStatus('GPS not available — place manually', 'error');
        setStatus('Geolocation unavailable — use "Click to Place" instead', 'error');
        return;
      }
      btn.setAttribute('data-loading', '');
      setLocStatus('Detecting your location…', 'acquiring');
      setStatus('Acquiring your location…', 'loading');
      _locateWatchId = navigator.geolocation.watchPosition(
        pos => {
          navigator.geolocation.clearWatch(_locateWatchId);
          _locateWatchId = null;
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setPassenger(lat, lng);
          map.setView([lat, lng], 14);
          document.getElementById('btnLocate').classList.add('btn-loc-active');
          document.getElementById('btnClickPlace').classList.remove('btn-loc-active');
          setLocStatus('Location ready', 'set');
          onLocationAcquired();
          setStatus('Location set — tap "Find Ride"', 'success');
          btn.removeAttribute('data-loading');
        },
        err => {
          _locateWatchId = null;
          setLocStatus('GPS failed — place manually', 'error');
          setStatus(`Location error: ${err.message} — use "Click to Place"`, 'error');
          btn.removeAttribute('data-loading');
        },
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
      );
    }

    /* =====================================================================
       FIND RIDE  (toggle: press again to cancel)
    ===================================================================== */
    let _findRideAbort = null;

    async function findRide() {
      if (document.getElementById('btnFindRide').hasAttribute('data-loading')) {
        if (_findRideAbort) { _findRideAbort.abort(); _findRideAbort = null; }
        btnLoading('btnFindRide', false);
        setStatus('Ride search cancelled');
        return;
      }
      if (passengerLat === null) {
        setStatus('Your location is not set yet — allow GPS or use Click to Place', 'error');
        return;
      }
      btnLoading('btnFindRide', true);
      setStatus('Computing driver routes…', 'loading');
      driverLines.forEach(l => map.removeLayer(l)); driverLines = [];
      driverMarkers.forEach(entry => map.removeLayer(entry.marker)); driverMarkers = [];
      driverRoutes = [];
      setDriverPanelEmpty('Scanning for nearby drivers…', 'Scanning');
      const rowsEl = document.getElementById('driverRows');
      rowsEl.innerHTML = '';
      document.getElementById('driverListEmpty').classList.remove('hidden');
      document.getElementById('driverNearbyCount').textContent = '0';
      _findRideAbort = new AbortController();
      const signal = _findRideAbort.signal;
      const allCoords = [];
      const publishedRides = readPublishedRides();
      const publishedDriverIds = new Set(publishedRides.map(ride => ride?.driverId).filter(Boolean));
      try {
        for (const ride of publishedRides) {
          if (signal.aborted) break;
          if (!Array.isArray(ride?.coords) || ride.coords.length < 2) continue;
          const normalizedRide = normalizeRide(ride);
          if (!normalizedRide || normalizedRide.status !== 'waiting') continue;
          const start = ride.start && typeof ride.start.lat === 'number' && typeof ride.start.lng === 'number'
            ? [ride.start.lat, ride.start.lng]
            : ride.coords[0];
          const marker = L.marker(start, { icon: driverIcon, title: ride.fullName || 'Driver' }).addTo(map);
          marker.bindTooltip(
            `<div class="driver-tooltip">${ride.fullName || 'Driver'} (Published Ride)</div>`,
            { permanent: false, direction: 'top', opacity: 0.93 }
          );
          const durMin = Number(ride.durationMin) || 0;
          const driverObj = {
            id: `published-${ride.rideId || ride.driverId || Date.now()}`,
            rideId: ride.rideId || null,
            driverId: ride.driverId || ride.id,
            fullName: ride.fullName || 'Driver',
            phone: ride.phone || '+96170000000',
            carName: ride.carName || 'Vehicle',
            licensePlate: ride.licensePlate || 'N/A',
            coords: normalizedRide.coords,
            arrivalTime: formatTime(ride.arrivalTime) || null,
            durMin,
            marker,
            isPublishedRide: true,
            status: normalizedRide.status,
            capacity: normalizedRide.capacity,
            passengers: normalizedRide.passengers,
            route: normalizedRide.route,
          };
          driverRoutes.push(driverObj);
          allCoords.push(...normalizedRide.coords);
        }

        for (const dr of DRIVERS_DATA) {
          if (signal.aborted) break;
          if (publishedDriverIds.has(dr.id)) continue;
          try {
            const marker = L.marker([dr.lat, dr.lng], { icon: driverIcon, title: dr.fullName }).addTo(map);
            marker.bindTooltip(
              `<div class="driver-tooltip">${dr.fullName}</div>`,
              { permanent: false, direction: 'top', opacity: 0.93 }
            );
            const res  = await fetch(
              `${OSRM_BASE}/${dr.lng},${dr.lat};${CAMPUS_LNG},${CAMPUS_LAT}?overview=full&geometries=geojson`,
              { signal }
            );
            if (!res.ok) continue;
            const data = await res.json();
            if (!data.routes?.length) continue;
            const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
            const durMin = data.routes[0].duration / 60;
            driverRoutes.push({ ...dr, coords, durMin, marker });
            allCoords.push(...coords);
            const line = L.polyline(coords, { color: '#0072bb', weight: 4, opacity: 0.70 }).addTo(map);
            line.bindPopup(`<strong style="font-family:Inter,sans-serif">${dr.fullName}</strong>`);
            driverLines.push(line);
            await new Promise(r => setTimeout(r, 50));
          } catch { /* skip driver on fetch / parse error */ }
        }
        if (signal.aborted) { btnLoading('btnFindRide', false); return; }
        if (!driverRoutes.length) {
          setStatus('No driver routes could be loaded — check connection', 'error');
          btnLoading('btnFindRide', false);
          return;
        }
        if (allCoords.length) map.fitBounds(L.latLngBounds(allCoords), { padding: [28, 28] });
        setStatus('Matching drivers to your location…', 'loading');
        driverLines.forEach(l => map.removeLayer(l)); driverLines = [];
       
const scoredDrivers = [];

for (const dr of driverRoutes) {
  if (signal.aborted) break;

  const coords = dr.coords;
  if (!Array.isArray(coords) || coords.length < 2) continue;

  // Direct route baseline
  const directDurationMin = dr.durationMin;
  const directDistanceKm = dr.distanceKm ?? null; // if published ride contains distance
  let baselineDistanceKm = directDistanceKm;

  if (!baselineDistanceKm) {
    // Get baseline distance via OSRM (driver start → driver end/destination)
    try {
      const first = coords[0];
      const last = coords[coords.length - 1];
      const baselineUrl = `${OSRM_BASE}/${first[1]},${first[0]};${last[1]},${last[0]}?overview=false&geometries=geojson`;
      const baselineRes = await fetch(baselineUrl, { signal });
      if (baselineRes.ok) {
        const baselineData = await baselineRes.json();
        if (baselineData?.routes?.[0]?.distance) {
          baselineDistanceKm = baselineData.routes[0].distance / 1000;
        }
      }
    } catch {
      // Skip driver if baseline distance cannot be determined
    }
  }

  // Skip if we couldn't get baseline distance
  if (!baselineDistanceKm) continue;

  // Preliminary geometric filter: distance to route
  const offsetKm = distToPolyline(passengerLat, passengerLng, coords);
  if (offsetKm > 3) continue;

  let timeDetourPct = 0;
  let distanceDetourPct = 0;
  let pickupDistanceKm = null;
  let pickupDurationMin = null;

  try {
    const last = coords[coords.length - 1];
    const pickupUrl =
      `${OSRM_BASE}/${dr.coords[0][1]},${dr.coords[0][0]};` +
      `${passengerLng},${passengerLat};` +
      `${last[1]},${last[0]}?overview=false&geometries=geojson`;

    const pickupRes = await fetch(pickupUrl, { signal });

    if (pickupRes.ok) {
      const pickupData = await pickupRes.json();
      const route = pickupData?.routes?.[0];
      if (route) {
        const pickupDuration = route.duration / 60;
        const pickupDistance = route.distance / 1000;
        pickupDurationMin = pickupDuration;
        pickupDistanceKm = pickupDistance;

        if (directDurationMin > 0) {
          timeDetourPct = Math.max(
            0,
            ((pickupDuration - directDurationMin) / directDurationMin) * 100
          );
        }

        if (baselineDistanceKm > 0) {
          distanceDetourPct = Math.max(
            0,
            ((pickupDistance - baselineDistanceKm) / baselineDistanceKm) * 100
          );
        }
      }
    }
  } catch {
    timeDetourPct = 0;
    distanceDetourPct = 0;
  }

  const score = matchScore(timeDetourPct, distanceDetourPct);

  scoredDrivers.push({
    ...dr,
    timeDetourPct,
    distanceDetourPct,
    pickupDistanceKm,
    pickupDurationMin,
    score,
  });
}

        const ranked = scoredDrivers.sort((a, b) => (a.score - b.score));
        const best = ranked[0];
        
        // Clear driver list panel before rendering
        const list = document.getElementById('driverRows');
        list.innerHTML = '';
        document.getElementById('driverListEmpty').classList.add('hidden');
        
        // Render driver routes on map and populate driver list (sorted by compatibility score)
        ranked.forEach((dr, idx) => {
          const color    = dr.score < 15 ? '#16a34a' : dr.score < 25 ? '#f59e0b' : '#dc2626';
          const badgeCls = dr.score < 15 ? 'badge-green' : dr.score < 25 ? 'badge-orange' : 'badge-red';
          
          // Add driver route polyline to map
          const line = L.polyline(dr.coords, { color, weight: 5, opacity: 0.88 }).addTo(map);
          line.bindPopup(
            `<div style="font-family:Inter,sans-serif">
              <strong>${dr.fullName}</strong><br>
              <span style="color:#55606a">${dr.pickupDistanceKm?.toFixed(1) || '—'} km · ~${dr.pickupDurationMin?.toFixed(0) || '—'} min to ${dr.isPublishedRide ? 'destination' : 'campus'}</span><br>
              <span style="color:#002b59;font-weight:700">${renderRideTime(dr.arrivalTime)}</span>
            </div>`
          );
          line.on('click', ev => {
            driverLines.forEach(l => l.setStyle({ weight: 5, opacity: 0.45 }));
            line.setStyle({ weight: 7, opacity: 1 });
            line.openPopup(ev.latlng);
          });
          driverLines.push(line);
          
          // Bind popup to driver marker
          dr.marker.bindPopup(
            `<div style="font-family:Inter,sans-serif">
              <strong>${dr.fullName}</strong><br>
              <span style="color:#55606a">${dr.carName} · ${dr.licensePlate}${dr.isPublishedRide ? ' · Published route' : ''}</span><br>
              <span style="color:#002b59;font-weight:700">${renderRideTime(dr.arrivalTime)}</span>
            </div>`
          );
          dr.marker.on('click', () => selectDriver(dr.id));
          driverMarkers.push({ marker: dr.marker, driver: dr, line });
          
          // Add driver to sidebar list
          const row = document.createElement('div');
          row.className = 'driver-row';
          row.setAttribute('role', 'button');
          row.setAttribute('tabindex', '0');
          row.dataset.driverId = dr.id;
          row.dataset.arrivalTime = formatTime(dr.arrivalTime) || '';
          row.innerHTML = `
            <span class="driver-rank">${idx + 1}</span>
            <div class="driver-info">
              <div class="driver-name">${dr.fullName}</div>
              <div class="driver-sub">${dr.carName} · ~${dr.durMin.toFixed(0)} min ${dr.isPublishedRide ? 'custom route' : 'to campus'}</div>
              <div class="driver-time">${renderRideTime(dr.arrivalTime)} · Seats left: ${updateSeatCount(dr).seatsLeft}</div>
            </div>
            <span class="badge ${badgeCls}">${dr.score.toFixed(1)}</span>
          `;
          row.onclick = () => selectDriver(dr.id);
          list.appendChild(row);
        });
        
        // Update panel and status
        document.getElementById('driverNearbyCount').textContent = scoredDrivers.length;
        document.getElementById('driverNearbyPanel').classList.add('visible');
        
        // Choose color for top match (based on new score system)
        const bestColor =
          best.score < 15 ? 'success' :
          best.score < 25 ? 'loading' :
          'error';
        
        setStatus(`Best match: ${best.fullName}`, bestColor);

} catch (err) {
  if (err.name !== 'AbortError') {
    console.error('Find Ride error:', err);
    setStatus('Ride search failed — check connection', 'error');
  }
}

_findRideAbort = null;
btnLoading('btnFindRide', false);
}
    /* =====================================================================
       INIT  — no auto-location; user triggers it via button
    ===================================================================== */
    (() => {
      const saved = readVisibilityState();
      isLookingForRide = saved.visible;
      updateVisibilityUI();
    })();
    loadRequestedDriverIds();
    renderRideRequests();
    maybeActivatePassengerRideAndRedirect();
    window.addEventListener('storage', event => {
      if (event.key === REQUEST_STORAGE_KEY) {
        if (maybeActivatePassengerRideAndRedirect()) return;
        renderRideRequests();
        if (selectedDriver) renderDriverDetails(selectedDriver);
      }
      if (event.key === PASSENGER_VISIBILITY_KEY) {
        const saved = readVisibilityState();
        isLookingForRide = saved.visible;
        updateVisibilityUI();
      }
      if (event.key === JOIN_REQUEST_STORAGE_KEY) {
        if (maybeActivatePassengerRideAndRedirect()) return;
        loadRequestedDriverIds();
        renderRideRequests();
        if (selectedDriver) renderDriverDetails(selectedDriver);
      }
      if (event.key === ACTIVE_RIDE_STORAGE_KEY) {
        maybeActivatePassengerRideAndRedirect();
      }
      if (event.key === RIDE_PUBLISH_STORAGE_KEY) {
        if (selectedDriver?.isPublishedRide && selectedDriver?.rideId) {
          const latestSelected = readPublishedRides()
            .map(normalizeRide)
            .filter(Boolean)
            .find(ride => ride.rideId === selectedDriver.rideId);
          if (latestSelected) {
            selectedDriver = {
              ...selectedDriver,
              capacity: latestSelected.capacity,
              passengers: latestSelected.passengers,
              route: latestSelected.route,
              coords: latestSelected.coords,
              status: latestSelected.status,
            };
            renderDriverDetails(selectedDriver);
          }
        }
        setStatus('New published rides available. Tap Find Ride to refresh.', 'success');
      }
    });
    locatePassenger();
  