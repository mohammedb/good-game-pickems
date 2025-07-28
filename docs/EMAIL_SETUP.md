# Email Setup Guide

This guide explains how to configure email functionality for Good Game Pickems.

## Overview

The application uses two email systems:
1. **Supabase Auth Emails** - For authentication emails (signup confirmation, password reset)
2. **Resend** - For custom transactional emails (notifications, pick confirmations)

**Important**: To avoid duplicate emails, the signup process only uses Supabase's built-in confirmation email. Custom welcome emails should be sent after email verification is complete.

## Configuration Steps

### 1. Supabase Email Configuration

By default, Supabase sends authentication emails using its built-in email service. However, this has limitations and may fail in production.

#### Option A: Use Supabase's Built-in Email (Development Only)
- No additional configuration needed
- Limited to 3 emails per hour
- May experience delivery issues

#### Option B: Disable Supabase Email Confirmation (Recommended for Development)
1. Go to your Supabase Dashboard
2. Navigate to Authentication → Email Templates
3. Disable "Enable email confirmations" under Settings

#### Option C: Configure Custom SMTP (Production)
1. Go to your Supabase Dashboard
2. Navigate to Settings → Auth
3. Configure SMTP settings with your email provider

### 2. Resend Configuration

The application uses Resend for sending custom transactional emails.

1. Sign up for a Resend account at https://resend.com
2. Create an API key in the Resend dashboard
3. Add the API key to your `.env.local` file:
   ```
   RESEND_API_KEY=re_xxxxxxxxxx
   ```

### 3. Environment Variables

Add these to your `.env.local` file:

```bash
# Required for custom emails
RESEND_API_KEY=your_resend_api_key

# Optional: Override the default site URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Troubleshooting

### "Error sending confirmation email" during signup

This error occurs when:
1. Supabase is configured to send confirmation emails but the email service fails
2. The RESEND_API_KEY is missing or invalid

**Solutions:**
- For development: Disable email confirmations in Supabase Dashboard
- For production: Ensure RESEND_API_KEY is properly configured
- Check Supabase Dashboard → Authentication → Logs for detailed error messages

### Email Rate Limiting

The application implements rate limiting for emails:
- 3 emails per second
- 100 emails per day

These limits are enforced in `src/lib/email.ts` and can be adjusted if needed.

## Testing Email Functionality

1. Ensure environment variables are set
2. Run the development server: `pnpm dev`
3. Try signing up with a test email
4. Check console logs for any errors
5. Verify email delivery in your inbox

## Production Considerations

1. **Domain Verification**: Verify your domain in Resend for better deliverability
2. **SPF/DKIM Records**: Configure DNS records as recommended by Resend
3. **Email Templates**: Customize email templates in `src/lib/email-templates.tsx`
4. **Monitoring**: Set up email delivery monitoring in Resend dashboard