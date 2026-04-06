import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

type LessonRow = {
  id: string
  title: string
  lesson_no: number | null
  sort_order: number | null
  is_published: boolean | null
  topics: {
    title: string
    slug: string
  } | null
}

type RawLessonRow = {
  id: string
  title: string
  lesson_no: number | null
  sort_order: number | null
  is_published: boolean | null
  topics:
    | {
        title: string
        slug: string
      }
    | {
        title: string
        slug: string
      }[]
    | null
}

export default async function AdminLessonsPage() {
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
    .from('lessons')
    .select(`
      id,
      title,
      lesson_no,
      sort_order,
      is_published,
      topics (
        title,
        slug
      )
    `)
    .order('sort_order', { ascending: true })

  if (error) {
    return (
      <main className="min-h-screen bg-white p-6 text-black dark:bg-black dark:text-white">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-500">
            Lỗi tải danh sách bài giảng: {error.message}
          </div>
        </div>
      </main>
    )
  }

  const lessons: LessonRow[] = ((data as RawLessonRow[]) || []).map((item) => {
    const topic = Array.isArray(item.topics) ? item.topics[0] || null : item.topics

    return {
      id: item.id,
      title: item.title,
      lesson_no: item.lesson_no,
      sort_order: item.sort_order,
      is_published: item.is_published,
      topics: topic
        ? {
            title: topic.title,
            slug: topic.slug,
          }
        : null,
    }
  })

  return (
    <main className="min-h-screen bg-white p-6 text-black dark:bg-black dark:text-white">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Admin bài giảng</h1>
            <p className="mt-2 text-black/60 dark:text-white/60">
              Quản lý danh sách bài học theo chủ đề.
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
              href="/admin/lessons/new"
              className="rounded-xl bg-black px-4 py-2 text-white dark:bg-white dark:text-black"
            >
              + Tạo bài giảng
            </Link>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-black/10 dark:border-white/20">
          <table className="w-full text-sm">
            <thead className="bg-black/5 dark:bg-white/5">
              <tr>
                <th className="p-3 text-left">Bài</th>
                <th className="p-3 text-left">Tiêu đề</th>
                <th className="p-3 text-left">Chủ đề</th>
                <th className="p-3 text-left">Thứ tự</th>
                <th className="p-3 text-left">Trạng thái</th>
                <th className="p-3 text-left">Thao tác</th>
              </tr>
            </thead>

            <tbody>
              {lessons.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-black/60 dark:text-white/60">
                    Chưa có bài giảng nào.
                  </td>
                </tr>
              ) : (
                lessons.map((lesson) => (
                  <tr key={lesson.id} className="border-t border-black/10 dark:border-white/10">
                    <td className="p-3">{lesson.lesson_no ?? '-'}</td>
                    <td className="p-3 font-medium">{lesson.title}</td>
                    <td className="p-3">{lesson.topics?.title || 'Chưa gán chủ đề'}</td>
                    <td className="p-3">{lesson.sort_order ?? 0}</td>
                    <td className="p-3">{lesson.is_published ? 'Hiện' : 'Ẩn'}</td>
                    <td className="p-3">
                      <Link
                        href={`/admin/lessons/${lesson.id}`}
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