/**
 * Semantic icon mapping for consistent icon usage across the application
 * This centralizes icon definitions to avoid hardcoding icons throughout components
 */

import {
  // Status icons
  CheckCircle2,
  Lock,
  Timer,
  Play,
  // Activity icons
  RefreshCw,
  User,
  Users,
  Zap,
  Calendar,
  Clock,
  // Achievement/Ranking icons
  Trophy,
  Medal,
  Star,
  Award,
  Crown,
  Target,
  Sparkles,
  // Navigation icons
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  X,
  // Action icons
  Share2,
  Trash2,
  Search,
  Plus,
  Minus,
  // Platform icons
  Twitch,
  Twitter,
  Facebook,
  Link as LinkIcon,
  // System icons
  Activity,
  Database,
  Globe,
  Shield,
  Mail,
  Link2,
  // UI state icons
  Loader2,
  Check,
  AlertCircle,
  Info,
  // Trending icons
  TrendingUp,
  TrendingDown,
  // Theme icons
  Sun,
  Moon,
  Laptop,
  EyeOff,
  // Other icons
  CircleDot,
  Circle,
  Calculator,
} from 'lucide-react'

export const Icons = {
  // Match status
  matchLive: CheckCircle2,
  matchLocked: Lock,
  matchUpcoming: Timer,
  matchInProgress: Play,

  // User actions
  share: Share2,
  delete: Trash2,
  search: Search,
  add: Plus,
  remove: Minus,

  // Achievement/Ranking
  trophy: Trophy,
  medal: Medal,
  star: Star,
  award: Award,
  crown: Crown,
  target: Target,
  sparkles: Sparkles,

  // Navigation
  chevronDown: ChevronDown,
  chevronUp: ChevronUp,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  arrowRight: ArrowRight,
  close: X,

  // Platform
  twitch: Twitch,
  twitter: Twitter,
  facebook: Facebook,
  link: LinkIcon,

  // System status
  activity: Activity,
  database: Database,
  globe: Globe,
  shield: Shield,
  mail: Mail,
  link2: Link2,

  // UI states
  loading: Loader2,
  success: Check,
  error: AlertCircle,
  info: Info,

  // Activity types
  sync: RefreshCw,
  user: User,
  users: Users,
  system: Zap,
  calendar: Calendar,
  clock: Clock,

  // Trending
  trendingUp: TrendingUp,
  trendingDown: TrendingDown,

  // Theme
  sun: Sun,
  moon: Moon,
  laptop: Laptop,
  eyeOff: EyeOff,

  // Other
  circle: Circle,
  circleDot: CircleDot,
  calculator: Calculator,
} as const

// Type for icon names
export type IconName = keyof typeof Icons

// Helper function to get icon by name
export function getIcon(name: IconName) {
  return Icons[name]
}
