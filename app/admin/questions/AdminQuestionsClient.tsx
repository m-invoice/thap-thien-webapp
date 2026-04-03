'use client'

import { useEffect, useMemo, useState } from 'react'

type Topic = {
  id: string
  title: string
  slug: string
}

type QuestionRow = {
  id: string
  topic_id: string
  question: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_options: string[]
  explanation?: string | null
  sort_order: number
  is_published: boolean
  topics?: {
    id: string
    title: string
    slug: string
  } | null
}

type FormState = {
  topic_id: string
  question: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_options: string[]
  explanation: string
  sort_order: number
  is_published: boolean
}

const emptyForm: FormState = {
  topic_id: '',
  question: '',
  option_a: '',
  option_b: '',
  option_c: '',
  option_d: '',
  correct_options: [],
  explanation: '',
  sort_order: 0,
  is_published: true,
}

function normalizeOptions(options: string[]) {
  return [...new Set(options.map((x) => x.trim().toUpperCase()))].sort()
}

export default function AdminQuestionsClientPage() {
  const [topics, setTopics] = useState<Topic[]>([])
  const [questions, setQuestions] = useState<QuestionRow[]>([])
  const [selectedTopicId, setSelectedTopicId] = useState('')
  const [form, setForm] = useState<FormState>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [topicError, setTopicError] = useState('')

  const pageTitle = useMemo(
    () => (editingId ? 'Sửa câu hỏi' : 'Thêm câu hỏi mới'),
    [editingId]
  )

  const fetchTopics = async () => {
    const res = await fetch('/api/admin/topics')
    const data = await res.json()

    if (res.ok) {
      setTopics(data.data || [])
      setTopicError('')
    } else {
      setTopics([])
      setTopicError(data.error || 'Không tải được chủ đề')
    }
  }

  const fetchQuestions = async (topicId?: string) => {
    const url = topicId
      ? `/api/admin/questions?topic_id=${topicId}`
      : '/api/admin/questions'

    const res = await fetch(url)
    const data = await res.json()

    if (res.ok) {
      setQuestions(data.data || [])
    } else {
      setMessage(data.error || 'Không tải được câu hỏi')
    }
  }

  useEffect(() => {
    fetchTopics()
    fetchQuestions()
  }, [])

  const handleChange = (
    key: keyof FormState,
    value: string | number | boolean | string[]
  ) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const handleToggleCorrectOption = (option: 'A' | 'B' | 'C' | 'D') => {
    setForm((prev) => {
      const exists = prev.correct_options.includes(option)
      const next = exists
        ? prev.correct_options.filter((x) => x !== option)
        : [...prev.correct_options, option]

      return {
        ...prev,
        correct_options: normalizeOptions(next),
      }
    })
  }

  const resetForm = () => {
    setForm(emptyForm)
    setEditingId(null)
    setMessage('')
  }

  const handleEdit = (item: QuestionRow) => {
    setEditingId(item.id)
    setForm({
      topic_id: item.topic_id,
      question: item.question,
      option_a: item.option_a,
      option_b: item.option_b,
      option_c: item.option_c,
      option_d: item.option_d,
      correct_options: normalizeOptions(item.correct_options || []),
      explanation: item.explanation || '',
      sort_order: item.sort_order || 0,
      is_published: item.is_published,
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id: string) => {
    const ok = window.confirm('Anh có chắc muốn xóa câu hỏi này không?')
    if (!ok) return

    setLoading(true)
    setMessage('')

    try {
      const res = await fetch(`/api/admin/questions/${id}`, {
        method: 'DELETE',
      })

      const data = await res.json()

      if (!res.ok) {
        setMessage(data.error || 'Xóa thất bại')
      } else {
        setMessage('Đã xóa câu hỏi')
        await fetchQuestions(selectedTopicId)
      }
    } catch {
      setMessage('Có lỗi khi xóa câu hỏi')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    // Validation
    if (!form.topic_id) {
      setMessage('Vui lòng chọn chủ đề')
      return
    }

    if (!form.question.trim()) {
      setMessage('Vui lòng nhập câu hỏi')
      return
    }

    if (!form.option_a.trim() || !form.option_b.trim() || !form.option_c.trim() || !form.option_d.trim()) {
      setMessage('Vui lòng nhập đầy đủ 4 đáp án')
      return
    }

    if (form.correct_options.length === 0) {
      setMessage('Vui lòng chọn ít nhất 1 đáp án đúng')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const method = editingId ? 'PUT' : 'POST'
      const url = editingId
        ? `/api/admin/questions/${editingId}`
        : '/api/admin/questions'

      const payload = {
        ...form,
        correct_options: normalizeOptions(form.correct_options),
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        setMessage(data.error || 'Lưu thất bại')
      } else {
        setMessage(editingId ? 'Đã cập nhật câu hỏi' : 'Đã thêm câu hỏi')
        resetForm()
        await fetchQuestions(selectedTopicId)
      }
    } catch {
      setMessage('Có lỗi khi lưu câu hỏi')
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = async (topicId: string) => {
    setSelectedTopicId(topicId)
    await fetchQuestions(topicId)
  }

  const isFormValid = useMemo(() => {
    return (
      form.topic_id &&
      form.question.trim() &&
      form.option_a.trim() &&
      form.option_b.trim() &&
      form.option_c.trim() &&
      form.option_d.trim() &&
      form.correct_options.length > 0
    )
  }, [form])

  return (
    <main className="min-h-screen bg-white text-black dark:bg-black dark:text-white transition-colors p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Admin quản lý câu hỏi</h1>
            <p className="text-black/60 dark:text-white/60 mt-2">
              Thêm, sửa, xóa câu hỏi và chọn nhiều đáp án đúng.
            </p>
          </div>

          <div className="flex gap-3">
            <a
              href="/admin/import"
              className="inline-block px-4 py-2 border border-black/10 dark:border-white/20 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
            >
              Import Excel
            </a>
            <a
              href="/dashboard"
              className="inline-block px-4 py-2 border border-black/10 dark:border-white/20 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
            >
              Dashboard
            </a>
          </div>
        </div>

        <div className="grid xl:grid-cols-[420px_1fr] gap-6">
          <div className="border border-black/10 dark:border-white/20 rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-4">{pageTitle}</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-black/70 dark:text-white/70 mb-2">
                  Chủ đề
                </label>
                <select
                  value={form.topic_id}
                  onChange={(e) => handleChange('topic_id', e.target.value)}
                  className="w-full bg-transparent border border-black/10 dark:border-white/20 rounded-lg p-3"
                >
                  <option value="">Chọn chủ đề</option>
                  {topics.length === 0 ? (
                    <option value="" disabled>
                      {topicError || 'Không có chủ đề'}
                    </option>
                  ) : (
                    topics.map((topic) => (
                      <option key={topic.id} value={topic.id} className="text-black">
                        {topic.title}
                      </option>
                    ))
                  )}
                </select>

                {topicError && (
                  <p className="text-sm text-red-500 mt-2">{topicError}</p>
                )}
              </div>

              <div>
                <label className="block text-sm text-black/70 dark:text-white/70 mb-2">
                  Câu hỏi
                </label>
                <textarea
                  value={form.question}
                  onChange={(e) => handleChange('question', e.target.value)}
                  className="w-full bg-transparent border border-black/10 dark:border-white/20 rounded-lg p-3 min-h-[100px]"
                />
              </div>

              <div>
                <label className="block text-sm text-black/70 dark:text-white/70 mb-2">
                  Đáp án A
                </label>
                <input
                  value={form.option_a}
                  onChange={(e) => handleChange('option_a', e.target.value)}
                  className="w-full bg-transparent border border-black/10 dark:border-white/20 rounded-lg p-3"
                />
              </div>

              <div>
                <label className="block text-sm text-black/70 dark:text-white/70 mb-2">
                  Đáp án B
                </label>
                <input
                  value={form.option_b}
                  onChange={(e) => handleChange('option_b', e.target.value)}
                  className="w-full bg-transparent border border-black/10 dark:border-white/20 rounded-lg p-3"
                />
              </div>

              <div>
                <label className="block text-sm text-black/70 dark:text-white/70 mb-2">
                  Đáp án C
                </label>
                <input
                  value={form.option_c}
                  onChange={(e) => handleChange('option_c', e.target.value)}
                  className="w-full bg-transparent border border-black/10 dark:border-white/20 rounded-lg p-3"
                />
              </div>

              <div>
                <label className="block text-sm text-black/70 dark:text-white/70 mb-2">
                  Đáp án D
                </label>
                <input
                  value={form.option_d}
                  onChange={(e) => handleChange('option_d', e.target.value)}
                  className="w-full bg-transparent border border-black/10 dark:border-white/20 rounded-lg p-3"
                />
              </div>

              <div>
                <label className="block text-sm text-black/70 dark:text-white/70 mb-3">
                  Đáp án đúng (có thể chọn nhiều)
                </label>

                <div className="grid grid-cols-2 gap-3">
                  {(['A', 'B', 'C', 'D'] as const).map((option) => (
                    <label
                      key={option}
                      className="flex items-center gap-3 border border-black/10 dark:border-white/20 rounded-lg p-3"
                    >
                      <input
                        type="checkbox"
                        checked={form.correct_options.includes(option)}
                        onChange={() => handleToggleCorrectOption(option)}
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>

                <div className="mt-2 text-sm text-black/50 dark:text-white/50">
                  Đang chọn: {form.correct_options.join(', ') || 'Chưa chọn'}
                </div>
              </div>

              <div>
                <label className="block text-sm text-black/70 dark:text-white/70 mb-2">
                  Thứ tự
                </label>
                <input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => handleChange('sort_order', Number(e.target.value))}
                  className="w-full bg-transparent border border-black/10 dark:border-white/20 rounded-lg p-3"
                />
              </div>

              <div>
                <label className="block text-sm text-black/70 dark:text-white/70 mb-2">
                  Giải thích
                </label>
                <textarea
                  value={form.explanation}
                  onChange={(e) => handleChange('explanation', e.target.value)}
                  className="w-full bg-transparent border border-black/10 dark:border-white/20 rounded-lg p-3 min-h-[100px]"
                />
              </div>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={form.is_published}
                  onChange={(e) => handleChange('is_published', e.target.checked)}
                />
                <span>Hiển thị công khai</span>
              </label>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSubmit}
                  disabled={loading || !isFormValid}
                  className="px-5 py-3 bg-black text-white dark:bg-white dark:text-black rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading
                    ? 'Đang xử lý...'
                    : editingId
                    ? 'Cập nhật câu hỏi'
                    : 'Thêm câu hỏi'}
                </button>

                <button
                  onClick={resetForm}
                  type="button"
                  className="px-5 py-3 border border-black/10 dark:border-white/20 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
                >
                  Làm mới
                </button>
              </div>

              {message && (
                <div className={`text-sm pt-2 ${message.includes('Đã') ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                  {message}
                </div>
              )}
            </div>
          </div>

          <div className="border border-black/10 dark:border-white/20 rounded-2xl p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <h2 className="text-xl font-semibold">
                Danh sách câu hỏi ({questions.length})
              </h2>

              <select
                value={selectedTopicId}
                onChange={(e) => handleFilterChange(e.target.value)}
                className="bg-transparent border border-black/10 dark:border-white/20 rounded-lg p-3"
              >
                <option value="">Tất cả chủ đề</option>
                {topics.map((topic) => (
                  <option key={topic.id} value={topic.id} className="text-black">
                    {topic.title}
                  </option>
                ))}
              </select>
            </div>

            {questions.length === 0 ? (
              <div className="text-black/60 dark:text-white/60">Chưa có câu hỏi nào.</div>
            ) : (
              <div className="space-y-4">
                {questions.map((item) => (
                  <div
                    key={item.id}
                    className="border border-black/10 dark:border-white/10 rounded-xl p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="text-sm text-black/50 dark:text-white/50 mb-2">
                          {item.topics?.title || 'Không rõ chủ đề'} · Thứ tự:{' '}
                          {item.sort_order || 0} ·{' '}
                          {item.is_published ? 'Hiển thị' : 'Ẩn'}
                        </div>

                        <div className="font-semibold mb-3">{item.question}</div>

                        <div className="space-y-1 text-sm text-black/75 dark:text-white/75">
                          <div>A. {item.option_a}</div>
                          <div>B. {item.option_b}</div>
                          <div>C. {item.option_c}</div>
                          <div>D. {item.option_d}</div>
                        </div>

                        <div className="mt-3 text-green-600 dark:text-green-400 text-sm">
                          Đáp án đúng: {(item.correct_options || []).join(', ')}
                        </div>

                        {item.explanation && (
                          <div className="mt-2 text-black/60 dark:text-white/60 text-sm">
                            Giải thích: {item.explanation}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="px-4 py-2 border border-black/10 dark:border-white/20 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
                        >
                          Sửa
                        </button>

                        <button
                          onClick={() => handleDelete(item.id)}
                          className="px-4 py-2 border border-red-400/30 text-red-500 dark:text-red-300 rounded-lg hover:bg-red-500/10"
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}