import { NextRequest, NextResponse } from 'next/server'
import Roles, { ROLE_PERMISSION_NAMES } from '@/lib/models/Roles'
import { withDB, isValidObjectId, sanitizeInput } from '@/lib/dbUtils'

function noStoreHeaders() {
  return {
    'Cache-Control': 'no-store',
    'Pragma': 'no-cache',
    'Expires': '0'
  }
}

function normalizePermisos(input: any): { nombre: any }[] {
  if (!input) return []
  if (Array.isArray(input)) {
    return input
      .map((p) => (typeof p === 'string' ? { nombre: p } : p))
      .filter((p) => p && typeof p.nombre === 'string' && (ROLE_PERMISSION_NAMES as readonly string[]).includes(p.nombre))
  }
  return []
}

export async function GET(_request: NextRequest, context: { params: { id: string } }) {
  try {
    const id = context.params.id
    if (!id || !isValidObjectId(id)) {
      return NextResponse.json({ success: false, message: 'ID inválido' }, { status: 400, headers: noStoreHeaders() })
    }

    const result = await withDB(async () => {
      const role = await Roles.findById(id).lean()
      return role
    })

    if (!result.success) {
      return NextResponse.json({ success: false, message: result.error }, { status: 500, headers: noStoreHeaders() })
    }

    if (!result.data) {
      return NextResponse.json({ success: false, message: 'Rol no encontrado' }, { status: 404, headers: noStoreHeaders() })
    }

    return NextResponse.json({ success: true, data: result.data }, { headers: noStoreHeaders() })
  } catch (error: any) {
    console.error('Error en roles/[id] GET API:', error)
    return NextResponse.json({ success: false, message: 'Error interno del servidor' }, { status: 500, headers: noStoreHeaders() })
  }
}

export async function PUT(request: NextRequest, context: { params: { id: string } }) {
  try {
    const id = context.params.id
    if (!id || !isValidObjectId(id)) {
      return NextResponse.json({ success: false, message: 'ID inválido' }, { status: 400, headers: noStoreHeaders() })
    }

    const body = sanitizeInput(await request.json())
    const update: any = {}
    if (typeof body.nombre === 'string') update.nombre = body.nombre
    if (body.permisos !== undefined) update.permisos = normalizePermisos(body.permisos)
    if (typeof body.deletable === 'boolean') update.deletable = body.deletable

    const result = await withDB(async () => {
      const updated = await Roles.findByIdAndUpdate(id, { $set: update }, { new: true })
      return updated
    })

    if (!result.success) {
      return NextResponse.json({ success: false, message: result.error }, { status: 500, headers: noStoreHeaders() })
    }

    if (!result.data) {
      return NextResponse.json({ success: false, message: 'Rol no encontrado' }, { status: 404, headers: noStoreHeaders() })
    }

    return NextResponse.json({ success: true, data: result.data }, { headers: noStoreHeaders() })
  } catch (error: any) {
    console.error('Error en roles/[id] PUT API:', error)
    return NextResponse.json({ success: false, message: 'Error interno del servidor' }, { status: 500, headers: noStoreHeaders() })
  }
}

export async function DELETE(_request: NextRequest, context: { params: { id: string } }) {
  try {
    const id = context.params.id
    if (!id || !isValidObjectId(id)) {
      return NextResponse.json({ success: false, message: 'ID inválido' }, { status: 400, headers: noStoreHeaders() })
    }

    const result = await withDB(async () => {
      const role = await Roles.findById(id)
      if (!role) return { deleted: false, reason: 'not_found' as const }
      if (!role.deletable) return { deleted: false, reason: 'not_deletable' as const }

      await Roles.findByIdAndDelete(id)
      return { deleted: true }
    })

    if (!result.success) {
      return NextResponse.json({ success: false, message: result.error }, { status: 500, headers: noStoreHeaders() })
    }

    const data: any = result.data
    if (!data?.deleted) {
      if (data?.reason === 'not_found') {
        return NextResponse.json({ success: false, message: 'Rol no encontrado' }, { status: 404, headers: noStoreHeaders() })
      }
      if (data?.reason === 'not_deletable') {
        return NextResponse.json({ success: false, message: 'Este rol no se puede eliminar' }, { status: 400, headers: noStoreHeaders() })
      }
      return NextResponse.json({ success: false, message: 'No se pudo eliminar' }, { status: 400, headers: noStoreHeaders() })
    }

    return NextResponse.json({ success: true, data }, { headers: noStoreHeaders() })
  } catch (error: any) {
    console.error('Error en roles/[id] DELETE API:', error)
    return NextResponse.json({ success: false, message: 'Error interno del servidor' }, { status: 500, headers: noStoreHeaders() })
  }
}


