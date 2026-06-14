import { supabase } from './supabase'

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const API_KEY = import.meta.env.VITE_CLOUDINARY_API_KEY
const UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`

export async function uploadToCloudinary(
  file: File,
  folder: string,
  onProgress?: (pct: number) => void
): Promise<{ cloudinary_id: string; url: string; type: 'image' | 'video' }> {
  // Get signed params from edge function
  const { data: { session } } = await supabase.auth.getSession()
  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cloudinary-signature`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ folder }),
    }
  )

  if (!res.ok) throw new Error('Failed to get upload signature')
  const { signature, timestamp } = await res.json()

  // Upload directly to Cloudinary
  const formData = new FormData()
  formData.append('file', file)
  formData.append('api_key', API_KEY)
  formData.append('timestamp', String(timestamp))
  formData.append('signature', signature)
  formData.append('folder', folder)

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', UPLOAD_URL)

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100))
    }

    xhr.onload = () => {
      if (xhr.status === 200) {
        const data = JSON.parse(xhr.responseText)
        resolve({
          cloudinary_id: data.public_id,
          url: data.secure_url,
          type: data.resource_type === 'video' ? 'video' : 'image',
        })
      } else {
        reject(new Error('Upload failed'))
      }
    }

    xhr.onerror = () => reject(new Error('Upload failed'))
    xhr.send(formData)
  })
}
