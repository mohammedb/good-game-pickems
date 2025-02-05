'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Moon, Sun, Laptop, EyeOff } from 'lucide-react'
import { useThemeStore, type ThemeMode, type ThemeStyle } from '@/stores/theme-store'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem
} from '@/components/ui/dropdown-menu'

const themeModes: { value: ThemeMode; label: string; icon: typeof Sun; description: string }[] = [
  { value: 'light', label: 'Light', icon: Sun, description: 'Light mode for daytime use' },
  { value: 'dark', label: 'Dark', icon: Moon, description: 'Dark mode for low-light conditions' },
  { value: 'system', label: 'System', icon: Laptop, description: 'Follows your system preferences' }
]

const themeStyles: { value: ThemeStyle; label: string; icon: typeof Sun; description: string }[] = [
  { value: 'default', label: 'Default', icon: Sun, description: 'Standard interface style' },
  { value: 'high-contrast', label: 'High Contrast', icon: EyeOff, description: 'Maximum readability' }
]

export function ThemeSwitcher() {
  const { mode, style, setMode, setStyle } = useThemeStore()
  const [isOpen, setIsOpen] = React.useState(false)

  const Icon = React.useMemo(
    () => themeModes.find((t) => t.value === mode)?.icon || Sun,
    [mode]
  )

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
            >
              <Icon className="h-5 w-5 md:h-6 md:w-6" />
            </motion.div>
          </AnimatePresence>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[240px]">
        <DropdownMenuLabel>Appearance</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuLabel className="text-xs text-muted-foreground">Mode</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={mode} onValueChange={(value) => setMode(value as ThemeMode)}>
          {themeModes.map(({ value, label, icon: Icon, description }) => (
            <DropdownMenuRadioItem
              key={value}
              value={value}
              className="cursor-pointer"
            >
              <Icon className="mr-2 h-4 w-4" />
              <div className="flex flex-col">
                <span>{label}</span>
                <span className="text-xs text-muted-foreground">{description}</span>
              </div>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>

        <DropdownMenuSeparator />
        
        <DropdownMenuLabel className="text-xs text-muted-foreground">Style</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={style} onValueChange={(value) => setStyle(value as ThemeStyle)}>
          {themeStyles.map(({ value, label, icon: Icon, description }) => (
            <DropdownMenuRadioItem
              key={value}
              value={value}
              className="cursor-pointer"
            >
              <Icon className="mr-2 h-4 w-4" />
              <div className="flex flex-col">
                <span>{label}</span>
                <span className="text-xs text-muted-foreground">{description}</span>
              </div>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 