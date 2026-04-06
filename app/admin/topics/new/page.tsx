'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

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

export default function NewTopicPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [form, setForm] = useState<FormState>({
    title: '',
    slug: '',
    description: '',
    sort_order: '0',
    is_published: true,
  })

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

      const payload = {
        title: form.title.trim(),
        slug: form.slug.trim() || autoSlug,
        description: form.description.trim() || null,
        sort_order: Number(form.sort_order || 0),
        is_published: form.is_published,
      }

      const res = await fetch('/api/admin/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json?.error || 'Tạo chủ đề thất bại')
      }

      setSuccess('Đã tạo chủ đề thành công')
      router.push('/admin/topics')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi lưu chủ đề')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="min-h-screen bg-white p-6 text-black dark:bg-black dark:text-white">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Tạo chủ đề</h1>
            <p className="mt-2 text-black/60 dark:text-white/60">
              Thêm chủ đề mới cho app học tập.
            </p>
          </div>

          <Link
            href="/admin/topics"
            className="rounded-xl border border-black/10 px-4 py-2 hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/5"
          >
            ← Về danh sách
          </Link>
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
              placeholder="Ví dụ: Không sát sinh"
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
                placeholder="khong-sat-sinh"
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
                placeholder="0"
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
              rows={5}
              placeholder="Nhập mô tả ngắn cho chủ đề"
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
              Hiển thị ngay
            </label>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-black px-5 py-3 text-white disabled:opacity-60 dark:bg-white dark:text-black"
            >
              {saving ? 'Đang lưu...' : 'Lưu chủ đề'}
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