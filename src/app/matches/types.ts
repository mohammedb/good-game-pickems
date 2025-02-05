export interface GoodGameTeam {
  id: number
  name: string
  common_name: string | null
  url: string
  logo?: {
    id: number
    ratio: number
    width: number
    height: number
    credits: string | null
    mimetype: string
    url: string
    relative_url: string
    aspect_string: string | null
  }
}

export interface GoodGameSignup {
  id: number
  name: string
  team: GoodGameTeam
}

export interface GoodGameMatch {
  id: number
  url: string
  start_time: string
  finished_at: string | null
  home_score: number | null
  away_score: number | null
  walkover: boolean
  postponed: boolean
  cancelled: boolean
  round_number: number
  round_identifier: string
  round_identifier_text: string
  winning_side: string | null
  bracket: string
  home_signup: GoodGameSignup
  away_signup: GoodGameSignup
  best_of?: number
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
  division_id: string
  is_finished: boolean
  best_of: number
  round: string
} 