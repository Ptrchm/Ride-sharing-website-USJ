// Verify pending page
import { useState } from "react";
import { Link } from "react-router-dom";
import { sendVerificationEmail } from "@/services/xanoApi";
import { Mail, RefreshCw } from "lucide-react";
import usjLogo from "@/assets/usj-logo.png";

export default function VerifyPending() {
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  const handleResend = async () => {
    setResending(true);
    try {
      await sendVerificationEmail();
      setResent(true);
    } catch {
      // silent
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-secondary to-background">
      <div className="w-full max-w-sm bg-card rounded-2xl p-6 shadow-lg border border-border text-center">
        <div className="flex flex-col items-center gap-3 mb-4">
          <img src={usjLogo} alt="USJ Logo" className="w-32 h-auto" />
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Mail size={28} className="text-primary" />
          </div>
          <h1 className="text-lg font-bold text-accent">Vérifiez votre email</h1>
          <p className="text-sm text-muted-foreground">
            Un email de vérification a été envoyé à votre adresse universitaire. 
            Cliquez sur le lien dans l'email pour activer votre compte.
          </p>
        </div>

        <div className="bg-muted/50 border border-border rounded-xl p-3 text-xs text-muted-foreground mb-4">
          Vérifiez aussi vos spams si vous ne trouvez pas l'email.
        </div>

        <button
          onClick={handleResend}
          disabled={resending || resent}
          className="w-full py-2.5 rounded-lg font-bold border border-border bg-card text-accent hover:bg-muted transition-colors disabled:opacity-50 text-sm flex items-center justify-center gap-2"
        >
          <RefreshCw size={14} className={resending ? "animate-spin" : ""} />
          {resent ? "Email renvoyé !" : "Renvoyer l'email"}
        </button>

        <Link to="/login" className="block mt-4 text-sm text-primary font-semibold hover:underline">
          Retour à la connexion
        </Link>

        <p className="mt-4 text-xs text-muted-foreground">Université Saint‑Joseph — Beyrouth</p>
      </div>
    </div>
  );
}
