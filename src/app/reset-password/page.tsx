import { Metadata } from 'next'
import { RequestPasswordReset } from './RequestPasswordReset'

export const metadata: Metadata = {
  title: 'Reset Password - GGWP.no',
  description: 'Reset your password for GGWP.no',
}

export default function ResetPasswordPage() {
  return (
    <div className="container flex min-h-[50vh] max-w-lg flex-col items-center justify-center py-8">
      <div className="w-full space-y-6 rounded-lg border bg-card px-4 py-8">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Reset Password
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter your email address and we&apos;ll send you a link to reset
            your password.
          </p>
        </div>
        <RequestPasswordReset />
      </div>
    </div>
  )
}
