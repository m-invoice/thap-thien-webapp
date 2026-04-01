'use client'

import { createClient } from '@/lib/supabase/client'

export default function LogoutButton() {
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <button
      onClick={handleLogout}
      className="px-4 py-2 rounded-lg border border-white/20 hover:bg-white/10"
    >
      Đăng xuất
    </button>
  )
}