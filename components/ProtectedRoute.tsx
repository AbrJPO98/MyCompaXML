'use client'
import React, { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/lib/contexts/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  fallback = <div>Cargando...</div> 
}) => {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  // Lista de rutas públicas que no requieren autenticación
  const publicRoutes = ['/', '/login']
  const isPublicRoute = pathname ? publicRoutes.includes(pathname) : false

  useEffect(() => {
    // Si no está cargando y no está autenticado y no es una ruta pública
    if (!isLoading && !isAuthenticated && !isPublicRoute) {
      router.push('/')
    }
  }, [isAuthenticated, isLoading, isPublicRoute, router])

  // Mostrar loading mientras se verifica la autenticación
  if (isLoading) {
    return <>{fallback}</>
  }

  // Si es una ruta pública, mostrar contenido sin restricciones
  if (isPublicRoute) {
    return <>{children}</>
  }

  // Si está autenticado, mostrar contenido protegido
  if (isAuthenticated) {
    return <>{children}</>
  }

  // Si no está autenticado y no es ruta pública, no mostrar nada 
  // (se redirigirá automáticamente)
  return null
}

export default ProtectedRoute 