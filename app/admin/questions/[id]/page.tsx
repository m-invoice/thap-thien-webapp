'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'

type Topic = {
  id: string
  title: string
  slug: string
}

type Lesson = {
  id: string
  title: string
  topic_id: string
}

type QuestionDetail = {
  id: string
  topic_id: string
  lesson_id: string | null
  question: string
  option_a: string
  option_b: string
  option_c: string | null
  option_d: string | null
  correct_options: string[]
  explanation: string | null
  sort_order: number | null
  is_published: boolean | null
}

type FormState = {
  topic_id: string
  lesson_id: string
  question: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_options: string[]
  explanation: string
  sort_order: string
  is_published: boolean
}

export default function EditQuestionPage() {
  const router = useRouter()
  const params = useParams()
  const id = String(params.id || '')

  const [topics, setTopics] = useState<Topic[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [form, setForm] = useState<FormState>({
    topic_id: '',
    lesson_id: '',
    question: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_options: [],
    explanation: '',
    sort_order: '0',
    is_published: true,
  })

  useEffect(() => {
    let mounted = true

    async function loadData() {
      try {
        setLoading(true)
        setError('')

        const [topicsRes, lessonsRes, questionRes] = await Promise.all([
          fetch('/api/admin/topics', { cache: 'no-store' }),
          fetch('/api/admin/lessons', { cache: 'no-store' }),
          fetch(`/api/admin/questions/${id}`, { cache: 'no-store' }),
        ])

        const topicsJson = await topicsRes.json()
        const lessonsJson = await lessonsRes.json()
        const questionJson = await questionRes.json()

        if (!topicsRes.ok) throw new Error(topicsJson?.error || 'Không tải được chủ đề')
        if (!lessonsRes.ok) throw new Error(lessonsJson?.error || 'Không tải được bài giảng')
        if (!questionRes.ok) throw new Error(questionJson?.error || 'Không tải được câu hỏi')

        const topicList: Topic[] = Array.isArray(topicsJson?.data) ? topicsJson.data : []
        const lessonList: Lesson[] = Array.isArray(lessonsJson?.data)
          ? lessonsJson.data.map((item: any) => ({
              id: item.id,
              title: item.title,
              topic_id: item.topic_id,
            }))
          : []

        const question: QuestionDetail | null = questionJson?.data || null
        if (!question) throw new Error('Không tìm thấy câu hỏi')

        if (mounted) {
          setTopics(topicList)
          setLessons(lessonList)
          setForm({
            topic_id: question.topic_id,
            lesson_id: question.lesson_id || '',
            question: question.question || '',
            option_a: question.option_a || '',
            option_b: question.option_b || '',
            option_c: question.option_c || '',
            option_d: question.option_d || '',
            correct_options: Array.isArray(question.correct_options) ? question.correct_options : [],
            explanation: question.explanation || '',
            sort_order: question.sort_order != null ? String(question.sort_order) : '0',
            is_published: Boolean(question.is_published),
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

    if (id) loadData()

    return () => {
      mounted = false
    }
  }, [id])

  const filteredLessons = lessons.filter((lesson) => lesson.topic_id === form.topic_id)

  function toggleCorrectOption(value: string) {
    setForm((prev) => {
      const exists = prev.correct_options.includes(value)
      return {
        ...prev,
        correct_options: exists
          ? prev.correct_options.filter((x) => x !== value)
          : [...prev.correct_options, value].sort(),
      }
    })
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    try {
      setSaving(true)
      setError('')
      setSuccess('')

      if (!form.topic_id) throw new Error('Vui lòng chọn chủ đề')
      if (!form.question.trim()) throw new Error('Vui lòng nhập nội dung câu hỏi')
      if (!form.option_a.trim() || !form.option_b.trim()) {
        throw new Error('Ít nhất phải có đáp án A và B')
      }
      if (form.correct_options.length === 0) {
        throw new Error('Vui lòng chọn ít nhất 1 đáp án đúng')
      }

      const payload = {
        topic_id: form.topic_id,
        lesson_id: form.lesson_id || null,
        question: form.question.trim(),
        option_a: form.option_a.trim(),
        option_b: form.option_b.trim(),
        option_c: form.option_c.trim() || null,
        option_d: form.option_d.trim() || null,
        correct_options: form.correct_options,
        explanation: form.explanation.trim() || null,
        sort_order: Number(form.sort_order || 0),
        is_published: form.is_published,
      }

      const res = await fetch(`/api/admin/questions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json?.error || 'Cập nhật câu hỏi thất bại')
      }

      setSuccess('Đã cập nhật câu hỏi thành công')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi cập nhật')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm('Anh chắc chắn muốn xóa câu hỏi này?')
    if (!confirmed) return

    try {
      setDeleting(true)
      setError('')
      setSuccess('')

      const res = await fetch(`/api/admin/questions/${id}`, {
        method: 'DELETE',
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json?.error || 'Xóa câu hỏi thất bại')
      }

      router.push('/admin/questions')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi xóa câu hỏi')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-white p-6 text-black dark:bg-black dark:text-white">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-2xl border border-black/10 p-6 dark:border-white/20">
            Đang tải dữ liệu câu hỏi...
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
            <h1 className="text-3xl font-bold">Sửa câu hỏi</h1>
            <p className="mt-2 text-black/60 dark:text-white/60">
              Cập nhật nội dung câu hỏi và đáp án.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/questions"
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
              {deleting ? 'Đang xóa...' : 'Xóa câu hỏi'}
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
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Chủ đề</label>
              <select
                value={form.topic_id}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    topic_id: e.target.value,
                    lesson_id: '',
                  }))
                }
                className="w-full rounded-xl border border-black/10 bg-transparent px-4 py-3 dark:border-white/20"
              >
                <option value="">Chọn chủ đề</option>
                {topics.map((topic) => (
                  <option key={topic.id} value={topic.id}>
                    {topic.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Bài giảng</label>
              <select
                value={form.lesson_id}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    lesson_id: e.target.value,
                  }))
                }
                className="w-full rounded-xl border border-black/10 bg-transparent px-4 py-3 dark:border-white/20"
              >
                <option value="">Không gắn bài cụ thể</option>
                {filteredLessons.map((lesson) => (
                  <option key={lesson.id} value={lesson.id}>
                    {lesson.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Nội dung câu hỏi</label>
            <textarea
              value={form.question}
              onChange={(e) => setForm((prev) => ({ ...prev, question: e.target.value }))}
              rows={4}
              className="w-full rounded-xl border border-black/10 bg-transparent px-4 py-3 dark:border-white/20"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <input
              value={form.option_a}
              onChange={(e) => setForm((prev) => ({ ...prev, option_a: e.target.value }))}
              placeholder="Đáp án A"
              className="w-full rounded-xl border border-black/10 bg-transparent px-4 py-3 dark:border-white/20"
            />
            <input
              value={form.option_b}
              onChange={(e) => setForm((prev) => ({ ...prev, option_b: e.target.value }))}
              placeholder="Đáp án B"
              className="w-full rounded-xl border border-black/10 bg-transparent px-4 py-3 dark:border-white/20"
            />
            <input
              value={form.option_c}
              onChange={(e) => setForm((prev) => ({ ...prev, option_c: e.target.value }))}
              placeholder="Đáp án C"
              className="w-full rounded-xl border border-black/10 bg-transparent px-4 py-3 dark:border-white/20"
            />
            <input
              value={form.option_d}
              onChange={(e) => setForm((prev) => ({ ...prev, option_d: e.target.value }))}
              placeholder="Đáp án D"
              className="w-full rounded-xl border border-black/10 bg-transparent px-4 py-3 dark:border-white/20"
            />
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium">Chọn đáp án đúng</label>
            <div className="flex flex-wrap gap-4">
              {['A', 'B', 'C', 'D'].map((key) => (
                <label key={key} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.correct_options.includes(key)}
                    onChange={() => toggleCorrectOption(key)}
                  />
                  {key}
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Giải thích</label>
            <textarea
              value={form.explanation}
              onChange={(e) => setForm((prev) => ({ ...prev, explanation: e.target.value }))}
              rows={5}
              className="w-full rounded-xl border border-black/10 bg-transparent px-4 py-3 dark:border-white/20"
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Thứ tự hiển thị</label>
              <input
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm((prev) => ({ ...prev, sort_order: e.target.value }))}
                className="w-full rounded-xl border border-black/10 bg-transparent px-4 py-3 dark:border-white/20"
              />
            </div>

            <div className="flex items-center gap-3 pt-8">
              <input
                id="is_published"
                type="checkbox"
                checked={form.is_published}
                onChange={(e) => setForm((prev) => ({ ...prev, is_published: e.target.checked }))}
              />
              <label htmlFor="is_published" className="text-sm font-medium">
                Hiển thị câu hỏi
              </label>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-black px-5 py-3 text-white disabled:opacity-60 dark:bg-white dark:text-black"
            >
              {saving ? 'Đang lưu...' : 'Cập nhật câu hỏi'}
            </button>

            <Link
              href="/admin/questions"
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