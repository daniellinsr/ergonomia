require('dotenv').config();
const bcrypt = require('bcrypt');
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function resetPassword() {
  try {
    const email = 'daniellinsr@gmail.com'; // Altere aqui se necessário
    const novaSenha = 'Admin@123'; // Altere para a senha que você quer

    console.log('🔄 Redefinindo senha...\n');

    // Gerar novo hash
    const novoHash = await bcrypt.hash(novaSenha, 10);
    console.log('✅ Novo hash gerado:', novoHash.substring(0, 30) + '...\n');

    // Atualizar no banco
    const result = await pool.query(
      'UPDATE usuarios SET senha_hash = $1 WHERE email = $2 RETURNING id, nome, email',
      [novoHash, email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      console.log('❌ Usuário não encontrado!\n');
    } else {
      console.log('✅ Senha atualizada com sucesso!');
      console.log('📋 Usuário:', result.rows[0].nome);
      console.log('📧 Email:', result.rows[0].email);
      console.log('🔑 Nova senha:', novaSenha);
      console.log('\n🎉 Agora você pode fazer login!\n');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

resetPassword();