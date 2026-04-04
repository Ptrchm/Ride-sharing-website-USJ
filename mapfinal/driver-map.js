

    /* =====================================================================
       CONSTANTS
    ===================================================================== */
    const CAMPUS_LAT = 33.8654840;
    const CAMPUS_LNG = 35.5631210;
    const CAMPUS = { lat: CAMPUS_LAT, lng: CAMPUS_LNG };
    const OSRM_BASE  = 'https://router.project-osrm.org/route/v1/driving';
    const REQUEST_STORAGE_KEY = 'usj-rideshare-driver-requests';
    const PASSENGER_VISIBILITY_KEY = 'usj-rideshare-passenger-visibility';
    const JOIN_REQUEST_STORAGE_KEY = 'usj-rideshare-passenger-join-requests';
    const RIDE_PUBLISH_STORAGE_KEY = 'usj-rideshare-driver-published-rides';
    const ACTIVE_RIDE_STORAGE_KEY = 'usj-rideshare-active-ride';
    const ACTIVE_RIDE_POSITIONS_KEY = 'usj-rideshare-active-ride-positions';
    const DRIVER_PROFILE = {
      id: 'driver-live',
      fullName: 'Current Driver',
      phone: '+96170991009',
      carName: 'Ford Focus',
      licensePlate: 'R 881122',
    };

    // Passengers from various locations going TO campus (to_campus mode)
    const PASSENGERS = [
      { id: 'passenger-1',  fullName: 'Lina Haddad',    phone: '+96170111223', lat: 33.8695, lng: 35.5470, destination: 'Downtown Beirut' },
      { id: 'passenger-2',  fullName: 'Karim Nassar',   phone: '+96170111224', lat: 33.8705, lng: 35.5510, destination: 'Hamra Street' },
      { id: 'passenger-3',  fullName: 'Maya Khoury',    phone: '+96170111225', lat: 33.8660, lng: 35.5485, destination: 'Achrafieh' },
      { id: 'passenger-4',  fullName: 'Rami Saliba',    phone: '+96170111226', lat: 33.8650, lng: 35.5400, destination: 'Verdun' },
      { id: 'passenger-5',  fullName: 'Lea Abi Saab',   phone: '+96170111227', lat: 33.8720, lng: 35.5430, destination: 'Gemmayze' },
      { id: 'passenger-6',  fullName: 'Jad Tannous',    phone: '+96170111228', lat: 33.8635, lng: 35.5525, destination: 'Mar Mikhael' },
      { id: 'passenger-7',  fullName: 'Nadine Daher',   phone: '+96170111229', lat: 33.9000, lng: 35.5460, destination: 'Antelias' },
      { id: 'passenger-8',  fullName: 'Omar Ghosn',     phone: '+96170111230', lat: 33.8300, lng: 35.5450, destination: 'Jounieh' },
      { id: 'passenger-9',  fullName: 'Sara Aoun',      phone: '+96170111231', lat: 33.8680, lng: 35.5900, destination: 'Byblos' },
      { id: 'passenger-10', fullName: 'Tarek Yared',    phone: '+96170111232', lat: 33.8680, lng: 35.5000, destination: 'Dbayeh' },
      { id: 'passenger-11', fullName: 'Dana Sfeir',     phone: '+96170111233', lat: 33.8950, lng: 35.5700, destination: 'Kaslik' },
      { id: 'passenger-12', fullName: 'Samer Boueiz',   phone: '+96170111234', lat: 33.8450, lng: 35.5750, destination: 'Airport' },
      { id: 'passenger-13', fullName: 'Rita Farah',     phone: '+96170111235', lat: 33.8950, lng: 35.5200, destination: 'Nahr Ibrahim' },
      { id: 'passenger-14', fullName: 'Youssef Helou',  phone: '+96170111236', lat: 33.8450, lng: 35.5200, destination: 'Baabda' },
      { id: 'passenger-15', fullName: 'Celine Maalouf', phone: '+96170111237', lat: 33.9200, lng: 35.6200, destination: 'Tripoli' },
      { id: 'passenger-16', fullName: 'Elie Matar',     phone: '+96170111238', lat: 33.8200, lng: 35.4800, destination: 'Sidon' },
    ];

    // Students at campus wanting to go to various destinations (from_campus mode)
    const STUDENTS_AT_CAMPUS = [
      { id: 'student-1',  fullName: 'Hani Kabbani',     phone: '+96170222333', lat: CAMPUS_LAT, lng: CAMPUS_LNG, destination: 'Hamra', arrivalTime: '14:00' },
      { id: 'student-2',  fullName: 'Dina Mansour',     phone: '+96170222334', lat: CAMPUS_LAT, lng: CAMPUS_LNG, destination: 'Mar Roukos', arrivalTime: '15:30' },
      { id: 'student-3',  fullName: 'Fadi Harb',        phone: '+96170222335', lat: CAMPUS_LAT, lng: CAMPUS_LNG, destination: 'Achrafieh', arrivalTime: '14:45' },
      { id: 'student-4',  fullName: 'Lara Moussa',      phone: '+96170222336', lat: CAMPUS_LAT, lng: CAMPUS_LNG, destination: 'Ras Beirut', arrivalTime: '15:00' },
      { id: 'student-5',  fullName: 'Khalil Khalil',    phone: '+96170222337', lat: CAMPUS_LAT, lng: CAMPUS_LNG, destination: 'Gemmayze', arrivalTime: '16:00' },
      { id: 'student-6',  fullName: 'Rima Stephan',     phone: '+96170222338', lat: CAMPUS_LAT, lng: CAMPUS_LNG, destination: 'Mar Mikhael', arrivalTime: '14:30' },
      { id: 'student-7',  fullName: 'Tamim Sayah',      phone: '+96170222339', lat: CAMPUS_LAT, lng: CAMPUS_LNG, destination: 'Kaslik', arrivalTime: '15:45' },
      { id: 'student-8',  fullName: 'Nadia Fares',      phone: '+96170222340', lat: CAMPUS_LAT, lng: CAMPUS_LNG, destination: 'South Beirut', arrivalTime: '16:30' },
      { id: 'student-9',  fullName: 'Wessam Rahhal',    phone: '+96170222341', lat: CAMPUS_LAT, lng: CAMPUS_LNG, destination: 'Jounieh', arrivalTime: '15:15' },
      { id: 'student-10', fullName: 'Maya Sarkis',      phone: '+96170222342', lat: CAMPUS_LAT, lng: CAMPUS_LNG, destination: 'Hadath', arrivalTime: '14:00' },
      { id: 'student-11', fullName: 'Karim Abboud',     phone: '+96170222343', lat: CAMPUS_LAT, lng: CAMPUS_LNG, destination: 'Antelias', arrivalTime: '15:20' },
      { id: 'student-12', fullName: 'Zahra Daher',      phone: '+96170222344', lat: CAMPUS_LAT, lng: CAMPUS_LNG, destination: 'Baabda', arrivalTime: '16:15' },
    ];

    // Destination coordinates for students' destinations
    // City names now match the actual coordinates
    const STUDENT_DESTINATIONS = {
      'Hamra': { lat: 33.8695, lng: 35.5470 },
      'Mar Roukos': { lat: 33.8705, lng: 35.5510 },
      'Achrafieh': { lat: 33.8660, lng: 35.5485 },
      'Ras Beirut': { lat: 33.8650, lng: 35.5400 },
      'Gemmayze': { lat: 33.8720, lng: 35.5430 },
      'Mar Mikhael': { lat: 33.8635, lng: 35.5525 },
      'Kaslik': { lat: 33.9000, lng: 35.5460 },
      'South Beirut': { lat: 33.8300, lng: 35.5450 },
      'Jounieh': { lat: 33.8680, lng: 35.5900 },
      'Hadath': { lat: 33.8680, lng: 35.5000 },
      'Antelias': { lat: 33.8950, lng: 35.5700 },
      'Baabda': { lat: 33.8450, lng: 35.5750 },
    };

    /* =====================================================================
       TRIP TYPE STATE & HANDLERS (for driver perspective bidirectional logic)
    ===================================================================== */
    let tripType = 'to_campus'; // 'to_campus' or 'from_campus'

    function setTripType(type) {
      tripType = type === 'to_campus' ? 'to_campus' : 'from_campus';
      console.log('[TRIP TYPE]', tripType);
      
      // Update button UI
      const toBtn = document.getElementById('tripTypeToClicked');
      const fromBtn = document.getElementById('tripTypeFromClicked');
      
      if (toBtn) {
        if (tripType === 'to_campus') {
          toBtn.classList.add('active');
        } else {
          toBtn.classList.remove('active');
        }
      }
      
      if (fromBtn) {
        if (tripType === 'from_campus') {
          fromBtn.classList.add('active');
        } else {
          fromBtn.classList.remove('active');
        }
      }
      
      // Update note
      const noteEl = document.getElementById('tripTypeNote');
      if (noteEl) {
        const noteText = tripType === 'to_campus' 
          ? 'Pick up passengers from various locations heading TO campus.'
          : 'Pick up students FROM campus heading to various destinations.';
        noteEl.textContent = noteText;
      }
    }

    function getPassengersForTripType() {
      // Returns the list of available passengers based on trip type
      // "to_campus" mode: Regular PASSENGERS (going to campus)
      // "from_campus" mode: STUDENTS_AT_CAMPUS (at campus going to various destinations)
      if (tripType === 'from_campus') {
        return STUDENTS_AT_CAMPUS.map(student => {
          const destCoords = STUDENT_DESTINATIONS[student.destination];
          return {
            ...student,
            destinationLat: destCoords.lat,
            destinationLng: destCoords.lng,
            pickupLat: CAMPUS_LAT,
            pickupLng: CAMPUS_LNG,
            isStudent: true,
          };
        });
      }
      // Default: to_campus mode uses PASSENGERS going to campus
      return PASSENGERS.map(p => ({
        ...p,
        pickupLat: p.lat,
        pickupLng: p.lng,
        destinationLat: CAMPUS_LAT,
        destinationLng: CAMPUS_LNG,
        isStudent: false,
      }));
    }

    function getDriverDestinationForTripType() {
      // Returns the driver's final destination based on trip type
      // Both modes: driver goes to their actual GPS location (home)
      return { lat: driverLat, lng: driverLng };
    }

    /* =====================================================================
       COLLAPSE/EXPAND PANEL FUNCTIONS
    ===================================================================== */
    function togglePassengerPanel() {
      const panel = document.getElementById('passengerPanel');
      panel.classList.toggle('collapsed');
      localStorage.setItem('usj-rideshare-passenger-panel-collapsed', panel.classList.contains('collapsed'));
    }

    function toggleDriverControls() {
      const controls = document.querySelector('.controls');
      controls.classList.toggle('collapsed');
      localStorage.setItem('usj-rideshare-driver-controls-collapsed', controls.classList.contains('collapsed'));
    }

    function toggleRequestInbox() {
      const inbox = document.getElementById('requestInbox');
      inbox.classList.toggle('collapsed');
      localStorage.setItem('usj-rideshare-request-inbox-collapsed', inbox.classList.contains('collapsed'));
    }

    function togglePassengerRankPanel() {
      const panel = document.getElementById('passengerRankPanel');
      panel.classList.toggle('collapsed');
      localStorage.setItem('usj-rideshare-passenger-rank-collapsed', panel.classList.contains('collapsed'));
    }

    /* Initialize collapse button listeners */
    document.addEventListener('DOMContentLoaded', () => {
      document.getElementById('driverControlsCollapseBtn')?.addEventListener('click', toggleDriverControls);
      document.getElementById('passengerPanelCollapseBtn')?.addEventListener('click', togglePassengerPanel);
      document.getElementById('requestInboxCollapseBtn')?.addEventListener('click', toggleRequestInbox);
      document.getElementById('passengerRankCollapseBtn')?.addEventListener('click', togglePassengerRankPanel);

      // Clear passenger panel collapsed state to show it by default
      localStorage.removeItem('usj-rideshare-passenger-panel-collapsed');
      
      // Restore join request inbox collapsed state from localStorage
      if (localStorage.getItem('usj-rideshare-request-inbox-collapsed') === 'true') {
        document.getElementById('requestInbox')?.classList.add('collapsed');
      }
      if (localStorage.getItem('usj-rideshare-driver-controls-collapsed') === 'true') {
        document.querySelector('.controls')?.classList.add('collapsed');
      }
      if (localStorage.getItem('usj-rideshare-passenger-rank-collapsed') === 'true') {
        document.getElementById('passengerRankPanel')?.classList.add('collapsed');
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
              font-family="Inter,system-ui,sans-serif" font-weight="800" letter-spacing="0.02em">USJ</text>
      </svg>`,
      iconSize: [34, 42], iconAnchor: [17, 42],
    });

    L.marker([CAMPUS_LAT, CAMPUS_LNG], { icon: campusIcon })
      .addTo(map)
      .bindPopup('<strong style="font-family:Inter,sans-serif;color:#002b59">Campus USJ</strong>');

    /* Driver icon — red pin */
    const driverIcon = L.divIcon({
      className: '',
      html: `<svg width="38" height="46" viewBox="0 0 38 46">
        <defs>
          <filter id="ds" x="-40%" y="-30%" width="180%" height="160%">
            <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="rgba(0,0,0,0.32)"/>
          </filter>
          <radialGradient id="dg" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stop-color="#f87171"/>
            <stop offset="100%" stop-color="#b91c1c"/>
          </radialGradient>
        </defs>
        <path d="M19 2C11.27 2 5 8.27 5 16c0 11.8 14 28 14 28S33 27.8 33 16C33 8.27 26.73 2 19 2z"
              fill="url(#dg)" filter="url(#ds)" stroke="rgba(255,255,255,0.85)" stroke-width="1.4"/>
        <circle cx="19" cy="16" r="6.5" fill="rgba(255,255,255,0.95)"/>
        <circle cx="19" cy="16" r="3.5" fill="#dc2626"/>
      </svg>`,
      iconSize: [38, 46], iconAnchor: [19, 46],
    });

    /* =====================================================================
       STATE
    ===================================================================== */
    let driverLat         = null;
    let driverLng         = null;
    let driverMarker      = null;
    let routeCoords       = [];
    let originalDuration  = null;
    let originalDistanceKm = null;
    let routeLine         = null;
    let createRideLine    = null;
    let manualPointMarkers = [];
    let passengerMarkers  = [];
    let passengerRoutes   = [];
    let clickMode         = false;
    let selectedPassenger = null;
    let createRideOpen    = false;
    let createRideMode    = 'automatic';
    let manualPickMode    = null;
    let autoRouteOptions  = [];
    let selectedAutoRouteIndex = -1;
    let pendingPublishedRide = null;
    let selectedRideTime  = '';
    let selectedRideCapacity = null;
    const manualRouteDraft = {
      stops: [],
    };
    const requestedPassengerIds = new Set();

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

    function clampDriverMapZoom(minZoom = 12) {
      if (map.getZoom() < minZoom && driverLat !== null && driverLng !== null) {
        map.setView([driverLat, driverLng], minZoom);
      }
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

    function setRideTime(value) {
      selectedRideTime = formatTime(value);
      document.getElementById('rideTimeSummary').textContent = selectedRideTime
        ? `Your ride is scheduled for ${selectedRideTime}.`
        : 'Your ride is not scheduled yet. Choose an arrival time.';
      setPublishEnabled(Boolean(pendingPublishedRide));
    }

    function setRideCapacity(value) {
      const parsed = Number.parseInt(String(value || '').trim(), 10);
      selectedRideCapacity = Number.isInteger(parsed) && parsed > 0 ? parsed : null;
      document.getElementById('rideCapacitySummary').textContent = selectedRideCapacity
        ? `Capacity set to ${selectedRideCapacity} seat${selectedRideCapacity !== 1 ? 's' : ''}.`
        : 'Capacity is required and must be greater than 0.';
      setPublishEnabled(Boolean(pendingPublishedRide));
      renderDriverRideSummary();
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

    function setCreateRideNote(text) {
      document.getElementById('createRideNote').textContent = text;
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

    function clearCreateRidePreview() {
      if (createRideLine) {
        map.removeLayer(createRideLine);
        createRideLine = null;
      }
    }

    function setPublishEnabled(routeReady) {
      const timeReady = Boolean(formatTime(selectedRideTime));
      const capacityReady = Number.isInteger(selectedRideCapacity) && selectedRideCapacity > 0;
      document.getElementById('btnPublishRide').disabled = !(routeReady && timeReady && capacityReady);
    }

    function readDriverRides() {
      return readPublishedRides().filter(ride => ride?.driverId === DRIVER_PROFILE.id);
    }

    function getLatestDriverRide(statuses = []) {
      const rides = readDriverRides().filter(ride => {
        if (!statuses.length) return true;
        return statuses.includes(ride?.status || 'waiting');
      });
      return rides.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())[0] || null;
    }

    function persistUpdatedRide(updatedRide) {
      if (!updatedRide?.rideId) return false;
      const allRides = readPublishedRides();
      let didUpdate = false;
      const next = allRides.map(ride => {
        if (ride?.rideId !== updatedRide.rideId) return ride;
        didUpdate = true;
        return updatedRide;
      });
      if (!didUpdate) next.push(updatedRide);
      try {
        localStorage.setItem(RIDE_PUBLISH_STORAGE_KEY, JSON.stringify(next.slice(-40)));
        return true;
      } catch {
        return false;
      }
    }

    function toPassengerRideEntry(passengerLike) {
      if (!passengerLike) return null;
      const id = passengerLike.id || passengerLike.passengerId;
      if (!id) return null;
      const lat = passengerLike.location?.lat ?? passengerLike.lat;
      const lng = passengerLike.location?.lng ?? passengerLike.lng;
      return {
        id,
        name: passengerLike.name || passengerLike.fullName || passengerLike.passengerName || 'Passenger',
        location: {
          lat: typeof lat === 'number' ? lat : null,
          lng: typeof lng === 'number' ? lng : null,
        },
        phone: passengerLike.phone || passengerLike.passengerPhone || '+96170000000',
      };
    }

    function normalizeRide(ride) {
      if (!ride) return null;
      const capacity = Number.parseInt(String(ride.capacity ?? ride.availableSeats ?? 0), 10);
      const normalizedPassengers = (Array.isArray(ride.passengers) ? ride.passengers : [])
        .map(toPassengerRideEntry)
        .filter(Boolean)
        .filter((passenger, idx, arr) => arr.findIndex(item => item.id === passenger.id) === idx);
      const start = ride.route?.start || ride.start || { lat: driverLat, lng: driverLng };
      const destination = ride.route?.destination || ride.destination || { lat: CAMPUS_LAT, lng: CAMPUS_LNG };
      const routeCoords = Array.isArray(ride.route?.coords)
        ? ride.route.coords
        : (Array.isArray(ride.coords) ? ride.coords : []);
      return {
        ...ride,
        capacity: Number.isInteger(capacity) && capacity > 0 ? capacity : 1,
        passengers: normalizedPassengers,
        status: ride.status || 'waiting',
        route: {
          start,
          destination,
          pickupPoints: Array.isArray(ride.route?.pickupPoints) ? ride.route.pickupPoints : normalizedPassengers.map(passenger => ({
            passengerId: passenger.id,
            name: passenger.name,
            lat: passenger.location?.lat,
            lng: passenger.location?.lng,
          })),
          coords: routeCoords,
          durationMin: Number(ride.route?.durationMin ?? ride.durationMin ?? 0),
          distanceKm: Number(ride.route?.distanceKm ?? ride.distanceKm ?? 0),
        },
      };
    }

    function updateSeatCount(ride) {
      const normalized = normalizeRide(ride);
      if (!normalized) return { passengers: 0, capacity: 0, seatsLeft: 0 };
      const passengers = normalized.passengers.length;
      const capacity = normalized.capacity;
      const seatsLeft = Math.max(0, capacity - passengers);
      const summary = `Passengers: ${passengers} / ${capacity} · Seats left: ${seatsLeft}`;
      const startNote = document.getElementById('startRideNote');
      if (startNote) startNote.textContent = summary;
      return { passengers, capacity, seatsLeft };
    }

    function renderDriverRideSummary() {
      const waitingRide = getLatestDriverRide(['waiting']) || getLatestDriverRide(['in_progress']) || getLatestDriverRide();
      const startBtn = document.getElementById('btnStartRide');
      if (!waitingRide) {
        if (startBtn) startBtn.disabled = true;
        updateSeatCount({ capacity: selectedRideCapacity || 0, passengers: [] });
        return;
      }
      const normalizedRide = normalizeRide(waitingRide);
      const seatInfo = updateSeatCount(normalizedRide);
      if (startBtn) {
        startBtn.disabled = normalizedRide.status !== 'waiting' || seatInfo.passengers < 1;
      }
      if (Array.isArray(normalizedRide.route?.coords) && normalizedRide.route.coords.length > 1) {
        routeCoords = normalizedRide.route.coords;
        if (routeLine) map.removeLayer(routeLine);
        routeLine = L.polyline(routeCoords, { color: '#0072bb', weight: 5, opacity: 0.88 }).addTo(map);
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
        const [next] = remaining.splice(bestIndex, 1);
        ordered.push(next);
        current = {
          lat: next.location?.lat,
          lng: next.location?.lng,
        };
      }
      return ordered;
    }

    async function updateRouteWithPassengers(ride) {
      const normalized = normalizeRide(ride);
      if (!normalized) return null;
      const start = normalized.route.start;
      const destination = normalized.route.destination;
      const validPassengers = normalized.passengers.filter(passenger =>
        typeof passenger.location?.lat === 'number' && typeof passenger.location?.lng === 'number'
      );
      const orderedPassengers = orderPassengerPickupsNearestFirst(start, validPassengers);
      const points = [
        { lat: start.lat, lng: start.lng },
        ...orderedPassengers.map(passenger => ({ lat: passenger.location.lat, lng: passenger.location.lng })),
        { lat: destination.lat, lng: destination.lng },
      ];
      const coordString = points.map(point => `${point.lng},${point.lat}`).join(';');
      let coords = Array.isArray(normalized.route.coords) ? normalized.route.coords : [];
      let durationMin = Number(normalized.route.durationMin || 0);
      let distanceKm = Number(normalized.route.distanceKm || 0);
      try {
        const res = await fetch(`${OSRM_BASE}/${coordString}?overview=full&geometries=geojson`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.routes) && data.routes[0]) {
            coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
            durationMin = data.routes[0].duration / 60;
            distanceKm = data.routes[0].distance / 1000;
          }
        }
      } catch {
        // Keep the existing route if OSRM is unavailable.
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
      const nextPassenger = toPassengerRideEntry(passenger);
      if (!normalized || !nextPassenger) {
        return { ok: false, message: 'Invalid passenger request', ride: normalized };
      }
      if (normalized.passengers.some(entry => entry.id === nextPassenger.id)) {
        return { ok: true, message: 'Passenger already joined', ride: normalized };
      }
      if (normalized.passengers.length >= normalized.capacity) {
        return { ok: false, message: 'Ride is full', ride: normalized };
      }
      const withPassenger = {
        ...normalized,
        passengers: [...normalized.passengers, nextPassenger],
      };
      const updatedRide = await updateRouteWithPassengers(withPassenger);
      return { ok: true, message: 'Passenger joined successfully', ride: updatedRide || withPassenger };
    }

    function removePassengerFromRide(ride, passengerId) {
      const normalized = normalizeRide(ride);
      if (!normalized) return null;
      return {
        ...normalized,
        passengers: normalized.passengers.filter(passenger => passenger.id !== passengerId),
      };
    }

    function buildDriverActiveRideFromPublishedRide(ride) {
      const normalized = normalizeRide(ride);
      const firstPassenger = normalized.passengers[0] || null;
      return {
        rideId: normalized.rideId || `active-${Date.now()}`,
        sourceType: 'carpool-published-ride',
        sourceRequestId: normalized.rideId || null,
        status: 'in_progress',
        startedAt: normalized.startedAt || new Date().toISOString(),
        role: 'driver',
        capacity: normalized.capacity,
        passengers: normalized.passengers,
        driver: {
          id: DRIVER_PROFILE.id,
          fullName: DRIVER_PROFILE.fullName,
          phone: DRIVER_PROFILE.phone,
          carName: DRIVER_PROFILE.carName,
          licensePlate: DRIVER_PROFILE.licensePlate,
          lat: typeof driverLat === 'number' ? driverLat : normalized.route.start?.lat,
          lng: typeof driverLng === 'number' ? driverLng : normalized.route.start?.lng,
        },
        passenger: firstPassenger ? {
          id: firstPassenger.id,
          fullName: firstPassenger.name,
          phone: firstPassenger.phone,
          lat: firstPassenger.location?.lat,
          lng: firstPassenger.location?.lng,
        } : null,
        routeCoords: Array.isArray(normalized.route.coords) ? normalized.route.coords : [],
        route: normalized.route,
      };
    }

    function startRide() {
      const waitingRide = getLatestDriverRide(['waiting']);
      if (!waitingRide) {
        setStatus('Publish a waiting ride before starting', 'error');
        return;
      }
      const normalizedRide = normalizeRide(waitingRide);
      if (normalizedRide.passengers.length < 1) {
        setStatus('At least one passenger must join before starting', 'error');
        return;
      }
      if (normalizedRide.passengers.length === normalizedRide.capacity) {
        const confirmed = window.confirm('Ride is full. Start now?');
        if (!confirmed) {
          setStatus('Ride start cancelled', 'default');
          return;
        }
      }
      const inProgressRide = {
        ...normalizedRide,
        status: 'in_progress',
        startedAt: new Date().toISOString(),
      };
      if (!persistUpdatedRide(inProgressRide)) {
        setStatus('Could not start ride in this browser', 'error');
        return;
      }
      const activeRide = buildDriverActiveRideFromPublishedRide(inProgressRide);
      localStorage.setItem(ACTIVE_RIDE_STORAGE_KEY, JSON.stringify(activeRide));
      writeInitialRidePositions(activeRide);
      renderDriverRideSummary();
      setStatus('Ride started. Redirecting to my-map...', 'success');
      window.location.href = 'my-map.html';
    }

    function renderAutoRouteOptions() {
      const container = document.getElementById('autoRouteOptions');
      if (!autoRouteOptions.length) {
        container.innerHTML = '<div class="ride-help">No automatic options found. Try refreshing GPS.</div>';
        return;
      }
      container.innerHTML = autoRouteOptions.map((opt, idx) => `
        <button class="route-option ${idx === selectedAutoRouteIndex ? 'active' : ''}" type="button" onclick="selectAutoRouteOption(${idx})">
          Option ${idx + 1} · ${opt.distanceKm.toFixed(1)} km · ~${opt.durationMin.toFixed(0)} min
        </button>
      `).join('');
    }

    async function buildAutoRouteOptions() {
      if (driverLat === null || driverLng === null) {
        setCreateRideNote('Set your location first to create automatic routes.');
        setPublishEnabled(false);
        return;
      }
      setCreateRideNote('Loading automatic routes...');
      try {
        const url = `${OSRM_BASE}/${driverLng},${driverLat};${CAMPUS_LNG},${CAMPUS_LAT}?overview=full&geometries=geojson&alternatives=true`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Unable to compute routes');
        const data = await res.json();
        const routes = Array.isArray(data.routes) ? data.routes.slice(0, 3) : [];
        autoRouteOptions = routes.map(route => ({
          coords: route.geometry.coordinates.map(c => [c[1], c[0]]),
          durationMin: route.duration / 60,
          distanceKm: route.distance / 1000,
        }));
        selectedAutoRouteIndex = autoRouteOptions.length ? 0 : -1;
        renderAutoRouteOptions();
        if (selectedAutoRouteIndex >= 0) {
          selectAutoRouteOption(selectedAutoRouteIndex);
        } else {
          setCreateRideNote('No automatic route options found.');
          setPublishEnabled(false);
        }
      } catch {
        autoRouteOptions = [];
        selectedAutoRouteIndex = -1;
        renderAutoRouteOptions();
        setCreateRideNote('Automatic routing failed. You can use manual mode.');
        setPublishEnabled(false);
      }
    }

    function selectAutoRouteOption(index) {
      if (index < 0 || index >= autoRouteOptions.length) return;
      selectedAutoRouteIndex = index;
      const selected = autoRouteOptions[index];
      clearCreateRidePreview();
      createRideLine = L.polyline(selected.coords, { color: '#0ea5e9', weight: 6, opacity: 0.92 }).addTo(map);
      map.fitBounds(createRideLine.getBounds(), { padding: [42, 42] });
      pendingPublishedRide = {
        routeType: 'automatic',
        start: { lat: driverLat, lng: driverLng },
        destination: { lat: CAMPUS_LAT, lng: CAMPUS_LNG },
        stops: [],
        coords: selected.coords,
        durationMin: selected.durationMin,
        distanceKm: selected.distanceKm,
      };
      setCreateRideNote(`Automatic option ${index + 1} selected. Set arrival time, then publish.`);
      setPublishEnabled(Boolean(pendingPublishedRide));
      renderAutoRouteOptions();
    }

    function clearManualPointMarkers() {
      manualPointMarkers.forEach(marker => map.removeLayer(marker));
      manualPointMarkers = [];
    }

    function renderManualPointMarkers() {
      clearManualPointMarkers();
      if (driverLat !== null && driverLng !== null) {
        manualPointMarkers.push(
          L.circleMarker([driverLat, driverLng], {
            radius: 7, color: '#0369a1', fillColor: '#38bdf8', fillOpacity: 0.95, weight: 2,
          }).addTo(map).bindTooltip('Start')
        );
      }
      manualRouteDraft.stops.forEach((stop, idx) => {
        manualPointMarkers.push(
          L.circleMarker([stop.lat, stop.lng], {
            radius: 6, color: '#92400e', fillColor: '#f59e0b', fillOpacity: 0.95, weight: 2,
          }).addTo(map).bindTooltip(`Stop ${idx + 1}`)
        );
      });
      manualPointMarkers.push(
        L.circleMarker([CAMPUS_LAT, CAMPUS_LNG], {
          radius: 7, color: '#7f1d1d', fillColor: '#ef4444', fillOpacity: 0.95, weight: 2,
        }).addTo(map).bindTooltip('Destination (USJ Campus)')
      );
    }

    async function buildManualRoutePreview() {
      if (driverLat === null || driverLng === null) {
        pendingPublishedRide = null;
        setPublishEnabled(false);
        setCreateRideNote('Set your location first to build the manual route.');
        clearCreateRidePreview();
        return;
      }
      const points = [{ lat: driverLat, lng: driverLng }, ...manualRouteDraft.stops, { lat: CAMPUS_LAT, lng: CAMPUS_LNG }];
      const pointString = points.map(point => `${point.lng},${point.lat}`).join(';');
      setCreateRideNote('Building manual route...');
      try {
        const res = await fetch(`${OSRM_BASE}/${pointString}?overview=full&geometries=geojson`);
        if (!res.ok) throw new Error('Manual routing failed');
        const data = await res.json();
        if (!data.routes?.length) throw new Error('No manual route returned');
        const route = data.routes[0];
        const coords = route.geometry.coordinates.map(c => [c[1], c[0]]);
        clearCreateRidePreview();
        createRideLine = L.polyline(coords, { color: '#0ea5e9', weight: 6, opacity: 0.92 }).addTo(map);
        pendingPublishedRide = {
          routeType: 'manual',
          start: { lat: driverLat, lng: driverLng },
          destination: { lat: CAMPUS_LAT, lng: CAMPUS_LNG },
          stops: [...manualRouteDraft.stops],
          coords,
          durationMin: route.duration / 60,
          distanceKm: route.distance / 1000,
        };
        setCreateRideNote(`Manual route ready (${manualRouteDraft.stops.length} stop${manualRouteDraft.stops.length !== 1 ? 's' : ''}). Set arrival time, then publish.`);
        setPublishEnabled(Boolean(pendingPublishedRide));
      } catch {
        pendingPublishedRide = null;
        setPublishEnabled(false);
        setCreateRideNote('Could not compute manual route. Try changing points.');
      }
    }

    function enableManualPointPick(type) {
      if (type !== 'stop') return;
      manualPickMode = type;
      setStatus('Click map to add a stop', 'loading');
    }

    function clearManualRoutePoints() {
      manualRouteDraft.stops = [];
      manualPickMode = null;
      pendingPublishedRide = null;
      clearCreateRidePreview();
      clearManualPointMarkers();
      renderManualPointMarkers();
      buildManualRoutePreview();
      setCreateRideNote('Manual route cleared. Direct route is ready; add stops if needed.');
      setStatus('Manual stops cleared', 'default');
    }

    function setCreateMode(mode) {
      createRideMode = mode;
      const autoBtn = document.getElementById('createModeAutoBtn');
      const manualBtn = document.getElementById('createModeManualBtn');
      autoBtn.classList.toggle('active', mode === 'automatic');
      manualBtn.classList.toggle('active', mode === 'manual');
      document.getElementById('autoRouteBuilder').classList.toggle('hidden', mode !== 'automatic');
      document.getElementById('manualRouteBuilder').classList.toggle('hidden', mode !== 'manual');
      pendingPublishedRide = null;
      setPublishEnabled(false);
      if (mode === 'automatic') {
        clearManualPointMarkers();
        manualPickMode = null;
        buildAutoRouteOptions();
      } else {
        autoRouteOptions = [];
        selectedAutoRouteIndex = -1;
        renderAutoRouteOptions();
        clearCreateRidePreview();
        renderManualPointMarkers();
        setCreateRideNote('Manual mode active. Start is your location and destination is USJ campus. Add optional stops.');
        buildManualRoutePreview();
      }
    }

    function toggleCreateRidePanel() {
      const panel = document.getElementById('createRidePanel');
      const rankPanel = document.getElementById('passengerRankPanel');
      createRideOpen = !createRideOpen;
      panel.classList.toggle('hidden', !createRideOpen);
      rankPanel?.classList.toggle('hidden-by-create-ride', createRideOpen);
      if (!createRideOpen) {
        manualPickMode = null;
        setStatus('Create Ride closed', 'default');
        return;
      }
      if (driverLat === null || driverLng === null) {
        setCreateRideNote('Set your location first to create a ride.');
        setStatus('Set your location first (Step 1)', 'error');
        return;
      }
      setRideTime(document.getElementById('rideArrivalTime')?.value || '');
      setCreateMode(createRideMode);
      setStatus('Create Ride opened. Choose automatic or manual route.', 'success');
    }

    function publishRide() {
      if (!pendingPublishedRide) {
        setStatus('Create a valid route first', 'error');
        return;
      }
      if (!isValidTimeValue(selectedRideTime)) {
        setStatus('Select a valid arrival time before publishing', 'error');
        setCreateRideNote('Arrival time is required to publish your ride.');
        return;
      }
      if (!Number.isInteger(selectedRideCapacity) || selectedRideCapacity <= 0) {
        setStatus('Enter a valid capacity before publishing', 'error');
        setCreateRideNote('Available seats are required and must be greater than 0.');
        return;
      }
      const rideRecord = {
        rideId: `ride-${Date.now()}`,
        driverId: DRIVER_PROFILE.id,
        fullName: DRIVER_PROFILE.fullName,
        phone: DRIVER_PROFILE.phone,
        carName: DRIVER_PROFILE.carName,
        licensePlate: DRIVER_PROFILE.licensePlate,
        capacity: selectedRideCapacity,
        passengers: [],
        status: 'waiting',
        routeType: pendingPublishedRide.routeType,
        start: pendingPublishedRide.start,
        destination: pendingPublishedRide.destination,
        stops: pendingPublishedRide.stops,
        coords: pendingPublishedRide.coords,
        route: {
          start: pendingPublishedRide.start,
          destination: pendingPublishedRide.destination,
          pickupPoints: [],
          coords: pendingPublishedRide.coords,
          durationMin: Number(pendingPublishedRide.durationMin.toFixed(1)),
          distanceKm: Number(pendingPublishedRide.distanceKm.toFixed(2)),
        },
        durationMin: Number(pendingPublishedRide.durationMin.toFixed(1)),
        distanceKm: Number(pendingPublishedRide.distanceKm.toFixed(2)),
        arrivalTime: formatTime(selectedRideTime),
        createdAt: new Date().toISOString(),
      };
      const rides = readPublishedRides().filter(ride => ride?.driverId !== DRIVER_PROFILE.id);
      rides.push(rideRecord);
      try {
        localStorage.setItem(RIDE_PUBLISH_STORAGE_KEY, JSON.stringify(rides.slice(-20)));
      } catch {
        setStatus('Ride could not be published in this browser', 'error');
        return;
      }
      setCreateRideNote(`Ride published for ${rideRecord.arrivalTime} (${rideRecord.distanceKm.toFixed(1)} km, ~${rideRecord.durationMin.toFixed(0)} min).`);
      document.getElementById('rideTimeSummary').textContent = `Your ride is scheduled for ${rideRecord.arrivalTime}.`;
      updateSeatCount(rideRecord);
      renderDriverRideSummary();
      document.getElementById('btnPublishRide').disabled = true;
      setStatus('Ride published and visible to passengers', 'success');
    }

    function getLatestDriverPublishedRide() {
      return readPublishedRides()
        .filter(ride => ride?.driverId === DRIVER_PROFILE.id)
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())[0] || null;
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

    function getJoinRequestKey(request) {
      return request?.requestId || `${request?.driverId || 'driver'}|${request?.passengerPhone || 'phone'}|${request?.requestedAt || 'time'}`;
    }

    function formatJoinRequestTime(timestamp) {
      const date = new Date(timestamp);
      if (Number.isNaN(date.getTime())) return 'Just now';
      return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    }

    function canSharePassengerPhone(passenger) {
      if (!passenger) return false;
      const acceptedJoin = readJoinRequests().some(request =>
        request &&
        (request.status || 'pending') === 'accepted' &&
        request.driverId === DRIVER_PROFILE.id &&
        (request.passengerId === passenger.id || request.passengerPhone === passenger.phone)
      );
      if (acceptedJoin) return true;
      const acceptedDriverInvite = readStoredRequests().some(request =>
        request &&
        (request.status || 'pending') === 'accepted' &&
        request.driverId === DRIVER_PROFILE.id &&
        (request.passengerId === passenger.id || request.phone === passenger.phone)
      );
      return acceptedDriverInvite;
    }

    function getRequestRowId(request) {
      if (request.type === 'join-request') {
        return request.requestId || `${request.driverId || 'driver'}|${request.passengerPhone || 'phone'}|${request.requestedAt || 'time'}`;
      }
      return request.requestId;
    }

    function confirmRideAsDriver(requestType, requestId) {
      if (requestType === 'join-request') {
        const requests = readJoinRequests();
        const updated = requests.map(request => {
          if (getJoinRequestKey(request) !== requestId) return request;
          const driverConfirmed = true;
          const passengerConfirmed = Boolean(request.passengerConfirmed);
          return {
            ...request,
            driverConfirmed,
            driverConfirmedAt: new Date().toISOString(),
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
        const requests = readStoredRequests();
        const updated = requests.map(request => {
          if (request?.requestId !== requestId) return request;
          const driverConfirmed = true;
          const passengerConfirmed = Boolean(request.passengerConfirmed);
          return {
            ...request,
            driverConfirmed,
            driverConfirmedAt: new Date().toISOString(),
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
      renderJoinRequests();
      if (selectedPassenger) renderPassengerDetails(selectedPassenger);
      maybeActivateDriverRideAndRedirect();
      setStatus('Ride confirmed from your side', 'success');
    }

    function cancelRideAsDriver(requestType, requestId) {
      if (requestType === 'join-request') {
        const requests = readJoinRequests();
        const updated = requests.map(request => {
          if (getJoinRequestKey(request) !== requestId) return request;
          return {
            ...request,
            status: 'cancelled',
            cancelledAt: new Date().toISOString(),
            driverConfirmed: false,
            passengerConfirmed: false,
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
        const requests = readStoredRequests();
        const updated = requests.map(request => {
          if (request?.requestId !== requestId) return request;
          return {
            ...request,
            status: 'cancelled',
            cancelledAt: new Date().toISOString(),
            driverConfirmed: false,
            passengerConfirmed: false,
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
      renderJoinRequests();
      if (selectedPassenger) renderPassengerDetails(selectedPassenger);
      clearActiveRideIfMatches(requestId);
      setStatus('Ride cancelled', 'default');
    }

    function endRideAsDriver(requestType, requestId) {
      if (requestType === 'join-request') {
        const requests = readJoinRequests();
        const updated = requests.map(request => {
          if (getJoinRequestKey(request) !== requestId) return request;
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
        const requests = readStoredRequests();
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
      renderJoinRequests();
      if (selectedPassenger) renderPassengerDetails(selectedPassenger);
      clearActiveRideIfMatches(requestId);
      setStatus('Ride marked as completed', 'success');
    }

    function renderJoinRequests() {
      const joinRequests = readJoinRequests().map(request => ({
        type: 'join-request',
        requestId: getJoinRequestKey(request),
        passengerName: request.passengerName,
        passengerId: request.passengerId,
        passengerPhone: request.passengerPhone,
        driverName: request.driverName,
        carName: request.carName,
        status: request.status || 'pending',
        requestedAt: request.requestedAt,
        respondedAt: request.respondedAt,
        arrivalTime: formatTime(request.arrivalTime) || null,
        driverConfirmed: Boolean(request.driverConfirmed),
        passengerConfirmed: Boolean(request.passengerConfirmed),
        rideStartedAt: request.rideStartedAt || null,
      }));
      const inviteUpdates = readStoredRequests()
        .filter(request => request?.driverId === DRIVER_PROFILE.id)
        .map(request => ({
          type: 'driver-invite',
          requestId: request.requestId,
          passengerName: request.fullName || 'Passenger',
          passengerId: request.passengerId,
          passengerPhone: request.phone,
          driverName: request.driverName || DRIVER_PROFILE.fullName,
          carName: request.carName || DRIVER_PROFILE.carName,
          status: request.status || 'pending',
          requestedAt: request.requestedAt,
          respondedAt: request.respondedAt,
          arrivalTime: formatTime(request.arrivalTime) || null,
          driverConfirmed: Boolean(request.driverConfirmed),
          passengerConfirmed: Boolean(request.passengerConfirmed),
          rideStartedAt: request.rideStartedAt || null,
        }));
      const requests = [...joinRequests, ...inviteUpdates]
        .sort((a, b) => new Date(b.respondedAt || b.requestedAt).getTime() - new Date(a.respondedAt || a.requestedAt).getTime());
      document.getElementById('joinRequestCount').textContent = String(requests.length);
      const list = document.getElementById('joinRequestList');
      if (!requests.length) {
        list.innerHTML = '<p class="panel-empty">Passenger join requests will appear here after they use Request to Join.</p>';
        return;
      }
      list.innerHTML = requests.map(request => `
        <div class="request-row">
          <div class="request-top">
            <div class="request-name">${request.passengerName}</div>
            <span class="request-status ${request.status || 'pending'}">${(request.status || 'pending') === 'completed' ? 'completed' : (request.status || 'pending')}</span>
          </div>
          <div class="request-sub">${request.status === 'accepted' ? request.passengerPhone : 'Phone hidden until accepted'}</div>
          <div class="request-meta">${request.type === 'join-request' ? 'Join request' : 'Driver invite'} · ${request.driverName} · ${request.carName} · ${formatJoinRequestTime(request.requestedAt)}</div>
          <div class="request-meta">${renderRideTime(request.arrivalTime)}</div>
          ${request.status === 'accepted' ? `<div class="request-meta">Accepted ${formatJoinRequestTime(request.respondedAt)}</div>` : ''}
          ${request.status === 'rejected' ? `<div class="request-meta">Rejected ${formatJoinRequestTime(request.respondedAt)}</div>` : ''}
          ${request.status === 'accepted' ? `<div class="request-meta">Confirmations: You ${request.driverConfirmed ? 'confirmed' : 'pending'} · Other side ${request.passengerConfirmed ? 'confirmed' : 'pending'}${request.rideStartedAt ? ` · Ride started ${formatJoinRequestTime(request.rideStartedAt)}` : ''}</div>` : ''}
          ${request.type === 'join-request' && (!request.status || request.status === 'pending') ? `
            <div class="request-actions">
              <button class="request-action-btn accept" type="button" onclick="respondToJoinRequest('${request.requestId}','accepted')">Accept</button>
              <button class="request-action-btn reject" type="button" onclick="respondToJoinRequest('${request.requestId}','rejected')">Reject</button>
            </div>
          ` : request.status === 'accepted' ? `
            <div class="request-actions">
              <button class="request-action-btn chat" type="button" onclick="openWhatsAppChat('${request.passengerPhone || ''}')">Chat</button>
              <button class="request-action-btn ${request.driverConfirmed ? 'confirmed' : 'confirm'}" type="button" onclick="confirmRideAsDriver('${request.type}','${request.requestId}')" ${request.driverConfirmed ? 'disabled' : ''}>${request.driverConfirmed ? 'Confirmed' : 'Confirm Ride'}</button>
              ${request.rideStartedAt
                ? `<button class="request-action-btn endride" type="button" onclick="endRideAsDriver('${request.type}','${request.requestId}')">End Ride</button>`
                : `<button class="request-action-btn cancel" type="button" onclick="cancelRideAsDriver('${request.type}','${request.requestId}')">Cancel</button>`}
            </div>
          ` : `
            <div class="request-actions">
              <button class="request-action-btn delete" type="button" onclick="deleteRequestRow('${request.type}','${request.requestId}')">Delete</button>
            </div>
          `}
        </div>
      `).join('');
    }

    function respondToJoinRequest(requestKey, status) {
      const requests = readJoinRequests();
      let updatedPassengerName = 'Passenger';
      const updatedRequests = requests.map(request => {
        if (getJoinRequestKey(request) !== requestKey) return request;
        updatedPassengerName = request.passengerName || updatedPassengerName;
        return {
          ...request,
          status,
          respondedAt: new Date().toISOString(),
          driverConfirmed: status === 'accepted' ? false : request.driverConfirmed,
          passengerConfirmed: status === 'accepted' ? Boolean(request.passengerConfirmed) : request.passengerConfirmed,
          rideStartedAt: status === 'accepted' ? (request.rideStartedAt || null) : request.rideStartedAt,
        };
      });
      try {
        localStorage.setItem(JOIN_REQUEST_STORAGE_KEY, JSON.stringify(updatedRequests.slice(-20)));
      } catch {
        setStatus('Could not update passenger request', 'error');
        return;
      }
      renderJoinRequests();
      if (selectedPassenger) renderPassengerDetails(selectedPassenger);
      setStatus(`${updatedPassengerName} request ${status}`, status === 'accepted' ? 'success' : 'default');
    }

    function deleteRequestRow(type, requestId) {
      if (type === 'join-request') {
        const requests = readJoinRequests();
        const filteredRequests = requests.filter(request => getJoinRequestKey(request) !== requestId);
        try {
          localStorage.setItem(JOIN_REQUEST_STORAGE_KEY, JSON.stringify(filteredRequests.slice(-20)));
        } catch {
          setStatus('Could not delete passenger request', 'error');
          return;
        }
      } else {
        const requests = readStoredRequests().filter(request => request?.requestId !== requestId);
        try {
          localStorage.setItem(REQUEST_STORAGE_KEY, JSON.stringify(requests.slice(-20)));
        } catch {
          setStatus('Could not delete invite update', 'error');
          return;
        }
      }
      clearActiveRideIfMatches(requestId);
      renderJoinRequests();
      setStatus('Request deleted', 'default');
    }

    function readVisiblePassengerProfile() {
      try {
        const raw = localStorage.getItem(PASSENGER_VISIBILITY_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed?.visible) return null;
        if (typeof parsed.lat !== 'number' || typeof parsed.lng !== 'number') return null;
        return {
          id: parsed.id || 'passenger-live',
          fullName: parsed.fullName || 'Current Passenger',
          phone: parsed.phone || '+96170111000',
          lat: parsed.lat,
          lng: parsed.lng,
        };
      } catch {
        return null;
      }
    }

    function getSearchablePassengers() {
      // Get passengers for current trip type, with live visible passenger merged if exists
      const basePassengers = getPassengersForTripType();
      const visiblePassenger = readVisiblePassengerProfile();
      if (!visiblePassenger) return basePassengers;
      const index = basePassengers.findIndex(passenger => passenger.id === visiblePassenger.id);
      if (index === -1) return [...basePassengers, visiblePassenger];
      const merged = [...basePassengers];
      merged[index] = { ...merged[index], ...visiblePassenger };
      return merged;
    }

    function readStoredRequests() {
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
      if (typeof activeRide.driver?.lat === 'number' && typeof activeRide.driver?.lng === 'number') {
        next.driver = {
          lat: activeRide.driver.lat,
          lng: activeRide.driver.lng,
          updatedAt: new Date().toISOString(),
        };
      }
      if (typeof activeRide.passenger?.lat === 'number' && typeof activeRide.passenger?.lng === 'number') {
        next.passenger = {
          lat: activeRide.passenger.lat,
          lng: activeRide.passenger.lng,
          updatedAt: new Date().toISOString(),
        };
      }
      localStorage.setItem(ACTIVE_RIDE_POSITIONS_KEY, JSON.stringify(next));
    }

    function buildDriverActiveRide(requestType, request) {
      const visiblePassenger = readVisiblePassengerProfile();
      const passengerSample = PASSENGERS.find(passenger =>
        (request.passengerId && passenger.id === request.passengerId) ||
        (request.passengerPhone && passenger.phone === request.passengerPhone) ||
        (request.phone && passenger.phone === request.phone) ||
        (request.passengerName && passenger.fullName === request.passengerName) ||
        (request.fullName && passenger.fullName === request.fullName)
      ) || null;
      const rideId = `active-${request.requestId || Date.now()}`;
      return {
        rideId,
        sourceType: requestType,
        sourceRequestId: request.requestId,
        status: 'in-progress',
        startedAt: request.rideStartedAt || new Date().toISOString(),
        role: 'driver',
        driver: {
          id: DRIVER_PROFILE.id,
          fullName: DRIVER_PROFILE.fullName,
          phone: DRIVER_PROFILE.phone,
          carName: DRIVER_PROFILE.carName,
          licensePlate: DRIVER_PROFILE.licensePlate,
          lat: typeof driverLat === 'number' ? driverLat : null,
          lng: typeof driverLng === 'number' ? driverLng : null,
        },
        passenger: {
          id: request.passengerId || visiblePassenger?.id || passengerSample?.id || 'passenger-live',
          fullName: request.passengerName || request.fullName || visiblePassenger?.fullName || passengerSample?.fullName || 'Passenger',
          phone: request.passengerPhone || request.phone || visiblePassenger?.phone || passengerSample?.phone || '+96170000000',
          lat: visiblePassenger?.lat ?? passengerSample?.lat ?? null,
          lng: visiblePassenger?.lng ?? passengerSample?.lng ?? null,
        },
        routeCoords: Array.isArray(routeCoords) ? routeCoords : [],
      };
    }

    function activateDriverRide(requestType, request) {
      const activeRide = buildDriverActiveRide(requestType, request);
      localStorage.setItem(ACTIVE_RIDE_STORAGE_KEY, JSON.stringify(activeRide));
      writeInitialRidePositions(activeRide);
      window.location.href = 'my-map.html';
    }

    function maybeActivateDriverRideAndRedirect() {
      const inProgressRide = getLatestDriverRide(['in_progress']);
      if (!inProgressRide) return false;
      const activeRide = buildDriverActiveRideFromPublishedRide(inProgressRide);
      localStorage.setItem(ACTIVE_RIDE_STORAGE_KEY, JSON.stringify(activeRide));
      writeInitialRidePositions(activeRide);
      window.location.href = 'my-map.html';
      return true;
    }

    function loadRequestedPassengerIds() {
      requestedPassengerIds.clear();
      readStoredRequests().forEach(request => {
        if (request?.passengerId) requestedPassengerIds.add(request.passengerId);
      });
    }

    function setPassengerPanelEmpty(message, badge = 'Waiting') {
      selectedPassenger = null;
      // Ensure we're showing the list view, not details view
      document.getElementById('panelHeadList').classList.remove('hidden');
      document.getElementById('panelHeadDetails').classList.add('hidden');
      document.getElementById('passengerListView').classList.remove('hidden');
      document.getElementById('passengerDetailsView').classList.add('hidden');
      // Show the panel
      document.getElementById('passengerRankPanel').classList.add('visible');
      // Clear request note
      document.getElementById('panelRequestNote').textContent = '';
      document.getElementById('panelRequestNote').className = 'panel-note';
      passengerMarkers.forEach(entry => entry.marker.setStyle(entry.baseStyle));
    }

    function setRequestNote(text, state = '') {
      const note = document.getElementById('panelRequestNote');
      note.textContent = text;
      note.className = state ? `panel-note state-${state}` : 'panel-note';
    }

    function refreshRequestButton() {
      const button = document.getElementById('panelRequestBtn');
      if (!selectedPassenger) {
        button.disabled = true;
        button.textContent = 'Request Passenger';
        return;
      }
      const requested = requestedPassengerIds.has(selectedPassenger.id);
      button.disabled = requested;
      button.textContent = requested ? 'Request Sent' : 'Request Passenger';
    }

    function renderPassengerDetails(passenger) {
      const canSharePhone = canSharePassengerPhone(passenger);
      document.getElementById('panelHeadList').classList.add('hidden');
      document.getElementById('panelHeadDetails').classList.remove('hidden');
      document.getElementById('passengerListView').classList.add('hidden');
      document.getElementById('passengerDetailsView').classList.remove('hidden');
      document.getElementById('panelPassengerName').textContent = passenger.fullName;
      document.getElementById('panelPassengerPhone').textContent = canSharePhone ? passenger.phone : 'Hidden until request is accepted';
      document.getElementById('panelPassengerPhoneLink').href = canSharePhone ? `tel:${passenger.phone}` : '#';
      const callBtn = document.getElementById('panelCallBtn');
      callBtn.href = canSharePhone ? `tel:${passenger.phone}` : '#';
      callBtn.classList.toggle('is-disabled', !canSharePhone);
      document.getElementById('panelPassengerDestination').textContent = passenger.destination || 'Not specified';
      document.getElementById('panelPassengerFit').textContent = `${passenger.pickupDistanceKm?.toFixed(1) || '—'} km · ~${passenger.pickupDurationMin?.toFixed(0) || '—'} min`;
      setRequestNote(
        requestedPassengerIds.has(passenger.id)
          ? 'Ride request already sent to this passenger.'
          : (canSharePhone
              ? 'Request accepted. You can now call or chat with this passenger.'
              : 'Phone and call become available after request acceptance.'),
        requestedPassengerIds.has(passenger.id) ? 'success' : ''
      );
      refreshRequestButton();
    }

    function backToPassengerList() {
      selectedPassenger = null;
      document.getElementById('panelHeadList').classList.remove('hidden');
      document.getElementById('panelHeadDetails').classList.add('hidden');
      document.getElementById('passengerListView').classList.remove('hidden');
      document.getElementById('passengerDetailsView').classList.add('hidden');
      passengerMarkers.forEach(item => item.marker.setStyle(item.baseStyle));
    }

    function selectPassenger(passengerId) {
      const entry = passengerMarkers.find(item => item.passenger.id === passengerId);
      if (!entry) return;
      selectedPassenger = entry.passenger;
      passengerMarkers.forEach(item => item.marker.setStyle(item.baseStyle));
      entry.marker.setStyle({
        ...entry.baseStyle,
        radius: 11,
        weight: 3,
        color: '#0f172a',
        fillColor: '#14b8a6',
      });
      renderPassengerDetails(entry.passenger);
      entry.marker.openPopup();
    }

    function clearPassengerMarkers() {
      passengerMarkers.forEach(entry => map.removeLayer(entry.marker));
      passengerMarkers = [];
      passengerRoutes.forEach(route => map.removeLayer(route));
      passengerRoutes = [];
    }

    async function drawPassengerRoutes(passengers) {
      // For from_campus mode, draw FULL detour routes: campus → student destination → driver home
      // This matches the actual detour calculation used for scoring
      if (tripType !== 'from_campus') return;
      
      console.log(`Drawing full detour routes for ${passengers.length} passengers in from_campus mode`);
      
      for (const passenger of passengers) {
        // Skip red routes with high detour (score >= 25)
        if (passenger.score >= 25) continue;
        
        if (!passenger.destinationLat || !passenger.destinationLng) continue;
        if (driverLat === null || driverLng === null) continue;
        
        // Determine color based on score (match marker color coding)
        let routeColor = '#dc2626'; // red for score >= 25
        if (passenger.score < 15) {
          routeColor = '#16a34a'; // green for score < 15
        } else if (passenger.score < 25) {
          routeColor = '#f59e0b'; // orange for score < 25
        }
        
        try {
          // Draw FULL route: CAMPUS → student destination → driver home (matches detour calculation)
          const routeUrl = `${OSRM_BASE}/${CAMPUS_LNG},${CAMPUS_LAT};${passenger.destinationLng},${passenger.destinationLat};${driverLng},${driverLat}?overview=full&geometries=geojson`;
          const res = await fetch(routeUrl);
          if (res.ok) {
            const data = await res.json();
            if (data?.routes?.[0]) {
              const route = data.routes[0];
              const coords = route.geometry.coordinates.map(c => [c[1], c[0]]);
              const polyline = L.polyline(coords, {
                color: routeColor,
                weight: 4,
                opacity: 0.9
              }).addTo(map);
              polyline.bindPopup(`<strong>${passenger.fullName}</strong><br>→ ${passenger.destination}<br>Detour: ${passenger.timeDetourPct.toFixed(0)}% time / ${passenger.distanceDetourPct.toFixed(0)}% distance<br>Score: ${passenger.score.toFixed(1)}`);
              passengerRoutes.push(polyline);
              
              // Add marker at destination location
              const destMarker = L.circleMarker([passenger.destinationLat, passenger.destinationLng], {
                radius: 6,
                color: routeColor,
                fillColor: routeColor,
                fillOpacity: 0.8,
                weight: 2
              }).addTo(map);
              destMarker.bindTooltip(`${passenger.destination}`, { permanent: false, direction: 'top', opacity: 0.9 });
              destMarker.bindPopup(`<strong>${passenger.destination}</strong><br>Drop-off for ${passenger.fullName}`);
              passengerRoutes.push(destMarker);
              
              console.log(`Drew detour route for ${passenger.fullName} to ${passenger.destination} (detour: ${passenger.timeDetourPct.toFixed(0)}% time) - color: ${routeColor}`);
            }
          }
        } catch (err) {
          console.error(`Error drawing route for ${passenger.fullName}:`, err);
        }
      }
    }

    function renderPassengerMarkers(passengers) {
      clearPassengerMarkers();
      // Draw passenger routes for from_campus mode
      if (tripType === 'from_campus') {
        drawPassengerRoutes(passengers).catch(err => console.error('Route drawing failed:', err));
      }
      if (!passengers.length) {
        setPassengerPanelEmpty('No nearby passengers in your area. Try adjusting your location or destination.', 'Empty');
        document.getElementById('passengerRankEmpty').classList.remove('hidden');
        document.getElementById('passengerRankRows').innerHTML = '';
        return;
      }
      
      // Render markers on map (skip red markers with score >= 25)
      passengers.forEach(passenger => {
        // Skip red markers - only draw green and orange
        if (passenger.score >= 25) return;
        
        let fillColor = '#14b8a6';
        if (passenger.score < 15) {
          fillColor = '#16a34a';
        } else if (passenger.score < 25) {
          fillColor = '#f59e0b';
        } else {
          fillColor = '#dc2626';
        }
        
        const baseStyle = {
          radius: 9,
          color: '#0f766e',
          fillColor: fillColor,
          fillOpacity: 0.95,
          weight: 2.5,
        };
        const marker = L.circleMarker([passenger.lat, passenger.lng], baseStyle).addTo(map);
        marker.bindTooltip(
          `<div class="passenger-tooltip">${passenger.fullName}</div>`,
          { permanent: false, direction: 'top', opacity: 0.94 }
        );
        marker.bindPopup(
          `<div style="font-family:Inter,sans-serif">
            <strong>${passenger.fullName}</strong><br>
            <span style="color:#55606a">Tap to view phone number and request pickup</span>
          </div>`
        );
        marker.on('click', () => selectPassenger(passenger.id));
        passengerMarkers.push({ marker, passenger, baseStyle });
      });
      
      // Populate nearby passengers panel list
      const rankRows = document.getElementById('passengerRankRows');
      rankRows.innerHTML = '';
      document.getElementById('passengerRankEmpty').classList.add('hidden');
      
      passengers.forEach((passenger, idx) => {
        const badgeCls = passenger.score < 15 ? 'badge-green' : passenger.score < 25 ? 'badge-orange' : 'badge-red';
        const row = document.createElement('div');
        row.className = 'passenger-row';
        row.setAttribute('role', 'button');
        row.setAttribute('tabindex', '0');
        row.dataset.passengerId = passenger.id;
        row.innerHTML = `
          <span class="passenger-rank">${idx + 1}</span>
          <div class="passenger-info">
            <div class="passenger-name">${passenger.fullName}</div>
            <div class="passenger-sub">${passenger.destination || 'Destination not specified'}</div>
            <div class="passenger-time">${passenger.pickupDistanceKm?.toFixed(1) || '—'} km · ~${passenger.pickupDurationMin?.toFixed(0) || '—'} min</div>
          </div>
          <span class="badge ${badgeCls}">${passenger.score.toFixed(1)}</span>
        `;
        row.onclick = () => selectPassenger(passenger.id);
        rankRows.appendChild(row);
      });
      
      document.getElementById('passengerRankCount').textContent = passengers.length;
      setPassengerPanelEmpty('Click a nearby passenger to open the contact panel.', `${passengers.length} Nearby`);
    }

    function requestSelectedPassenger() {
      if (!selectedPassenger) {
        setStatus('Select a passenger marker first', 'error');
        return;
      }
      if (requestedPassengerIds.has(selectedPassenger.id)) {
        setRequestNote('Ride request already sent to this passenger.', 'success');
        return;
      }
      const latestRide = getLatestDriverPublishedRide();
      const requests = readStoredRequests().filter(request => request?.passengerId !== selectedPassenger.id);
      requests.push({
        requestId: `driver-request-${Date.now()}`,
        driverId: DRIVER_PROFILE.id,
        rideId: latestRide?.rideId || null,
        driverName: DRIVER_PROFILE.fullName,
        driverPhone: DRIVER_PROFILE.phone,
        carName: DRIVER_PROFILE.carName,
        licensePlate: DRIVER_PROFILE.licensePlate,
        arrivalTime: formatTime(latestRide?.arrivalTime) || null,
        passengerId: selectedPassenger.id,
        fullName: selectedPassenger.fullName,
        phone: selectedPassenger.phone,
        routeDistanceKm: Number(selectedPassenger.routeDistanceKm.toFixed(2)),
        timeDetourPct: Number(selectedPassenger.timeDetourPct.toFixed(0)),
        status: 'pending',
        driverConfirmed: false,
        passengerConfirmed: false,
        rideStartedAt: null,
        requestedAt: new Date().toISOString(),
      });
      try {
        localStorage.setItem(REQUEST_STORAGE_KEY, JSON.stringify(requests.slice(-20)));
      } catch {
        setStatus('Request could not be stored in this browser', 'error');
        return;
      }
      requestedPassengerIds.add(selectedPassenger.id);
      refreshRequestButton();
      setRequestNote(`Ride request sent to ${selectedPassenger.fullName}.`, 'success');
      setStatus(`Ride request sent to ${selectedPassenger.fullName}`, 'success');
    }

    /* Reveal Step 2 once a location method is chosen */
    /* Update location chip state */
    function setLocStatus(text, state) {
      const el = document.getElementById('locStatus');
      el.className = 'loc-status' + (state ? ` state-${state}` : '');
      document.getElementById('locText').textContent = text;
    }

    /* Unlock the Find Passengers button with a pop animation */
    function onLocationAcquired() {
      const btn = document.getElementById('btnFindPassengers');
      btn.disabled = false;
      btn.classList.add('btn-unlock-anim');
      btn.addEventListener('animationend', () => btn.classList.remove('btn-unlock-anim'), { once: true });
      document.getElementById('btnCreateRide').disabled = false;
    }

    /* =====================================================================
       HAVERSINE DISTANCE (km)
    ===================================================================== */
    function haversine(lat1, lon1, lat2, lon2) {
      const R    = 6371;
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a    = Math.sin(dLat / 2) ** 2
                 + Math.cos(lat1 * Math.PI / 180)
                 * Math.cos(lat2 * Math.PI / 180)
                 * Math.sin(dLon / 2) ** 2;
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    /* Minimum distance from a point to any node in a polyline (km) */
    function distToPolyline(lat, lng, poly) {
      let min = Infinity;
      for (const p of poly) {
        const d = haversine(lat, lng, p[0], p[1]);
        if (d < min) min = d;
      }
      return min;
    }
    
// ======================================================
// UNIFIED MATCH SCORE (detour priority)
// ======================================================
function computeMatchScore(timeDetourPct, routeDistanceKm) {
    // Weighted formula
    return (0.75 * timeDetourPct) + (0.25 * routeDistanceKm);
}


    /* =====================================================================
       LOCATE DRIVER  (toggle: press again to cancel)
    ===================================================================== */
    let _locateWatchId = null;

    function locateDriver() {
      const btn = document.getElementById('btnLocate');
      const clickBtn = document.getElementById('btnClickPlace');
      if (btn.hasAttribute('data-loading')) {
        if (_locateWatchId !== null) { navigator.geolocation.clearWatch(_locateWatchId); _locateWatchId = null; }
        btn.removeAttribute('data-loading');
        btn.classList.remove('btn-loc-active');
        setStatus('Location search cancelled');
        return;
      }
      clickMode = false;
      clickBtn.removeAttribute('data-loading');
      clickBtn.classList.remove('btn-loc-active');
      btn.classList.add('btn-loc-active');
      if (!navigator.geolocation) {
        setLocStatus('GPS not available — place manually', 'error');
        setStatus('Geolocation not supported — use Place Manually', 'error');
        return;
      }
      btn.setAttribute('data-loading', '');
      setLocStatus('Detecting your location…', 'acquiring');
      setStatus('Acquiring GPS position…', 'loading');
      _locateWatchId = navigator.geolocation.watchPosition(
        pos => {
          navigator.geolocation.clearWatch(_locateWatchId);
          _locateWatchId = null;
          driverLat = pos.coords.latitude;
          driverLng = pos.coords.longitude;
          console.log(`[GPS] Driver location set: ${driverLat.toFixed(6)}, ${driverLng.toFixed(6)}`);
          if (driverMarker) map.removeLayer(driverMarker);
          driverMarker = L.marker([driverLat, driverLng], { icon: driverIcon }).addTo(map);
          map.setView([driverLat, driverLng], 14);
          document.getElementById('btnLocate').classList.add('btn-loc-active');
          document.getElementById('btnClickPlace').classList.remove('btn-loc-active');
          setLocStatus('Location ready', 'set');
          onLocationAcquired();
          setStatus('Location set — tap "Find Passengers"', 'success');
          btn.removeAttribute('data-loading');
        },
        err => {
          _locateWatchId = null;
          setLocStatus('GPS failed — place manually', 'error');
          setStatus('GPS error — use Place Manually instead', 'error');
          btn.removeAttribute('data-loading');
        },
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
      );
    }

    /* =====================================================================
       CLICK-TO-PLACE  (toggle: press again to cancel)
    ===================================================================== */
    function enableClick() {
      const btn = document.getElementById('btnClickPlace');
      const gpsBtn = document.getElementById('btnLocate');
      if (clickMode) {
        clickMode = false;
        btn.removeAttribute('data-loading');
        btn.classList.remove('btn-loc-active');
        setStatus('Location placement cancelled');
        return;
      }
      if (gpsBtn.hasAttribute('data-loading') && _locateWatchId !== null) {
        navigator.geolocation.clearWatch(_locateWatchId);
        _locateWatchId = null;
      }
      gpsBtn.removeAttribute('data-loading');
      clickMode = true;
      btn.setAttribute('data-loading', '');
      btn.classList.add('btn-loc-active');
      gpsBtn.classList.remove('btn-loc-active');
      setStatus('Click anywhere on the map to set your location', 'loading');
    }

    map.on('click', e => {
      if (manualPickMode) {
        if (manualPickMode === 'stop') {
          manualRouteDraft.stops.push({ lat: e.latlng.lat, lng: e.latlng.lng });
          setStatus(`Manual stop ${manualRouteDraft.stops.length} added`, 'success');
        }
        manualPickMode = null;
        renderManualPointMarkers();
        buildManualRoutePreview();
        return;
      }
      if (!clickMode) return;
      clickMode = false;
      const btn = document.getElementById('btnClickPlace');
      btn.removeAttribute('data-loading');
      btn.classList.add('btn-loc-active');
      document.getElementById('btnLocate').classList.remove('btn-loc-active');
      driverLat = e.latlng.lat;
      driverLng = e.latlng.lng;
      console.log(`[MANUAL] Driver location set: ${driverLat.toFixed(6)}, ${driverLng.toFixed(6)}`);
      if (driverMarker) map.removeLayer(driverMarker);
      driverMarker = L.marker([driverLat, driverLng], { icon: driverIcon }).addTo(map);
      map.setView(e.latlng, 14);
      setLocStatus('Location placed manually', 'set');
      onLocationAcquired();
      setStatus('Location placed — tap "Find Passengers"', 'success');
    });

    /* =====================================================================
       FIND PASSENGERS  (computes route then matches passengers in one step)
    ===================================================================== */
    let _findAbort = null;

    async function findPassengers() {
      const btn = document.getElementById('btnFindPassengers');
      if (btn.hasAttribute('data-loading')) {
        if (_findAbort) { _findAbort.abort(); _findAbort = null; }
        btnLoading('btnFindPassengers', false);
        setStatus('Search cancelled');
        return;
      }
      if (driverLat === null) {
        setStatus('Set your location first (Step 1)', 'error');
        return;
      }
      btnLoading('btnFindPassengers', true);
      clearPassengerMarkers();
      setPassengerPanelEmpty('Scanning your route for nearby passengers…', 'Scanning');

      /* — PHASE 1: compute route to campus — */
      setStatus('Computing route to campus…', 'loading');
      _findAbort = new AbortController();
      try {
        const url  = `${OSRM_BASE}/${driverLng},${driverLat};${CAMPUS_LNG},${CAMPUS_LAT}?overview=full&geometries=geojson`;
        const res  = await fetch(url, { signal: _findAbort.signal });
        if (!res.ok) throw new Error('Network response not OK');
        const data = await res.json();
        if (!data.routes?.length) throw new Error('No route returned');
        routeCoords      = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
        originalDuration = data.routes[0].duration / 60;
        originalDistanceKm= data.routes[0].distance / 1000;
        if (routeLine) map.removeLayer(routeLine);
        routeLine = L.polyline(routeCoords, { color: '#0072bb', weight: 5, opacity: 0.88 }).addTo(map);
        routeLine.bindPopup(
          `<div style="font-family:Inter,sans-serif">
            <strong>Route to Campus</strong><br>
            <span style="color:#55606a">~${originalDuration.toFixed(0)} min · direct</span>
          </div>`
        );
        map.fitBounds(routeLine.getBounds(), { padding: [54, 54] });
        clampDriverMapZoom(12);
      } catch (err) {
        _findAbort = null;
        if (err.name !== 'AbortError') setStatus('Routing failed — check your connection', 'error');
        btnLoading('btnFindPassengers', false);
        return;
      }

      /* — PHASE 2: scan passengers — */
      setStatus('Scanning for nearby passengers…', 'loading');
      const accepted  = [];
      const signal    = _findAbort.signal;
      
      // Baseline is the same for both modes: distance between driver and campus (symmetric route)
      // Use Phase 1 route distance for consistency
      const baselineDurationBothModes = originalDuration || 0;
      const baselineDistanceBothModes = originalDistanceKm || 0;
      console.log(`[${tripType}] Baseline (Driver ↔ Campus): ${baselineDurationBothModes.toFixed(1)}min / ${baselineDistanceBothModes.toFixed(2)}km`);
      
      try {
        for (const p of getSearchablePassengers()) {
          if (signal.aborted) break;
          // Use trip-type aware coordinates
          const pickupLat = p.pickupLat !== undefined ? p.pickupLat : p.lat;
          const pickupLng = p.pickupLng !== undefined ? p.pickupLng : p.lng;
          const destLat = p.destinationLat !== undefined ? p.destinationLat : CAMPUS_LAT;
          const destLng = p.destinationLng !== undefined ? p.destinationLng : CAMPUS_LNG;
          const d = distToPolyline(pickupLat, pickupLng, routeCoords);
          if (d > 3) continue;
          let timeDetourPct = 0;
          let distanceDetourPct = 0;
          let pickupDistanceKm = null;
          let pickupDurationMin = null;
          try {
            // Get baseline and intermediate destinations based on trip type
            let baselineUrl;
            let pickupUrl;
            let baselineDuration;
            let baselineDistance;
            
            if (tripType === 'from_campus') {
              // From campus: Use unified baseline (same for all students)
              const studentDestLat = p.destinationLat;
              const studentDestLng = p.destinationLng;
              
              baselineDuration = baselineDurationBothModes;
              baselineDistance = baselineDistanceBothModes;
              
              // With pickup: CAMPUS → student destination → driver home
              pickupUrl = `${OSRM_BASE}/${CAMPUS_LNG},${CAMPUS_LAT};${studentDestLng},${studentDestLat};${driverLng},${driverLat}?overview=false&geometries=geojson`;
              
              console.log(`[${tripType}] ${p.fullName} → ${p.destination}: Campus(${CAMPUS_LAT.toFixed(4)},${CAMPUS_LNG.toFixed(4)}) → Dest(${studentDestLat.toFixed(4)},${studentDestLng.toFixed(4)}) → Home(${driverLat.toFixed(4)},${driverLng.toFixed(4)}):`, pickupUrl);
            } else {
              // To campus: use same unified baseline
              const passengerLat = p.pickupLat;
              const passengerLng = p.pickupLng;
              
              baselineDuration = baselineDurationBothModes;
              baselineDistance = baselineDistanceBothModes;
              
              // With pickup: driver → passenger location → campus
              pickupUrl = `${OSRM_BASE}/${driverLng},${driverLat};${passengerLng},${passengerLat};${CAMPUS_LNG},${CAMPUS_LAT}?overview=false&geometries=geojson`;
              
              console.log(`[${tripType}] ${p.fullName} from campus (baseline: ${baselineDuration.toFixed(1)}min):`, pickupUrl);
            }
            
            // Fetch with-pickup route
            const pickupRes = await fetch(pickupUrl, { signal });
            if (pickupRes.ok) {
              const pickupData = await pickupRes.json();
              if (pickupData?.routes?.[0]) {
                const withPickupDuration = pickupData.routes[0].duration / 60;
                const withPickupDistance = pickupData.routes[0].distance / 1000;
                pickupDurationMin = withPickupDuration;
                pickupDistanceKm = withPickupDistance;
                
                if (baselineDuration && baselineDuration > 0) {
                  timeDetourPct = Math.max(0, ((withPickupDuration - baselineDuration) / baselineDuration) * 100);
                }
                if (baselineDistance && baselineDistance > 0) {
                  distanceDetourPct = Math.max(0, ((withPickupDistance - baselineDistance) / baselineDistance) * 100);
                }
                console.log(`[${tripType}] ${p.fullName}: baseline=${baselineDuration.toFixed(1)}min/${baselineDistance.toFixed(2)}km → with pickup=${withPickupDuration.toFixed(1)}min/${withPickupDistance.toFixed(2)}km → detour: ${timeDetourPct.toFixed(0)}% time / ${distanceDetourPct.toFixed(0)}% distance`);
              }
            }
          } catch (err) {
            console.error(`[${tripType}] OSRM error for ${p.fullName}:`, err);
            distanceDetourPct = 0;
            timeDetourPct = 0;
          }
          // Keep all passengers within 3km distance to route, now with detour calculations
          const score = computeMatchScore(timeDetourPct, distanceDetourPct);
          accepted.push({ ...p, distanceDetourPct, timeDetourPct, pickupDistanceKm, pickupDurationMin, score });
        }
        if (!signal.aborted && accepted.length > 0) {
          
          // Sort passengers by unified score (lower = better)
          accepted.sort((a, b) => a.score - b.score);

          renderPassengerMarkers(accepted);
          // Keep framing stable: fit to route with a zoom cap to avoid excessive zoom-out.
          map.fitBounds(routeLine.getBounds(), { padding: [54, 54], maxZoom: 14 });
          clampDriverMapZoom(12);
          // Count only good matches for clarity (score < 25)
          const goodMatches = accepted.filter(p => p.score < 25).length;

          const msg = `Found ${goodMatches} good matches (of ${accepted.length} total)`;
          setStatus(msg, goodMatches > 0 ? 'success' : 'info');
        } else if (!signal.aborted) {
          setPassengerPanelEmpty('No nearby passengers in your area. Try adjusting your location or destination.', 'Empty');
          setStatus('No nearby passengers found', 'info');
          btnLoading('btnFindPassengers', false);
          return;
        }
      } catch (err) {
        if (err.name !== 'AbortError') setStatus('Passenger search failed', 'error');
      }
      _findAbort = null;
      btnLoading('btnFindPassengers', false);
    }

    /* =====================================================================
       INIT  — auto-detect driver location on page load
    ===================================================================== */
    setTripType('to_campus'); // Initialize to 'to campus' mode
    loadRequestedPassengerIds();
    renderJoinRequests();
    renderDriverRideSummary();
    maybeActivateDriverRideAndRedirect();
    window.addEventListener('storage', event => {
      if (event.key === JOIN_REQUEST_STORAGE_KEY || event.key === REQUEST_STORAGE_KEY || event.key === RIDE_PUBLISH_STORAGE_KEY) {
        if (maybeActivateDriverRideAndRedirect()) return;
        renderJoinRequests();
        renderDriverRideSummary();
        if (selectedPassenger) renderPassengerDetails(selectedPassenger);
      }
      if (event.key === ACTIVE_RIDE_STORAGE_KEY) {
        maybeActivateDriverRideAndRedirect();
      }
    });
    locateDriver();
  
