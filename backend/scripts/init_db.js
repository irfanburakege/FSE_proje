const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db.js');

async function runSqlFile(filePath) {
  const absolutePath = path.resolve(__dirname, '../../', filePath);
  console.log(`Executing ${filePath}...`);
  try {
    const sql = fs.readFileSync(absolutePath, 'utf8');
    await pool.query(sql);
    console.log(`Successfully executed ${filePath}`);
  } catch (err) {
    console.error(`Error executing ${filePath}:`, err);
    throw err;
  }
}

async function initDB() {
  try {
    console.log('Connecting to database...');
    // Order matters
    await runSqlFile('schema_setup.sql');
    await runSqlFile('constraints.sql');
    await runSqlFile('triggers_and_automation.sql');
    await runSqlFile('view_and_dashboards.sql');
    await runSqlFile('seed_data.sql');
    console.log('Database initialization completed successfully.');
  } catch (err) {
    console.error('Database initialization failed:', err);
  } finally {
    pool.end();
  }
}

initDB();