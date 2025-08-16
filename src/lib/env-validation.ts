import { z } from 'zod'

// Environment variable schema
const envSchema = z.object({
  // Node environment
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),

  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // Good Game Ligaen API
  GOOD_GAME_LIGAEN_TOKEN: z.string().min(1),
  GOOD_GAME_LOL_DIVISION_ID: z.string().default('12518'),
  GOOD_GAME_VALORANT_DIVISION_ID: z.string().default('13601'),

  // Security
  CRON_SECRET_KEY: z.string().min(32),
  NEXTAUTH_SECRET: z.string().min(32).optional(),
  NEXTAUTH_URL: z.string().url().optional(),

  // Email (optional)
  RESEND_API_KEY: z.string().optional(),

  // App URL
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
})

// Parse and validate environment variables
export function validateEnv() {
  try {
    const env = envSchema.parse(process.env)
    return { success: true, env }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors
        .map((e) => `${e.path.join('.')}: ${e.message}`)
        .join('\n')

      console.error('❌ Environment validation failed:\n', errors)
      return { success: false, errors }
    }

    console.error('❌ Unknown environment validation error:', error)
    return { success: false, errors: 'Unknown validation error' }
  }
}

// Get typed environment variable
export function getEnvVar<K extends keyof z.infer<typeof envSchema>>(
  key: K,
): z.infer<typeof envSchema>[K] {
  const result = validateEnv()
  if (!result.success || !result.env) {
    throw new Error(`Environment validation failed: ${result.errors}`)
  }
  return result.env[key]
}

// Check if running in production
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}

// Check if running in development
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development'
}

// Validate environment on startup
export function validateEnvOnStartup() {
  const result = validateEnv()

  if (!result.success) {
    console.error('\n⚠️  ENVIRONMENT VALIDATION FAILED ⚠️')
    console.error('Please check your environment variables:\n')
    console.error(result.errors)
    console.error('\nRefer to .env.example for required variables.')

    // In production, exit the process
    if (process.env.NODE_ENV === 'production') {
      process.exit(1)
    }
  } else {
    console.log('✅ Environment variables validated successfully')
  }

  return result
}

// Security checks for production
export function validateProductionSecurity() {
  if (!isProduction()) return

  const warnings: string[] = []

  // Check for secure keys
  if (!process.env.CRON_SECRET_KEY || process.env.CRON_SECRET_KEY.length < 32) {
    warnings.push('CRON_SECRET_KEY should be at least 32 characters long')
  }

  if (!process.env.NEXTAUTH_SECRET || process.env.NEXTAUTH_SECRET.length < 32) {
    warnings.push('NEXTAUTH_SECRET should be at least 32 characters long')
  }

  // Check for HTTPS
  if (!process.env.NEXT_PUBLIC_APP_URL?.startsWith('https://')) {
    warnings.push('NEXT_PUBLIC_APP_URL should use HTTPS in production')
  }

  // Log warnings
  if (warnings.length > 0) {
    console.warn('\n⚠️  PRODUCTION SECURITY WARNINGS ⚠️')
    warnings.forEach((warning) => console.warn(`• ${warning}`))
    console.warn('\n')
  }
}

// Export validated environment variables
export const env = (() => {
  const result = validateEnv()
  if (!result.success) {
    throw new Error('Environment validation failed')
  }
  return result.env
})()

// Type-safe environment variable access
export type Env = z.infer<typeof envSchema>
