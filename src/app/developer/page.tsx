'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { Copy, Trash2, Key, Code, Book, Zap } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface ApiKey {
  id: string
  name: string
  key_prefix: string
  scopes: string[]
  rate_limit_tier: string
  last_used_at: string | null
  usage_count: number
  description: string | null
  is_active: boolean
  created_at: string
}

export default function DeveloperPage() {
  const router = useRouter()
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [newKeyDescription, setNewKeyDescription] = useState('')
  const [showNewKey, setShowNewKey] = useState<string | null>(null)

  useEffect(() => {
    fetchApiKeys()
  }, [])

  const fetchApiKeys = async () => {
    try {
      const response = await fetch('/api/developer/keys')
      if (!response.ok) throw new Error('Failed to fetch API keys')
      const data = await response.json()
      setApiKeys(data.api_keys || [])
    } catch (error) {
      toast.error('Failed to load API keys')
    } finally {
      setIsLoading(false)
    }
  }

  const createApiKey = async () => {
    if (!newKeyName.trim()) {
      toast.error('Please enter a name for the API key')
      return
    }

    setIsCreating(true)
    try {
      const response = await fetch('/api/developer/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newKeyName,
          description: newKeyDescription,
          scopes: ['read'],
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create API key')
      }

      const data = await response.json()
      setShowNewKey(data.api_key.key)
      toast.success(data.message)
      setNewKeyName('')
      setNewKeyDescription('')
      fetchApiKeys()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsCreating(false)
    }
  }

  const deleteApiKey = async (id: string) => {
    if (!confirm('Are you sure you want to delete this API key?')) return

    try {
      const response = await fetch(`/api/developer/keys?id=${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete API key')

      toast.success('API key deleted')
      fetchApiKeys()
    } catch (error) {
      toast.error('Failed to delete API key')
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">Developer Portal</h1>
        <p className="text-muted-foreground">
          Integrate Good Game Pickems into your applications
        </p>
      </div>

      <Tabs defaultValue="keys" className="space-y-6">
        <TabsList>
          <TabsTrigger value="keys" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            API Keys
          </TabsTrigger>
          <TabsTrigger value="docs" className="flex items-center gap-2">
            <Book className="h-4 w-4" />
            Documentation
          </TabsTrigger>
          <TabsTrigger value="examples" className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            Examples
          </TabsTrigger>
        </TabsList>

        <TabsContent value="keys" className="space-y-6">
          {/* Create new key */}
          <Card>
            <CardHeader>
              <CardTitle>Create API Key</CardTitle>
              <CardDescription>
                Generate a new API key to access the Good Game Pickems API
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Key Name</Label>
                <Input
                  id="name"
                  placeholder="My Discord Bot"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Discord bot for showing live predictions"
                  value={newKeyDescription}
                  onChange={(e) => setNewKeyDescription(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={createApiKey} disabled={isCreating}>
                {isCreating ? 'Creating...' : 'Create Key'}
              </Button>
            </CardFooter>
          </Card>

          {/* Show new key */}
          {showNewKey && (
            <Card className="border-green-500 bg-green-50 dark:bg-green-950">
              <CardHeader>
                <CardTitle className="text-green-700 dark:text-green-300">
                  API Key Created Successfully
                </CardTitle>
                <CardDescription>
                  Save this key securely - it won&apos;t be shown again!
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <code className="flex-1 rounded border bg-background p-3">
                    {showNewKey}
                  </code>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => copyToClipboard(showNewKey)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" onClick={() => setShowNewKey(null)}>
                  I&apos;ve saved this key
                </Button>
              </CardFooter>
            </Card>
          )}

          {/* List existing keys */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Your API Keys</h3>
            {isLoading ? (
              <p>Loading...</p>
            ) : apiKeys.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">
                    No API keys yet. Create one to get started!
                  </p>
                </CardContent>
              </Card>
            ) : (
              apiKeys.map((key) => (
                <Card key={key.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{key.name}</h4>
                          <Badge variant="secondary">
                            {key.rate_limit_tier}
                          </Badge>
                          {key.scopes.map((scope) => (
                            <Badge key={scope} variant="outline">
                              {scope}
                            </Badge>
                          ))}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {key.description || 'No description'}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Key: {key.key_prefix}...</span>
                          <span>Used {key.usage_count} times</span>
                          {key.last_used_at && (
                            <span>
                              Last used{' '}
                              {formatDistanceToNow(new Date(key.last_used_at))}{' '}
                              ago
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deleteApiKey(key.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="docs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>API Documentation</CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none">
              <h3>Base URL</h3>
              <code className="block rounded bg-muted p-3">
                https://ggwp.no/api/v1
              </code>

              <h3>Authentication</h3>
              <p>Include your API key in the request headers:</p>
              <pre className="overflow-x-auto rounded bg-muted p-3">
                {`headers: {
  'X-API-Key': 'ggp_live_your_api_key_here'
}`}
              </pre>

              <h3>Available Endpoints</h3>

              <h4>Matches</h4>
              <ul>
                <li>
                  <code>GET /matches</code> - List all matches
                </li>
                <li>
                  <code>GET /matches?status=upcoming</code> - Upcoming matches
                </li>
                <li>
                  <code>GET /matches?game_type=csgo</code> - Filter by game
                </li>
              </ul>

              <h4>Predictions</h4>
              <ul>
                <li>
                  <code>GET /predictions?user_id=UUID</code> - User predictions
                </li>
                <li>
                  <code>GET /predictions?match_id=UUID</code> - Match
                  predictions
                </li>
                <li>
                  <code>POST /predictions</code> - Create prediction (requires
                  write scope)
                </li>
              </ul>

              <h4>Leaderboard</h4>
              <ul>
                <li>
                  <code>GET /leaderboard</code> - Global leaderboard
                </li>
                <li>
                  <code>GET /leaderboard?timeframe=week</code> - Weekly
                  leaderboard
                </li>
              </ul>

              <h3>Rate Limits</h3>
              <ul>
                <li>
                  <strong>Free tier:</strong> 100 requests per minute
                </li>
                <li>
                  <strong>Premium tier:</strong> 1000 requests per minute
                </li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="examples" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Discord Bot Example</CardTitle>
              <CardDescription>
                A simple Discord bot that shows upcoming matches
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="overflow-x-auto rounded bg-muted p-4 text-sm">
                {`const { Client, EmbedBuilder } = require('discord.js');
const axios = require('axios');

const API_KEY = 'your_api_key_here';
const API_URL = 'https://ggwp.no/api/v1';

client.on('messageCreate', async (message) => {
  if (message.content === '!matches') {
    try {
      const response = await axios.get(\`\${API_URL}/matches\`, {
        headers: { 'X-API-Key': API_KEY },
        params: { status: 'upcoming', limit: 5 }
      });

      const embed = new EmbedBuilder()
        .setTitle('Upcoming Matches')
        .setColor('#00ff00');

      response.data.data.forEach(match => {
        embed.addFields({
          name: \`\${match.home_team} vs \${match.away_team}\`,
          value: new Date(match.match_date).toLocaleString()
        });
      });

      message.channel.send({ embeds: [embed] });
    } catch (error) {
      message.reply('Failed to fetch matches');
    }
  }
});`}
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>OBS/Twitch Overlay</CardTitle>
              <CardDescription>
                Show your live predictions on stream
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="mb-2 font-semibold">Quick Setup</h4>
                <ol className="list-inside list-decimal space-y-2 text-sm">
                  <li>Create an API key above if you haven&apos;t already</li>
                  <li>In OBS, add a Browser Source</li>
                  <li>Use this URL format:</li>
                </ol>
                <div className="mt-2 rounded bg-muted p-3">
                  <code className="break-all text-xs">
                    https://ggwp.no/overlay/YOUR_API_KEY_HERE
                  </code>
                </div>
              </div>

              <div>
                <h4 className="mb-2 font-semibold">Customization Options</h4>
                <p className="mb-2 text-sm text-muted-foreground">
                  Add these parameters to the URL to customize your overlay:
                </p>
                <div className="space-y-1 text-sm">
                  <div>
                    <code className="bg-muted px-1">?theme=dark</code> - Theme
                    (dark, light, transparent, neon)
                  </div>
                  <div>
                    <code className="bg-muted px-1">
                      ?position=bottom-right
                    </code>{' '}
                    - Position on screen
                  </div>
                  <div>
                    <code className="bg-muted px-1">?limit=5</code> - Number of
                    predictions to show
                  </div>
                  <div>
                    <code className="bg-muted px-1">?stats=false</code> - Hide
                    statistics
                  </div>
                  <div>
                    <code className="bg-muted px-1">?refresh=30</code> - Refresh
                    interval in seconds
                  </div>
                </div>
              </div>

              <div>
                <h4 className="mb-2 font-semibold">Full Example</h4>
                <div className="rounded bg-muted p-3">
                  <code className="break-all text-xs">
                    https://ggwp.no/overlay/ggp_live_abc123?theme=neon&position=top-left&limit=3
                  </code>
                </div>
              </div>

              <div>
                <h4 className="mb-2 font-semibold">OBS Settings</h4>
                <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                  <li>Width: 400px (or adjust to fit)</li>
                  <li>Height: 600px (or adjust based on limit)</li>
                  <li>Enable &quot;Shutdown source when not visible&quot;</li>
                  <li>
                    Enable &quot;Refresh browser when scene becomes active&quot;
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
