export type ChallengeType = 'single_match' | 'round' | 'custom'
export type ChallengeStatus =
  | 'pending'
  | 'accepted'
  | 'declined'
  | 'cancelled'
  | 'completed'

export interface Challenge {
  id: string
  challenger_id: string
  challenged_id: string
  challenge_type: ChallengeType
  status: ChallengeStatus
  winner_id: string | null
  stake_points: number
  message?: string | null
  created_at: string
  accepted_at: string | null
  completed_at: string | null
  expires_at: string
  // Relations
  challenger?: User
  challenged?: User
  winner?: User | null
  matches?: ChallengeMatch[]
  picks?: ChallengePick[]
}

export interface ChallengeMatch {
  challenge_id: string
  match_id: string
  // Relations
  match?: Match
}

export interface ChallengePick {
  id: string
  challenge_id: string
  user_id: string
  match_id: string
  predicted_winner: string
  is_correct: boolean | null
  points_earned: number
  created_at: string
  updated_at: string
  // Relations
  user?: User
  match?: Match
}

export interface User {
  id: string
  username: string
  total_points: number
  challenge_wins: number
  challenge_losses: number
  challenge_draws: number
  challenge_points_won: number
  challenge_points_lost: number
}

export interface Match {
  id: string
  team1: string
  team2: string
  team1_id: string
  team2_id: string
  team1_logo?: string
  team2_logo?: string
  start_time: string
  is_finished: boolean
  winner_id: string | null
  team1_score?: number | null
  team2_score?: number | null
}

// API request/response types
export interface CreateChallengeRequest {
  challenged_username: string
  challenge_type: ChallengeType
  match_ids: string[]
  stake_points?: number
  message?: string
}

export interface CreateChallengeResponse {
  challenge: Challenge
  error?: string
}

export interface UpdateChallengeStatusRequest {
  status: 'accepted' | 'declined'
}

export interface MakeChallengePredictionRequest {
  match_id: string
  predicted_winner: string
}

export interface ChallengeWithDetails extends Challenge {
  challenger: User
  challenged: User
  matches: (ChallengeMatch & { match: Match })[]
  picks: ChallengePick[]
  user_picks?: ChallengePick[]
  opponent_picks?: ChallengePick[]
}

export interface ChallengeStats {
  total_challenges: number
  wins: number
  losses: number
  draws: number
  win_rate: number
  points_won: number
  points_lost: number
  active_challenges: number
  pending_challenges: number
}
