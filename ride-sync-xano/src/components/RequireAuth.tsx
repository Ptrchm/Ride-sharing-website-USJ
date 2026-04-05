import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { isEmailVerificationEnabled } from "@/lib/featureFlags";

export default function RequireAuth({
  children,
  requireActive = true,
}: {
  children: ReactNode;
  requireActive?: boolean;
}) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (isEmailVerificationEnabled() && requireActive && (user as any)?.is_active === false) {
    return <Navigate to="/verify-pending" replace />;
  }

  return <>{children}</>;
}
