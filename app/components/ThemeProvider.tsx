'use client'

import { useEffect } from 'react'

type Theme = 'light' | 'dark'

function getPreferredTheme(): Theme {
  if (typeof window === 'undefined') {
    return 'light'
  }

  const saved = localStorage.getItem('theme')
  if (saved === 'dark' || saved === 'light') {
    return saved
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    const theme = getPreferredTheme()
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [])

  return <>{children}</>
}
