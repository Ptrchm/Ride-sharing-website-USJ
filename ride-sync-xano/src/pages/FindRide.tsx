import { useMemo, useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { getAcceptedRides, getRideRequests, getRoutes, createRideRequestWithChecks } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Search, ArrowRight } from "lucide-react";
import { formatDepartureDate, formatDepartureTime } from "@/lib/helpers";

const isRouteAvailable = (route: any) => {
  const now = Date.now();
  const departMs = route?.departure_time ? Number(route.departure_time) * 1000 : 0;
  const hasSeats = typeof route?.available_seats === "number" ? route.available_seats > 0 : true;
  return hasSeats && departMs > now;
};

export default function FindRide() {
  const { user } = useAuth();
  const [routes, setRoutes] = useState<any[]>([]);
  const [allRoutes, setAllRoutes] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState("");
  const [joinModal, setJoinModal] = useState<any>(null);
  const [joining, setJoining] = useState(false);
  const [joinBlocked, setJoinBlocked] = useState<{ reason: string; untilMs?: number } | null>(null);

  useEffect(() => {
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    try {
      const data = await getRoutes();
      const all = Array.isArray(data) ? data : [];
      setAllRoutes(all);
      // Filter out rides created by the current user
      const othersRides = (all as any[]).filter((r: any) => r.user_id !== user?.id);
      const available = othersRides.filter(isRouteAvailable);
      setRoutes(available);
      setFiltered(available);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const computeRestrictions = async () => {
      if (!user?.id) {
        setJoinBlocked(null);
        return;
      }

      const nowMs = Date.now();
      const routeDepartMs = (r: any) => (r?.departure_time ? Number(r.departure_time) * 1000 : 0);

      // Rule 1: if user has an upcoming ride they created, they cannot join others until it passes.
      const myUpcomingCreated = (allRoutes as any[])
        .filter((r: any) => r?.user_id === user.id)
        .map((r: any) => ({ departMs: routeDepartMs(r), route: r }))
        .filter((x: any) => x.departMs > nowMs)
        .sort((a: any, b: any) => a.departMs - b.departMs);

      if (myUpcomingCreated.length > 0) {
        const untilMs = myUpcomingCreated[0].departMs;
        setJoinBlocked({
          reason: `Vous avez un trajet à venir en tant que conducteur (${formatDepartureDate(Math.floor(untilMs / 1000))} à ${formatDepartureTime(Math.floor(untilMs / 1000))}). Vous pourrez rejoindre d'autres trajets après ce départ.`,
          untilMs,
        });
        return;
      }

      // Rule 2: if user has an upcoming ride they joined (pending/accepted), they cannot join another until it passes.
      try {
        const [requestsRaw, acceptedRaw] = await Promise.allSettled([getRideRequests(), getAcceptedRides()]);
        const requests = requestsRaw.status === "fulfilled" && Array.isArray(requestsRaw.value) ? (requestsRaw.value as any[]) : [];
        const accepted = acceptedRaw.status === "fulfilled" && Array.isArray(acceptedRaw.value) ? (acceptedRaw.value as any[]) : [];

        const routeMap = new Map<number, any>((allRoutes as any[]).map((r: any) => [r.id, r]));

        const activeFromAccepted = accepted
          .filter((r: any) => (r?.passenger_user_id ?? r?.passenger_id) === user.id)
          .map((r: any) => routeMap.get(r?.route_id ?? r?.ride_id))
          .filter(Boolean)
          .map((route: any) => routeDepartMs(route))
          .filter((ms: number) => ms > nowMs)
          .sort((a: number, b: number) => a - b);

        const activeFromRequests = requests
          .filter((req: any) => req?.passenger_user_id === user.id)
          .filter((req: any) => !req?.status || req.status === "pending" || req.status === "accepted")
          .map((req: any) => routeMap.get(req.route_id))
          .filter(Boolean)
          .map((route: any) => routeDepartMs(route))
          .filter((ms: number) => ms > nowMs)
          .sort((a: number, b: number) => a - b);

        const untilMs = activeFromAccepted[0] || activeFromRequests[0] || 0;
        if (untilMs > 0) {
          setJoinBlocked({
            reason: `Vous avez déjà une réservation en cours (${formatDepartureDate(Math.floor(untilMs / 1000))} à ${formatDepartureTime(Math.floor(untilMs / 1000))}). Vous pourrez rejoindre un autre trajet après ce départ.`,
            untilMs,
          });
          return;
        }

        setJoinBlocked(null);
      } catch {
        // If we cannot check, do not block.
        setJoinBlocked(null);
      }
    };

    computeRestrictions();
  }, [allRoutes, user?.id]);

  const handleSearch = () => {
    let result = routes.filter(isRouteAvailable);
    if (from.trim()) result = result.filter((r: any) => r.departure_location_name?.toLowerCase().includes(from.toLowerCase()));
    if (to.trim()) result = result.filter((r: any) => r.arrival_location_name?.toLowerCase().includes(to.toLowerCase()));
    if (date) {
      const selectedDate = new Date(date);
      result = result.filter((r: any) => {
        if (!r.departure_time) return false;
        const rideDate = new Date(r.departure_time * 1000);
        return rideDate.toDateString() === selectedDate.toDateString();
      });
    }
    setFiltered(result);
  };

  const handleJoin = async () => {
    if (!joinModal) return;
    if (joinBlocked) {
      toast({ title: "Impossible", description: joinBlocked.reason, variant: "destructive" });
      return;
    }
    if (!user?.id) {
      toast({
        title: "Connexion requise",
        description: "Veuillez vous connecter pour envoyer une demande.",
        variant: "destructive",
      });
      return;
    }
    setJoining(true);
    try {
      await createRideRequestWithChecks({
        route_id: joinModal.id,
        passenger_user_id: user.id,
        driver_user_id: joinModal.user_id,
      });

      toast({ title: "Demande envoyée !", description: "Le conducteur recevra votre demande." });
      setJoinModal(null);
    } catch (err: any) {
      const msg = typeof err?.message === "string" ? err.message : "Erreur lors de l'envoi.";
      if (msg.toLowerCase().includes("driver not found")) {
        toast({
          title: "Erreur",
          description: "Conducteur introuvable ou non validé pour ce trajet. Essayez un autre trajet.",
          variant: "destructive",
        });
      } else {
        toast({ title: "Erreur", description: msg, variant: "destructive" });
      }
    } finally {
      setJoining(false);
    }
  };

  return (
    <Layout>
      <section className="container py-10">
        <h1 className="text-3xl font-bold text-accent mb-6">Trouver un trajet</h1>

        {/* Search panel */}
        <div className="bg-gradient-to-br from-primary to-accent rounded-2xl p-6 mb-8 shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_200px_auto] gap-4 items-end">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-primary-foreground/90 uppercase tracking-wide">Départ</label>
              <input
                type="text"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                placeholder="ex. Campus principal"
                className="px-3 py-3 rounded-lg bg-card text-foreground border-none text-sm focus:outline-none focus:ring-2 focus:ring-card"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-primary-foreground/90 uppercase tracking-wide">Destination</label>
              <input
                type="text"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="ex. Métro Badaro"
                className="px-3 py-3 rounded-lg bg-card text-foreground border-none text-sm focus:outline-none focus:ring-2 focus:ring-card"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-primary-foreground/90 uppercase tracking-wide">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="px-3 py-3 rounded-lg bg-card text-foreground border-none text-sm focus:outline-none focus:ring-2 focus:ring-card"
              />
            </div>
            <button
              onClick={handleSearch}
              className="px-6 py-3 bg-card text-primary rounded-lg font-bold hover:-translate-y-0.5 hover:shadow-md transition-all flex items-center gap-2"
            >
              <Search size={16} /> Rechercher
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-bold text-accent">Trajets disponibles</h2>
          <span className="text-xs font-semibold text-muted-foreground">{filtered.length} trajet(s)</span>
        </div>

        {loading ? (
          <p className="text-center text-muted-foreground py-12">Chargement...</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-5xl mb-4">🚗</p>
            <p>Aucun trajet trouvé</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filtered.map((ride: any) => (
              <div
                key={ride.id}
                className="bg-card border border-border rounded-xl p-5 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-5 items-center shadow-sm hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-3 font-semibold text-foreground">
                    <span>{ride.departure_location_name || "—"}</span>
                    <ArrowRight className="text-primary" size={18} />
                    <span>{ride.arrival_location_name || "—"}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-border pt-3 text-sm text-muted-foreground">
                    <div>
                      <span className="block font-semibold text-foreground">Date</span>
                      {formatDepartureDate(ride.departure_time)}
                    </div>
                    <div>
                      <span className="block font-semibold text-foreground">Heure</span>
                      {formatDepartureTime(ride.departure_time)}
                    </div>
                    <div>
                      <span className="block font-semibold text-foreground">Places</span>
                      {ride.available_seats || "—"}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-3">
                  {ride.price_per_seat > 0 && (
                    <div className="text-center">
                      <span className="text-2xl font-bold text-primary">{Number(ride.price_per_seat).toLocaleString()}</span>
                      <span className="block text-[11px] text-muted-foreground">LBP / place</span>
                    </div>
                  )}
                  <button
                    onClick={() => {
                      if (!user?.id) {
                        toast({
                          title: "Connexion requise",
                          description: "Veuillez vous connecter pour rejoindre un trajet.",
                          variant: "destructive",
                        });
                        return;
                      }
                      if (joinBlocked) {
                        toast({ title: "Impossible", description: joinBlocked.reason, variant: "destructive" });
                        return;
                      }
                      setJoinModal(ride);
                    }}
                    className={`px-6 py-3 bg-gradient-to-br from-primary to-accent text-primary-foreground rounded-lg font-semibold text-sm hover:-translate-y-0.5 hover:shadow-md transition-all ${
                      joinBlocked ? "opacity-60 cursor-not-allowed" : ""
                    }`}
                  >
                    Rejoindre
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Join modal */}
      {joinModal && (
        <div className="fixed inset-0 bg-foreground/50 z-50 flex items-center justify-center p-5" onClick={() => setJoinModal(null)}>
          <div className="bg-card rounded-2xl p-8 max-w-md w-full shadow-2xl animate-in fade-in slide-in-from-bottom-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-foreground mb-3">Rejoindre ce trajet ?</h3>
            <p className="text-muted-foreground mb-5">Le conducteur recevra votre demande.</p>
            <div className="bg-muted rounded-lg p-4 border-l-4 border-primary mb-6">
              <p className="font-semibold text-sm text-foreground">
                {joinModal.departure_location_name || "—"} → {joinModal.arrival_location_name || "—"}
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setJoinModal(null)} className="flex-1 py-3 rounded-lg bg-muted text-foreground font-semibold hover:-translate-y-0.5 transition-transform">
                Annuler
              </button>
              <button
                onClick={handleJoin}
                disabled={joining}
                className="flex-1 py-3 rounded-lg bg-gradient-to-br from-primary to-accent text-primary-foreground font-semibold hover:-translate-y-0.5 transition-transform disabled:opacity-50"
              >
                {joining ? "..." : "Confirmer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

