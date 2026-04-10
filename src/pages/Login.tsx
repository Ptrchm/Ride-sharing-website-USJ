import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Eye, EyeOff } from "lucide-react";
import usjLogo from "@/assets/usj-logo.png";
import { isEmailVerificationEnabled } from "@/utils/featureFlags";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password.trim()) {
      setError("Veuillez remplir tous les champs.");
      return;
    }
    setLoading(true);
    try {
      const u = await login(email.trim(), password);
      if (isEmailVerificationEnabled() && (u as any)?.is_active === false) {
        navigate("/verify-pending");
      } else {
        navigate("/");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-secondary to-background">
      <div className="w-full max-w-md bg-card rounded-2xl p-8 shadow-lg border border-border text-center">
        <div className="flex flex-col items-center gap-2 mb-4">
          <img src={usjLogo} alt="USJ Logo" className="w-40 h-auto" />
          <h1 className="text-xl font-bold text-accent">RideSharing</h1>
          <p className="text-sm text-muted-foreground">
            Plateforme de covoiturage pour les étudiants de l'Université Saint-Joseph - Beyrouth
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 mt-4 text-left">
          <label className="text-sm text-muted-foreground" htmlFor="identifier">
            Identifiant (email étudiant ou matricule)
          </label>
          <input
            id="identifier"
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ex: jean.dupont@usj.edu.lb"
            className="w-full px-3 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            autoComplete="username"
          />

          <label className="text-sm text-muted-foreground" htmlFor="password">
            Mot de passe
          </label>
          <div className="flex gap-2">
            <input
              id="password"
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Votre mot de passe"
              className="flex-1 px-3 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="px-3 py-3 rounded-lg border border-border bg-background text-accent hover:bg-muted transition-colors"
            >
              {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {error && <p className="text-sm text-destructive font-medium">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg font-bold text-primary-foreground bg-gradient-to-b from-primary to-accent shadow-md hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>

          <div className="flex justify-center mt-2">
            <Link to="/forgot-password" className="text-sm text-muted-foreground hover:text-primary hover:underline transition-colors">
              Mot de passe oublié ?
            </Link>
          </div>

          <div className="flex items-center justify-center gap-2 mt-3">
            <span className="text-sm text-muted-foreground">Vous n'avez pas de compte ?</span>
            <Link
              to="/signup"
              className="text-sm font-semibold text-primary border border-border rounded-lg px-3 py-2 hover:bg-muted transition-colors no-underline"
            >
              S'inscrire
            </Link>
          </div>
        </form>

        <p className="mt-4 text-xs text-muted-foreground">Université Saint-Joseph - Beyrouth</p>
      </div>
    </div>
  );
}

