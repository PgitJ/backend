// backend/server.js - CÓDIGO FINAL CORRIGIDO PARA POSTGRESQL E RENDER

const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid'); // Biblioteca para IDs
const db = require('./db');
const authRouter = require('./auth');
const authenticateToken = require('./middleware/auth');

const app = express();
// Usa a porta fornecida pelo Render (essencial para deploy)
const PORT = process.env.PORT || 5000; 

// --- CONFIGURAÇÃO ---
app.use(cors({
    origin: '*', // Permite qualquer origem (para Vercel/localhost/Ngrok)
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
}));
app.use(express.json());

// Monta o router de autenticação
app.use('/auth', authRouter);

// --- Rotas da API para Categorias ---
app.get('/api/categories', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const result = await db.query('SELECT * FROM categories WHERE user_id = $1 ORDER BY name', [userId]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/categories', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { name } = req.body;
        // CORREÇÃO: Gerar ID para a categoria
        const categoryId = uuidv4();
        
        const result = await db.query(
            'INSERT INTO categories (id, name, user_id) VALUES ($1, $2, $3) RETURNING *',
            [categoryId, name, userId]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        // Trata erro de categoria duplicada (Código SQL '23505' para UNIQUE constraint)
        if (err.code === '23505') {
            return res.status(409).json({ error: 'Categoria já existe.' });
        }
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/categories/:name', authenticateToken, async (req, res) => {
    // Nota: Essa rota está deletando pelo nome. Se você tiver certeza que o name é único, está ok.
    try {
        const userId = req.user.userId;
        const { name } = req.params;
        // CORREÇÃO: Deleta usando o nome, se o front enviar o ID, use req.params.id
        const result = await db.query('DELETE FROM categories WHERE name = $1 AND user_id = $2 RETURNING *', [name, userId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Categoria não encontrada' });
        }
        res.json({ message: 'Categoria deletada com sucesso' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Rotas da API para Transações ---
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
        
        // CORREÇÃO: Geração obrigatória do ID para o PostgreSQL
        const transactionId = uuidv4(); 

        const result = await db.query(
            'INSERT INTO transactions (id, user_id, description, amount, date, type, category) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [
                transactionId, // Passa o ID gerado
                userId,
                description,
                amount,
                date,
                type,
                category,
            ]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Falha ao criar a transação.' });
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
        // CORREÇÃO: Geração obrigatória do ID para o PostgreSQL
        const goalId = uuidv4(); 

        const result = await db.query(
            'INSERT INTO goals (id, name, amount, saved, target_date, user_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [goalId, name, amount, saved, target_date, userId] // Passa o ID gerado
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
        // CORREÇÃO: Geração obrigatória do ID para o PostgreSQL
        const billId = uuidv4();

        const result = await db.query(
            'INSERT INTO bills (id, description, amount, due_date, paid, user_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [billId, description, amount, due_date, paid, userId] // Passa o ID gerado
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