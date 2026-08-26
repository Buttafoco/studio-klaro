const {
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
} = require("./_lib/leadDelivery");

// Recipient is fixed server-side. Web3Forms delivers to whatever inbox is
// configured for ACCESS_KEY in the Web3Forms dashboard (studioklarose@gmail.com,
// the same one the main contact form and /api/seo-lead already use) — there is
// no "to" field in the outgoing payload, so nothing the client sends can ever
// change where this mail is delivered.
const INTEREST_RECIPIENT_EMAIL = "studioklarose@gmail.com";

const MAX_ISSUE_LABEL_LENGTH = 80;
const MAX_ISSUE_MESSAGE_LENGTH = 300;
const MAX_ISSUE_DETAILS_LENGTH = 300;
const MAX_ISSUES_INPUT = 200; // bound how much of a raw client array we even look at
const MAX_ISSUES_OUTPUT = 30;

// Same check ids the audit can produce. Anything else is dropped — this is
// the only thing keeping a manipulated client payload from injecting
// arbitrary "findings" into Studio Klaro's follow-up mail.
const ALLOWED_ISSUE_IDS = new Set([
  "title",
  "metaDescription",
  "h1",
  "h2",
  "images",
  "canonical",
  "robots",
  "viewport",
  "lang",
  "structuredData",
  "structuredDataValidity",
  "robotsTxt",
  "sitemap",
  "localBusinessSchema",
  "localBusinessName",
  "localBusinessAddress",
  "localBusinessPhone",
  "localBusinessOpeningHours",
  "visiblePhone",
  "visibleAddress",
  "visibleLocality",
  "localBusinessPhoneConsistency",
  "localBusinessAddressConsistency",
  "pageSpeedPerformance",
  "lighthouseSeo",
]);

// "info" status checks are only worth surfacing when they represent a real
// opportunity for Studio Klaro to help a local business — never generic
// informational noise (e.g. "PageSpeed unavailable" or "no JSON-LD found").
// Split into two mutually exclusive groups purely for how the follow-up
// mail is laid out (technical vs. local-SEO opportunities) — together
// they're exactly the same allowlist as before, so no id is newly allowed
// or dropped, and no id can land in both sections.
const TECHNICAL_OPPORTUNITY_ISSUE_IDS = new Set(["robotsTxt", "sitemap"]);
const LOCAL_OPPORTUNITY_ISSUE_IDS = new Set([
  "localBusinessSchema",
  "localBusinessOpeningHours",
  "visiblePhone",
  "visibleAddress",
  "visibleLocality",
]);
const RELEVANT_INFO_ISSUE_IDS = new Set([...TECHNICAL_OPPORTUNITY_ISSUE_IDS, ...LOCAL_OPPORTUNITY_ISSUE_IDS]);

const ALLOWED_STATUSES = new Set(["fail", "warning", "info"]);
const ALLOWED_IMPORTANCE = new Set(["high", "medium", "low"]);

const ISSUE_SORT_RANK = {
  "fail-high": 0,
  "fail-medium": 1,
  "fail-low": 2,
  "warning-high": 3,
  "warning-medium": 4,
  "warning-low": 5,
};

const STATUS_DISPLAY_LABELS = { fail: "Behöver åtgärdas", warning: "Kan förbättras", info: "Möjlighet / observation" };
const IMPORTANCE_DISPLAY_LABELS = { high: "Hög", medium: "Medel", low: "Låg" };

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// Every field on a client-supplied issue object is untrusted. Only an
// object shaped exactly like one of our own checks — known id, known
// status/importance, plain strings within sane lengths — survives. Never
// eval'd, never templated as HTML: the values are escaped before being
// placed into the outgoing plain-text mail fields.
function sanitizeIssue(raw) {
  if (!raw || typeof raw !== "object") return null;

  const id = typeof raw.id === "string" ? raw.id.trim() : "";
  if (!ALLOWED_ISSUE_IDS.has(id)) return null;

  const status = typeof raw.status === "string" ? raw.status.trim() : "";
  if (!ALLOWED_STATUSES.has(status)) return null;
  if (status === "info" && !RELEVANT_INFO_ISSUE_IDS.has(id)) return null;

  const importance = typeof raw.importance === "string" ? raw.importance.trim() : "";
  if (!ALLOWED_IMPORTANCE.has(importance)) return null;

  const label = escapeHtml(toOptionalText(raw.label, MAX_ISSUE_LABEL_LENGTH) || id);
  const message = escapeHtml(toOptionalText(raw.message, MAX_ISSUE_MESSAGE_LENGTH));
  const details = escapeHtml(toOptionalText(raw.details, MAX_ISSUE_DETAILS_LENGTH));

  return { id, status, importance, label, message, details };
}

function sanitizeIssues(rawIssues) {
  if (!Array.isArray(rawIssues)) return [];

  const sanitized = [];
  for (const raw of rawIssues.slice(0, MAX_ISSUES_INPUT)) {
    const issue = sanitizeIssue(raw);
    if (issue) sanitized.push(issue);
    if (sanitized.length >= MAX_ISSUES_OUTPUT) break;
  }

  // fail+high ... warning+low first (most actionable), then relevant info
  // observations — Array#sort is stable, so ties (incl. all "info" items)
  // keep their original relative order.
  return sanitized.sort((a, b) => {
    const rankA = a.status === "info" ? 6 : ISSUE_SORT_RANK[`${a.status}-${a.importance}`] ?? 5.5;
    const rankB = b.status === "info" ? 6 : ISSUE_SORT_RANK[`${b.status}-${b.importance}`] ?? 5.5;
    return rankA - rankB;
  });
}

