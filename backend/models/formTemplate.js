const mongoose = require('mongoose');

const fieldSchema = new mongoose.Schema({
  fieldId: { type: String, required: true },
  label: { type: String, required: true },
  fieldType: {
    type: String,
    enum: ['text', 'number', 'textarea', 'date', 'select', 'checkbox', 'file'],
    required: true,
  },
  required: { type: Boolean, default: false },
  options: [String],
  order: { type: Number, default: 0 },
}, { _id: false });

const formTemplateSchema = new mongoose.Schema({
  department: {
    type: String,
    enum: ['sto', 'technical', 'operation'],
    required: true,
    unique: true,
  },
  fields: [fieldSchema],
}, { timestamps: true });

module.exports = mongoose.model('FormTemplate', formTemplateSchema);