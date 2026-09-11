const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middleware/authMiddleware');
const { registerUser, loginUser, getMe, getAllUsers } = require('../controllers/authController');

// Sirf admin naya user register kar sake (production mein)
router.post('/register', verifyToken, checkRole('admin'), registerUser);
router.get('/users', verifyToken, checkRole('admin'), getAllUsers);
router.post('/login', loginUser);
router.get('/me', verifyToken, getMe);

module.exports = router;