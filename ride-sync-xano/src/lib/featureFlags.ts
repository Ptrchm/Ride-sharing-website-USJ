export function isEmailVerificationEnabled(): boolean {
  // Off by default until you have a working email/domain setup.
  return String(import.meta.env.VITE_REQUIRE_EMAIL_VERIFICATION ?? "").toLowerCase() === "true";
}

