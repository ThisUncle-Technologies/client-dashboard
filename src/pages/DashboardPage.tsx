import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { AppLayout } from '../components/layout/AppLayout'
import { supabase } from '../lib/supabase'

interface StatCard {
  label: string
  value: number | string
  sub?: string
}

interface RecentAsset {
  id: string
  url: string
  type: 'image' | 'video'
  title: string | null
  created_at: string
}

export function DashboardPage() {
  const { profile, user } = useAuth()
  const isAdmin = profile?.role === 'admin'

  const [stats, setStats] = useState<StatCard[]>([])
  const [recent, setRecent] = useState<RecentAsset[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    if (isAdmin) loadAdminStats()
    else loadClientStats()
  }, [profile])

  async function loadAdminStats() {
    const [
      { count: clientCount },
      { count: siteCount },
      { count: activeSiteCount },
      { count: mediaCount },
      { count: sectionCount },
      { data: recentAssets },
    ] = await Promise.all([
      supabase.from('clients').select('*', { count: 'exact', head: true }),
      supabase.from('sites').select('*', { count: 'exact', head: true }),
      supabase.from('sites').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('media_assets').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('gallery_sections').select('*', { count: 'exact', head: true }).eq('status', 'published'),
      supabase.from('media_assets').select('id, url, type, title, created_at').eq('status', 'active').order('created_at', { ascending: false }).limit(6),
    ])

    setStats([
      { label: 'Clients', value: clientCount ?? 0 },
      { label: 'Sites', value: siteCount ?? 0, sub: `${activeSiteCount ?? 0} active` },
      { label: 'Media assets', value: mediaCount ?? 0 },
      { label: 'Published sections', value: sectionCount ?? 0 },
    ])
    setRecent(recentAssets ?? [])
    setLoading(false)
  }

  async function loadClientStats() {
    if (!user) return

    const { data: assignments } = await supabase
      .from('site_assignments')
      .select('site_id')
      .eq('profile_id', user.id)

    const siteIds = (assignments ?? []).map(a => a.site_id)

    if (siteIds.length === 0) {
      setStats([
        { label: 'Sites', value: 0 },
        { label: 'Media assets', value: 0 },
        { label: 'Published sections', value: 0 },
      ])
      setLoading(false)
      return
    }

    const [
      { count: mediaCount },
      { count: sectionCount },
      { data: recentAssets },
    ] = await Promise.all([
      supabase.from('media_assets').select('*', { count: 'exact', head: true }).in('site_id', siteIds).eq('status', 'active'),
      supabase.from('gallery_sections').select('*', { count: 'exact', head: true }).in('site_id', siteIds).eq('status', 'published'),
      supabase.from('media_assets').select('id, url, type, title, created_at').in('site_id', siteIds).eq('status', 'active').order('created_at', { ascending: false }).limit(6),
    ])

    setStats([
      { label: 'Sites', value: siteIds.length },
      { label: 'Media assets', value: mediaCount ?? 0 },
      { label: 'Published sections', value: sectionCount ?? 0 },
    ])
    setRecent(recentAssets ?? [])
    setLoading(false)
  }

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <AppLayout title="Overview">

      {/* Greeting */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-0.5">
          {greeting()}, {profile?.full_name?.split(' ')[0] || 'there'}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Here's a summary of your account.
        </p>
      </div>

      {/* Stat cards */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {[...Array(isAdmin ? 4 : 3)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {stats.map(stat => (
            <div
              key={stat.label}
              className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl px-5 py-4"
            >
              <p className="text-2xl font-semibold text-gray-900 dark:text-white mb-0.5">{stat.value}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
              {stat.sub && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{stat.sub}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Recent media */}
      {!loading && recent.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">
            Recently uploaded
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {recent.map(asset => (
              <div
                key={asset.id}
                className="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800"
              >
                {asset.type === 'image' ? (
                  <img
                    src={asset.url}
                    alt={asset.title || ''}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-900">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state for new accounts */}
      {!loading && recent.length === 0 && (
        <div className="flex flex-col items-center justify-center h-40 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl gap-2">
          <p className="text-sm text-gray-400 dark:text-gray-500">No media uploaded yet.</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">Head to Media to upload your first file.</p>
        </div>
      )}

    </AppLayout>
  )
}
