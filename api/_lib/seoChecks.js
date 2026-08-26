const TITLE_MIN_LENGTH = 20;
const TITLE_MAX_LENGTH = 65;
const DESCRIPTION_MIN_LENGTH = 70;
const DESCRIPTION_MAX_LENGTH = 170;

function checkTitle(title) {
  const id = "title";
  const label = "Sidtitel";

  if (!title.exists) {
    return { id, label, status: "fail", importance: "high", message: "Sidan saknar en sidtitel.", details: "" };
  }

  if (title.length < TITLE_MIN_LENGTH) {
    return {
      id,
      label,
      status: "warning",
      importance: "medium",
      message: "Sidtiteln är ganska kort och kan vara mer beskrivande.",
      details: title.value,
    };
  }

  if (title.length > TITLE_MAX_LENGTH) {
    return {
      id,
      label,
      status: "warning",
      importance: "medium",
      message: "Sidtiteln är lång och kan kapas i Googles sökresultat.",
      details: title.value,
    };
  }

  return {
    id,
    label,
    status: "pass",
    importance: "high",
    message: "Sidan har en tydlig sidtitel.",
    details: title.value,
  };
}

function checkMetaDescription(metaDescription) {
  const id = "metaDescription";
  const label = "Meta description";

  if (!metaDescription.exists) {
    return { id, label, status: "fail", importance: "medium", message: "Sidan saknar meta description.", details: "" };
  }

  if (metaDescription.length < DESCRIPTION_MIN_LENGTH) {
    return {
      id,
      label,
      status: "warning",
      importance: "medium",
      message: "Meta description är ganska kort.",
      details: metaDescription.value,
    };
  }

  if (metaDescription.length > DESCRIPTION_MAX_LENGTH) {
    return {
      id,
      label,
      status: "warning",
      importance: "medium",
      message: "Meta description är lång och kan kapas i sökresultatet.",
      details: metaDescription.value,
    };
  }

  return {
    id,
    label,
    status: "pass",
    importance: "medium",
    message: "Meta description har en bra längd.",
    details: metaDescription.value,
  };
}

function checkH1(h1) {
  const id = "h1";
  const label = "H1-rubrik";

  if (h1.count === 0) {
    return { id, label, status: "fail", importance: "high", message: "Sidan saknar en H1-rubrik.", details: "" };
  }

  if (h1.count === 1) {
    return {
      id,
      label,
      status: "pass",
      importance: "high",
      message: "Sidan har en tydlig H1-rubrik.",
      details: h1.values[0] || "",
    };
  }

  return {
    id,
    label,
    status: "warning",
    importance: "medium",
    message: "Sidan har flera H1-rubriker. Kontrollera att sidans huvudrubrik är tydlig.",
    details: `${h1.count} H1-rubriker hittades: ${h1.values.join(", ")}`,
  };
}

function checkH2(h2) {
  const id = "h2";
  const label = "H2-rubriker";

  if (h2.count === 0) {
    return {
      id,
      label,
      status: "info",
      importance: "low",
      message: "Sidan använder inga H2-rubriker.",
      details: "",
    };
  }

  return {
    id,
    label,
    status: "pass",
    importance: "low",
    message: "Sidan använder underrubriker för att strukturera innehållet.",
    details: `${h2.count} H2-rubriker hittades.`,
  };
}

function checkImages(images) {
  const id = "images";
  const label = "Bilder och alt-text";

  if (images.total === 0) {
    return { id, label, status: "info", importance: "low", message: "Sidan innehåller inga bilder.", details: "" };
  }

  if (images.missingAlt > 0) {
    return {
      id,
      label,
      status: "warning",
      importance: "medium",
      message: `${images.missingAlt} bilder saknar alt-attribut.`,
      details: `${images.missingAlt} av ${images.total} bilder saknar alt-attribut.`,
    };
  }

  return {
    id,
    label,
    status: "pass",
    importance: "low",
    message: "Alla bilder har ett alt-attribut.",
    details: images.emptyAlt > 0 ? `${images.emptyAlt} bilder har tom alt-text (kan vara avsiktligt för dekorativa bilder).` : "",
  };
}

