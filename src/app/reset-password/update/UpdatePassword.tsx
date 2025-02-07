'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, Check, X } from 'lucide-react'
import { z } from 'zod'

const ERROR_MESSAGES = {
  TokenExpired: 'Tilbakestillingslenken har utløpt. Vennligst be om en ny.',
  TokenInvalid: 'Ugyldig tilbakestillingslenke. Vennligst be om en ny.',
  TokenMissing: 'Ingen tilbakestillingslenke funnet. Vennligst be om en ny.',
  NetworkError: 'Nettverksfeil. Sjekk internettforbindelsen din og prøv igjen.',
  PasswordMismatch: 'Passordene matcher ikke.',
  SessionError: 'Kunne ikke validere sesjonen. Vennligst prøv igjen.',
  default: 'Kunne ikke oppdatere passordet. Vennligst prøv igjen.',
}

interface PasswordRequirements {
  length: boolean
  uppercase: boolean
  lowercase: boolean
  number: boolean
}

const PASSWORD_REQUIREMENTS = [
  { id: 'length' as const, label: 'Minst 8 tegn', regex: /.{8,}/ },
  { id: 'uppercase' as const, label: 'Minst én stor bokstav', regex: /[A-Z]/ },
  { id: 'lowercase' as const, label: 'Minst én liten bokstav', regex: /[a-z]/ },
  { id: 'number' as const, label: 'Minst ett tall', regex: /[0-9]/ },
]

const passwordSchema = z.object({
  password: z
    .string()
    .min(8, 'Passordet må være minst 8 tegn')
    .regex(/[A-Z]/, 'Passordet må inneholde minst én stor bokstav')
    .regex(/[a-z]/, 'Passordet må inneholde minst én liten bokstav')
    .regex(/[0-9]/, 'Passordet må inneholde minst ett tall'),
})

export function UpdatePassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isTokenValid, setIsTokenValid] = useState(false)
  const [requirements, setRequirements] = useState<PasswordRequirements>({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
  })
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClientComponentClient()
  const searchParams = useSearchParams()

  // Handle the recovery token exchange
  useEffect(() => {
    let mounted = true
    const handleRecoveryToken = async () => {
      try {
        const code = searchParams.get('code')

        if (!code) {
          throw new Error('TokenInvalid')
        }

        // Try to get the existing session first
        const {
          data: { session: existingSession },
        } = await supabase.auth.getSession()

        if (!existingSession) {
          // Exchange the recovery code for a session
          const { data, error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(code)

          if (exchangeError) {
            if (exchangeError.message.includes('expired')) {
              throw new Error('TokenExpired')
            }
            throw exchangeError
          }

          // Verify the session was created
          const {
            data: { session: newSession },
          } = await supabase.auth.getSession()
          if (!newSession) {
            throw new Error('SessionError')
          }
        }

        if (mounted) {
          setIsTokenValid(true)
        }
      } catch (error: any) {
        console.error('Token validation error:', error)
        const errorMessage =
          ERROR_MESSAGES[error.message as keyof typeof ERROR_MESSAGES] ||
          ERROR_MESSAGES.default
        toast({
          title: 'Feil',
          description: errorMessage,
          variant: 'destructive',
        })
        router.push('/reset-password')
      }
    }

    handleRecoveryToken()
    return () => {
      mounted = false
    }
  }, [searchParams, router, supabase.auth, toast])

  // Check password requirements in real-time
  useEffect(() => {
    const newRequirements: PasswordRequirements = {
      length: /.{8,}/.test(password),
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
    }
    setRequirements(newRequirements)
  }, [password])

  const validatePassword = (password: string) => {
    try {
      passwordSchema.parse({ password })
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        setError(error.errors[0].message)
      }
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!isTokenValid) {
      toast({
        title: 'Feil',
        description: ERROR_MESSAGES.SessionError,
        variant: 'destructive',
      })
      return
    }

    if (password !== confirmPassword) {
      setError(ERROR_MESSAGES.PasswordMismatch)
      return
    }

    if (!validatePassword(password)) {
      return
    }

    setIsLoading(true)

    try {
      // Get the current session
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        throw new Error('SessionError')
      }

      // Update the user's password
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      })

      if (updateError) {
        throw updateError
      }

      toast({
        title: 'Suksess',
        description:
          'Passordet ditt har blitt oppdatert. Vennligst logg inn med ditt nye passord.',
      })

      // Sign out and redirect
      await supabase.auth.signOut()
      router.push('/login')
    } catch (error: any) {
      console.error('Password update error:', error)
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

      if (error.message === 'SessionError') {
        router.push('/reset-password')
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (!isTokenValid) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Input
            type="password"
            placeholder="Nytt passord"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              setError('')
            }}
            required
            disabled={isLoading}
            aria-label="Nytt passord"
          />
          <Input
            type="password"
            placeholder="Bekreft nytt passord"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value)
              setError('')
            }}
            required
            disabled={isLoading}
            aria-label="Bekreft nytt passord"
          />
          {error && (
            <p className="text-sm font-medium text-destructive">{error}</p>
          )}
        </div>

        <div className="space-y-2 rounded-lg border bg-muted/50 p-4">
          <p className="text-sm font-medium">Passordkrav:</p>
          <ul className="space-y-2">
            {PASSWORD_REQUIREMENTS.map((req) => (
              <li key={req.id} className="flex items-center text-sm">
                {requirements[req.id] ? (
                  <Check className="mr-2 h-4 w-4 text-green-500" />
                ) : (
                  <X className="mr-2 h-4 w-4 text-destructive" />
                )}
                {req.label}
              </li>
            ))}
          </ul>
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Oppdaterer Passord
            </>
          ) : (
            'Oppdater Passord'
          )}
        </Button>
      </form>
    </div>
  )
}
