import { createClient } from '@/lib/supabase/server'
import QuizStarter from './QuizStarter'

export default async function TopicsPage() {
  const supabase = await createClient()

  const { data: topics, error } = await supabase
    .from('topics')
    .select('*')
    .eq('is_published', true)
    .order('sort_order', { ascending: true })

  if (error) {
    return <div className="p-8 text-red-500">Lỗi: {error.message}</div>
  }

  return (
    <main className="min-h-screen bg-white text-black dark:bg-black dark:text-white transition-colors p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Tạo bài thi thử</h1>

        <QuizStarter topics={topics || []} />

        <section className="mt-10">
          <h2 className="text-2xl font-bold mb-5">Danh sách chủ đề</h2>
          <div className="grid gap-6">
            {topics?.map((topic) => (
              <a
                href={`/topics/${topic.slug}`}
                key={topic.id}
                className="border border-black/10 dark:border-white/20 rounded-2xl p-6 hover:bg-white/5 transition block"
              >
                <h3 className="text-xl font-semibold mb-2">{topic.title}</h3>
                <p className="text-black/70 dark:text-white/70">{topic.summary}</p>
              </a>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}