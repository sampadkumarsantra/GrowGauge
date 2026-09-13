import EmbeddedPostgres from 'embedded-postgres';

const PORT = Number(process.env.PG_PORT || 5432);
const DB_DIR = process.env.PG_DATA_DIR || '.growgauge-pg';
const DB_NAME = 'growgauge';
const USER = process.env.PG_USER || 'user';
const PASSWORD = process.env.PG_PASSWORD || 'password';

const pg = new EmbeddedPostgres({
  databaseDir: DB_DIR,
  user: USER,
  password: PASSWORD,
  port: PORT,
  authMethod: 'password',
  persistent: true,
});

async function main() {
  await pg.initialise();
  await pg.start();
  await pg.createDatabase(DB_NAME);
  console.log(`[dev-db] Postgres ready on localhost:${PORT} (db=${DB_NAME}, user=${USER})`);
  console.log('[dev-db] Press Ctrl+C to stop.');
}

main().catch((err) => {
  console.error('[dev-db] failed to start:', err);
  process.exit(1);
});

process.on('SIGINT', async () => {
  await pg.stop();
  process.exit(0);
});