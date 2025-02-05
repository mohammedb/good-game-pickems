'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { useThemeStore } from '@/stores/theme-store'

const themeStyleVariables = {
  default: {},
  neon: {
    '--primary': 'hsl(var(--primary-neon))',
    '--ring': 'hsl(var(--primary-neon))',
    '--background': 'hsl(var(--background-neon))',
    '--foreground': 'hsl(var(--foreground-neon))',
    '--card': 'hsl(var(--card-neon))',
    '--card-foreground': 'hsl(var(--card-foreground-neon))',
    '--popover': 'hsl(var(--popover-neon))',
    '--popover-foreground': 'hsl(var(--popover-foreground-neon))',
    '--primary-foreground': 'hsl(var(--primary-foreground-neon))',
    '--secondary': 'hsl(var(--secondary-neon))',
    '--secondary-foreground': 'hsl(var(--secondary-foreground-neon))',
    '--muted': 'hsl(var(--muted-neon))',
    '--muted-foreground': 'hsl(var(--muted-foreground-neon))',
    '--accent': 'hsl(var(--accent-neon))',
    '--accent-foreground': 'hsl(var(--accent-foreground-neon))',
    '--destructive': 'hsl(var(--destructive-neon))',
    '--destructive-foreground': 'hsl(var(--destructive-foreground-neon))',
    '--border': 'hsl(var(--border-neon))',
    '--input': 'hsl(var(--input-neon))',
    '--radius': 'calc(var(--radius-neon) * 1px)'
  },
  minimal: {
    '--radius': '2px',
    '--border': 'hsl(var(--border-minimal))',
    '--ring': 'hsl(var(--border-minimal))'
  },
  'high-contrast': {
    '--primary': 'hsl(var(--primary-high-contrast))',
    '--background': 'hsl(var(--background-high-contrast))',
    '--foreground': 'hsl(var(--foreground-high-contrast))',
    '--muted': 'hsl(var(--muted-high-contrast))',
    '--muted-foreground': 'hsl(var(--muted-foreground-high-contrast))',
    '--border': 'hsl(var(--border-high-contrast))'
  }
}

const themeColorVariables = {
  zinc: {},
  rose: {
    '--primary': 'hsl(346 77% 49.8%)',
    '--primary-foreground': 'hsl(355.7 100% 97.3%)'
  },
  blue: {
    '--primary': 'hsl(221.2 83.2% 53.3%)',
    '--primary-foreground': 'hsl(210 40% 98%)'
  },
  green: {
    '--primary': 'hsl(142.1 76.2% 36.3%)',
    '--primary-foreground': 'hsl(355.7 100% 97.3%)'
  },
  orange: {
    '--primary': 'hsl(24.6 95% 53.1%)',
    '--primary-foreground': 'hsl(355.7 100% 97.3%)'
  },
  purple: {
    '--primary': 'hsl(262.1 83.3% 57.8%)',
    '--primary-foreground': 'hsl(210 40% 98%)'
  }
}

export function ThemeProvider({
  children,
  ...props
}: {
  children: React.ReactNode
}) {
  const { mode, color, style } = useThemeStore()

  React.useEffect(() => {
    const root = document.documentElement
    const variables = {
      ...themeColorVariables[color],
      ...themeStyleVariables[style]
    }

    // Apply theme variables with transition
    root.style.transition = 'background-color 0.3s ease, color 0.3s ease'
    Object.entries(variables).forEach(([key, value]) => {
      root.style.setProperty(key, value)
    })

    // Clean up transition after it's done
    const timer = setTimeout(() => {
      root.style.transition = ''
    }, 300)

    return () => {
      clearTimeout(timer)
      root.style.transition = ''
    }
  }, [color, style])

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme={mode}
      enableSystem
      disableTransitionOnChange={false}
      {...props}
    >
      {children}
    </NextThemesProvider>
  )
} 