const Counter = require('../models/counter');
const Lead = require('../models/lead');

const nextLeadId = async () => {
  const year = new Date().getFullYear();
  const key = `lead-${year}`;

  const existing = await Counter.findById(key);
  if (!existing) {
    const leads = await Lead.find({ leadId: new RegExp(`^LD-${year}-`) }).select('leadId');
    const max = leads.reduce(
      (m, l) => Math.max(m, parseInt(l.leadId.split('-').pop(), 10) || 0),
      0
    );
    await Counter.updateOne({ _id: key }, { $setOnInsert: { seq: max } }, { upsert: true });
  }

  const counter = await Counter.findOneAndUpdate(
    { _id: key },
    { $inc: { seq: 1 } },
    { returnDocument: 'after' }
  );
  return `LD-${year}-${String(counter.seq).padStart(4, '0')}`;
};

module.exports = nextLeadId;