import { requireAuth } from '@/lib/auth/server'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { UserTrainingProfile } from '@/components/profile/UserTrainingProfile'

export default async function ProfilePage() {
  const user = await requireAuth()

  return (
    <DashboardLayout user={user}>
      <UserTrainingProfile userId={user.id} />
    </DashboardLayout>
  )
} 