'use client'

import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'

type Topic = {
  id: string
  title: string
  slug: string
  summary?: string
}

export default function QuizStarter({ topics }: { topics: Topic[] }) {
  const router = useRouter()
  const [topicSlug, setTopicSlug] = useState<string>(topics[0]?.slug || '')
  const [questionCount, setQuestionCount] = useState(5)

  const selectedTopic = useMemo(
    () => topics.find((topic) => topic.slug === topicSlug),
    [topicSlug, topics]
  )

  const handleStartQuiz = () => {
    if (!topicSlug || questionCount < 1) return
    router.push(`/topics/${topicSlug}/quiz?limit=${questionCount}`)
  }

  return (
    <div className="rounded-2xl border border-black/10 dark:border-white/20 p-6 bg-white dark:bg-black/90">
      <h2 className="text-2xl font-bold mb-3">Tạo bài thi thử</h2>
      <p className="text-black/70 dark:text-white/70 mb-6">Chọn chủ đề và số câu. Hệ thống sẽ trộn ngẫu nhiên câu hỏi và nộp bài khi hoàn thành.</p>

      <div className="grid gap-4 sm:grid-cols-[1fr_120px] items-end">
        <div className="space-y-2">
          <label className="block text-sm font-medium">Chủ đề</label>
          <select
            value={topicSlug}
            onChange={(e) => setTopicSlug(e.target.value)}
            className="w-full rounded-lg border border-black/10 dark:border-white/20 p-2 bg-white dark:bg-black"
          >
            {topics.map((topic) => (
              <option key={topic.id} value={topic.slug}>
                {topic.title}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Số câu</label>
          <input
            type="number"
            min={1}
            max={100}
            value={questionCount}
            onChange={(e) => setQuestionCount(Number(e.target.value))}
            className="w-full rounded-lg border border-black/10 dark:border-white/20 p-2 bg-white dark:bg-black"
          />
        </div>
      </div>

      <p className="text-sm text-black/60 dark:text-white/60 mt-4 mb-4">
        Ngân hàng hiện có {topics.length} chủ đề, mỗi topic có thể thêm câu hỏi ở trang Admin.
      </p>

      <div className="flex items-center gap-3">
        <button
          onClick={handleStartQuiz}
          className="px-4 py-2 rounded-lg bg-sky-600 text-white font-semibold hover:bg-sky-700"
        >
          Bắt đầu thi
        </button>

        <button
          onClick={() => router.push('/review')}
          className="px-4 py-2 rounded-lg border border-black/10 dark:border-white/20 hover:bg-black/5 dark:hover:bg-white/10"
        >
          Thi lại câu sai
        </button>
      </div>

      {selectedTopic && selectedTopic.summary && (
        <div className="mt-4 text-sm text-black/70 dark:text-white/70">
          <strong>Chủ đề:</strong> {selectedTopic.summary}
        </div>
      )}
    </div>
  )
}
