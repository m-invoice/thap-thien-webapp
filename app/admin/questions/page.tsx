import { redirect } from 'next/navigation'
import { isAdmin } from '@/lib/supabase/auth/isAdmin'
import AdminQuestionsClientPage from './AdminQuestionsClient'

export default async function AdminQuestionsPage() {
  const auth = await isAdmin()

  if (!auth.user) {
    redirect('/login')
  }

  if (!auth.ok) {
    redirect('/dashboard')
  }

  return <AdminQuestionsClientPage />
}