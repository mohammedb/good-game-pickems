/// <reference no-default-lib="true" />
/// <reference lib="deno.ns" />
/// <reference lib="esnext" />
/// <reference lib="dom" />

declare module 'https://deno.land/std@0.168.0/http/server.ts' {
  export interface ServeInit {
    port?: number
    hostname?: string
    handler: (request: Request) => Response | Promise<Response>
    onError?: (error: unknown) => Response | Promise<Response>
    onListen?: (params: { hostname: string; port: number }) => void
  }

  export function serve(handler: (request: Request) => Response | Promise<Response>, init?: ServeInit): void
}

declare module 'https://esm.sh/@supabase/supabase-js@2' {
  export * from '@supabase/supabase-js'
}

declare const Deno: {
  env: {
    get(key: string): string | undefined
  }
  serve(handler: (request: Request) => Response | Promise<Response>): void
} 