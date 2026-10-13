// Anslutning till Studio Klaro Analytics via Supabase-pooler som rollen
// analytics_writer. Funktionen vägrar annan roll eller annat projekt, så att
// en felaktigt inklistrad anslutningssträng (t.ex. postgres-rollen eller ett
// annat Supabase-projekt som Klaro OS eller Galleri 86) aldrig används.

const { Pool } = require("pg");

const EXPECTED_PROJECT_REF = "fqvptjqqcemjcwyonikj";
const EXPECTED_ROLE = "analytics_writer";

class DbConfigError extends Error {
  constructor(message) {
    super(message);
    this.name = "DbConfigError";
    this.code = "db_not_configured";
  }
}

function parseDatabaseUrl(raw) {
  let url;
  try {
    url = new URL(raw);
  } catch (_) {
    throw new DbConfigError("ANALYTICS_DATABASE_URL är inte en giltig URL.");
  }
  if (url.protocol !== "postgres:" && url.protocol !== "postgresql:") {
    throw new DbConfigError("ANALYTICS_DATABASE_URL måste börja med postgresql://");
  }
  const user = decodeURIComponent(url.username);
  const host = url.hostname;
  const [role, ref] = user.split(".");
  if (role !== EXPECTED_ROLE) {
    throw new DbConfigError(`Anslutningen måste använda rollen ${EXPECTED_ROLE}.`);
  }
  const pooler = host.endsWith(".pooler.supabase.com") && ref === EXPECTED_PROJECT_REF;
  const direct = host === `db.${EXPECTED_PROJECT_REF}.supabase.co` && ref === undefined;
  if (!pooler && !direct) {
    throw new DbConfigError("Anslutningen pekar inte på projektet Studio Klaro Analytics.");
  }
  if (!url.password) throw new DbConfigError("Lösenord saknas i ANALYTICS_DATABASE_URL.");
  return {
    host,
    port: Number(url.port) || 5432,
    user,
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, "") || "postgres",
  };
}

// Supabase rot-CA (PEM). Vercel-variabler sparas ibland med bokstavliga "\n".
function readCa(env) {
  const raw = env.ANALYTICS_DATABASE_CA;
  if (!raw || !raw.trim()) {
    throw new DbConfigError(
      "ANALYTICS_DATABASE_CA saknas. Servercertifikatet måste verifieras; det finns ingen osäker reserv."
    );
  }
  const pem = raw.includes("\\n") ? raw.replace(/\\n/g, "\n") : raw;
  if (!pem.includes("-----BEGIN CERTIFICATE-----")) {
    throw new DbConfigError("ANALYTICS_DATABASE_CA är inte ett PEM-certifikat.");
  }
  return pem;
}

function createPool(env = process.env) {
  if (!env.ANALYTICS_DATABASE_URL) throw new DbConfigError("ANALYTICS_DATABASE_URL saknas.");
  const cfg = parseDatabaseUrl(env.ANALYTICS_DATABASE_URL);
  // TLS med fullständig verifiering (kedja + värdnamn) är alltid på. Saknas CA eller
  // går verifieringen fel avbryts anslutningen; den faller aldrig tillbaka tyst.
  const ssl = { ca: readCa(env), rejectUnauthorized: true };
  return new Pool({
    ...cfg,
    ssl,
    max: 2,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 5000,
    application_name: "studio-klaro-gsc-sync",
  });
}

module.exports = { createPool, parseDatabaseUrl, DbConfigError, EXPECTED_PROJECT_REF, EXPECTED_ROLE };
