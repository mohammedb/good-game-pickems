import { z } from 'zod'
import DOMPurify from 'isomorphic-dompurify'

// Custom refinements
const sanitizeHtml = (value: string) => DOMPurify.sanitize(value)

// Shared base schemas
export const uuidSchema = z.string().uuid()
export const emailSchema = z.string().email()
export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters long')
  .max(20, 'Username must be less than 20 characters')
  .regex(
    /^[a-zA-Z0-9_-]+$/,
    'Username can only contain letters, numbers, underscores, and dashes',
  )

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')

// Picks validation
export const pickSchema = z.object({
  user_id: uuidSchema,
  match_id: uuidSchema,
  predicted_winner: uuidSchema,
})

// Points adjustment validation
export const adjustmentSchema = z.object({
  pick_id: uuidSchema,
  is_correct: z.boolean(),
  reason: z.string().min(1, 'Reason is required').transform(sanitizeHtml), // Sanitize HTML in case it's ever displayed
})

// Signup validation
export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  username: usernameSchema,
})

// Type exports
export type Pick = z.infer<typeof pickSchema>
export type Adjustment = z.infer<typeof adjustmentSchema>
export type SignUpData = z.infer<typeof signUpSchema>
