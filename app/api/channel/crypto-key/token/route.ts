import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'
import connectDB from '@/lib/mongodb'
import Channel from '@/lib/models/Channel'

interface RecepcionPayload {
    channelId: string
    clave: string
    fecha: string
    emisor: {
        tipoIdentificacion: string
        numeroIdentificacion: string
    }
    receptor?: {
        tipoIdentificacion: string
        numeroIdentificacion: string
    }
    comprobanteXml: string
    includeReceptor?: boolean
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json() as Partial<RecepcionPayload>
        const channelId = String(body?.channelId || '').trim()
        const clave = String(body?.clave || '').trim()
        const fecha = String(body?.fecha || '').trim()
        const comprobanteXml = String(body?.comprobanteXml || '').trim()
        const includeReceptor = Boolean(body?.includeReceptor)
        const emisor = body?.emisor
        const receptor = body?.receptor

        if (!channelId) {
            return NextResponse.json(
                { success: false, error: 'channelId es requerido' },
                { status: 400 }
            )
        }

        if (!clave || !fecha || !comprobanteXml) {
            return NextResponse.json(
                { success: false, error: 'clave, fecha y comprobanteXml son requeridos' },
                { status: 400 }
            )
        }

        if (!emisor?.tipoIdentificacion || !emisor?.numeroIdentificacion) {
            return NextResponse.json(
                { success: false, error: 'emisor.tipoIdentificacion y emisor.numeroIdentificacion son requeridos' },
                { status: 400 }
            )
        }

        if (includeReceptor && (!receptor?.tipoIdentificacion || !receptor?.numeroIdentificacion)) {
            return NextResponse.json(
                { success: false, error: 'receptor es requerido para Factura electrónica' },
                { status: 400 }
            )
        }

        if (!mongoose.Types.ObjectId.isValid(channelId)) {
            return NextResponse.json(
                { success: false, error: 'channelId no es un ObjectId válido' },
                { status: 400 }
            )
        }

        await connectDB()
        const channel = await Channel.findById(channelId)

        if (!channel) {
            return NextResponse.json(
                { success: false, error: 'Canal no encontrado' },
                { status: 404 }
            )
        }

        const cryptoKey = channel.crypto_key
        const status = String(cryptoKey?.status || '').trim().toLowerCase()
        const isSand = status === 'sand'
        const username = String(cryptoKey?.email || '').trim()
        const password = String(cryptoKey?.password || '').trim()

        if (!username || !password) {
            return NextResponse.json(
                { success: false, error: 'El canal no tiene crypto_key.email/password configurados' },
                { status: 400 }
            )
        }

        const endpoint = isSand
            ? 'https://idp.comprobanteselectronicos.go.cr/auth/realms/rut-stag/protocol/openid-connect/token'
            : 'https://idp.comprobanteselectronicos.go.cr/auth/realms/rut/protocol/openid-connect/token'
        const clientId = isSand ? 'api-stag' : 'api-prod'

        const formBody = new URLSearchParams({
            grant_type: 'password',
            client_id: clientId,
            username,
            password
        })

        const tokenResponse = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8'
            },
            body: formBody.toString()
        })

        const rawTokenResponse = await tokenResponse.text()
        let parsedTokenResponse: any = null
        try {
            parsedTokenResponse = JSON.parse(rawTokenResponse)
        } catch {
            parsedTokenResponse = null
        }

        const hasExpectedTokenShape =
            tokenResponse.ok &&
            parsedTokenResponse &&
            typeof parsedTokenResponse.access_token === 'string' &&
            parsedTokenResponse.access_token.trim() !== '' &&
            typeof parsedTokenResponse.token_type === 'string'

        if (!hasExpectedTokenShape) {
            return NextResponse.json({
                success: false,
                endpoint,
                clientId,
                status: tokenResponse.status,
                response: parsedTokenResponse ?? rawTokenResponse
            }, { status: tokenResponse.status || 400 })
        }

        const recepcionEndpoint = isSand
            ? 'https://api-sandbox.comprobanteselectronicos.go.cr/recepcion/v1/recepcion/'
            : 'https://api.comprobanteselectronicos.go.cr/recepcion/v1/recepcion/'

        const recepcionBody: Record<string, any> = {
            clave,
            fecha,
            emisor: {
                tipoIdentificacion: String(emisor.tipoIdentificacion).trim(),
                numeroIdentificacion: String(emisor.numeroIdentificacion).trim()
            },
            comprobanteXml
        }

        if (includeReceptor) {
            recepcionBody.receptor = {
                tipoIdentificacion: String(receptor?.tipoIdentificacion || '').trim(),
                numeroIdentificacion: String(receptor?.numeroIdentificacion || '').trim()
            }
        }

        const recepcionResp = await fetch(recepcionEndpoint, {
            method: 'POST',
            headers: {
                Authorization: `bearer ${parsedTokenResponse.access_token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(recepcionBody)
        })

        const rawRecepcionResponse = await recepcionResp.text()
        let parsedRecepcionResponse: any = null
        try {
            parsedRecepcionResponse = JSON.parse(rawRecepcionResponse)
        } catch {
            parsedRecepcionResponse = null
        }

        return NextResponse.json({
            success: recepcionResp.ok,
            endpoint,
            clientId,
            status: tokenResponse.status,
            response: parsedTokenResponse,
            recepcion: {
                endpoint: recepcionEndpoint,
                status: recepcionResp.status,
                response: parsedRecepcionResponse ?? rawRecepcionResponse
            }
        }, { status: recepcionResp.ok ? 200 : recepcionResp.status })
    } catch (error: any) {
        console.error('Error en POST /api/channel/crypto-key/token:', error)
        return NextResponse.json(
            {
                success: false,
                error: error?.message || 'Error interno del servidor'
            },
            { status: 500 }
        )
    }
}

