import { redirect } from 'next/navigation'
import { isAdmin } from '@/lib/supabase/auth/isAdmin'

export default async function ImportPage() {
  const auth = await isAdmin()

  if (!auth.user) {
    redirect('/login')
  }

  if (!auth.ok) {
    redirect('/dashboard')
  }

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Import câu hỏi</h1>

        <p className="text-white/70">
          Upload file Excel/CSV để import câu hỏi vào hệ thống.
        </p>

        <div className="mt-6">
          <a
            href="/admin/import"
            className="inline-block px-4 py-2 border border-white/20 rounded-lg hover:bg-white/5"
          >
            Mở trang import
          </a>
        </div>
      </div>
    </main>
  )
}