import { Resend } from 'resend'

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY is not defined')
}

// Make sure we use the correct site URL with www and https
const SITE_URL =
  process.env.NODE_ENV === 'production'
    ? 'https://www.ggwp.no'
    : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

const resend = new Resend(process.env.RESEND_API_KEY)

type SendEmailParams = {
  to: string
  subject: string
  html: string
  from?: string
}

export async function sendEmail({
  to,
  subject,
  html,
  from = `GGWP.no <no-reply@${new URL(SITE_URL).hostname}>`,
}: SendEmailParams) {
  try {
    const data = await resend.emails.send({
      from,
      to,
      subject,
      html,
    })
    return { success: true, data }
  } catch (error) {
    console.error('Error sending email:', error)
    return { success: false, error }
  }
}
