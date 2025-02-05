import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemeMode = 'light' | 'dark' | 'system'
export type ThemeStyle = 'default' | 'high-contrast'

interface ThemeState {
  mode: ThemeMode
  style: ThemeStyle
  setMode: (mode: ThemeMode) => void
  setStyle: (style: ThemeStyle) => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: 'system',
      style: 'default',
      setMode: (mode) => set({ mode }),
      setStyle: (style) => set({ style })
    }),
    {
      name: 'theme-store'
    }
  )
) 