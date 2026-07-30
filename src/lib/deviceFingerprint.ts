// Stable, non-PII device identifier used to rate-limit access-token attempts.
const KEY = "go_device_fp";

export const getDeviceFingerprint = (): string => {
  try {
    let fp = localStorage.getItem(KEY);
    if (!fp) {
      fp = crypto.randomUUID().replace(/-/g, "").slice(0, 24);
      localStorage.setItem(KEY, fp);
    }
    return fp;
  } catch {
    return "no-storage";
  }
};

export const getClientAgent = (): string =>
  typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 300) : "unknown";
