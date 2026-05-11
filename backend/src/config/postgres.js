const { Pool } = require("pg");
const env = require("./env");

const pool = new Pool({
  host: env.postgres.host,
  port: env.postgres.port,
  user: env.postgres.user,
  password: env.postgres.password,
  database: env.postgres.database,
  max: env.postgres.max,
  idleTimeoutMillis: env.postgres.idleTimeoutMillis,
});

pool.on("error", (error) => {
  console.error("[postgres] Unexpected idle client error:", error.message);
});

async function query(text, params = []) {
  return pool.query(text, params);
}

async function close() {
  await pool.end();
}

module.exports = {
  pool,
  query,
  close,
};
