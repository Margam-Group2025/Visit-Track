const Case = require('../models/Case');

// POST /api/cases  (STO creates new case)
const createCase = async (req, res) => {
  try {
    const { siteName, siteAddress, situationDetails, remarks } = req.body;

    const count = await Case.countDocuments();
    const caseNumber = `SV-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const files = (req.files || []).map((f) => ({
      fileName: f.originalname,
      fileUrl: f.path, // cloudinary url
    }));

    const newCase = await Case.create({
      caseNumber,
      siteName,
      siteAddress,
      status: 'technical_pending',
      stoForm: {
        submittedBy: req.user._id,
        situationDetails,
        remarks,
        files,
        submittedAt: new Date(),
      },
    });

    res.status(201).json(newCase);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/cases  (list — filtered by role later)
const getCases = async (req, res) => {
  try {
    const cases = await Case.find().sort({ createdAt: -1 });
    res.json(cases);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createCase, getCases };