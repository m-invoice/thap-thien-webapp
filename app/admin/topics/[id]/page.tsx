'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'

type TopicDetail = {
  id: string
  title: string
  slug: string
  description: string | null
  sort_order: number | null
  is_published: boolean | null
}

type FormState = {
  title: string
  slug: string
  description: string
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

async function parseJsonSafe(res: Response) {
  const text = await res.text()
  if (!text) return null

  try {
    return JSON.parse(text)
  } catch {
    throw new Error(`API không trả về JSON hợp lệ. Status: ${res.status}`)
  }
}

export default function EditTopicPage() {
  const router = useRouter()
  const params = useParams()
  const id = String(params.id || '')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [form, setForm] = useState<FormState>({
    title: '',
    slug: '',
    description: '',
    sort_order: '0',
    is_published: true,
  })

  useEffect(() => {
    let mounted = true

    async function loadTopic() {
      try {
        setLoading(true)
        setError('')

        const res = await fetch(`/api/admin/topics/${id}`, {
          method: 'GET',
          cache: 'no-store',
        })

        const json = await parseJsonSafe(res)

        if (!res.ok) {
          throw new Error(json?.error || `Không tải được dữ liệu chủ đề (HTTP ${res.status})`)
        }

        const topic: TopicDetail | null = json?.data || null

        if (!topic) {
          throw new Error('Không tìm thấy chủ đề')
        }

        if (mounted) {
          setForm({
            title: topic.title || '',
            slug: topic.slug || '',
            description: topic.description || '',
            sort_order: topic.sort_order != null ? String(topic.sort_order) : '0',
            is_published: Boolean(topic.is_published),
          })
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi tải dữ liệu')
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    if (id) {
      loadTopic()
    }

    return () => {
      mounted = false
    }
  }, [id])

  const autoSlug = useMemo(() => slugify(form.title), [form.title])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    try {
      setSaving(true)
      setError('')
      setSuccess('')

      if (!form.title.trim()) {
        throw new Error('Vui lòng nhập tên chủ đề')
      }

      const finalSlug = form.slug.trim() || autoSlug

      if (!finalSlug) {
        throw new Error('Slug không hợp lệ')
      }

      const payload = {
        title: form.title.trim(),
        slug: finalSlug,
        description: form.description.trim() || null,
        sort_order: Number(form.sort_order || 0),
        is_published: form.is_published,
      }

      const res = await fetch(`/api/admin/topics/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const json = await parseJsonSafe(res)

      if (!res.ok) {
        throw new Error(json?.error || `Cập nhật chủ đề thất bại (HTTP ${res.status})`)
      }

      setSuccess('Đã cập nhật chủ đề thành công')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi cập nhật chủ đề')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      'Anh chắc chắn muốn xóa chủ đề này? Nếu có bài học hoặc câu hỏi liên quan thì cần kiểm tra ràng buộc dữ liệu trước.'
    )

    if (!confirmed) return

    try {
      setDeleting(true)
      setError('')
      setSuccess('')

      const res = await fetch(`/api/admin/topics/${id}`, {
        method: 'DELETE',
      })

      const json = await parseJsonSafe(res)

      if (!res.ok) {
        throw new Error(json?.error || `Xóa chủ đề thất bại (HTTP ${res.status})`)
      }

      router.push('/admin/topics')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi xóa chủ đề')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-white p-6 text-black dark:bg-black dark:text-white">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-2xl border border-black/10 p-6 dark:border-white/20">
            Đang tải dữ liệu chủ đề...
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-white p-6 text-black dark:bg-black dark:text-white">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Sửa chủ đề</h1>
            <p className="mt-2 text-black/60 dark:text-white/60">
              Cập nhật thông tin và thứ tự hiển thị chủ đề.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/topics"
              className="rounded-xl border border-black/10 px-4 py-2 hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/5"
            >
              ← Về danh sách
            </Link>

            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-red-500 disabled:opacity-60"
            >
              {deleting ? 'Đang xóa...' : 'Xóa chủ đề'}
            </button>
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
          <div className="space-y-2">
            <label className="text-sm font-medium">Tên chủ đề</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  title: e.target.value,
                }))
              }
              className="w-full rounded-xl border border-black/10 bg-transparent px-4 py-3 dark:border-white/20"
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
                className="w-full rounded-xl border border-black/10 bg-transparent px-4 py-3 dark:border-white/20"
              />
              <p className="text-xs text-black/50 dark:text-white/50">
                Gợi ý: {autoSlug || 'slug-se-duoc-tao-tu-ten-chu-de'}
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
                className="w-full rounded-xl border border-black/10 bg-transparent px-4 py-3 dark:border-white/20"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Mô tả</label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              rows={6}
              className="w-full rounded-xl border border-black/10 bg-transparent px-4 py-3 dark:border-white/20"
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
            />
            <label htmlFor="is_published" className="text-sm font-medium">
              Hiển thị chủ đề
            </label>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-white px-5 py-3 text-black disabled:opacity-60 dark:bg-white dark:text-black"
            >
              {saving ? 'Đang lưu...' : 'Cập nhật chủ đề'}
            </button>

            <Link
              href="/admin/topics"
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