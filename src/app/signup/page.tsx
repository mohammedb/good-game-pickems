'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { signUp } from './actions'
import { PasswordRequirements } from '@/components/password-requirements'

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

function SignUpForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [isVerificationPending, setIsVerificationPending] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
  })
  const { toast } = useToast()
  const router = useRouter()

  const validateUsername = (username: string) => {
    const regex = /^[a-zA-Z0-9_-]{3,20}$/
    return regex.test(username)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!validateUsername(formData.username)) {
      toast({
        title: 'Ugyldig brukernavn',
        description:
          'Brukernavn må være 3-20 tegn og kan kun inneholde bokstaver, tall, understrek og bindestrek',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)

    try {
      const formDataObj = new FormData()
      formDataObj.append('email', formData.email)
      formDataObj.append('password', formData.password)
      formDataObj.append('username', formData.username)

      const result = await signUp(formDataObj)

      if (result.error) {
        toast({
          title: 'Feil',
          description:
            result.error === 'Username is already taken'
              ? 'Brukernavnet er allerede i bruk'
              : result.error,
          variant: 'destructive',
        })
        return
      }

      setIsVerificationPending(true)
      toast({
        title: 'Konto opprettet!',
        description: 'Sjekk e-posten din for å verifisere kontoen.',
        variant: 'default',
      })
      setFormData({
        email: '',
        password: '',
        username: '',
      })
    } catch (error) {
      console.error('Signup error:', error)
      toast({
        title: 'Feil',
        description: 'Kunne ikke opprette konto. Vennligst prøv igjen senere.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isVerificationPending) {
    return (
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="w-full max-w-sm space-y-6 text-center"
      >
        <motion.div variants={item} className="space-y-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="mb-6 text-6xl"
          >
            📧
          </motion.div>
          <motion.h2 variants={item} className="text-2xl font-semibold">
            Sjekk e-posten din
          </motion.h2>
          <motion.p variants={item} className="text-muted-foreground">
            Vi har sendt deg en verifiseringslenke. Vennligst sjekk e-posten din
            og verifiser kontoen din.
          </motion.p>
          <motion.p variants={item} className="text-sm text-muted-foreground">
            Etter verifisering kan du logge inn og begynne å bruke GGWP.NO!
          </motion.p>
        </motion.div>
      </motion.div>
    )
  }

  return (
    <motion.form
      variants={container}
      initial="hidden"
      animate="show"
      className="w-full max-w-sm space-y-6"
      onSubmit={handleSubmit}
    >
      <motion.div variants={item} className="space-y-2">
        <Input
          type="text"
          placeholder="Brukernavn"
          value={formData.username}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData({ ...formData, username: e.target.value })
          }
          className="h-11"
          required
          minLength={3}
          maxLength={20}
        />
      </motion.div>
      <motion.div variants={item} className="space-y-2">
        <Input
          type="email"
          placeholder="E-post"
          value={formData.email}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData({ ...formData, email: e.target.value })
          }
          className="h-11"
          required
        />
      </motion.div>
      <motion.div variants={item} className="space-y-2">
        <Input
          type="password"
          placeholder="Passord"
          value={formData.password}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData({ ...formData, password: e.target.value })
          }
          className="h-11"
          required
          minLength={8}
        />
        <AnimatePresence>
          {formData.password && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <PasswordRequirements password={formData.password} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      <motion.div variants={item}>
        <Button
          type="submit"
          className="relative h-11 w-full overflow-hidden"
          disabled={isLoading}
        >
          {isLoading ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 flex items-center justify-center"
            >
              ⚡
            </motion.div>
          ) : (
            'Opprett konto'
          )}
        </Button>
      </motion.div>
      <motion.p
        variants={item}
        className="text-center text-sm text-muted-foreground"
      >
        Har du allerede en konto?{' '}
        <Link href="/login" className="text-primary hover:underline">
          Logg inn
        </Link>
      </motion.p>
    </motion.form>
  )
}

export default function SignUpPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      {/* Animated background */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-background via-accent to-background opacity-50"
        animate={{
          backgroundPosition: ['0% 0%', '100% 100%'],
          backgroundSize: '400% 400%',
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          repeatType: 'reverse',
          ease: 'linear',
        }}
      />

      <Card className="relative w-full max-w-lg bg-background/95 p-8 backdrop-blur-sm">
        <AnimatePresence mode="wait">
          <motion.div
            key="signup"
            className="flex flex-col items-center space-y-6"
            {...fadeIn}
          >
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <h1 className="mb-2 text-3xl font-bold">
                Velkommen til GGWP.NO!
              </h1>
              <p className="text-muted-foreground">
                Opprett en konto for å begynne å spille
              </p>
            </motion.div>
            <SignUpForm />
          </motion.div>
        </AnimatePresence>
      </Card>
    </div>
  )
}
