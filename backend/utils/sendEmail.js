const sendEmail = async (to, subject, text, html) => {
  try {
    const payload = { from: process.env.EMAIL_FROM, to: [to], subject, text };
    if (html) payload.html = html;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    const result = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`${res.status} ${result.name || ''} ${result.message || ''}`);

    console.log(`Email sent to ${to} (id: ${result.id})`);
    return true;
  } catch (error) {
    console.error(`Email FAILED to ${to}:`, error.message);
    return false;
  }
};

module.exports = sendEmail;