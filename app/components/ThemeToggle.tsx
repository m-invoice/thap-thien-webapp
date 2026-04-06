'use client'

import { useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false)
  const [theme, setTheme] = useState<Theme>('light')

  useEffect(() => {
    setMounted(true)

    const savedTheme = localStorage.getItem('theme') as Theme | null

    if (savedTheme === 'dark' || savedTheme === 'light') {
      setTheme(savedTheme)
      document.documentElement.classList.toggle('dark', savedTheme === 'dark')
      return
    }

    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const initialTheme: Theme = prefersDark ? 'dark' : 'light'
    setTheme(initialTheme)
    document.documentElement.classList.toggle('dark', initialTheme === 'dark')
  }, [])

  function toggleTheme() {
    const nextTheme: Theme = theme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
    localStorage.setItem('theme', nextTheme)
    document.documentElement.classList.toggle('dark', nextTheme === 'dark')
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex items-center gap-2 rounded-xl border px-4 py-2"
      aria-label="Đổi giao diện"
      suppressHydrationWarning
    >
      <span className="text-sm font-semibold" suppressHydrationWarning>
        {!mounted ? '🌓 Giao diện' : theme === 'dark' ? '🌙 Tối' : '☀️ Sáng'}
      </span>
    </button>
  )
}