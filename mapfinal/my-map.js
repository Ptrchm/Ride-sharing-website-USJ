    /* =====================================================================
       CONSTANTS & DOM REFERENCES
    ===================================================================== */
    const CAMPUS_LAT = 33.8654840;
    const CAMPUS_LNG = 35.5631210;
    const CAMPUS = { lat: CAMPUS_LAT, lng: CAMPUS_LNG };
    const OSRM_BASE  = 'https://router.project-osrm.org/route/v1/driving';
    const ACTIVE_RIDE_STORAGE_KEY = 'usj-rideshare-active-ride';
    const ACTIVE_RIDE_POSITIONS_KEY = 'usj-rideshare-active-ride-positions';
    const RIDE_PUBLISH_STORAGE_KEY = 'usj-rideshare-driver-published-rides';
    const JOIN_REQUEST_STORAGE_KEY = 'usj-rideshare-passenger-join-requests';
    const REQUEST_STORAGE_KEY = 'usj-rideshare-driver-requests';
    const DRIVER_PROFILE = {
      id: 'driver-live',
      fullName: 'Current Driver',
      phone: '+96170991009',
      carName: 'Ford Focus',
      carPlate: 'DRIVER1',
    };

    const PASSENGER_PROFILE = {
      id: 'passenger-live',
      fullName: 'Current Passenger',
      phone: '+96170111000',
    };

    let activeRide = null;
    let isDriver = false;
    let isPassenger = false;
    let map = null;
    let driverMarker = null;
    let passengerMarkers = {};
    let routeLine = null;
    let campusMarker = null;

    /* =====================================================================
       INITIALIZATION
    ===================================================================== */
    document.addEventListener('DOMContentLoaded', () => {
      initializeMap();
      loadActiveRide();
      
      // Restore panel collapsed state
      if (localStorage.getItem('usj-rideshare-ride-info-panel-collapsed') === 'true') {
        document.getElementById('rideInfoPanel')?.classList.add('collapsed');
      }
      
      // Listen for panel collapse changes
      document.getElementById('rideInfoCollapseBtn')?.addEventListener('click', () => {
        const panel = document.getElementById('rideInfoPanel');
        panel.classList.toggle('collapsed');
        localStorage.setItem('usj-rideshare-ride-info-panel-collapsed', panel.classList.contains('collapsed'));
      });

      // Listen for storage changes (position updates, ride changes)
      window.addEventListener('storage', event => {
        console.log('[STORAGE EVENT] key:', event.key);
        if (event.key === ACTIVE_RIDE_POSITIONS_KEY) {
          if (activeRide) updateMarkerPositions();
        }
        // Reload ride if stored activeRide changes, or if join/ride requests change (confirmation)
        if (event.key === ACTIVE_RIDE_STORAGE_KEY || 
            event.key === JOIN_REQUEST_STORAGE_KEY || 
            event.key === REQUEST_STORAGE_KEY) {
          console.log('[STORAGE CHANGE]', event.key, 'changed, reloading active ride');
          loadActiveRide();
        }
      });
    });

    function initializeMap() {
      map = L.map('map', { zoomControl: false }).setView([CAMPUS_LAT, CAMPUS_LNG], 14);
      L.control.zoom({ position: 'bottomright' }).addTo(map);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      const campusIcon = L.divIcon({
        className: '',
        html: '<svg width="34" height="42" viewBox="0 0 34 42"><defs><filter id="cs"><feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="rgba(0,43,89,0.4)"/></filter></defs><path d="M17 2C9.55 2 3.5 8.05 3.5 15.5c0 10.5 13.5 24.5 13.5 24.5S30.5 26 30.5 15.5C30.5 8.05 24.45 2 17 2z" fill="#002b59" filter="url(#cs)" stroke="#fff" stroke-width="1.2"/><text x="17" y="19" text-anchor="middle" fill="#fff" font-size="9" font-family="Inter,system-ui,sans-serif" font-weight="800" letter-spacing="0.02em">USJ</text></svg>',
        iconSize: [34, 42], iconAnchor: [17, 42],
      });

      L.marker([CAMPUS_LAT, CAMPUS_LNG], { icon: campusIcon })
        .addTo(map)
        .bindPopup('<strong style="font-family:Inter,sans-serif;color:#002b59">Campus USJ</strong>');
    }

    /* =====================================================================
       RIDE DISCOVERY & LOADING
    ===================================================================== */
    function readPublishedRides() {
      try {
        const raw = localStorage.getItem(RIDE_PUBLISH_STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
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

    function readRequests() {
      try {
        const raw = localStorage.getItem(REQUEST_STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }

    function findConfirmedRides() {
      // Search for rides where both driver and passenger confirmed
      const joinRequests = readJoinRequests();
      const requests = readRequests();
      const publishedRides = readPublishedRides();

      console.log('[RIDE SEARCH] All join requests:', joinRequests);
      console.log('[RIDE SEARCH] All requests:', requests);
      console.log('[RIDE SEARCH] All published rides:', publishedRides);

      const allConfirmedRequests = [
        ...joinRequests.filter(req => req.driverConfirmed && req.passengerConfirmed),
        ...requests.filter(req => req.driverConfirmed && req.passengerConfirmed),
      ];

      console.log('[RIDE SEARCH] Found', allConfirmedRequests.length, 'confirmed requests');
      console.log('[RIDE SEARCH] Confirmed requests:', allConfirmedRequests);

      // Map to published rides, keep request for passenger location
      const confirmedRides = allConfirmedRequests
        .map(req => {
          const ride = publishedRides.find(r => r.rideId === req.rideId);
          if (!ride) {
            console.log('[RIDE SEARCH] For request with rideId', req.rideId, 'found ride: undefined');
            return null;
          }
          console.log('[RIDE SEARCH] For request with rideId', req.rideId, 'found ride:', ride);
          
          // Attach request to ride so we can use passenger location for route recalc
          return { ...ride, _request: req };
        })
        .filter(Boolean);

      console.log('[RIDE SEARCH] Found', confirmedRides.length, 'confirmed rides');
      console.log('[RIDE SEARCH] Confirmed rides:', confirmedRides);
      return confirmedRides;
    }

    function buildActiveRideFromPublishedRide(publishedRide) {
      if (!publishedRide) return null;

      console.log('[BUILD_ACTIVE] Building activeRide from published ride:', publishedRide);

      // Normalize route structure
      const route = publishedRide.route || {
        start: publishedRide.start || { lat: CAMPUS_LAT, lng: CAMPUS_LNG },
        destination: publishedRide.destination || { lat: CAMPUS_LAT, lng: CAMPUS_LNG },
        coords: publishedRide.coords || [],
        distanceKm: publishedRide.distanceKm || 0,
        durationMin: publishedRide.durationMin || 0,
      };

      let passengers = Array.isArray(publishedRide.passengers) ? [...publishedRide.passengers] : [];
      
      // Add passenger from request if available
      if (publishedRide._request) {
        const req = publishedRide._request;
        passengers.push({
          id: req.passengerId,
          fullName: req.passengerName,
          phone: req.passengerPhone,
          pickupLat: req.pickupLat,
          pickupLng: req.pickupLng,
          location: {
            lat: req.pickupLat,
            lng: req.pickupLng,
          },
        });
      }

      const activeRide = {
        rideId: publishedRide.rideId,
        driverId: publishedRide.driverId,
        sourceType: 'carpool-published-ride',
        status: 'in_progress',
        tripType: 'to_campus',
        seatCapacity: publishedRide.capacity || 0,
        passengers: passengers,
        arrivalTime: publishedRide.arrivalTime || null,
        route: route,
      };

      console.log('[BUILD_ACTIVE] Built activeRide:', activeRide);
      return activeRide;
    }



    function loadActiveRide() {
      console.log('[LOAD RIDE] Starting to load active ride');
      
      // First check if driver stored an activeRide
      let raw = localStorage.getItem(ACTIVE_RIDE_STORAGE_KEY);
      console.log('[LOAD RIDE] Found stored activeRide:', raw ? 'yes' : 'no');

      if (!raw) {
        // Search for confirmed rides
        const confirmedRides = findConfirmedRides();
        if (confirmedRides.length === 0) {
          console.log('[LOAD RIDE] No confirmed rides found');

          displayNoActiveRideMessage();
          setStatus('No active ride. Start one from driver or passenger map.', 'error');
          return;
        }

        // Load the first confirmed ride
        console.log('[LOAD RIDE] Found', confirmedRides.length, 'confirmed rides, using first one');
        const confirmedRide = confirmedRides[0];
        activeRide = buildActiveRideFromPublishedRide(confirmedRide);        // Store request data for later use
        if (confirmedRide._request) {
          activeRide._passengerRequest = confirmedRide._request;
        }        raw = JSON.stringify(activeRide);
      }

      try {
        if (!activeRide) {
          activeRide = JSON.parse(raw);
        }
        console.log('[LOAD RIDE] Loaded activeRide:', activeRide);
        console.log('[LOAD RIDE] route:', activeRide?.route);
        console.log('[LOAD RIDE] route.coords length:', activeRide?.route?.coords?.length);

        // If activeRide was loaded from storage, it may have lost passenger location data
        // Reload confirmed rides to get the passenger pickup location
        if (!activeRide._passengerRequest) {
          console.log('[LOAD RIDE] No _passengerRequest in activeRide, searching for confirmed rides to get passenger location');
          const confirmedRides = findConfirmedRides();
          if (confirmedRides.length > 0) {
            const confirmedRide = confirmedRides[0];
            if (confirmedRide._request) {
              activeRide._passengerRequest = confirmedRide._request;
              console.log('[LOAD RIDE] Found passenger request from join requests:', activeRide._passengerRequest);
              
              // Update passengers array with location from request
              if (Array.isArray(activeRide.passengers) && activeRide._passengerRequest.pickupLat && activeRide._passengerRequest.pickupLng) {
                activeRide.passengers.forEach(passenger => {
                  if (passenger.id === activeRide._passengerRequest.passengerId) {
                    passenger.location = {
                      lat: activeRide._passengerRequest.pickupLat,
                      lng: activeRide._passengerRequest.pickupLng,
                    };
                    passenger.pickupLat = activeRide._passengerRequest.pickupLat;
                    passenger.pickupLng = activeRide._passengerRequest.pickupLng;
                    console.log('[LOAD RIDE] Updated passenger location from request:', passenger);
                  }
                });
              }
            }
          }
          
          // Also check driver requests (when driver sent request to passenger)
          if (!activeRide._passengerRequest) {
            console.log('[LOAD RIDE] No request in join requests, checking driver requests');
            const driverRequests = readRequests();
            const matchingRequest = driverRequests.find(req => req.rideId === activeRide.rideId && req.driverConfirmed && req.passengerConfirmed);
            if (matchingRequest && matchingRequest.pickupLat && matchingRequest.pickupLng) {
              activeRide._passengerRequest = matchingRequest;
              console.log('[LOAD RIDE] Found passenger request from driver requests:', activeRide._passengerRequest);
              
              // Ensure passengers array exists and has the passenger
              if (!Array.isArray(activeRide.passengers)) {
                activeRide.passengers = [];
              }
              
              // Find or create passenger in array
              let passengerIdx = activeRide.passengers.findIndex(p => p.id === matchingRequest.passengerId);
              if (passengerIdx < 0) {
                // Passenger not in array, add them
                activeRide.passengers.push({
                  id: matchingRequest.passengerId,
                  fullName: matchingRequest.fullName,
                  phone: matchingRequest.phone,
                });
                passengerIdx = activeRide.passengers.length - 1;
              }
              
              // Update passenger location from request
              activeRide.passengers[passengerIdx].location = {
                lat: matchingRequest.pickupLat,
                lng: matchingRequest.pickupLng,
              };
              activeRide.passengers[passengerIdx].pickupLat = matchingRequest.pickupLat;
              activeRide.passengers[passengerIdx].pickupLng = matchingRequest.pickupLng;
              console.log('[LOAD RIDE] Updated passenger location from driver request:', activeRide.passengers[passengerIdx]);
            }
          }
        }

        // Determine user role based on driverId
        isDriver = activeRide.driverId === DRIVER_PROFILE.id;
        isPassenger = !isDriver;
        console.log('[LOAD RIDE] User role - isDriver:', isDriver, 'isPassenger:', isPassenger);

        // Ensure position data exists in localStorage
        try {
          let positions = JSON.parse(localStorage.getItem(ACTIVE_RIDE_POSITIONS_KEY) || '{}');
          if (!positions.driver && activeRide.route?.start) {
            // Initialize driver position from route start
            positions.driver = {
              lat: activeRide.route.start.lat,
              lng: activeRide.route.start.lng,
              updatedAt: new Date().toISOString(),
            };
          }
          // Initialize passenger positions from request data if available
          if (activeRide._passengerRequest) {
            const req = activeRide._passengerRequest;
            const posKey = `passenger_${req.passengerId}`;
            if (!positions[posKey] && req.pickupLat && req.pickupLng) {
              positions[posKey] = {
                lat: req.pickupLat,
                lng: req.pickupLng,
                updatedAt: new Date().toISOString(),
              };
              console.log('[LOAD_RIDE] Initialized passenger from request:', positions[posKey]);
            }
          }
          // Also initialize from activeRide passengers if they exist
          if (Array.isArray(activeRide.passengers)) {
            activeRide.passengers.forEach(passenger => {
              const posKey = `passenger_${passenger.id}`;
              if (!positions[posKey]) {
                let passengerLat = passenger.location?.lat || passenger.pickupLat || passenger.lat || CAMPUS_LAT;
                let passengerLng = passenger.location?.lng || passenger.pickupLng || passenger.lng || CAMPUS_LNG;
                
                positions[posKey] = {
                  lat: passengerLat,
                  lng: passengerLng,
                  updatedAt: new Date().toISOString(),
                };
              }
            });
          }
          localStorage.setItem(ACTIVE_RIDE_POSITIONS_KEY, JSON.stringify(positions));
          console.log('[LOAD_RIDE] Ensured position data exists:', positions);
        } catch (err) {
          console.error('[LOAD_RIDE] Error setting up position data:', err);
        }

        renderRideInfo();
        console.log('[LOAD_RIDE] After renderRideInfo');
        
        // Recalculate route to include passenger pickup if we have passenger location
        if (activeRide._passengerRequest && activeRide._passengerRequest.pickupLat && activeRide._passengerRequest.pickupLng && activeRide.route?.start) {
          const pickupLocation = { lat: activeRide._passengerRequest.pickupLat, lng: activeRide._passengerRequest.pickupLng };
          console.log('[LOAD_RIDE] Recalculating route with passenger pickup');
          recalculateRouteWithPickup(activeRide.route.start, pickupLocation, () => {
            console.log('[LOAD_RIDE] Route recalculation callback');
            displayRoute();
            displayCampusMarker();
            updateMarkerPositions();
          });
        } else {
          displayRoute();
          displayCampusMarker();
          console.log('[LOAD_RIDE] After displayRoute');
          
          updateMarkerPositions();
          console.log('[LOAD_RIDE] After updateMarkerPositions');
        }

        setStatus('Active ride loaded. Tracking position…');
        console.log('[LOAD_RIDE] Done loading');
      } catch (err) {
        console.error('[LOAD_RIDE] Error caught:', err);
        console.error('[LOAD_RIDE] Error message:', err.message);
        console.error('[LOAD_RIDE] Error stack:', err.stack);
      }
    }

    function displayRouteAndMarkers() {
      console.log('[DISPLAY] Showing route and markers for active ride');
      displayRoute();
      displayCampusMarker();
      updateMarkerPositions();
    }

    function displayNoActiveRideMessage() {
      console.log('[DISPLAY_NO_RIDE_MESSAGE] Called - HIDING THE PANEL');
      const panelContent = document.querySelector('.panel-content');
      if (!panelContent) return;
      
      panelContent.innerHTML = `
        <div style="text-align: center; padding: 24px; color: var(--muted);">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin: 0 auto 12px; opacity: 0.5;">
            <path d="M2.5 13c0 6.627 5.373 12 12 12s12-5.373 12-12S21.627 1 15 1"/>
            <path d="M2 12h6m-3-3v6"/>
          </svg>
          <p style="font-weight: 600; margin-bottom: 8px;">No Active Ride</p>
          <p style="font-size: 0.85rem; margin-bottom: 18px;">Start a ride from driver or passenger map to track it here.</p>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <a class="btn btn-primary" href="driver-map.html" style="font-size: 0.85rem;">
              Go to Driver Map
            </a>
            <a class="btn btn-outline" href="passenger-map.html" style="font-size: 0.85rem;">
              Go to Passenger Map
            </a>
          </div>
        </div>
      `;
    }

    function renderRideInfo() {
      console.log('[RENDER_RIDE_INFO] Called, activeRide:', activeRide);
      const panel = document.getElementById('rideInfoPanel');
      console.log('[RENDER_RIDE_INFO] Panel element:', panel);
      console.log('[RENDER_RIDE_INFO] Panel classes:', panel?.className);
      console.log('[RENDER_RIDE_INFO] Panel display:', window.getComputedStyle(panel).display);
      
      // Ensure panel is expanded when showing active ride
      if (panel) {
        panel.classList.remove('collapsed');
        localStorage.removeItem('usj-rideshare-ride-info-panel-collapsed');
        console.log('[RENDER_RIDE_INFO] Removed collapsed class, panel should be visible');
      }
      
      // Update role pill
      const rolePill = document.querySelector('.role-pill');
      if (rolePill) {
        rolePill.textContent = isDriver ? 'Driver' : 'Passenger';
      }

      // Trip type
      const tripTypeText = activeRide.tripType === 'from_campus' ? 'From Campus' : 'To Campus';
      document.getElementById('rideTypeValue').textContent = tripTypeText;

      // Capacity
      const passengers = Array.isArray(activeRide.passengers) ? activeRide.passengers : [];
      document.getElementById('passengerCount').textContent = passengers.length;
      document.getElementById('capacityValue').textContent = activeRide.seatCapacity || '0';

      // Route info
      if (activeRide.route) {
        const distance = activeRide.route.distanceKm?.toFixed(1) || '—';
        const duration = activeRide.route.durationMin?.toFixed(0) || '—';
        document.getElementById('distanceValue').textContent = `${distance} km`;
        document.getElementById('estTimeValue').textContent = `~${duration} min`;
      }

      // Scheduled arrival
      if (activeRide.arrivalTime) {
        document.getElementById('scheduledArrivalValue').textContent = activeRide.arrivalTime;
      }

      // Participants
      renderParticipants();

      // Action buttons
      renderActionButtons();
    }

    function renderParticipants() {
      const driverCard = document.getElementById('driverCard');
      const passengersList = document.getElementById('passengersList');
      
      passengersList.innerHTML = '';

      if (isPassenger) {
        // Show driver info for passenger
        driverCard.style.display = 'flex';
        document.getElementById('driverName').textContent = DRIVER_PROFILE.fullName;
        document.getElementById('driverCar').textContent = `${DRIVER_PROFILE.carName} (${DRIVER_PROFILE.carPlate})`;
        document.getElementById('driverCallBtn').href = `tel:${DRIVER_PROFILE.phone}`;
      } else {
        // Show passengers for driver
        driverCard.style.display = 'none';
        const passengers = Array.isArray(activeRide.passengers) ? activeRide.passengers : [];
        
        if (passengers.length === 0) {
          passengersList.innerHTML = '<p class="panel-empty">No passengers yet.</p>';
          return;
        }

        passengers.forEach((passenger, idx) => {
          const card = document.createElement('div');
          card.className = 'participant-card';
          
          const pickupOrder = activeRide.tripType === 'from_campus' ? 'dropoff' : 'pickup';
          const label = `${pickupOrder.charAt(0).toUpperCase() + pickupOrder.slice(1)} #${idx + 1}`;
          
          card.innerHTML = `
            <span class="participant-label">${label}</span>
            <div class="participant-details">
              <span class="participant-name">${passenger.fullName || 'Unknown'}</span>
              <span class="participant-car">${passenger.phone || 'No phone'}</span>
            </div>
            <a class="btn btn-compact btn-outline" href="tel:${passenger.phone || '#'}" aria-label="Call passenger">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
              Call
            </a>
          `;
          passengersList.appendChild(card);
        });
      }
    }

    function renderActionButtons() {
      const btnStartRide = document.getElementById('btnStartRide');
      const btnConfirmPickup = document.getElementById('btnConfirmPickup');
      const btnEndRide = document.getElementById('btnEndRide');
      const btnCancelRide = document.getElementById('btnCancelRide');

      console.log('[RENDER_BUTTONS] Button elements found:', {
        btnStartRide: !!btnStartRide,
        btnConfirmPickup: !!btnConfirmPickup,
        btnEndRide: !!btnEndRide,
        btnCancelRide: !!btnCancelRide
      });

      // Driver: Show "Start Ride" button when ride is ready (not yet in transit)
      const isRideDriver = activeRide && activeRide.driverId && activeRide.driverId === DRIVER_PROFILE.id;
      const showStartRide = isRideDriver && activeRide.status && activeRide.status !== 'in_transit' && activeRide.status !== 'completed';
      
      console.log('[RENDER_BUTTONS] isRideDriver:', isRideDriver, 'showStartRide:', showStartRide, 'status:', activeRide?.status, 'driverId:', activeRide?.driverId, 'DRIVER_ID:', DRIVER_PROFILE.id);
      
      if (btnStartRide) {
        btnStartRide.style.display = showStartRide ? 'flex' : 'none';
        console.log('[RENDER_BUTTONS] Set btnStartRide.style.display to:', btnStartRide.style.display);
      }

      // Passenger: Show "Confirm Pickup" button (for confirmation workflow)
      const isRidePassenger = activeRide && !isRideDriver;
      const showConfirmPickup = isRidePassenger && activeRide.status && activeRide.status !== 'in_transit' && activeRide.status !== 'completed';
      if (btnConfirmPickup) btnConfirmPickup.style.display = showConfirmPickup ? 'flex' : 'none';

      // Show/hide end ride button
      const showEndRide = activeRide && activeRide.status === 'in_transit';
      if (btnEndRide) btnEndRide.style.display = showEndRide ? 'flex' : 'none';

      // Cancel ride is always available (both driver and passenger can cancel)
      if (btnCancelRide) btnCancelRide.style.display = 'flex';
    }



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
          
          // Update activeRide route with new coordinates
          if (activeRide && activeRide.route) {
            activeRide.route.coords = coords;
            activeRide.route.distanceKm = distance;
            activeRide.route.durationMin = duration;
            console.log('[RECALC_ROUTE] Updated activeRide.route:', activeRide.route);
          }
          
          if (callback) callback();
        })
        .catch(err => {
          console.error('[RECALC_ROUTE] Fetch error:', err);
          if (callback) callback();
        });
    }



    function displayCampusMarker() {
      // Display campus (destination) as dark blue marker
      if (!map) return;
      
      // Remove existing campus marker if any
      if (campusMarker) {
        map.removeLayer(campusMarker);
      }
      
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
      
      campusMarker = L.marker([CAMPUS_LAT, CAMPUS_LNG], { icon: campusIcon })
        .addTo(map)
        .bindPopup('<strong style="font-family:Inter,sans-serif;color:#002b59">Campus USJ</strong>');
      
      console.log('[DISPLAY_CAMPUS] Campus marker added at', CAMPUS_LAT, CAMPUS_LNG);
    }

    function displayRoute() {
      console.log('[DISPLAY_ROUTE] activeRide:', activeRide);
      console.log('[DISPLAY_ROUTE] activeRide.route:', activeRide?.route);
      console.log('[DISPLAY_ROUTE] activeRide.route.coords:', activeRide?.route?.coords);
      console.log('[DISPLAY_ROUTE] map:', map);
      
      if (!map || !map._container) {
        console.error('[DISPLAY_ROUTE] Map not initialized');
        return;
      }
      
      if (!activeRide.route || !activeRide.route.coords) {
        console.log('[DISPLAY_ROUTE] No route or coords, returning');
        return;
      }

      if (routeLine) {
        map.removeLayer(routeLine);
      }

      // Route coords are already in [lat, lng] format from driver-map
      const coords = activeRide.route.coords;
      console.log('[DISPLAY_ROUTE] Using coords (already [lat, lng]):', coords);
      routeLine = L.polyline(coords, {
        color: '#0072bb',
        weight: 5,
        opacity: 0.88,
      }).addTo(map);

      // Update route info in panel instead of adding control to map
      console.log('[DISPLAY_ROUTE] Route info - Distance:', activeRide.route.distanceKm, 'km, Duration:', activeRide.route.durationMin, 'min');

      // Fit map to route
      const bounds = L.latLngBounds(coords);
      map.fitBounds(bounds, { padding: [50, 50] });
    }

    function updateMarkerPositions() {
      if (!activeRide) {
        console.log('[UPDATE_MARKERS] No activeRide, returning');
        return;
      }

      const posData = localStorage.getItem(ACTIVE_RIDE_POSITIONS_KEY);
      if (!posData) {
        console.log('[UPDATE_MARKERS] No positions data in localStorage');
        return;
      }

      try {
        const positions = JSON.parse(posData);
        console.log('[UPDATE_MARKERS] Positions from localStorage:', positions);
        
        // Driver position (stored in new format or old format)
        let driverPos = positions.driver;
        if (!driverPos && positions.driverLat) {
          // Old format fallback
          driverPos = { lat: positions.driverLat, lng: positions.driverLng };
        }

        console.log('[UPDATE_MARKERS] Driver position:', driverPos);

        if (driverPos && typeof driverPos.lat === 'number' && typeof driverPos.lng === 'number') {
          const driverLatLng = L.latLng(driverPos.lat, driverPos.lng);
          
          if (!driverMarker) {
            console.log('[UPDATE_MARKERS] Creating driver marker at:', driverLatLng);
            const driverIcon = L.divIcon({
              className: '',
              html: `<svg width="38" height="46" viewBox="0 0 38 46">
                <defs>
                  <filter id="driver-shadow" x="-40%" y="-30%" width="180%" height="160%">
                    <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="rgba(0,0,0,0.32)"/>
                  </filter>
                </defs>
                <path d="M19 2C11.27 2 5 8.27 5 16c0 11.8 14 28 14 28S33 27.8 33 16C33 8.27 26.73 2 19 2z"
                      fill="#dc2626" filter="url(#driver-shadow)" stroke="rgba(255,255,255,0.85)" stroke-width="1.4"/>
                <circle cx="19" cy="16" r="6.5" fill="rgba(255,255,255,0.95)"/>
                <circle cx="19" cy="16" r="3.5" fill="#dc2626"/>
              </svg>`,
              iconSize: [38, 46], iconAnchor: [19, 46],
            });
            driverMarker = L.marker(driverLatLng, { icon: driverIcon })
              .addTo(map)
              .bindPopup(`<strong>${DRIVER_PROFILE.fullName}</strong><br>${DRIVER_PROFILE.carName}`);
            console.log('[UPDATE_MARKERS] Driver marker created');
          } else {
            console.log('[UPDATE_MARKERS] Updating driver marker to:', driverLatLng);
            driverMarker.setLatLng(driverLatLng);
          }
        } else {
          console.log('[UPDATE_MARKERS] Driver position invalid or missing');
        }

        // Update or create passenger markers
        const passengers = Array.isArray(activeRide.passengers) ? activeRide.passengers : [];
        console.log('[UPDATE_MARKERS] Passengers in activeRide:', passengers.length);
        
        passengers.forEach((passenger, idx) => {
          const passengerPosKey = `passenger_${passenger.id}`;
          let passengerPos = positions[passengerPosKey];
          
          // Also check old format
          if (!passengerPos && positions.passenger && idx === 0) {
            passengerPos = positions.passenger;
          }

          console.log(`[UPDATE_MARKERS] Passenger ${idx} (id: ${passenger.id}, key: ${passengerPosKey}):`, passengerPos);

          if (passengerPos && typeof passengerPos.lat === 'number' && typeof passengerPos.lng === 'number') {
            const passengerLatLng = L.latLng(passengerPos.lat, passengerPos.lng);
            
            if (!passengerMarkers[passenger.id]) {
              console.log(`[UPDATE_MARKERS] Creating passenger marker ${passenger.id} at:`, passengerLatLng);
              const passengerIcon = L.divIcon({
                className: '',
                html: `<svg width="38" height="46" viewBox="0 0 38 46">
                  <defs>
                    <filter id="passenger-shadow" x="-40%" y="-30%" width="180%" height="160%">
                      <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="rgba(0,0,0,0.32)"/>
                    </filter>
                  </defs>
                  <path d="M19 2C11.27 2 5 8.27 5 16c0 11.8 14 28 14 28S33 27.8 33 16C33 8.27 26.73 2 19 2z"
                        fill="#f59e0b" filter="url(#passenger-shadow)" stroke="rgba(255,255,255,0.85)" stroke-width="1.4"/>
                  <circle cx="19" cy="16" r="6.5" fill="rgba(255,255,255,0.95)"/>
                  <circle cx="19" cy="16" r="3.5" fill="#f59e0b"/>
                </svg>`,
                iconSize: [38, 46], iconAnchor: [19, 46],
              });
              passengerMarkers[passenger.id] = L.marker(passengerLatLng, { icon: passengerIcon })
                .addTo(map)
                .bindPopup(`<strong>${passenger.fullName || passenger.name}</strong><br>Awaiting pickup…`);
              console.log(`[UPDATE_MARKERS] Passenger marker ${passenger.id} created`);
            } else {
              console.log(`[UPDATE_MARKERS] Updating passenger marker ${passenger.id} to:`, passengerLatLng);
              passengerMarkers[passenger.id].setLatLng(passengerLatLng);
            }
          } else {
            console.log(`[UPDATE_MARKERS] Passenger ${passenger.id} position invalid or missing`);
          }
        });
      } catch (err) {
        console.error('[UPDATE_MARKERS] Error updating marker positions:', err);
      }
    }

    /* =====================================================================
       ACTION HANDLERS
    ===================================================================== */
    function startRide() {
      if (!isDriver || !activeRide) return;
      
      activeRide.status = 'in_transit';
      localStorage.setItem(ACTIVE_RIDE_STORAGE_KEY, JSON.stringify(activeRide));
      
      // Update published ride status
      updatePublishedRideStatus('in_transit');
      
      renderRideInfo();
      renderActionButtons();
      setStatus('Ride started. In transit…');
    }

    function confirmPickup() {
      if (!isDriver || !activeRide) return;
      
      activeRide.status = 'in_transit';
      localStorage.setItem(ACTIVE_RIDE_STORAGE_KEY, JSON.stringify(activeRide));
      
      // Update published ride status
      updatePublishedRideStatus('in_transit');
      
      renderRideInfo();
      setStatus('Ride confirmed. In transit…');
    }

    function endRide() {
      if (!activeRide) return;
      
      if (!confirm('Are you sure you want to end this ride?')) return;
      
      activeRide.status = 'completed';
      localStorage.setItem(ACTIVE_RIDE_STORAGE_KEY, JSON.stringify(activeRide));
      
      // Update published ride status
      updatePublishedRideStatus('completed');
      
      // Clean up
      localStorage.removeItem(ACTIVE_RIDE_POSITIONS_KEY);
      localStorage.removeItem(ACTIVE_RIDE_STORAGE_KEY);
      localStorage.removeItem(JOIN_REQUEST_STORAGE_KEY);
      localStorage.removeItem(REQUEST_STORAGE_KEY);
      
      setStatus('Ride completed!');
      
      setTimeout(() => {
        window.location.href = isDriver ? 'driver-map.html' : 'passenger-map.html';
      }, 1500);
    }

    function cancelRide() {
      if (!activeRide) return;
      
      if (!confirm('Are you sure you want to cancel this ride?')) return;
      
      // Remove published ride completely
      removePublishedRide(activeRide.rideId);
      
      // Clean up
      localStorage.removeItem(ACTIVE_RIDE_POSITIONS_KEY);
      localStorage.removeItem(ACTIVE_RIDE_STORAGE_KEY);
      localStorage.removeItem(JOIN_REQUEST_STORAGE_KEY);
      localStorage.removeItem(REQUEST_STORAGE_KEY);
      
      setStatus('Ride cancelled.');
      
      setTimeout(() => {
        window.location.href = isDriver ? 'driver-map.html' : 'passenger-map.html';
      }, 1500);
    }

    function updatePublishedRideStatus(newStatus) {
      if (!activeRide || !activeRide.rideId) return;
      
      const raw = localStorage.getItem(RIDE_PUBLISH_STORAGE_KEY);
      if (!raw) return;
      
      try {
        const rides = JSON.parse(raw);
        const ride = rides.find(r => r.rideId === activeRide.rideId);
        if (ride) {
          ride.status = newStatus;
          localStorage.setItem(RIDE_PUBLISH_STORAGE_KEY, JSON.stringify(rides));
        }
      } catch (err) {
        console.error('Failed to update published ride:', err);
      }
    }

    function removePublishedRide(rideId) {
      if (!rideId) return;
      
      const raw = localStorage.getItem(RIDE_PUBLISH_STORAGE_KEY);
      if (!raw) return;
      
      try {
        const rides = JSON.parse(raw);
        const filtered = rides.filter(r => r.rideId !== rideId);
        localStorage.setItem(RIDE_PUBLISH_STORAGE_KEY, JSON.stringify(filtered));
      } catch (err) {
        console.error('Failed to remove published ride:', err);
      }
    }

    /* =====================================================================
       UTILITIES
    ===================================================================== */
    function setStatus(message, type = 'normal') {
      const statusBox = document.getElementById('statusBox');
      const statusText = document.getElementById('statusText');
      const statusDot = document.getElementById('statusDot');
      
      statusText.textContent = message;
      statusBox.classList.remove('error', 'loading');
      
      if (type === 'error') {
        statusBox.classList.add('error');
      } else if (type === 'loading') {
        statusBox.classList.add('loading');
      }
    }
