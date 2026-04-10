import { useEffect } from "react";

export default function ExternalRedirect({ to }: { to: string }) {
  useEffect(() => {
    window.location.assign(to);
  }, [to]);

  return null;
}