function checkCanonical(canonical) {
  const id = "canonical";
  const label = "Canonical URL";

  if (!canonical.exists) {
    return { id, label, status: "warning", importance: "medium", message: "Sidan saknar canonical URL.", details: "" };
  }

  return { id, label, status: "pass", importance: "medium", message: "Sidan har en canonical URL.", details: canonical.value };
}

function checkRobots(robots) {
  const id = "robots";
  const label = "Robots / noindex";

  if (robots.exists && robots.noindex) {
    return {
      id,
      label,
      status: "warning",
      importance: "high",
      message: "Sidan är markerad med noindex och kan därför vara exkluderad från Googles index.",
      details: robots.value,
    };
  }

  if (robots.exists) {
    return {
      id,
      label,
      status: "pass",
      importance: "high",
      message: "Sidan verkar kunna indexeras av sökmotorer.",
      details: robots.value,
    };
  }

  // No robots-meta at all also means "not blocked from indexing" — a real
  // positive result, not just background info. Kept scoreEligible:false
  // so this reclassification (was "info", excluded from scoring either
  // way) doesn't start affecting SEO Health.
  return {
    id,
    label,
    status: "pass",
    importance: "high",
    message: "Sidan verkar kunna indexeras av sökmotorer.",
    details: "",
    scoreEligible: false,
  };
}

function checkViewport(viewport) {
  const id = "viewport";
  const label = "Viewport";

  if (!viewport.exists) {
    return {
      id,
      label,
      status: "fail",
      importance: "high",
      message: "Sidan saknar viewport-inställning för mobila enheter.",
      details: "",
    };
  }

  return { id, label, status: "pass", importance: "high", message: "Sidan har viewport-inställning för mobil.", details: viewport.value };
}

function checkLang(lang) {
  const id = "lang";
  const label = "Språk (lang)";

  if (!lang.exists) {
    return {
      id,
      label,
      status: "warning",
      importance: "low",
      message: "Sidans språk är inte angivet i HTML.",
      details: "",
    };
  }

  return {
    id,
    label,
    status: "pass",
    importance: "low",
    message: `Sidans språk är angivet som ${lang.value}.`,
    details: lang.value,
  };
}

function checkStructuredData(structuredData) {
  const id = "structuredData";
  const label = "Structured data (JSON-LD)";

  if (structuredData.jsonLdCount === 0) {
    // Was "info" (and implicitly scoreEligible, since info is excluded from
    // scoring regardless). Now a real "kan förbättras" result for the
    // customer, but scoreEligible:false keeps SEO Health unchanged.
    return {
      id,
      label,
      status: "warning",
      importance: "low",
      message: "Ingen strukturerad data hittades på sidan.",
      details: "",
      scoreEligible: false,
    };
  }

  return {
    id,
    label,
    status: "pass",
    importance: "low",
    message: `${structuredData.jsonLdCount} JSON-LD-block hittades.`,
    details: "",
  };
}

function checkRobotsTxt(robotsTxt) {
  const id = "robotsTxt";
  const label = "robots.txt";

  if (robotsTxt && robotsTxt.exists) {
    return {
      id,
      label,
      status: "pass",
      importance: "low",
      message: "Webbplatsen har en robots.txt-fil.",
      details: robotsTxt.url,
      scoreEligible: false,
    };
  }

  return {
    id,
    label,
    status: "warning",
    importance: "low",
    message: "Ingen robots.txt-fil hittades.",
    details: "",
    scoreEligible: false,
  };
}

function checkSitemap(sitemap) {
  const id = "sitemap";
  const label = "Sitemap";

  if (sitemap && sitemap.exists) {
    return {
      id,
      label,
      status: "pass",
      importance: "low",
      message: "Webbplatsen har en XML-sitemap.",
      details: sitemap.url,
      scoreEligible: false,
    };
  }

  return {
    id,
    label,
    status: "warning",
    importance: "low",
    message: "Ingen XML-sitemap hittades.",
    details: "",
    scoreEligible: false,
  };
}

