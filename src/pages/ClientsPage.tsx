import { useEffect, useState } from 'react'
import { AppLayout } from '../components/layout/AppLayout'
import { supabase } from '../lib/supabase'

interface Client {
  id: string
  name: string
  slug: string
  contact_email: string | null
  contact_phone: string | null
  status: 'active' | 'inactive'
  created_at: string
}

interface FormState {
  name: string
  slug: string
  contact_email: string
  contact_phone: string
  status: 'active' | 'inactive'
}

const empty: FormState = { name: '', slug: '', contact_email: '', contact_phone: '', status: 'active' }

function slugify(value: string) {
  return value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

export function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Client | null>(null)
  const [form, setForm] = useState<FormState>(empty)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function fetchClients() {
    setLoading(true)
    const { data } = await supabase
      .from('clients')
      .select('id, name, slug, contact_email, contact_phone, status, created_at')
      .order('name')
    setClients(data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchClients() }, [])

  function openNew() {
    setEditing(null)
    setForm(empty)
    setError(null)
    setModalOpen(true)
  }

  function openEdit(client: Client) {
    setEditing(client)
    setForm({
      name: client.name,
      slug: client.slug,
      contact_email: client.contact_email ?? '',
      contact_phone: client.contact_phone ?? '',
      status: client.status,
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
    if (!form.name.trim() || !form.slug.trim()) {
      setError('Name and slug are required.')
      return
    }
    setSaving(true)
    setError(null)

    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      contact_email: form.contact_email.trim() || null,
      contact_phone: form.contact_phone.trim() || null,
      status: form.status,
    }

    const { error: dbError } = editing
      ? await supabase.from('clients').update(payload).eq('id', editing.id)
      : await supabase.from('clients').insert(payload)

    if (dbError) {
      setError(dbError.message)
    } else {
      setModalOpen(false)
      fetchClients()
    }
    setSaving(false)
  }

  return (
    <AppLayout title="Clients">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-gray-500">{clients.length} client{clients.length !== 1 ? 's' : ''}</p>
        <button
          onClick={openNew}
          className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-700 transition-colors"
        >
          + New client
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <p className="text-sm text-gray-400">Loading...</p>
      ) : clients.length === 0 ? (
        <div className="flex items-center justify-center h-48 border border-dashed border-gray-200 rounded-lg">
          <p className="text-sm text-gray-400">No clients yet. Add your first one.</p>
        </div>
      ) : (
        <div className="border border-gray-100 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 font-medium text-gray-500">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Slug</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Email</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Phone</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {clients.map(client => (
                <tr key={client.id} className="bg-white hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{client.name}</td>
                  <td className="px-4 py-3 text-gray-400 font-mono text-xs">{client.slug}</td>
                  <td className="px-4 py-3 text-gray-500">{client.contact_email || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{client.contact_phone || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block text-[10px] uppercase tracking-widest px-2 py-0.5 rounded ${
                      client.status === 'active'
                        ? 'bg-green-50 text-green-700'
                        : 'bg-gray-100 text-gray-400'
                    }`}>
                      {client.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => openEdit(client)}
                      className="text-xs text-gray-400 hover:text-gray-900 transition-colors"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-5">
              {editing ? 'Edit client' : 'New client'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => handleNameChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-900 transition-colors"
                  placeholder="Gibeon Builders"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={e => setForm(f => ({ ...f, slug: slugify(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm font-mono focus:outline-none focus:border-gray-900 transition-colors"
                  placeholder="gibeon-builders"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact email</label>
                <input
                  type="email"
                  value={form.contact_email}
                  onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-900 transition-colors"
                  placeholder="client@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact phone</label>
                <input
                  type="tel"
                  value={form.contact_phone}
                  onChange={e => setForm(f => ({ ...f, contact_phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-900 transition-colors"
                  placeholder="+255 700 000 000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={form.status}
                  onChange={e => setForm(f => ({ ...f, status: e.target.value as 'active' | 'inactive' }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-900 transition-colors bg-white"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setModalOpen(false)}
                className="flex-1 py-2 border border-gray-200 rounded-md text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Saving...' : editing ? 'Save changes' : 'Create client'}
              </button>
            </div>
          </div>
        </div>
      )}

    </AppLayout>
  )
}
