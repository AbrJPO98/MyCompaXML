import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Channel from '@/lib/models/Channel'
import { promises as fs } from 'fs'
import path from 'path'
import forge from 'node-forge'
import crypto from 'crypto'

function escapeXml(input: string) {
    return (input ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;')
}

function formatDate(d: Date | undefined) {
    if (!d) return ''
    // ISO sin milisegundos para que sea estable
    return d.toISOString()
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const channelId = searchParams.get('channelId')

        if (!channelId) {
            return NextResponse.json({ error: 'El ID del canal es requerido' }, { status: 400 })
        }

        await connectDB()
        const channel = await Channel.findById(channelId)

        if (!channel) {
            return NextResponse.json({ error: 'Canal no encontrado' }, { status: 404 })
        }

        const ck = channel.crypto_key
        if (!ck?.uuid) {
            return NextResponse.json({ success: true, hasCryptoKey: false, xml: '' })
        }

        const p12Path = path.join(process.cwd(), 'protected', 'crypto-keys', ck.uuid, 'key.p12')
        const p12Buffer = await fs.readFile(p12Path)

        // Parse PKCS#12 (.p12)
        const p12DerBytes = p12Buffer.toString('binary')
        const p12Asn1 = forge.asn1.fromDer(p12DerBytes)

        const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, ck.password)

        const certBags = p12.getBags({ bagType: forge.pki.oids.certBag })[forge.pki.oids.certBag] || []
        const cert = certBags[0]?.cert
        if (!cert) {
            return NextResponse.json({ success: true, hasCryptoKey: true, xml: '' })
        }

        const certAsn1 = forge.pki.certificateToAsn1(cert)
        const certDerBytes = forge.asn1.toDer(certAsn1).getBytes()
        const certDerBuffer = Buffer.from(certDerBytes, 'binary')
        const x509Base64 = certDerBuffer.toString('base64')

        const sha1Thumbprint = crypto.createHash('sha1').update(certDerBuffer).digest('hex').toUpperCase()
        const sha256Thumbprint = crypto.createHash('sha256').update(certDerBuffer).digest('hex').toUpperCase()

        const subject = (cert.subject?.attributes || [])
            .map((a: any) => `${a.shortName || a.name}=${a.value}`)
            .join(', ')
        const issuer = (cert.issuer?.attributes || [])
            .map((a: any) => `${a.shortName || a.name}=${a.value}`)
            .join(', ')

        // Snippet XML: no incluye password/pin/llave privada (solo metadata + certificado)
        const xml = `
      <CryptoKeyInfo>
        <Uuid>${escapeXml(ck.uuid)}</Uuid>
        <Email>${escapeXml(ck.email)}</Email>
        <Status>${escapeXml(ck.status)}</Status>
        <FileName>${escapeXml(ck.file_name)}</FileName>
        <Certificate>
          <Subject>${escapeXml(subject)}</Subject>
          <Issuer>${escapeXml(issuer)}</Issuer>
          <SerialNumber>${escapeXml(cert.serialNumber || '')}</SerialNumber>
          <ValidFrom>${escapeXml(formatDate(cert.validity?.notBefore))}</ValidFrom>
          <ValidTo>${escapeXml(formatDate(cert.validity?.notAfter))}</ValidTo>
          <ThumbprintSHA1>${escapeXml(sha1Thumbprint)}</ThumbprintSHA1>
          <ThumbprintSHA256>${escapeXml(sha256Thumbprint)}</ThumbprintSHA256>
          <X509Certificate>${x509Base64}</X509Certificate>
        </Certificate>
      </CryptoKeyInfo>`.trim()

        return NextResponse.json({ success: true, hasCryptoKey: true, xml })
    } catch (error: any) {
        console.error('Error en GET /api/channel/crypto-key/xml:', error)
        return NextResponse.json(
            { error: error.message || 'Error al procesar la solicitud' },
            { status: 500 }
        )
    }
}


