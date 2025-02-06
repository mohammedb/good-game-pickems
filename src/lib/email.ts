import { Resend } from 'resend'

// Rate limiting configuration
const RATE_LIMIT = {
  EMAILS_PER_SECOND: 3,
  EMAILS_PER_DAY: 100,
}

// Simple in-memory rate limiting
export let emailsSentToday = 0
export let lastEmailTimestamp = 0
export let emailQueue: Array<{
  resolve: Function
  reject: Function
  params: SendEmailParams
}> = []
let resetDayTimeout: NodeJS.Timeout

// Reset daily counter at midnight UTC
const resetDailyCounter = () => {
  emailsSentToday = 0
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setUTCHours(24, 0, 0, 0)
  const timeUntilReset = tomorrow.getTime() - now.getTime()
  resetDayTimeout = setTimeout(resetDailyCounter, timeUntilReset)
}

// Initialize daily counter reset
resetDailyCounter()

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

const processEmailQueue = async () => {
  if (emailQueue.length === 0) return

  const now = Date.now()
  const timeSinceLastEmail = now - lastEmailTimestamp

  // If we've sent too many emails today, reject all queued emails
  if (emailsSentToday >= RATE_LIMIT.EMAILS_PER_DAY) {
    const error = new Error('Daily email limit exceeded')
    while (emailQueue.length > 0) {
      const { reject } = emailQueue.shift()!
      reject(error)
    }
    return
  }

  // If we haven't waited long enough since the last email, wait
  if (timeSinceLastEmail < 1000 / RATE_LIMIT.EMAILS_PER_SECOND) {
    setTimeout(
      processEmailQueue,
      1000 / RATE_LIMIT.EMAILS_PER_SECOND - timeSinceLastEmail,
    )
    return
  }

  // Process the next email in the queue
  const { resolve, reject, params } = emailQueue.shift()!
  try {
    const data = await resend.emails.send({
      from: params.from || `GGWP.no <no-reply@${new URL(SITE_URL).hostname}>`,
      to: params.to,
      subject: params.subject,
      html: params.html,
    })
    emailsSentToday++
    lastEmailTimestamp = Date.now()
    resolve({ success: true, data })
  } catch (error) {
    console.error('Error sending email:', error)
    reject({ success: false, error })
  }

  // If there are more emails in the queue, process them
  if (emailQueue.length > 0) {
    setTimeout(processEmailQueue, 1000 / RATE_LIMIT.EMAILS_PER_SECOND)
  }
}

export async function sendEmail(params: SendEmailParams) {
  return new Promise((resolve, reject) => {
    emailQueue.push({ resolve, reject, params })
    if (emailQueue.length === 1) {
      processEmailQueue()
    }
  })
}

// Cleanup function for tests/development
export function _resetEmailRateLimits() {
  if (
    process.env.NODE_ENV === 'test' ||
    process.env.NODE_ENV === 'development'
  ) {
    emailsSentToday = 0
    lastEmailTimestamp = 0
    emailQueue = []
    if (resetDayTimeout) clearTimeout(resetDayTimeout)
  }
}
