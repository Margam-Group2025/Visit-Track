const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema(
  {
    fileName: String,
    fileUrl: String,
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const activitySchema = new mongoose.Schema(
  {
    action: String,
    label: String,
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: String,
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const caseSchema = new mongoose.Schema(
  {
    caseNumber: { type: String, required: true, unique: true },
    leadCode: { type: String, default: null },
    siteName: { type: String, required: true },
    siteAddress: { type: String },

    leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', default: null },
    assignedTechnical: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

    status: {
      type: String,
      enum: [
        'sto_pending',
        'technical_pending',
        'operation_pending',
        'admin_pending',
        'crm_assigned',
        'accounts_pending',
        'invoiced',
        'completed',
        'rejected',
      ],
      default: 'sto_pending',
    },

    completedAt: { type: Date },
    activityLog: [activitySchema],

    // STO
    stoForm: {
      submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      data: { type: mongoose.Schema.Types.Mixed, default: {} },
      files: [fileSchema],
      submittedAt: Date,
    },

    // Technical
    technicalForm: {
      reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      approved: { type: Boolean, default: false },
      data: { type: mongoose.Schema.Types.Mixed, default: {} },
      files: [fileSchema],
      submittedAt: Date,
    },

    // Operation
    operationForm: {
      preparedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      data: { type: mongoose.Schema.Types.Mixed, default: {} },
      quotationFile: fileSchema,
      files: [fileSchema],
      submittedAt: Date,
    },

    // Admin approval
    adminApproval: {
      approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      approved: { type: Boolean, default: false },
      remarks: String,
      approvedAt: Date,
    },

    // CRM assignment
    crmAssignment: {
      assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      assignedAt: Date,
      notes: String,
    },

    // CRM completion (amount submitted to Accounts)
    crmCompletion: {
      amountReceived: Number,
      remarks: String,
      submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      submittedAt: Date,
    },

    // Accounts invoice
    accountsInvoice: {
      invoiceNumber: String,
      invoiceFile: fileSchema,
      remarks: String,
      uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      uploadedAt: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Case', caseSchema);