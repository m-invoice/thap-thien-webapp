import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function HistoryPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: attempts, error } = await supabase
    .from('quiz_attempts')
    .select(`
      id,
      score,
      total,
      created_at,
      topics (
        title,
        slug
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Lịch sử bài thi</h1>

        {error && (
          <div className="text-red-400 mb-4">
            Lỗi: {error.message}
          </div>
        )}

        {!attempts || attempts.length === 0 ? (
          <div className="border border-white/20 rounded-2xl p-6">
            Chưa có lịch sử bài thi.
          </div>
        ) : (
          <div className="space-y-4">
            {attempts.map((attempt: any) => (
              <div
                key={attempt.id}
                className="border border-white/20 rounded-2xl p-6"
              >
                <div className="text-xl font-semibold">
                  {attempt.topics?.title || 'Không rõ chủ đề'}
                </div>

                <div className="mt-2 text-white/70">
                  Điểm: {attempt.score}/{attempt.total}
                </div>

                <div className="mt-1 text-white/50 text-sm">
                  {new Date(attempt.created_at).toLocaleString('vi-VN')}
                </div>

                {attempt.topics?.slug && (
                  <div className="mt-4">
                    <a
                      href={`/topics/${attempt.topics.slug}`}
                      className="inline-block px-4 py-2 border border-white/20 rounded-lg hover:bg-white/5"
                    >
                      Xem lại bài học
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}