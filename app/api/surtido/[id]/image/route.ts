import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import connectDB from '@/lib/mongodb'
import Surtido from '@/lib/models/Surtido'
import { isValidObjectId } from '@/lib/dbUtils'

// POST /api/surtido/[id]/image - Subir/actualizar imagen de un surtido
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params

  if (!isValidObjectId(id)) {
    return NextResponse.json(
      { error: 'ID de surtido inválido' },
      { status: 400 }
    )
  }

  try {
    const formData = await request.formData()
    const channelId = formData.get('channelId') as string | null
    const imageFile = formData.get('image') as File | null

    if (!channelId) {
      return NextResponse.json(
        { error: 'El ID del canal es requerido' },
        { status: 400 }
      )
    }

    if (!isValidObjectId(channelId)) {
      return NextResponse.json(
        { error: 'ID de canal inválido' },
        { status: 400 }
      )
    }

    if (!imageFile) {
      return NextResponse.json(
        { error: 'La imagen es requerida' },
        { status: 400 }
      )
    }

    // Validar tipo de archivo (solo imágenes comunes)
    const validMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!validMimeTypes.includes(imageFile.type)) {
      return NextResponse.json(
        { error: 'Solo se permiten imágenes (JPEG, PNG, WEBP, GIF)' },
        { status: 400 }
      )
    }

    await connectDB()

    const surtido = await Surtido.findById(id)

    if (!surtido) {
      return NextResponse.json(
        { error: 'Surtido no encontrado' },
        { status: 404 }
      )
    }

    // Generar ruta base: protected/surtido-images/[channel-id]/[surtido-id]
    const protectedDir = path.join(process.cwd(), 'protected')
    const surtidoImagesDir = path.join(protectedDir, 'surtido-images')
    const channelDir = path.join(surtidoImagesDir, String(channelId))
    const itemDir = path.join(channelDir, String(id))

    // Crear directorios si no existen
    await fs.mkdir(itemDir, { recursive: true })

    // Si ya hay una imagen previa, intentar eliminarla
    if (surtido.image) {
      try {
        const previousImagePath = path.join(protectedDir, surtido.image)
        await fs.unlink(previousImagePath)
      } catch {
        // Si falla la eliminación, solo registrar en consola y continuar
        console.warn('No se pudo eliminar la imagen anterior de surtido (puede que no exista).')
      }
    }

    // Generar nombre de archivo con UUID y extensión original
    const uuid = uuidv4()
    const originalName = imageFile.name || 'image'
    const ext = path.extname(originalName) || '.png'
    const fileName = `${uuid}${ext}`
    const finalPath = path.join(itemDir, fileName)

    // Guardar archivo
    const arrayBuffer = await imageFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    await fs.writeFile(finalPath, buffer)

    // Guardar ruta relativa en la base de datos
    const relativePath = path.relative(protectedDir, finalPath).replace(/\\/g, '/')
    surtido.image = relativePath

    await surtido.save()

    return NextResponse.json({
      success: true,
      message: 'Imagen de surtido guardada exitosamente',
      image: relativePath
    })
  } catch (error: any) {
    console.error('Error al subir imagen de surtido:', error)
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        message: error?.message || 'Error al guardar la imagen de surtido'
      },
      { status: 500 }
    )
  }
}

// GET /api/surtido/[id]/image - Obtener imagen de un surtido
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params

  if (!isValidObjectId(id)) {
    return NextResponse.json(
      { error: 'ID de surtido inválido' },
      { status: 400 }
    )
  }

  try {
    await connectDB()

    const surtido = await Surtido.findById(id)

    if (!surtido) {
      return NextResponse.json(
        { error: 'Surtido no encontrado' },
        { status: 404 }
      )
    }

    if (!surtido.image) {
      return NextResponse.json(
        { error: 'El surtido no tiene imagen' },
        { status: 404 }
      )
    }

    const protectedDir = path.join(process.cwd(), 'protected')
    const imagePath = path.join(protectedDir, surtido.image)

    // Verificar que el archivo existe
    try {
      await fs.access(imagePath)
    } catch {
      return NextResponse.json(
        { error: 'La imagen no se encuentra en el servidor' },
        { status: 404 }
      )
    }

    // Leer el archivo
    const imageBuffer = await fs.readFile(imagePath)
    
    // Determinar el tipo MIME basado en la extensión
    const ext = path.extname(surtido.image).toLowerCase()
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.gif': 'image/gif'
    }
    const contentType = mimeTypes[ext] || 'image/jpeg'

    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    })
  } catch (error: any) {
    console.error('Error al obtener imagen de surtido:', error)
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        message: error?.message || 'Error al obtener la imagen de surtido'
      },
      { status: 500 }
    )
  }
}

