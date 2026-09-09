require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const caseRoutes = require('./routes/caseRoutes');

connectDB();

const app = express();
app.use(cors({
  origin: ['http://localhost:5173', 'https://visit-track-woad.vercel.app'],
  credentials: true,
}));app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/cases', caseRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));