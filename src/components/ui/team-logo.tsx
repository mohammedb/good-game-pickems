import * as React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/utils/tailwind'
import { Loader2 } from 'lucide-react'

interface TeamLogoProps {
  src: string
  alt: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
  interactive?: boolean
}

export function TeamLogo({
  src,
  alt,
  size = 'md',
  className,
  interactive = false
}: TeamLogoProps) {
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState(false)

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  }

  return (
    <motion.div
      className={cn(
        'relative flex items-center justify-center rounded-full bg-accent/50',
        sizeClasses[size],
        interactive && 'cursor-pointer',
        className
      )}
      whileHover={interactive ? {
        scale: 1.05,
        rotate: [0, -5, 5, 0],
        transition: { duration: 0.3 }
      } : undefined}
      whileTap={interactive ? { scale: 0.95 } : undefined}
    >
      {isLoading && !error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </motion.div>
      )}
      
      <motion.img
        src={src}
        alt={alt}
        className={cn(
          'rounded-full object-contain',
          error ? 'hidden' : 'block',
          isLoading ? 'opacity-0' : 'opacity-100'
        )}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ 
          opacity: isLoading ? 0 : 1, 
          scale: isLoading ? 0.8 : 1,
          rotate: interactive ? [0, 360] : 0
        }}
        transition={{
          duration: 0.3,
          rotate: { duration: 0.8, ease: 'easeOut' }
        }}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false)
          setError(true)
        }}
      />

      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex h-full w-full items-center justify-center rounded-full bg-accent text-accent-foreground"
        >
          {alt.split(' ').map(word => word[0]).join('')}
        </motion.div>
      )}
    </motion.div>
  )
} 