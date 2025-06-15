import { requireAuth } from '@/lib/auth/server';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { GoalsPageClient } from './client';

export default async function GoalsPage() {
  const user = await requireAuth();

  return (
    <DashboardLayout user={user}>
      <GoalsPageClient />
    </DashboardLayout>
  );
} 