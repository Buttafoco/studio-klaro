// Datumlogik för GSC-synken. Alla datum är UTC-datum som YYYY-MM-DD-strängar.
//
// Googles sökdata är försenad: de senaste dagarna är preliminära. Vi hämtar bara
// dataState "final" och slutar därför SYNC_LAG_DAYS dagar före idag. Ett rullande
// fönster hämtas om varje dag så att sena justeringar rättas utan manuellt arbete.

const SYNC_LAG_DAYS = 3;
const LOOKBACK_DAYS = 7; // fönstret är LOOKBACK_DAYS + 1 dagar (inkl. slutdagen)
const MAX_BACKFILL_DAYS = 31;
const MAX_HISTORY_DAYS = 480; // Search Console sparar ca 16 månader

const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;

class RangeError_ extends Error {
  constructor(message) {
    super(message);
    this.name = "InvalidRangeError";
    this.code = "invalid_range";
  }
}

function isIsoDate(value) {
  if (typeof value !== "string" || !ISO_RE.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

function toIso(date) {
  return date.toISOString().slice(0, 10);
}

function addDays(iso, days) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return toIso(d);
}

function diffDays(a, b) {
  return Math.round((new Date(`${a}T00:00:00Z`) - new Date(`${b}T00:00:00Z`)) / 86400000);
}

function today(now = new Date()) {
  return toIso(now);
}

function latestFinalDate(now = new Date()) {
  return addDays(today(now), -SYNC_LAG_DAYS);
}

function dailyWindow(now = new Date()) {
  const end = latestFinalDate(now);
  return { start: addDays(end, -LOOKBACK_DAYS), end };
}

function eachDay(start, end) {
  const days = [];
  for (let d = start; d <= end; d = addDays(d, 1)) days.push(d);
  return days;
}

// Validerar ett manuellt (backfill-)intervall. Kastar InvalidRangeError.
function validateBackfillRange(from, to, now = new Date()) {
  if (!isIsoDate(from) || !isIsoDate(to)) {
    throw new RangeError_("from och to måste vara datum i formatet YYYY-MM-DD.");
  }
  if (from > to) throw new RangeError_("from måste vara före eller lika med to.");
  const latest = latestFinalDate(now);
  if (to > latest) {
    throw new RangeError_(`to får högst vara ${latest} (Googles data är inte slutgiltig senare).`);
  }
  if (diffDays(to, from) + 1 > MAX_BACKFILL_DAYS) {
    throw new RangeError_(`Högst ${MAX_BACKFILL_DAYS} dagar per anrop.`);
  }
  if (diffDays(today(now), from) > MAX_HISTORY_DAYS) {
    throw new RangeError_("from ligger utanför Search Consoles historik (ca 16 månader).");
  }
  return { start: from, end: to };
}

module.exports = {
  SYNC_LAG_DAYS,
  LOOKBACK_DAYS,
  MAX_BACKFILL_DAYS,
  MAX_HISTORY_DAYS,
  InvalidRangeError: RangeError_,
  isIsoDate,
  addDays,
  diffDays,
  today,
  latestFinalDate,
  dailyWindow,
  eachDay,
  validateBackfillRange,
};
