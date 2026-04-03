'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSignUp = async () => {
    setLoading(true)
    setMessage('')

    const { error } = await supabase.auth.signUp({ email, password })

    setMessage(
      error
        ? error.message
        : 'Đăng ký thành công. Nếu hệ thống yêu cầu, hãy kiểm tra email để xác thực.'
    )

    setLoading(false)
  }

  const handleSignIn = async () => {
    setLoading(true)
    setMessage('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setMessage(error.message)
      setLoading(false)
      return
    }

    setMessage('Đăng nhập thành công.')
    setLoading(false)

    window.location.href = '/dashboard'
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="w-full max-w-xl">
        <h1 className="text-5xl font-bold mb-10 text-center">Đăng nhập</h1>

        <input
          className="w-full border border-white/50 bg-transparent rounded-xl p-4 mb-4 text-lg"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          className="w-full border border-white/50 bg-transparent rounded-xl p-4 mb-5 text-lg"
          placeholder="Mật khẩu"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <div className="flex gap-4">
          <button
            onClick={handleSignIn}
            disabled={loading}
            className="px-6 py-3 rounded-xl bg-black text-white dark:bg-white dark:text-black font-semibold disabled:opacity-50"
          >
            {loading ? 'Đang xử lý...' : 'Đăng nhập'}
          </button>

          <button
            onClick={handleSignUp}
            disabled={loading}
            className="px-6 py-3 rounded-xl border border-white/50 font-semibold disabled:opacity-50"
          >
            Đăng ký
          </button>
        </div>

        {message && (
          <p className="mt-5 text-sm text-white/80">{message}</p>
        )}
      </div>
    </div>
  )
}