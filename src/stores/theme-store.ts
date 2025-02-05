import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { type StateCreator } from 'zustand'

export type ThemeColor = 'zinc' | 'rose' | 'blue' | 'green' | 'orange' | 'purple'
export type ThemeMode = 'light' | 'dark' | 'system'
export type ThemeStyle = 'default' | 'neon' | 'minimal' | 'high-contrast'

interface ThemeState {
  mode: ThemeMode
  color: ThemeColor
  style: ThemeStyle
  setMode: (mode: ThemeMode) => void
  setColor: (color: ThemeColor) => void
  setStyle: (style: ThemeStyle) => void
}

type ThemeStore = StateCreator<
  ThemeState,
  [],
  [],
  ThemeState
>

const createThemeStore: ThemeStore = (set) => ({
  mode: 'system',
  color: 'zinc',
  style: 'default',
  setMode: (mode) => set({ mode }),
  setColor: (color) => set({ color }),
  setStyle: (style) => set({ style })
})

export const useThemeStore = create<ThemeState>()(
  persist(createThemeStore, {
    name: 'theme-store'
  })
) 