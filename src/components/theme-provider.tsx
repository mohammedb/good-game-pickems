'use client'

import * as React from 'react'
import { useThemeStore } from '@/stores/theme-store'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { mode, style } = useThemeStore()

  React.useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')

    if (mode === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      root.classList.add(systemTheme)
    } else {
      root.classList.add(mode)
    }

    // Apply style
    root.classList.remove('default', 'high-contrast')
    root.classList.add(style)
  }, [mode, style])

  return <>{children}</>
} 