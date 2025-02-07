import { MetadataRoute } from 'next'
import { createServerClient } from '@/utils/supabase'
import { cookies } from 'next/headers'

// Static routes that don't require dynamic data
const staticRoutes: MetadataRoute.Sitemap = [
  {
    url: 'https://www.ggwp.no',
    lastModified: new Date().toISOString(),
    changeFrequency: 'daily',
    priority: 1,
  },
  {
    url: 'https://www.ggwp.no/matches',
    lastModified: new Date().toISOString(),
    changeFrequency: 'hourly',
    priority: 0.9,
  },
  {
    url: 'https://www.ggwp.no/leaderboard',
    lastModified: new Date().toISOString(),
    changeFrequency: 'hourly',
    priority: 0.8,
  },
  {
    url: 'https://www.ggwp.no/om-oss',
    lastModified: new Date().toISOString(),
    changeFrequency: 'monthly',
    priority: 0.5,
  },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries = [...staticRoutes]

  try {
    const cookieStore = cookies()
    const supabase = createServerClient(cookieStore)

    // Fetch matches
    const { data: matches } = await supabase
      .from('matches')
      .select('id, start_time, updated_at')
      .order('start_time', { ascending: false })
      .limit(50)

    if (matches?.length) {
      matches.forEach((match) => {
        entries.push({
          url: `https://www.ggwp.no/matches/${match.id}`,
          lastModified: new Date(
            match.updated_at || match.start_time,
          ).toISOString(),
          changeFrequency: 'daily',
          priority: 0.7,
        })
      })
    }

    // Fetch public user profiles
    const { data: users } = await supabase
      .from('users')
      .select('username, updated_at')
      .not('username', 'is', null)
      .limit(50)

    if (users?.length) {
      users.forEach((user) => {
        entries.push({
          url: `https://www.ggwp.no/profile/${encodeURIComponent(user.username)}`,
          lastModified: new Date(user.updated_at).toISOString(),
          changeFrequency: 'weekly',
          priority: 0.6,
        })
      })
    }

    return entries
  } catch (error) {
    // If anything fails, return just the static routes
    console.error('Error generating dynamic sitemap entries:', error)
    return staticRoutes
  }
}
