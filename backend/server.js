require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const caseRoutes = require('./routes/caseRoutes');
const formTemplateRoutes = require('./routes/formTemplateRoutes');
const leadRoutes = require('./routes/leadRoutes');
// const { verifyToken, checkRole } = require('./middleware/authMiddleware');
// const sendEmail = require('./utils/sendEmail');
connectDB();

const app = express();
app.use(cors({
  origin: ['http://localhost:5173', 'https://visit-track-woad.vercel.app'],
  credentials: true,
}));
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/cases', caseRoutes);
app.use('/api/form-templates', formTemplateRoutes);
app.use('/api/leads', leadRoutes);
// app.get('/api/test-email', verifyToken, checkRole('admin'), async (req, res) => {
//   const to = req.query.to || req.user.email;
//   const sent = await sendEmail(to, 'SiteFlow test email', 'Agar yeh mail mila toh Resend setup sahi hai.');
//   res.json({ sent, to });
// });
app.get('/api/mail-check', (req, res) => {
  res.json({
    resendKeySet: !!process.env.RESEND_API_KEY,
    emailFrom: process.env.EMAIL_FROM || null,
    mailEventsFile: true,
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));