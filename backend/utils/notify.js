const User = require('../models/user');
const sendEmail = require('./sendEmail');

const APP_LINK = process.env.APP_LINK || 'https://visit-track-woad.vercel.app/';

const escapeHtml = (s = '') =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const nl2br = (s) => escapeHtml(s).replace(/\n/g, '<br>');

const buildMessage = ({ done, next, c }) => {
  const lines = [done, ''];
  if (c) lines.push(`Case: ${c.caseNumber}`, `Customer / Site: ${c.siteName}`);
  if (next) lines.push('', `Next step: ${next}`);
  lines.push('', `Open SiteFlow: ${APP_LINK}`);
  const text = lines.join('\n');

  const html = `
<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#18181b">
  <p style="font-size:15px;line-height:1.6;margin:0 0 16px">${nl2br(done)}</p>
  ${c ? `<p style="font-size:14px;color:#52525b;margin:0 0 16px">Case: <b>${escapeHtml(c.caseNumber)}</b><br>Customer / Site: ${escapeHtml(c.siteName)}</p>` : ''}
  ${next ? `<div style="background:#f4f0ff;border-left:4px solid #8b5cf6;padding:12px 16px;border-radius:6px;margin:0 0 20px;font-size:14px"><b>Next step:</b> ${escapeHtml(next)}</div>` : ''}
  <a href="${APP_LINK}" style="display:inline-block;background:#8b5cf6;color:#ffffff;text-decoration:none;padding:10px 20px;border-radius:8px;font-size:14px">Open SiteFlow</a>
  <p style="font-size:12px;color:#a1a1aa;margin-top:24px">— SiteFlow</p>
</div>`;

  return { text, html };
};

const notifyRole = async (role, subject, info) => {
  try {
    const users = await User.find({ role, isActive: true }).select('email');
    const { text, html } = buildMessage(info);
    await Promise.all(users.map((u) => sendEmail(u.email, subject, text, html)));
  } catch (error) {
    console.error('notifyRole error:', error.message);
  }
};

const notifyUser = async (userId, subject, info) => {
  try {
    if (!userId) return;
    const user = await User.findById(userId).select('email isActive');
    if (user && user.isActive) {
      const { text, html } = buildMessage(info);
      await sendEmail(user.email, subject, text, html);
    }
  } catch (error) {
    console.error('notifyUser error:', error.message);
  }
};

module.exports = { notifyRole, notifyUser };