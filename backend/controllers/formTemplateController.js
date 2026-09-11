const FormTemplate = require('../models/formTemplate');

// GET /api/form-templates/:department
const getTemplate = async (req, res) => {
  try {
    const template = await FormTemplate.findOne({ department: req.params.department });
    res.json(template || { department: req.params.department, fields: [] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/form-templates  (admin — sab templates)
const getAllTemplates = async (req, res) => {
  try {
    const templates = await FormTemplate.find();
    res.json(templates);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/form-templates/:department  (admin — create/update)
const upsertTemplate = async (req, res) => {
  try {
    const { fields } = req.body;
    const template = await FormTemplate.findOneAndUpdate(
      { department: req.params.department },
      { department: req.params.department, fields },
      { new: true, upsert: true }
    );
    res.json(template);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getTemplate, getAllTemplates, upsertTemplate };