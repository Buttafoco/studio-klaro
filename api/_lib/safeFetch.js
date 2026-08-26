const http = require("http");
const https = require("https");
const dns = require("dns");
const net = require("net");

const USER_AGENT = "StudioKlaroSEOAudit/1.0";
const DEFAULT_TIMEOUT_MS = 8000;
const DEFAULT_MAX_BYTES = 2 * 1024 * 1024; // 2 MB
const MAX_REDIRECTS = 5;
const REDIRECT_STATUS_CODES = new Set([301, 302, 303, 307, 308]);
const BLOCKED_HOSTNAMES = new Set(["localhost", "localhost.localdomain", "ip6-localhost", "ip6-loopback"]);

class AuditFetchError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function isValidHttpUrl(value) {
  if (typeof value !== "string" || value.trim() === "") {
    return false;
  }

  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    return false;
  }

  return parsed.protocol === "http:" || parsed.protocol === "https:";
}

function ipv4ToLong(ip) {
  return ip.split(".").reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
}

function isPrivateIPv4(ip) {
  const long = ipv4ToLong(ip);
  const inRange = (base, bits) => {
    const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
    return (long & mask) === (ipv4ToLong(base) & mask);
  };

  return (
    inRange("10.0.0.0", 8) || // 10.0.0.0/8
    inRange("172.16.0.0", 12) || // 172.16.0.0/12
    inRange("192.168.0.0", 16) || // 192.168.0.0/16
    inRange("127.0.0.0", 8) || // loopback
    inRange("169.254.0.0", 16) || // link-local
    inRange("0.0.0.0", 8) // "this network" / unspecified
  );
}

function isPrivateIPv6(ip) {
  const normalized = ip.toLowerCase();

  if (normalized === "::1" || normalized === "::") {
    return true; // loopback / unspecified
  }
  if (/^fe[89ab][0-9a-f]:/.test(normalized)) {
    return true; // fe80::/10 link-local
  }
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) {
    return true; // fc00::/7 unique local
  }

  const mapped = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) {
    return isPrivateIPv4(mapped[1]); // IPv4-mapped IPv6 address
  }

  return false;
}

function isBlockedIp(address, family) {
  return family === 4 ? isPrivateIPv4(address) : isPrivateIPv6(address);
}

function isObviouslyBlockedHost(hostname) {
  const host = hostname.toLowerCase().replace(/\.$/, "");

  if (BLOCKED_HOSTNAMES.has(host)) {
    return true;
  }

  const ipFamily = net.isIP(host);
  if (ipFamily) {
    return isBlockedIp(host, ipFamily);
  }

  return false;
}

// Custom DNS lookup used by http/https so the address we validate is the
// exact address Node connects to (prevents a DNS-rebinding gap between a
// separate pre-check and the actual TCP connection).
function safeLookup(hostname, options, callback) {
  if (typeof options === "function") {
    callback = options;
    options = {};
  }

  dns.lookup(hostname, { all: true, verbatim: true }, (err, addresses) => {
    if (err) {
      return callback(err);
    }
    if (!addresses.length) {
      return callback(new Error("DNS_NO_RESULTS"));
    }

    for (const addr of addresses) {
      if (isBlockedIp(addr.address, addr.family)) {
        return callback(new Error("SSRF_BLOCKED"));
      }
    }

    if (options && options.all) {
      return callback(null, addresses);
    }

    callback(null, addresses[0].address, addresses[0].family);
  });
}

/**
 * Securely fetches a public http/https resource: SSRF/DNS-guarded on every
 * hop, bounded redirects, an overall timeout, and a byte cap on the body.
 *
 * options:
 *   timeoutMs           overall budget across all redirect hops (default 8000)
 *   maxBytes            body size cap (default 2 MB)
 *   onLimitExceeded      "error" (reject, default) or "truncate" (stop reading,
 *                        resolve with what was read so far and truncated:true)
 *   requiredContentType  if set, reject with 422 unless the response
 *                        content-type includes this string (e.g. "text/html")
 *   rejectOnServerError  reject 5xx responses with 502 (default true)
 *
 * Resolves { finalUrl, status, contentType, body: Buffer, truncated }.
 */
