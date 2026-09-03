export const OFFLINE_MESSAGE =
  "يبدو أن الاتصال بالإنترنت غير متوفر. تحقق من اتصالك وحاول مرة أخرى.";

// Detects a transport-level failure (the request never reached the server)
// rather than a business/validation error the server responded with on
// purpose. Used to decide when to show the generic offline/retry notice
// instead of whatever specific error message a successful round-trip
// would have returned.
export function isNetworkFailure(err: unknown): boolean {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return true;
  if (err instanceof TypeError) return true; // fetch()'s own network-failure shape
  const msg = err instanceof Error ? err.message.toLowerCase() : "";
  return msg.includes("failed to fetch") || msg.includes("load failed") || msg.includes("network");
}
