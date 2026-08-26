const IMPORTANCE_POINTS = { high: 15, medium: 10, low: 5 };
const STATUS_MULTIPLIER = { pass: 1, warning: 0.5, fail: 0 };

const SCORE_LABEL_RANGES = [
  { min: 90, max: 100, label: "Mycket bra" },
  { min: 75, max: 89, label: "Bra" },
  { min: 50, max: 74, label: "Kan förbättras" },
  { min: 25, max: 49, label: "Svag" },
  { min: 0, max: 24, label: "Kritisk" },
];

const METHOD = "studio-klaro-seo-health-v2";

function getScoreLabel(value) {
  const range = SCORE_LABEL_RANGES.find((r) => value >= r.min && value <= r.max);
  return range ? range.label : "Okänd";
}

function calculateSeoScore(checks) {
  const list = Array.isArray(checks) ? checks : [];

  let earnedPoints = 0;
  let possiblePoints = 0;
  let passedChecks = 0;
  let warningChecks = 0;
  let failedChecks = 0;
  let infoChecks = 0;

  for (const check of list) {
    if (check && check.scoreEligible === false) {
      // Explicitly opted out of scoring (e.g. robots.txt/sitemap checks) —
      // existing checks without this field keep being scored as before.
      continue;
    }

    const status = check && check.status;
    const importance = check && check.importance;

    if (status === "info") {
      infoChecks += 1;
      continue;
    }

    const maxPoints = IMPORTANCE_POINTS[importance];
    const multiplier = STATUS_MULTIPLIER[status];

    // Unknown status/importance: exclude from scoring rather than crash.
    if (maxPoints === undefined || multiplier === undefined) {
      continue;
    }

    possiblePoints += maxPoints;
    earnedPoints += maxPoints * multiplier;

    if (status === "pass") passedChecks += 1;
    else if (status === "warning") warningChecks += 1;
    else if (status === "fail") failedChecks += 1;
  }

  if (possiblePoints === 0) {
    return {
      value: null,
      label: "Ej tillräckligt med data",
      method: METHOD,
      passedChecks,
      warningChecks,
      failedChecks,
      infoChecks,
    };
  }

  const value = Math.round((earnedPoints / possiblePoints) * 100);

  return {
    value,
    label: getScoreLabel(value),
    method: METHOD,
    passedChecks,
    warningChecks,
    failedChecks,
    infoChecks,
  };
}

module.exports = { calculateSeoScore };
