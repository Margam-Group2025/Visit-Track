const express = require('express');
const router = express.Router();
const { createCase, getCases } = require('../controllers/caseController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

router.post('/', verifyToken, checkRole('sto'), upload.array('files', 5), createCase);
router.get('/', verifyToken, getCases);

module.exports = router;