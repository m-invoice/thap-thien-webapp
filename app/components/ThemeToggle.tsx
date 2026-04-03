'use client'

import { useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') {
      return 'light'
    }

    const saved = localStorage.getItem('theme')
    if (saved === 'dark' || saved === 'light') {
      return saved
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  return (
    <button
      suppressHydrationWarning
      onClick={toggleTheme}
      className="px-4 py-2 rounded-lg border border-black/10 dark:border-white/20 hover:bg-black/5 dark:hover:bg-white/10 transition-colors flex items-center gap-2"
      aria-label={`Chế độ ${theme === 'dark' ? 'tối' : 'sáng'}`}
    >
      <span className="text-sm font-semibold">
        {theme === 'dark' ? '🌙 Tối' : '☀️ Sáng'}
      </span>
      <span className="text-xs text-black/50 dark:text-white/50">
        (Nhấn để chuyển sang {theme === 'dark' ? 'sáng' : 'tối'})
      </span>
    </button>
  )
}
