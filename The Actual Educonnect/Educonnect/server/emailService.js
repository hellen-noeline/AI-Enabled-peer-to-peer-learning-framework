/**
 * Server-side email for feedback responses.
 * Sends the admin's response to the user's sign-in email (from the database).
 *
 * Configure with environment variables:
 *   SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS
 * Or use defaults for Gmail: host smtp.gmail.com, port 587, secure false.
 *
 * If not configured, the response is still saved; only the email is skipped.
 */

import nodemailer from 'nodemailer'

const transport = (() => {
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  if (!user || !pass) return null
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user, pass }
  })
})()

export async function sendFeedbackResponseEmail({ toEmail, userName, originalSubject, adminResponse }) {
  if (!toEmail) return
  if (!transport) {
    console.warn('SMTP not configured. Set SMTP_USER and SMTP_PASS (and optionally SMTP_HOST, SMTP_PORT) to send feedback response emails.')
    return
  }
  const subject = `Re: ${originalSubject || 'Your feedback'}`
  const html = `
    <p>Hello ${escapeHtml(userName || 'User')},</p>
    <p>Thank you for your feedback. Here is our response:</p>
    <blockquote>${escapeHtml(adminResponse || '').replace(/\n/g, '<br>')}</blockquote>
    <p>Best regards,<br>EduConnect Team</p>
  `
  const text = `Hello ${userName || 'User'},\n\nThank you for your feedback. Here is our response:\n\n${adminResponse || ''}\n\nBest regards,\nEduConnect Team`
  await transport.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: toEmail,
    subject,
    text,
    html
  })
}

function escapeHtml(s) {
  if (typeof s !== 'string') return ''
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
