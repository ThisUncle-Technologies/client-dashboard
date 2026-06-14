import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { AppLayout } from '../components/layout/AppLayout'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

interface Site {
  id: string
  name: string
  slug: string
}

interface Section {
  id: string
  site_id: string
  title: string
  slug: string
  description: string | null
  layout_type: string
  sort_order: number
  status: 'published' | 'draft'
  created_at: string
}

interface MediaAsset {
  id: string
  url: string
  type: 'image' | 'video'
  title: string | null
}

interface GalleryItem {
  id: string
  section_id: string
  media_asset_id: string | null
  sort_order: number
  status: 'published' | 'draft'
  media_assets: MediaAsset | null
}

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

const emptySection = { title: '', slug: '', description: '', layout_type: 'grid', status: 'draft' as 'published' | 'draft' }

export function GalleryPage() {
  const { profile } = useAuth()
  const isAdmin = profile?.role === 'admin'

  const [sites, setSites] = useState<Site[]>([])
  const [selectedSite, setSelectedSite] = useState<string>('')
  const [sections, setSections] = useState<Section[]>([])
  const [loading, setLoading] = useState(false)

  // section modal
  const [sectionModal, setSectionModal] = useState<'create' | 'edit' | null>(null)
  const [editingSection, setEditingSection] = useState<Section | null>(null)
  const [sectionForm, setSectionForm] = useState(emptySection)
  const [sectionError, setSectionError] = useState('')
  const [savingSection, setSavingSection] = useState(false)

  // delete modal
  const [deleteTarget, setDeleteTarget] = useState<Section | null>(null)
  const [deleting, setDeleting] = useState(false)

  // items panel
  const [activeSection, setActiveSection] = useState<Section | null>(null)
  const [items, setItems] = useState<GalleryItem[]>([])
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([])
  const [itemsLoading, setItemsLoading] = useState(false)
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false)

  async function fetchSites() {
    const { data } = await supabase.from('sites').select('id, name, slug').order('name')
    setSites(data ?? [])
    if (data && data.length > 0) setSelectedSite(data[0].id)
  }

  async function fetchSections(siteId: string) {
    setLoading(true)
    const { data } = await supabase
      .from('gallery_sections')
      .select('*')
      .eq('site_id', siteId)
      .order('sort_order')
    setSections(data ?? [])
    setLoading(false)
  }

  async function fetchItems(sectionId: string) {
    setItemsLoading(true)
    const { data } = await supabase
      .from('gallery_items')
      .select('*, media_assets(id, url, type, title)')
      .eq('section_id', sectionId)
      .order('sort_order')
    setItems((data ?? []) as unknown as GalleryItem[])
    setItemsLoading(false)
  }

  async function fetchMediaAssets(siteId: string) {
    const { data } = await supabase
      .from('media_assets')
      .select('id, url, type, title')
      .eq('site_id', siteId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
    setMediaAssets(data ?? [])
  }

  useEffect(() => { fetchSites() }, [])
  useEffect(() => {
    if (selectedSite) {
      fetchSections(selectedSite)
      setActiveSection(null)
      setItems([])
    }
  }, [selectedSite])

  useEffect(() => {
    if (activeSection) {
      fetchItems(activeSection.id)
      fetchMediaAssets(selectedSite)
    }
  }, [activeSection])

  function openCreate() {
    setSectionForm(emptySection)
    setEditingSection(null)
    setSectionError('')
    setSectionModal('create')
  }

  function openEdit(s: Section) {
    setSectionForm({
      title: s.title,
      slug: s.slug,
      description: s.description ?? '',
      layout_type: s.layout_type,
      status: s.status,
    })
    setEditingSection(s)
    setSectionError('')
    setSectionModal('edit')
  }

  async function handleSectionSubmit(e: FormEvent) {
    e.preventDefault()
    if (!sectionForm.title.trim()) { setSectionError('Title is required'); return }
    setSavingSection(true)
    setSectionError('')

    const payload = {
      site_id: selectedSite,
      title: sectionForm.title.trim(),
      slug: sectionForm.slug || slugify(sectionForm.title),
      description: sectionForm.description || null,
      layout_type: sectionForm.layout_type,
      status: sectionForm.status,
      sort_order: editingSection ? editingSection.sort_order : sections.length,
    }

    const { error } = sectionModal === 'create'
      ? await supabase.from('gallery_sections').insert(payload)
      : await supabase.from('gallery_sections').update(payload).eq('id', editingSection!.id)

    if (error) { setSectionError(error.message); setSavingSection(false); return }

    setSectionModal(null)
    setSavingSection(false)
    fetchSections(selectedSite)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    await supabase.from('gallery_sections').delete().eq('id', deleteTarget.id)
    setDeleting(false)
    setDeleteTarget(null)
    if (activeSection?.id === deleteTarget.id) { setActiveSection(null); setItems([]) }
    fetchSections(selectedSite)
  }

  async function addItem(asset: MediaAsset) {
    if (!activeSection) return
    const alreadyAdded = items.some(i => i.media_asset_id === asset.id)
    if (alreadyAdded) return

    await supabase.from('gallery_items').insert({
      section_id: activeSection.id,
      media_asset_id: asset.id,
      sort_order: items.length,
      status: 'published',
    })
    fetchItems(activeSection.id)
  }

  async function removeItem(item: GalleryItem) {
    await supabase.from('gallery_items').delete().eq('id', item.id)
    fetchItems(activeSection!.id)
  }

  const addedIds = new Set(items.map(i => i.media_asset_id))

  return (
    <AppLayout title="Gallery">

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-1.5 flex-wrap">
          {sites.map(s => (
            <button
              key={s.id}
              onClick={() => setSelectedSite(s.id)}
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                selectedSite === s.id
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400 hover:text-gray-900'
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
        <button
          onClick={openCreate}
          disabled={!selectedSite}
          className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-700 disabled:opacity-50 transition-colors"
        >
          + New Section
        </button>
      </div>

      {/* Two-pane layout */}
      <div className="flex gap-6 min-h-[500px]">

        {/* Sections list */}
        <div className="w-72 shrink-0">
          {loading ? (
            <p className="text-sm text-gray-400">Loading...</p>
          ) : sections.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 border border-dashed border-gray-200 rounded-lg gap-2">
              <p className="text-sm text-gray-400">No sections yet.</p>
              <button onClick={openCreate} className="text-sm text-gray-900 underline">Create one</button>
            </div>
          ) : (
            <ul className="space-y-1.5">
              {sections.map(s => {
                const isActive = activeSection?.id === s.id
                return (
                  <li key={s.id} className="group relative">
                    <button
                      onClick={() => setActiveSection(s)}
                      className={`w-full text-left px-3 py-2.5 pr-16 rounded-lg border transition-colors ${
                        isActive
                          ? 'border-gray-900 bg-gray-900 text-white'
                          : 'border-gray-100 bg-white hover:border-gray-200 text-gray-700'
                      }`}
                    >
                      <p className="text-sm font-medium truncate">{s.title}</p>
                      <p className={`text-xs mt-0.5 ${isActive ? 'text-gray-300' : 'text-gray-400'}`}>
                        {s.layout_type} · <span className={s.status === 'published' && !isActive ? 'text-green-500' : ''}>{s.status}</span>
                      </p>
                    </button>

                    {/* Action icons — inside card, top-right, visible on hover */}
                    <div className="absolute top-1/2 -translate-y-1/2 right-2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={e => { e.stopPropagation(); openEdit(s) }}
                        title="Edit"
                        className={`p-1.5 rounded-md transition-colors ${isActive ? 'text-gray-300 hover:text-white hover:bg-white/10' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'}`}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H8v-2.414a2 2 0 01.586-1.414z" />
                        </svg>
                      </button>
                      {isAdmin && (
                        <button
                          onClick={e => { e.stopPropagation(); setDeleteTarget(s) }}
                          title="Delete"
                          className={`p-1.5 rounded-md transition-colors ${isActive ? 'text-red-300 hover:text-red-200 hover:bg-white/10' : 'text-red-400 hover:text-red-600 hover:bg-red-50'}`}
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m-7 0a1 1 0 011-1h4a1 1 0 011 1m-7 0H5m14 0h-2" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Items panel */}
        <div className="flex-1 border border-gray-100 rounded-xl p-5">
          {!activeSection ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-gray-400">Select a section to manage its items</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">{activeSection.title}</h3>
                  <p className="text-xs text-gray-400">{items.length} item{items.length !== 1 ? 's' : ''}</p>
                </div>
                <button
                  onClick={() => setMediaPickerOpen(true)}
                  className="px-3 py-1.5 border border-gray-200 text-sm text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  + Add Media
                </button>
              </div>

              {itemsLoading ? (
                <p className="text-sm text-gray-400">Loading...</p>
              ) : items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 border border-dashed border-gray-200 rounded-lg gap-2">
                  <p className="text-sm text-gray-400">No items yet.</p>
                  <button onClick={() => setMediaPickerOpen(true)} className="text-sm text-gray-900 underline">Add from media library</button>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {items.map(item => (
                    <div key={item.id} className="group relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                      {item.media_assets?.type === 'image' ? (
                        <img src={item.media_assets.url} alt={item.media_assets.title || ''} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-800">
                          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      )}
                      <button
                        onClick={() => removeItem(item)}
                        className="absolute top-1 right-1 w-5 h-5 bg-black/60 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity leading-none"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Section modal */}
      {sectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setSectionModal(null)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-base font-semibold text-gray-900 mb-4">
              {sectionModal === 'create' ? 'New Section' : 'Edit Section'}
            </h2>
            <form onSubmit={handleSectionSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
                <input
                  type="text"
                  value={sectionForm.title}
                  onChange={e => setSectionForm(f => ({
                    ...f,
                    title: e.target.value,
                    slug: f.slug || slugify(e.target.value),
                  }))}
                  placeholder="e.g. Residential Projects"
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-900"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Slug</label>
                <input
                  type="text"
                  value={sectionForm.slug}
                  onChange={e => setSectionForm(f => ({ ...f, slug: e.target.value }))}
                  placeholder="residential-projects"
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm font-mono focus:outline-none focus:border-gray-900"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                <textarea
                  value={sectionForm.description}
                  onChange={e => setSectionForm(f => ({ ...f, description: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-900 resize-none"
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Layout</label>
                  <select
                    value={sectionForm.layout_type}
                    onChange={e => setSectionForm(f => ({ ...f, layout_type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-white focus:outline-none focus:border-gray-900"
                  >
                    <option value="grid">Grid</option>
                    <option value="masonry">Masonry</option>
                    <option value="carousel">Carousel</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                  <select
                    value={sectionForm.status}
                    onChange={e => setSectionForm(f => ({ ...f, status: e.target.value as 'published' | 'draft' }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-white focus:outline-none focus:border-gray-900"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>
              </div>
              {sectionError && <p className="text-sm text-red-500">{sectionError}</p>}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setSectionModal(null)} className="flex-1 py-2 border border-gray-200 rounded-md text-sm text-gray-600 hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" disabled={savingSection} className="flex-1 py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-700 disabled:opacity-50">
                  {savingSection ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setDeleteTarget(null)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-base font-semibold text-gray-900 mb-2">Delete section?</h2>
            <p className="text-sm text-gray-500 mb-5">
              <span className="font-medium text-gray-800">{deleteTarget.title}</span> and all its items will be permanently deleted.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2 border border-gray-200 rounded-md text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-50">
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Media picker */}
      {mediaPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setMediaPickerOpen(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 p-6 max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900">Add from Media Library</h2>
              <button onClick={() => setMediaPickerOpen(false)} className="text-gray-400 hover:text-gray-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {mediaAssets.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-10">No media uploaded for this site yet.</p>
            ) : (
              <div className="overflow-y-auto">
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                  {mediaAssets.map(asset => {
                    const added = addedIds.has(asset.id)
                    return (
                      <button
                        key={asset.id}
                        onClick={() => { if (!added) { addItem(asset); setMediaPickerOpen(false) } }}
                        disabled={added}
                        className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                          added ? 'border-green-400 opacity-50 cursor-default' : 'border-transparent hover:border-gray-900'
                        }`}
                      >
                        {asset.type === 'image' ? (
                          <img src={asset.url} alt={asset.title || ''} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-800">
                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </div>
                        )}
                        {added && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                            <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </AppLayout>
  )
}
