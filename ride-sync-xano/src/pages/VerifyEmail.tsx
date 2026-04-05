import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { verifyEmail } from "@/lib/api";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import usjLogo from "@/assets/usj-logo.png";

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Lien de vérification invalide.");
      return;
    }
    verifyEmail(token)
      .then(() => {
        setStatus("success");
        setMessage("Votre email a été vérifié avec succès !");
      })
      .catch((err) => {
        setStatus("error");
        setMessage(err instanceof Error ? err.message : "Échec de la vérification.");
      });
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-secondary to-background">
      <div className="w-full max-w-sm bg-card rounded-2xl p-6 shadow-lg border border-border text-center">
        <img src={usjLogo} alt="USJ Logo" className="w-32 h-auto mx-auto mb-4" />

        {status === "loading" && (
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={32} className="text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Vérification en cours...</p>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center gap-3">
            <CheckCircle size={40} className="text-green-500" />
            <h1 className="text-lg font-bold text-accent">Email vérifié !</h1>
            <p className="text-sm text-muted-foreground">{message}</p>
            <Link
              to="/login"
              className="mt-2 w-full py-2.5 rounded-lg font-bold text-primary-foreground bg-gradient-to-b from-primary to-accent shadow-md hover:opacity-90 transition-opacity text-sm inline-block"
            >
              Se connecter
            </Link>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center gap-3">
            <XCircle size={40} className="text-destructive" />
            <h1 className="text-lg font-bold text-destructive">Échec de vérification</h1>
            <p className="text-sm text-muted-foreground">{message}</p>
            <Link
              to="/login"
              className="mt-2 text-sm text-primary font-semibold hover:underline"
            >
              Retour à la connexion
            </Link>
          </div>
        )}

        <p className="mt-4 text-xs text-muted-foreground">Université Saint‑Joseph — Beyrouth</p>
      </div>
    </div>
  );
}
