const mongoose = require('mongoose');
const Counter = require('./counter');

const leadSchema = new mongoose.Schema({
  leadId: { type: String, unique: true },
  customerName: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String },
  location: { type: String, required: true },
  notes: { type: String },
  viewedAt: { type: Date, default: null },    
  visitedAt: { type: Date, default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
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
  caseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Case', default: null },
  assignedAt: Date,
}, { timestamps: true });

// Auto-generate leadId before saving
leadSchema.pre('save', async function () {
  if (this.isNew && !this.leadId) {
    const counter = await Counter.findOneAndUpdate(
      { id: 'lead_id' },
      { $inc: { seq: 1 } },
      { returnDocument: 'after', upsert: true } // 'new: true' ko deprecated warning fix ke liye update kiya
    );

    const sequenceNumber = String(counter.seq).padStart(3, '0');
    this.leadId = `LD-BNB${sequenceNumber}`;
  }
});

module.exports = mongoose.model('Lead', leadSchema);