function fetchSafely(targetUrl, options = {}) {
  const {
    timeoutMs = DEFAULT_TIMEOUT_MS,
    maxBytes = DEFAULT_MAX_BYTES,
    onLimitExceeded = "error",
    requiredContentType = null,
    rejectOnServerError = true,
  } = options;

  return new Promise((resolve, reject) => {
    let redirectCount = 0;
    let settled = false;

    const finish = (fn, arg) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      fn(arg);
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const attempt = (url) => {
      let parsed;
      try {
        parsed = new URL(url);
      } catch {
        return finish(reject, new AuditFetchError(400, "Redirect till en ogiltig URL."));
      }

      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        return finish(reject, new AuditFetchError(400, "Redirect till ett icke tillåtet protokoll."));
      }
      if (isObviouslyBlockedHost(parsed.hostname)) {
        return finish(
          reject,
          new AuditFetchError(400, "Adressen pekar mot en privat/lokal resurs och är blockerad.")
        );
      }

      const client = parsed.protocol === "https:" ? https : http;

      const req = client.request(
        {
          hostname: parsed.hostname,
          port: parsed.port || (parsed.protocol === "https:" ? 443 : 80),
          path: parsed.pathname + parsed.search,
          method: "GET",
          lookup: safeLookup,
          signal: controller.signal,
          headers: {
            "User-Agent": USER_AGENT,
            Accept: "text/html,application/xhtml+xml,application/xml,text/xml,text/plain,*/*",
          },
        },
        (res) => {
          const status = res.statusCode;

          if (REDIRECT_STATUS_CODES.has(status)) {
            res.resume();
            const location = res.headers.location;
            if (!location) {
              return finish(reject, new AuditFetchError(502, "Sidan skickade en redirect utan mål."));
            }

            let redirectUrl;
            try {
              redirectUrl = new URL(location, url).toString();
            } catch {
              return finish(reject, new AuditFetchError(502, "Sidan skickade en ogiltig redirect."));
            }

            redirectCount += 1;
            if (redirectCount > MAX_REDIRECTS) {
              return finish(reject, new AuditFetchError(502, "För många redirects."));
            }

            return attempt(redirectUrl);
          }

          if (rejectOnServerError && status >= 500) {
            return finish(reject, new AuditFetchError(502, `Sidan svarade med serverfel (status ${status}).`));
          }

          const contentType = res.headers["content-type"] || "";
          if (requiredContentType && !contentType.toLowerCase().includes(requiredContentType)) {
            res.resume();
            return finish(
              reject,
              new AuditFetchError(422, `Sidan returnerade inte HTML (content-type: ${contentType || "okänd"}).`)
            );
          }

          let receivedBytes = 0;
          const chunks = [];

          res.on("data", (chunk) => {
            if (settled) return;
            receivedBytes += chunk.length;

            if (receivedBytes > maxBytes) {
              if (onLimitExceeded === "truncate") {
                res.destroy();
                finish(resolve, {
                  finalUrl: url,
                  status,
                  contentType: contentType.split(";")[0].trim(),
                  body: Buffer.concat(chunks),
                  truncated: true,
                });
              } else {
                res.destroy();
                finish(reject, new AuditFetchError(413, "Svaret är för stort."));
              }
              return;
            }

            chunks.push(chunk);
          });

          res.on("end", () => {
            finish(resolve, {
              finalUrl: url,
              status,
              contentType: contentType.split(";")[0].trim(),
              body: Buffer.concat(chunks),
              truncated: false,
            });
          });

          res.on("error", () => {
            finish(reject, new AuditFetchError(502, "Fel vid läsning av svaret."));
          });
        }
      );

      req.on("error", (err) => {
        if (err.message === "SSRF_BLOCKED") {
          return finish(
            reject,
            new AuditFetchError(400, "Adressen pekar mot en privat/lokal resurs och är blockerad.")
          );
        }
        if (err.name === "AbortError" || err.code === "ABORT_ERR") {
          return finish(reject, new AuditFetchError(504, "Timeout vid hämtning."));
        }
        finish(reject, new AuditFetchError(502, "Kunde inte nå resursen."));
      });

      req.end();
    };

    attempt(targetUrl);
  });
}

module.exports = {
  AuditFetchError,
  isValidHttpUrl,
  isObviouslyBlockedHost,
  fetchSafely,
};
