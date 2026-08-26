const MAX_TEXT_LENGTH = 500000;

// --- Heuristic disclaimers -------------------------------------------------
// Everything in this file is pattern-matching over visible text, not a
// validator or an NLP model. Real phone numbers, addresses and emails can be
// formatted in ways these patterns miss (unusual spacing, non-Swedish street
// suffixes, numbers embedded in images, etc.). A "not detected" result means
// the heuristic didn't find a confident match — it is NOT proof the page
// lacks that information. That's why every check built on this data treats
// absence as "info", never "warning"/"fail".

// Swedish phone-number heuristic: requires a domestic ("0…") or
// international ("+46…") prefix plus a plausible digit count, so it
// naturally excludes years, prices, postal codes and personal/org numbers
// (none of which start with those prefixes). It is intentionally not a
// full E.164/national-format validator.
const PHONE_CANDIDATE_REGEX = /(?<!\d)(\+46[\s-]?\d{1,3}(?:[\s-]?\d){5,7}|0\d{1,3}(?:[\s-]?\d){5,7})(?!\d)/g;

const EMAIL_CANDIDATE_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

// V1 Swedish street-name heuristic — NOT a general address parser. It looks
// for a capitalized word ending in one of a handful of common Swedish
// street-name suffixes, followed by a house number. Multi-word street
// names ("Stora Nygatan"), PO boxes, and uncommon suffixes will be missed.
const STREET_SUFFIXES = ["gatan", "vägen", "gränd", "torg", "allé", "plats", "backen", "strand", "kaj"];
const ADDRESS_CANDIDATE_REGEX = new RegExp(
  `\\b[A-ZÅÄÖ][a-zåäö]*(?:${STREET_SUFFIXES.join("|")})\\s+\\d{1,3}\\s?[A-Za-z]?\\b`
);

function getVisibleText($) {
  const bodyClone = $("body").clone();
  bodyClone.find("script, style, noscript, template, svg").remove();
  const normalized = bodyClone.text().replace(/\s+/g, " ").trim();
  return normalized.slice(0, MAX_TEXT_LENGTH);
}

function findLinksByScheme($, scheme) {
  const links = [];
  $("a[href]").each((_, el) => {
    const href = ($(el).attr("href") || "").trim();
    if (href.toLowerCase().startsWith(scheme)) {
      links.push(href);
    }
  });
  return links;
}

function analyzePhoneSignal($, visibleText) {
  const textMatches = visibleText.match(PHONE_CANDIDATE_REGEX) || [];
  const telLinks = findLinksByScheme($, "tel:");
  const count = textMatches.length + telLinks.length;

  return {
    detected: count > 0,
    count,
    telLinkDetected: telLinks.length > 0,
  };
}

function analyzeEmailSignal($, visibleText) {
  const textMatches = visibleText.match(EMAIL_CANDIDATE_REGEX) || [];
  const mailtoLinks = findLinksByScheme($, "mailto:");

  return {
    detected: textMatches.length > 0 || mailtoLinks.length > 0,
    mailtoDetected: mailtoLinks.length > 0,
  };
}

function analyzeAddressSignal(visibleText) {
  return { detected: ADDRESS_CANDIDATE_REGEX.test(visibleText) };
}

function getPrimaryLocalBusinessEntity(structuredData) {
  const entities = structuredData && structuredData.localBusiness && structuredData.localBusiness.entities;
  return Array.isArray(entities) && entities.length > 0 ? entities[0] : null;
}

// Uses the LocalBusiness structured-data locality (if any) as a candidate
// to look for in the visible text — a soft cross-check, not geolocation or
// address parsing of the page itself.
function analyzeLocalitySignal(structuredData, visibleText) {
  const entity = getPrimaryLocalBusinessEntity(structuredData);
  const locality = entity && entity.address && entity.address.addressLocality ? entity.address.addressLocality.trim() : "";

  if (!locality) {
    return { schemaValueAvailable: false, mentionedInVisibleText: null };
  }

  return {
    schemaValueAvailable: true,
    mentionedInVisibleText: visibleText.toLowerCase().includes(locality.toLowerCase()),
  };
}

// Compares LocalBusiness structured data against the visible-content
// signals above. null means "nothing to compare" (LocalBusiness doesn't
// declare that field), distinct from false ("declared, but not found in
// visible text" — itself only a heuristic miss, not a confirmed error).
function analyzeConsistency(structuredData, phone, address) {
  const entity = getPrimaryLocalBusinessEntity(structuredData);
  const hasPhone = Boolean(entity && entity.telephone);
  const hasAddress = Boolean(
    entity &&
      entity.address &&
      (entity.address.streetAddress || entity.address.addressLocality || entity.address.postalCode || entity.address.addressCountry || entity.address.addressRegion)
  );

  return {
    localBusinessPhoneVisible: hasPhone ? phone.detected : null,
    localBusinessAddressVisible: hasAddress ? address.detected : null,
  };
}

function analyzeContentSignals($, structuredData) {
  const visibleText = getVisibleText($);

  const phone = analyzePhoneSignal($, visibleText);
  const email = analyzeEmailSignal($, visibleText);
  const address = analyzeAddressSignal(visibleText);
  const locality = analyzeLocalitySignal(structuredData, visibleText);
  const consistency = analyzeConsistency(structuredData, phone, address);

  return { phone, email, address, locality, consistency };
}

module.exports = { analyzeContentSignals };
