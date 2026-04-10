// Helper to format Unix timestamps from either legacy seconds or current milliseconds.

function normalizeTimestampMs(timestamp: number): number {
  if (!Number.isFinite(timestamp) || timestamp <= 0) return 0;
  return timestamp < 1e12 ? timestamp * 1000 : timestamp;
}

export function formatDepartureDate(timestamp: number): string {
  if (!timestamp) return "-";
  const d = new Date(normalizeTimestampMs(timestamp));
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatDepartureTime(timestamp: number): string {
  if (!timestamp) return "-";
  const d = new Date(normalizeTimestampMs(timestamp));
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}
