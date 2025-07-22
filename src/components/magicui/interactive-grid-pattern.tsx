'use client'

import { cn } from '@/lib/utils'
import React, { useRef, useState, useCallback } from 'react'

interface InteractiveGridPatternProps {
  width?: number
  height?: number
  className?: string
  maxOpacity?: number
}

export function InteractiveGridPattern({
  width = 40,
  height = 40,
  className,
  maxOpacity = 0.5,
}: InteractiveGridPatternProps) {
  const patternRef = useRef<HTMLDivElement>(null)
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 })

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!patternRef.current) return
    const rect = patternRef.current.getBoundingClientRect()
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
  }, [])

  const handleMouseLeave = useCallback(() => {
    setMousePos({ x: -1000, y: -1000 })
  }, [])

  // Generate grid squares based on container size
  const cols = 50 // Number of columns
  const rows = 20 // Number of rows

  return (
    <div
      ref={patternRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn('absolute inset-0', className)}
    >
      {/* Background grid pattern */}
      <svg className="absolute inset-0 h-full w-full">
        <defs>
          <pattern
            id="grid"
            width={width}
            height={height}
            patternUnits="userSpaceOnUse"
          >
            <path
              d={`M ${width} 0 L 0 0 0 ${height}`}
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              className="opacity-10"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Interactive squares */}
      <div className="absolute inset-0">
        {Array.from({ length: rows }, (_, row) =>
          Array.from({ length: cols }, (_, col) => {
            const x = col * width + width / 2
            const y = row * height + height / 2
            const distance = Math.sqrt(
              Math.pow(mousePos.x - x, 2) + Math.pow(mousePos.y - y, 2),
            )
            const opacity = Math.max(0, 1 - distance / 150) * maxOpacity

            return (
              <div
                key={`${row}-${col}`}
                className="absolute transition-opacity duration-300 ease-out"
                style={{
                  left: col * width,
                  top: row * height,
                  width,
                  height,
                  backgroundColor: 'hsl(var(--brand-cyan))',
                  opacity,
                }}
              />
            )
          }),
        )}
      </div>
    </div>
  )
}
