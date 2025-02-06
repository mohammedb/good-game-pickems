'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import { Loader2 } from 'lucide-react'
import { z } from 'zod'

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
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClientComponentClient()
  const searchParams = useSearchParams()

  useEffect(() => {
    const handleRecoveryToken = async () => {
      const code = searchParams.get('code')

      if (!code) {
        toast({
          title: 'Feil',
          description:
            'Ugyldig eller utløpt tilbakestillingslenke. Vennligst be om en ny.',
          variant: 'destructive',
        })
        router.push('/reset-password')
        return
      }

      try {
        // Exchange the code for a session
        const { error: exchangeError } =
          await supabase.auth.exchangeCodeForSession(code)
        if (exchangeError) throw exchangeError

        // Get the session to verify the exchange worked
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (!session) throw new Error('No session after code exchange')

        // Immediately sign out - we only needed to verify the code
        await supabase.auth.signOut()
      } catch (error) {
        console.error('Recovery token error:', error)
        toast({
          title: 'Feil',
          description:
            'Ugyldig eller utløpt tilbakestillingslenke. Vennligst be om en ny.',
          variant: 'destructive',
        })
        router.push('/reset-password')
      }
    }

    handleRecoveryToken()
  }, [searchParams, router, supabase.auth, toast])

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

    if (password !== confirmPassword) {
      setError('Passordene matcher ikke')
      return
    }

    if (!validatePassword(password)) {
      return
    }

    setIsLoading(true)

    try {
      // Get the code from URL again as we might need to re-verify
      const code = searchParams.get('code')
      if (!code) {
        throw new Error('Manglende tilbakestillingskode')
      }

      // Re-exchange the code for a session
      const { error: exchangeError } =
        await supabase.auth.exchangeCodeForSession(code)
      if (exchangeError) throw exchangeError

      // Now update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      })
      if (updateError) throw updateError

      toast({
        title: 'Suksess',
        description:
          'Passordet ditt har blitt oppdatert. Vennligst logg inn med ditt nye passord.',
      })

      await supabase.auth.signOut()
      router.push('/login')
    } catch (error: any) {
      console.error('Password update error:', error)
      toast({
        title: 'Feil',
        description:
          error?.message ||
          'Kunne ikke oppdatere passordet. Vennligst prøv igjen.',
        variant: 'destructive',
      })
      if (error.message.includes('token')) {
        router.push('/reset-password')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
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
        />
        {error && (
          <p className="text-sm font-medium text-destructive">{error}</p>
        )}
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
  )
}
