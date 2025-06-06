import { requireAuth } from '@/lib/auth/server'
import LogoutButton from '@/components/LogoutButton'

export default async function DashboardPage() {
  const user = await requireAuth()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">
              Welcome to your Dashboard!
            </h1>
            
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  User Information
                </h3>
                <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Email</dt>
                    <dd className="mt-1 text-sm text-gray-900">{user.email}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">User ID</dt>
                    <dd className="mt-1 text-sm text-gray-900">{user.id}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Created At</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {new Date(user.created_at!).toLocaleDateString()}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Provider</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {user.app_metadata.provider || 'email'}
                    </dd>
                  </div>
                </dl>
                
                <div className="mt-6">
                  <LogoutButton />
                </div>
              </div>
            </div>
            
            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-lg font-medium text-blue-900 mb-2">Next Steps</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Set up your training goals</li>
                <li>• Connect your Strava account</li>
                <li>• Import your activity history</li>
                <li>• Explore training insights</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 