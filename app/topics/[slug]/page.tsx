import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'

export default async function TopicDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: topic, error } = await supabase
    .from('topics')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error || !topic) {
    notFound()
  }

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">{topic.title}</h1>
        <p className="text-white/70 mb-8">{topic.summary}</p>

        <div className="border border-white/20 rounded-2xl p-6 whitespace-pre-line">
          {topic.lesson || 'Chưa có nội dung bài học'}
        </div>

        <div className="mt-6">
          <a
            href={`/topics/${slug}/quiz`}
            className="inline-block px-4 py-2 bg-white text-black rounded-lg"
          >
            Làm bài kiểm tra
          </a>
        </div>
      </div>
    </main>
  )
}