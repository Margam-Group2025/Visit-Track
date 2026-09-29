const express = require('express');
const router = express.Router();
const {
  createLead, getMyLeads, getAllLeads, getStoUsers, assignLead, getMyAssignedLeads,updateLead
} = require('../controllers/leadController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

router.post('/', verifyToken, checkRole('crm'), createLead);
router.get('/', verifyToken, checkRole('crm'), getMyLeads);
router.get('/all', verifyToken, checkRole('admin'), getAllLeads);
router.get('/sto-users', verifyToken, checkRole('crm'), getStoUsers);
router.get('/assigned-to-me', verifyToken, checkRole('sto'), getMyAssignedLeads);
router.put('/:id/assign', verifyToken, checkRole('crm'), assignLead);
router.put('/:id', verifyToken, checkRole('crm'), updateLead);

module.exports = router;