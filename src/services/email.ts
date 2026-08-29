import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function sendVerificationEmail(to: string, code: string) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.log(`[DEV] - Verification code for :  ${to}: ${code}`);
    return;
  }

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: 'First you need to verifiacte. - Spendlio',
    html: `<p>Your verification code is : <strong>${code}</strong></p><p>Valid for 15 minutes.</p>`,
  });
}