const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middleware/authMiddleware');
const {
  registerUser,
  loginUser,
  getMe,
  getAllUsers,
  changePassword,
  forgotPassword,
  resetPassword,
} = require('../controllers/authController');
// Sirf admin naya user register kar sake (production mein)
router.post('/register', verifyToken, checkRole('admin'), registerUser);
router.get('/users', verifyToken, checkRole('admin'), getAllUsers);
router.put('/change-password', verifyToken, changePassword);
router.post('/login', loginUser);
router.get('/me', verifyToken, getMe);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

module.exports = router;