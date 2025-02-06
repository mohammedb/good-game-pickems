import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const report = await request.json()

    // Log CSP violation report to console
    console.log('CSP Violation:', {
      blockedUri: report['csp-report']?.['blocked-uri'],
      violatedDirective: report['csp-report']?.['violated-directive'],
      documentUri: report['csp-report']?.['document-uri'],
      originalPolicy: report['csp-report']?.['original-policy'],
      timestamp: new Date().toISOString(),
    })

    // Return 204 No Content
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error processing CSP report:', error)
    return new NextResponse(null, { status: 400 })
  }
}
