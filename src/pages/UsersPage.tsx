import { useEffect, useState } from 'react'
import { AppLayout } from '../components/layout/AppLayout'
import { supabase } from '../lib/supabase'

function generatePassword(): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const lower = 'abcdefghjkmnpqrstuvwxyz'
  const digits = '23456789'
  const symbols = '!@#$%&*'
  const all = upper + lower + digits + symbols
  const rand = (set: string) => set[Math.floor(Math.random() * set.length)]
  const base = [rand(upper), rand(lower), rand(digits), rand(symbols)]
  for (let i = 0; i < 10; i++) base.push(rand(all))
  return base.sort(() => Math.random() - 0.5).join('')
}

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

interface CreateForm {
  full_name: string
  email: string
  password: string
}

export function UsersPage() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Profile | null>(null)
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [panelOpen, setPanelOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  // Create user modal
  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState<CreateForm>({ full_name: '', email: '', password: '' })
  const [createError, setCreateError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [createdUser, setCreatedUser] = useState<{ full_name: string; email: string; password: string } | null>(null)
  const [copiedEmail, setCopiedEmail] = useState(false)
  const [copiedPassword, setCopiedPassword] = useState(false)

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

  function openCreate() {
    setCreateForm({ full_name: '', email: '', password: generatePassword() })
    setCreateError(null)
    setCopied(false)
    setShowPassword(false)
    setCreatedUser(null)
    setCreateOpen(true)
  }

  async function copyPassword() {
    await navigator.clipboard.writeText(createForm.password)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleCreate() {
    if (!createForm.full_name.trim() || !createForm.email.trim() || !createForm.password) {
      setCreateError('All fields are required.')
      return
    }
    setCreating(true)
    setCreateError(null)

    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify(createForm),
      }
    )

    const json = await res.json()
    if (!res.ok) {
      setCreateError(json.error || 'Failed to create user.')
    } else {
      setCreatedUser({
        full_name: createForm.full_name,
        email: createForm.email,
        password: createForm.password,
      })
      fetchProfiles()
    }
    setCreating(false)
  }

  async function copyField(value: string, type: 'email' | 'password') {
    await navigator.clipboard.writeText(value)
    if (type === 'email') { setCopiedEmail(true); setTimeout(() => setCopiedEmail(false), 2000) }
    else { setCopiedPassword(true); setTimeout(() => setCopiedPassword(false), 2000) }
  }

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

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-gray-500">{profiles.length} user{profiles.length !== 1 ? 's' : ''}</p>
        <button
          onClick={openCreate}
          className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-700 transition-colors"
        >
          + New user
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <p className="text-sm text-gray-400">Loading...</p>
      ) : (
        <div className="border border-gray-100 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 font-medium text-gray-500">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Email</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Role</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {profiles.map(profile => (
                <tr key={profile.id} className="bg-white hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{profile.full_name || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{profile.email}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block text-[10px] uppercase tracking-widest px-2 py-0.5 rounded ${
                      profile.role === 'admin' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {profile.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => openPanel(profile)}
                      className="text-xs text-gray-400 hover:text-gray-900 transition-colors"
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

      {/* Create user modal */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">

          {/* Confirmation screen */}
          {createdUser ? (
            <>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-900">User created</h2>
                  <p className="text-xs text-gray-400">Copy the credentials below before closing.</p>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="px-4 py-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-400 mb-1">Full name</p>
                  <p className="text-sm font-medium text-gray-900">{createdUser.full_name}</p>
                </div>

                <div className="px-4 py-3 bg-gray-50 rounded-lg flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-gray-400 mb-1">Email</p>
                    <p className="text-sm font-medium text-gray-900 truncate">{createdUser.email}</p>
                  </div>
                  <button onClick={() => copyField(createdUser.email, 'email')} className="shrink-0 text-gray-400 hover:text-gray-900 transition-colors">
                    {copiedEmail
                      ? <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      : <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    }
                  </button>
                </div>

                <div className="px-4 py-3 bg-gray-50 rounded-lg flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-gray-400 mb-1">Password</p>
                    <p className="text-sm font-mono font-medium text-gray-900 truncate">{createdUser.password}</p>
                  </div>
                  <button onClick={() => copyField(createdUser.password, 'password')} className="shrink-0 text-gray-400 hover:text-gray-900 transition-colors">
                    {copiedPassword
                      ? <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      : <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 002 2z" /></svg>
                    }
                  </button>
                </div>
              </div>

              <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-md mb-4">
                This password cannot be retrieved after you close this window.
              </p>

              <button
                onClick={() => setCreateOpen(false)}
                className="w-full py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-700 transition-colors"
              >
                Done
              </button>
            </>
          ) : (
            <>
            <h2 className="text-base font-semibold text-gray-900 mb-5">New user</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
                <input
                  type="text"
                  value={createForm.full_name}
                  onChange={e => setCreateForm(f => ({ ...f, full_name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-900 transition-colors"
                  placeholder="David Mwakyusa"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-900 transition-colors"
                  placeholder="david@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={createForm.password}
                    onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))}
                    className="w-full px-3 py-2 pr-20 border border-gray-200 rounded-md text-sm font-mono focus:outline-none focus:border-gray-900 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-9 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
                    aria-label={showPassword ? 'Hide' : 'Show'}
                  >
                    {showPassword ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" /></svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={copyPassword}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
                    aria-label="Copy password"
                  >
                    {copied ? (
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    )}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setCreateForm(f => ({ ...f, password: generatePassword() }))}
                  className="mt-1.5 text-xs text-gray-400 hover:text-gray-900 transition-colors"
                >
                  ↻ Generate new password
                </button>
              </div>

              {createError && <p className="text-sm text-red-500">{createError}</p>}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setCreateOpen(false)}
                className="flex-1 py-2 border border-gray-200 rounded-md text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating}
                className="flex-1 py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors"
              >
                {creating ? 'Creating...' : 'Create user'}
              </button>
            </div>
            </>
          )}
          </div>
        </div>
      )}

      {/* Side panel */}
      {panelOpen && selected && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/20" onClick={() => setPanelOpen(false)} />
          <div className="relative bg-white w-full max-w-sm h-full shadow-xl flex flex-col">

            {/* Panel header */}
            <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">{selected.full_name || selected.email}</p>
                <p className="text-xs text-gray-400 mt-0.5">{selected.email}</p>
              </div>
              <button
                onClick={() => setPanelOpen(false)}
                className="text-gray-400 hover:text-gray-900 transition-colors mt-0.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Site list */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-widest mb-3">Site access</p>
              {sites.length === 0 ? (
                <p className="text-sm text-gray-400">No sites found. Add sites first.</p>
              ) : (
                <div className="space-y-2">
                  {sites.map(site => (
                    <label
                      key={site.id}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={isAssigned(site.id)}
                        onChange={() => toggleAssignment(site.id)}
                        disabled={saving}
                        className="accent-gray-900"
                      />
                      <div className="min-w-0">
                        <p className="text-sm text-gray-900 font-medium truncate">{site.name}</p>
                        <p className="text-xs text-gray-400 truncate">{site.clients?.name}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="px-5 py-4 border-t border-gray-100">
              <p className="text-xs text-gray-400">Changes save automatically.</p>
            </div>
          </div>
        </div>
      )}

    </AppLayout>
  )
}
