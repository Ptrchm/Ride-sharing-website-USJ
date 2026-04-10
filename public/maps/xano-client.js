// Minimal Xano client for static map pages (driver-map.html / passenger-map.html / my-map.html)
// Uses the auth token stored by the React app in localStorage under "xano_token".

(() => {
  const API_AUTH = "https://x8ki-letl-twmt.n7.xano.io/api:ygUcA_ly";
  const API_CARPOOLING = "https://x8ki-letl-twmt.n7.xano.io/api:vvB8rJTu";
  const API_LOGS = "https://x8ki-letl-twmt.n7.xano.io/api:VwkRVjqj";

  function getToken() {
    return localStorage.getItem("xano_token");
  }

  async function request(base, path, { method = "GET", body, auth = false } = {}) {
    const headers = { "Content-Type": "application/json" };
    if (auth) {
      const token = getToken();
      if (token) headers.Authorization = `Bearer ${token}`;
    }

    const res = await fetch(`${base}/${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: "Network error" }));
      const msg = err && (err.message || err.error) ? String(err.message || err.error) : `HTTP ${res.status}`;
      throw new Error(msg);
    }
    if (res.status === 204) return null;
    return res.json();
  }

  async function getMe() {
    return request(API_AUTH, "auth/me", { auth: true });
  }

  async function verifyDriver() {
    return request(API_CARPOOLING, "verifydriver", { auth: true });
  }

  async function upsertPassenger(payload) {
    return request(API_CARPOOLING, "passengers", { method: "POST", body: payload, auth: true });
  }

  async function getPassengerStatus() {
    return request(API_CARPOOLING, "passengers/status", { auth: true });
  }

  async function getLookingPassengers() {
    // Returns passengers where isLookingForRide=true (auth required)
    return request(API_CARPOOLING, "passengers", { auth: true });
  }

  async function getRoutes() {
    return request(API_CARPOOLING, "route", { auth: false });
  }

  async function getDriverActiveRoute() {
    return request(API_CARPOOLING, "route/active", { auth: true });
  }

  async function getRouteByDriver(driver_id) {
    return request(API_CARPOOLING, `route/driver/${driver_id}`, { auth: true });
  }

  async function getRoute(id) {
    return request(API_CARPOOLING, `route/${id}`, { auth: false });
  }

  async function createRoute(payload) {
    return request(API_CARPOOLING, "route", { method: "POST", body: payload, auth: true });
  }

  async function deleteRoute(id) {
    return request(API_CARPOOLING, `route/${id}`, { method: "DELETE", auth: true });
  }

  async function cancelRoute(route_id) {
    return request(API_CARPOOLING, "cancel_route", { method: "POST", body: { route_id }, auth: true });
  }

  async function getRideRequests() {
    return request(API_CARPOOLING, "ride_request", { auth: true });
  }

  async function createRideRequest(payload) {
    return request(API_CARPOOLING, "ride_request", { method: "POST", body: payload, auth: true });
  }

  async function invitePassenger(payload) {
    return request(API_CARPOOLING, "ride_request/invite", { method: "POST", body: payload, auth: true });
  }

  async function acceptRideRequest(ride_request_id) {
    return request(API_CARPOOLING, "accept_ride", { method: "POST", body: { ride_request_id }, auth: true });
  }

  async function acceptInvite(ride_request_id) {
    return request(API_CARPOOLING, "accept_invite", { method: "POST", body: { ride_request_id }, auth: true });
  }

  async function declineRideRequest(ride_request_id) {
    return request(API_CARPOOLING, "decline_ride", { method: "POST", body: { ride_request_id }, auth: true });
  }

  async function cancelRideRequest(ride_request_id) {
    return request(API_CARPOOLING, "cancel_ride", { method: "POST", body: { ride_request_id }, auth: true });
  }

  async function driverCancelRideRequest(ride_request_id) {
    return request(API_CARPOOLING, "driver_cancel_ride", { method: "POST", body: { ride_request_id }, auth: true });
  }

  async function getAcceptedRides() {
    return request(API_AUTH, "accepted_ride", { auth: true });
  }

  async function logEvent(action, metadata) {
    // Best-effort: do not block UI if logs group isn't configured.
    try {
      return await request(API_LOGS, "event_log", { method: "POST", body: { action, metadata }, auth: true });
    } catch {
      return null;
    }
  }

  window.XANO = {
    API_AUTH,
    API_CARPOOLING,
    API_LOGS,
    request,
    getMe,
    verifyDriver,
    upsertPassenger,
    getPassengerStatus,
    getLookingPassengers,
    getRoutes,
    getDriverActiveRoute,
    getRouteByDriver,
    getRoute,
    createRoute,
    deleteRoute,
    cancelRoute,
    getRideRequests,
    createRideRequest,
    invitePassenger,
    acceptRideRequest,
    acceptInvite,
    declineRideRequest,
    cancelRideRequest,
    driverCancelRideRequest,
    getAcceptedRides,
    logEvent,
  };
})();
