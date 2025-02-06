'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, X } from 'lucide-react'

interface FilterBarProps {
  onFilterChange: (filters: FilterOptions) => void
}

export interface FilterOptions {
  matchStatus: string
  searchQuery: string
}

export function FilterBar({ onFilterChange }: FilterBarProps) {
  const [matchStatus, setMatchStatus] = React.useState<string>('all')
  const [searchQuery, setSearchQuery] = React.useState('')

  const handleMatchStatusChange = (value: string) => {
    setMatchStatus(value)
    onFilterChange({
      matchStatus: value,
      searchQuery,
    })
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    onFilterChange({
      matchStatus,
      searchQuery: e.target.value,
    })
  }

  const clearFilters = () => {
    setMatchStatus('all')
    setSearchQuery('')
    onFilterChange({
      matchStatus: 'all',
      searchQuery: '',
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border bg-card p-4 shadow-sm"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 flex-col gap-4 md:flex-row md:items-center">
          <Select value={matchStatus} onValueChange={handleMatchStatusChange}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Type filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="sync">Sync</SelectItem>
              <SelectItem value="points">Points</SelectItem>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="match">Match</SelectItem>
              <SelectItem value="error">Error</SelectItem>
              <SelectItem value="success">Success</SelectItem>
            </SelectContent>
          </Select>

          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users, messages, or details..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-8"
            />
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="ml-auto"
          onClick={clearFilters}
        >
          <X className="mr-2 h-4 w-4" />
          Clear Filters
        </Button>
      </div>
    </motion.div>
  )
}
