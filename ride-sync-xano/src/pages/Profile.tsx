import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import {
  approveDriverDetail,
  createAcceptRide,
  createAcceptedRide,
  getAcceptedRides,
  getDriverDetails,
  getRideRequests,
  getRoutes,
  rejectDriverDetail,
  updateRoute,
  updateRideRequest,
  verifyDriver,
} from "@/lib/api";
import { formatDepartureDate, formatDepartureTime } from "@/lib/helpers";
import { toast } from "@/hooks/use-toast";
import { ArrowRight, LogOut, MapPin } from "lucide-react";

type Route = {
  id: number;
  user_id: number;
  departure_location_name?: string;
  arrival_location_name?: string;
  departure_time?: number;
  available_seats?: number;
  price_per_seat?: number | string;
};

type RideRequest = {
  id: number;
  route_id: number;
  passenger_user_id: number;
  driver_user_id?: number;
  status?: string;
};

type RideRequestWithRoute = RideRequest & { route?: Route };

type DriverDetail = {
  id?: number;
  user_id?: number;
  email?: string;
  status?: string;
  car_model?: string;
  car_plate_number?: string;
  phone_number?: string;
};

type AcceptedRide = {
  id?: number;
  ride_request_id?: number;
  passenger_user_id?: number;
  passenger_id?: number;
  driver_user_id?: number;
  rider_user_id?: number;
  route_id?: number;
  ride_id?: number;
  seats_booked?: number;
  remaining_seats?: number;
  available_seats?: number;
  created_at?: string | number;
  status?: string;
};

type VerifyDriverResponse = {
  is_driver?: boolean;
  profile?: { driver_status?: string };
  driver_detail?: DriverDetail;
};

type DriverStatus = "approved" | "pending" | "rejected" | "unknown";

function toDriverStatus(input: unknown): DriverStatus {
  const v = String(input ?? "").toLowerCase().trim();
  if (v === "approved") return "approved";
  if (v === "pending") return "pending";
  if (v === "rejected") return "rejected";
  return v ? "unknown" : "pending";
}

