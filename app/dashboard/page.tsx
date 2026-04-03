import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LogoutButton from '@/app/components/LogoutButton'
import ThemeToggle from '@/app/components/ThemeToggle'
import Link from 'next/link'

type TopicInfo = {
  title: string
  slug: string
} | null

type RawTopic = {
  title: string
  slug: string
}

type AttemptRow = {
  id: string
  score: number
  total: number
  created_at: string
  topics: TopicInfo
}

type RawAttempt = {
  id: string
  score: number | null
  total: number | null
  created_at: string | null
  topics: RawTopic[] | null
}

type DailyStat = {
  date: string
  attempts: number
  averagePercent: number
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/login')
  }

  const { data, error } = await supabase
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
      <main className="min-h-screen bg-white text-black dark:bg-black dark:text-white p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-red-500">
            Lỗi tải dashboard: {error.message}
          </div>
        </div>
      </main>
    )
  }

  const safeAttempts: AttemptRow[] = ((data as RawAttempt[]) || []).map((item) => {
    const firstTopic = item.topics && item.topics.length > 0 ? item.topics[0] : null

    return {
      id: item.id,
      score: item.score ?? 0,
      total: item.total ?? 0,
      created_at: item.created_at ?? '',
      topics: firstTopic ? { title: firstTopic.title, slug: firstTopic.slug } : null,
    }
  })

  const totalAttempts = safeAttempts.length
  const totalCorrect = safeAttempts.reduce((sum, item) => sum + item.score, 0)
  const totalQuestions = safeAttempts.reduce((sum, item) => sum + item.total, 0)

  const averageScorePercent =
    totalAttempts > 0
      ? (
          safeAttempts.reduce((sum, item) => {
            const percent = item.total > 0 ? (item.score / item.total) * 100 : 0
            return sum + percent
          }, 0) / totalAttempts
        )
      : 0

  const overallAccuracy =
    totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0

  const latestAttempt = safeAttempts[0] || null

  const topicMap = safeAttempts.reduce<
    Record<
      string,
      {
        title: string
        count: number
        totalPercent: number
      }
    >
  >((acc, item) => {
    const slug = item.topics?.slug || 'unknown'
    const title = item.topics?.title || 'Không rõ chủ đề'
    const percent = item.total > 0 ? (item.score / item.total) * 100 : 0

    if (!acc[slug]) {
      acc[slug] = {
        title,
        count: 0,
        totalPercent: 0,
      }
    }

    acc[slug].count += 1
    acc[slug].totalPercent += percent
    return acc
  }, {})

  const topTopics = Object.entries(topicMap)
    .map(([slug, value]) => ({
      slug,
      title: value.title,
      count: value.count,
      averagePercent: value.count > 0 ? value.totalPercent / value.count : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  const weakTopics = Object.entries(topicMap)
    .map(([slug, value]) => ({
      slug,
      title: value.title,
      count: value.count,
      averagePercent: value.count > 0 ? value.totalPercent / value.count : 0,
    }))
    .filter((item) => item.slug !== 'unknown')
    .sort((a, b) => a.averagePercent - b.averagePercent)
    .slice(0, 5)

  const dailyMap = safeAttempts.reduce<Record<string, { attempts: number; totalPercent: number }>>(
    (acc, item) => {
      const date = item.created_at
        ? new Date(item.created_at).toLocaleDateString('vi-VN')
        : 'Không rõ ngày'
      const percent = item.total > 0 ? (item.score / item.total) * 100 : 0

      if (!acc[date]) {
        acc[date] = {
          attempts: 0,
          totalPercent: 0,
        }
      }

      acc[date].attempts += 1
      acc[date].totalPercent += percent
      return acc
    },
    {}
  )

  const dailyStats: DailyStat[] = Object.entries(dailyMap)
    .map(([date, value]) => ({
      date,
      attempts: value.attempts,
      averagePercent: value.attempts > 0 ? value.totalPercent / value.attempts : 0,
    }))
    .slice(0, 7)
    .reverse()

  const bestDailyPercent = dailyStats.length
    ? Math.max(...dailyStats.map((d) => d.averagePercent), 1)
    : 1

  const recentAttempts = safeAttempts.slice(0, 10)

  const recommendation =
    weakTopics.length > 0
      ? weakTopics[0]
      : null

  return (
    <main className="min-h-screen bg-white text-black dark:bg-black dark:text-white transition-colors p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Dashboard nâng cao</h1>
            <p className="text-black/60 dark:text-white/60 mt-2">
              Theo dõi tiến độ học, điểm số và gợi ý ôn tập.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <ThemeToggle />
            <LogoutButton />
          </div>
        </div>

        <div className="border border-black/10 dark:border-white/20 rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Thông tin người dùng</h2>
          <div className="space-y-2 text-sm md:text-base">
            <p>
              <strong>Email:</strong> {user.email}
            </p>
            <p className="break-all">
              <strong>User ID:</strong> {user.id}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mb-8">
          <Link
            href="/topics"
            className="inline-block px-4 py-2 bg-black text-white dark:bg-white dark:text-black rounded-lg"
          >
            Học tiếp
          </Link>

          <Link
            href="/topics"
            className="inline-block px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700"
          >
            Làm bài thi
          </Link>

          <a
            href="/history"
            className="inline-block px-4 py-2 border border-black/10 dark:border-white/20 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
          >
            Lịch sử bài thi
          </a>

          <a
            href="/review"
            className="inline-block px-4 py-2 border border-black/10 dark:border-white/20 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
          >
            Ôn lại câu sai
          </a>

          <a
            href="/admin/questions"
            className="inline-block px-4 py-2 border border-black/10 dark:border-white/20 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
          >
            Admin câu hỏi
          </a>
        </div>

        <div className="grid sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-8">
          <div className="border border-black/10 dark:border-white/20 rounded-2xl p-6">
            <div className="text-black/60 dark:text-white/60 text-sm">Số lần thi</div>
            <div className="text-3xl font-bold mt-2">{totalAttempts}</div>
          </div>

          <div className="border border-black/10 dark:border-white/20 rounded-2xl p-6">
            <div className="text-black/60 dark:text-white/60 text-sm">Tổng số câu đã làm</div>
            <div className="text-3xl font-bold mt-2">{totalQuestions}</div>
          </div>

          <div className="border border-black/10 dark:border-white/20 rounded-2xl p-6">
            <div className="text-black/60 dark:text-white/60 text-sm">Tổng số câu đúng</div>
            <div className="text-3xl font-bold mt-2">{totalCorrect}</div>
          </div>

          <div className="border border-black/10 dark:border-white/20 rounded-2xl p-6">
            <div className="text-black/60 dark:text-white/60 text-sm">Điểm trung bình</div>
            <div className="text-3xl font-bold mt-2">
              {averageScorePercent.toFixed(1)}%
            </div>
          </div>

          <div className="border border-black/10 dark:border-white/20 rounded-2xl p-6">
            <div className="text-black/60 dark:text-white/60 text-sm">Tỷ lệ đúng tổng thể</div>
            <div className="text-3xl font-bold mt-2">
              {overallAccuracy.toFixed(1)}%
            </div>
          </div>
        </div>

        <div className="grid xl:grid-cols-3 gap-6 mb-6">
          <div className="xl:col-span-2 border border-black/10 dark:border-white/20 rounded-2xl p-6">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="text-xl font-semibold">Tiến bộ 7 mốc gần đây</h2>
              <div className="text-sm text-black/50 dark:text-black/50 dark:text-white/50">
                Trung bình theo ngày
              </div>
            </div>

            {dailyStats.length === 0 ? (
              <div className="text-black/60 dark:text-white/60">Chưa có dữ liệu để vẽ tiến bộ.</div>
            ) : (
              <div className="space-y-4">
                {dailyStats.map((item) => {
                  const width = `${Math.max((item.averagePercent / bestDailyPercent) * 100, 8)}%`

                  return (
                    <div key={item.date}>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <div className="text-black/70 dark:text-black/70 dark:text-white/70">{item.date}</div>
                        <div className="text-black/50 dark:text-black/50 dark:text-white/50">
                          {item.averagePercent.toFixed(1)}% · {item.attempts} lần
                        </div>
                      </div>

                      <div className="w-full rounded-full bg-black/10 dark:bg-white/10 h-4 overflow-hidden">
                        <div
                          className="h-4 rounded-full bg-black dark:bg-white"
                          style={{ width }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="border border-black/10 dark:border-white/20 rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-4">Gợi ý học tiếp</h2>

            {recommendation ? (
              <div className="space-y-4">
                <div className="border border-black/10 dark:border-white/10 rounded-xl p-4">
                  <div className="text-black/60 dark:text-white/60 text-sm">Chủ đề cần ưu tiên</div>
                  <div className="font-semibold text-lg mt-2">
                    {recommendation.title}
                  </div>
                  <div className="text-black/50 dark:text-black/50 dark:text-white/50 text-sm mt-2">
                    Điểm trung bình hiện tại: {recommendation.averagePercent.toFixed(1)}%
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <a
                    href={`/topics/${recommendation.slug}`}
                    className="inline-block px-4 py-2 bg-black text-white dark:bg-white dark:text-black rounded-lg"
                  >
                    Xem bài học
                  </a>

                  <a
                    href={`/topics/${recommendation.slug}/quiz`}
                    className="inline-block px-4 py-2 border border-black/10 dark:border-white/20 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
                  >
                    Làm lại quiz
                  </a>
                </div>
              </div>
            ) : (
              <div className="text-black/60 dark:text-white/60">
                Chưa đủ dữ liệu để đề xuất. Làm thêm vài bài thi nữa nhé.
              </div>
            )}
          </div>
        </div>

        <div className="grid xl:grid-cols-3 gap-6 mb-6">
          <div className="xl:col-span-2 border border-black/10 dark:border-white/20 rounded-2xl p-6">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="text-xl font-semibold">10 lần thi gần đây</h2>
              {latestAttempt && (
                <div className="text-sm text-black/50 dark:text-black/50 dark:text-white/50">
                  Gần nhất: {latestAttempt.score}/{latestAttempt.total}
                </div>
              )}
            </div>

            {recentAttempts.length === 0 ? (
              <div className="text-black/60 dark:text-white/60">Chưa có dữ liệu bài thi.</div>
            ) : (
              <div className="space-y-4">
                {recentAttempts.map((attempt) => {
                  const percent =
                    attempt.total > 0
                      ? ((attempt.score / attempt.total) * 100).toFixed(1)
                      : '0.0'

                  return (
                    <div
                      key={attempt.id}
                      className="border border-black/10 dark:border-white/10 rounded-xl p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <div className="font-semibold">
                            {attempt.topics?.title || 'Không rõ chủ đề'}
                          </div>
                          <div className="text-black/50 dark:text-black/50 dark:text-white/50 text-sm mt-1">
                            {attempt.created_at
                              ? new Date(attempt.created_at).toLocaleString('vi-VN')
                              : 'Không có thời gian'}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="font-bold text-lg">
                            {attempt.score}/{attempt.total}
                          </div>
                          <div className="text-black/60 dark:text-white/60 text-sm">
                            {percent}%
                          </div>
                        </div>
                      </div>

                      {attempt.topics?.slug && (
                        <div className="mt-4 flex gap-3 flex-wrap">
                          <a
                            href={`/topics/${attempt.topics.slug}`}
                            className="inline-block px-3 py-2 text-sm border border-black/10 dark:border-white/20 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
                          >
                            Xem bài
                          </a>

                          <a
                            href={`/topics/${attempt.topics.slug}/quiz`}
                            className="inline-block px-3 py-2 text-sm border border-black/10 dark:border-white/20 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
                          >
                            Làm lại quiz
                          </a>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="border border-black/10 dark:border-white/20 rounded-2xl p-6">
              <h2 className="text-xl font-semibold mb-4">Chủ đề học nhiều</h2>

              {topTopics.length === 0 ? (
                <div className="text-black/60 dark:text-white/60">Chưa có dữ liệu chủ đề.</div>
              ) : (
                <div className="space-y-4">
                  {topTopics.map((item, index) => (
                    <div
                      key={item.slug}
                      className="border border-black/10 dark:border-white/10 rounded-xl p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="font-semibold">
                            #{index + 1} {item.title}
                          </div>
                          <div className="text-black/50 dark:text-black/50 dark:text-white/50 text-sm mt-1">
                            {item.count} lần thi
                          </div>
                        </div>

                        {item.slug !== 'unknown' && (
                          <a
                            href={`/topics/${item.slug}`}
                            className="text-sm px-3 py-2 border border-black/10 dark:border-white/20 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
                          >
                            Xem
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border border-black/10 dark:border-white/20 rounded-2xl p-6">
              <h2 className="text-xl font-semibold mb-4">Chủ đề điểm thấp</h2>

              {weakTopics.length === 0 ? (
                <div className="text-black/60 dark:text-white/60">Chưa có dữ liệu đánh giá.</div>
              ) : (
                <div className="space-y-4">
                  {weakTopics.map((item, index) => (
                    <div
                      key={item.slug}
                      className="border border-black/10 dark:border-white/10 rounded-xl p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="font-semibold">
                            #{index + 1} {item.title}
                          </div>
                          <div className="text-black/50 dark:text-black/50 dark:text-white/50 text-sm mt-1">
                            Trung bình: {item.averagePercent.toFixed(1)}%
                          </div>
                        </div>

                        <a
                          href={`/topics/${item.slug}/quiz`}
                          className="text-sm px-3 py-2 border border-black/10 dark:border-white/20 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
                        >
                          Ôn lại
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}