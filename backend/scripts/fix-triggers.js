const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function fixTriggers() {
  try {
    console.log('Conectando ao banco de dados...');

    // Verificar se a coluna atualizado_em existe
    const checkColumn = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'usuarios' AND column_name = 'atualizado_em'
    `);

    if (checkColumn.rows.length === 0) {
      console.log('Coluna atualizado_em não existe. Verificando coluna updated_at...');

      const checkUpdatedAt = await pool.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'usuarios' AND column_name = 'updated_at'
      `);

      if (checkUpdatedAt.rows.length > 0) {
        console.log('Coluna found: updated_at');
        console.log('Recriando função e trigger para usar updated_at...');

        // Dropar triggers existentes
        await pool.query(`
          DROP TRIGGER IF EXISTS update_usuarios_updated_at ON usuarios;
          DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
        `);

        // Criar função corrigida
        await pool.query(`
          CREATE OR REPLACE FUNCTION update_updated_at_column()
          RETURNS TRIGGER AS $$
          BEGIN
            NEW.updated_at = CURRENT_TIMESTAMP;
            RETURN NEW;
          END;
          $$ language 'plpgsql';
        `);

        // Criar trigger
        await pool.query(`
          CREATE TRIGGER update_usuarios_updated_at
          BEFORE UPDATE ON usuarios
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
        `);

        console.log('✅ Trigger corrigido com sucesso!');
      } else {
        console.log('Nenhuma coluna de timestamp encontrada. Adicionando updated_at...');

        await pool.query(`
          ALTER TABLE usuarios
          ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        `);

        // Criar função e trigger
        await pool.query(`
          CREATE OR REPLACE FUNCTION update_updated_at_column()
          RETURNS TRIGGER AS $$
          BEGIN
            NEW.updated_at = CURRENT_TIMESTAMP;
            RETURN NEW;
          END;
          $$ language 'plpgsql';
        `);

        await pool.query(`
          CREATE TRIGGER update_usuarios_updated_at
          BEFORE UPDATE ON usuarios
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
        `);

        console.log('✅ Coluna e trigger criados com sucesso!');
      }
    } else {
      console.log('Coluna atualizado_em existe. Verificando trigger...');
      // Recriar trigger para usar atualizado_em
      await pool.query(`
        DROP TRIGGER IF EXISTS update_usuarios_updated_at ON usuarios;
        DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
      `);

      await pool.query(`
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.atualizado_em = CURRENT_TIMESTAMP;
          RETURN NEW;
        END;
        $$ language 'plpgsql';
      `);

      await pool.query(`
        CREATE TRIGGER update_usuarios_updated_at
        BEFORE UPDATE ON usuarios
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
      `);

      console.log('✅ Trigger recriado com sucesso!');
    }

  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

fixTriggers();
