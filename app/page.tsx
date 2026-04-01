import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LogoutButton from '@/app/components/LogoutButton'

export default async function HomePage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Thập Thiện WebApp</h1>
            <p className="text-white/70 mt-2">
              Đăng nhập thành công rồi. Từ đây mới bắt đầu làm app thật.
            </p>
          </div>

          <LogoutButton />
        </div>

        <div className="rounded-2xl border border-white/20 p-6">
          <h2 className="text-xl font-semibold mb-3">Thông tin người dùng</h2>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>User ID:</strong> {user.id}</p>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href="/topics"
            className="inline-block px-4 py-2 bg-white text-black rounded-lg"
          >
            Bắt đầu học
          </a>

          <a
            href="/history"
            className="inline-block px-4 py-2 border border-white/20 rounded-lg hover:bg-white/5"
          >
            Lịch sử bài thi
          </a>

          <a
            href="/dashboard"
            className="inline-block px-4 py-2 border border-white/20 rounded-lg hover:bg-white/5"
          >
            Dashboard
          </a>

          <a
            href="/review"
            className="inline-block px-4 py-2 border border-white/20 rounded-lg hover:bg-white/5"
          >
            Ôn lại câu sai
          </a>
        </div>
      </div>
    </main>
  )
}