'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Trophy, Calendar, User2, Menu, X, LucideIcon } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useOnboardingStore } from '@/stores/onboarding-store'
import { OnboardingTour } from './onboarding-tour'
import AuthButton from './AuthButton'
import { ThemeSwitcher } from './theme-switcher'
import { cn } from '@/utils/tailwind'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'

interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  id: string
}

const navItems: NavItem[] = [
  {
    href: '/matches',
    label: 'Matches',
    icon: Calendar,
    id: 'nav-matches'
  },
  {
    href: '/leaderboard',
    label: 'Leaderboard',
    icon: Trophy,
    id: 'nav-leaderboard'
  },
  {
    href: '/profile',
    label: 'Profile',
    icon: User2,
    id: 'nav-profile'
  }
]

interface NavLinkProps {
  href: string
  label: string
  icon: LucideIcon
  isActive: boolean
  id?: string
}

function NavLink({ href, label, icon: Icon, isActive, id }: NavLinkProps) {
  return (
    <Link
      href={href}
      id={id}
      className={cn(
        'relative px-4 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent/50',
        isActive && 'text-primary'
      )}
    >
      <span className="flex items-center gap-2 relative z-10">
        <Icon className="h-4 w-4" />
        {label}
      </span>
      {isActive && (
        <motion.div
          layoutId="activeIndicator"
          className="absolute inset-0 bg-accent rounded-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        />
      )}
    </Link>
  )
}

interface MobileNavLinkProps extends NavLinkProps {
  onClose: () => void
}

function MobileNavLink({ href, label, icon: Icon, isActive, onClose, id }: MobileNavLinkProps) {
  return (
    <motion.div
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 20, opacity: 0 }}
    >
      <Link
        href={href}
        id={id}
        onClick={onClose}
        className={cn(
          'flex items-center gap-2 px-4 py-3 text-lg rounded-lg transition-colors',
          isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
        )}
      >
        <Icon className="h-5 w-5" />
        {label}
      </Link>
    </motion.div>
  )
}

export default function Navigation() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const { hasCompletedOnboarding, startOnboarding } = useOnboardingStore()

  useEffect(() => {
    // Start onboarding after a short delay if not completed
    if (!hasCompletedOnboarding) {
      const timer = setTimeout(() => {
        startOnboarding()
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [hasCompletedOnboarding, startOnboarding])

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="sticky top-0 z-50 backdrop-blur-sm bg-background/80 w-full border-b border-b-foreground/10"
      >
        <div className="container mx-auto">
          <div className="flex h-16 items-center justify-between px-4">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center space-x-2">
                <span className="font-bold">GGWP.NO</span>
              </Link>
              <div className="hidden md:flex items-center gap-1">
                <AnimatePresence>
                  {navItems.map(({ href, label, icon, id }) => (
                    <NavLink
                      key={href}
                      href={href}
                      label={label}
                      icon={icon}
                      isActive={pathname === href}
                      id={id}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <AuthButton />
              <div id="theme-switcher">
                <ThemeSwitcher />
              </div>
              <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger className="md:hidden p-2 hover:bg-accent rounded-md" aria-label="Menu">
                  <AnimatePresence mode="wait">
                    {isOpen ? (
                      <motion.div
                        key="close"
                        initial={{ rotate: -90 }}
                        animate={{ rotate: 0 }}
                        exit={{ rotate: 90 }}
                        transition={{ duration: 0.2 }}
                      >
                        <X className="h-6 w-6" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="menu"
                        initial={{ rotate: 90 }}
                        animate={{ rotate: 0 }}
                        exit={{ rotate: -90 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Menu className="h-6 w-6" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] sm:w-[400px] p-0">
                  <nav className="flex flex-col gap-2 p-6">
                    <AnimatePresence>
                      {navItems.map(({ href, label, icon, id }, i) => (
                        <motion.div
                          key={href}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ delay: i * 0.1 }}
                        >
                          <MobileNavLink
                            href={href}
                            label={label}
                            icon={icon}
                            isActive={pathname === href}
                            onClose={() => setIsOpen(false)}
                            id={id}
                          />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </motion.nav>
      <OnboardingTour />
    </>
  )
} 