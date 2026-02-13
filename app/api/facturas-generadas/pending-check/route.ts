import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'
import connectDB from '@/lib/mongodb'
import Channel from '@/lib/models/Channel'
import FacturaGenerada from '@/lib/models/FacturaGenerada'

function isValidObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id) && id.length === 24
}

function getAuthConfigByTipo(tipo: string) {
  const isStag = tipo === 'stag'
  return {
    tokenEndpoint: isStag
      ? 'https://idp.comprobanteselectronicos.go.cr/auth/realms/rut-stag/protocol/openid-connect/token'
      : 'https://idp.comprobanteselectronicos.go.cr/auth/realms/rut/protocol/openid-connect/token',
    clientId: isStag ? 'api-stag' : 'api-prod',
    consultaEndpointBase: isStag
      ? 'https://api-sandbox.comprobanteselectronicos.go.cr/recepcion/v1/recepcion'
      : 'https://api.comprobanteselectronicos.go.cr/recepcion/v1/recepcion'
  }
}

function mapConsultaEstadoToDbEstado(indEstado: unknown): 'pendiente' | 'rechazado' | 'aprobado' | null {
  const value = String(indEstado || '').trim().toLowerCase()
  if (!value) return null
  if (value === 'pendiente') return 'pendiente'
  if (value === 'rechazado') return 'rechazado'
  if (value === 'aceptado') return 'aprobado'
  return null
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const channelId = String(body?.channelId || '').trim()

    if (!channelId) {
      return NextResponse.json({ success: false, error: 'channelId es requerido' }, { status: 400 })
    }

    if (!isValidObjectId(channelId)) {
      return NextResponse.json({ success: false, error: 'channelId inválido' }, { status: 400 })
    }

    await connectDB()

    const channel = await Channel.findById(channelId).lean()
    if (!channel) {
      return NextResponse.json({ success: false, error: 'Canal no encontrado' }, { status: 404 })
    }

    const username = String(channel?.crypto_key?.email || '').trim()
    const password = String(channel?.crypto_key?.password || '').trim()
    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'El canal no tiene crypto_key.email/password configurados' },
        { status: 400 }
      )
    }

    const pendientes = await FacturaGenerada.find({
      channel_id: new mongoose.Types.ObjectId(channelId),
      estado: 'pendiente'
    }).lean()

    const results: any[] = []

    for (const factura of pendientes) {
      const tipo = String(factura.tipo || '').trim() === 'stag' ? 'stag' : 'prod'
      const { tokenEndpoint, clientId, consultaEndpointBase } = getAuthConfigByTipo(tipo)

      const tokenBody = new URLSearchParams({
        grant_type: 'password',
        client_id: clientId,
        username,
        password
      })

      const tokenResp = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8'
        },
        body: tokenBody.toString()
      })

      const tokenRaw = await tokenResp.text()

      let tokenJson: any = null
      try {
        tokenJson = JSON.parse(tokenRaw)
      } catch {
        tokenJson = null
      }

      if (!tokenResp.ok || !tokenJson?.access_token) {
        results.push({
          facturaId: String(factura._id),
          clave: factura.clave,
          tipo,
          tokenStatus: tokenResp.status,
          tokenResponse: tokenJson ?? tokenRaw,
          consultaStatus: null,
          consultaResponse: null
        })
        continue
      }

      const clave = encodeURIComponent(String(factura.clave || '').trim())
      const consultaEndpoint = `${consultaEndpointBase}/${clave}`

      const consultaResp = await fetch(consultaEndpoint, {
        method: 'GET',
        headers: {
          Authorization: `bearer ${tokenJson.access_token}`,
          Accept: 'application/json'
        }
      })

      const consultaRaw = await consultaResp.text()

      let consultaJson: any = null
      try {
        consultaJson = JSON.parse(consultaRaw)
      } catch {
        consultaJson = null
      }

      const indEstado =
        consultaJson?.['ind-estado'] ??
        consultaJson?.indEstado ??
        consultaJson?.resp?.['ind-estado'] ??
        consultaJson?.resp?.indEstado
      const nuevoEstado = mapConsultaEstadoToDbEstado(indEstado)

      if (nuevoEstado) {
        await FacturaGenerada.updateOne(
          { _id: new mongoose.Types.ObjectId(String(factura._id)) },
          { $set: { estado: nuevoEstado } }
        )
      }

      results.push({
        facturaId: String(factura._id),
        clave: factura.clave,
        tipo,
        tokenStatus: tokenResp.status,
        consultaStatus: consultaResp.status,
        consultaEndpoint,
        consultaResponse: consultaJson ?? consultaRaw,
        indEstado: indEstado ?? null,
        estadoActualizado: nuevoEstado ?? 'sin-cambio'
      })
    }

    return NextResponse.json({
      success: true,
      checked: pendientes.length,
      results
    })
  } catch (error: any) {
    console.error('Error en POST /api/facturas-generadas/pending-check:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

