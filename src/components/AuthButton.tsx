'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { createBrowserClient } from '@/utils/supabase'
import { signOut } from './auth/auth-actions'
import { useToast } from '@/components/ui/use-toast'
import { useUserStore } from '@/stores/user-store'

export default function AuthButton() {
  const [isSigningOut, setIsSigningOut] = useState(false)
  const router = useRouter()
  const supabase = createBrowserClient()
  const { toast } = useToast()
  const { user, profile, isLoading, fetchUser } = useUserStore()

  useEffect(() => {
    fetchUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchUser()
      } else {
        useUserStore.setState({ user: null, profile: null })
      }
      router.refresh()
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, router, fetchUser])

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true)
      const result = await signOut()

      if (result.error) {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive'
        })
        return
      }

      router.push('/login')
      router.refresh()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to sign out. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsSigningOut(false)
    }
  }

  if (isLoading) {
    return <Button variant="ghost" disabled>Loading...</Button>
  }

  if (!user) {
    return (
      <Link href="/login">
        <Button variant="outline">Sign In</Button>
      </Link>
    )
  }

  return (
    <div className="flex items-center gap-4">
      <span className="text-sm text-muted-foreground hidden md:inline">
        {profile?.username || profile?.email}
      </span>
      <form action={handleSignOut}>
        <Button variant="outline" type="submit" disabled={isSigningOut}>
          {isSigningOut ? 'Signing out...' : 'Sign Out'}
        </Button>
      </form>
    </div>
  )
}
