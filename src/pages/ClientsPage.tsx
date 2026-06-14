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

interface CreatedCredentials {
  full_name: string
  email: string
  password: string
}

const empty: FormState = { name: '', slug: '', contact_email: '', contact_phone: '', status: 'active' }

function slugify(value: string) {
  return value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

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

export function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Client | null>(null)
  const [form, setForm] = useState<FormState>(empty)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [credentials, setCredentials] = useState<CreatedCredentials | null>(null)
  const [copiedEmail, setCopiedEmail] = useState(false)
  const [copiedPassword, setCopiedPassword] = useState(false)

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
    setCredentials(null)
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
    setCredentials(null)
    setModalOpen(true)
  }

  function handleNameChange(value: string) {
    setForm(f => ({
      ...f,
      name: value,
      slug: editing ? f.slug : slugify(value),
    }))
  }

  async function copyField(value: string, type: 'email' | 'password') {
    await navigator.clipboard.writeText(value)
    if (type === 'email') { setCopiedEmail(true); setTimeout(() => setCopiedEmail(false), 2000) }
    else { setCopiedPassword(true); setTimeout(() => setCopiedPassword(false), 2000) }
  }

  async function handleSave() {
    if (!form.name.trim() || !form.slug.trim()) {
      setError('Name and slug are required.')
      return
    }
    if (!editing && !form.contact_email.trim()) {
      setError('Contact email is required to create a login account.')
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

    if (editing) {
      // Edit: just update the client record
      const { error: dbError } = await supabase.from('clients').update(payload).eq('id', editing.id)
      if (dbError) { setError(dbError.message); setSaving(false); return }
      setModalOpen(false)
      fetchClients()
    } else {
      // Create: insert client then create login account
      const { error: dbError } = await supabase.from('clients').insert(payload)
      if (dbError) { setError(dbError.message); setSaving(false); return }

      const password = generatePassword()
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            full_name: form.name.trim(),
            email: form.contact_email.trim(),
            password,
          }),
        }
      )

      const json = await res.json()
      if (!res.ok) {
        setError(`Client created but login account failed: ${json.error}`)
      } else {
        setCredentials({ full_name: form.name.trim(), email: form.contact_email.trim(), password })
        fetchClients()
      }
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
                      client.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-400'
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

            {/* Credentials confirmation */}
            {credentials ? (
              <>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-gray-900">Client created</h2>
                    <p className="text-xs text-gray-400">Copy the login credentials before closing.</p>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="px-4 py-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-400 mb-1">Client name</p>
                    <p className="text-sm font-medium text-gray-900">{credentials.full_name}</p>
                  </div>

                  <div className="px-4 py-3 bg-gray-50 rounded-lg flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs text-gray-400 mb-1">Login email</p>
                      <p className="text-sm font-medium text-gray-900 truncate">{credentials.email}</p>
                    </div>
                    <button onClick={() => copyField(credentials.email, 'email')} className="shrink-0 text-gray-400 hover:text-gray-900 transition-colors">
                      {copiedEmail
                        ? <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        : <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                      }
                    </button>
                  </div>

                  <div className="px-4 py-3 bg-gray-50 rounded-lg flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs text-gray-400 mb-1">Password</p>
                      <p className="text-sm font-mono font-medium text-gray-900 truncate">{credentials.password}</p>
                    </div>
                    <button onClick={() => copyField(credentials.password, 'password')} className="shrink-0 text-gray-400 hover:text-gray-900 transition-colors">
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
                  onClick={() => setModalOpen(false)}
                  className="w-full py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-700 transition-colors"
                >
                  Done
                </button>
              </>
            ) : (
              <>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact email
                      {!editing && <span className="text-gray-400 font-normal"> — used as login email</span>}
                    </label>
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

                  {!editing && (
                    <p className="text-xs text-gray-400 bg-gray-50 px-3 py-2 rounded-md">
                      A login account will be created automatically using the contact email above.
                    </p>
                  )}

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
                    {saving ? 'Creating...' : editing ? 'Save changes' : 'Create client'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </AppLayout>
  )
}