// Every fail/warning point gets the exact same shape — title, Status,
// Prioritet, message, and (only when present) a labeled "Detalj:" block —
// so Studio Klaro can scan the list consistently regardless of which check
// produced it.
function formatFollowUpSection(issues) {
  if (!issues.length) {
    return "Inga akuta punkter identifierade i denna analys.";
  }
  return issues
    .map((issue, index) => {
      const lines = [
        `${index + 1}. ${issue.label}`,
        `Status: ${STATUS_DISPLAY_LABELS[issue.status]}`,
        `Prioritet: ${IMPORTANCE_DISPLAY_LABELS[issue.importance]}`,
        "",
        issue.message || "",
      ];
      if (issue.details) {
        lines.push("", "Detalj:", issue.details);
      }
      return lines.join("\n");
    })
    .join("\n\n---\n\n");
}

// Only ever called with a non-empty array — the caller omits the whole
// mail section (rather than sending an empty "nothing found" placeholder)
// when there's nothing to show.
function formatOpportunitySection(issues) {
  return issues.map((issue) => `• ${issue.message || issue.label}`).join("\n");
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ success: false, error: "Method not allowed. Use POST." });
    return;
  }

  const contentType = req.headers["content-type"] || "";
  if (!contentType.toLowerCase().includes("application/json")) {
    res.status(400).json({ success: false, error: "Ogiltig begäran." });
    return;
  }

  const body = req.body && typeof req.body === "object" ? req.body : {};

  // Honeypot: respond as if it succeeded — never reveal that a honeypot
  // exists — but skip sending anything.
  if (isHoneypotTriggered(body)) {
    res.status(200).json({ success: true });
    return;
  }

  const name = toRequiredText(body.name, MAX_NAME_LENGTH);
  if (!name) {
    res.status(400).json({ success: false, error: "Namn krävs." });
    return;
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (!isValidEmail(email)) {
    res.status(400).json({ success: false, error: "Ogiltig e-postadress." });
    return;
  }

  const auditedUrl = typeof body.auditedUrl === "string" ? body.auditedUrl.trim() : "";
  if (!isValidAuditedUrl(auditedUrl)) {
    res.status(400).json({ success: false, error: "Ogiltig analyserad URL." });
    return;
  }

  // Every other field below is untrusted client input. Nothing from
  // `body` is ever forwarded as-is — only these specific, validated
  // values are used to build the outgoing message. No arbitrary extra
  // fields, HTML, or Web3Forms parameters from the request can reach
  // the email template.
  const phone = escapeHtml(toOptionalText(body.phone, MAX_PHONE_LENGTH));
  const message = escapeHtml(toOptionalText(body.message, MAX_MESSAGE_LENGTH));
  const score = toSafeScore(body.score);
  const scoreLabel = toSafeLabel(body.scoreLabel);
  const totalChecks = toSafeCount(body.totalChecks);
  const failedChecks = toSafeCount(body.failedChecks);
  const warningChecks = toSafeCount(body.warningChecks);

  const issues = sanitizeIssues(body.issues);
  // fail/warning always go under "Punkter att följa upp"; info-status
  // issues go under exactly one of the two möjligheter sections below —
  // the two id sets are mutually exclusive, so nothing is ever duplicated.
  const followUpIssues = issues.filter((issue) => issue.status !== "info");
  const technicalOpportunityIssues = issues.filter((issue) => issue.status === "info" && TECHNICAL_OPPORTUNITY_ISSUE_IDS.has(issue.id));
  const localOpportunityIssues = issues.filter((issue) => issue.status === "info" && LOCAL_OPPORTUNITY_ISSUE_IDS.has(issue.id));

  let hostname = auditedUrl;
  try {
    hostname = new URL(auditedUrl).hostname;
  } catch {
    // isValidAuditedUrl already guarantees this parses; kept defensive only.
  }

  const formatBlock = (pairs) => pairs.map(([label, value]) => `${label}:\n${value}`).join("\n\n");

  const fields = {
    subject: `SEO-koll: ${hostname} vill ha hjälp`,
    from_name: "Studio Klaro – SEO-koll (intresse)",
    replyto: email,
    KUND: formatBlock([
      ["Namn", escapeHtml(name)],
      ["Email", escapeHtml(email)],
      ["Telefon", phone || "–"],
      ["Meddelande", message || "–"],
    ]),
    HEMSIDA: formatBlock([
      ["Analyserad hemsida", auditedUrl],
      ["SEO Health", scoreLine(score, scoreLabel)],
      ["Kontroller", totalChecks !== null ? String(totalChecks) : "–"],
      ["Problem", failedChecks !== null ? String(failedChecks) : "–"],
      ["Kan förbättras", warningChecks !== null ? String(warningChecks) : "–"],
    ]),
    "PUNKTER ATT FÖLJA UPP": formatFollowUpSection(followUpIssues),
  };

  // Omit a möjligheter section entirely when it has nothing to show,
  // rather than sending an empty/placeholder section.
  if (technicalOpportunityIssues.length) {
    fields["TEKNISK SEO / MÖJLIGHETER"] = formatOpportunitySection(technicalOpportunityIssues);
  }
  if (localOpportunityIssues.length) {
    fields["LOKAL SEO / MÖJLIGHETER"] = formatOpportunitySection(localOpportunityIssues);
  }

  fields.Source = "SEO-koll – Intresserad av hjälp";

  const sent = await sendToWeb3Forms(fields);

  if (!sent) {
    // Never leak provider error details or a stack trace to the client.
    res.status(502).json({ success: false, error: "Vi kunde inte skicka förfrågan just nu." });
    return;
  }

  res.status(200).json({ success: true });
};

// Exposed for tests only — not part of the endpoint's public contract.
module.exports.__testables = { sanitizeIssues, INTEREST_RECIPIENT_EMAIL };
