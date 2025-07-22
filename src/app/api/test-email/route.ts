import { NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'
import { renderEmail, WelcomeEmail } from '@/lib/email-templates'

export async function GET() {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Not available in production' },
      { status: 403 },
    )
  }

  try {
    // Check if RESEND_API_KEY exists
    const hasApiKey = !!process.env.RESEND_API_KEY

    if (!hasApiKey) {
      return NextResponse.json(
        {
          error: 'RESEND_API_KEY is not set in environment variables',
          instruction: 'Please add RESEND_API_KEY to your .env.local file',
        },
        { status: 500 },
      )
    }

    // Try to send a test email
    const testEmail = 'test@example.com'
    const html = await renderEmail(
      WelcomeEmail({
        username: 'TestUser',
        verificationUrl: 'http://localhost:3000/test',
      }),
    )

    const result = await sendEmail({
      to: testEmail,
      subject: 'Test Email from GGWP.no',
      html,
    })

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully',
      result,
      apiKeyLength: process.env.RESEND_API_KEY.length,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to send test email',
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
