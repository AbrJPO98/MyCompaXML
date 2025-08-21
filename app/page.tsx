'use client'
import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/contexts/AuthContext'
import styles from './page.module.css'

export default function Home() {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuth()

  // Redirigir a la nueva página home si ya está autenticado
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/home')
    }
  }, [isAuthenticated, isLoading, router])

  // Mostrar loading mientras se verifica autenticación
  if (isLoading) {
    return (
      <main className={styles.main}>
        <div className={styles.welcomeContainer}>
          <p>Verificando autenticación...</p>
        </div>
      </main>
    )
  }

  // Solo mostrar la página de bienvenida si NO está autenticado
  if (isAuthenticated) {
    return null // Se redirigirá automáticamente
  }

  return (
    <main className={styles.main}>
      <div className={styles.welcomeContainer}>
        <h1 className={styles.title}>
          Bienvenido a{' '}
          <span className={styles.logo}>MyCompaXML</span>
        </h1>
        
        <div className={styles.buttonsContainer}>
          <button 
            className={styles.loginButton}
            onClick={() => window.location.href = '/login'}
          >
            Ingresar
          </button>
          <button className={styles.signupButton}>
            ¿No tienes cuenta? ¡Crea una ya!
          </button>
        </div>
      </div>
    </main>
  )
} 