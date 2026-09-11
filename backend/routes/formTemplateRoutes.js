const express = require('express');
const router = express.Router();
const { getTemplate, getAllTemplates, upsertTemplate } = require('../controllers/formTemplateController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

router.get('/', verifyToken, checkRole('admin'), getAllTemplates);
router.get('/:department', verifyToken, getTemplate);
router.put('/:department', verifyToken, checkRole('admin'), upsertTemplate);

module.exports = router;