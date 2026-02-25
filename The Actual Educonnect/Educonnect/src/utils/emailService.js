/**
 * Email service using EmailJS.
 * Sends feedback confirmation to the user's email.
 *
 * Setup required:
 * 1. Sign up at https://www.emailjs.com/
 * 2. Add an email service (Gmail, Outlook, etc.)
 * 3. Create an email template with variables: to_email, user_name, subject, message, feedback_type
 * 4. Add env vars to .env (see below)
 *
 * .env:
 * VITE_EMAILJS_SERVICE_ID=your_service_id
 * VITE_EMAILJS_TEMPLATE_ID=your_template_id
 * VITE_EMAILJS_PUBLIC_KEY=your_public_key
 */

import emailjs from '@emailjs/browser'

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY

export async function sendFeedbackConfirmation({ toEmail, userName, subject, message, feedbackType }) {
  if (!toEmail || !userName) return { ok: false, error: 'Missing recipient email or name' }
  if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
    console.warn('EmailJS not configured. Set VITE_EMAILJS_SERVICE_ID, VITE_EMAILJS_TEMPLATE_ID, VITE_EMAILJS_PUBLIC_KEY in .env')
    return { ok: false, error: 'Email service not configured' }
  }

  try {
    await emailjs.send(
      SERVICE_ID,
      TEMPLATE_ID,
      {
        to_email: toEmail,
        user_name: userName,
        subject,
        message,
        feedback_type: feedbackType || 'General Feedback'
      },
      { publicKey: PUBLIC_KEY }
    )
    return { ok: true }
  } catch (err) {
    console.error('Failed to send feedback email:', err)
    return { ok: false, error: err?.text || err?.message || 'Failed to send email' }
  }
}

/**
 * Sends admin's response to the user who submitted feedback.
 * Reuses the same template: subject = "Re: " + originalSubject, message = adminResponse
 */
export async function sendFeedbackResponseToUser({ toEmail, userName, originalSubject, adminResponse }) {
  if (!toEmail || !userName) return { ok: false, error: 'Missing recipient email or name' }
  return sendFeedbackConfirmation({
    toEmail,
    userName,
    subject: `Re: ${originalSubject || 'Your feedback'}`,
    message: adminResponse || '',
    feedbackType: 'Admin Response'
  })
}
