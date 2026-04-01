import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
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

  if (error) {
    return (
      <main className="min-h-screen bg-black text-white p-8">
        <div className="max-w-5xl mx-auto text-red-400">
          Lỗi: {error.message}
        </div>
      </main>
    )
  }

  const totalAttempts = attempts?.length || 0

  const averageScore =
    totalAttempts > 0
      ? (
          attempts.reduce((sum: number, item: any) => {
            return sum + (item.total > 0 ? (item.score / item.total) * 100 : 0)
          }, 0) / totalAttempts
        ).toFixed(1)
      : '0.0'

  const latestAttempt = attempts?.[0] || null

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Dashboard cá nhân</h1>

        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="border border-white/20 rounded-2xl p-6">
            <div className="text-white/60 text-sm">Số lần thi</div>
            <div className="text-3xl font-bold mt-2">{totalAttempts}</div>
          </div>

          <div className="border border-white/20 rounded-2xl p-6">
            <div className="text-white/60 text-sm">Điểm trung bình</div>
            <div className="text-3xl font-bold mt-2">{averageScore}%</div>
          </div>

          <div className="border border-white/20 rounded-2xl p-6">
            <div className="text-white/60 text-sm">Lần thi gần nhất</div>
            <div className="text-lg font-semibold mt-2">
              {latestAttempt
                ? `${latestAttempt.score}/${latestAttempt.total}`
                : 'Chưa có'}
            </div>
          </div>
        </div>

        <div className="border border-white/20 rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-4">Các lần thi gần đây</h2>

          {!attempts || attempts.length === 0 ? (
            <div className="text-white/60">
              Chưa có dữ liệu bài thi.
            </div>
          ) : (
            <div className="space-y-4">
              {attempts.slice(0, 10).map((attempt: any) => (
                <div
                  key={attempt.id}
                  className="border border-white/10 rounded-xl p-4"
                >
                  <div className="font-semibold">
                    {attempt.topics?.title || 'Không rõ chủ đề'}
                  </div>

                  <div className="text-white/70 mt-1">
                    Điểm: {attempt.score}/{attempt.total}
                  </div>

                  <div className="text-white/50 text-sm mt-1">
                    {new Date(attempt.created_at).toLocaleString('vi-VN')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}