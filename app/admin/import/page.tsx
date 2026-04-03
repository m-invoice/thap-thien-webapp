import { redirect } from 'next/navigation'
import { isAdmin } from '@/lib/auth/isAdmin'

export default async function ImportPage() {
  const auth = await isAdmin()

  if (!auth.user) {
    redirect('/login')
  }

  if (!auth.ok) {
    redirect('/dashboard')
  }

  return (
    <main className="min-h-screen bg-white text-black dark:bg-black dark:text-white p-8">
      <div className="max-w-xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Import câu hỏi</h1>
        <p className="text-black/70 dark:text-white/70">
          Upload file Excel/CSV để import câu hỏi vào hệ thống.
        </p>
      </div>
    </main>
  )
}