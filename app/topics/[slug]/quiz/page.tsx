import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import QuizForm from './quiz-form'

export default async function TopicQuizPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
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
    .select('*')
    .eq('topic_id', topic.id)
    .eq('is_published', true)
    .order('sort_order', { ascending: true })

  if (questionsError) {
    return (
      <main className="min-h-screen bg-black text-white p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-red-500">
            Lỗi: {questionsError.message}
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-3">
          Bài kiểm tra: {topic.title}
        </h1>

        <p className="text-white/70 mb-8">
          Chọn đáp án rồi bấm nộp bài để xem kết quả.
        </p>

        <QuizForm
          topicTitle={topic.title}
          topicSlug={slug}
          questions={questions ?? []}
        />
      </div>
    </main>
  )
}