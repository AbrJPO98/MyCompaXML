import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import connectDB from '@/lib/mongodb'
import CabysPersonales from '@/lib/models/CabysPersonales'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') // descripGasInv, bienoserv, categoria
    const channelId = searchParams.get('channelId')

    if (!type || !channelId) {
      return NextResponse.json({ 
        success: false, 
        message: 'Tipo y channelId son requeridos' 
      }, { status: 400 })
    }

    await connectDB()

    // Get options from database
    const dbOptions = await CabysPersonales.find(
      { channel_id: channelId },
      { [type]: 1, _id: 0 }
    ).lean()

    const dbValues = new Set<string>()
    dbOptions.forEach((item: any) => {
      const value = item[type as keyof typeof item]
      if (value && typeof value === 'string' && value.trim() !== '' && value !== '-') {
        dbValues.add(value.trim())
      }
    })

    // Get options from JSON file
    const jsonPath = path.join(process.cwd(), 'public', 'cabys_data.json')
    const jsonContent = fs.readFileSync(jsonPath, 'utf8')
    const jsonData = JSON.parse(jsonContent)

    const jsonValues = new Set<string>()
    if (jsonData.data && Array.isArray(jsonData.data)) {
      jsonData.data.forEach((item: any) => {
        const value = item[type]
        if (value && typeof value === 'string' && value.trim() !== '' && value !== '-') {
          jsonValues.add(value.trim())
        }
      })
    }

    // Combine and prioritize database values
    const allOptions = new Set<string>()
    
    // Add database values first (they have priority)
    dbValues.forEach(value => allOptions.add(value))
    
    // Add JSON values that are not in database
    jsonValues.forEach(value => allOptions.add(value))

    // Convert to sorted array
    const sortedOptions = Array.from(allOptions).sort()

    return NextResponse.json({
      success: true,
      options: sortedOptions
    })

  } catch (error) {
    console.error('Error fetching CABYS options:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Error interno del servidor' 
    }, { status: 500 })
  }
}
