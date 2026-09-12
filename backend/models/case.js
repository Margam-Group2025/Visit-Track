const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  fileName: String,
  fileUrl: String,
  uploadedAt: { type: Date, default: Date.now },
}, { _id: false });

const caseSchema = new mongoose.Schema({
  caseNumber: { type: String, required: true, unique: true },
  siteName: { type: String, required: true },
  siteAddress: { type: String },

  status: {
    type: String,
    enum: ['sto_pending', 'technical_pending', 'operation_pending', 'admin_pending', 'crm_assigned', 'completed', 'rejected'],
    default: 'sto_pending',
  },

  stoForm: {
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    situationDetails: String,
    remarks: String,
    files: [fileSchema],
    submittedAt: Date,
  },

  technicalForm: {
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approved: { type: Boolean, default: false },
    technicalDetails: String,
    remarks: String,
    files: [fileSchema],
    submittedAt: Date,
  },

  operationForm: {
    preparedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    finalReport: String,
    quotationLink: String,
    files: [fileSchema],
    submittedAt: Date,
  },

  adminApproval: {
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approved: { type: Boolean, default: false },
    remarks: String,
    approvedAt: Date,
  },

  crmAssignment: {
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assignedAt: Date,
    notes: String,
  },
  stoForm: {
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  data: { type: mongoose.Schema.Types.Mixed, default: {} },   // dynamic fields
  files: [fileSchema],
  submittedAt: Date,
},
technicalForm: {
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approved: { type: Boolean, default: false },
  data: { type: mongoose.Schema.Types.Mixed, default: {} },  
  files: [fileSchema],
  submittedAt: Date,
},
operationForm: {
  preparedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  data: { type: mongoose.Schema.Types.Mixed, default: {} }, 
  quotationFile: fileSchema,  
  files: [fileSchema],
  submittedAt: Date,
},
  completedAt: { type: Date },
}, { timestamps: true });
   
module.exports = mongoose.model('Case', caseSchema);