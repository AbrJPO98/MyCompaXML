'use client'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/contexts/AuthContext'
import styles from './login.module.css'

interface LoginForm {
  email: string
  password: string
}

interface LoginResponse {
  success: boolean
  message: string
  user?: {
    _id: string
    name: string
    email: string
    role: string
  }
  error?: string
}

export default function LoginPage() {
  const router = useRouter()
  const { login, isAuthenticated, isLoading: authLoading } = useAuth()
  const [form, setForm] = useState<LoginForm>({
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push('/home')
    }
  }, [isAuthenticated, authLoading, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm(prev => ({
      ...prev,
      [name]: value
    }))
    // Limpiar error cuando el usuario empiece a escribir
    if (error) setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const success = await login(form.email, form.password)
      
      if (success) {
        // Login exitoso - redirigir a la nueva página de inicio
        router.push('/home')
      } else {
        setError('Email o contraseña incorrectos')
      }
    } catch (error) {
      console.error('Error en login:', error)
      setError('Error de conexión. Por favor intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const goBack = () => {
    router.push('/')
  }

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.header}>
          <button onClick={goBack} className={styles.backButton}>
            ← Volver
          </button>
          <h1 className={styles.title}>Iniciar Sesión</h1>
          <p className={styles.subtitle}>Ingresa a tu cuenta de MyCompaXML</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && (
            <div className={styles.error}>
              {error}
            </div>
          )}

          <div className={styles.inputGroup}>
            <label htmlFor="email" className={styles.label}>
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              className={styles.input}
              placeholder="tu@email.com"
              disabled={loading}
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password" className={styles.label}>
              Contraseña
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              className={styles.input}
              placeholder="••••••••"
              disabled={loading}
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !form.email || !form.password}
            className={styles.submitButton}
          >
            {loading ? 'Iniciando sesión...' : 'Ingresar'}
          </button>
        </form>

        <div className={styles.footer}>
          <p>
            ¿No tienes cuenta?{' '}
            <button
              onClick={() => router.push('/register')}
              className={styles.linkButton}
            >
              Crear cuenta
            </button>
          </p>
        </div>

      </div>
    </main>
  )
} 