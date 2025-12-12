import { NextRequest } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

// Servir archivos estáticos desde la carpeta "protected"
// Ejemplo de uso: /protected/inventory-images/[channel-id]/[inventario-id]/archivo.png

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const segments = params.path || []

    if (segments.length === 0) {
      return new Response('Not Found', { status: 404 })
    }

    // Por seguridad, solo permitimos servir imágenes de inventario
    if (segments[0] !== 'inventory-images') {
      return new Response('Not Found', { status: 404 })
    }

    const protectedRoot = path.join(process.cwd(), 'protected')
    const filePath = path.join(protectedRoot, ...segments)

    // Evitar path traversal comprobando que el path final empieza por la raíz permitida
    if (!filePath.startsWith(protectedRoot)) {
      return new Response('Acceso no permitido', { status: 403 })
    }

    let fileBuffer: Buffer
    try {
      fileBuffer = await fs.readFile(filePath)
    } catch {
      return new Response('Archivo no encontrado', { status: 404 })
    }

    const ext = path.extname(filePath).toLowerCase()
    let contentType = 'application/octet-stream'

    switch (ext) {
      case '.jpg':
      case '.jpeg':
        contentType = 'image/jpeg'
        break
      case '.png':
        contentType = 'image/png'
        break
      case '.webp':
        contentType = 'image/webp'
        break
      case '.gif':
        contentType = 'image/gif'
        break
    }

    return new Response(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    })
  } catch (error: any) {
    console.error('Error sirviendo archivo protegido:', error)
    return new Response('Error interno del servidor', { status: 500 })
  }
}


