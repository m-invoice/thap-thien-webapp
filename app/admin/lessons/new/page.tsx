'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type Topic = {
  id: string
  title: string
  slug: string
}

type FormState = {
  topic_id: string
  title: string
  slug: string
  lesson_no: string
  summary: string
  content: string
  sort_order: string
  is_published: boolean
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export default function NewLessonPage() {
  const router = useRouter()

  const [topics, setTopics] = useState<Topic[]>([])
  const [loadingTopics, setLoadingTopics] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [form, setForm] = useState<FormState>({
    topic_id: '',
    title: '',
    slug: '',
    lesson_no: '',
    summary: '',
    content: '',
    sort_order: '0',
    is_published: true,
  })

  useEffect(() => {
    let mounted = true

    async function loadTopics() {
      try {
        setLoadingTopics(true)
        setError('')

        const res = await fetch('/api/admin/topics', {
          method: 'GET',
          cache: 'no-store',
        })

        const json = await res.json()

        if (!res.ok) {
          throw new Error(json?.error || 'Không tải được danh sách chủ đề')
        }

        const list: Topic[] = Array.isArray(json?.data) ? json.data : []

        if (mounted) {
          setTopics(list)
          if (!form.topic_id && list.length > 0) {
            setForm((prev) => ({
              ...prev,
              topic_id: list[0].id,
            }))
          }
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi tải chủ đề')
        }
      } finally {
        if (mounted) {
          setLoadingTopics(false)
        }
      }
    }

    loadTopics()

    return () => {
      mounted = false
    }
  }, [])

  const autoSlug = useMemo(() => slugify(form.title), [form.title])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      if (!form.topic_id) {
        throw new Error('Vui lòng chọn chủ đề')
      }

      if (!form.title.trim()) {
        throw new Error('Vui lòng nhập tiêu đề bài giảng')
      }

      const payload = {
        topic_id: form.topic_id,
        title: form.title.trim(),
        slug: (form.slug.trim() || autoSlug || null),
        lesson_no: form.lesson_no ? Number(form.lesson_no) : null,
        summary: form.summary.trim() || null,
        content: form.content.trim() || null,
        sort_order: form.sort_order ? Number(form.sort_order) : 0,
        is_published: form.is_published,
      }

      const res = await fetch('/api/admin/lessons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json?.error || 'Tạo bài giảng thất bại')
      }

      setSuccess('Đã tạo bài giảng thành công')
      router.push('/admin/lessons')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi lưu bài giảng')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="min-h-screen bg-white p-6 text-black dark:bg-black dark:text-white">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Tạo bài giảng</h1>
            <p className="mt-2 text-black/60 dark:text-white/60">
              Thêm bài học mới cho app Thập Thiện Nghiệp Đạo Kinh.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/lessons"
              className="rounded-xl border border-black/10 px-4 py-2 hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/5"
            >
              ← Về danh sách
            </Link>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-500">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-2xl border border-green-500/30 bg-green-500/10 p-4 text-green-600 dark:text-green-400">
            {success}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-2xl border border-black/10 p-6 dark:border-white/20"
        >
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Chủ đề</label>
              <select
                value={form.topic_id}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    topic_id: e.target.value,
                  }))
                }
                disabled={loadingTopics}
                className="w-full rounded-xl border border-black/10 bg-transparent px-4 py-3 outline-none focus:ring-2 focus:ring-sky-500 dark:border-white/20"
              >
                {loadingTopics ? (
                  <option value="">Đang tải chủ đề...</option>
                ) : topics.length === 0 ? (
                  <option value="">Chưa có chủ đề</option>
                ) : (
                  topics.map((topic) => (
                    <option key={topic.id} value={topic.id}>
                      {topic.title}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Số bài</label>
              <input
                type="number"
                value={form.lesson_no}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    lesson_no: e.target.value,
                  }))
                }
                placeholder="Ví dụ: 1"
                className="w-full rounded-xl border border-black/10 bg-transparent px-4 py-3 outline-none focus:ring-2 focus:ring-sky-500 dark:border-white/20"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Tiêu đề bài giảng</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  title: e.target.value,
                  slug: prev.slug ? prev.slug : slugify(e.target.value),
                }))
              }
              placeholder="Nhập tiêu đề bài giảng"
              className="w-full rounded-xl border border-black/10 bg-transparent px-4 py-3 outline-none focus:ring-2 focus:ring-sky-500 dark:border-white/20"
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Slug</label>
              <input
                type="text"
                value={form.slug}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    slug: slugify(e.target.value),
                  }))
                }
                placeholder="tu-dong-hoac-tu-nhap"
                className="w-full rounded-xl border border-black/10 bg-transparent px-4 py-3 outline-none focus:ring-2 focus:ring-sky-500 dark:border-white/20"
              />
              <p className="text-xs text-black/50 dark:text-white/50">
                Gợi ý: {autoSlug || 'slug-se-duoc-tao-tu-tieu-de'}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Thứ tự hiển thị</label>
              <input
                type="number"
                value={form.sort_order}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    sort_order: e.target.value,
                  }))
                }
                placeholder="0"
                className="w-full rounded-xl border border-black/10 bg-transparent px-4 py-3 outline-none focus:ring-2 focus:ring-sky-500 dark:border-white/20"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Tóm tắt ngắn</label>
            <textarea
              value={form.summary}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  summary: e.target.value,
                }))
              }
              rows={4}
              placeholder="Nhập tóm tắt nội dung bài học"
              className="w-full rounded-xl border border-black/10 bg-transparent px-4 py-3 outline-none focus:ring-2 focus:ring-sky-500 dark:border-white/20"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Nội dung bài giảng</label>
            <textarea
              value={form.content}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  content: e.target.value,
                }))
              }
              rows={12}
              placeholder="Nhập nội dung chi tiết bài giảng..."
              className="w-full rounded-xl border border-black/10 bg-transparent px-4 py-3 outline-none focus:ring-2 focus:ring-sky-500 dark:border-white/20"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              id="is_published"
              type="checkbox"
              checked={form.is_published}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  is_published: e.target.checked,
                }))
              }
              className="h-4 w-4"
            />
            <label htmlFor="is_published" className="text-sm font-medium">
              Hiển thị ngay sau khi lưu
            </label>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="submit"
              disabled={saving || loadingTopics || topics.length === 0}
              className="rounded-xl bg-black px-5 py-3 text-white disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-black"
            >
              {saving ? 'Đang lưu...' : 'Lưu bài giảng'}
            </button>

            <Link
              href="/admin/lessons"
              className="rounded-xl border border-black/10 px-5 py-3 hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/5"
            >
              Hủy
            </Link>
          </div>
        </form>
      </div>
    </main>
  )
}