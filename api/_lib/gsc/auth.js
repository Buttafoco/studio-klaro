// Workload Identity Federation utan långlivade nycklar:
//   1. Vercels OIDC-token (kortlivad, signerad av Vercel) växlas hos Google STS
//      mot en federerad token.
//   2. Den federerade tokenen används för att låna servicekontots identitet och
//      få en access-token med enbart scopet webmasters.readonly (10 min).
// Ingen Google-SDK behövs; det är två HTTPS-anrop.

const STS_URL = "https://sts.googleapis.com/v1/token";
const SCOPE_READONLY = "https://www.googleapis.com/auth/webmasters.readonly";

class GoogleAuthError extends Error {
  constructor(message, code) {
    super(message);
    this.name = "GoogleAuthError";
    this.code = code || "google_auth_failed";
  }
}

function requireEnv(env, names) {
  const missing = names.filter((n) => !env[n]);
  if (missing.length) {
    throw new GoogleAuthError(`Saknade miljövariabler: ${missing.join(", ")}`, "not_configured");
  }
}

// Funktionens OIDC-token ligger i headern x-vercel-oidc-token. VERCEL_OIDC_TOKEN
// används bara som reserv (t.ex. lokal körning efter `vercel env pull`).
function getOidcToken(req, env) {
  const header = req && req.headers && req.headers["x-vercel-oidc-token"];
  const token = (Array.isArray(header) ? header[0] : header) || env.VERCEL_OIDC_TOKEN;
  if (!token) {
    throw new GoogleAuthError(
      "Ingen Vercel OIDC-token tillgänglig. Kontrollera att OIDC federation är aktiverat i projektet.",
      "no_oidc_token"
    );
  }
  return token;
}

async function postJson(fetchImpl, url, body, headers = {}) {
  let res;
  try {
    res = await fetchImpl(url, {
      method: "POST",
      headers: { "content-type": "application/json", ...headers },
      body: JSON.stringify(body),
    });
  } catch (err) {
    throw new GoogleAuthError(`Nätverksfel mot Google (${new URL(url).host}).`, "network_error");
  }
  let data = null;
  try {
    data = await res.json();
  } catch (_) {
    /* ignorera, hanteras nedan */
  }
  if (!res.ok) {
    // Bara statuskod och Googles felkod loggas, aldrig tokens eller hela svaret.
    const reason = (data && (data.error_description || data.error?.message || data.error)) || "okänt fel";
    throw new GoogleAuthError(
      `Google svarade ${res.status} från ${new URL(url).host}: ${String(reason).slice(0, 200)}`
    );
  }
  return data;
}

async function getAccessToken({ oidcToken, env = process.env, fetchImpl = fetch }) {
  requireEnv(env, [
    "GCP_PROJECT_NUMBER",
    "GCP_WORKLOAD_IDENTITY_POOL_ID",
    "GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID",
    "GCP_SERVICE_ACCOUNT_EMAIL",
  ]);

  const audience =
    `//iam.googleapis.com/projects/${env.GCP_PROJECT_NUMBER}` +
    `/locations/global/workloadIdentityPools/${env.GCP_WORKLOAD_IDENTITY_POOL_ID}` +
    `/providers/${env.GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID}`;

  const sts = await postJson(fetchImpl, STS_URL, {
    grantType: "urn:ietf:params:oauth:grant-type:token-exchange",
    audience,
    scope: "https://www.googleapis.com/auth/cloud-platform",
    requestedTokenType: "urn:ietf:params:oauth:token-type:access_token",
    subjectToken: oidcToken,
    subjectTokenType: "urn:ietf:params:oauth:token-type:jwt",
  });
  if (!sts || typeof sts.access_token !== "string") {
    throw new GoogleAuthError("STS returnerade ingen access_token.");
  }

  const impersonation =
    `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/` +
    `${encodeURIComponent(env.GCP_SERVICE_ACCOUNT_EMAIL)}:generateAccessToken`;
  const sa = await postJson(
    fetchImpl,
    impersonation,
    { scope: [SCOPE_READONLY], lifetime: "600s" },
    { authorization: `Bearer ${sts.access_token}` }
  );
  if (!sa || typeof sa.accessToken !== "string") {
    throw new GoogleAuthError("generateAccessToken returnerade ingen accessToken.");
  }
  return sa.accessToken;
}

module.exports = { GoogleAuthError, getOidcToken, getAccessToken, SCOPE_READONLY };
