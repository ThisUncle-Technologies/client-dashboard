import { useAuth } from '../context/AuthContext'

export function DashboardPage() {
  const { profile, signOut } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
      <div className="text-center">
        <p className="text-xs tracking-widest uppercase text-gray-400 mb-1">ThisUncle Technologies</p>
        <h1 className="text-xl font-semibold text-gray-900 mb-1">Client Dashboard</h1>
        <p className="text-sm text-gray-500 mb-6">
          Welcome, {profile?.full_name || profile?.email} &middot; <span className="uppercase text-xs">{profile?.role}</span>
        </p>
        <button
          onClick={signOut}
          className="text-sm text-gray-400 hover:text-gray-900 underline transition-colors"
        >
          Sign out
        </button>
      </div>
    </div>
  )
}
