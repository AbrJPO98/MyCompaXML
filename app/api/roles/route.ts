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
    // allow array of strings or array of { nombre }
    return input
      .map((p) => (typeof p === 'string' ? { nombre: p } : p))
      .filter((p) => p && typeof p.nombre === 'string' && (ROLE_PERMISSION_NAMES as readonly string[]).includes(p.nombre))
  }
  return []
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const channelId = searchParams.get('channelId')

    if (!channelId || !isValidObjectId(channelId)) {
      return NextResponse.json(
        { success: false, message: 'channelId es requerido y debe ser un ObjectId válido' },
        { status: 400, headers: noStoreHeaders() }
      )
    }

    const result = await withDB(async () => {
      let roles = await Roles.find({ channel_id: channelId }).sort({ nombre: 1 }).lean()

      // Seed mínimo (para no romper canales existentes cuando se migre desde is_admin)
      if (roles.length === 0) {
        await Roles.create([
          {
            nombre: 'Administrador',
            channel_id: channelId,
            deletable: true,
            permisos: ROLE_PERMISSION_NAMES.map((n) => ({ nombre: n }))
          },
          {
            nombre: 'Miembro',
            channel_id: channelId,
            deletable: true,
            permisos: []
          }
        ])
        roles = await Roles.find({ channel_id: channelId }).sort({ nombre: 1 }).lean()
      }

      return roles
    })

    if (!result.success) {
      return NextResponse.json({ success: false, message: result.error }, { status: 500, headers: noStoreHeaders() })
    }

    return NextResponse.json({ success: true, data: result.data || [] }, { headers: noStoreHeaders() })
  } catch (error: any) {
    console.error('Error en roles GET API:', error)
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500, headers: noStoreHeaders() }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = sanitizeInput(await request.json())
    const { nombre, permisos, channel_id } = body

    if (!nombre || typeof nombre !== 'string') {
      return NextResponse.json({ success: false, message: 'nombre es requerido' }, { status: 400, headers: noStoreHeaders() })
    }

    if (!channel_id || !isValidObjectId(channel_id)) {
      return NextResponse.json(
        { success: false, message: 'channel_id es requerido y debe ser un ObjectId válido' },
        { status: 400, headers: noStoreHeaders() }
      )
    }

    const permisosNorm = normalizePermisos(permisos)

    const result = await withDB(async () => {
      const created = await Roles.create({
        nombre,
        permisos: permisosNorm,
        deletable: true,
        channel_id
      })
      return created
    })

    if (!result.success) {
      return NextResponse.json({ success: false, message: result.error }, { status: 500, headers: noStoreHeaders() })
    }

    return NextResponse.json({ success: true, data: result.data }, { status: 201, headers: noStoreHeaders() })
  } catch (error: any) {
    console.error('Error en roles POST API:', error)
    return NextResponse.json(
      { success: false, message: error?.message || 'Error interno del servidor' },
      { status: 500, headers: noStoreHeaders() }
    )
  }
}


