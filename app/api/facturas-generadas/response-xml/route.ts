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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const channelId = String(body?.channelId || '').trim()
    const facturaId = String(body?.facturaId || '').trim()

    if (!channelId || !facturaId) {
      return NextResponse.json({ success: false, error: 'channelId y facturaId son requeridos' }, { status: 400 })
    }

    if (!isValidObjectId(channelId) || !isValidObjectId(facturaId)) {
      return NextResponse.json({ success: false, error: 'channelId o facturaId inválidos' }, { status: 400 })
    }

    await connectDB()

    const channel = await Channel.findById(channelId).lean()
    if (!channel) {
      return NextResponse.json({ success: false, error: 'Canal no encontrado' }, { status: 404 })
    }

    const factura = await FacturaGenerada.findOne({
      _id: new mongoose.Types.ObjectId(facturaId),
      channel_id: new mongoose.Types.ObjectId(channelId)
    }).lean()

    if (!factura) {
      return NextResponse.json({ success: false, error: 'Factura no encontrada' }, { status: 404 })
    }

    const username = String(channel?.crypto_key?.email || '').trim()
    const password = String(channel?.crypto_key?.password || '').trim()
    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'El canal no tiene crypto_key.email/password configurados' },
        { status: 400 }
      )
    }

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
      return NextResponse.json(
        { success: false, error: 'No se pudo obtener access_token', tokenStatus: tokenResp.status, tokenResponse: tokenJson ?? tokenRaw },
        { status: 400 }
      )
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

    const respuestaXmlBase64 =
      consultaJson?.['respuesta-xml'] ??
      consultaJson?.respuestaXml ??
      consultaJson?.resp?.['respuesta-xml'] ??
      consultaJson?.resp?.respuestaXml ??
      ''

    if (!respuestaXmlBase64) {
      return NextResponse.json(
        {
          success: false,
          error: 'La respuesta no incluye "respuesta-xml"',
          consultaStatus: consultaResp.status,
          consultaResponse: consultaJson ?? consultaRaw
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      clave: factura.clave,
      respuestaXmlBase64,
      consultaStatus: consultaResp.status
    })
  } catch (error: any) {
    console.error('Error en POST /api/facturas-generadas/response-xml:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

