'use client'

import { useState } from 'react'
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
      const code = searchParams.get('code')
      if (!code) {
        throw new Error('Manglende tilbakestillingskode')
      }

      // Exchange the recovery token for a session
      const { error: exchangeError } =
        await supabase.auth.exchangeCodeForSession(code)
      if (exchangeError) throw exchangeError

      // Update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      })

      if (updateError) throw updateError

      toast({
        title: 'Suksess',
        description:
          'Passordet ditt har blitt oppdatert. Vennligst logg inn med ditt nye passord.',
      })

      // Make sure we're signed out
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
      if (error.message.includes('token') || error.message.includes('code')) {
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
