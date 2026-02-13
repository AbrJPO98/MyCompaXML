import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Channel from '@/lib/models/Channel'
import { promises as fs } from 'fs'
import path from 'path'
import forge from 'node-forge'
import { DOMParser, XMLSerializer } from '@xmldom/xmldom'
import { SignedXml } from 'xml-crypto'
import crypto from 'crypto'
import { v4 as uuidv4 } from 'uuid'

function stripPem(pem: string) {
    return (pem || '')
        .replace(/-----BEGIN CERTIFICATE-----/g, '')
        .replace(/-----END CERTIFICATE-----/g, '')
        .replace(/\r?\n|\r/g, '')
        .trim()
}

function parsePkcs12WithFallback(p12Asn1: any, ck: any) {
    const secrets: Array<{ kind: string; value: string }> = [
        { kind: 'password', value: String(ck?.password || '') },
        { kind: 'pin', value: String(ck?.pin || '') },
        { kind: 'empty', value: '' }
    ]

    let lastErr: any = null
    for (const s of secrets) {
        try {
            const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, s.value)
            return { p12, used: s.kind }
        } catch (e: any) {
            lastErr = e
        }
    }
    throw lastErr
}

function extractPrivateKeyPem(p12: any) {
    const pkcs8 = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag })[
        forge.pki.oids.pkcs8ShroudedKeyBag
    ]
    const keyBag = (pkcs8 && pkcs8[0] && pkcs8[0].key) ? pkcs8[0] : null

    if (keyBag?.key) {
        return forge.pki.privateKeyToPem(keyBag.key)
    }

    const keyBags = p12.getBags({ bagType: forge.pki.oids.keyBag })[forge.pki.oids.keyBag]
    const keyBag2 = (keyBags && keyBags[0] && keyBags[0].key) ? keyBags[0] : null
    if (keyBag2?.key) {
        return forge.pki.privateKeyToPem(keyBag2.key)
    }

    return ''
}

function extractCertPem(p12: any) {
    const certBags = p12.getBags({ bagType: forge.pki.oids.certBag })[forge.pki.oids.certBag] || []
    const cert = certBags[0]?.cert
    if (!cert) return { certPem: '', certBase64: '' }
    const certPem = forge.pki.certificateToPem(cert)
    const certBase64 = stripPem(certPem)
    return { certPem, certBase64, certForge: cert }
}

function bigIntToBase64(bigInt: any): string {
    const hex = bigInt.toString(16)
    const evenHex = hex.length % 2 === 0 ? hex : `0${hex}`
    const bytes = forge.util.hexToBytes(evenHex)
    return Buffer.from(bytes, 'binary').toString('base64')
}

function formatIssuerName(cert: any): string {
    const attrs = cert?.issuer?.attributes || []
    const parts = attrs.map((a: any) => `${a.shortName || a.name}=${a.value}`)
    return parts.join(', ')
}

function hexSerialToDecimal(hex: string): string {
    const clean = (hex || '').replace(/^0x/i, '').trim()
    if (!clean) return ''
    try {
        return BigInt(`0x${clean}`).toString(10)
    } catch {
        return ''
    }
}

function signingTimeCostaRica(): string {
    // Costa Rica = UTC-06:00 (sin DST)
    const now = new Date()
    const utcMs = now.getTime() + now.getTimezoneOffset() * 60_000
    const cr = new Date(utcMs - 6 * 60 * 60_000)
    const iso = cr.toISOString().replace('Z', '')
    // quitar ms para parecerse al ejemplo
    const noMs = iso.replace(/\.\d{3}$/, '')
    return `${noMs}-06:00`
}

