'use client'

import { cn } from '@/lib/utils'
import { GameTypeFilter } from '@/hooks/use-matches'
import { Sparkles } from 'lucide-react'
import { SiCounterstrike, SiValorant, SiLeagueoflegends } from 'react-icons/si'

interface GameTypeSelectorProps {
  selectedGame: GameTypeFilter
  onGameChange: (game: GameTypeFilter) => void
  className?: string
}

const gameTypes = [
  { value: 'all' as GameTypeFilter, label: 'All Games', icon: Sparkles },
  { value: 'csgo' as GameTypeFilter, label: 'CS2', icon: SiCounterstrike },
  {
    value: 'lol' as GameTypeFilter,
    label: 'League of Legends',
    icon: SiLeagueoflegends,
  },
  { value: 'valorant' as GameTypeFilter, label: 'Valorant', icon: SiValorant },
]

export function GameTypeSelector({
  selectedGame,
  onGameChange,
  className,
}: GameTypeSelectorProps) {
  return (
    <div
      className={cn(
        'inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground',
        className,
      )}
    >
      {gameTypes.map((game) => {
        const Icon = game.icon
        return (
          <button
            key={game.value}
            onClick={() => onGameChange(game.value)}
            className={cn(
              'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
              selectedGame === game.value
                ? 'bg-background text-foreground shadow-sm'
                : 'hover:bg-background/50',
            )}
          >
            <Icon className="mr-2 h-4 w-4" />
            {game.label}
          </button>
        )
      })}
    </div>
  )
}
