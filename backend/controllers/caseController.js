const User = require('../models/user');
const Case = require('../models/case');
const Lead = require('../models/lead');
const logActivity = require('../utils/logActivity');
// const { notifyRole, notifyUser } = require('../utils/notify');
const { notifyRole, notifyUser } = require('../utils/notify');
// CREATE CASE - STO assigns Technical member
const createCase = async (req, res) => {
  try {
    const { siteName, siteAddress, data, leadId, assignedTechnical } = req.body;
    const parsedData = typeof data === 'string' ? JSON.parse(data) : data || {};

    if (!assignedTechnical) {
      return res.status(400).json({ message: 'Please select a Technical team member' });
    }
    const techUser = await User.findOne({ _id: assignedTechnical, role: 'technical', isActive: true });
    if (!techUser) {
      return res.status(400).json({ message: 'Selected Technical member not found' });
    }

    const lastCase = await Case.findOne().sort({ createdAt: -1 }).select('caseNumber');
    const lastNum = lastCase ? parseInt(lastCase.caseNumber.split('-').pop(), 10) || 0 : 0;
    const caseNumber = `SV-${new Date().getFullYear()}-${String(lastNum + 1).padStart(4, '0')}`;

    const files = (req.files || []).map((f) => ({ fileName: f.originalname, fileUrl: f.path }));

    const newCase = await Case.create({
      caseNumber,
      siteName,
      siteAddress,
      leadId: leadId || null,
      assignedTechnical: techUser._id,
      status: 'technical_pending',
      stoForm: { submittedBy: req.user._id, data: parsedData, files, submittedAt: new Date() },
      activityLog: [
        {
          action: 'sto_submitted',
          label: `STO submitted site visit report and assigned to ${techUser.name}`,
          by: req.user._id,
          role: 'sto',
          at: new Date(),
        },
      ],
    });

    if (leadId) {
      const lead = await Lead.findByIdAndUpdate(
        leadId,
        { status: 'visited', caseId: newCase._id, visitedAt: new Date() },
        { returnDocument: 'after' }
      );
      if (lead) {
        newCase.leadCode = lead.leadId;
        await newCase.save();
      }
    }
    notifyUser(techUser._id, `New case for review — ${newCase.caseNumber}`, {
  c: newCase,
  done: 'STO has submitted the site visit report and assigned the case to you.',
  next: 'Open the case in Pending Cases to complete the technical review and approve it.',
});
notifyRole('admin', `[Update] STO report submitted — ${newCase.caseNumber}`, {
  c: newCase,
  done: `STO has submitted the site visit report. The case is now with ${techUser.name} (Technical).`,
});

    res.status(201).json(newCase);
  } catch (error) {
    console.error('createCase error:', error);
    res.status(500).json({ message: error.message });
  }
};

// GET /api/cases
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
    const cases = await Case.find({
      status: 'technical_pending',
      $or: [
        { assignedTechnical: req.user._id },
        { assignedTechnical: null },
      ],
    })
      .populate('stoForm.submittedBy', 'name email')
      .populate('assignedTechnical', 'name email')
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

    if (!singleCase) {
      return res.status(404).json({ message: 'Case not found' });
    }

    res.json(singleCase);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/cases/:id/technical-review
