import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import connectDB from '@/lib/mongodb'
import Inventario from '@/lib/models/Inventario'
import { isValidObjectId } from '@/lib/dbUtils'

// POST /api/inventario/[id]/image - Subir/actualizar imagen de un artículo de inventario
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params

  if (!isValidObjectId(id)) {
    return NextResponse.json(
      { error: 'ID de inventario inválido' },
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

    const inventario = await Inventario.findById(id)

    if (!inventario) {
      return NextResponse.json(
        { error: 'Artículo de inventario no encontrado' },
        { status: 404 }
      )
    }

    // Generar ruta base: protected/inventory-images/[channel-id]/[inventory-id]
    const protectedDir = path.join(process.cwd(), 'protected')
    const inventoryImagesDir = path.join(protectedDir, 'inventory-images')
    const channelDir = path.join(inventoryImagesDir, String(channelId))
    const itemDir = path.join(channelDir, String(id))

    // Crear directorios si no existen
    await fs.mkdir(itemDir, { recursive: true })

    // Si ya hay una imagen previa, intentar eliminarla
    if (inventario.image) {
      try {
        const previousImagePath = path.join(protectedDir, inventario.image)
        await fs.unlink(previousImagePath)
      } catch {
        // Si falla la eliminación, solo registrar en consola y continuar
        console.warn('No se pudo eliminar la imagen anterior de inventario (puede que no exista).')
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

    inventario.image = fileName

    await inventario.save()

    return NextResponse.json({
      success: true,
      message: 'Imagen de inventario guardada exitosamente',
      image: finalPath
    })
  } catch (error: any) {
    console.error('Error al subir imagen de inventario:', error)
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        message: error?.message || 'Error al guardar la imagen de inventario'
      },
      { status: 500 }
    )
  }
}