function checkStructuredDataValidity(structuredData) {
  const id = "structuredDataValidity";
  const label = "Structured data";

  if (structuredData.jsonLdCount === 0) {
    // Same underlying fact as checkStructuredData's "inga hittades" — worded
    // differently here so the two check rows don't show identical text.
    return {
      id,
      label,
      status: "warning",
      importance: "low",
      message: "Det finns ingen structured data att kontrollera giltigheten på.",
      details: "",
      scoreEligible: false,
    };
  }

  if (structuredData.invalidJsonLdCount > 0) {
    return {
      id,
      label,
      status: "warning",
      importance: "medium",
      message: "En del structured data på sidan kunde inte läsas.",
      details: `${structuredData.invalidJsonLdCount} av ${structuredData.jsonLdCount} JSON-LD-block innehåller ogiltig JSON.`,
      scoreEligible: false,
    };
  }

  return {
    id,
    label,
    status: "pass",
    importance: "low",
    message: "Sidans JSON-LD kunde läsas utan syntaxfel.",
    details: "",
    scoreEligible: false,
  };
}

function checkLocalBusinessSchema(structuredData, localSeoRelevant) {
  const id = "localBusinessSchema";
  const label = "Strukturerad företagsinformation";

  if (structuredData.localBusiness.detected) {
    return {
      id,
      label,
      status: "pass",
      importance: "medium",
      message: "Structured data för lokal verksamhet hittades.",
      details: structuredData.localBusiness.types.join(", "),
      // V2: only counts toward the score once we know the page actually
      // represents a local business — see localSeoRelevance.js.
      scoreEligible: localSeoRelevant === true,
    };
  }

  if (localSeoRelevant) {
    // V2: a page that otherwise looks like a local/physical business
    // (strong schema type, or a clear visible address + phone) but has no
    // LocalBusiness schema is a real, actionable gap — not just
    // background info like it is for a non-local site.
    return {
      id,
      label,
      status: "warning",
      importance: "medium",
      message: "Ingen strukturerad företagsinformation hittades.",
      details: "Sidan verkar tillhöra ett lokalt företag, men saknar strukturerad data som hjälper Google att förstå verksamheten.",
      scoreEligible: true,
    };
  }

  if (structuredData.organization.detected) {
    // A site can be entirely legitimate without a physical LocalBusiness
    // entity — a service company with no public customer premises should
    // use Organization instead, and that's a correct, positive result here,
    // not a gap. See localSeoRelevance.js for how that distinction is made.
    return {
      id,
      label,
      status: "pass",
      importance: "medium",
      message: "Sidan har korrekt Organization structured data.",
      details: "",
      scoreEligible: false,
    };
  }

  return {
    id,
    label,
    status: "info",
    importance: "medium",
    message: "Ingen strukturerad företagsinformation hittades.",
    details: "",
    scoreEligible: false,
  };
}

// The next four checks only make sense once a LocalBusiness entity was
// found, so they return null (filtered out below) rather than an
// irrelevant "info" row when the site isn't a local business.
function checkLocalBusinessName(localBusiness) {
  if (!localBusiness.entities.length) {
    return null;
  }
  const entity = localBusiness.entities[0];

  if (entity.name) {
    return {
      id: "localBusinessName",
      label: "Företagsnamn (structured data)",
      status: "pass",
      importance: "medium",
      message: "Företagsnamn finns i LocalBusiness structured data.",
      details: entity.name,
      scoreEligible: false,
    };
  }

  return {
    id: "localBusinessName",
    label: "Företagsnamn (structured data)",
    status: "warning",
    importance: "medium",
    message: "LocalBusiness structured data saknar företagsnamn.",
    details: "",
    scoreEligible: false,
  };
}

