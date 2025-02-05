'use client'

import { useState, useEffect } from 'react'

export default function ReactQueryDevTools() {
  const [DevTools, setDevTools] = useState<React.ComponentType<any> | null>(null)

  useEffect(() => {
    // Only load DevTools in development
    if (process.env.NODE_ENV === 'development') {
      Promise.resolve().then(async () => {
        const { ReactQueryDevtools } = await import('@tanstack/react-query-devtools')
        setDevTools(() => ReactQueryDevtools)
      }).catch(console.error)
    }
  }, [])

  if (!DevTools) {
    return null
  }

  return <DevTools initialIsOpen={false} />
} 