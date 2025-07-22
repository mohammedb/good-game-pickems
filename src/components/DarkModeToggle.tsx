// src/components/DarkModeToggle.tsx
'use client'

import React from 'react'
import { useTheme } from 'next-themes'

const DarkModeToggle = () => {
  const { theme, setTheme } = useTheme()

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return (
    <button
      onClick={toggleTheme}
      className="rounded bg-gray-200 p-2 focus:outline-none dark:bg-gray-700"
    >
      {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
    </button>
  )
}

export default DarkModeToggle
