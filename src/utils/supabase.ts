// This file re-exports from the split files
// Client components should import from @/utils/supabase-client
// Server components should import from @/utils/supabase-server

// Re-export client functions
export { createBrowserClient } from './supabase-client'

// Re-export server functions
export {
  createServerClient,
  createServiceRoleClient,
  createMiddlewareClient,
} from './supabase-server'
