// Centralized Xano API client for the React app (auth, routes, ride requests, driver verification, logs).

const API_AUTH = import.meta.env.VITE_XANO_API_AUTH ?? "https://x8ki-letl-twmt.n7.xano.io/api:ygUcA_ly";
const API_CARPOOLING = import.meta.env.VITE_XANO_API_CARPOOLING ?? "https://x8ki-letl-twmt.n7.xano.io/api:vvB8rJTu";
const API_MEMBERS = import.meta.env.VITE_XANO_API_MEMBERS ?? "https://x8ki-letl-twmt.n7.xano.io/api:-b4yJx1H";
const API_LOGS = import.meta.env.VITE_XANO_API_LOGS ?? "https://x8ki-letl-twmt.n7.xano.io/api:VwkRVjqj";

function getToken(): string | null {
  return localStorage.getItem("xano_token");
}

function setToken(token: string) {
  localStorage.setItem("xano_token", token);
}

function clearToken() {
  localStorage.removeItem("xano_token");
}

async function request<T>(
  base: string,
  path: string,
  options: {
    method?: string;
    body?: unknown;
    auth?: boolean;
  } = {}
): Promise<T> {
  const { method = "GET", body, auth = false } = options;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${base}/${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Erreur réseau" }));
    throw new Error(err.message || `Erreur ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// ??? Auth ????????????????????????????????????????????
function isMissingXanoEndpointError(reason: unknown): boolean {
  const message = reason instanceof Error ? reason.message : String(reason ?? "");
  return message.toLowerCase().includes("unable to locate request");
}

export async function login(email: string, password: string) {
  const data = await request<Record<string, unknown>>(API_AUTH, "login", {
    method: "POST",
    body: { email, password },
  });

  const token =
    (typeof (data as any).authToken === "string" && (data as any).authToken) ||
    (typeof (data as any).token === "string" && (data as any).token) ||
    (typeof (data as any).auth_token === "string" && (data as any).auth_token) ||
    (typeof (data as any).jwt === "string" && (data as any).jwt) ||
    null;

  if (!token) {
    throw new Error("Connexion: jeton manquant dans la réponse API.");
  }

  setToken(token);
  return data;
}

// Event logs group also exposes an auth/login endpoint (useful for debugging or admin setups).
// The app currently authenticates via API_AUTH/login; this helper is here to match the logs API group.
export async function loginEventLogs(email: string, password: string) {
  const data = await request<Record<string, unknown>>(API_LOGS, "auth/login", {
    method: "POST",
    body: { email, password },
  });

  const token =
    (typeof (data as any).authToken === "string" && (data as any).authToken) ||
    (typeof (data as any).token === "string" && (data as any).token) ||
    (typeof (data as any).auth_token === "string" && (data as any).auth_token) ||
    (typeof (data as any).jwt === "string" && (data as any).jwt) ||
    null;

  if (!token) {
    throw new Error("Connexion (logs): jeton manquant dans la réponse API.");
  }

  setToken(token);
  return data;
}

export async function signup(name: string, email: string, password: string) {
  const data = await request<Record<string, unknown>>(API_AUTH, "auth/signup", {
    method: "POST",
    body: { name, email, password },
  });

  const token =
    (typeof (data as any).authToken === "string" && (data as any).authToken) ||
    (typeof (data as any).token === "string" && (data as any).token) ||
    (typeof (data as any).auth_token === "string" && (data as any).auth_token) ||
    (typeof (data as any).jwt === "string" && (data as any).jwt) ||
    null;

  if (!token) {
    throw new Error("Inscription: jeton manquant dans la réponse API.");
  }

  setToken(token);
  return data;
}

export async function getMe() {
  return request<Record<string, unknown>>(API_AUTH, "auth/me", { auth: true });
}

// ??? Accepted Rides (new table) ???????????????????????????????????????????
export async function getAcceptedRides() {
  return request<unknown[]>(API_AUTH, "accepted_ride", { auth: true });
}

export async function getAcceptedRide(id: number) {
  return request<Record<string, unknown>>(API_AUTH, `accepted_ride/${id}`, { auth: true });
}

export async function createAcceptedRide(data: Record<string, unknown>) {
  return request<Record<string, unknown>>(API_AUTH, "accepted_ride", {
    method: "POST",
    body: data,
    auth: true,
  });
}

// Accept Ride (driver-side record)
export async function createAcceptRide(data: Record<string, unknown>) {
  return request<Record<string, unknown>>(API_CARPOOLING, "accept_ride", {
    method: "POST",
    body: data,
    auth: true,
  });
}

export async function declineRideRequest(ride_request_id: number) {
  return request<Record<string, unknown>>(API_CARPOOLING, "decline_ride", {
    method: "POST",
    body: { ride_request_id },
    auth: true,
  });
}

export async function cancelRideRequest(ride_request_id: number) {
  return request<Record<string, unknown>>(API_CARPOOLING, "cancel_ride", {
    method: "POST",
    body: { ride_request_id },
    auth: true,
  });
}

export async function updatePassengerStatus(data: {
  isLookingForRide: boolean;
  latitude?: number;
  longitude?: number;
}) {
  return request<Record<string, unknown>>(API_CARPOOLING, "passengers", {
    method: "POST",
    body: data,
    auth: true,
  });
}

export async function replaceAcceptedRide(id: number, data: Record<string, unknown>) {
  return request<Record<string, unknown>>(API_AUTH, `accepted_ride/${id}`, {
    method: "PUT",
    body: data,
    auth: true,
  });
}

export async function updateAcceptedRide(id: number, data: Record<string, unknown>) {
  return request<Record<string, unknown>>(API_AUTH, `accepted_ride/${id}`, {
    method: "PATCH",
    body: data,
    auth: true,
  });
}

export async function deleteAcceptedRide(id: number) {
  return request(API_AUTH, `accepted_ride/${id}`, { method: "DELETE", auth: true });
}

export function logout() {
  clearToken();
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

// ??? Email Verification ?????????????????????????????
export async function sendVerificationEmail() {
  return request(API_AUTH, "send-verification-email", {
    method: "POST",
    auth: true,
  });
}

export async function verifyEmail(token: string) {
  return request<{ message: string }>(API_AUTH, "auth/verify-email", {
    method: "POST",
    body: { token },
  });
}

// ??? Password Reset ??????????????????????????????????
export async function requestResetLink(email: string) {
  return request(API_AUTH, `reset/request-reset-link?email=${encodeURIComponent(email)}`, {
    method: "GET",
  });
}

// ??? Driver Detail (multipart upload) ????????????????
export async function createDriverDetailMultipart(data: {
  id: string;
  user_id: number;
  car_model: string;
  car_plate_number: string;
  license_number: string;
  phone_number: string;
  license_photo: File;
  car_registration_photo: File;
}) {
  const formData = new FormData();
  formData.append("car_model", data.car_model);
  formData.append("car_plate_number", data.car_plate_number);
  formData.append("license_number", data.license_number);
  formData.append("phone_number", data.phone_number);

  formData.append("license_photo", data.license_photo, data.license_photo.name);
  formData.append("car_registration_photo", data.car_registration_photo, data.car_registration_photo.name);

  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_CARPOOLING}/driver_detail`, {
    method: "POST",
    headers,
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Erreur réseau" }));
    throw new Error(err.message || `Erreur ${res.status}`);
  }
  return res.json();
}

// ??? Driver Application (multipart upload) ???????????
export async function createDriverApplication(data: {
  user_id: number;
  email: string;
  car_model: string;
  car_plate_number: string;
  license_number: string;
  phone_number: string;
  license_photo: File;
  car_registration_photo: File;
}) {
  const formData = new FormData();
  formData.append("car_model", data.car_model);
  formData.append("car_plate_number", data.car_plate_number);
  formData.append("license_number", data.license_number);
  formData.append("phone_number", data.phone_number);

  formData.append("license_photo", data.license_photo, data.license_photo.name);
  formData.append(
    "car_registration_photo",
    data.car_registration_photo,
    data.car_registration_photo.name
  );

  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_CARPOOLING}/driver_detail`, {
    method: "POST",
    headers,
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Erreur réseau" }));
    throw new Error(err.message || `Erreur ${res.status}`);
  }
  return res.json();
}

// ??? Routes (rides) ??????????????????????????????????
export async function getRoutes() {
  // Endpoint is Public in Xano; avoid sending auth header to prevent masked routing errors.
  try {
    return await request<unknown[]>(API_CARPOOLING, "route", { auth: false });
  } catch {
    // Fallback if the endpoint is later switched to Private.
    return request<unknown[]>(API_CARPOOLING, "route", { auth: true });
  }
}

export async function getRoute(id: number) {
  try {
    return await request<Record<string, unknown>>(API_CARPOOLING, `route/${id}`, { auth: false });
  } catch {
    return request<Record<string, unknown>>(API_CARPOOLING, `route/${id}`, { auth: true });
  }
}

export async function createRoute(data: Record<string, unknown>) {
  return request<Record<string, unknown>>(API_CARPOOLING, "route", {
    method: "POST",
    body: data,
    auth: true,
  });
}

function isLikelySchemaError(reason: unknown): boolean {
  const message = reason instanceof Error ? reason.message : String(reason ?? "");
  const m = message.toLowerCase();
  return (
    m.includes("invalid") ||
    m.includes("field") ||
    m.includes("column") ||
    m.includes("schema") ||
    m.includes("unknown") ||
    m.includes("unexpected")
  );
}

export async function createRouteWithFallback(payload: Record<string, unknown>, fallback: Record<string, unknown>) {
  try {
    return await createRoute(payload);
  } catch (err) {
    // If Xano hasn't been updated with the new columns yet, retry with minimal fields so the app still works.
    if (isLikelySchemaError(err)) {
      return createRoute(fallback);
    }
    throw err;
  }
}

export async function updateRoute(id: number, data: Record<string, unknown>) {
  return request<Record<string, unknown>>(API_CARPOOLING, `route/${id}`, {
    method: "PATCH",
    body: data,
    auth: true,
  });
}

export async function deleteRoute(id: number) {
  return request(API_CARPOOLING, `route/${id}`, { method: "DELETE", auth: true });
}

// ??? Ride Requests ???????????????????????????????????
export async function getRideRequests() {
  try {
    return await request<unknown[]>(API_CARPOOLING, "ride_request", { auth: true });
  } catch (err) {
    // If the standard endpoint is hidden/disabled, try the alternate path used by your custom logic endpoint.
    if (isMissingXanoEndpointError(err)) {
      try {
        return await request<unknown[]>(API_CARPOOLING, "ride_request/ride_requests", { auth: true });
      } catch {
        return request<unknown[]>(API_CARPOOLING, "ride_request", { auth: false });
      }
    }

    // Some setups expose this table as Public; retry without auth if token-scoped access fails.
    try {
      return await request<unknown[]>(API_CARPOOLING, "ride_request", { auth: false });
    } catch {
      // fallthrough
    }
    throw err;
  }
}

export async function createRideRequest(data: Record<string, unknown>) {
  return request<Record<string, unknown>>(API_CARPOOLING, "ride_request", {
    method: "POST",
    body: data,
    auth: true,
  });
}

export async function createRideRequestWithChecks(data: Record<string, unknown>) {
  // Custom endpoint that performs scheduling-conflict checks (can't join 2 rides, can't join own ride, etc.).
  try {
    return await request<Record<string, unknown>>(API_CARPOOLING, "ride_request/ride_requests", {
      method: "POST",
      body: data,
      auth: true,
    });
  } catch (err) {
    // If that custom endpoint isn't deployed, fall back to the base table endpoint.
    if (isMissingXanoEndpointError(err)) {
      return request<Record<string, unknown>>(API_CARPOOLING, "ride_request", {
        method: "POST",
        body: data,
        auth: true,
      });
    }
    throw err;
  }
}

export async function updateRideRequest(id: number, data: Record<string, unknown>) {
  return request<Record<string, unknown>>(API_CARPOOLING, `ride_request/${id}`, {
    method: "PATCH",
    body: data,
    auth: true,
  });
}

export async function deleteRideRequest(id: number) {
  return request(API_CARPOOLING, `ride_request/${id}`, { method: "DELETE", auth: true });
}

// ??? Feedback ????????????????????????????????????????
export async function getFeedbacks() {
  // Public endpoint in Xano (no auth required). Avoid sending possibly-mismatched tokens.
  return request<unknown[]>(API_CARPOOLING, "feedback", { auth: false });
}

export async function getFeedback(id: number) {
  return request<Record<string, unknown>>(API_CARPOOLING, `feedback/${id}`, { auth: false });
}

export async function createFeedback(data: Record<string, unknown>) {
  return request<Record<string, unknown>>(API_CARPOOLING, "feedback", {
    method: "POST",
    body: data,
    auth: true,
  });
}

export async function updateFeedback(id: number, data: Record<string, unknown>) {
  return request<Record<string, unknown>>(API_CARPOOLING, `feedback/${id}`, {
    method: "PATCH",
    body: data,
    auth: true,
  });
}

export async function deleteFeedback(id: number) {
  return request(API_CARPOOLING, `feedback/${id}`, { method: "DELETE", auth: true });
}

// ??? Driver Details ??????????????????????????????????
export async function getDriverDetails() {
  return request<unknown[]>(API_CARPOOLING, "driver_detail", { auth: true });
}

// ??? Driver Verification ?????????????????????????????
export async function verifyDriver() {
  // Returns { is_driver: boolean, profile: {..., driver_status?: string }, driver_detail?: {...} }
  return request<Record<string, unknown>>(API_CARPOOLING, "verifydriver", { auth: true });
}

export async function createDriverDetail(data: Record<string, unknown>) {
  return request<Record<string, unknown>>(API_CARPOOLING, "driver_detail", {
    method: "POST",
    body: data,
    auth: true,
  });
}

export async function updateDriverDetail(id: number, data: Record<string, unknown>) {
  return request<Record<string, unknown>>(API_CARPOOLING, `driver_detail/${id}`, {
    method: "PATCH",
    body: data,
    auth: true,
  });
}

export async function approveDriverDetail(id: number) {
  return updateDriverDetail(id, { status: "approved" });
}

export async function rejectDriverDetail(id: number) {
  return updateDriverDetail(id, { status: "rejected" });
}

// ??? User Profile (Members API) ?????????????????????
export async function editProfile(data: Record<string, unknown>) {
  return request<Record<string, unknown>>(API_MEMBERS, "user/edit_profile", {
    method: "PATCH",
    body: data,
    auth: true,
  });
}

export async function createAccount(data: Record<string, unknown>) {
  return request<Record<string, unknown>>(API_MEMBERS, "account", {
    method: "POST",
    body: data,
    auth: true,
  });
}

export async function getAccountDetails(accountId: number) {
  // Endpoint is documented as GET with an input; pass as query param for compatibility.
  return request<Record<string, unknown>>(
    API_MEMBERS,
    `account/details?account_id=${encodeURIComponent(String(accountId))}`,
    { auth: true },
  );
}

export async function getMyTeamMembers() {
  return request<unknown[]>(API_MEMBERS, "account/my_team_members", { auth: true });
}

export async function joinAccount(data: Record<string, unknown>) {
  return request<Record<string, unknown>>(API_MEMBERS, "user/join_account", {
    method: "POST",
    body: data,
    auth: true,
  });
}

export async function adminUpdateUserRole(data: Record<string, unknown>) {
  return request<Record<string, unknown>>(API_MEMBERS, "admin/user_role", {
    method: "POST",
    body: data,
    auth: true,
  });
}

// ??? Logs ????????????????????????????????????????????
export async function getMyEvents() {
  return request<unknown[]>(API_LOGS, "logs/user/my_events", { auth: true });
}

export async function getAccountEvents() {
  // Admin-only endpoint: returns all events for the account
  return request<unknown[]>(API_LOGS, "logs/admin/account_events", { auth: true });
}

export async function logEvent(action: string, metadata: Record<string, unknown> = {}) {
  try {
    return await request<Record<string, unknown>>(API_LOGS, "event_log", {
      method: "POST",
      body: { action, metadata },
      auth: true,
    });
  } catch {
    return null;
  }
}