function checkLocalBusinessAddress(localBusiness, localSeoRelevant) {
  if (!localBusiness.entities.length) {
    // A missing LocalBusiness entity is already scored (or not) by
    // checkLocalBusinessSchema — never double-punish the same root cause.
    return null;
  }
  const address = localBusiness.entities[0].address;
  const hasAnyField = Boolean(
    address.streetAddress || address.addressLocality || address.postalCode || address.addressCountry || address.addressRegion
  );
  const scoreEligible = localSeoRelevant === true;

  if (!hasAnyField) {
    return {
      id: "localBusinessAddress",
      label: "Adress (structured data)",
      status: "warning",
      importance: "medium",
      message: "LocalBusiness structured data saknar fysisk adress.",
      details: "",
      scoreEligible,
    };
  }

  const requiredFields = [
    ["streetAddress", "streetAddress"],
    ["addressLocality", "addressLocality"],
    ["postalCode", "postalCode"],
    ["addressCountry", "addressCountry"],
  ];
  const missing = requiredFields.filter(([key]) => !address[key]).map(([, name]) => name);

  return {
    id: "localBusinessAddress",
    label: "Adress (structured data)",
    status: "pass",
    importance: "medium",
    message: "LocalBusiness structured data innehåller en adress.",
    details: missing.length ? `Saknas: ${missing.join(", ")}` : "",
    scoreEligible,
  };
}

function checkLocalBusinessPhone(localBusiness, localSeoRelevant) {
  if (!localBusiness.entities.length) {
    // Same reasoning as checkLocalBusinessAddress — no entity means
    // checkLocalBusinessSchema already covers this gap.
    return null;
  }
  const entity = localBusiness.entities[0];
  const scoreEligible = localSeoRelevant === true;

  if (entity.telephone) {
    return {
      id: "localBusinessPhone",
      label: "Telefonnummer (structured data)",
      status: "pass",
      importance: "low",
      message: "LocalBusiness structured data innehåller ett telefonnummer.",
      details: "",
      scoreEligible,
    };
  }

  return {
    id: "localBusinessPhone",
    label: "Telefonnummer (structured data)",
    status: "warning",
    importance: "low",
    message: "LocalBusiness structured data saknar telefonnummer.",
    details: "",
    scoreEligible,
  };
}

function checkLocalBusinessOpeningHours(localBusiness) {
  if (!localBusiness.entities.length) {
    return null;
  }
  const entity = localBusiness.entities[0];

  if (entity.hasOpeningHours) {
    return {
      id: "localBusinessOpeningHours",
      label: "Öppettider (structured data)",
      status: "pass",
      importance: "low",
      message: "LocalBusiness structured data innehåller öppettider.",
      details: "",
      scoreEligible: false,
    };
  }

  return {
    id: "localBusinessOpeningHours",
    label: "Öppettider (structured data)",
    status: "warning",
    importance: "low",
    message: "LocalBusiness structured data innehåller inga öppettider.",
    details: "",
    scoreEligible: false,
  };
}

// Only fires as a positive result when contact hours are actually found —
// a service company without a physical premise shouldn't be nudged to add
// LocalBusiness-style opening hours it doesn't have, so there's no "missing"
// branch here (mirrors how the other Organization-only signals work).
function checkOrganizationContactHours(structuredData) {
  if (!structuredData.organization.detected || !structuredData.organization.hasContactHours) {
    return null;
  }
  return {
    id: "organizationContactHours",
    label: "Kontakttider",
    status: "pass",
    importance: "low",
    message: "Tydliga kontakttider hittades.",
    details: "",
    scoreEligible: false,
  };
}

const PAGESPEED_PERFORMANCE_HIGH_THRESHOLD = 90;
const PAGESPEED_PERFORMANCE_LOW_THRESHOLD = 50;
const LIGHTHOUSE_SEO_HIGH_THRESHOLD = 90;

