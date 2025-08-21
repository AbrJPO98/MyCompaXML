import React from 'react'
import styles from './Header.module.css'

interface HeaderProps {
  title?: string
}

export default function Header({ title = "MyCompaXML" }: HeaderProps) {
  return (
    <header className={styles.header}>
      <nav className={styles.nav}>
        <div className={styles.logo}>
          <h1>{title}</h1>
        </div>
        <ul className={styles.navLinks}>
          <li><a href="/">Inicio</a></li>
          <li><a href="/about">Acerca de</a></li>
          <li><a href="/contact">Contacto</a></li>
        </ul>
      </nav>
    </header>
  )
} 