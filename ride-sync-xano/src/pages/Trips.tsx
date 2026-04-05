import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { getRoutes, getRideRequests, updateRideRequest, getDriverDetails } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowRight, Check, X, Phone } from "lucide-react";
import { formatDepartureDate, formatDepartureTime } from "@/lib/helpers";
import { toast } from "@/hooks/use-toast";

export default function Trips() {
  const { user } = useAuth();
  const [created, setCreated] = useState<any[]>([]);
  const [joined, setJoined] = useState<any[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
  const [driverDetailsMap, setDriverDetailsMap] = useState<Map<number, any>>(new Map());
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    try {
      const [routes, requests, driverDetails] = await Promise.all([getRoutes(), getRideRequests(), getDriverDetails()]);
      const userId = user.id;
      const allRoutes = routes as any[];
      const allRequests = requests as any[];
      const allDrivers = driverDetails as any[];

      // Build driver details map by user_id
      const dMap = new Map<number, any>();
      allDrivers.forEach((d: any) => dMap.set(d.user_id, d));
      setDriverDetailsMap(dMap);

      // Routes created by current user
      const myCreated = allRoutes.filter((r: any) => r.user_id === userId);
      setCreated(myCreated);

      // Requests made by current user (as passenger)
      const myRequests = allRequests.filter((r: any) => r.passenger_user_id === userId);
      const routeMap = new Map(allRoutes.map((r: any) => [r.id, r]));
      setJoined(myRequests.map((req: any) => ({ ...req, route: routeMap.get(req.route_id) })));

      // Incoming requests on rides the current user owns (driver)
      const incoming = allRequests
        .map((req: any) => ({ ...req, route: routeMap.get(req.route_id) }))
        .filter((req: any) => req.route && req.route.user_id === userId && req.passenger_user_id !== userId);
      setIncomingRequests(incoming);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAction = async (requestId: number, status: string) => {
    setProcessingId(requestId);
    try {
      await updateRideRequest(requestId, { status });
      toast({
        title: status === "accepted" ? "Demande acceptée !" : "Demande refusée",
        description: status === "accepted" ? "Le passager a été accepté." : "La demande a été refusée.",
      });
      await fetchData();
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setProcessingId(null);
    }
  };

  const CreatedRideItem = ({ ride }: { ride: any }) => (
    <div className="border border-border rounded-xl p-4 bg-card/95 hover:border-primary/40 transition-colors">
      <div className="flex justify-between items-center mb-2">
        <span className="font-bold text-foreground flex items-center gap-2">
          {ride.departure_location_name || "—"} <ArrowRight size={14} className="text-primary" /> {ride.arrival_location_name || "—"}
        </span>
        <span className="text-xs font-bold rounded-full px-3 py-1 border border-primary/30 text-accent bg-primary/10">
          À venir
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-muted-foreground">
        <div><strong className="text-foreground">Date :</strong> {formatDepartureDate(ride.departure_time)}</div>
        <div><strong className="text-foreground">Heure :</strong> {formatDepartureTime(ride.departure_time)}</div>
        <div><strong className="text-foreground">Places :</strong> {ride.available_seats || "—"}</div>
      </div>
    </div>
  );

  const JoinedRideItem = ({ item }: { item: any }) => {
    const route = item.route;
    const isAccepted = item.status === "accepted";
    const driverInfo = route ? driverDetailsMap.get(route.user_id) : null;
    return (
      <div className="border border-border rounded-xl p-4 bg-card/95 hover:border-primary/40 transition-colors">
        <div className="flex justify-between items-center mb-2">
          <span className="font-bold text-foreground flex items-center gap-2">
            {route?.departure_location_name || "—"} <ArrowRight size={14} className="text-primary" /> {route?.arrival_location_name || "—"}
          </span>
          <span className={`text-xs font-bold rounded-full px-3 py-1 border ${
            item.status === "accepted"
              ? "border-green-400/40 text-green-600 bg-green-500/10"
              : item.status === "declined"
              ? "border-destructive/40 text-destructive bg-destructive/10"
              : "border-primary/30 text-accent bg-primary/10"
          }`}>
            {item.status === "accepted" ? "Accepté" : item.status === "declined" ? "Refusé" : "En attente"}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-muted-foreground">
          <div><strong className="text-foreground">Date :</strong> {route ? formatDepartureDate(route.departure_time) : "—"}</div>
          <div><strong className="text-foreground">Heure :</strong> {route ? formatDepartureTime(route.departure_time) : "—"}</div>
          <div><strong className="text-foreground">Prix :</strong> {route?.price_per_seat ? `${Number(route.price_per_seat).toLocaleString()} LBP` : "—"}</div>
        </div>
        {isAccepted && driverInfo?.phone_number && (
          <div className="mt-3 flex items-center gap-2 text-sm bg-primary/10 border border-primary/20 rounded-lg px-3 py-2">
            <Phone size={14} className="text-primary" />
            <span className="text-foreground font-semibold">Conducteur :</span>
            <a href={`tel:${driverInfo.phone_number}`} className="text-primary hover:underline">{driverInfo.phone_number}</a>
          </div>
        )}
      </div>
    );
  };

  const IncomingRequestItem = ({ item }: { item: any }) => {
    const route = item.route;
    const isPending = !item.status || item.status === "pending";
    return (
      <div className="border border-border rounded-xl p-4 bg-card/95 hover:border-primary/40 transition-colors">
        <div className="flex justify-between items-start mb-2 gap-2">
          <div>
            <span className="font-bold text-foreground flex items-center gap-2">
              {route?.departure_location_name || "—"} <ArrowRight size={14} className="text-primary" /> {route?.arrival_location_name || "—"}
            </span>
            <span className="text-xs text-muted-foreground mt-1 block">
              Passager #{item.passenger_user_id}
            </span>
          </div>
          <span className={`text-xs font-bold rounded-full px-3 py-1 border shrink-0 ${
            item.status === "accepted"
              ? "border-green-400/40 text-green-600 bg-green-500/10"
              : item.status === "declined"
              ? "border-destructive/40 text-destructive bg-destructive/10"
              : "border-yellow-400/40 text-yellow-600 bg-yellow-500/10"
          }`}>
            {item.status === "accepted" ? "Accepté" : item.status === "declined" ? "Refusé" : "En attente"}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground mb-3">
          <div><strong className="text-foreground">Date :</strong> {route ? formatDepartureDate(route.departure_time) : "—"}</div>
          <div><strong className="text-foreground">Heure :</strong> {route ? formatDepartureTime(route.departure_time) : "—"}</div>
        </div>
        {isPending && (
          <div className="flex gap-2">
            <button
              onClick={() => handleRequestAction(item.id, "accepted")}
              disabled={processingId === item.id}
              className="flex-1 py-2 rounded-lg bg-green-600 text-white font-semibold text-sm flex items-center justify-center gap-1.5 hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <Check size={14} /> Accepter
            </button>
            <button
              onClick={() => handleRequestAction(item.id, "declined")}
              disabled={processingId === item.id}
              className="flex-1 py-2 rounded-lg bg-destructive text-destructive-foreground font-semibold text-sm flex items-center justify-center gap-1.5 hover:opacity-90 transition-colors disabled:opacity-50"
            >
              <X size={14} /> Refuser
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <Layout>
      <section className="container py-10 max-w-4xl">
        <h1 className="text-3xl font-bold text-accent mb-2">Mes trajets</h1>
        <p className="text-muted-foreground mb-6">Consultez votre historique complet.</p>

        {/* Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          {[
            { label: "Trajets rejoints", count: joined.length },
            { label: "Demandes reçues", count: incomingRequests.length },
            { label: "Total", count: created.length + joined.length },
          ].map((s) => (
            <div key={s.label} className="bg-card/90 border border-border rounded-2xl p-4 shadow-md">
              <span className="block text-sm text-muted-foreground">{s.label}</span>
              <strong className="text-2xl text-accent">{s.count}</strong>
            </div>
          ))}
        </div>

        {loading ? (
          <p className="text-center text-muted-foreground py-12">Chargement...</p>
        ) : (
          <>
            {/* Incoming Requests */}
            <div className="bg-card/90 border border-border rounded-2xl shadow-lg p-5 mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-accent">Demandes reçues</h2>
                <span className="text-xs font-bold rounded-full px-3 py-1 bg-yellow-500/10 text-yellow-600 border border-yellow-400/30">
                  {incomingRequests.filter((r: any) => !r.status || r.status === "pending").length} en attente
                </span>
              </div>
              {incomingRequests.length === 0 ? (
                <div className="border border-dashed border-border rounded-xl p-4 text-muted-foreground">Aucune demande reçue</div>
              ) : (
                <div className="space-y-3">{incomingRequests.map((r: any) => <IncomingRequestItem key={r.id} item={r} />)}</div>
              )}
            </div>

            {/* Joined */}
            <div className="bg-card/90 border border-border rounded-2xl shadow-lg p-5">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-accent">Trajets rejoints</h2>
                <span className="text-xs font-bold rounded-full px-3 py-1 bg-primary/10 text-accent border border-primary/30">Passager</span>
              </div>
              {joined.length === 0 ? (
                <div className="border border-dashed border-border rounded-xl p-4 text-muted-foreground">Aucun trajet rejoint</div>
              ) : (
                <div className="space-y-3">{joined.map((r: any) => <JoinedRideItem key={r.id} item={r} />)}</div>
              )}
            </div>
          </>
        )}
      </section>
    </Layout>
  );
}




