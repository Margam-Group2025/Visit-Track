const Lead = require('../models/lead');
const User = require('../models/user');

// POST /api/leads  (CRM naya lead banata hai)
const createLead = async (req, res) => {
  try {
    const { customerName, phone, email, location, notes } = req.body;
    const lead = await Lead.create({
      customerName, phone, email, location, notes,
      createdBy: req.user._id,
    });
    res.status(201).json(lead);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/leads  (CRM apne banaye leads dekhe)
const getMyLeads = async (req, res) => {
  try {
    const leads = await Lead.find({ createdBy: req.user._id })
      .populate('assignedTo', 'name email')
      .populate('caseId', 'caseNumber status')
      .sort({ createdAt: -1 });
    res.json(leads);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/leads/all  (Admin — sab leads dekhe)
const getAllLeads = async (req, res) => {
  try {
    const leads = await Lead.find()
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email')
      .populate('caseId', 'caseNumber status')
      .sort({ createdAt: -1 });
    res.json(leads);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/leads/sto-users  (CRM ke liye — assign karne ke liye STO list)
const getStoUsers = async (req, res) => {
  try {
    const stoUsers = await User.find({ role: 'sto', isActive: true }).select('name email');
    res.json(stoUsers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/leads/:id/assign  (CRM kisi STO ko assign kare)
const assignLead = async (req, res) => {
  try {
    const { assignedTo } = req.body;
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ message: 'Lead not found' });

    lead.assignedTo = assignedTo;
    lead.status = 'assigned';
    lead.assignedAt = new Date();
    await lead.save();

    res.json(lead);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/leads/assigned-to-me  (STO — apne assigned leads dekhe, jo visit nahi hue)
const getMyAssignedLeads = async (req, res) => {
  try {
    const leads = await Lead.find({ assignedTo: req.user._id, status: 'assigned' })
      .sort({ assignedAt: -1 });
    res.json(leads);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createLead, getMyLeads, getAllLeads, getStoUsers, assignLead, getMyAssignedLeads,
};