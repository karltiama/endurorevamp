import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { SubmissionsDashboard } from '@/components/admin/SubmissionsDashboard';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// Force dynamic rendering for admin pages
export const dynamic = 'force-dynamic';

export default async function AdminSubmissionsPage() {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      redirect('/auth/login?message=Please log in to access admin features');
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('user_training_profiles')
      .select('is_admin')
      .eq('user_id', user.id)
      .single();

    if (!profile?.is_admin) {
      redirect('/dashboard?message=Access denied. Admin privileges required.');
    }

      return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Form Submissions</h1>
          <p className="text-muted-foreground">
            Manage contact forms and feature suggestions from users
          </p>
        </div>

        <Suspense fallback={<SubmissionsSkeleton />}>
          <SubmissionsDashboard />
        </Suspense>
      </div>
    );
  } catch (error) {
    console.error('Admin submissions page error:', error);
    redirect('/dashboard?message=Unable to load admin page');
  }
}

function SubmissionsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-4 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-32 mb-4" />
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 