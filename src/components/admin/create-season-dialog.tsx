'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from '@/components/ui/use-toast'
import { Loader2, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'

interface CreateSeasonDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  hasActiveSeason: boolean
}

export function CreateSeasonDialog({
  open,
  onOpenChange,
  onSuccess,
  hasActiveSeason,
}: CreateSeasonDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    season_id: '',
    name: '',
    start_date: format(new Date(), 'yyyy-MM-dd'),
    end_date: '',
    activate: false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!formData.season_id || !formData.name || !formData.start_date) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/admin/seasons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          start_date: new Date(formData.start_date).toISOString(),
          end_date: formData.end_date
            ? new Date(formData.end_date).toISOString()
            : null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create season')
      }

      toast({
        title: 'Success',
        description: `Season "${formData.name}" created successfully${formData.activate ? ' and activated' : ''}`,
      })

      // Reset form
      setFormData({
        season_id: '',
        name: '',
        start_date: format(new Date(), 'yyyy-MM-dd'),
        end_date: '',
        activate: false,
      })

      onSuccess()
    } catch (error) {
      console.error('Error creating season:', error)
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to create season',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Season</DialogTitle>
            <DialogDescription>
              Create a new competition season. You can activate it immediately
              or later.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="season_id">Season ID *</Label>
              <Input
                id="season_id"
                placeholder="e.g., 13163"
                value={formData.season_id}
                onChange={(e) => handleInputChange('season_id', e.target.value)}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                The Good Game Ligaen season ID
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="name">Season Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Spring 2024"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                A friendly name for the season
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="start_date">Start Date *</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) =>
                    handleInputChange('start_date', e.target.value)
                  }
                  disabled={isLoading}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="end_date">End Date</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) =>
                    handleInputChange('end_date', e.target.value)
                  }
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">Optional</p>
              </div>
            </div>

            <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="activate" className="cursor-pointer text-base">
                  Activate immediately
                </Label>
                <p className="text-sm text-muted-foreground">
                  Make this the active season right away
                </p>
              </div>
              <Switch
                id="activate"
                checked={formData.activate}
                onCheckedChange={(checked) =>
                  handleInputChange('activate', checked)
                }
                disabled={isLoading}
              />
            </div>

            {formData.activate && hasActiveSeason && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Activating this season will deactivate the current active
                  season. This will reset the main leaderboard view to show only
                  this season&apos;s data.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Season
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
