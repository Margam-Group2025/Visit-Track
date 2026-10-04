const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getMe,
  getAllUsers,
  changePassword,
  forgotPassword,
  resetPassword,
  updateUser,
  toggleUserActive,
} = require('../controllers/authController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

router.post('/register', verifyToken, checkRole('admin'), registerUser);
router.post('/login', loginUser);
router.get('/me', verifyToken, getMe);
router.get('/users', verifyToken, checkRole('admin'), getAllUsers);
router.put('/users/:id', verifyToken, checkRole('admin'), updateUser);
router.put('/users/:id/toggle-active', verifyToken, checkRole('admin'), toggleUserActive);
router.put('/change-password', verifyToken, changePassword);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

module.exports = router;