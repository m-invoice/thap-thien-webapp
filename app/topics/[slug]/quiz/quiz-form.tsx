'use client'

import { useState } from 'react'

type Question = {
  id: string
  question: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_option: 'A' | 'B' | 'C' | 'D'
  explanation?: string | null
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
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  const safeQuestions = Array.isArray(questions) ? questions : []

  const handleSelect = (questionId: string, option: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: option }))
  }

  const handleSubmit = async () => {
    setSaving(true)
    setSaveMessage('')

    const score = safeQuestions.reduce((total, q) => {
      return total + (answers[q.id] === q.correct_option ? 1 : 0)
    }, 0)

    try {
      const res = await fetch('/api/save-attempt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicSlug,
          score,
          total: safeQuestions.length,
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
    } catch (error) {
      setSaveMessage('Có lỗi khi gọi API lưu kết quả')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      {safeQuestions.length === 0 ? (
        <div className="border border-white/20 rounded-2xl p-6">
          Chưa có câu hỏi cho chủ đề {topicTitle}.
        </div>
      ) : (
        <>
          <div className="space-y-6">
            {safeQuestions.map((q, index) => (
              <div
                key={q.id}
                className="border border-white/20 rounded-2xl p-6"
              >
                <h2 className="text-xl font-semibold mb-4">
                  Câu {index + 1}: {q.question}
                </h2>

                <div className="space-y-3">
                  {[
                    ['A', q.option_a],
                    ['B', q.option_b],
                    ['C', q.option_c],
                    ['D', q.option_d],
                  ].map(([key, value]) => (
                    <label
                      key={key}
                      className="block border border-white/10 rounded-xl p-3 cursor-pointer hover:bg-white/5"
                    >
                      <input
                        type="radio"
                        name={q.id}
                        value={key}
                        checked={answers[q.id] === key}
                        onChange={() => handleSelect(q.id, key)}
                        className="mr-3"
                      />
                      <span>
                        {key}. {value}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex items-center gap-4">
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="px-5 py-3 bg-white text-black rounded-lg font-semibold disabled:opacity-50"
            >
              {saving ? 'Đang nộp bài...' : 'Nộp bài'}
            </button>
          </div>

          {saveMessage && (
            <div className="mt-4 text-sm text-white/70">
              {saveMessage}
            </div>
          )}
        </>
      )}
    </div>
  )
}