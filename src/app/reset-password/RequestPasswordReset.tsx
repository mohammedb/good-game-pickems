'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

const ERROR_MESSAGES = {
  InvalidEmail: 'E-postadressen er ikke gyldig.',
  RateLimitExceeded:
    'For mange forsøk. Vennligst vent litt før du prøver igjen.',
  NetworkError: 'Nettverksfeil. Sjekk internettforbindelsen din og prøv igjen.',
  default: 'Kunne ikke sende tilbakestillingslenke. Vennligst prøv igjen.',
}

export function RequestPasswordReset() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showInstructions, setShowInstructions] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setShowInstructions(false)

    try {
      // Validate email format
      if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        throw new Error('InvalidEmail')
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password/update`,
        captchaToken: undefined, // Explicitly set to undefined to avoid PKCE issues
      })

      if (error) {
        // Handle specific Supabase errors
        if (error.message.includes('rate limit')) {
          throw new Error('RateLimitExceeded')
        }
        throw error
      }

      setShowInstructions(true)
      toast({
        title: 'Sjekk e-posten din',
        description:
          'Hvis en konto eksisterer med denne e-postadressen, vil du motta en lenke for å tilbakestille passordet. Sjekk spam-mappen hvis du ikke ser den.',
      })

      // Delay the redirect to give user time to read the message
      setTimeout(() => {
        router.push('/login')
      }, 5000) // Increased to 5 seconds for better readability
    } catch (error: any) {
      console.error('Password reset error:', error)
      const errorMessage =
        ERROR_MESSAGES[error.message as keyof typeof ERROR_MESSAGES] ||
        (error.message === 'NetworkError'
          ? ERROR_MESSAGES.NetworkError
          : ERROR_MESSAGES.default)

      toast({
        title: 'Feil',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Input
            type="email"
            placeholder="Skriv inn e-postadressen din"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
            className="h-11"
            aria-label="E-postadresse"
          />
          {!isLoading && !showInstructions && (
            <p className="text-sm text-muted-foreground">
              Skriv inn e-postadressen din for å motta en lenke for å
              tilbakestille passordet.
            </p>
          )}
        </div>
        <Button type="submit" className="h-11 w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sender tilbakestillingslenke...
            </>
          ) : (
            'Send tilbakestillingslenke'
          )}
        </Button>
      </form>

      {showInstructions && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="ml-2">
            Vi har sendt en e-post med instruksjoner hvis kontoen eksisterer.
            <br />
            • Sjekk innboksen din og spam-mappen
            <br />
            • Lenken er gyldig i 24 timer
            <br />• Du blir omdirigert til innloggingssiden om noen sekunder
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
