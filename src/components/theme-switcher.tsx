'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Moon, Sun, Laptop, Palette } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useThemeStore, type ThemeColor, type ThemeStyle, type ThemeMode } from '@/stores/theme-store'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem
} from '@/components/ui/dropdown-menu'

const themeColors: { value: ThemeColor; label: string; description: string }[] = [
  { value: 'zinc', label: 'Neutral', description: 'Default grayscale theme' },
  { value: 'rose', label: 'Rose', description: 'Warm pink accents' },
  { value: 'blue', label: 'Blue', description: 'Cool blue accents' },
  { value: 'green', label: 'Green', description: 'Natural green accents' },
  { value: 'orange', label: 'Orange', description: 'Vibrant orange accents' },
  { value: 'purple', label: 'Purple', description: 'Rich purple accents' }
]

const themeStyles: { value: ThemeStyle; label: string; description: string }[] = [
  { value: 'default', label: 'Default', description: 'Standard interface style' },
  { value: 'neon', label: 'Neon', description: 'Vibrant with glowing effects' },
  { value: 'minimal', label: 'Minimal', description: 'Clean and simplified' },
  { value: 'high-contrast', label: 'High Contrast', description: 'Maximum readability' }
]

const themeModes: { value: ThemeMode; label: string; icon: typeof Sun; description: string }[] = [
  { value: 'light', label: 'Light', icon: Sun, description: 'Light mode for daytime use' },
  { value: 'dark', label: 'Dark', icon: Moon, description: 'Dark mode for low-light conditions' },
  { value: 'system', label: 'System', icon: Laptop, description: 'Follows your system preferences' }
]

export function ThemeSwitcher() {
  const { setTheme } = useTheme()
  const { mode, color, style, setMode, setColor, setStyle } = useThemeStore()
  const [isOpen, setIsOpen] = React.useState(false)
  const [activeSubmenu, setActiveSubmenu] = React.useState<string | null>(null)

  const Icon = React.useMemo(
    () => themeModes.find((t) => t.value === mode)?.icon || Sun,
    [mode]
  )

  const handleModeChange = React.useCallback((value: string) => {
    const newMode = value as ThemeMode
    setMode(newMode)
    setTheme(newMode)
  }, [setMode, setTheme])

  const handleColorChange = React.useCallback((value: string) => {
    setColor(value as ThemeColor)
  }, [setColor])

  const handleStyleChange = React.useCallback((value: string) => {
    setStyle(value as ThemeStyle)
  }, [setStyle])

  const handleKeyDown = React.useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setIsOpen(false)
      setActiveSubmenu(null)
    }
  }, [])

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 md:h-10 md:w-10"
          aria-label="Change theme"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, rotate: -30 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: 30 }}
              transition={{ duration: 0.2 }}
              className="flex items-center justify-center"
            >
              <Icon className="h-5 w-5 md:h-6 md:w-6" />
              <motion.div
                className="absolute right-1 top-1"
                initial={false}
                animate={{
                  scale: isOpen ? 1 : 0,
                  opacity: isOpen ? 1 : 0
                }}
              >
                <Palette className="h-3 w-3" aria-hidden="true" />
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[240px] md:w-[280px]"
        onKeyDown={handleKeyDown}
        onCloseAutoFocus={() => setActiveSubmenu(null)}
      >
        <DropdownMenuLabel>Appearance</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={mode} onValueChange={handleModeChange}>
          {themeModes.map(({ value, label, icon: Icon, description }) => (
            <DropdownMenuRadioItem
              key={value}
              value={value}
              className="cursor-pointer"
              onFocus={() => setActiveSubmenu('mode')}
            >
              <Icon className="mr-2 h-4 w-4" aria-hidden="true" />
              <div className="flex flex-col">
                <span>{label}</span>
                <span className="text-xs text-muted-foreground">{description}</span>
              </div>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger
            onFocus={() => setActiveSubmenu('color')}
            aria-label="Select theme color"
          >
            <Palette className="mr-2 h-4 w-4" aria-hidden="true" />
            <span>Color</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup value={color} onValueChange={handleColorChange}>
              {themeColors.map(({ value, label, description }) => (
                <DropdownMenuRadioItem
                  key={value}
                  value={value}
                  className="cursor-pointer"
                >
                  <div className="mr-2 h-4 w-4 rounded-full bg-primary" aria-hidden="true" />
                  <div className="flex flex-col">
                    <span>{label}</span>
                    <span className="text-xs text-muted-foreground">{description}</span>
                  </div>
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger
            onFocus={() => setActiveSubmenu('style')}
            aria-label="Select theme style"
          >
            <span className="mr-2 flex h-4 w-4 items-center justify-center" aria-hidden="true">
              <span className="h-2 w-2 rounded-sm bg-primary" />
            </span>
            <span>Style</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup value={style} onValueChange={handleStyleChange}>
              {themeStyles.map(({ value, label, description }) => (
                <DropdownMenuRadioItem
                  key={value}
                  value={value}
                  className="cursor-pointer"
                >
                  <div className="flex flex-col">
                    <span>{label}</span>
                    <span className="text-xs text-muted-foreground">{description}</span>
                  </div>
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 