function checkPageSpeedPerformance(pageSpeed) {
  const id = "pageSpeedPerformance";
  const label = "Mobilprestanda (PageSpeed)";

  if (!pageSpeed || !pageSpeed.available || typeof pageSpeed.performanceScore !== "number") {
    return {
      id,
      label,
      status: "info",
      importance: "medium",
      message: "PageSpeed-data kunde inte hämtas.",
      details: "",
      scoreEligible: false,
    };
  }

  const score = pageSpeed.performanceScore;
  const details = `${score}/100`;

  if (score >= PAGESPEED_PERFORMANCE_HIGH_THRESHOLD) {
    return {
      id,
      label,
      status: "pass",
      importance: "medium",
      message: "Mobilprestandan är mycket bra enligt Lighthouse.",
      details,
      scoreEligible: false,
    };
  }

  if (score >= PAGESPEED_PERFORMANCE_LOW_THRESHOLD) {
    return {
      id,
      label,
      status: "warning",
      importance: "medium",
      message: "Mobilprestandan kan förbättras enligt Lighthouse.",
      details,
      scoreEligible: false,
    };
  }

  // Intentionally "warning", not "fail" — Lighthouse scores can vary
  // between runs, so a single low score shouldn't read as a hard failure.
  return {
    id,
    label,
    status: "warning",
    importance: "high",
    message: "Mobilprestandan är låg enligt Lighthouse.",
    details,
    scoreEligible: false,
  };
}

function checkLighthouseSeo(pageSpeed) {
  const id = "lighthouseSeo";
  const label = "Lighthouse SEO";

  if (!pageSpeed || !pageSpeed.available || typeof pageSpeed.lighthouseSeoScore !== "number") {
    return {
      id,
      label,
      status: "info",
      importance: "medium",
      message: "PageSpeed-data kunde inte hämtas.",
      details: "",
      scoreEligible: false,
    };
  }

  const score = pageSpeed.lighthouseSeoScore;
  const message = `Lighthouse SEO-kontrollen gav ${score}/100.`;

  if (score >= LIGHTHOUSE_SEO_HIGH_THRESHOLD) {
    return { id, label, status: "pass", importance: "medium", message, details: "", scoreEligible: false };
  }

  return { id, label, status: "warning", importance: "medium", message, details: "", scoreEligible: false };
}

const EMPTY_CONTENT_SIGNALS = {
  phone: { detected: false, count: 0, telLinkDetected: false },
  email: { detected: false, mailtoDetected: false },
  address: { detected: false },
  locality: { schemaValueAvailable: false, mentionedInVisibleText: null },
  consistency: { localBusinessPhoneVisible: null, localBusinessAddressVisible: null },
};

function checkVisiblePhone(contentSignals, localSeoRelevant) {
  const id = "visiblePhone";
  const label = "Synligt telefonnummer";
  const scoreEligible = localSeoRelevant === true;

  if (contentSignals.phone.detected) {
    return {
      id,
      label,
      status: "pass",
      importance: "low",
      message: "Kontakttelefon verkar finnas på sidan.",
      details: "",
      scoreEligible,
    };
  }

  // V2: only a "warning" (never "fail") when the page looks local — the
  // regex-based heuristic can miss a real phone number, so we never treat
  // absence as a confirmed error.
  return {
    id,
    label,
    status: localSeoRelevant ? "warning" : "info",
    importance: "low",
    message: "Inget tydligt telefonnummer hittades i sidans synliga innehåll.",
    details: "",
    scoreEligible,
  };
}

function checkVisibleAddress(contentSignals, localSeoRelevant) {
  const id = "visibleAddress";
  const label = "Synlig fysisk adress";
  const scoreEligible = localSeoRelevant === true;
  const importance = localSeoRelevant ? "medium" : "low";

  if (contentSignals.address.detected) {
    return {
      id,
      label,
      status: "pass",
      importance,
      message: "En fysisk adress verkar finnas i sidans synliga innehåll.",
      details: "",
      scoreEligible,
    };
  }

  // V2: only a "warning" (never "fail") when the page looks local — the
  // Swedish street-suffix heuristic can miss a real address, so absence
  // is never treated as a confirmed error.
  return {
    id,
    label,
    status: localSeoRelevant ? "warning" : "info",
    importance,
    message: "Ingen tydlig fysisk adress hittades i sidans synliga innehåll.",
    details: "",
    scoreEligible,
  };
}

