import { useEffect, useRef, useState } from 'react'
import { AppLayout } from '../components/layout/AppLayout'
import { supabase } from '../lib/supabase'
import { uploadToCloudinary } from '../lib/cloudinary'
interface Site {
  id: string
  name: string
  slug: string
}

interface MediaAsset {
  id: string
  site_id: string
  cloudinary_id: string
  url: string
  type: 'image' | 'video'
  title: string | null
  alt_text: string | null
  status: 'active' | 'archived'
  created_at: string
}

export function MediaPage() {
  const [sites, setSites] = useState<Site[]>([])
  const [selectedSite, setSelectedSite] = useState<string>('')
  const [assets, setAssets] = useState<MediaAsset[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [preview, setPreview] = useState<MediaAsset | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function fetchSites() {
    const { data } = await supabase
      .from('sites')
      .select('id, name, slug')
      .order('name')
    setSites(data ?? [])
    if (data && data.length > 0) setSelectedSite(data[0].id)
  }

  async function fetchAssets(siteId: string) {
    setLoading(true)
    const { data } = await supabase
      .from('media_assets')
      .select('*')
      .eq('site_id', siteId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
    setAssets(data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchSites() }, [])
  useEffect(() => { if (selectedSite) fetchAssets(selectedSite) }, [selectedSite])

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !selectedSite) return

    const site = sites.find(s => s.id === selectedSite)
    if (!site) return

    setUploading(true)
    setUploadError(null)
    setUploadProgress(0)

    try {
      const result = await uploadToCloudinary(
        file,
        `client-dashboard/${site.slug}`,
        (pct) => setUploadProgress(pct)
      )

      await supabase.from('media_assets').insert({
        site_id: selectedSite,
        cloudinary_id: result.cloudinary_id,
        url: result.url,
        type: result.type,
        title: file.name.replace(/\.[^.]+$/, ''),
        status: 'active',
      })

      await fetchAssets(selectedSite)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : String(err))
    }

    setUploading(false)
    setUploadProgress(0)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleArchive(asset: MediaAsset) {
    await supabase.from('media_assets').update({ status: 'archived' }).eq('id', asset.id)
    setPreview(null)
    fetchAssets(selectedSite)
  }

  async function handleCopyUrl(url: string) {
    await navigator.clipboard.writeText(url)
  }

  return (
    <AppLayout title="Media">

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {sites.length > 1 ? (
          <select
            value={selectedSite}
            onChange={e => setSelectedSite(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-md text-sm bg-white focus:outline-none focus:border-gray-900 transition-colors"
          >
            {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        ) : sites.length === 1 ? (
          <span className="text-sm font-medium text-gray-700">{sites[0].name}</span>
        ) : null}

        <div className="flex items-center gap-2 ml-auto">
          {uploading && (
            <div className="flex items-center gap-2">
              <div className="w-32 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gray-900 transition-all" style={{ width: `${uploadProgress}%` }} />
              </div>
              <span className="text-xs text-gray-400">{uploadProgress}%</span>
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading || !selectedSite}
            className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            {uploading ? 'Uploading...' : '+ Upload'}
          </button>
        </div>
      </div>

      {uploadError && <p className="text-sm text-red-500 mb-4">{uploadError}</p>}

      {/* Grid */}
      {loading ? (
        <p className="text-sm text-gray-400">Loading...</p>
      ) : assets.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 border border-dashed border-gray-200 rounded-lg gap-3">
          <p className="text-sm text-gray-400">No media yet.</p>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={!selectedSite}
            className="text-sm text-gray-900 underline"
          >
            Upload your first file
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {assets.map(asset => (
            <button
              key={asset.id}
              onClick={() => setPreview(asset)}
              className="group relative aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-100 hover:border-gray-300 transition-colors"
            >
              {asset.type === 'image' ? (
                <img src={asset.url} alt={asset.alt_text || asset.title || ''} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-900">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
            </button>
          ))}
        </div>
      )}

      {/* Preview panel */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setPreview(null)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>

            {/* Media preview */}
            <div className="bg-gray-900 flex items-center justify-center" style={{ maxHeight: '60vh' }}>
              {preview.type === 'image' ? (
                <img src={preview.url} alt={preview.alt_text || ''} className="max-w-full max-h-96 object-contain" />
              ) : (
                <video src={preview.url} controls className="max-w-full max-h-96" />
              )}
            </div>

            {/* Details */}
            <div className="p-5">
              <p className="text-sm font-medium text-gray-900 mb-1">{preview.title || 'Untitled'}</p>
              <p className="text-xs text-gray-400 font-mono truncate mb-4">{preview.url}</p>

              <div className="flex gap-2">
                <button
                  onClick={() => handleCopyUrl(preview.url)}
                  className="flex-1 py-2 border border-gray-200 rounded-md text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Copy URL
                </button>
                <button
                  onClick={() => handleArchive(preview)}
                  className="px-4 py-2 border border-red-200 rounded-md text-sm text-red-500 hover:bg-red-50 transition-colors"
                >
                  Remove
                </button>
                <button
                  onClick={() => setPreview(null)}
                  className="px-4 py-2 bg-gray-900 text-white rounded-md text-sm hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </AppLayout>
  )
}
