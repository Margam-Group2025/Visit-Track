const User = require('../models/user');
const sendEmail = require('./sendEmail');

const buildText = ({ done, next, c }) => {
  const lines = [done, ''];
  if (c) {
    lines.push(`Case: ${c.caseNumber}`);
    lines.push(`Customer / Site: ${c.siteName}`);
  }
  if (next) lines.push('', `Aapka next step: ${next}`);
  return lines.join('\n');
};

// Kisi role ke saare active users ko
const notifyRole = async (role, subject, info) => {
  try {
    const users = await User.find({ role, isActive: true }).select('email');
    const text = buildText(info);
    await Promise.all(users.map((u) => sendEmail(u.email, subject, text)));
  } catch (error) {
    console.error('notifyRole error:', error.message);
  }
};

// Ek specific user ko
const notifyUser = async (userId, subject, info) => {
  try {
    const user = await User.findById(userId).select('email isActive');
    if (user && user.isActive) await sendEmail(user.email, subject, buildText(info));
  } catch (error) {
    console.error('notifyUser error:', error.message);
  }
};

module.exports = { notifyRole, notifyUser };