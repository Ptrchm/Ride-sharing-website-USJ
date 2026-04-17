import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import usjLogo from "@/assets/usj-logo.png";

const navItems = [
  { to: "/", label: "Accueil" },
  { to: "/profile", label: "Profil" },
  { to: "/feedback", label: "Retour" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/90 backdrop-blur border-b border-border shadow-sm">
        <div className="container flex items-center justify-between py-3 px-4 md:px-6">
          <Link to="/" className="flex items-center gap-3 no-underline">
            <img src={usjLogo} alt="USJ Logo" className="h-10 w-auto" />
            <span className="font-bold text-accent hidden sm:inline">RideSharing</span>
          </Link>

          <nav className="flex items-center gap-1 flex-wrap justify-end">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors no-underline ${
                  pathname === item.to
                    ? "bg-primary/15 text-accent border border-primary/30"
                    : "text-muted-foreground hover:bg-primary/10 hover:text-accent border border-transparent"
                }`}
              >
                {item.label}
              </Link>
            ))}
            {!user ? (
              <Link
                to="/login"
                className="px-3 py-2 rounded-lg text-sm font-semibold bg-primary text-primary-foreground no-underline hover:opacity-90 transition-opacity"
              >
                Se connecter
              </Link>
            ) : null}
          </nav>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/50 mt-12">
        <div className="container text-center py-4 text-sm text-muted-foreground font-semibold">
          <strong>Crédits :</strong> Joseph Azar, Peter Chamoun, Tony Feghali et Paul Haddad.
        </div>
      </footer>
    </div>
  );
}
