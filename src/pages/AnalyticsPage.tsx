import { useEffect, useState } from 'react'
import { AppLayout } from '../components/layout/AppLayout'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

interface Site {
  id: string
  name: string
  slug: string
  umami_share_url: string | null
}

export function AnalyticsPage() {
  const { profile, user } = useAuth()
  const { theme } = useTheme()
  const isAdmin = profile?.role === 'admin'

  const [sites, setSites] = useState<Site[]>([])
  const [selectedSite, setSelectedSite] = useState<Site | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    isAdmin ? fetchAllSites() : fetchAssignedSites()
  }, [profile])

  async function fetchAllSites() {
    const { data } = await supabase
      .from('sites')
      .select('id, name, slug, umami_share_url')
      .order('name')
    const list = data ?? []
    setSites(list)
    setSelectedSite(list[0] ?? null)
    setLoading(false)
  }

  async function fetchAssignedSites() {
    if (!user) return
    const { data: assignments } = await supabase
      .from('site_assignments')
      .select('site_id')
      .eq('profile_id', user.id)

    const siteIds = (assignments ?? []).map(a => a.site_id)
    if (siteIds.length === 0) { setLoading(false); return }

    const { data } = await supabase
      .from('sites')
      .select('id, name, slug, umami_share_url')
      .in('id', siteIds)
      .order('name')
    const list = data ?? []
    setSites(list)
    setSelectedSite(list[0] ?? null)
    setLoading(false)
  }

  function themedUrl(url: string) {
    const base = url.split('?')[0]
    return `${base}?theme=${theme}`
  }

  return (
    <AppLayout title="Analytics">
      <div className="flex flex-col" style={{ height: 'calc(100vh - 56px - 48px)' }}>

        {/* Site selector */}
        {!loading && sites.length > 1 && (
          <div className="flex items-center gap-1.5 flex-wrap mb-4 shrink-0">
            {sites.map(s => (
              <button
                key={s.id}
                onClick={() => setSelectedSite(s)}
                className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                  selectedSite?.id === s.id
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white'
                    : 'bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
        )}

        {/* Content area */}
        <div className="flex-1 min-h-0 rounded-xl overflow-hidden">
          {loading ? (
            <div className="w-full h-full bg-gray-100 dark:bg-gray-800 animate-pulse rounded-xl" />
          ) : sites.length === 0 ? (
            <div className="flex items-center justify-center h-full border border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
              <p className="text-sm text-gray-400 dark:text-gray-500">No sites assigned to your account.</p>
            </div>
          ) : selectedSite?.umami_share_url ? (
            <iframe
              key={`${selectedSite.id}-${theme}`}
              src={themedUrl(selectedSite.umami_share_url)}
              className="w-full h-full border-0"
              title={`${selectedSite.name} Analytics`}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full border border-dashed border-gray-200 dark:border-gray-700 rounded-xl gap-2">
              <svg className="w-8 h-8 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="text-sm text-gray-500 dark:text-gray-400">No analytics connected for {selectedSite?.name}.</p>
              {isAdmin && (
                <p className="text-xs text-gray-400 dark:text-gray-500">Add the Umami share URL in Sites → Edit.</p>
              )}
            </div>
          )}
        </div>

      </div>
    </AppLayout>
  )
}
