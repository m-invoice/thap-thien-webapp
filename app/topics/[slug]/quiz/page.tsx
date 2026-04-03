import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import QuizForm from './quiz-form'

function shuffleArray<T>(array: T[]): T[] {
  const cloned = [...array]
  for (let i = cloned.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[cloned[i], cloned[j]] = [cloned[j], cloned[i]]
  }
  return cloned
}

export default async function TopicQuizPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: { limit?: string }
}) {
  const { slug } = await params
  const limit = Number(searchParams.limit || '0')
  const wantCount = Number.isNaN(limit) || limit <= 0 ? 5 : limit
  const supabase = await createClient()

  const { data: topic, error: topicError } = await supabase
    .from('topics')
    .select('*')
    .eq('slug', slug)
    .single()

  if (topicError || !topic) {
    notFound()
  }

  const { data: questions, error: questionsError } = await supabase
    .from('questions')
    .select(`
      id,
      question,
      option_a,
      option_b,
      option_c,
      option_d,
      correct_options,
      explanation,
      sort_order,
      is_published
    `)
    .eq('topic_id', topic.id)
    .eq('is_published', true)
    .order('sort_order', { ascending: true })

  const safeQuestions = Array.isArray(questions) ? questions : []
  const quizQuestions = safeQuestions.length > wantCount
    ? shuffleArray(safeQuestions).slice(0, wantCount)
    : safeQuestions
  if (questionsError) {
    return (
      <main className="min-h-screen bg-white text-black dark:bg-black dark:text-white p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-red-500">
            Lỗi: {questionsError.message}
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-white text-black dark:bg-black dark:text-white p-8">
      <div className="w-full max-w-[1472px] mx-auto space-y-6">
        <header className="rounded-3xl border border-black/10 dark:border-white/20 p-5 bg-white dark:bg-black/90">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold">Thập thiện nghiệp đạo Kinh</h1>
              <p className="text-black/60 dark:text-white/60">Học, thi, lưu kết quả và ôn tập câu sai</p>
            </div>
            <nav className="flex items-center gap-2 text-sm font-medium">
              <a href="/topics" className="px-4 py-2 rounded-lg border border-black/10 dark:border-white/20 hover:bg-black/5 dark:hover:bg-white/10">Học</a>
              <a href="#" className="px-4 py-2 rounded-lg bg-sky-600 text-white">Thi thử</a>
              <a href="/dashboard" className="px-4 py-2 rounded-lg border border-black/10 dark:border-white/20 hover:bg-black/5 dark:hover:bg-white/10">Thống kê</a>
              <a href="/review" className="px-4 py-2 rounded-lg border border-black/10 dark:border-white/20 hover:bg-black/5 dark:hover:bg-white/10">Ôn lại câu sai</a>
            </nav>
          </div>
        </header>

        <section className="grid lg:grid-cols-[1.8fr_1fr] gap-6">
          <div>
            <div className="rounded-3xl border border-black/10 dark:border-white/20 p-6 bg-white dark:bg-black/90">
              <h2 className="text-2xl font-semibold mb-2">Bài kiểm tra: {topic.title}</h2>
              <p className="text-black/70 dark:text-white/70 mb-6">Một câu có thể có nhiều đáp án đúng. Hãy chọn đầy đủ rồi nộp bài.</p>
              <p className="text-black/60 dark:text-white/60 mb-4">Số câu: {quizQuestions.length}</p>
              <QuizForm topicTitle={topic.title} topicSlug={slug} questions={quizQuestions} />
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}