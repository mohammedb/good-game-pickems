import { cn } from '@/lib/utils'
import { Check, X } from 'lucide-react'

interface PasswordRequirementsProps {
  password: string
}

export function PasswordRequirements({ password }: PasswordRequirementsProps) {
  const requirements = [
    {
      text: 'At least 8 characters long',
      test: (pass: string) => pass.length >= 8,
    },
    {
      text: 'Contains an uppercase letter',
      test: (pass: string) => /[A-Z]/.test(pass),
    },
    {
      text: 'Contains a lowercase letter',
      test: (pass: string) => /[a-z]/.test(pass),
    },
    {
      text: 'Contains a number',
      test: (pass: string) => /[0-9]/.test(pass),
    },
  ]

  return (
    <div className="mt-2 space-y-2 text-sm">
      {requirements.map((req, index) => {
        const isMet = req.test(password)
        return (
          <div
            key={index}
            className={cn(
              'flex items-center gap-2 transition-colors duration-200',
              isMet
                ? 'text-green-600 dark:text-green-400'
                : 'text-muted-foreground',
            )}
          >
            {isMet ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
            <span>{req.text}</span>
          </div>
        )
      })}
    </div>
  )
}