// Only relevant when LocalBusiness structured data actually declares a
// locality — otherwise there's nothing to cross-check against.
function checkVisibleLocality(contentSignals) {
  if (!contentSignals.locality.schemaValueAvailable) {
    return null;
  }

  const id = "visibleLocality";
  const label = "Ort nämns på sidan";

  if (contentSignals.locality.mentionedInVisibleText) {
    return {
      id,
      label,
      status: "pass",
      importance: "medium",
      message: "Verksamhetens ort nämns i sidans synliga innehåll.",
      details: "",
      scoreEligible: false,
    };
  }

  return {
    id,
    label,
    status: "info",
    importance: "medium",
    message: "Verksamhetens ort hittades i structured data men inte tydligt i sidans synliga text.",
    details: "",
    scoreEligible: false,
  };
}

// Only relevant when LocalBusiness declares a telephone/address at all —
// a heuristic miss here is never treated as a confirmed error (info, not
// warning/fail).
function checkLocalBusinessPhoneConsistency(contentSignals) {
  const visible = contentSignals.consistency.localBusinessPhoneVisible;
  if (visible === null) {
    return null;
  }

  const id = "localBusinessPhoneConsistency";
  const label = "Telefon: structured data vs. synligt innehåll";

  if (visible) {
    return {
      id,
      label,
      status: "pass",
      importance: "low",
      message: "Telefon i LocalBusiness structured data verkar stämma överens med sidans synliga innehåll.",
      details: "",
      scoreEligible: false,
    };
  }

  return {
    id,
    label,
    status: "info",
    importance: "low",
    message: "Telefon finns i LocalBusiness structured data men hittades inte tydligt i sidans synliga innehåll.",
    details: "",
    scoreEligible: false,
  };
}

function checkLocalBusinessAddressConsistency(contentSignals) {
  const visible = contentSignals.consistency.localBusinessAddressVisible;
  if (visible === null) {
    return null;
  }

  const id = "localBusinessAddressConsistency";
  const label = "Adress: structured data vs. synligt innehåll";

  if (visible) {
    return {
      id,
      label,
      status: "pass",
      importance: "low",
      message: "Adress i LocalBusiness structured data verkar stämma överens med sidans synliga innehåll.",
      details: "",
      scoreEligible: false,
    };
  }

  return {
    id,
    label,
    status: "info",
    importance: "low",
    message: "Adress finns i LocalBusiness structured data men hittades inte tydligt i sidans synliga innehåll.",
    details: "",
    scoreEligible: false,
  };
}

function buildSeoChecks(seo, technicalSeo = {}, pageSpeed = null, contentSignals = EMPTY_CONTENT_SIGNALS, localSeoRelevant = false) {
  const checks = [
    checkTitle(seo.title),
    checkMetaDescription(seo.metaDescription),
    checkH1(seo.h1),
    checkH2(seo.h2),
    checkImages(seo.images),
    checkCanonical(seo.canonical),
    checkRobots(seo.robots),
    checkViewport(seo.viewport),
    checkLang(seo.lang),
    checkStructuredData(seo.structuredData),
    checkRobotsTxt(technicalSeo.robotsTxt),
    checkSitemap(technicalSeo.sitemap),
    checkStructuredDataValidity(seo.structuredData),
    checkLocalBusinessSchema(seo.structuredData, localSeoRelevant),
    checkLocalBusinessName(seo.structuredData.localBusiness),
    checkLocalBusinessAddress(seo.structuredData.localBusiness, localSeoRelevant),
    checkLocalBusinessPhone(seo.structuredData.localBusiness, localSeoRelevant),
    checkLocalBusinessOpeningHours(seo.structuredData.localBusiness),
    checkOrganizationContactHours(seo.structuredData),
    checkPageSpeedPerformance(pageSpeed),
    checkLighthouseSeo(pageSpeed),
    checkVisiblePhone(contentSignals, localSeoRelevant),
    checkVisibleAddress(contentSignals, localSeoRelevant),
    checkVisibleLocality(contentSignals),
    checkLocalBusinessPhoneConsistency(contentSignals),
    checkLocalBusinessAddressConsistency(contentSignals),
  ];

  return checks.filter(Boolean);
}

module.exports = { buildSeoChecks };
