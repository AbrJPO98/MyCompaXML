import connectDB from './mongodb'
import mongoose from 'mongoose'

// Tipos para respuestas de API
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

// Función wrapper para operaciones de base de datos
export async function withDB<T>(
  operation: () => Promise<T>
): Promise<ApiResponse<T>> {
  try {
    await connectDB()
    const data = await operation()
    return {
      success: true,
      data
    }
  } catch (error: any) {
    console.error('Database operation error:', error)
    return {
      success: false,
      error: error.message || 'Error de base de datos',
      message: 'Ha ocurrido un error al procesar la solicitud'
    }
  }
}

// Validar si un string es un ObjectId válido
export function isValidObjectId(id: string): boolean {
  if (!id || typeof id !== 'string') {
    return false
  }
  
  // Debe ser exactamente 24 caracteres hexadecimales
  if (id.length !== 24) {
    return false
  }
  
  // Debe contener solo caracteres hexadecimales
  const hexRegex = /^[0-9a-fA-F]{24}$/
  return hexRegex.test(id)
}

// Función para sanitizar datos de entrada
export function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    return input.trim()
  }
  
  if (Array.isArray(input)) {
    return input.map(sanitizeInput)
  }
  
  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {}
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeInput(value)
    }
    return sanitized
  }
  
  return input
}

// Función para crear filtros de búsqueda
export function buildSearchFilter(query: string, fields: string[]) {
  if (!query) return {}
  
  const searchRegex = new RegExp(query, 'i')
  return {
    $or: fields.map(field => ({ [field]: searchRegex }))
  }
}

// Función para paginación
export interface PaginationOptions {
  page: number
  limit: number
  sort?: string
  sortOrder?: 'asc' | 'desc'
}

export function buildPaginationQuery(options: PaginationOptions) {
  const { page = 1, limit = 10, sort = 'createdAt', sortOrder = 'desc' } = options
  
  const skip = (page - 1) * limit
  const sortQuery = { [sort]: sortOrder === 'desc' ? -1 : 1 }
  
  return {
    skip,
    limit,
    sort: sortQuery
  }
} 