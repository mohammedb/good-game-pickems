/**
 * Good Game Pickems TypeScript SDK
 *
 * Example usage:
 * const api = new GoodGamePickemsAPI('your_api_key');
 * const matches = await api.matches.list({ status: 'upcoming' });
 */

interface APIConfig {
  apiKey: string
  baseUrl?: string
  version?: string
}

interface PaginationParams {
  limit?: number
  offset?: number
}

interface MatchFilters extends PaginationParams {
  game_type?: 'csgo' | 'lol' | 'valorant'
  status?: 'upcoming' | 'live' | 'completed'
}

interface PredictionFilters extends PaginationParams {
  user_id?: string
  match_id?: string
}

interface LeaderboardFilters extends PaginationParams {
  game_type?: 'csgo' | 'lol' | 'valorant'
  timeframe?: 'today' | 'week' | 'month' | 'all_time'
}

interface CreatePredictionParams {
  match_id: string
  picked_winner: string
  home_score?: number
  away_score?: number
}

interface APIResponse<T> {
  success: boolean
  data: T
  meta?: {
    timestamp: string
    version: string
    pagination?: {
      limit: number
      offset: number
      total: number
    }
  }
}

interface APIError {
  success: false
  error: {
    code: string
    message: string
    details?: any
  }
}

class GoodGamePickemsAPI {
  private apiKey: string
  private baseUrl: string
  private headers: HeadersInit

  public matches: MatchesAPI
  public predictions: PredictionsAPI
  public leaderboard: LeaderboardAPI

  constructor(config: APIConfig | string) {
    if (typeof config === 'string') {
      this.apiKey = config
      this.baseUrl = 'https://goodgamepickems.com/api/v1'
    } else {
      this.apiKey = config.apiKey
      this.baseUrl = config.baseUrl || 'https://goodgamepickems.com/api/v1'
    }

    this.headers = {
      'X-API-Key': this.apiKey,
      'Content-Type': 'application/json',
    }

    // Initialize sub-APIs
    this.matches = new MatchesAPI(this)
    this.predictions = new PredictionsAPI(this)
    this.leaderboard = new LeaderboardAPI(this)
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<APIResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.headers,
          ...options.headers,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new APIException(data as APIError)
      }

      return data as APIResponse<T>
    } catch (error) {
      if (error instanceof APIException) {
        throw error
      }
      throw new APIException({
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Failed to connect to API',
          details: error,
        },
      })
    }
  }
}

class APIException extends Error {
  public code: string
  public details?: any

  constructor(error: APIError) {
    super(error.error.message)
    this.name = 'APIException'
    this.code = error.error.code
    this.details = error.error.details
  }
}

class MatchesAPI {
  constructor(private api: GoodGamePickemsAPI) {}

  async list(filters?: MatchFilters) {
    const params = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString())
        }
      })
    }

    return this.api.request<any[]>(
      `/matches${params.toString() ? `?${params.toString()}` : ''}`,
    )
  }

  async get(id: string) {
    return this.api.request<any>(`/matches/${id}`)
  }

  async upcoming(limit = 10) {
    return this.list({ status: 'upcoming', limit })
  }

  async live() {
    return this.list({ status: 'live' })
  }
}

class PredictionsAPI {
  constructor(private api: GoodGamePickemsAPI) {}

  async list(filters?: PredictionFilters) {
    const params = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString())
        }
      })
    }

    return this.api.request<any[]>(
      `/predictions${params.toString() ? `?${params.toString()}` : ''}`,
    )
  }

  async create(prediction: CreatePredictionParams) {
    return this.api.request<any>('/predictions', {
      method: 'POST',
      body: JSON.stringify(prediction),
    })
  }

  async getByUser(userId: string, limit = 20) {
    return this.list({ user_id: userId, limit })
  }

  async getByMatch(matchId: string) {
    return this.list({ match_id: matchId })
  }
}

class LeaderboardAPI {
  constructor(private api: GoodGamePickemsAPI) {}

  async get(filters?: LeaderboardFilters) {
    const params = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString())
        }
      })
    }

    return this.api.request<any[]>(
      `/leaderboard${params.toString() ? `?${params.toString()}` : ''}`,
    )
  }

  async weekly(game_type?: 'csgo' | 'lol' | 'valorant') {
    return this.get({ timeframe: 'week', game_type })
  }

  async allTime(limit = 100) {
    return this.get({ timeframe: 'all_time', limit })
  }
}

// Export for use
export default GoodGamePickemsAPI
export { APIException, type APIResponse, type APIError }
