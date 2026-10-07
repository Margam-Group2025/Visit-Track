const Lead = require('../models/lead');
const User = require('../models/user');
const sendEmail = require('../utils/sendEmail');
// POST /api/leads  (CRM naya lead banata hai)
const createLead = async (req, res) => {
  try {
    const { customerName, phone, email, location, notes } = req.body;

    const count = await Lead.countDocuments();
    const leadId = `LD-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const lead = await Lead.create({
      leadId,
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
      .populate('assignmentHistory.sto', 'name')
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

// PUT /api/leads/:id/assign  (assign ya reassign)
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
    lead.viewedAt = null; // naye STO ka "seen" fresh track hoga
    await lead.save();

    sendEmail(
      sto.email,
      'New Lead Assigned for Site Visit',
      `A new lead has been assigned to you.\n\nCustomer: ${lead.customerName}\nPhone: ${lead.phone}\nLocation: ${lead.location}`
    );

    res.json(lead);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/leads/assigned-to-me  (STO )
const getMyAssignedLeads = async (req, res) => {
  try {
    await Lead.updateMany(
      { assignedTo: req.user._id, status: 'assigned', viewedAt: null },
      { viewedAt: new Date() }
    );

    const leads = await Lead.find({ assignedTo: req.user._id, status: 'assigned' })
      .sort({ assignedAt: -1 });
    res.json(leads);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/leads/:id  (CRM apne lead ki details edit kare)
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

module.exports = {
  createLead, getMyLeads, getAllLeads, getStoUsers, assignLead, getMyAssignedLeads, updateLead
};