function getDefaultPolicy(policyIdentifier: string) {
    // Para comprobantes de Hacienda CR (v4.4), usamos la politica por defecto
    // cuando no se envia policyHashAlgorithm/policyHashValue desde el cliente.
    const id = policyIdentifier || ''
    if (id.includes('https://cdn.comprobanteselectronicos.go.cr/xml-schemas/v4.4/')) {
        return {
            policyIdentifier: id,
            policyHashAlgorithm: 'http://www.w3.org/2000/09/xmldsig#sha1',
            policyHashValue: 'Ohixl6upD6av8N7pEvDABhEL6hM='
        }
    }
    return null
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const channelId = body?.channelId as string | undefined
        const xml = body?.xml as string | undefined
        const policyIdentifierInput = body?.policyIdentifier as string | undefined
        const policyHashAlgorithmInput = body?.policyHashAlgorithm as string | undefined
        const policyHashValueInput = body?.policyHashValue as string | undefined
        const claimedRoleInput = body?.claimedRole as string | undefined

        if (!channelId || !xml) {
            return NextResponse.json({ error: 'channelId y xml son requeridos' }, { status: 400 })
        }

        await connectDB()
        const channel = await Channel.findById(channelId)
        if (!channel) {
            return NextResponse.json({ error: 'Canal no encontrado' }, { status: 404 })
        }

        const ck = channel.crypto_key
        if (!ck?.uuid) {
            return NextResponse.json({ error: 'El canal no tiene crypto_key configurado' }, { status: 400 })
        }

        const p12Path = path.join(process.cwd(), 'protected', 'crypto-keys', ck.uuid, 'key.p12')
        const p12Buffer = await fs.readFile(p12Path)

        const p12DerBytes = p12Buffer.toString('binary')
        const p12Asn1 = forge.asn1.fromDer(p12DerBytes)

        let p12: any
        try {
            ; ({ p12 } = parsePkcs12WithFallback(p12Asn1, ck))
        } catch (e: any) {
            const msg = String(e?.message || '')
            if (msg.includes('MAC could not be verified')) {
                return NextResponse.json(
                    { error: 'No se pudo abrir el .p12. Verifique password/pin.' },
                    { status: 400 }
                )
            }
            return NextResponse.json({ error: 'No se pudo parsear el .p12.' }, { status: 400 })
        }

        const privateKeyPem = extractPrivateKeyPem(p12)
        if (!privateKeyPem) {
            return NextResponse.json({ error: 'No se encontró llave privada dentro del .p12.' }, { status: 400 })
        }

        const { certBase64, certForge } = extractCertPem(p12)
        if (!certBase64 || !certForge) {
            return NextResponse.json({ error: 'No se encontró certificado dentro del .p12.' }, { status: 400 })
        }

        // Validar que el XML sea parseable
        const docForDigest = new DOMParser().parseFromString(xml, 'application/xml')
        const parseError = docForDigest.getElementsByTagName('parsererror')[0]
        if (parseError || !docForDigest.documentElement) {
            return NextResponse.json({ error: 'XML inválido (parsererror).' }, { status: 400 })
        }

        // --- XAdES-EPES (RSA 2048 + SHA-256) ---
        // Firmamos en el servidor y devolvemos el XML con la estructura ds:Signature + xades:Object.

        const dsNS = 'http://www.w3.org/2000/09/xmldsig#'
        const xadesNS = 'http://uri.etsi.org/01903/v1.3.2#'
        const sigId = `Signature-${uuidv4()}`
        const signatureValueId = `SignatureValue-${sigId}`
        const keyInfoId = `KeyInfoId-${sigId}`
        const signedPropsId = `SignedProperties-${sigId}`
        const qualifyingPropsId = `QualifyingProperties-${uuidv4()}`
        const objectId = `XadesObjectId-${uuidv4()}`
        const refDocId = `Reference-${uuidv4()}`
        const refKeyInfoId = `ReferenceKeyInfo`
        const refSignedPropsId = `ReferenceSignedProperties-${uuidv4()}`

        const policyIdentifierFromXml = policyIdentifierInput || docForDigest.documentElement.namespaceURI || ''
        const policyHashAlgorithm = policyHashAlgorithmInput
        const policyHashValue = policyHashValueInput

        const defaultPolicy = getDefaultPolicy(policyIdentifierFromXml)
        const finalPolicyIdentifier = policyIdentifierFromXml
        const finalPolicyHashAlgorithm = policyHashAlgorithm || defaultPolicy?.policyHashAlgorithm
        const finalPolicyHashValue = policyHashValue || defaultPolicy?.policyHashValue

        if (!finalPolicyIdentifier || !finalPolicyHashAlgorithm || !finalPolicyHashValue) {
            return NextResponse.json(
                {
                    error:
                        'Faltan datos de política para XAdES-EPES. Envíe policyIdentifier, policyHashAlgorithm y policyHashValue.'
                },
                { status: 400 }
            )
        }

        const claimedRoleValue = claimedRoleInput || 'ObligadoTributario'

        // Cert digest (SHA-256 sobre DER) e IssuerSerial
        const certAsn1 = forge.pki.certificateToAsn1(certForge)
        const certDerBytes = forge.asn1.toDer(certAsn1).getBytes()
        const certDerBuffer = Buffer.from(certDerBytes, 'binary')
        const certDigestB64 = crypto.createHash('sha256').update(certDerBuffer).digest('base64')
        const issuerName = formatIssuerName(certForge)
        const serialDecimal = hexSerialToDecimal(certForge.serialNumber || '')

        // RSAKeyValue
        const pubKey: any = certForge.publicKey as any
        const modulusB64 = pubKey?.n ? bigIntToBase64(pubKey.n) : ''
        const exponentB64 = pubKey?.e ? bigIntToBase64(pubKey.e) : ''

        // Canonicalizar el documento (referencia URI="")
        const c14n = new SignedXml()
        const canonDoc = c14n.getCanonXml(
            ['http://www.w3.org/TR/2001/REC-xml-c14n-20010315'],
            docForDigest.documentElement
        )
        const docDigestB64 = crypto.createHash('sha256').update(canonDoc, 'utf8').digest('base64')

        // Construir un DOM final donde insertaremos la firma
        const doc = new DOMParser().parseFromString(xml, 'application/xml')
        const root = doc.documentElement
        if (!root) {
            return NextResponse.json({ error: 'XML inválido (sin raíz).' }, { status: 400 })
        }

        const create = (prefix: string, ns: string, local: string) => doc.createElementNS(ns, `${prefix}:${local}`)

        const signature = create('ds', dsNS, 'Signature')
        signature.setAttribute('Id', sigId)

        const signedInfo = create('ds', dsNS, 'SignedInfo')

        const canonMethod = create('ds', dsNS, 'CanonicalizationMethod')
        canonMethod.setAttribute('Algorithm', 'http://www.w3.org/TR/2001/REC-xml-c14n-20010315')

        const sigMethod = create('ds', dsNS, 'SignatureMethod')
        sigMethod.setAttribute('Algorithm', 'http://www.w3.org/2001/04/xmldsig-more#rsa-sha256')

        // Reference: Documento (URI="")
        const refDoc = create('ds', dsNS, 'Reference')
        refDoc.setAttribute('Id', refDocId)
        refDoc.setAttribute('URI', '')

        const transforms = create('ds', dsNS, 'Transforms')
        const t1 = create('ds', dsNS, 'Transform')
        t1.setAttribute('Algorithm', 'http://www.w3.org/2000/09/xmldsig#enveloped-signature')
        transforms.appendChild(t1)
        // Para ser más robustos, agregamos canonicalización como transform (aunque el ejemplo no lo muestre)
        const t2 = create('ds', dsNS, 'Transform')
        t2.setAttribute('Algorithm', 'http://www.w3.org/TR/2001/REC-xml-c14n-20010315')
        transforms.appendChild(t2)

        const digestMethod = create('ds', dsNS, 'DigestMethod')
        digestMethod.setAttribute('Algorithm', 'http://www.w3.org/2001/04/xmlenc#sha256')
        const digestValue = create('ds', dsNS, 'DigestValue')
        digestValue.appendChild(doc.createTextNode(docDigestB64))

        refDoc.appendChild(transforms)
        refDoc.appendChild(digestMethod)
        refDoc.appendChild(digestValue)

        // KeyInfo (lo armamos antes para poder referenciarlo)
        const keyInfo = create('ds', dsNS, 'KeyInfo')
        keyInfo.setAttribute('Id', keyInfoId)

        const x509Data = create('ds', dsNS, 'X509Data')
        const x509Cert = create('ds', dsNS, 'X509Certificate')
        x509Cert.appendChild(doc.createTextNode(certBase64))
        x509Data.appendChild(x509Cert)
        keyInfo.appendChild(x509Data)

        if (modulusB64 && exponentB64) {
            const keyValue = create('ds', dsNS, 'KeyValue')
            const rsaKeyValue = create('ds', dsNS, 'RSAKeyValue')
            const modEl = create('ds', dsNS, 'Modulus')
            modEl.appendChild(doc.createTextNode(modulusB64))
            const expEl = create('ds', dsNS, 'Exponent')
            expEl.appendChild(doc.createTextNode(exponentB64))
            rsaKeyValue.appendChild(modEl)
            rsaKeyValue.appendChild(expEl)
            keyValue.appendChild(rsaKeyValue)
            keyInfo.appendChild(keyValue)
        }

        // XAdES SignedProperties
        const obj = create('ds', dsNS, 'Object')
        obj.setAttribute('Id', objectId)

        const qualifyingProps = doc.createElementNS(xadesNS, 'xades:QualifyingProperties')
        qualifyingProps.setAttribute('Id', qualifyingPropsId)
        qualifyingProps.setAttribute('Target', `#${sigId}`)

        const signedProps = doc.createElementNS(xadesNS, 'xades:SignedProperties')
        signedProps.setAttribute('Id', signedPropsId)

        const signedSigProps = doc.createElementNS(xadesNS, 'xades:SignedSignatureProperties')

        const signingTime = doc.createElementNS(xadesNS, 'xades:SigningTime')
        signingTime.appendChild(doc.createTextNode(signingTimeCostaRica()))

        const signingCert = doc.createElementNS(xadesNS, 'xades:SigningCertificate')
        const certEl = doc.createElementNS(xadesNS, 'xades:Cert')
        const certDigest = doc.createElementNS(xadesNS, 'xades:CertDigest')
        const certDigestMethod = create('ds', dsNS, 'DigestMethod')
        certDigestMethod.setAttribute('Algorithm', 'http://www.w3.org/2001/04/xmlenc#sha256')
        const certDigestValue = create('ds', dsNS, 'DigestValue')
        certDigestValue.appendChild(doc.createTextNode(certDigestB64))
        certDigest.appendChild(certDigestMethod)
        certDigest.appendChild(certDigestValue)

        const issuerSerial = doc.createElementNS(xadesNS, 'xades:IssuerSerial')
        const x509IssuerName = create('ds', dsNS, 'X509IssuerName')
        x509IssuerName.appendChild(doc.createTextNode(issuerName))
        const x509Serial = create('ds', dsNS, 'X509SerialNumber')
        x509Serial.appendChild(doc.createTextNode(serialDecimal))
        issuerSerial.appendChild(x509IssuerName)
        issuerSerial.appendChild(x509Serial)

        certEl.appendChild(certDigest)
        certEl.appendChild(issuerSerial)
        signingCert.appendChild(certEl)

        const policyIdentifier = doc.createElementNS(xadesNS, 'xades:SignaturePolicyIdentifier')
        const policyId = doc.createElementNS(xadesNS, 'xades:SignaturePolicyId')
        const sigPolicyId = doc.createElementNS(xadesNS, 'xades:SigPolicyId')
        const identifier = doc.createElementNS(xadesNS, 'xades:Identifier')
        identifier.appendChild(doc.createTextNode(finalPolicyIdentifier))
        const description = doc.createElementNS(xadesNS, 'xades:Description')
        sigPolicyId.appendChild(identifier)
        sigPolicyId.appendChild(description)

        const sigPolicyHash = doc.createElementNS(xadesNS, 'xades:SigPolicyHash')
        const polDigestMethod = create('ds', dsNS, 'DigestMethod')
        polDigestMethod.setAttribute('Algorithm', finalPolicyHashAlgorithm)
        const polDigestValue = create('ds', dsNS, 'DigestValue')
        polDigestValue.appendChild(doc.createTextNode(finalPolicyHashValue))
        sigPolicyHash.appendChild(polDigestMethod)
        sigPolicyHash.appendChild(polDigestValue)

        policyId.appendChild(sigPolicyId)
        policyId.appendChild(sigPolicyHash)
        policyIdentifier.appendChild(policyId)

        const signerRole = doc.createElementNS(xadesNS, 'xades:SignerRole')
        const claimedRoles = doc.createElementNS(xadesNS, 'xades:ClaimedRoles')
        const claimedRoleNode = doc.createElementNS(xadesNS, 'xades:ClaimedRole')
        claimedRoleNode.appendChild(doc.createTextNode(claimedRoleValue))
        claimedRoles.appendChild(claimedRoleNode)
        signerRole.appendChild(claimedRoles)

        signedSigProps.appendChild(signingTime)
        signedSigProps.appendChild(signingCert)
        signedSigProps.appendChild(policyIdentifier)
        signedSigProps.appendChild(signerRole)

        const signedDataObjProps = doc.createElementNS(xadesNS, 'xades:SignedDataObjectProperties')
        const dataObjFormat = doc.createElementNS(xadesNS, 'xades:DataObjectFormat')
        dataObjFormat.setAttribute('ObjectReference', `#${refDocId}`)
        const mimeType = doc.createElementNS(xadesNS, 'xades:MimeType')
        mimeType.appendChild(doc.createTextNode('text/xml'))
        const encoding = doc.createElementNS(xadesNS, 'xades:Encoding')
        encoding.appendChild(doc.createTextNode('UTF-8'))
        dataObjFormat.appendChild(mimeType)
        dataObjFormat.appendChild(encoding)
        signedDataObjProps.appendChild(dataObjFormat)

        signedProps.appendChild(signedSigProps)
        signedProps.appendChild(signedDataObjProps)

        qualifyingProps.appendChild(signedProps)
        obj.appendChild(qualifyingProps)

        // Digests: KeyInfo y SignedProperties
        const canonKeyInfo = c14n.getCanonXml(['http://www.w3.org/TR/2001/REC-xml-c14n-20010315'], keyInfo)
        const keyInfoDigestB64 = crypto.createHash('sha256').update(canonKeyInfo, 'utf8').digest('base64')

        const canonSignedProps = c14n.getCanonXml(['http://www.w3.org/TR/2001/REC-xml-c14n-20010315'], signedProps)
        const signedPropsDigestB64 = crypto.createHash('sha256').update(canonSignedProps, 'utf8').digest('base64')

        // Reference: KeyInfo
        const refKeyInfo = create('ds', dsNS, 'Reference')
        refKeyInfo.setAttribute('Id', refKeyInfoId)
        refKeyInfo.setAttribute('URI', `#${keyInfoId}`)
        const kiDigestMethod = create('ds', dsNS, 'DigestMethod')
        kiDigestMethod.setAttribute('Algorithm', 'http://www.w3.org/2001/04/xmlenc#sha256')
        const kiDigestValue = create('ds', dsNS, 'DigestValue')
        kiDigestValue.appendChild(doc.createTextNode(keyInfoDigestB64))
        refKeyInfo.appendChild(kiDigestMethod)
        refKeyInfo.appendChild(kiDigestValue)

        // Reference: SignedProperties
        const refSignedProps = create('ds', dsNS, 'Reference')
        refSignedProps.setAttribute('Id', refSignedPropsId)
        refSignedProps.setAttribute('Type', 'http://uri.etsi.org/01903#SignedProperties')
        refSignedProps.setAttribute('URI', `#${signedPropsId}`)
        const spDigestMethod = create('ds', dsNS, 'DigestMethod')
        spDigestMethod.setAttribute('Algorithm', 'http://www.w3.org/2001/04/xmlenc#sha256')
        const spDigestValue = create('ds', dsNS, 'DigestValue')
        spDigestValue.appendChild(doc.createTextNode(signedPropsDigestB64))
        refSignedProps.appendChild(spDigestMethod)
        refSignedProps.appendChild(spDigestValue)

        // Ensamblar SignedInfo
        signedInfo.appendChild(canonMethod)
        signedInfo.appendChild(sigMethod)
        signedInfo.appendChild(refDoc)
        signedInfo.appendChild(refKeyInfo)
        signedInfo.appendChild(refSignedProps)

        // Canonicalizar SignedInfo y firmar (RSA-SHA256)
        const canonSignedInfo = c14n.getCanonXml(['http://www.w3.org/TR/2001/REC-xml-c14n-20010315'], signedInfo)
        const signer = crypto.createSign('RSA-SHA256')
        signer.update(canonSignedInfo, 'utf8')
        signer.end()
        const signatureB64 = signer.sign(privateKeyPem).toString('base64')

        const sigValue = create('ds', dsNS, 'SignatureValue')
        sigValue.setAttribute('Id', signatureValueId)
        sigValue.appendChild(doc.createTextNode(signatureB64))

        // Insertar firma
        signature.appendChild(signedInfo)
        signature.appendChild(sigValue)
        signature.appendChild(keyInfo)
        signature.appendChild(obj)

        root.appendChild(signature)

        const signedXml = new XMLSerializer().serializeToString(doc)
        return NextResponse.json({ success: true, signedXml })
    } catch (error: any) {
        console.error('Error en POST /api/xml/sign:', error)
        return NextResponse.json(
            { error: error.message || 'Error al firmar el XML' },
            { status: 500 }
        )
    }
}


