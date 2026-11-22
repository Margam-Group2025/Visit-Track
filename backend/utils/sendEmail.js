const sendEmail = async (to, subject, text) => {
  const body = `${text}\n\n— SiteFlow\n${process.env.FRONTEND_URL || ''}`;
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to: [to],
        subject,
        text: body,
      }),
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