function asArray<T>(v: unknown): T[] {
  if (Array.isArray(v)) return v as T[];
  if (v && typeof v === "object") {
    const obj = v as any;
    if (Array.isArray(obj.items)) return obj.items as T[];
    if (Array.isArray(obj.data)) return obj.data as T[];
    if (Array.isArray(obj.records)) return obj.records as T[];
  }
  return [];
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function isMissingXanoEndpointError(reason: unknown): boolean {
  const message = reason instanceof Error ? reason.message : String(reason ?? "");
  return message.toLowerCase().includes("unable to locate request");
}

function getAcceptedRidePassengerId(r: AcceptedRide): number | null {
  if (typeof r.passenger_user_id === "number") return r.passenger_user_id;
  if (typeof r.passenger_id === "number") return r.passenger_id;
  return null;
}

function getAcceptedRideRouteId(r: AcceptedRide): number | null {
  if (typeof r.route_id === "number") return r.route_id;
  if (typeof r.ride_id === "number") return r.ride_id;
  return null;
}

function getAcceptedRideRemainingSeats(r: AcceptedRide): number | null {
  if (typeof r.remaining_seats === "number") return r.remaining_seats;
  if (typeof r.available_seats === "number") return r.available_seats;
  return null;
}

function getAcceptedRideSeatsBooked(r: AcceptedRide): number | null {
  if (typeof r.seats_booked === "number") return r.seats_booked;
  return null;
}

export default function Profile() {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();

  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [driverActionLoading, setDriverActionLoading] = useState(false);

  const [created, setCreated] = useState<Route[]>([]);
  const [joined, setJoined] = useState<RideRequestWithRoute[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<RideRequestWithRoute[]>([]);
  const [driverDetailsMap, setDriverDetailsMap] = useState<Map<number, DriverDetail>>(new Map());

  const [driverDetail, setDriverDetail] = useState<DriverDetail | null>(null);
  const [driverStatus, setDriverStatus] = useState<DriverStatus>("pending");
  const [driverLoading, setDriverLoading] = useState(true);
  const [acceptedRides, setAcceptedRides] = useState<AcceptedRide[]>([]);

  const isAdmin = Boolean((user as any)?.is_admin || (user as any)?.role === "admin");

  const reload = useCallback(async () => {
    if (!user) return;
    setPageError(null);
    setPageLoading(true);
    setDriverLoading(true);

    try {
      const [routesRes, requestsRes, driverDetailsRes, verifyRes] = await Promise.allSettled([
        getRoutes(),
        getRideRequests(),
        getDriverDetails(),
        verifyDriver(),
      ]);
      const acceptedRes = await Promise.allSettled([getAcceptedRides()]);

      const routes = routesRes.status === "fulfilled" ? asArray<Route>(routesRes.value) : [];
      const requests = requestsRes.status === "fulfilled" ? asArray<RideRequest>(requestsRes.value) : [];
      const driverDetails =
        driverDetailsRes.status === "fulfilled" ? asArray<DriverDetail>(driverDetailsRes.value) : [];
      const verify = (verifyRes.status === "fulfilled" ? verifyRes.value : null) as VerifyDriverResponse | null;
      const accepted = acceptedRes[0].status === "fulfilled" ? asArray<AcceptedRide>(acceptedRes[0].value) : [];
      setAcceptedRides(accepted);

      const failures: string[] = [];
      if (routesRes.status === "rejected" && !isMissingXanoEndpointError(routesRes.reason)) {
        failures.push(routesRes.reason instanceof Error ? routesRes.reason.message : "Erreur routes.");
      }
      if (requestsRes.status === "rejected" && !isMissingXanoEndpointError(requestsRes.reason)) {
        failures.push(requestsRes.reason instanceof Error ? requestsRes.reason.message : "Erreur ride requests.");
      }
      // Don't hard-fail the whole profile: still show driver verification even if trips can't load.
      if (failures.length > 0) setPageError(failures[0]);

      if (routesRes.status === "rejected" && isMissingXanoEndpointError(routesRes.reason)) {
        console.warn("[Profile] Xano routes endpoint not found:", routesRes.reason);
      }
      if (requestsRes.status === "rejected" && isMissingXanoEndpointError(requestsRes.reason)) {
        console.warn("[Profile] Xano ride_request endpoint not found:", requestsRes.reason);
      }

      const routeMap = new Map<number, Route>(routes.map((r) => [r.id, r]));

      const dMap = new Map<number, DriverDetail>();
      for (const d of driverDetails) {
        if (typeof d?.user_id === "number") dMap.set(d.user_id, d);
      }
      setDriverDetailsMap(dMap);

      setCreated(routes.filter((r) => r.user_id === user.id));

      const myRequests = requests.filter((r) => r.passenger_user_id === user.id);
      setJoined(myRequests.map((req) => ({ ...req, route: routeMap.get(req.route_id) })));

      const incoming = requests
        .map((req) => ({ ...req, route: routeMap.get(req.route_id) }))
        .filter((req) => req.route && req.route.user_id === user.id && req.passenger_user_id !== user.id);
      setIncomingRequests(incoming);

      if (verify && typeof verify.is_driver === "boolean") {
        const statusFromVerify =
          verify.driver_detail?.status ?? verify.profile?.driver_status ?? (verify.is_driver ? "approved" : "pending");
        setDriverStatus(verify.is_driver ? "approved" : toDriverStatus(statusFromVerify));
        setDriverDetail(verify.driver_detail ?? null);
      } else {
        const found = driverDetails.find(
          (d) =>
            d.user_id === user.id ||
            (isNonEmptyString(d.email) && d.email.toLowerCase() === String(user.email ?? "").toLowerCase())
        );
        setDriverDetail(found ?? null);
        setDriverStatus(found ? toDriverStatus(found.status) : "pending");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      setPageError(message);
    } finally {
      setPageLoading(false);
      setDriverLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      await reload();
      if (!active) return;
    })();
    return () => {
      active = false;
    };
  }, [reload, user]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleApproveDriver = async () => {
    if (!driverDetail?.id) return;
    setDriverActionLoading(true);
    try {
      await approveDriverDetail(driverDetail.id);
      toast({ title: "Demande conducteur approuvée" });
      await reload();
    } catch (err) {
      toast({
        title: "Erreur",
        description: err instanceof Error ? err.message : "Impossible d'approuver",
        variant: "destructive",
      });
    } finally {
      setDriverActionLoading(false);
    }
  };

  const handleRejectDriver = async () => {
    if (!driverDetail?.id) return;
    setDriverActionLoading(true);
    try {
      await rejectDriverDetail(driverDetail.id);
      toast({ title: "Demande conducteur refusée" });
      await reload();
    } catch (err) {
      toast({
        title: "Erreur",
        description: err instanceof Error ? err.message : "Impossible de refuser",
        variant: "destructive",
      });
    } finally {
      setDriverActionLoading(false);
    }
  };

  const handleRequestAction = async (requestId: number, status: "accepted" | "declined") => {
    setProcessingId(requestId);
    try {
      await updateRideRequest(requestId, { status });
      if (status === "accepted") {
        const req = incomingRequests.find((r) => r.id === requestId);
        const route = req?.route;
        const currentSeats = typeof route?.available_seats === "number" ? route.available_seats : null;
        const nextSeats = currentSeats === null ? null : Math.max(0, currentSeats - 1);

        // Best-effort: write accept records (driver + passenger notification) + decrement seats.
        const acceptPayload: Record<string, unknown> = {
          ride_request_id: requestId,
          route_id: route?.id,
          passenger_user_id: req?.passenger_user_id,
          driver_user_id: user.id,
          seats_booked: 1,
          status: "accepted",
        };

        await Promise.allSettled([
          createAcceptRide(acceptPayload),
          createAcceptedRide(acceptPayload),
          typeof route?.id === "number" && typeof nextSeats === "number"
            ? updateRoute(route.id, { available_seats: nextSeats })
            : Promise.resolve(null),
        ]);
      }

      toast({
        title: status === "accepted" ? "Demande acceptée" : "Demande refusée",
        description:
          status === "accepted"
            ? "Le passager a été accepté. Les places restantes ont été mises à jour."
            : "La demande a été refusée.",
      });
      await reload();
    } catch (err) {
      toast({
        title: "Erreur",
        description: err instanceof Error ? err.message : "Action impossible",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container py-20 text-center text-muted-foreground">Chargement...</div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <p className="text-muted-foreground mb-4">Veuillez vous connecter pour voir votre profil.</p>
          <button onClick={() => navigate("/login")} className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-bold">
            Se connecter
          </button>
        </div>
      </Layout>
    );
  }

  const initials = (user.name || user.email || "U")
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const pendingIncomingCount = useMemo(
    () => incomingRequests.filter((r) => !r.status || r.status === "pending").length,
    [incomingRequests]
  );

  useEffect(() => {
    if (!user) return;
    if (!acceptedRides || acceptedRides.length === 0) return;

    const key = `seen_accepted_rides_${user.id}`;
    const seen = new Set<string>((localStorage.getItem(key) || "").split(",").filter(Boolean));

    const mine = acceptedRides.filter((r) => getAcceptedRidePassengerId(r) === user.id);
    const unseen = mine.filter((r) => r.id != null && !seen.has(String(r.id)));

    // Show at most a few toasts to avoid spam on first load.
    unseen.slice(0, 3).forEach((r) => {
      const routeId = getAcceptedRideRouteId(r);
      const remaining = getAcceptedRideRemainingSeats(r);
      const seatsBooked = getAcceptedRideSeatsBooked(r);
      toast({
        title: "Demande acceptée",
        description:
          `Vous avez été accepté${routeId ? ` pour le trajet #${routeId}` : ""}.` +
          (typeof seatsBooked === "number" ? ` Places reservees: ${seatsBooked}.` : "") +
          (typeof remaining === "number" ? ` Places restantes: ${remaining}.` : ""),
      });
    });

    unseen.forEach((r) => {
      if (r.id != null) seen.add(String(r.id));
    });
    localStorage.setItem(key, Array.from(seen).join(","));
  }, [acceptedRides, user]);

  const driverUi = useMemo(() => {
    if (driverLoading) {
      return {
        badgeClass: "border-border text-muted-foreground bg-muted/40",
        label: "Chargement...",
        description: "Vérification du statut conducteur...",
      };
    }

    if (!driverDetail && driverStatus === "pending") {
      return {
        badgeClass: "border-border text-muted-foreground bg-muted/40",
        label: "Non inscrit",
        description: "Vous n'avez pas encore soumis de demande conducteur.",
      };
    }

    if (driverStatus === "approved") {
      return {
        badgeClass: "border-green-400/40 text-green-700 bg-green-500/10",
        label: "Approuvé",
        description: "Votre compte est vérifié en tant que conducteur.",
      };
    }

    if (driverStatus === "rejected") {
      return {
        badgeClass: "border-destructive/40 text-destructive bg-destructive/10",
        label: "Refusé",
        description: "Votre demande a été refusée. Vous pouvez soumettre une nouvelle demande.",
      };
    }

    return {
      badgeClass: "border-yellow-400/40 text-yellow-700 bg-yellow-500/10",
      label: "En attente",
      description: "Votre demande est en cours de vérification.",
    };
  }, [driverDetail, driverLoading, driverStatus]);

  return (
    <Layout>
      <section className="container py-10">
        <div className="max-w-3xl mx-auto">
          <div className="bg-card/90 border border-border rounded-2xl shadow-lg overflow-hidden mb-8">
            <div className="flex items-center gap-4 p-6 border-b border-border">
              <div className="w-20 h-20 rounded-full bg-gradient-to-b from-primary to-accent flex items-center justify-center text-primary-foreground font-extrabold text-2xl">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold text-accent">Profil utilisateur</h1>
                <p className="text-sm text-muted-foreground">Informations du compte</p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-semibold text-foreground hover:bg-primary/10 transition-colors"
              >
                <LogOut size={16} />
                Déconnexion
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-6">
              <div className="bg-card/80 border border-border rounded-xl p-3">
                <span className="text-xs text-muted-foreground block mb-1">Nom complet</span>
                <span className="font-semibold text-foreground">{user.name || "—"}</span>
              </div>
              <div className="bg-card/80 border border-border rounded-xl p-3">
                <span className="text-xs text-muted-foreground block mb-1">Email</span>
                <span className="font-semibold text-foreground">{user.email || "—"}</span>
              </div>

              {(user as any).location && (
                <div className="bg-card/80 border border-border rounded-xl p-3 sm:col-span-2">
                  <span className="text-xs text-muted-foreground block mb-1">Localisation</span>
                  <span className="font-semibold text-foreground flex items-center gap-2">
                    <MapPin size={16} className="text-primary" />
                    {(user as any).location}
                  </span>
                </div>
              )}

              <div className="bg-card/80 border border-border rounded-xl p-3 sm:col-span-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">Statut conducteur</span>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-bold rounded-full px-3 py-1 border ${driverUi.badgeClass}`}>
                        {driverUi.label}
                      </span>
                      <span className="text-sm text-muted-foreground">{driverUi.description}</span>
                    </div>
                  </div>

                  {(driverStatus === "rejected" || (!driverDetail && driverStatus === "pending")) && (
                    <button
                      type="button"
                      onClick={() => navigate("/create-ride")}
                      className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 shrink-0"
                    >
                      Devenir conducteur
                    </button>
                  )}
                </div>

                {!!driverDetail && (
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div className="text-muted-foreground">
                      <strong className="text-foreground">Véhicule :</strong>{" "}
                      {driverDetail.car_model
                        ? `${driverDetail.car_model}${driverDetail.car_plate_number ? ` — ${driverDetail.car_plate_number}` : ""}`
                        : "—"}
                    </div>
                    <div className="text-muted-foreground">
                      <strong className="text-foreground">Téléphone :</strong> {driverDetail.phone_number || "—"}
                    </div>
                  </div>
                )}

                {isAdmin && !!driverDetail?.id && driverStatus === "pending" && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    <button
                      type="button"
                      onClick={handleApproveDriver}
                      disabled={driverActionLoading}
                      className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-50"
                    >
                      Approuver
                    </button>
                    <button
                      type="button"
                      onClick={handleRejectDriver}
                      disabled={driverActionLoading}
                      className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50"
                    >
                      Refuser
                    </button>
                  </div>
                )}
              </div>
            </div>

            {pageError && (
              <div className="px-6 pb-6">
                <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                  Impossible de charger le profil. {pageError}
                </div>
              </div>
            )}
          </div>

          <div className="bg-card/90 border border-border rounded-2xl shadow-lg p-5 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-accent">Demandes reçues</h2>
              <span className="text-xs font-bold rounded-full px-3 py-1 bg-yellow-500/10 text-yellow-600 border border-yellow-400/30">
                {pendingIncomingCount} en attente
              </span>
            </div>
            {pageLoading ? (
              <p className="text-muted-foreground">Chargement...</p>
            ) : incomingRequests.length === 0 ? (
              <div className="border border-dashed border-border rounded-xl p-4 text-muted-foreground">Aucune demande reçue</div>
            ) : (
              <div className="space-y-3">
                {incomingRequests.map((item) => {
                  const route = item.route;
                  const isPending = !item.status || item.status === "pending";
                  return (
                    <div key={item.id} className="border border-border rounded-xl p-4 bg-card/95 hover:border-primary/40 transition-colors">
                      <div className="flex justify-between items-start mb-2 gap-2">
                        <div>
                          <span className="font-bold text-foreground flex items-center gap-2">
                            {route?.departure_location_name || "—"} <ArrowRight size={14} className="text-primary" />{" "}
                            {route?.arrival_location_name || "—"}
                          </span>
                          <span className="text-xs text-muted-foreground mt-1 block">Passager #{item.passenger_user_id}</span>
                        </div>
                        <span
                          className={`text-xs font-bold rounded-full px-3 py-1 border shrink-0 ${
                            item.status === "accepted"
                              ? "border-green-400/40 text-green-600 bg-green-500/10"
                              : item.status === "declined"
                                ? "border-destructive/40 text-destructive bg-destructive/10"
                                : "border-yellow-400/40 text-yellow-600 bg-yellow-500/10"
                          }`}
                        >
                          {item.status === "accepted" ? "Accepté" : item.status === "declined" ? "Refusé" : "En attente"}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground mb-3">
                        <div>
                          <strong className="text-foreground">Date :</strong>{" "}
                          {route ? formatDepartureDate(route.departure_time) : "—"}
                        </div>
                        <div>
                          <strong className="text-foreground">Heure :</strong>{" "}
                          {route ? formatDepartureTime(route.departure_time) : "—"}
                        </div>
                      </div>
                      {isPending && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleRequestAction(item.id, "accepted")}
                            disabled={processingId === item.id}
                            className="flex-1 py-2 rounded-lg bg-green-600 text-white font-semibold text-sm flex items-center justify-center gap-1.5 hover:bg-green-700 transition-colors disabled:opacity-50"
                          >
                            Accepter
                          </button>
                          <button
                            onClick={() => handleRequestAction(item.id, "declined")}
                            disabled={processingId === item.id}
                            className="flex-1 py-2 rounded-lg bg-destructive text-destructive-foreground font-semibold text-sm flex items-center justify-center gap-1.5 hover:opacity-90 transition-colors disabled:opacity-50"
                          >
                            Refuser
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-card/90 border border-border rounded-2xl shadow-lg p-5 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-accent">Trajets créés</h2>
              <span className="text-xs font-bold rounded-full px-3 py-1 bg-primary/10 text-accent border border-primary/30">
                Conducteur
              </span>
            </div>
            {pageLoading ? (
              <p className="text-muted-foreground">Chargement...</p>
            ) : created.length === 0 ? (
              <div className="border border-dashed border-border rounded-xl p-4 text-muted-foreground">Aucun trajet créé</div>
            ) : (
              <div className="space-y-3">
                {created.map((ride) => (
                  <div key={ride.id} className="border border-border rounded-xl p-4 hover:border-primary/40 transition-colors">
                    <div className="flex items-center gap-2 font-semibold text-foreground mb-2">
                      <span>{ride.departure_location_name || "—"}</span>
                      <ArrowRight size={14} className="text-primary" />
                      <span>{ride.arrival_location_name || "—"}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-muted-foreground">
                      <div>
                        <strong className="text-foreground">Date :</strong> {formatDepartureDate(ride.departure_time)}
                      </div>
                      <div>
                        <strong className="text-foreground">Heure :</strong> {formatDepartureTime(ride.departure_time)}
                      </div>
                      <div>
                        <strong className="text-foreground">Places :</strong> {ride.available_seats || "—"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-card/90 border border-border rounded-2xl shadow-lg p-5">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-accent">Trajets rejoints</h2>
              <span className="text-xs font-bold rounded-full px-3 py-1 bg-primary/10 text-accent border border-primary/30">
                Passager
              </span>
            </div>
            {pageLoading ? (
              <p className="text-muted-foreground">Chargement...</p>
            ) : joined.length === 0 ? (
              <div className="border border-dashed border-border rounded-xl p-4 text-muted-foreground">Aucun trajet rejoint</div>
            ) : (
              <div className="space-y-3">
                {joined.map((item) => {
                  const route = item.route;
                  const driverInfo = route ? driverDetailsMap.get(route.user_id) : null;
                  return (
                    <div key={item.id} className="border border-border rounded-xl p-4 bg-card/95 hover:border-primary/40 transition-colors">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-foreground flex items-center gap-2">
                          {route?.departure_location_name || "—"} <ArrowRight size={14} className="text-primary" />{" "}
                          {route?.arrival_location_name || "—"}
                        </span>
                        <span
                          className={`text-xs font-bold rounded-full px-3 py-1 border ${
                            item.status === "accepted"
                              ? "border-green-400/40 text-green-600 bg-green-500/10"
                              : item.status === "declined"
                                ? "border-destructive/40 text-destructive bg-destructive/10"
                                : "border-primary/30 text-accent bg-primary/10"
                          }`}
                        >
                          {item.status === "accepted" ? "Accepté" : item.status === "declined" ? "Refusé" : "En attente"}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-muted-foreground">
                        <div>
                          <strong className="text-foreground">Date :</strong>{" "}
                          {route ? formatDepartureDate(route.departure_time) : "—"}
                        </div>
                        <div>
                          <strong className="text-foreground">Heure :</strong>{" "}
                          {route ? formatDepartureTime(route.departure_time) : "—"}
                        </div>
                        <div>
                          <strong className="text-foreground">Prix :</strong>{" "}
                          {route?.price_per_seat ? `${Number(route.price_per_seat).toLocaleString()} LBP` : "—"}
                        </div>
                      </div>
                      {item.status === "accepted" && driverInfo?.phone_number && (
                        <div className="mt-3 flex items-center gap-2 text-sm bg-primary/10 border border-primary/20 rounded-lg px-3 py-2">
                          <span className="text-foreground font-semibold">Conducteur :</span>
                          <a href={`tel:${driverInfo.phone_number}`} className="text-primary hover:underline">
                            {driverInfo.phone_number}
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
}
