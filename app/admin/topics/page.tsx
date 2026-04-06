import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

type TopicRow = {
  id: string
  title: string
  slug: string
  description: string | null
  sort_order: number | null
  is_published: boolean | null
}

export default async function AdminTopicsPage() {
  const supabase = await createServerClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  const safeProfile = profile as { role: string | null } | null

  if (safeProfile?.role !== 'admin') {
    redirect('/dashboard')
  }

  const { data, error } = await supabase
    .from('topics')
    .select(`
      id,
      title,
      slug,
      description,
      sort_order,
      is_published
    `)
    .order('sort_order', { ascending: true })

  if (error) {
    return (
      <main className="min-h-screen bg-white p-6 text-black dark:bg-black dark:text-white">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-500">
            Lỗi tải danh sách chủ đề: {error.message}
          </div>
        </div>
      </main>
    )
  }

  const topics: TopicRow[] = (data as TopicRow[]) || []

  return (
    <main className="min-h-screen bg-white p-6 text-black dark:bg-black dark:text-white">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Quản lý chủ đề</h1>
            <p className="mt-2 text-black/60 dark:text-white/60">
              Tạo, chỉnh sửa và sắp xếp các chủ đề học tập.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin"
              className="rounded-xl border border-black/10 px-4 py-2 hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/5"
            >
              ← Về Admin
            </Link>

            <Link
              href="/admin/topics/new"
              className="rounded-xl bg-black px-4 py-2 text-white dark:bg-white dark:text-black"
            >
              + Tạo chủ đề
            </Link>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-black/10 dark:border-white/20">
          <table className="w-full text-sm">
            <thead className="bg-black/5 dark:bg-white/5">
              <tr>
                <th className="p-3 text-left">Tên chủ đề</th>
                <th className="p-3 text-left">Slug</th>
                <th className="p-3 text-left">Mô tả</th>
                <th className="p-3 text-left">Thứ tự</th>
                <th className="p-3 text-left">Trạng thái</th>
                <th className="p-3 text-left">Thao tác</th>
              </tr>
            </thead>

            <tbody>
              {topics.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-black/60 dark:text-white/60">
                    Chưa có chủ đề nào.
                  </td>
                </tr>
              ) : (
                topics.map((topic) => (
                  <tr key={topic.id} className="border-t border-black/10 dark:border-white/10">
                    <td className="p-3 font-medium">{topic.title}</td>
                    <td className="p-3">{topic.slug}</td>
                    <td className="max-w-[280px] p-3">
                      <div className="line-clamp-2">{topic.description || '—'}</div>
                    </td>
                    <td className="p-3">{topic.sort_order ?? 0}</td>
                    <td className="p-3">{topic.is_published ? 'Hiện' : 'Ẩn'}</td>
                    <td className="p-3">
                      <Link
                        href={`/admin/topics/${topic.id}`}
                        className="rounded-lg border border-black/10 px-3 py-2 hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/5"
                      >
                        Sửa
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}