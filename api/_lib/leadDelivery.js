const WEB3FORMS_ENDPOINT = "https://api.web3forms.com/submit";
const TIMEOUT_MS = 10000;

// Shared by /api/seo-lead and /api/seo-interest — both reuse the same
// Web3Forms delivery mechanism. The access key lives only in the
// WEB3FORMS_ACCESS_KEY environment variable (Vercel Production) — no
// fallback key is kept in source.
const MAX_EMAIL_LENGTH = 254;
const MAX_URL_LENGTH = 2048;
const MAX_LABEL_LENGTH = 50;
const MAX_HONEYPOT_LENGTH = 500;
const MAX_CHECK_COUNT = 500;
const MAX_NAME_LENGTH = 100;
const MAX_PHONE_LENGTH = 40;
const MAX_MESSAGE_LENGTH = 500;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const KNOWN_SCORE_LABELS = new Set(["Mycket bra", "Bra", "Kan förbättras", "Svag", "Kritisk", "Ej tillräckligt med data"]);

function isValidEmail(value) {
  return typeof value === "string" && value.length > 0 && value.length <= MAX_EMAIL_LENGTH && EMAIL_REGEX.test(value.trim());
}

function isValidAuditedUrl(value) {
  if (typeof value !== "string" || value.length === 0 || value.length > MAX_URL_LENGTH) {
    return false;
  }
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

// Bounded, defensive numeric parsing — this data ultimately comes from the
// client and must never be trusted at face value, even though it usually
// just echoes back numbers our own /api/seo-audit produced moments earlier.
function toSafeCount(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  const n = Math.trunc(value);
  if (n < 0 || n > MAX_CHECK_COUNT) return null;
  return n;
}

function toSafeScore(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  const n = Math.trunc(value);
  if (n < 0 || n > 100) return null;
  return n;
}

function toSafeLabel(value) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim().slice(0, MAX_LABEL_LENGTH);
  return KNOWN_SCORE_LABELS.has(trimmed) ? trimmed : "";
}

// For required free-text fields (e.g. name): trims, enforces a max length,
// and rejects empty/non-string input.
function toRequiredText(value, maxLength) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  return trimmed.slice(0, maxLength);
}

// For optional free-text fields (e.g. phone, message): same trimming/length
// cap, but empty/missing is valid — just becomes "".
function toOptionalText(value, maxLength) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

function scoreLine(score, scoreLabel) {
  const display = score !== null ? `${score}/100` : "Ej tillgänglig";
  return scoreLabel ? `${display} – ${scoreLabel}` : display;
}

// Honeypot: real users never see or reach this field (visually hidden,
// removed from tab order, aria-hidden). Any non-empty value here is
// treated as a bot.
function isHoneypotTriggered(body) {
  const honeypot = typeof body.website === "string" ? body.website.trim() : "";
  return Boolean(honeypot) && honeypot.length <= MAX_HONEYPOT_LENGTH;
}

async function sendToWeb3Forms(fields) {
  const accessKey = process.env.WEB3FORMS_ACCESS_KEY;
  // No key configured: never attempt delivery, never reveal why —
  // callers treat a `false` return as a generic, safe-to-show failure.
  if (!accessKey) return false;

  const payload = {
    access_key: accessKey,
    ...fields,
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(WEB3FORMS_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) return false;

    let data = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    return Boolean(data && data.success === true);
  } catch {
    return false;
  } finally {
    clearTimeout(timeoutId);
  }
}

module.exports = {
  MAX_EMAIL_LENGTH,
  MAX_URL_LENGTH,
  MAX_LABEL_LENGTH,
  MAX_HONEYPOT_LENGTH,
  MAX_CHECK_COUNT,
  MAX_NAME_LENGTH,
  MAX_PHONE_LENGTH,
  MAX_MESSAGE_LENGTH,
  isValidEmail,
  isValidAuditedUrl,
  toSafeCount,
  toSafeScore,
  toSafeLabel,
  toRequiredText,
  toOptionalText,
  scoreLine,
  isHoneypotTriggered,
  sendToWeb3Forms,
};
