// Studio Klaro SEO Health v2 heuristic — NOT a complete business
// classifier. This decides whether a page should be scored as if it
// represents a local/physical business, so that local-SEO checks (missing
// LocalBusiness schema, missing visible address/phone, ...) only affect
// the score when they're actually relevant to the site being audited.
//
// A page counts as "local SEO relevant" when EITHER:
//   (a) its structured data uses a schema.org type that unambiguously
//       implies a local/physical business (a hair salon, a plumber, a
//       restaurant, ...), or
//   (b) the page's visible content clearly shows BOTH a physical address
//       AND a phone number — a strong combined signal even with zero
//       structured data (this is what makes a site like a barber shop
//       with no JSON-LD at all still count).
//
// A lone ambiguous/generic commerce type (OnlineStore, Store,
// FurnitureStore, GroceryStore, Bakery, ...) never counts by itself —
// those types are used by large, non-local e-commerce brands just as
// often as by a small local shop, so schema type alone isn't a strong
// enough signal. If a site with one of those ambiguous types ALSO shows
// a clear visible address + phone, it still qualifies — but via signal
// (b) above, not because of the ambiguous type itself.
const STRONG_LOCAL_TYPES = new Set([
  "LocalBusiness",
  "HairSalon",
  "BeautySalon",
  "NailSalon",
  "DaySpa",
  "TattooParlor",
  "Restaurant",
  "CafeOrCoffeeShop",
  "BarOrPub",
  "ProfessionalService",
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

function hasStrongLocalStructuredDataType(seo) {
  const types = (seo && seo.structuredData && seo.structuredData.localBusiness && seo.structuredData.localBusiness.types) || [];
  return types.some((type) => STRONG_LOCAL_TYPES.has(type));
}

function hasStrongVisibleLocalSignals(contentSignals) {
  const hasAddress = Boolean(contentSignals && contentSignals.address && contentSignals.address.detected);
  const hasPhone = Boolean(contentSignals && contentSignals.phone && contentSignals.phone.detected);
  return hasAddress && hasPhone;
}

function determineLocalSeoRelevance(seo, contentSignals) {
  return hasStrongLocalStructuredDataType(seo) || hasStrongVisibleLocalSignals(contentSignals);
}

module.exports = { determineLocalSeoRelevance };
