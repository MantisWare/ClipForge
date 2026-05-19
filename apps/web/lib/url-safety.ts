export type UrlSafetyResult =
  | { ok: true; url: string }
  | { ok: false; reason: string };

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
]);

const isIpLiteral = (hostname: string): boolean => {
  const ipv4 = /^(\d{1,3}\.){3}\d{1,3}$/;
  return ipv4.test(hostname);
};

export const validateProductUrl = (
  url: string,
  allowlist: string[] = [],
): UrlSafetyResult => {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { ok: false, reason: "Invalid URL" };
  }

  if (parsed.protocol !== "https:") {
    return { ok: false, reason: "Only HTTPS URLs are allowed" };
  }

  const host = parsed.hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.has(host) || isIpLiteral(host)) {
    return { ok: false, reason: "URL hostname is not allowed" };
  }

  if (allowlist.length > 0) {
    const allowed = allowlist.some(
      (entry) => host === entry.toLowerCase() || host.endsWith(`.${entry.toLowerCase()}`),
    );
    if (!allowed) {
      return { ok: false, reason: "URL domain is not on the workspace allowlist" };
    }
  }

  return { ok: true, url: parsed.toString() };
};

export const validateProductUrls = (
  urls: string[],
  allowlist: string[] = [],
): UrlSafetyResult[] =>
  urls.map((url) => validateProductUrl(url, allowlist));
