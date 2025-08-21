import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import mongoose from 'mongoose'
import User from '@/lib/models/User'

export async function GET() {
  try {
    await connectDB()
    
    // Verificar el estado de la conexión
    const connectionState = mongoose.connection.readyState
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    }

    const dbInfo = {
      status: 'success',
      message: 'Conexión a MongoDB establecida correctamente',
      connectionState: states[connectionState as keyof typeof states],
      database: mongoose.connection.db?.databaseName,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      timestamp: new Date().toISOString()
    }

    // Verificar que estamos conectados a la base de datos myCompaXML
    if (mongoose.connection.db?.databaseName !== 'myCompaXML') {
      console.warn(`⚠️  Conectado a '${mongoose.connection.db?.databaseName}' pero se esperaba 'myCompaXML'`)
    }

    // Obtener información de las colecciones
    const collections = await mongoose.connection.db?.listCollections().toArray()
    
    // Verificar si existe la colección Users
    const usersCollection = collections?.find(col => col.name === 'Users')
    
    // Contar documentos en la colección Users
    let usersCount = 0
    try {
      usersCount = await User.countDocuments()
    } catch (error) {
      console.log('La colección Users aún no existe o está vacía')
    }

    return NextResponse.json({
      ...dbInfo,
      collections: collections?.map(col => col.name) || [],
      totalCollections: collections?.length || 0,
      usersCollection: {
        exists: !!usersCollection,
        documentsCount: usersCount,
        name: 'Users'
      },
      isCorrectDatabase: mongoose.connection.db?.databaseName === 'myCompaXML'
    })

  } catch (error: any) {
    console.error('Error testing database connection:', error)
    
    return NextResponse.json(
      {
        status: 'error',
        message: 'Error al conectar con MongoDB',
        error: error.message,
        timestamp: new Date().toISOString(),
        database: 'myCompaXML (objetivo)',
        collection: 'Users (objetivo)'
      },
      { status: 500 }
    )
  }
} 