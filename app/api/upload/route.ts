import { put } from '@vercel/blob'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return Response.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    const fileId = uuidv4()
    const fileName = `${fileId}-${file.name}`
    const bytes = await file.arrayBuffer()

    const blob = await put(fileName, bytes, {
      access: 'private',
      contentType: file.type,
    })

    return Response.json({
      url: blob.url,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      storagePath: blob.pathname,
    })
  } catch (error) {
    console.error('[v0] Upload error:', error)
    return Response.json(
      { error: 'Upload failed' },
      { status: 500 }
    )
  }
}
