'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface ConfettiProps {
  isActive: boolean
  duration?: number
}

export function Confetti({ isActive, duration = 3000 }: ConfettiProps) {
  const [showConfetti, setShowConfetti] = React.useState(false)

  React.useEffect(() => {
    if (isActive) {
      setShowConfetti(true)
      const timer = setTimeout(() => setShowConfetti(false), duration)
      return () => clearTimeout(timer)
    }
  }, [isActive, duration])

  const confettiPieces = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    x: Math.random() * window.innerWidth,
    delay: Math.random() * 0.5,
    duration: 2 + Math.random() * 1,
    size: 4 + Math.random() * 6,
    color: ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'][
      Math.floor(Math.random() * 5)
    ],
  }))

  return (
    <AnimatePresence>
      {showConfetti && (
        <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
          {confettiPieces.map((piece) => (
            <motion.div
              key={piece.id}
              initial={{
                x: piece.x,
                y: -20,
                rotate: 0,
                opacity: 1,
              }}
              animate={{
                x: piece.x + (Math.random() - 0.5) * 200,
                y: window.innerHeight + 20,
                rotate: 360 * (Math.random() > 0.5 ? 1 : -1),
                opacity: 0,
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: piece.duration,
                delay: piece.delay,
                ease: 'linear',
              }}
              style={{
                position: 'absolute',
                width: piece.size,
                height: piece.size,
                backgroundColor: piece.color,
                borderRadius: Math.random() > 0.5 ? '50%' : '0%',
              }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  )
}
