import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
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
  ]
}
