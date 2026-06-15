import { useEffect, useState } from 'react'
import { AppLayout } from '../components/layout/AppLayout'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

interface Site {
  id: string
  name: string
  slug: string
  domain: string | null
  status: 'active' | 'inactive' | 'maintenance'
  integration_type: 'static' | 'dynamic'
  client_id: string
  umami_share_url: string | null
  clients: { name: string } | null
}

interface Client {
  id: string
  name: string
}

interface FormState {
  name: string
  slug: string
  domain: string
  client_id: string
  status: 'active' | 'inactive' | 'maintenance'
  integration_type: 'static' | 'dynamic'
  umami_share_url: string
}

const empty: FormState = {
  name: '', slug: '', domain: '', client_id: '',
  status: 'active', integration_type: 'static',
  umami_share_url: '',
}

function slugify(value: string) {
  return value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

const statusStyles: Record<Site['status'], string> = {
  active: 'bg-green-50 text-green-700',
  inactive: 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500',
  maintenance: 'bg-yellow-50 text-yellow-700',
}

export function SitesPage() {
  const { profile } = useAuth()
  const isAdmin = profile?.role === 'admin'

  const [sites, setSites] = useState<Site[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Site | null>(null)
  const [form, setForm] = useState<FormState>(empty)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function fetchSites() {
    setLoading(true)
    const { data } = await supabase
      .from('sites')
      .select('id, name, slug, domain, status, integration_type, client_id, umami_share_url, clients(name)')
      .order('name')
    setSites((data as unknown as Site[]) ?? [])
    setLoading(false)
  }

  async function fetchClients() {
    const { data } = await supabase.from('clients').select('id, name').eq('status', 'active').order('name')
    setClients(data ?? [])
  }

  useEffect(() => {
    fetchSites()
    if (isAdmin) fetchClients()
  }, [isAdmin])

  function openNew() {
    setEditing(null)
    setForm(empty)
    setError(null)
    setModalOpen(true)
  }

  function openEdit(site: Site) {
    setEditing(site)
    setForm({
      name: site.name,
      slug: site.slug,
      domain: site.domain ?? '',
      client_id: site.client_id,
      status: site.status,
      integration_type: site.integration_type,
      umami_share_url: site.umami_share_url ?? '',
    })
    setError(null)
    setModalOpen(true)
  }

  function handleNameChange(value: string) {
    setForm(f => ({
      ...f,
      name: value,
      slug: editing ? f.slug : slugify(value),
    }))
  }

  async function handleSave() {
    if (!form.name.trim() || !form.slug.trim() || !form.client_id) {
      setError('Name, slug and client are required.')
      return
    }
    setSaving(true)
    setError(null)

    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      domain: form.domain.trim() || null,
      client_id: form.client_id,
      status: form.status,
      integration_type: form.integration_type,
      umami_share_url: form.umami_share_url.trim() || null,
    }

    const { error: dbError } = editing
      ? await supabase.from('sites').update(payload).eq('id', editing.id)
      : await supabase.from('sites').insert(payload)

    if (dbError) {
      setError(dbError.message)
    } else {
      setModalOpen(false)
      fetchSites()
    }
    setSaving(false)
  }

  const inputCls = 'w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:outline-none focus:border-gray-900 dark:focus:border-gray-400 transition-colors'

  return (
    <AppLayout title="Sites">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-gray-500 dark:text-gray-400">{sites.length} site{sites.length !== 1 ? 's' : ''}</p>
        {isAdmin && (
          <button
            onClick={openNew}
            className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium rounded-md hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors"
          >
            + New site
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <p className="text-sm text-gray-400 dark:text-gray-500">Loading...</p>
      ) : sites.length === 0 ? (
        <div className="flex items-center justify-center h-48 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
          <p className="text-sm text-gray-400 dark:text-gray-500">No sites yet. Add your first one.</p>
        </div>
      ) : (
        <div className="border border-gray-100 dark:border-gray-800 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Site</th>
                {isAdmin && <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Client</th>}
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Domain</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Type</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Status</th>
                {isAdmin && <th className="px-4 py-3" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {sites.map(site => (
                <tr key={site.id} className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900 dark:text-white">{site.name}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 font-mono">{site.slug}</p>
                  </td>
                  {isAdmin && <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{site.clients?.name || '—'}</td>}
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                    {site.domain
                      ? <a href={`https://${site.domain}`} target="_blank" rel="noreferrer" className="hover:text-gray-900 dark:hover:text-white transition-colors">{site.domain}</a>
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-gray-500">{site.integration_type}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block text-[10px] uppercase tracking-widest px-2 py-0.5 rounded ${statusStyles[site.status]}`}>
                      {site.status}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => openEdit(site)}
                        className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                      >
                        Edit
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-md mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-5">
              {editing ? 'Edit site' : 'New site'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Client</label>
                <select
                  value={form.client_id}
                  onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))}
                  className={inputCls}
                >
                  <option value="">Select a client</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Site name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => handleNameChange(e.target.value)}
                  className={inputCls}
                  placeholder="Gibeon Builders Website"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Slug</label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={e => setForm(f => ({ ...f, slug: slugify(e.target.value) }))}
                  className={inputCls + ' font-mono'}
                  placeholder="gibeon-builders-website"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Domain</label>
                <input
                  type="text"
                  value={form.domain}
                  onChange={e => setForm(f => ({ ...f, domain: e.target.value }))}
                  className={inputCls}
                  placeholder="gibeonbuilders.co.tz"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Umami share URL</label>
                <input
                  type="url"
                  value={form.umami_share_url}
                  onChange={e => setForm(f => ({ ...f, umami_share_url: e.target.value }))}
                  className={inputCls}
                  placeholder="https://cloud.umami.is/share/..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={e => setForm(f => ({ ...f, status: e.target.value as FormState['status'] }))}
                    className={inputCls}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Integration</label>
                  <select
                    value={form.integration_type}
                    onChange={e => setForm(f => ({ ...f, integration_type: e.target.value as FormState['integration_type'] }))}
                    className={inputCls}
                  >
                    <option value="static">Static</option>
                    <option value="dynamic">Dynamic</option>
                  </select>
                </div>
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setModalOpen(false)}
                className="flex-1 py-2 border border-gray-200 dark:border-gray-700 rounded-md text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-md text-sm font-medium hover:bg-gray-700 dark:hover:bg-gray-100 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Saving...' : editing ? 'Save changes' : 'Create site'}
              </button>
            </div>
          </div>
        </div>
      )}

    </AppLayout>
  )
}
