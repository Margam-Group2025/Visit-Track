const Lead = require('../models/lead');
const User = require('../models/user');
const mailEvents = require('../utils/mailEvents');
const nextLeadId = require('../utils/nextLeadId');
const createLead = async (req, res) => {
  try {
    const { customerName, phone, email, location, notes } = req.body;

    const leadId = await nextLeadId();

    const lead = await Lead.create({
      leadId,
      customerName,
      phone,
      email,
      location,
      notes,
      createdBy: req.user._id,
    });

    res.status(201).json(lead);
  } catch (error) {
    console.error('createLead error:', error.message);
    res.status(500).json({ message: error.message });
  }
};
// GET /api/leads (CRM apne banaye leads dekhe)
const getMyLeads = async (req, res) => {
  try {
    const leads = await Lead.find({ createdBy: req.user._id })
      .populate('assignedTo', 'name email')
      .populate('caseId', 'caseNumber status')
      .populate('assignmentHistory.sto', 'name')
      .sort({ createdAt: -1 });
    res.json(leads);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/leads/all (Admin — sab leads dekhe)
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

// GET /api/leads/sto-users (CRM ke liye — assign karne ke liye STO list)
const getStoUsers = async (req, res) => {
  try {
    const stoUsers = await User.find({ role: 'sto', isActive: true }).select('name email');
    res.json(stoUsers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/leads/:id/assign (assign ya reassign)
const assignLead = async (req, res) => {
  try {
    const { assignedTo } = req.body;
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ message: 'Lead not found' });

    if (lead.status === 'visited') {
      return res.status(400).json({ message: 'Site visit is already done, cannot reassign' });
    }
    if (lead.assignedTo && lead.assignedTo.toString() === assignedTo) {
      return res.status(400).json({ message: 'Already assigned to this STO' });
    }

    const sto = await User.findOne({ _id: assignedTo, role: 'sto', isActive: true });
    if (!sto) return res.status(400).json({ message: 'Selected STO not found' });

    lead.assignmentHistory.push({ sto: sto._id, assignedBy: req.user._id, at: new Date() });
    lead.assignedTo = sto._id;
    lead.status = 'assigned';
    lead.assignedAt = new Date();
    lead.viewedAt = null;
    await lead.save();
console.log('assignLead: sending mail to', sto.email);
mailEvents.leadAssigned({ lead, sto, by: req.user });
    res.json(lead);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/leads/assigned-to-me (STO)
const getMyAssignedLeads = async (req, res) => {
  try {
    await Lead.updateMany(
      { assignedTo: req.user._id, status: 'assigned', viewedAt: null },
      { viewedAt: new Date() }
    );

const leads = await Lead.find({ assignedTo: req.user._id, status: 'assigned' })
  .populate('createdBy', 'name')
  .populate('assignmentHistory.sto', 'name')
  .populate('editHistory.by', 'name')
  .sort({ assignedAt: -1 });
    res.json(leads);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/leads/:id (CRM apne lead ki details edit kare)
const updateLead = async (req, res) => {
  try {
    const { customerName, phone, email, location, notes } = req.body;
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ message: 'Lead not found' });

    if (lead.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only edit your own leads' });
    }

    lead.customerName = customerName ?? lead.customerName;
    lead.phone = phone ?? lead.phone;
    lead.email = email ?? lead.email;
    lead.location = location ?? lead.location;
    lead.notes = notes ?? lead.notes;
    await lead.save();

    res.json(lead);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// PUT /api/leads/:id/sto-update
const updateLeadBySto = async (req, res) => {
  try {
    const { customerName, phone, email, location } = req.body;
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ message: 'Lead not found' });

    if (!lead.assignedTo || lead.assignedTo.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'This lead is not assigned to you' });
    }
    if (lead.status === 'visited') {
      return res.status(400).json({ message: 'Visit already submitted, details are locked' });
    }

    const incoming = { customerName, phone, email, location };
    const changes = [];
    Object.entries(incoming).forEach(([key, value]) => {
      if (value !== undefined && String(value) !== String(lead[key] ?? '')) {
        changes.push(`${key}: "${lead[key] ?? ''}" → "${value}"`);
        lead[key] = value;
      }
    });

    if (changes.length > 0) {
      lead.editHistory.push({
        by: req.user._id,
        role: req.user.role,
        changes: changes.join('; '),
        at: new Date(),
      });
      await lead.save();
    }

    const populated = await Lead.findById(lead._id)
      .populate('createdBy', 'name')
      .populate('assignmentHistory.sto', 'name')
      .populate('editHistory.by', 'name');
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
module.exports = {
  createLead,
  getMyLeads,
  getAllLeads,
  getStoUsers,
  assignLead,
  getMyAssignedLeads,
  updateLead,
  updateLeadBySto,
};
 