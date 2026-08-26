const LOCAL_BUSINESS_TYPE = "LocalBusiness";
const MAX_LOCAL_BUSINESS_ENTITIES = 20;

// V1 list of common Schema.org LocalBusiness subtypes used to recognize
// local-business entities beyond the exact "LocalBusiness" type. This is
// NOT a complete mirror of the Schema.org type hierarchy — it's a
// pragmatic set covering common industries, and can be extended later.
const KNOWN_LOCAL_BUSINESS_SUBTYPES = new Set([
  "HairSalon",
  "BeautySalon",
  "TattooParlor",
  "NailSalon",
  "DaySpa",
  "Restaurant",
  "CafeOrCoffeeShop",
  "BarOrPub",
  "Bakery",
  "FoodEstablishment",
  "Store",
  "GroceryStore",
  "ClothingStore",
  "FurnitureStore",
  "Florist",
  "HealthAndBeautyBusiness",
  "HomeAndConstructionBusiness",
  "Electrician",
  "Plumber",
  "Locksmith",
  "RoofingContractor",
  "HVACBusiness",
  "MovingCompany",
  "GeneralContractor",
  "LegalService",
  "AccountingService",
  "FinancialService",
  "InsuranceAgency",
  "RealEstateAgent",
  "ProfessionalService",
  "AutomotiveBusiness",
  "AutoRepair",
  "Dentist",
  "Physician",
  "MedicalBusiness",
  "VeterinaryCare",
  "Hotel",
  "LodgingBusiness",
  "GymAndFitnessCenter",
  "SportsActivityLocation",
  "TravelAgency",
  "EntertainmentBusiness",
  "ChildCare",
  "DryCleaningOrLaundry",
]);

function toArray(value) {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

function normalizeTypes(node) {
  return toArray(node && node["@type"])
    .filter((t) => typeof t === "string")
    .map((t) => t.trim())
    .filter(Boolean);
}

function isLocalBusinessType(type) {
  return type === LOCAL_BUSINESS_TYPE || KNOWN_LOCAL_BUSINESS_SUBTYPES.has(type);
}

// Walks a parsed JSON-LD value (object, array, or @graph wrapper) and
// collects every node that carries an @type, regardless of nesting shape.
function collectNodes(value, nodes = []) {
  if (Array.isArray(value)) {
    value.forEach((item) => collectNodes(item, nodes));
    return nodes;
  }

  if (value && typeof value === "object") {
    if (Array.isArray(value["@graph"])) {
      value["@graph"].forEach((item) => collectNodes(item, nodes));
    }
    if (value["@type"] !== undefined) {
      nodes.push(value);
    }
  }

  return nodes;
}

function findJsonLdScripts($) {
  const scripts = [];
  $("script").each((_, el) => {
    const type = ($(el).attr("type") || "").trim().toLowerCase();
    if (type === "application/ld+json") {
      scripts.push($(el).text());
    }
  });
  return scripts;
}

function pickString(obj, key) {
  return obj && typeof obj[key] === "string" ? obj[key].trim() : "";
}

function normalizeAddress(rawAddress) {
  const address = Array.isArray(rawAddress) ? rawAddress[0] : rawAddress;
  if (!address || typeof address !== "object") {
    return { streetAddress: "", addressLocality: "", addressRegion: "", postalCode: "", addressCountry: "" };
  }
  return {
    streetAddress: pickString(address, "streetAddress"),
    addressLocality: pickString(address, "addressLocality"),
    addressRegion: pickString(address, "addressRegion"),
    postalCode: pickString(address, "postalCode"),
    addressCountry: pickString(address, "addressCountry"),
  };
}

// A ContactPoint's hoursAvailable is only a meaningful "contact hours"
// signal when it names a day and gives real opens/closes times — an empty
// or malformed OpeningHoursSpecification shouldn't count.
function isValidOpeningHoursSpec(spec) {
  if (!spec || typeof spec !== "object") return false;
  const types = normalizeTypes(spec);
  if (types.length > 0 && !types.includes("OpeningHoursSpecification")) return false;
  return Boolean(spec.dayOfWeek) && typeof spec.opens === "string" && typeof spec.closes === "string";
}

function organizationHasContactHours(node) {
  return toArray(node.contactPoint).some((cp) => {
    if (!cp || typeof cp !== "object") return false;
    return toArray(cp.hoursAvailable).some(isValidOpeningHoursSpec);
  });
}

function extractLocalBusinessEntity(node) {
  const hasOpeningHours = Boolean(node.openingHours) || Boolean(node.openingHoursSpecification);
  const image = node.image;
  const hasImage = Array.isArray(image) ? image.length > 0 : Boolean(image);

  return {
    types: normalizeTypes(node),
    name: pickString(node, "name"),
    url: pickString(node, "url"),
    telephone: pickString(node, "telephone"),
    email: pickString(node, "email"),
    address: normalizeAddress(node.address),
    hasOpeningHours,
    priceRange: pickString(node, "priceRange"),
    hasImage,
    hasLogo: Boolean(node.logo),
  };
}

// JSON-LD may appear as a single object, an array of objects, or an
// object using @graph — this reads every <script type="application/ld+json">
// block, tolerates broken JSON without throwing, and normalizes @type
// (string or array) so callers don't need to care about the source shape.
function analyzeStructuredData($) {
  const rawScripts = findJsonLdScripts($);
  const jsonLdCount = rawScripts.length;

  let validJsonLdCount = 0;
  let invalidJsonLdCount = 0;
  const allNodes = [];

  for (const raw of rawScripts) {
    try {
      const parsed = JSON.parse(raw); // never eval — untrusted page content
      validJsonLdCount += 1;
      collectNodes(parsed, allNodes);
    } catch {
      invalidJsonLdCount += 1;
    }
  }

  const typesSet = new Set();
  allNodes.forEach((node) => normalizeTypes(node).forEach((t) => typesSet.add(t)));

  const organizationNodes = allNodes.filter((node) => normalizeTypes(node).includes("Organization"));

  const localBusinessNodes = allNodes.filter((node) => normalizeTypes(node).some(isLocalBusinessType));
  const localBusinessTypesSet = new Set();
  localBusinessNodes.forEach((node) => normalizeTypes(node).forEach((t) => localBusinessTypesSet.add(t)));

  return {
    jsonLdCount,
    validJsonLdCount,
    invalidJsonLdCount,
    types: Array.from(typesSet),
    organization: {
      detected: organizationNodes.length > 0,
      count: organizationNodes.length,
      // Organization → ContactPoint → hoursAvailable: the correct way for a
      // service company without a public physical location to declare
      // contact hours (as opposed to LocalBusiness openingHours, which
      // implies a physical premise customers can visit).
      hasContactHours: organizationNodes.some(organizationHasContactHours),
    },
    localBusiness: {
      detected: localBusinessNodes.length > 0,
      count: localBusinessNodes.length,
      types: Array.from(localBusinessTypesSet),
      entities: localBusinessNodes.slice(0, MAX_LOCAL_BUSINESS_ENTITIES).map(extractLocalBusinessEntity),
    },
  };
}

module.exports = { analyzeStructuredData };
