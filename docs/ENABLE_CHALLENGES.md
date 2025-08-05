# Re-enabling Challenges Feature

This guide provides step-by-step instructions to re-enable the challenges feature after it has been temporarily disabled.

## Quick Enable Steps

To re-enable the challenges feature, you need to make the following changes:

### 1. Restore Navigation Link

**File:** `src/components/Navigation.tsx`

Find this section (around line 35-45):

```typescript
const navItems: NavItem[] = [
  {
    href: '/matches',
    label: 'Kamper',
    icon: Calendar,
    id: 'nav-matches',
  },
  // Temporarily disabled - coming soon
  // {
  //   href: '/challenges',
  //   label: 'Utfordringer',
  //   icon: Swords,
  //   id: 'nav-challenges',
  // },
```

**Action:** Uncomment the challenges navigation item:

```typescript
const navItems: NavItem[] = [
  {
    href: '/matches',
    label: 'Kamper',
    icon: Calendar,
    id: 'nav-matches',
  },
  {
    href: '/challenges',
    label: 'Utfordringer',
    icon: Swords,
    id: 'nav-challenges',
  },
```

### 2. Restore Challenges Page

**File:** `src/app/challenges/page.tsx`

Current "Coming Soon" content:

```typescript
import { Card } from '@/components/ui/card'
import { Swords } from 'lucide-react'

export default function ChallengesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="mx-auto max-w-md p-8 text-center">
        <Swords className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
        <h2 className="mb-2 text-2xl font-bold">Utfordringer kommer snart!</h2>
        <p className="text-muted-foreground">
          Vi jobber med å ferdigstille utfordringsfunksjonen. 
          Kom tilbake senere for spennende utfordringer og konkurranser!
        </p>
      </Card>
    </div>
  )
}
```

**Action:** Replace with the original functional component:

```typescript
import { ActiveChallengesList } from '@/components/challenges/active-challenges-list'

export default function ChallengesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <ActiveChallengesList />
    </div>
  )
}
```

### 3. Update Challenge Detail Page Redirect (Optional)

**File:** `src/app/challenges/[id]/page.tsx`

If you want the back button in challenge details to go back to the challenges list instead of home:

Find (around line 265):

```typescript
<Button
  variant="ghost"
  size="icon"
  onClick={() => router.push('/')}
  className="transition-transform hover:scale-110"
>
  <ArrowLeft className="h-4 w-4" />
</Button>
```

**Action:** Change the redirect to `/challenges`:

```typescript
<Button
  variant="ghost"
  size="icon"
  onClick={() => router.push('/challenges')}
  className="transition-transform hover:scale-110"
>
  <ArrowLeft className="h-4 w-4" />
</Button>
```

## Verification Steps

After making these changes:

1. **Check Navigation**: Verify that "Utfordringer" appears in both desktop and mobile navigation menus
2. **Test Page Access**: Navigate to `/challenges` and confirm the active challenges list loads
3. **Test Challenge Details**: Click on a challenge to ensure the detail page works correctly
4. **Test Back Navigation**: Verify the back button works as expected

## Additional Considerations

### Before Re-enabling

1. **Test all challenge features** thoroughly:
   - Creating new challenges
   - Accepting/declining challenges
   - Making predictions
   - Point calculations
   - Challenge completion

2. **Check database migrations** are up to date:
   - `create_challenges_tables.sql` has been run
   - All challenge-related tables exist

3. **Verify API endpoints** are working:
   - `/api/challenges`
   - `/api/challenges/[id]`
   - `/api/challenges/[id]/picks`

### Feature Flags (Future Enhancement)

Consider implementing a feature flag system for easier enable/disable:

```typescript
// Example feature flag in environment variables
NEXT_PUBLIC_FEATURE_CHALLENGES_ENABLED=true
```

This would allow toggling features without code changes.

## Rollback

If you need to disable challenges again, simply reverse the steps above:
1. Comment out the navigation item
2. Replace the page content with the "Coming Soon" message
3. Update the back button redirect to home page

---

**Last Updated:** January 5, 2025  
**Status:** Challenges feature is currently DISABLED
