import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { getAccountEvents, getMyEvents } from "@/lib/api";
import { Loader2 } from "lucide-react";

export default function Logs() {
  const [view, setView] = useState<"mine" | "account">("mine");

  const {
    data: myEvents,
    isLoading: myLoading,
    error: myError,
    refetch: refetchMyEvents,
  } = useQuery({
    queryKey: ["myEvents"],
    queryFn: getMyEvents,
  });

  const {
    data: accountEvents,
    isLoading: accountLoading,
    error: accountError,
    refetch: refetchAccountEvents,
  } = useQuery({
    queryKey: ["accountEvents"],
    queryFn: getAccountEvents,
    enabled: false,
  });

  const isAccountTab = view === "account";

  const onTabChange = (next: "mine" | "account") => {
    setView(next);
    if (next === "account") {
      refetchAccountEvents();
    } else {
      refetchMyEvents();
    }
  };

  const events = isAccountTab ? accountEvents : myEvents;
  const loading = isAccountTab ? accountLoading : myLoading;
  const error = isAccountTab ? accountError : myError;

  return (
    <Layout>
      <section className="container py-10">
        <div className="max-w-4xl mx-auto">
          <div className="bg-card/90 border border-border rounded-2xl shadow-lg overflow-hidden mb-8">
            <div className="p-6 border-b border-border">
              <h1 className="text-xl font-bold text-accent">Historique des événements</h1>
              <p className="text-sm text-muted-foreground">
                Voir les actions enregistrées dans la base (connexion, création de trajets, etc.).
              </p>
            </div>

            <div className="flex flex-wrap gap-2 p-6">
              <button
                type="button"
                onClick={() => onTabChange("mine")}
                className={`px-4 py-2 rounded-lg border text-sm font-semibold transition-colors ${
                  view === "mine"
                    ? "bg-primary/15 border-primary text-accent"
                    : "border-border text-muted-foreground hover:bg-primary/10"
                }`}
              >
                Mes événements
              </button>
              <button
                type="button"
                onClick={() => onTabChange("account")}
                className={`px-4 py-2 rounded-lg border text-sm font-semibold transition-colors ${
                  view === "account"
                    ? "bg-primary/15 border-primary text-accent"
                    : "border-border text-muted-foreground hover:bg-primary/10"
                }`}
              >
                Événements du compte (admin)
              </button>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Chargement...
                </div>
              ) : error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  Impossible de charger les événements. {" "}
                  {error instanceof Error ? error.message : "Erreur inconnue"}.
                </div>
              ) : !events || events.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-6 text-muted-foreground">
                  Aucun événement trouvé.
                </div>
              ) : (
                <div className="space-y-3">
                  {events.map((evt: any) => (
                    <div
                      key={evt.id ?? JSON.stringify(evt)}
                      className="rounded-xl border border-border p-4 bg-card/50"
                    >
                      <div className="flex flex-wrap justify-between gap-2 text-sm font-semibold text-foreground">
                        <span className="uppercase tracking-wide text-xs text-muted-foreground">
                          {evt.action || evt.type || "(action inconnue)"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {evt.created_at ? new Date(evt.created_at).toLocaleString() : ""}
                        </span>
                      </div>
                      <pre className="mt-2 max-h-44 overflow-auto text-xs text-muted-foreground bg-background/50 p-3 rounded-lg">
                        {JSON.stringify(evt, null, 2)}
                      </pre>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
