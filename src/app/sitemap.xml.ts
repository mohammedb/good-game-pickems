// src/app/sitemap.xml.ts (App Router)  - OR -
// src/pages/api/sitemap.xml.ts (Pages Router)

import { MetadataRoute } from 'next' // For App Router
// import { NextApiRequest, NextApiResponse } from 'next'; // For Pages Router
import { createServerClient } from '@/utils/supabase' // Use your existing Supabase client
import { cookies } from 'next/headers'

// Helper function to generate a single URL entry
function createUrlEntry(loc: string, lastmod: string): string {
  return `
    <url>
      <loc>${loc}</loc>
      <lastmod>${lastmod}</lastmod>
    </url>
  `
}

// App Router implementation (Next.js 13+)
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)

  const baseUrl = 'https://www.ggwp.no'
  const currentDate = new Date().toISOString()

  // Initialize the sitemap entries array
  const entries: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: currentDate,
    },
    {
      url: `${baseUrl}/matches`,
      lastModified: currentDate,
    },
    {
      url: `${baseUrl}/leaderboard`,
      lastModified: currentDate,
    },
    {
      url: `${baseUrl}/om-oss`,
      lastModified: currentDate,
    },
  ]

  // Fetch matches
  const { data: recentMatches, error: matchesError } = await supabase
    .from('matches')
    .select('id, start_time')
    .order('start_time', { ascending: false })
    .limit(50)

  if (!matchesError && recentMatches) {
    recentMatches.forEach((match) => {
      entries.push({
        url: `${baseUrl}/matches/${match.id}`,
        lastModified: new Date(match.start_time).toISOString(),
      })
    })
  }

  // Fetch users
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('username, updated_at')
    .not('username', 'is', null)
    .limit(50)

  if (!usersError && users) {
    users.forEach((user) => {
      entries.push({
        url: `${baseUrl}/profile/${encodeURIComponent(user.username)}`,
        lastModified: new Date(user.updated_at).toISOString(),
      })
    })
  }

  return entries
}

export const dynamic = 'force-dynamic'
