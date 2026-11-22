
require("dotenv").config();

const sendEmail = require("../utils/sendEmail");

async function testEmail() {
  try {
    await sendEmail({
      to: "YOUR_TEST_EMAIL@gmail.com",
      subject: "Visit Track Email Test",
      html: `
        <h2>Welcome to Visit Track!</h2>
        <p>Your Resend email integration is working.</p>
      `,
    });

    console.log("Test email completed");
  } catch (error) {
    console.error(error);
  }
}

testEmail();
