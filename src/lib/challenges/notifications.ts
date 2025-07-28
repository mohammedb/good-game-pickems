import { createServiceRoleClient } from '@/utils/supabase-server'

export interface ChallengeNotificationData {
  type:
    | 'challenge_received'
    | 'challenge_accepted'
    | 'challenge_declined'
    | 'challenge_completed'
  recipient_id: string
  sender_id: string
  challenge_id: string
  message: string
  stake_points?: number
  winner_id?: string | null
}

export async function sendChallengeNotification(
  data: ChallengeNotificationData,
) {
  const supabase = createServiceRoleClient()

  try {
    // Create notification record
    const { error } = await supabase.from('notifications').insert({
      user_id: data.recipient_id,
      type: data.type,
      title: getNotificationTitle(data.type),
      message: data.message,
      data: {
        challenge_id: data.challenge_id,
        sender_id: data.sender_id,
        stake_points: data.stake_points,
        winner_id: data.winner_id,
      },
      read: false,
    })

    if (error) {
      console.error('Error creating notification:', error)
      return false
    }

    // TODO: Send real-time notification via websocket/push notification

    return true
  } catch (error) {
    console.error('Error sending challenge notification:', error)
    return false
  }
}

function getNotificationTitle(type: ChallengeNotificationData['type']): string {
  switch (type) {
    case 'challenge_received':
      return 'New Challenge!'
    case 'challenge_accepted':
      return 'Challenge Accepted!'
    case 'challenge_declined':
      return 'Challenge Declined'
    case 'challenge_completed':
      return 'Challenge Completed!'
    default:
      return 'Challenge Update'
  }
}
