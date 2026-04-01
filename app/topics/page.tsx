import { createClient } from '@/lib/supabase/server'

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
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Các chủ đề học</h1>

        <div className="grid gap-6">
          {topics?.map((topic) => (
           <a
                href={`/topics/${topic.slug}`}
                key={topic.id}
                className="border border-white/20 rounded-2xl p-6 hover:bg-white/5 transition block"
            >
              <h2 className="text-xl font-semibold mb-2">
                {topic.title}
              </h2>

              <p className="text-white/70">
                {topic.summary}
              </p>
            </a>
          ))}
        </div>
      </div>
    </main>
  )
}