const submitTechnicalReview = async (req, res) => {
  try {
    const { data } = req.body;
    const parsedData =
      typeof data === 'string' ? JSON.parse(data) : data;

    const singleCase = await Case.findById(req.params.id);

    if (!singleCase) {
      return res.status(404).json({ message: 'Case not found' });
    }

    // Only assigned Technical member can review
    if (
      singleCase.assignedTechnical &&
      singleCase.assignedTechnical.toString() !==
        req.user._id.toString()
    ) {
      return res.status(403).json({
        message: 'This case is assigned to another Technical member',
      });
    }

    const files = (req.files || []).map((f) => ({
      fileName: f.originalname,
      fileUrl: f.path,
    }));

    singleCase.technicalForm = {
      reviewedBy: req.user._id,
      approved: true,
      data: parsedData,
      files,
      submittedAt: new Date(),
    };

    logActivity(
      singleCase,
      req.user,
      'technical_submitted',
      'Technical review approved and sent to Operation'
    );

    singleCase.status = 'operation_pending';
   notifyRole('operation', `Ready for final report — ${singleCase.caseNumber}`, {
  c: singleCase,
  done: 'Technical review is complete and approved.',
  next: 'Prepare the final report and quotation, then send them to Admin for approval.',
});
notifyRole('admin', `[Update] Technical review done — ${singleCase.caseNumber}`, {
  c: singleCase,
  done: 'Technical review is complete. The case is now with the Operations team.',
});
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
      .populate(leadPopulate)
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
    const parsedData =
      typeof data === 'string' ? JSON.parse(data) : data;

    const singleCase = await Case.findById(req.params.id);

    if (!singleCase) {
      return res.status(404).json({ message: 'Case not found' });
    }

    const quotationFileUpload = req.files?.quotationFile?.[0];

    const generalFiles = (req.files?.files || []).map((f) => ({
      fileName: f.originalname,
      fileUrl: f.path,
    }));

    if (!quotationFileUpload) {
      return res.status(400).json({
        message: 'Quotation file is required',
      });
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

    logActivity(
      singleCase,
      req.user,
      'operation_submitted',
      'Operation sent final report and quotation to Admin'
    );

    singleCase.status = 'admin_pending';
  notifyRole('admin', `Approval needed — ${singleCase.caseNumber}`, {
  c: singleCase,
  done: 'Operations has sent the final report and quotation.',
  next: 'Review and approve the report, then assign it to a CRM member.',
});

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
      .populate('assignedTechnical', 'name email')
      .sort({ createdAt: -1 });

    res.json(cases);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/cases/all
const getAllCasesForAdmin = async (req, res) => {
  try {
    const cases = await Case.find()
      .populate('stoForm.submittedBy', 'name email')
      .populate('technicalForm.reviewedBy', 'name email')
      .populate('operationForm.preparedBy', 'name email')
      .populate('assignedTechnical', 'name email')
      .populate('crmAssignment.assignedTo', 'name email')
      .populate('activityLog.by', 'name')
      .populate('crmCompletion.submittedBy', 'name')
      .populate('accountsInvoice.uploadedBy', 'name')
      .sort({ createdAt: -1 });

    res.json(cases);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/cases/crm-users
const getCrmUsers = async (req, res) => {
  try {
    const crmUsers = await User.find({
      role: 'crm',
      isActive: true,
    }).select('name email');

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

    if (!singleCase) {
      return res.status(404).json({ message: 'Case not found' });
    }

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

    logActivity(
      singleCase,
      req.user,
      'admin_approved',
      'Admin approved and assigned to CRM'
    );

    singleCase.status = 'crm_assigned';
   notifyUser(assignedTo, `Case assigned to you — ${singleCase.caseNumber}`, {
  c: singleCase,
  done: 'Admin has approved the case and assigned it to you.',
  next: `Complete the work with the customer and submit the collected amount. Admin's note: ${notes || 'None'}`,
});
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
    status: { $in: ['crm_assigned', 'accounts_pending', 'invoiced', 'completed'] },
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

// GET /api/cases/my-cases
const getMyCases = async (req, res) => {
  try {
    const filters = {
      sto: { 'stoForm.submittedBy': req.user._id },
      technical: { 'technicalForm.reviewedBy': req.user._id },
      operation: { 'operationForm.preparedBy': req.user._id },
      crm: { 'crmAssignment.assignedTo': req.user._id },
      accountant: { 'accountsInvoice.uploadedBy': req.user._id },
    };
    const filter = filters[req.user.role];
    if (!filter) return res.status(403).json({ message: 'Not applicable for this role' });

    const cases = await Case.find(filter)
      .populate('stoForm.submittedBy', 'name')
      .populate('technicalForm.reviewedBy', 'name')
      .populate('operationForm.preparedBy', 'name')
      .populate('adminApproval.approvedBy', 'name')
      .populate('crmAssignment.assignedTo', 'name')
      .populate('assignedTechnical', 'name email')
      .populate('activityLog.by', 'name')
      .sort({ createdAt: -1 });

    res.json(cases);
  } catch (error) {
    console.error('getMyCases error:', error.message);   // 👈 yeh line add hui
    res.status(500).json({ message: error.message });
  }
};
// PUT /api/cases/:id/complete
const markCaseCompleted = async (req, res) => {
  try {
    const singleCase = await Case.findById(req.params.id);

   if (singleCase.status !== 'invoiced') {
  return res.status(400).json({ message: 'Invoice has not been uploaded yet' });
}

    singleCase.completedAt = new Date();

    logActivity(
      singleCase,
      req.user,
      'completed',
      'Admin marked case as completed'
    );

    singleCase.status = 'completed';
if (singleCase.crmAssignment?.assignedTo) {
  notifyUser(singleCase.crmAssignment.assignedTo, `Case completed — ${singleCase.caseNumber}`, {
    c: singleCase,
    done: 'Admin has marked this case as Completed.',
  });
}
    await singleCase.save();
    res.json(singleCase);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/cases/:id/edit-my-data
const updateMyStageData = async (req, res) => {
  try {
    const { data } = req.body;
    const parsedData =
      typeof data === 'string' ? JSON.parse(data) : data;

    const singleCase = await Case.findById(req.params.id);

    if (!singleCase) {
      return res.status(404).json({ message: 'Case not found' });
    }

    const role = req.user.role;

    const formKeyMap = {
      sto: 'stoForm',
      technical: 'technicalForm',
      operation: 'operationForm',
    };

    const ownerFieldMap = {
      sto: 'submittedBy',
      technical: 'reviewedBy',
      operation: 'preparedBy',
    };

    const formKey = formKeyMap[role];
    const ownerField = ownerFieldMap[role];

    if (!formKey) {
      return res.status(403).json({
        message: 'Not applicable for this role',
      });
    }

    const ownerId = singleCase[formKey]?.[ownerField];

    if (
      !ownerId ||
      ownerId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        message: 'You can only edit your own submission',
      });
    }

    singleCase[formKey].data = {
      ...singleCase[formKey].data,
      ...parsedData,
    };

    logActivity(
      singleCase,
      req.user,
      'edited',
      `${role.toUpperCase()} edited their submitted data`
    );

    await singleCase.save();
    res.json(singleCase);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/cases/:id/mark-viewed
const markCaseViewed = async (req, res) => {
  try {
    if (req.user.role === 'sto') {
      return res.json({ ok: true });
    }

    const singleCase = await Case.findById(req.params.id);

    if (!singleCase) {
      return res.status(404).json({ message: 'Case not found' });
    }

    const action = `${req.user.role}_viewed`;

    const alreadyViewed = singleCase.activityLog.some(
      (l) =>
        l.action === action &&
        l.by?.toString() === req.user._id.toString()
    );

    if (!alreadyViewed) {
      logActivity(
        singleCase,
        req.user,
        action,
        `${req.user.role.toUpperCase()} viewed the report`
      );

      await singleCase.save();
    }

    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/cases/technical-users
const getTechnicalUsers = async (req, res) => {
  try {
    const users = await User.find({
      role: 'technical',
      isActive: true,
    }).select('name email');

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/cases/:id/crm-complete  (CRM amount submit karke Accounts ko bhejta hai)
const crmSubmitCompletion = async (req, res) => {
  try {
    const { amountReceived, remarks } = req.body;
    const amount = Number(amountReceived);
    if (amountReceived === undefined || amountReceived === '' || Number.isNaN(amount) || amount < 0) {
      return res.status(400).json({ message: 'Please enter a valid amount' });
    }

    const singleCase = await Case.findById(req.params.id);
    if (!singleCase) return res.status(404).json({ message: 'Case not found' });
    if (singleCase.status !== 'crm_assigned') {
      return res.status(400).json({ message: 'This case is not in the CRM stage' });
    }
    if (singleCase.crmAssignment?.assignedTo?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'This case is assigned to another CRM member' });
    }

    singleCase.crmCompletion = {
      amountReceived: amount,
      remarks,
      submittedBy: req.user._id,
      submittedAt: new Date(),
    };
    singleCase.status = 'accounts_pending';
    logActivity(singleCase, req.user, 'crm_completed', `CRM completed work and submitted amount ₹${amount.toLocaleString('en-IN')}`);
    await singleCase.save();
  notifyRole('accountant', `Invoice required — ${singleCase.caseNumber}`, {
  c: singleCase,
  done: `CRM completed the work and submitted ₹${amount.toLocaleString('en-IN')} collected from the customer.`,
  next: 'Open the case to check customer details and upload the invoice.',
});
notifyRole('admin', `[Update] CRM submitted amount — ${singleCase.caseNumber}`, {
  c: singleCase,
  done: 'CRM has completed the work. The case is now with Accounts for invoicing.',
});
    res.json(singleCase);
  } catch (error) {
    console.error('crmSubmitCompletion error:', error);
    res.status(500).json({ message: error.message });
  }
};

// GET /api/cases/accounts-pending
const getAccountsPendingCases = async (req, res) => {
  try {
    const cases = await Case.find({ status: 'accounts_pending' })
      .populate('leadId', 'leadId customerName phone email location')
      .populate('crmCompletion.submittedBy', 'name')
      .sort({ 'crmCompletion.submittedAt': -1 });
    res.json(cases);
  } catch (error) {
      console.error('getAccountsPendingCases error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/cases/:id/upload-invoice
const uploadInvoice = async (req, res) => {
  try {
    const { invoiceNumber, remarks } = req.body;
    if (!req.file) return res.status(400).json({ message: 'Invoice file is required' });

    const singleCase = await Case.findById(req.params.id);
    if (!singleCase) return res.status(404).json({ message: 'Case not found' });
    if (singleCase.status !== 'accounts_pending') {
      return res.status(400).json({ message: 'This case is not waiting for an invoice' });
    }

    singleCase.accountsInvoice = {
      invoiceNumber,
      invoiceFile: { fileName: req.file.originalname, fileUrl: req.file.path },
      remarks,
      uploadedBy: req.user._id,
      uploadedAt: new Date(),
    };
    singleCase.status = 'invoiced';
    logActivity(singleCase, req.user, 'invoice_uploaded', `Accounts uploaded invoice${invoiceNumber ? ` ${invoiceNumber}` : ''}`);
    await singleCase.save();
   notifyRole('operation', `Prepare material report — ${singleCase.caseNumber}`, {
  c: singleCase,
  done: 'Accounts has uploaded the invoice.',
  next: 'Fill out and submit the final material report in the Material Report tab.',
  });
  notifyRole('admin', `[Update] Invoice uploaded — ${singleCase.caseNumber}`, {
  c: singleCase,
  done: 'Accounts has uploaded the invoice. Operations will now prepare the final material report.',
   });
    res.json(singleCase);
  } catch (error) {
    console.error('uploadInvoice error:', error);
    res.status(500).json({ message: error.message });
  }
};
// PUT /api/cases/:id/reassign-technical
const reassignTechnical = async (req, res) => {
  try {
    const { assignedTechnical } = req.body;
    const singleCase = await Case.findById(req.params.id);
    if (!singleCase) return res.status(404).json({ message: 'Case not found' });

    if (singleCase.stoForm?.submittedBy?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only change your own case' });
    }
    if (singleCase.status !== 'technical_pending') {
      return res.status(400).json({ message: 'Technical review is already done, cannot change' });
    }

    const techUser = await User.findOne({ _id: assignedTechnical, role: 'technical', isActive: true });
    if (!techUser) return res.status(400).json({ message: 'Technical member not found' });
    if (singleCase.assignedTechnical?.toString() === techUser._id.toString()) {
      return res.status(400).json({ message: 'Already assigned to this member' });
    }

    singleCase.assignedTechnical = techUser._id;
    logActivity(singleCase, req.user, 'technical_reassigned', `STO assigned case to ${techUser.name}`);
    await singleCase.save();

    const populated = await Case.findById(singleCase._id).populate('assignedTechnical', 'name email');
    notifyUser(techUser._id, `Case assigned to you — ${singleCase.caseNumber}`, {
  c: singleCase,
  done: 'STO has assigned this case to you.',
  next: 'Review and approve it in Pending Cases.',
});
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// GET /api/cases/material-pending  (Operation: invoice ho chuke cases)
const getMaterialPendingCases = async (req, res) => {
  try {
    const cases = await Case.find({ status: 'invoiced' })
      .populate('leadId', 'leadId customerName phone email location notes')
      .sort({ 'accountsInvoice.uploadedAt': -1 });
    res.json(cases);
  } catch (error) {
    console.error('getMaterialPendingCases error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/cases/:id/material-report  (Operation final material report submit)
const submitMaterialReport = async (req, res) => {
  try {
    const { data } = req.body;
    const parsedData = typeof data === 'string' ? JSON.parse(data) : data || {};

    const singleCase = await Case.findById(req.params.id);
    if (!singleCase) return res.status(404).json({ message: 'Case not found' });
    if (singleCase.status !== 'invoiced') {
      return res.status(400).json({ message: 'Material report is not pending for this case' });
    }

    const files = (req.files || []).map((f) => ({ fileName: f.originalname, fileUrl: f.path }));

    singleCase.materialReport = {
      data: parsedData,
      files,
      preparedBy: req.user._id,
      submittedAt: new Date(),
    };
    singleCase.status = 'material_submitted';
    logActivity(singleCase, req.user, 'material_submitted', 'Operation submitted final material report');
    await singleCase.save();
  notifyRole('procurement', `Material report received — ${singleCase.caseNumber}`, {
  c: singleCase,
  done: 'Operations has submitted the final material report.',
  next: 'Check the report in the Dashboard and start arranging the materials.',
});
notifyRole('site_supervisor', `Work details received — ${singleCase.caseNumber}`, {
  c: singleCase,
  done: 'Operations has submitted the final material report containing the work details for this lead.',
  next: 'Check the report in the Dashboard and prepare for on-site work.',
});
notifyRole('admin', `[Update] Material report submitted — ${singleCase.caseNumber}`, {
  c: singleCase,
  done: 'Operations has sent the final material report. Procurement and the Site Supervisor have been notified.',
  next: 'Mark the case as Completed once the work is finished.',
});
    res.json(singleCase);
  } catch (error) {
    console.error('submitMaterialReport error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// GET /api/cases/material-reports  (Procurement + Site Supervisor)
const getMaterialReports = async (req, res) => {
  try {
    const cases = await Case.find({ 'materialReport.submittedAt': { $ne: null } })
      .populate('leadId', 'leadId customerName phone email location notes')
      .populate('materialReport.preparedBy', 'name')
      .populate('activityLog.by', 'name')
      .sort({ 'materialReport.submittedAt': -1 });
    res.json(cases);
  } catch (error) {
    console.error('getMaterialReports error:', error.message);
    res.status(500).json({ message: error.message });
  }
};
const leadPopulate = {
  path: 'leadId',
  populate: [
    { path: 'createdBy', select: 'name' },
    { path: 'assignmentHistory.sto', select: 'name' },
    { path: 'editHistory.by', select: 'name' },
  ],
};

module.exports = {
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
  leadPopulate,
  getMaterialPendingCases,
  submitMaterialReport,
  getMaterialReports,
};
