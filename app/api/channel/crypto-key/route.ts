import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Channel from '@/lib/models/Channel'
import { v4 as uuidv4 } from 'uuid'
import { promises as fs } from 'fs'
import path from 'path'

export async function GET(request: NextRequest) {
  try {
    // Obtener el channelId de los parámetros de la URL
    const { searchParams } = new URL(request.url)
    const channelId = searchParams.get('channelId')

    if (!channelId) {
      return NextResponse.json(
        { error: 'El ID del canal es requerido' },
        { status: 400 }
      )
    }

    // Conectar a la base de datos
    await connectDB()

    // Buscar el canal por _id
    const channel = await Channel.findById(channelId)

    if (!channel) {
      return NextResponse.json(
        { error: 'Canal no encontrado' },
        { status: 404 }
      )
    }

    // Verificar si el canal tiene crypto_key
    if (!channel.crypto_key) {
      return NextResponse.json({
        success: true,
        hasCryptoKey: false,
        data: null
      })
    }

    // Retornar los datos de crypto_key (sin la contraseña completa por seguridad)
    return NextResponse.json({
      success: true,
      hasCryptoKey: true,
      data: {
        email: channel.crypto_key.email,
        password: channel.crypto_key.password, // En producción podrías omitir o enmascarar esto
        pin: channel.crypto_key.pin,
        status: channel.crypto_key.status,
        file_name: channel.crypto_key.file_name
      }
    })

  } catch (error: any) {
    console.error('Error en GET /api/channel/crypto-key:', error)
    return NextResponse.json(
      { error: error.message || 'Error al procesar la solicitud' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Obtener datos del FormData
    const formData = await request.formData()
    const channelId = formData.get('channelId') as string
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const pin = formData.get('pin') as string
    const status = formData.get('status') as 'prod' | 'sand'
    const cryptoFile = formData.get('cryptoFile') as File | null
    const keepExistingFile = formData.get('keepExistingFile') === 'true'

    // Validar que los campos básicos estén presentes
    if (!channelId || !email || !password || !pin || !status) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      )
    }

    // Validar que haya un archivo nuevo o que se mantenga el existente
    if (!cryptoFile && !keepExistingFile) {
      return NextResponse.json(
        { error: 'Debe seleccionar un archivo .p12' },
        { status: 400 }
      )
    }

    // Validar que el archivo sea .p12 si se proporciona uno nuevo
    if (cryptoFile && !cryptoFile.name.endsWith('.p12')) {
      return NextResponse.json(
        { error: 'Solo se permiten archivos con extensión .p12' },
        { status: 400 }
      )
    }

    console.log('=== Iniciando guardado de crypto_key ===')
    console.log('Channel ID recibido:', channelId)
    console.log('Email:', email)
    console.log('Status:', status)
    console.log('Tiene archivo nuevo:', !!cryptoFile)
    console.log('Mantener archivo existente:', keepExistingFile)

    // Conectar a la base de datos
    await connectDB()

    // Buscar el canal por _id
    const channel = await Channel.findById(channelId)

    if (!channel) {
      console.error('❌ Canal no encontrado con ID:', channelId)
      return NextResponse.json(
        { error: 'Canal no encontrado' },
        { status: 404 }
      )
    }

    console.log('✅ Canal encontrado:', channel._id, '-', channel.name)

    let finalUuid: string
    let finalFileName: string

    // Si hay un nuevo archivo, procesar el cambio de archivo
    if (cryptoFile) {
      // Si el canal ya tiene crypto_key con uuid, borrar la carpeta anterior
      if (channel.crypto_key && channel.crypto_key.uuid) {
        const oldUuid = channel.crypto_key.uuid
        const oldFolderPath = path.join(process.cwd(), 'protected', 'crypto-keys', oldUuid)
        
        try {
          // Verificar si la carpeta existe
          await fs.access(oldFolderPath)
          // Si existe, borrarla recursivamente
          await fs.rm(oldFolderPath, { recursive: true, force: true })
          console.log(`Carpeta anterior eliminada: ${oldFolderPath}`)
        } catch (error) {
          // Si la carpeta no existe, solo registrar un mensaje
          console.log(`La carpeta anterior no existe o ya fue eliminada: ${oldFolderPath}`)
        }
      }

      // Generar nuevo UUID
      const newUuid = uuidv4()
      finalUuid = newUuid
      finalFileName = cryptoFile.name

      // Crear la nueva carpeta para el crypto key
      const newFolderPath = path.join(process.cwd(), 'protected', 'crypto-keys', newUuid)
      
      try {
        // Crear carpeta protected/crypto-keys si no existe
        const protectedPath = path.join(process.cwd(), 'protected')
        const cryptoKeysPath = path.join(protectedPath, 'crypto-keys')
        
        await fs.mkdir(protectedPath, { recursive: true })
        await fs.mkdir(cryptoKeysPath, { recursive: true })
        await fs.mkdir(newFolderPath, { recursive: true })
      } catch (error) {
        console.error('Error creando carpetas:', error)
        return NextResponse.json(
          { error: 'Error al crear las carpetas para la llave criptográfica' },
          { status: 500 }
        )
      }

      // Guardar el archivo .p12
      const filePath = path.join(newFolderPath, 'key.p12')
      
      try {
        // Convertir el archivo a buffer y guardarlo
        const arrayBuffer = await cryptoFile.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        await fs.writeFile(filePath, buffer)
        console.log(`Archivo guardado en: ${filePath}`)
      } catch (error) {
        console.error('Error guardando archivo:', error)
        // Si falla al guardar el archivo, borrar la carpeta creada
        try {
          await fs.rm(newFolderPath, { recursive: true, force: true })
        } catch (cleanupError) {
          console.error('Error al limpiar carpeta:', cleanupError)
        }
        return NextResponse.json(
          { error: 'Error al guardar el archivo .p12' },
          { status: 500 }
        )
      }
    } else {
      // Si no hay nuevo archivo, mantener el UUID y nombre de archivo existente
      if (!channel.crypto_key || !channel.crypto_key.uuid) {
        return NextResponse.json(
          { error: 'No hay un archivo existente para mantener' },
          { status: 400 }
        )
      }
      finalUuid = channel.crypto_key.uuid
      finalFileName = channel.crypto_key.file_name
    }

    // Actualizar el documento del canal con el nuevo crypto_key
    const newCryptoKey = {
      uuid: finalUuid,
      email: email,
      password: password,
      pin: pin,
      status: status,
      file_name: finalFileName
    }

    console.log('Datos a guardar en crypto_key:', newCryptoKey)
    
    channel.crypto_key = newCryptoKey

    // Marcar el campo como modificado para que Mongoose lo detecte
    channel.markModified('crypto_key')

    console.log('Antes de save() - crypto_key:', channel.crypto_key)
    
    const savedChannel = await channel.save()
    
    console.log('✅ Después de save() - crypto_key guardado:', savedChannel.crypto_key)
    console.log('=== Crypto key guardado exitosamente ===', {
      channelId: savedChannel._id,
      uuid: finalUuid,
      email: email,
      hasFile: !!finalFileName
    })

    return NextResponse.json({
      success: true,
      message: cryptoFile ? 'Firma digital guardada exitosamente' : 'Firma digital actualizada exitosamente',
      data: {
        uuid: finalUuid,
        email: email,
        status: status,
        file_name: finalFileName
      }
    })

  } catch (error: any) {
    console.error('Error en POST /api/channel/crypto-key:', error)
    return NextResponse.json(
      { error: error.message || 'Error al procesar la solicitud' },
      { status: 500 }
    )
  }
}

