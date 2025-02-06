import { Metadata } from 'next'
import { UpdatePassword } from './UpdatePassword'

export const metadata: Metadata = {
  title: 'Oppdater Passord - GGWP.no',
  description: 'Sett ditt nye passord',
}

// This makes the route dynamic and prevents static page generation
export const dynamic = 'force-dynamic'

export default function UpdatePasswordPage() {
  return (
    <div className="container flex min-h-[50vh] max-w-lg flex-col items-center justify-center py-8">
      <div className="w-full space-y-6 rounded-lg border bg-card px-4 py-8">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Oppdater Passord
          </h1>
          <p className="text-sm text-muted-foreground">
            Skriv inn ditt nye passord nedenfor.
          </p>
        </div>
        <UpdatePassword />
      </div>
    </div>
  )
}
