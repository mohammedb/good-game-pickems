'use client'

import React, { useState } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/use-toast'
import {
  MoreVertical,
  Play,
  StopCircle,
  Trash2,
  Edit,
  Loader2,
} from 'lucide-react'
import { Season } from './season-management-card'

interface SeasonActionsProps {
  season: Season
  onAction?: () => void
}

export function SeasonActions({ season, onAction }: SeasonActionsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showActivateDialog, setShowActivateDialog] = useState(false)
  const [showEndDialog, setShowEndDialog] = useState(false)

  const handleActivate = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(
        `/api/admin/seasons/${season.season_id}/activate`,
        {
          method: 'POST',
        },
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to activate season')
      }

      toast({
        title: 'Success',
        description: `Season "${season.name}" is now active`,
      })

      if (onAction) onAction()
    } catch (error) {
      console.error('Error activating season:', error)
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to activate season',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
      setShowActivateDialog(false)
    }
  }

  const handleEnd = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(
        `/api/admin/seasons/${season.season_id}/activate`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            end_date: new Date().toISOString(),
          }),
        },
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to end season')
      }

      toast({
        title: 'Success',
        description: `Season "${season.name}" has been ended`,
      })

      if (onAction) onAction()
    } catch (error) {
      console.error('Error ending season:', error)
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to end season',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
      setShowEndDialog(false)
    }
  }

  const handleDelete = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/seasons/${season.season_id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete season')
      }

      toast({
        title: 'Success',
        description: `Season "${season.name}" has been deleted`,
      })

      if (onAction) onAction()
    } catch (error) {
      console.error('Error deleting season:', error)
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to delete season',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
      setShowDeleteDialog(false)
    }
  }

  const canDelete = season.total_matches === 0 && season.total_picks === 0
  const canActivate = !season.is_active
  const canEnd = season.is_active && !season.end_date

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MoreVertical className="h-4 w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />

          {canActivate && (
            <DropdownMenuItem onClick={() => setShowActivateDialog(true)}>
              <Play className="mr-2 h-4 w-4" />
              Activate Season
            </DropdownMenuItem>
          )}

          {canEnd && (
            <DropdownMenuItem onClick={() => setShowEndDialog(true)}>
              <StopCircle className="mr-2 h-4 w-4" />
              End Season
            </DropdownMenuItem>
          )}

          <DropdownMenuItem disabled>
            <Edit className="mr-2 h-4 w-4" />
            Edit Details
          </DropdownMenuItem>

          {canDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setShowDeleteDialog(true)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Season
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Activate Dialog */}
      <AlertDialog
        open={showActivateDialog}
        onOpenChange={setShowActivateDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Activate Season</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to activate &quot;{season.name}&quot;? This
              will deactivate any currently active season and make this the
              primary season for all new matches and leaderboards.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleActivate}>
              Activate Season
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* End Season Dialog */}
      <AlertDialog open={showEndDialog} onOpenChange={setShowEndDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End Season</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to end &quot;{season.name}&quot;? This will
              mark the season as completed and deactivate it. You&apos;ll need
              to activate another season for new matches.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleEnd}>
              End Season
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Season</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{season.name}&quot;? This
              action cannot be undone. The season can only be deleted because it
              has no associated matches or predictions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Season
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
