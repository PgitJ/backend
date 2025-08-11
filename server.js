const express = require('express');
const cors = require('cors');
const db = require('./db');
const authRouter = require('./auth');
const authenticateToken = require('./middleware/auth');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

app.use('/auth', authRouter);

// Adiciona o middleware a todas as rotas que precisam de autenticação
app.get('/api/transactions', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const result = await db.query('SELECT * FROM transactions WHERE user_id = $1 ORDER BY date DESC', [userId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/transactions', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { date, description, category, type, amount } = req.body;
    const result = await db.query(
      'INSERT INTO transactions (date, description, category, type, amount, user_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [date, description, category, type, amount, userId]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/transactions/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { date, description, category, type, amount } = req.body;
    const result = await db.query(
      'UPDATE transactions SET date = $1, description = $2, category = $3, type = $4, amount = $5 WHERE id = $6 AND user_id = $7 RETURNING *',
      [date, description, category, type, amount, id, userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transação não encontrada' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/transactions/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const result = await db.query('DELETE FROM transactions WHERE id = $1 AND user_id = $2 RETURNING *', [id, userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transação não encontrada' });
    }
    res.json({ message: 'Transação deletada com sucesso' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// --- Rotas da API para Metas ---
app.get('/api/goals', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const result = await db.query('SELECT * FROM goals WHERE user_id = $1 ORDER BY id', [userId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/goals', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, amount, saved, target_date } = req.body;
    const result = await db.query(
      'INSERT INTO goals (name, amount, saved, target_date, user_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, amount, saved, target_date, userId]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/goals/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { name, amount, saved, target_date } = req.body;
    const result = await db.query(
      'UPDATE goals SET name = $1, amount = $2, saved = $3, target_date = $4 WHERE id = $5 AND user_id = $6 RETURNING *',
      [name, amount, saved, target_date, id, userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Meta não encontrada' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/goals/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const result = await db.query('DELETE FROM goals WHERE id = $1 AND user_id = $2 RETURNING *', [id, userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Meta não encontrada' });
    }
    res.json({ message: 'Meta deletada com sucesso' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// --- Rotas da API para Contas a Pagar ---
app.get('/api/bills', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const result = await db.query('SELECT * FROM bills WHERE user_id = $1 ORDER BY due_date ASC', [userId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/bills', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { description, amount, due_date, paid } = req.body;
    const result = await db.query(
      'INSERT INTO bills (description, amount, due_date, paid, user_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [description, amount, due_date, paid, userId]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/bills/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { description, amount, due_date, paid } = req.body;
    const result = await db.query(
      'UPDATE bills SET description = $1, amount = $2, due_date = $3, paid = $4 WHERE id = $5 AND user_id = $6 RETURNING *',
      [description, amount, due_date, paid, id, userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Conta não encontrada' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/bills/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const result = await db.query('DELETE FROM bills WHERE id = $1 AND user_id = $2 RETURNING *', [id, userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Conta não encontrada' });
    }
    res.json({ message: 'Conta deletada com sucesso' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
