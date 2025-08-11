const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./db');

const router = express.Router();
const SECRET_KEY = process.env.SECRET_KEY;

router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username e senha são obrigatórios.' });
  }

  try {
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    const result = await db.query(
      'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username',
      [username, password_hash]
    );

    res.status(201).json({ 
      message: 'Usuário registrado com sucesso!',
      user: result.rows[0]
    });
  } catch (err) {
    console.error('Erro ao registrar usuário:', err);
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Nome de usuário já existe.' });
    }
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await db.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = result.rows[0];

    if (!user) {
      return res.status(400).json({ error: 'Usuário não encontrado.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Senha incorreta.' });
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      SECRET_KEY,
      { expiresIn: '1h' }
    );

    res.json({ token, message: 'Login bem-sucedido!', username: user.username });
  } catch (err) {
    console.error('Erro no login:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
