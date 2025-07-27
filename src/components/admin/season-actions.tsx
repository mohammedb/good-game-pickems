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
        title: 'Suksess',
        description: `Sesongen "${season.name}" er nå aktiv`,
      })

      if (onAction) onAction()
    } catch (error) {
      console.error('Error activating season:', error)
      toast({
        title: 'Feil',
        description:
          error instanceof Error
            ? error.message
            : 'Kunne ikke aktivere sesongen',
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
        title: 'Suksess',
        description: `Sesongen "${season.name}" har blitt avsluttet`,
      })

      if (onAction) onAction()
    } catch (error) {
      console.error('Error ending season:', error)
      toast({
        title: 'Feil',
        description:
          error instanceof Error
            ? error.message
            : 'Kunne ikke avslutte sesongen',
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
        title: 'Suksess',
        description: `Sesongen "${season.name}" har blitt slettet`,
      })

      if (onAction) onAction()
    } catch (error) {
      console.error('Error deleting season:', error)
      toast({
        title: 'Feil',
        description:
          error instanceof Error ? error.message : 'Kunne ikke slette sesongen',
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
          <DropdownMenuLabel>Handlinger</DropdownMenuLabel>
          <DropdownMenuSeparator />

          {canActivate && (
            <DropdownMenuItem onClick={() => setShowActivateDialog(true)}>
              <Play className="mr-2 h-4 w-4" />
              Aktiver Sesong
            </DropdownMenuItem>
          )}

          {canEnd && (
            <DropdownMenuItem onClick={() => setShowEndDialog(true)}>
              <StopCircle className="mr-2 h-4 w-4" />
              Avslutt Sesong
            </DropdownMenuItem>
          )}

          <DropdownMenuItem disabled>
            <Edit className="mr-2 h-4 w-4" />
            Rediger Detaljer
          </DropdownMenuItem>

          {canDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setShowDeleteDialog(true)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Slett Sesong
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
            <AlertDialogTitle>Aktiver Sesong</AlertDialogTitle>
            <AlertDialogDescription>
              Er du sikker på at du vil aktivere &quot;{season.name}&quot;?
              Dette vil deaktivere den nåværende aktive sesongen og gjøre denne
              til hovedsesongen for alle nye matcher og leaderboards.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction onClick={handleActivate}>
              Aktiver Sesong
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* End Season Dialog */}
      <AlertDialog open={showEndDialog} onOpenChange={setShowEndDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Avslutt Sesong</AlertDialogTitle>
            <AlertDialogDescription>
              Er du sikker på at du vil avslutte &quot;{season.name}&quot;?
              Dette vil markere sesongen som fullført og deaktivere den. Du må
              aktivere en annen sesong for nye matcher.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction onClick={handleEnd}>
              Avslutt Sesong
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Slett Sesong</AlertDialogTitle>
            <AlertDialogDescription>
              Er du sikker på at du vil slette &quot;{season.name}&quot;? Denne
              handlingen kan ikke angres. Sesongen kan kun slettes fordi den
              ikke har noen tilknyttede matcher eller predictions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Slett Sesong
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
