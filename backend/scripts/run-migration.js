const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function runMigration() {
  try {
    console.log('Conectando ao banco de dados...');

    const migrationFile = path.join(__dirname, '..', 'migrations', '003_remover_trabalhadores.sql');
    const sql = fs.readFileSync(migrationFile, 'utf8');

    console.log('Executando migração 003_remover_trabalhadores.sql...');
    await pool.query(sql);

    console.log('✅ Migração executada com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao executar migração:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
