import { z } from 'zod'
import DOMPurify from 'isomorphic-dompurify'

// Common validation schemas
export const schemas = {
  // ID validation
  uuid: z.string().uuid(),

  // Pagination
  pagination: z.object({
    limit: z.coerce.number().int().min(1).max(100).default(20),
    offset: z.coerce.number().int().min(0).default(0),
  }),

  // Game types
  gameType: z.enum(['csgo', 'lol', 'valorant']),

  // Match status
  matchStatus: z.enum(['upcoming', 'live', 'completed']),

  // API key creation
  createApiKey: z.object({
    name: z
      .string()
      .min(1)
      .max(50)
      .transform((s) => sanitizeString(s)),
    description: z
      .string()
      .max(200)
      .optional()
      .transform((s) => (s ? sanitizeString(s) : undefined)),
    scopes: z.array(z.enum(['read', 'write', 'admin'])).default(['read']),
  }),

  // Pick creation
  createPick: z.object({
    match_id: z.string().uuid(),
    predicted_winner: z.enum(['home', 'away']),
    confidence_level: z.number().int().min(1).max(3).optional(),
  }),

  // Challenge creation
  createChallenge: z.object({
    name: z
      .string()
      .min(1)
      .max(100)
      .transform((s) => sanitizeString(s)),
    description: z
      .string()
      .max(500)
      .optional()
      .transform((s) => (s ? sanitizeString(s) : undefined)),
    start_date: z.string().datetime(),
    end_date: z.string().datetime(),
    max_participants: z.number().int().min(2).max(100).optional(),
    entry_fee: z.number().min(0).max(1000).optional(),
    prize_pool: z.number().min(0).max(10000).optional(),
    is_public: z.boolean().default(true),
  }),

  // Admin operations
  adminUpdatePoints: z.object({
    user_id: z.string().uuid().optional(),
    recalculate_all: z.boolean().optional(),
  }),

  // Shared predictions
  shareOptions: z.object({
    include_stats: z.boolean().default(true),
    include_upcoming: z.boolean().default(true),
    title: z
      .string()
      .max(100)
      .optional()
      .transform((s) => (s ? sanitizeString(s) : undefined)),
  }),
}

// Sanitize string input to prevent XSS
export function sanitizeString(input: string): string {
  // Remove any HTML tags and dangerous characters
  const cleaned = DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  })

  // Additional sanitization for SQL injection prevention
  return cleaned
    .replace(/[<>'"]/g, '') // Remove potential HTML/SQL characters
    .trim()
}

// Sanitize object recursively
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized: any = {}

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value)
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((item) =>
        typeof item === 'string' ? sanitizeString(item) : item,
      )
    } else if (value && typeof value === 'object') {
      sanitized[key] = sanitizeObject(value)
    } else {
      sanitized[key] = value
    }
  }

  return sanitized as T
}

// Validate request body with schema
export async function validateRequestBody<T>(
  request: Request,
  schema: z.ZodSchema<T>,
): Promise<{ data?: T; error?: string }> {
  try {
    const body = await request.json()
    const result = schema.safeParse(body)

    if (!result.success) {
      const errors = result.error.errors
        .map((e) => `${e.path.join('.')}: ${e.message}`)
        .join(', ')
      return { error: errors }
    }

    return { data: result.data }
  } catch (error) {
    return { error: 'Invalid JSON body' }
  }
}

// Validate query parameters
export function validateQueryParams<T>(
  searchParams: URLSearchParams,
  schema: z.ZodSchema<T>,
): { data?: T; error?: string } {
  const params: Record<string, any> = {}

  searchParams.forEach((value, key) => {
    params[key] = value
  })

  const result = schema.safeParse(params)

  if (!result.success) {
    const errors = result.error.errors
      .map((e) => `${e.path.join('.')}: ${e.message}`)
      .join(', ')
    return { error: errors }
  }

  return { data: result.data }
}

// SQL injection prevention helpers
export function escapeSqlIdentifier(identifier: string): string {
  // Only allow alphanumeric characters and underscores
  if (!/^[a-zA-Z0-9_]+$/.test(identifier)) {
    throw new Error('Invalid SQL identifier')
  }
  return identifier
}

// Validate environment variables
export function validateEnvVar(
  name: string,
  required: boolean = true,
): string | undefined {
  const value = process.env[name]

  if (required && !value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

// IP address validation
export function isValidIP(ip: string): boolean {
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/
  const ipv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/

  return ipv4Regex.test(ip) || ipv6Regex.test(ip)
}

// Extract client IP from request
export function getClientIP(request: Request): string | null {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')

  if (forwarded) {
    const ips = forwarded.split(',').map((ip) => ip.trim())
    const validIP = ips.find((ip) => isValidIP(ip))
    if (validIP) return validIP
  }

  if (realIP && isValidIP(realIP)) {
    return realIP
  }

  return null
}
