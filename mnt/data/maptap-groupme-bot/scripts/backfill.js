const config = require('../src/config');
const { runBackfill } = require('../src/index');

async function main() {
  try {
    config.requireRuntimeConfig();
    console.log('Starting GroupMe history backfill...');
    const result = await runBackfill();
    console.log('Backfill complete.');
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
  } catch (error) {
    console.error('Backfill failed:', error);
    process.exit(1);
  }
}

main();
