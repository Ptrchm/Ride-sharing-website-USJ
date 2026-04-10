import { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getDriverDetails, verifyDriver } from "@/services/xanoApi";
import { useAuth } from "@/contexts/AuthContext";

export default function RequireDriver({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  const [isDriver, setIsDriver] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!user) {
        setChecking(false);
        setIsDriver(false);
        return;
      }

      try {
        const res = (await verifyDriver()) as any;
        if (typeof res?.is_driver === "boolean") {
          if (!cancelled) setIsDriver(res.is_driver);
          return;
        }

        const details = await getDriverDetails();
        const ok = Array.isArray(details) && details.some((d: any) => (d?.user_id ?? d?.user) === user.id);
        if (!cancelled) setIsDriver(ok);
      } catch {
        if (!cancelled) setIsDriver(false);
      } finally {
        if (!cancelled) setChecking(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (loading || checking) return null;

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!isDriver) {
    return <Navigate to="/create-ride-form" replace />;
  }

  return <>{children}</>;
}
