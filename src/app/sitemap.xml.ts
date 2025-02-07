// src/app/sitemap.xml.ts (App Router)  - OR -
// src/pages/api/sitemap.xml.ts (Pages Router)

import { MetadataRoute } from 'next' // For App Router
// import { NextApiRequest, NextApiResponse } from 'next'; // For Pages Router
import { createServerClient } from '@/utils/supabase' // Use your existing Supabase client
import { cookies } from 'next/headers'

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.ggwp.no'

// Static routes that don't require dynamic data
const staticRoutes: MetadataRoute.Sitemap = [
  {
    url: `${baseUrl}/`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'daily',
    priority: 1,
  },
  {
    url: `${baseUrl}/matches`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'hourly',
    priority: 0.9,
  },
  {
    url: `${baseUrl}/leaderboard`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'hourly',
    priority: 0.8,
  },
  {
    url: `${baseUrl}/om-oss`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'monthly',
    priority: 0.5,
  },
  {
    url: `${baseUrl}/login`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'monthly',
    priority: 0.3,
  },
  {
    url: `${baseUrl}/signup`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'monthly',
    priority: 0.3,
  },
]

// App Router implementation (Next.js 13+)
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)
  const entries: MetadataRoute.Sitemap = [...staticRoutes]

  try {
    // Fetch matches
    const { data: recentMatches, error: matchesError } = await supabase
      .from('matches')
      .select('id, start_time, updated_at')
      .order('start_time', { ascending: false })
      .limit(100)

    if (matchesError) throw matchesError

    if (recentMatches) {
      recentMatches.forEach((match) => {
        entries.push({
          url: `${baseUrl}/matches/${match.id}`,
          lastModified: new Date(
            match.updated_at || match.start_time,
          ).toISOString(),
          changeFrequency: 'daily',
          priority: 0.7,
        })
      })
    }

    // Fetch public user profiles
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('username, updated_at')
      .not('username', 'is', null)
      .limit(100)

    if (usersError) throw usersError

    if (users) {
      users.forEach((user) => {
        entries.push({
          url: `${baseUrl}/profile/${encodeURIComponent(user.username)}`,
          lastModified: new Date(user.updated_at).toISOString(),
          changeFrequency: 'weekly',
          priority: 0.6,
        })
      })
    }

    return entries
  } catch (error) {
    console.error('Error generating sitemap:', error)
    // Return static routes if there's an error
    return staticRoutes
  }
}

// Ensure the sitemap is always generated fresh
export const dynamic = 'force-dynamic'
export const revalidate = 3600 // Revalidate every hour
