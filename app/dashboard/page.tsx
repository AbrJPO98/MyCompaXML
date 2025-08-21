'use client'
import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/contexts/AuthContext'
import styles from './dashboard.module.css'

export default function DashboardPage() {
  const router = useRouter()
  const { user, logout, isAuthenticated, isLoading } = useAuth()

  useEffect(() => {
    // Si no está autenticado, redirigir al login
    if (!isLoading && !isAuthenticated) {
      router.push('/')
      return
    }
  }, [isAuthenticated, isLoading, router])

  const handleLogout = () => {
    logout()
  }

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Cargando...</p>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return null
  }

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div className={styles.userInfo}>
          <h1>Bienvenido, {user.name}!</h1>
          <p>Email: {user.email}</p>
          <p>Identificación: {user.type_ident}-{user.ident}</p>
          <span className={`${styles.badge} ${styles[user.role]}`}>
            {user.role === 'admin' ? 'Administrador' : 'Usuario'}
          </span>
        </div>
        <button onClick={handleLogout} className={styles.logoutButton}>
          Cerrar Sesión
        </button>
      </header>

      <div className={styles.content}>
        <div className={styles.card}>
          <h2>Información de tu cuenta</h2>
          <div className={styles.info}>
            <p><strong>ID:</strong> {user._id}</p>
            <p><strong>Estado:</strong> {user.isActive ? 'Activo' : 'Inactivo'}</p>
            <p><strong>Teléfono:</strong> +{user.phone_code} {user.phone}</p>
          </div>
        </div>

        <div className={styles.card}>
          <h2>Módulos Disponibles</h2>
          <div className={styles.actions}>
            <button 
              onClick={() => router.push('/channels')}
              className={styles.actionButton}
            >
              🏢 Información del Canal
            </button>
            <button 
              onClick={() => router.push('/api/test-connection')}
              className={styles.actionButton}
            >
              🔧 Probar Conexión DB
            </button>
            <button 
              onClick={() => router.push('/')}
              className={styles.actionButton}
            >
              🏠 Ir al Inicio
            </button>
          </div>
        </div>
      </div>
    </main>
  )
} 