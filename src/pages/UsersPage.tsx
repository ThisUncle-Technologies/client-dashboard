import { useEffect, useState } from 'react'
import { AppLayout } from '../components/layout/AppLayout'
import { supabase } from '../lib/supabase'

interface Profile {
  id: string
  full_name: string | null
  email: string | null
  role: 'admin' | 'client'
  created_at: string
}

interface Site {
  id: string
  name: string
  slug: string
  clients: { name: string } | null
}

interface Assignment {
  id: string
  site_id: string
}

export function UsersPage() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Profile | null>(null)
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [panelOpen, setPanelOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  async function fetchProfiles() {
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, created_at')
      .order('full_name')
    setProfiles(data ?? [])
    setLoading(false)
  }

  async function fetchSites() {
    const { data } = await supabase
      .from('sites')
      .select('id, name, slug, clients(name)')
      .order('name')
    setSites((data as unknown as Site[]) ?? [])
  }

  async function fetchAssignments(profileId: string) {
    const { data } = await supabase
      .from('site_assignments')
      .select('id, site_id')
      .eq('profile_id', profileId)
    setAssignments(data ?? [])
  }

  useEffect(() => {
    fetchProfiles()
    fetchSites()
  }, [])

  async function openPanel(profile: Profile) {
    setSelected(profile)
    await fetchAssignments(profile.id)
    setPanelOpen(true)
  }

  function isAssigned(siteId: string) {
    return assignments.some(a => a.site_id === siteId)
  }

  async function toggleAssignment(siteId: string) {
    if (!selected) return
    setSaving(true)
    const existing = assignments.find(a => a.site_id === siteId)
    if (existing) {
      await supabase.from('site_assignments').delete().eq('id', existing.id)
    } else {
      await supabase.from('site_assignments').insert({ profile_id: selected.id, site_id: siteId })
    }
    await fetchAssignments(selected.id)
    setSaving(false)
  }

  return (
    <AppLayout title="Users">

      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-gray-500 dark:text-gray-400">{profiles.length} user{profiles.length !== 1 ? 's' : ''}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500">Login accounts are created automatically when adding a client.</p>
      </div>

      {/* Table */}
      {loading ? (
        <p className="text-sm text-gray-400 dark:text-gray-500">Loading...</p>
      ) : (
        <div className="border border-gray-100 dark:border-gray-800 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Email</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Role</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {profiles.map(profile => (
                <tr key={profile.id} className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{profile.full_name || '—'}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{profile.email}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block text-[10px] uppercase tracking-widest px-2 py-0.5 rounded ${
                      profile.role === 'admin' ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                    }`}>
                      {profile.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => openPanel(profile)}
                      className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                      Manage sites
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Side panel */}
      {panelOpen && selected && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/20" onClick={() => setPanelOpen(false)} />
          <div className="relative bg-white dark:bg-gray-900 w-full max-w-sm h-full shadow-xl flex flex-col">

            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{selected.full_name || selected.email}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{selected.email}</p>
              </div>
              <button
                onClick={() => setPanelOpen(false)}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors mt-0.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">Site access</p>
              {sites.length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-gray-500">No sites found. Add sites first.</p>
              ) : (
                <div className="space-y-2">
                  {sites.map(site => (
                    <label
                      key={site.id}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={isAssigned(site.id)}
                        onChange={() => toggleAssignment(site.id)}
                        disabled={saving}
                        className="accent-gray-900 dark:accent-white"
                      />
                      <div className="min-w-0">
                        <p className="text-sm text-gray-900 dark:text-white font-medium truncate">{site.name}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{site.clients?.name}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-800">
              <p className="text-xs text-gray-400 dark:text-gray-500">Changes save automatically.</p>
            </div>
          </div>
        </div>
      )}

    </AppLayout>
  )
}
