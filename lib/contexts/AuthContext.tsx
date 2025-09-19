'use client'
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'

// Interfaces
export interface User {
  _id: string
  ident: string
  type_ident: string
  first_name: string
  last_name: string
  email: string
  phone: string
  phone_code: string
  role: string
  isActive: boolean
  name: string
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  refreshUser: () => Promise<void>
  isLoading: boolean
  isAuthenticated: boolean
}

// Crear el contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Hook para usar el contexto
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider')
  }
  return context
}

// Provider del contexto
interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Verificar si hay un usuario guardado en localStorage al cargar
  useEffect(() => {
    const checkStoredUser = () => {
      try {
        const storedUser = localStorage.getItem('user')
        if (storedUser) {
          const userData = JSON.parse(storedUser)
          // Verificar que el usuario esté activo
          if (userData.isActive === true) {
            setUser(userData)
          } else {
            // Si el usuario no está activo, limpiar localStorage
            console.log('Usuario inactivo encontrado en localStorage, limpiando...')
            localStorage.removeItem('user')
            setUser(null)
          }
        }
      } catch (error) {
        console.error('Error al cargar usuario desde localStorage:', error)
        localStorage.removeItem('user')
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    checkStoredUser()
  }, [])

  // Función de login
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true)
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (data.success && data.user) {
        // Verificar que el usuario esté activo
        if (data.user.isActive === true) {
          setUser(data.user)
          localStorage.setItem('user', JSON.stringify(data.user))
          return true
        } else {
          console.error('Usuario inactivo, no se puede iniciar sesión')
          return false
        }
      } else {
        console.error('Error en login:', data.message)
        return false
      }
    } catch (error) {
      console.error('Error en login:', error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  // Función para refrescar los datos del usuario
  const refreshUser = async (): Promise<void> => {
    if (!user?._id) return

    try {
      // Simular refrescando desde la fuente actual o hacer una llamada API si es necesario
      // Por ahora, solo necesitamos recargar desde localStorage si se ha actualizado
      // En un caso más complejo, harías una llamada API aquí
      const storedUser = localStorage.getItem('user')
      if (storedUser) {
        const userData = JSON.parse(storedUser)
        // Nota: En este caso particular, el usuario ya debería estar actualizado en localStorage
        // por la lógica del modal, pero esto asegura que el contexto esté sincronizado
        setUser(userData)
      }
    } catch (error) {
      console.error('Error refrescando usuario:', error)
    }
  }

  // Función de logout
  const logout = () => {
    setUser(null)
    localStorage.removeItem('user')
    router.push('/')
  }

  const isAuthenticated = user !== null && user.isActive === true

  const value: AuthContextType = {
    user,
    login,
    logout,
    refreshUser,
    isLoading,
    isAuthenticated
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
} 