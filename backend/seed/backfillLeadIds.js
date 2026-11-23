require('dotenv').config();
const mongoose = require('mongoose');
const Lead = require('../models/lead');
const nextLeadId = require('../utils/nextLeadId');

(async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const leads = await Lead.find({
    $or: [{ leadId: null }, { leadId: { $exists: false } }],
  }).sort({ createdAt: 1 });

  for (const lead of leads) {
    lead.leadId = await nextLeadId();
    await lead.save();
    console.log(`${lead.customerName} -> ${lead.leadId}`);
  }

  console.log(`Done. Updated ${leads.length} lead(s).`);
  process.exit();
})();