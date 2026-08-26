const {
  isValidEmail,
  isValidAuditedUrl,
  toSafeCount,
  toSafeScore,
  toSafeLabel,
  scoreLine,
  isHoneypotTriggered,
  sendToWeb3Forms,
} = require("./_lib/leadDelivery");

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
  // fields from the request can reach the email template.
  const score = toSafeScore(body.score);
  const scoreLabel = toSafeLabel(body.scoreLabel);
  const totalChecks = toSafeCount(body.totalChecks);
  const failedChecks = toSafeCount(body.failedChecks);
  const warningChecks = toSafeCount(body.warningChecks);

  const sent = await sendToWeb3Forms({
    subject: `SEO-koll lead – ${auditedUrl}`,
    from_name: "Studio Klaro – SEO-koll",
    replyto: email,
    Email: email,
    "Analyserad hemsida": auditedUrl,
    "SEO Health": scoreLine(score, scoreLabel),
    Kontroller: totalChecks !== null ? String(totalChecks) : "–",
    Problem: failedChecks !== null ? String(failedChecks) : "–",
    "Kan förbättras": warningChecks !== null ? String(warningChecks) : "–",
    Source: "SEO-koll",
  });

  if (!sent) {
    // Never leak provider error details or a stack trace to the client.
    res.status(502).json({ success: false, error: "Vi kunde inte skicka förfrågan just nu." });
    return;
  }

  res.status(200).json({ success: true });
};
