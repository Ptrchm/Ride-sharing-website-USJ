// Helper to format a Unix timestamp (seconds) into readable date/time strings

export function formatDepartureDate(timestamp: number): string {
  if (!timestamp) return "—";
  const d = new Date(timestamp * 1000);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatDepartureTime(timestamp: number): string {
  if (!timestamp) return "—";
  const d = new Date(timestamp * 1000);
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}
