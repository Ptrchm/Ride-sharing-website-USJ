import { useState } from "react";
import { Link } from "react-router-dom";
import { requestResetLink } from "@/lib/api";
import { Mail, ArrowLeft } from "lucide-react";
import usjLogo from "@/assets/usj-logo.png";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setError("Veuillez entrer votre email.");
      return;
    }
    setLoading(true);
    try {
      await requestResetLink(trimmed);
      setSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'envoi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-secondary to-background">
      <div className="w-full max-w-sm bg-card rounded-2xl p-6 shadow-lg border border-border text-center">
        <div className="flex flex-col items-center gap-2 mb-4">
          <img src={usjLogo} alt="USJ Logo" className="w-40 h-auto" />
          <h1 className="text-lg font-bold text-accent">Mot de passe oublié</h1>
          <p className="text-xs text-muted-foreground">
            Entrez votre email pour recevoir un lien de réinitialisation.
          </p>
        </div>

        {sent ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Mail size={28} className="text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">
              Si un compte existe avec cet email, un lien de réinitialisation a été envoyé. Vérifiez votre boîte de réception et vos spams.
            </p>
            <Link
              to="/login"
              className="mt-2 text-sm font-semibold text-primary hover:underline flex items-center gap-1"
            >
              <ArrowLeft size={14} /> Retour à la connexion
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3 mt-3 text-left">
            <label className="text-xs text-muted-foreground">Email universitaire</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="prenom.nom@net.usj.edu.lb"
              required
              className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />

            {error && <p className="text-sm text-destructive font-medium">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg font-bold text-primary-foreground bg-gradient-to-b from-primary to-accent shadow-md hover:opacity-90 transition-opacity disabled:opacity-50 text-sm mt-1"
            >
              {loading ? "Envoi..." : "Envoyer le lien"}
            </button>

            <Link
              to="/login"
              className="text-sm text-primary font-semibold hover:underline flex items-center justify-center gap-1 mt-2"
            >
              <ArrowLeft size={14} /> Retour à la connexion
            </Link>
          </form>
        )}

        <p className="mt-4 text-xs text-muted-foreground">Université Saint‑Joseph — Beyrouth</p>
      </div>
    </div>
  );
}
