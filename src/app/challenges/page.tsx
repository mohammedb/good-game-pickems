import { Card } from '@/components/ui/card'
import { Swords } from 'lucide-react'

export default function ChallengesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="mx-auto max-w-md p-8 text-center">
        <Swords className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
        <h2 className="mb-2 text-2xl font-bold">Utfordringer kommer snart!</h2>
        <p className="text-muted-foreground">
          Vi jobber med å ferdigstille utfordringsfunksjonen. Kom tilbake senere
          for spennende utfordringer og konkurranser!
        </p>
      </Card>
    </div>
  )
}
