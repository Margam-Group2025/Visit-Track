const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String },
  location: { type: String, required: true },
  notes: { type: String },
  viewedAt: { type: Date, default: null },    
  visitedAt: { type: Date, default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },   // CRM jisne lead banaya
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },   // STO
  assignmentHistory: [{
  sto: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  at: { type: Date, default: Date.now },
}],
  status: {
    type: String,
    enum: ['unassigned', 'assigned', 'visited'],
    default: 'unassigned',
  },

  caseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Case', default: null },   // jab STO form bhar de, case se link ho jayega
  assignedAt: Date,
}, { timestamps: true });

module.exports = mongoose.model('Lead', leadSchema);