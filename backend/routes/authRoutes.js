const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getMe } = require('../controllers/authController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

// Sirf admin naya user register kar sake (production mein)
router.post('/register', verifyToken, checkRole('admin'), registerUser);

router.post('/login', loginUser);
router.get('/me', verifyToken, getMe);

module.exports = router;