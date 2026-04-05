import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { sendVerificationEmail } from "@/lib/api";
import { Eye, EyeOff } from "lucide-react";
import usjLogo from "@/assets/usj-logo.png";
import { isEmailVerificationEnabled } from "@/lib/featureFlags";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const USJ_DOMAIN = "@net.usj.edu.lb";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password) {
      setError("Email et mot de passe requis.");
      return;
    }
    if (!trimmedEmail.endsWith(USJ_DOMAIN)) {
      setError("Seuls les comptes universitaires (@net.usj.edu.lb) sont autorisés.");
      return;
    }
    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    setLoading(true);
    try {
      await signup(name.trim(), trimmedEmail, password);
      if (isEmailVerificationEnabled()) {
        try {
          await sendVerificationEmail();
        } catch {
          // If sending fails, user can retry from the pending page.
        }
        navigate("/verify-pending");
      } else {
        navigate("/");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur d'inscription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-secondary to-background">
      <div className="w-full max-w-sm bg-card rounded-2xl p-6 shadow-lg border border-border text-center">
        <div className="flex flex-col items-center gap-1 mb-3">
          <img src={usjLogo} alt="USJ Logo" className="w-40 h-auto" />
          <h1 className="text-lg font-bold text-accent">Créer un compte</h1>
          <p className="text-xs text-muted-foreground">Inscrivez-vous avec votre email étudiant</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 mt-3 text-left">
          <label className="text-xs text-muted-foreground">Nom complet (optionnel)</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex : Jean Dupont"
            className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />

          <label className="text-xs text-muted-foreground">Email universitaire</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="prenom.nom@net.usj.edu.lb"
            required
            className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <p className="text-xs text-muted-foreground -mt-1">Seuls les emails @net.usj.edu.lb sont acceptés.</p>

          <label className="text-xs text-muted-foreground">Mot de passe</label>
          <div className="flex gap-2">
            <input
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Votre mot de passe"
              required
              minLength={6}
              className="flex-1 px-3 py-2.5 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button type="button" onClick={() => setShowPw(!showPw)} className="px-3 rounded-lg border border-border bg-background text-accent">
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <label className="text-xs text-muted-foreground">Confirmer le mot de passe</label>
          <div className="flex gap-2">
            <input
              type={showConfirm ? "text" : "password"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Confirmez le mot de passe"
              required
              minLength={6}
              className="flex-1 px-3 py-2.5 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="px-3 rounded-lg border border-border bg-background text-accent">
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {error && <p className="text-sm text-destructive font-medium">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg font-bold text-primary-foreground bg-gradient-to-b from-primary to-accent shadow-md hover:opacity-90 transition-opacity disabled:opacity-50 text-sm mt-1"
          >
            {loading ? "Inscription..." : "S'inscrire"}
          </button>

          <div className="flex items-center justify-center gap-2 mt-3">
            <span className="text-sm text-muted-foreground">Déjà un compte ?</span>
            <Link to="/login" className="text-sm font-semibold text-primary border border-border rounded-lg px-3 py-1.5 no-underline hover:bg-muted">
              Se connecter
            </Link>
          </div>
        </form>

        <p className="mt-3 text-xs text-muted-foreground">Université Saint‑Joseph — Beyrouth</p>
      </div>
    </div>
  );
}
