const Case = require('../models/case');
const user = require('../models/user');

const createCase = async (req, res) => {
  try {
    const { siteName, siteAddress, situationDetails, remarks } = req.body;

    const count = await Case.countDocuments();
    const caseNumber = `SV-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const files = (req.files || []).map((f) => ({
      fileName: f.originalname,
      fileUrl: f.path, // cloudinary url
    }));

    const newCase = await Case.create({
      caseNumber,
      siteName,
      siteAddress,
      status: 'technical_pending',
      stoForm: {
        submittedBy: req.user._id,
        situationDetails,
        remarks,
        files,
        submittedAt: new Date(),
      },
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
    const { technicalDetails, remarks } = req.body;
    const singleCase = await Case.findById(req.params.id);
    if (!singleCase) return res.status(404).json({ message: 'Case not found' });

    const files = (req.files || []).map((f) => ({
      fileName: f.originalname,
      fileUrl: f.path,
    }));

    singleCase.technicalForm = {
      reviewedBy: req.user._id,
      approved: true,
      technicalDetails,
      remarks,
      files,
      submittedAt: new Date(),
    };
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
    const { finalReport, quotationLink } = req.body;
    const singleCase = await Case.findById(req.params.id);
    if (!singleCase) return res.status(404).json({ message: 'Case not found' });

    const files = (req.files || []).map((f) => ({
      fileName: f.originalname,
      fileUrl: f.path,
    }));

    singleCase.operationForm = {
      preparedBy: req.user._id,
      finalReport,
      quotationLink,
      files,
      submittedAt: new Date(),
    };
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

// GET /api/cases/all  (admin —  cases,  status)
const getAllCasesForAdmin = async (req, res) => {
  try {
    const cases = await Case.find()
      .populate('stoForm.submittedBy', 'name email')
      .populate('technicalForm.reviewedBy', 'name email')
      .populate('operationForm.preparedBy', 'name email')
      .populate('crmAssignment.assignedTo', 'name email')
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

    singleCase.status = 'completed';
    await singleCase.save();

    res.json(singleCase);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createCase, getCases, getTechnicalPendingCases, getCaseById,
  submitTechnicalReview, getOperationPendingCases, submitOperationReview,
  getAdminPendingCases, getAllCasesForAdmin, getCrmUsers, adminApproveAndAssign,
  getCrmAssignedCases, getMyCases, markCaseCompleted,
};