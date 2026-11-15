const express = require('express');
const router = express.Router();
const {
  createCase,
  getCases,
  getTechnicalPendingCases,
  getCaseById,
  submitTechnicalReview,
  getOperationPendingCases,
  submitOperationReview,
  getAdminPendingCases,
  getAllCasesForAdmin,
  getCrmUsers,
  adminApproveAndAssign,
  getCrmAssignedCases,
  getMyCases,
  markCaseCompleted,
  updateMyStageData,
  markCaseViewed,
  getTechnicalUsers,
  crmSubmitCompletion,
  getAccountsPendingCases,
  uploadInvoice,
  reassignTechnical,
} = require('../controllers/caseController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

router.post('/', verifyToken, checkRole('sto'), upload.array('files', 5), createCase);
router.get('/', verifyToken, getCases);
router.get('/my-cases', verifyToken, getMyCases);
router.get('/technical-pending', verifyToken, checkRole('technical'), getTechnicalPendingCases);
router.get('/operation-pending', verifyToken, checkRole('operation'), getOperationPendingCases);
router.get('/admin-pending', verifyToken, checkRole('admin'), getAdminPendingCases);
router.get('/crm-assigned', verifyToken, checkRole('crm'), getCrmAssignedCases);
router.get('/all', verifyToken, checkRole('admin'), getAllCasesForAdmin);
router.get('/crm-users', verifyToken, checkRole('admin'), getCrmUsers);
router.get('/technical-users', verifyToken, checkRole('sto'), getTechnicalUsers);
router.get('/accounts-pending', verifyToken, checkRole('accountant'), getAccountsPendingCases);
router.get('/:id', verifyToken, getCaseById);
router.put(
  '/:id/technical-review',
  verifyToken,
  checkRole('technical'),
  upload.array('files', 5),
  submitTechnicalReview
);
router.put(
  '/:id/operation-review',
  verifyToken,
  checkRole('operation'),
  upload.fields([
    { name: 'quotationFile', maxCount: 1 },
    { name: 'files', maxCount: 5 },
  ]),
  submitOperationReview
);
router.put('/:id/admin-approve', verifyToken, checkRole('admin'), adminApproveAndAssign);
router.put('/:id/complete', verifyToken, checkRole('admin'), markCaseCompleted);
router.put('/:id/edit-my-data', verifyToken, updateMyStageData);
router.put('/:id/mark-viewed', verifyToken, markCaseViewed);
router.put('/:id/crm-complete', verifyToken, checkRole('crm'), crmSubmitCompletion);
router.get('/accounts-pending', verifyToken, checkRole('accountant'), getAccountsPendingCases);
router.post('/:id/upload-invoice', verifyToken, checkRole('accountant'), upload.single('invoiceFile'), uploadInvoice);
router.put('/:id/reassign-technical', verifyToken, checkRole('sto'), reassignTechnical);
module.exports = router;