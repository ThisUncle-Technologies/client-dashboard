import { useAuth } from '../context/AuthContext'
import { AppLayout } from '../components/layout/AppLayout'

export function DashboardPage() {
  const { profile } = useAuth()

  return (
    <AppLayout title="Overview">
      <div className="max-w-2xl">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
          Welcome back, {profile?.full_name || 'there'}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          This is your client dashboard. Use the sidebar to navigate.
        </p>
      </div>
    </AppLayout>
  )
}
