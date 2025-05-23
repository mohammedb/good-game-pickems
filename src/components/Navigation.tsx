'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  Trophy,
  Calendar,
  User2,
  Menu,
  X,
  LucideIcon,
  Users,
} from 'lucide-react'
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
    label: 'Kamper',
    icon: Calendar,
    id: 'nav-matches',
  },
  {
    href: '/leaderboard',
    label: 'Toppliste',
    icon: Trophy,
    id: 'nav-leaderboard',
  },
  {
    href: '/profile',
    label: 'Profil',
    icon: User2,
    id: 'nav-profile',
  },
  {
    href: '/om-oss',
    label: 'Om Oss',
    icon: Users,
    id: 'nav-about',
  },
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
        'relative rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent/50',
        isActive && 'text-primary',
      )}
    >
      <span className="relative z-10 flex items-center gap-2">
        <Icon className="h-4 w-4" />
        {label}
      </span>
      {isActive && (
        <motion.div
          layoutId="activeIndicator"
          className="absolute inset-0 rounded-md bg-accent"
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

function MobileNavLink({
  href,
  label,
  icon: Icon,
  isActive,
  onClose,
  id,
}: MobileNavLinkProps) {
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
          'flex items-center gap-2 rounded-lg px-4 py-3 text-lg transition-colors',
          isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-accent',
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
        className="sticky top-0 z-50 w-full border-b border-b-foreground/10 bg-background/80 backdrop-blur-sm"
      >
        <div className="container mx-auto">
          <div className="flex h-16 items-center justify-between px-4">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center space-x-2">
                <span className="font-bold">GGWP.NO</span>
              </Link>
              <div className="hidden items-center gap-1 md:flex">
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
                <SheetTrigger
                  className="rounded-md p-2 hover:bg-accent md:hidden"
                  aria-label="Menu"
                >
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
                <SheetContent
                  side="right"
                  className="w-[300px] p-0 sm:w-[400px]"
                >
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
