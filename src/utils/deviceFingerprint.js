// A lightweight, dependency-free browser fingerprint - NOT meant to be
// cryptographically unique or resistant to spoofing (that needs a real
// fingerprinting service like FingerprintJS Pro). This is just a coarse
// signal so the backend can notice "this account is suddenly logging in
// from a completely different set of devices/browsers" for basic
// anti-fraud review, alongside IP-based login history.
export function getDeviceFingerprint() {
  const cached = localStorage.getItem("deviceFingerprint");
  if (cached) return cached;

  const parts = [
    navigator.userAgent,
    navigator.language,
    `${window.screen.width}x${window.screen.height}`,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    navigator.hardwareConcurrency || "",
  ].join("|");

  // Simple deterministic hash (djb2) - good enough for a coarse signal,
  // no need to pull in a crypto library for this.
  let hash = 5381;
  for (let i = 0; i < parts.length; i++) {
    hash = (hash * 33) ^ parts.charCodeAt(i);
  }
  const fingerprint = (hash >>> 0).toString(36);

  localStorage.setItem("deviceFingerprint", fingerprint);
  return fingerprint;
}
