'use client'

import { useEffect, useState } from 'react'

type Question = {
  id: string
  question: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_options?: string[] | null
  explanation?: string | null
}

function normalizeOptions(options: string[] | null | undefined) {
  return [...new Set((options || []).map((x) => String(x).trim().toUpperCase()))].sort()
}

function isSameAnswer(selected: string[], correct: string[]) {
  const a = normalizeOptions(selected)
  const b = normalizeOptions(correct)
  return JSON.stringify(a) === JSON.stringify(b)
}

export default function QuizForm({
  topicTitle,
  topicSlug,
  questions = [],
}: {
  topicTitle: string
  topicSlug: string
  questions?: Question[]
}) {
  const [answers, setAnswers] = useState<Record<string, string[]>>({})
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const [timeLeft, setTimeLeft] = useState(15 * 60) // 15 phút

  const safeQuestions = Array.isArray(questions) ? questions : []
  const totalQuestions = safeQuestions.length
  const answeredCount = Object.values(answers).filter((ans) => ans.length > 0).length

  const activeQuestion = safeQuestions[activeIndex]

  const formatTime = (totalSeconds: number) => {
    const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0')
    const seconds = String(totalSeconds % 60).padStart(2, '0')
    return `${minutes}:${seconds}`
  }

  useEffect(() => {
    if (timeLeft <= 0) {
      if (!saving) {
        handleSubmit()
      }
      return
    }

    const timer = setInterval(() => setTimeLeft((t) => Math.max(t - 1, 0)), 1000)
    return () => clearInterval(timer)
  }, [timeLeft, saving])

  const handleToggleOption = (questionId: string, option: string) => {
    setAnswers((prev) => {
      const current = prev[questionId] || []
      const exists = current.includes(option)
      return {
        ...prev,
        [questionId]: exists
          ? current.filter((x) => x !== option)
          : [...current, option].sort(),
      }
    })
  }

  const handleSubmit = async () => {
    if (answeredCount < totalQuestions) {
      setSaveMessage('Vui lòng trả lời hết các câu trước khi nộp bài.')
      return
    }

    setSaving(true)
    setSaveMessage('')

    const score = safeQuestions.reduce((total, q) => {
      const selected = answers[q.id] || []
      const correct = normalizeOptions(q.correct_options)
      return total + (isSameAnswer(selected, correct) ? 1 : 0)
    }, 0)

    try {
      const res = await fetch('/api/save-attempt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicSlug,
          score,
          total: totalQuestions,
          answers,
          questions: safeQuestions,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setSaveMessage(data.error || 'Lưu kết quả thất bại')
        setSaving(false)
        return
      }

      if (data.attemptId) {
        window.location.href = `/result?id=${data.attemptId}`
        return
      }

      setSaveMessage('Lưu xong nhưng không lấy được mã kết quả')
    } catch {
      setSaveMessage('Có lỗi khi gọi API lưu kết quả')
    } finally {
      setSaving(false)
    }
  }

  if (safeQuestions.length === 0) {
    return (
      <div className="border border-black/10 dark:border-white/20 rounded-2xl p-6">
        Chưa có câu hỏi cho chủ đề {topicTitle}.
      </div>
    )
  }

  return (
    <div className="grid xl:grid-cols-[1fr_320px] gap-6">
      <section className="border border-black/10 dark:border-white/20 rounded-3xl p-6 bg-white dark:bg-black/90">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-semibold">Câu hỏi {activeIndex + 1}/{totalQuestions}</h2>
            <p className="text-sm text-black/60 dark:text-white/60">Chủ đề: {topicTitle}</p>
          </div>
          <div className="text-sm text-black/60 dark:text-white/60">
            Đã chọn: {answeredCount}/{totalQuestions}
          </div>
        </div>

        <div className="border border-black/10 dark:border-white/20 rounded-2xl p-5 mb-5">
          <h3 className="text-xl font-bold leading-relaxed">{activeQuestion.question}</h3>
          <p className="text-sm text-black/60 dark:text-white/60 mt-2">Có thể chọn 1 hoặc nhiều đáp án</p>

          <div className="mt-4 space-y-3">
            {([
              ['A', activeQuestion.option_a],
              ['B', activeQuestion.option_b],
              ['C', activeQuestion.option_c],
              ['D', activeQuestion.option_d],
            ] as [string, string][]).map(([key, value]) => (
              <label key={key} className="flex items-center gap-3 border border-black/10 dark:border-white/20 rounded-xl p-3 hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer">
                <input
                  type="checkbox"
                  checked={(answers[activeQuestion.id] || []).includes(key)}
                  onChange={() => handleToggleOption(activeQuestion.id, key)}
                  className="w-4 h-4 accent-sky-600"
                />
                <span className="text-sm">{key}. {value}</span>
              </label>
            ))}
          </div>

          {activeQuestion.explanation && (answers[activeQuestion.id]?.length > 0) && (
            <div className="mt-4 p-4 border-l-4 border-sky-500 bg-sky-50 dark:bg-sky-950 text-black dark:text-white rounded-lg">
              <div className="text-sm font-semibold mb-1">Giải thích:</div>
              <div className="text-sm">{activeQuestion.explanation}</div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setActiveIndex((prev) => Math.max(0, prev - 1))}
            disabled={activeIndex === 0}
            className="px-5 py-2 rounded-lg border border-black/10 dark:border-white/20 text-sm font-semibold disabled:opacity-50"
          >
            Câu trước
          </button>
          <button
            type="button"
            onClick={() => setActiveIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
            disabled={activeIndex === totalQuestions - 1}
            className="px-5 py-2 rounded-lg border border-black/10 dark:border-white/20 text-sm font-semibold disabled:opacity-50"
          >
            Câu tiếp
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving || answeredCount < totalQuestions}
            className="px-5 py-2 bg-black text-white dark:bg-white dark:text-black rounded-lg font-semibold disabled:opacity-50"
          >
            {saving ? 'Đang nộp...' : 'Nộp bài'}
          </button>
        </div>

        {saveMessage && (
          <div className="mt-4 text-sm text-red-600 dark:text-red-400">{saveMessage}</div>
        )}
      </section>

      <aside className="border border-black/10 dark:border-white/20 rounded-3xl p-6 bg-white dark:bg-black/90">
        <h3 className="text-lg font-semibold mb-4">Bảng điều hướng</h3>
        <p className="text-sm text-black/60 dark:text-white/60 mb-4">
          Đã chọn: {answeredCount}/{totalQuestions}
        </p>

        <div className="mb-4 p-3 rounded-xl border border-black/10 dark:border-white/20 bg-black/5 dark:bg-white/10">
          <div className="text-xs text-black/60 dark:text-white/60">Thời gian còn lại</div>
          <div className="text-2xl font-bold mt-1">{formatTime(timeLeft)}</div>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving || answeredCount < totalQuestions}
          className="w-full mb-4 px-4 py-2 bg-rose-600 text-white rounded-lg font-semibold disabled:opacity-50"
        >
          {saving ? 'Đang nộp...' : 'Nộp bài'}
        </button>

        <div className="grid grid-cols-5 gap-2">
          {safeQuestions.map((_, idx) => {
            const selected = (answers[safeQuestions[idx].id] || []).length > 0
            return (
              <button
                key={idx}
                onClick={() => setActiveIndex(idx)}
                className={`py-2 rounded-lg text-sm font-semibold ${
                  idx === activeIndex
                    ? 'bg-sky-700 text-white'
                    : selected
                    ? 'bg-emerald-500 text-white'
                    : 'bg-black/5 dark:bg-white/10 text-black dark:text-white'
                }`}
              >
                {idx + 1}
              </button>
            )
          })}
        </div>
      </aside>
    </div>
  )
}