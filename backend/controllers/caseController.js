const Case = require('../models/case');
const user = require('../models/user');
const Lead = require('../models/lead'); 
const logActivity = require('../utils/logActivity');

const createCase = async (req, res) => {
  try {
    const { siteName, siteAddress, data, leadId } = req.body;  
    const parsedData = typeof data === 'string' ? JSON.parse(data) : data;

    const count = await Case.countDocuments();
    const caseNumber = `SV-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const files = (req.files || []).map((f) => ({ fileName: f.originalname, fileUrl: f.path }));

    const newCase = await Case.create({
  caseNumber,
  siteName,
  siteAddress,
  leadId: leadId || null,
  leadCode: null,
  status: 'technical_pending',

  stoForm: {
    submittedBy: req.user._id,
    data: parsedData,
    files,
    submittedAt: new Date(),
  },

  activityLog: [
    {
      action: 'sto_submitted',
      by: req.user._id,
      message: 'STO submitted a new site visit case',
      timestamp: new Date(),
    },
  ],
});
if (leadId) {
  const lead = await Lead.findByIdAndUpdate(leadId, { status: 'visited', caseId: newCase._id, visitedAt: new Date() }, { new: true });
  if (lead) {
    newCase.leadCode = lead.leadId;
    await newCase.save();
  }
}
    // Notify Technical team (existing code)
    const technicalUsers = await User.find({ role: 'technical', isActive: true });
    technicalUsers.forEach((u) => {
      sendEmail(u.email, `New Case Assigned — ${newCase.caseNumber}`,
        `A new site visit case "${newCase.siteName}" has been submitted by STO and needs your technical review.`);
    });

    res.status(201).json(newCase);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/cases  (list — filtered by role later)
const getCases = async (req, res) => {
  try {
    const cases = await Case.find().sort({ createdAt: -1 });
    res.json(cases);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/cases/technical-pending
const getTechnicalPendingCases = async (req, res) => {
  try {
    const cases = await Case.find({ status: 'technical_pending' })
      .populate('stoForm.submittedBy', 'name email')
      .sort({ createdAt: -1 });
    res.json(cases);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/cases/:id
const getCaseById = async (req, res) => {
  try {
    const singleCase = await Case.findById(req.params.id)
      .populate('stoForm.submittedBy', 'name email');
    if (!singleCase) return res.status(404).json({ message: 'Case not found' });
    res.json(singleCase);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/cases/:id/technical-review
const submitTechnicalReview = async (req, res) => {
  try {
    const { data } = req.body;
    const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
    const singleCase = await Case.findById(req.params.id);
    if (!singleCase) return res.status(404).json({ message: 'Case not found' });

    const files = (req.files || []).map((f) => ({ fileName: f.originalname, fileUrl: f.path }));

    singleCase.technicalForm = {
      reviewedBy: req.user._id, approved: true, data: parsedData, files, submittedAt: new Date(),
    };

    logActivity(singleCase, req.user, 'technical_submitted', 'Technical review approved and sent to Operation');
    singleCase.status = 'operation_pending';
    await singleCase.save();
    res.json(singleCase);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/cases/operation-pending
const getOperationPendingCases = async (req, res) => {
  try {
    const cases = await Case.find({ status: 'operation_pending' })
      .populate('stoForm.submittedBy', 'name email')
      .populate('technicalForm.reviewedBy', 'name email')
      .sort({ createdAt: -1 });
    res.json(cases);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/cases/:id/operation-review
const submitOperationReview = async (req, res) => {
  try {
    const { data } = req.body;
    const parsedData = typeof data === 'string' ? JSON.parse(data) : data;

    const singleCase = await Case.findById(req.params.id);
    if (!singleCase) return res.status(404).json({ message: 'Case not found' });

    const quotationFileUpload = req.files?.quotationFile?.[0];
    const generalFiles = (req.files?.files || []).map((f) => ({
      fileName: f.originalname,
      fileUrl: f.path,
    }));

    if (!quotationFileUpload) {
      return res.status(400).json({ message: 'Quotation file is required' });
    }

    singleCase.operationForm = {
      preparedBy: req.user._id,
      data: parsedData,
      quotationFile: {
        fileName: quotationFileUpload.originalname,
        fileUrl: quotationFileUpload.path,
      },
      files: generalFiles,
      submittedAt: new Date(),
    };

    logActivity(singleCase, req.user, 'operation_submitted', 'Operation sent final report and quotation to Admin');
    singleCase.status = 'admin_pending';

    await singleCase.save();
    res.json(singleCase);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/cases/admin-pending
const getAdminPendingCases = async (req, res) => {
  try {
    const cases = await Case.find({ status: 'admin_pending' })
      .populate('stoForm.submittedBy', 'name email')
      .populate('technicalForm.reviewedBy', 'name email')
      .populate('operationForm.preparedBy', 'name email')
      .sort({ createdAt: -1 });
    res.json(cases);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/cases/all  (admin — cases, status)
const getAllCasesForAdmin = async (req, res) => {
  try {
    const cases = await Case.find()
      .populate('stoForm.submittedBy', 'name email')
      .populate('technicalForm.reviewedBy', 'name email')
      .populate('operationForm.preparedBy', 'name email')
      .populate('crmAssignment.assignedTo', 'name email')
      .populate('activityLog.by', 'name')
      .sort({ createdAt: -1 });
    res.json(cases);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/cases/crm-users  (dropdown ke liye CRM users ki list)
const getCrmUsers = async (req, res) => {
  try {
    const crmUsers = await user.find({ role: 'crm', isActive: true }).select('name email');
    res.json(crmUsers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/cases/:id/admin-approve
const adminApproveAndAssign = async (req, res) => {
  try {
    const { remarks, assignedTo, notes } = req.body;
    const singleCase = await Case.findById(req.params.id);
    if (!singleCase) return res.status(404).json({ message: 'Case not found' });

    singleCase.adminApproval = {
      approvedBy: req.user._id,
      approved: true,
      remarks,
      approvedAt: new Date(),
    };

    singleCase.crmAssignment = {
      assignedTo,
      assignedBy: req.user._id,
      assignedAt: new Date(),
      notes,
    };

    logActivity(singleCase, req.user, 'admin_approved', 'Admin approved and assigned to CRM');
    singleCase.status = 'crm_assigned';

    await singleCase.save();
    res.json(singleCase);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/cases/crm-assigned
const getCrmAssignedCases = async (req, res) => {
  try {
    const cases = await Case.find({
      status: 'crm_assigned',
      'crmAssignment.assignedTo': req.user._id,
    })
      .populate('stoForm.submittedBy', 'name email')
      .populate('operationForm.preparedBy', 'name email')
      .populate('activityLog.by', 'name')
      .sort({ createdAt: -1 });
    res.json(cases);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/cases/my-cases  (role ke hisaab se apne cases — history + status sab)
const getMyCases = async (req, res) => {
  try {
    const role = req.user.role;
    let filter = {};

    if (role === 'sto') filter = { 'stoForm.submittedBy': req.user._id };
    else if (role === 'technical') filter = { 'technicalForm.reviewedBy': req.user._id };
    else if (role === 'operation') filter = { 'operationForm.preparedBy': req.user._id };
    else if (role === 'crm') filter = { 'crmAssignment.assignedTo': req.user._id };
    else return res.status(403).json({ message: 'Not applicable for this role' });

    const cases = await Case.find(filter)
      .populate('stoForm.submittedBy', 'name')
      .populate('technicalForm.reviewedBy', 'name')
      .populate('operationForm.preparedBy', 'name')
      .populate('adminApproval.approvedBy', 'name')
      .populate('crmAssignment.assignedTo', 'name')
      .populate('activityLog.by', 'name')
      .sort({ createdAt: -1 });

    res.json(cases);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/cases/:id/complete  (Admin marks a case fully completed)
const markCaseCompleted = async (req, res) => {
  try {
    const singleCase = await Case.findById(req.params.id);
    if (!singleCase) return res.status(404).json({ message: 'Case not found' });

    singleCase.completedAt = new Date();
    logActivity(singleCase, req.user, 'completed', 'Admin marked case as completed');
    singleCase.status = 'completed';
    await singleCase.save();

    res.json(singleCase);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/cases/:id/edit-my-data — user apna khud ka submitted data edit kare
const updateMyStageData = async (req, res) => {
  try {
    const { data } = req.body;
    const parsedData = typeof data === 'string' ? JSON.parse(data) : data;

    const singleCase = await Case.findById(req.params.id);
    if (!singleCase) return res.status(404).json({ message: 'Case not found' });

    const role = req.user.role;
    const formKeyMap = { sto: 'stoForm', technical: 'technicalForm', operation: 'operationForm' };
    const ownerFieldMap = { sto: 'submittedBy', technical: 'reviewedBy', operation: 'preparedBy' };

    const formKey = formKeyMap[role];
    const ownerField = ownerFieldMap[role];
    if (!formKey) return res.status(403).json({ message: 'Not applicable for this role' });

    const ownerId = singleCase[formKey]?.[ownerField];
    if (!ownerId || ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only edit your own submission' });
    }

    singleCase[formKey].data = { ...singleCase[formKey].data, ...parsedData };
    logActivity(singleCase, req.user, 'edited', `${role.toUpperCase()} edited their submitted data`);
    await singleCase.save();

    res.json(singleCase);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// PUT /api/cases/:id/mark-viewed
const markCaseViewed = async (req, res) => {
  try {
    if (req.user.role === 'sto') return res.json({ ok: true });

    const singleCase = await Case.findById(req.params.id);
    if (!singleCase) return res.status(404).json({ message: 'Case not found' });

    const action = `${req.user.role}_viewed`;
    const alreadyViewed = singleCase.activityLog.some(
      (l) => l.action === action && l.by?.toString() === req.user._id.toString()
    );

    if (!alreadyViewed) {
      logActivity(singleCase, req.user, action, `${req.user.role.toUpperCase()} viewed the report`);
      await singleCase.save();
    }
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
module.exports = {
  createCase, getCases, getTechnicalPendingCases, getCaseById,
  submitTechnicalReview, getOperationPendingCases, submitOperationReview,
  getAdminPendingCases, getAllCasesForAdmin, getCrmUsers, adminApproveAndAssign,
  getCrmAssignedCases, getMyCases, markCaseCompleted, updateMyStageData,
  markCaseViewed,
};