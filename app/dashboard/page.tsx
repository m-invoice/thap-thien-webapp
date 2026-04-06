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

type ProfileRow = {
  role: string | null
} | null

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/login')
  }

  const [{ data: attemptsData, error: attemptsError }, { data: profileData }] = await Promise.all([
    supabase
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
      .order('created_at', { ascending: false }),

    supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle(),
  ])

  if (attemptsError) {
    return (
      <main className="min-h-screen bg-white p-8 text-black dark:bg-black dark:text-white">
        <div className="mx-auto max-w-6xl">
          <div className="text-red-500">Lỗi tải dashboard: {attemptsError.message}</div>
        </div>
      </main>
    )
  }

  const profile = (profileData as ProfileRow) || null
  const isAdmin = profile?.role === 'admin'

  const safeAttempts: AttemptRow[] = ((attemptsData as RawAttempt[]) || []).map((item) => {
    const firstTopic = item.topics && item.topics.length > 0 ? item.topics[0] : null

    return {
      id: item.id,
      score: item.score ?? 0,
      total: item.total ?? 0,
      created_at: item.created_at ?? '',
      topics: firstTopic
        ? {
            title: firstTopic.title,
            slug: firstTopic.slug,
          }
        : null,
    }
  })

  const totalAttempts = safeAttempts.length
  const totalCorrect = safeAttempts.reduce((sum, item) => sum + item.score, 0)
  const totalQuestions = safeAttempts.reduce((sum, item) => sum + item.total, 0)

  const averageScorePercent =
    totalAttempts > 0
      ? safeAttempts.reduce((sum, item) => {
          const percent = item.total > 0 ? (item.score / item.total) * 100 : 0
          return sum + percent
        }, 0) / totalAttempts
      : 0

  const overallAccuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0

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
  const recommendation = weakTopics.length > 0 ? weakTopics[0] : null

  return (
    <main className="min-h-screen bg-white p-8 text-black transition-colors dark:bg-black dark:text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 border-b border-black/10 pb-6 dark:border-white/10 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard học tập</h1>
            <p className="mt-2 text-black/60 dark:text-white/60">
              Theo dõi tiến độ học, điểm số và gợi ý ôn tập.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {isAdmin && (
              <div className="flex flex-wrap items-center gap-6">
                <Link
                  href="/admin/lessons"
                  className="text-sm font-medium text-red-400 hover:text-red-300"
                >
                  Admin bài giảng
                </Link>
                <Link
                  href="/admin/questions"
                  className="text-sm font-medium text-red-400 hover:text-red-300"
                >
                  Admin câu hỏi
                </Link>
              </div>
            )}

            <ThemeToggle />
            <LogoutButton />
          </div>
        </div>

        <div className="mb-8 rounded-2xl border border-black/10 p-6 dark:border-white/20">
          <h2 className="mb-4 text-xl font-semibold">Thông tin người dùng</h2>
          <div className="space-y-2 text-sm md:text-base">
            <p>
              <strong>Email:</strong> {user.email}
            </p>
            <p className="break-all">
              <strong>User ID:</strong> {user.id}
            </p>
            {isAdmin && (
              <p>
                <strong>Vai trò:</strong> Admin
              </p>
            )}
          </div>
        </div>

        <div className="mb-8 flex flex-wrap gap-3">
          <Link
            href="/lessons"
            className="inline-block rounded-lg border border-black/10 px-4 py-2 hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/5"
          >
            <div className="text-sm text-black/60 dark:text-white/60">Học theo Tập 1-80</div>
          </Link>

          <Link
            href="/topics"
            className="inline-block rounded-lg bg-black px-4 py-2 text-white dark:bg-white dark:text-black"
          >
            Học tiếp
          </Link>

          <Link
            href="/mock-exam"
            className="inline-block rounded-lg bg-sky-600 px-4 py-2 text-white hover:bg-sky-700"
          >
            Làm bài thi
          </Link>

          <Link
            href="/history"
            className="inline-block rounded-lg border border-black/10 px-4 py-2 hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/5"
          >
            Lịch sử bài thi
          </Link>

          <Link
            href="/review"
            className="inline-block rounded-lg border border-black/10 px-4 py-2 hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/5"
          >
            Ôn lại câu sai
          </Link>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-2xl border border-black/10 p-6 dark:border-white/20">
            <div className="text-sm text-black/60 dark:text-white/60">Số lần thi</div>
            <div className="mt-2 text-3xl font-bold">{totalAttempts}</div>
          </div>

          <div className="rounded-2xl border border-black/10 p-6 dark:border-white/20">
            <div className="text-sm text-black/60 dark:text-white/60">Tổng số câu đã làm</div>
            <div className="mt-2 text-3xl font-bold">{totalQuestions}</div>
          </div>

          <div className="rounded-2xl border border-black/10 p-6 dark:border-white/20">
            <div className="text-sm text-black/60 dark:text-white/60">Tổng số câu đúng</div>
            <div className="mt-2 text-3xl font-bold">{totalCorrect}</div>
          </div>

          <div className="rounded-2xl border border-black/10 p-6 dark:border-white/20">
            <div className="text-sm text-black/60 dark:text-white/60">Điểm trung bình</div>
            <div className="mt-2 text-3xl font-bold">{averageScorePercent.toFixed(1)}%</div>
          </div>

          <div className="rounded-2xl border border-black/10 p-6 dark:border-white/20">
            <div className="text-sm text-black/60 dark:text-white/60">Tỷ lệ đúng tổng thể</div>
            <div className="mt-2 text-3xl font-bold">{overallAccuracy.toFixed(1)}%</div>
          </div>
        </div>

        <div className="mb-6 grid gap-6 xl:grid-cols-3">
          <div className="rounded-2xl border border-black/10 p-6 dark:border-white/20 xl:col-span-2">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold">Tiến bộ 7 mốc gần đây</h2>
              <div className="text-sm text-black/50 dark:text-white/50">Trung bình theo ngày</div>
            </div>

            {dailyStats.length === 0 ? (
              <div className="text-black/60 dark:text-white/60">Chưa có dữ liệu để vẽ tiến bộ.</div>
            ) : (
              <div className="space-y-4">
                {dailyStats.map((item) => {
                  const width = `${Math.max((item.averagePercent / bestDailyPercent) * 100, 8)}%`

                  return (
                    <div key={item.date}>
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <div className="text-black/70 dark:text-white/70">{item.date}</div>
                        <div className="text-black/50 dark:text-white/50">
                          {item.averagePercent.toFixed(1)}% · {item.attempts} lần
                        </div>
                      </div>

                      <div className="h-4 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                        <div className="h-4 rounded-full bg-black dark:bg-white" style={{ width }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-black/10 p-6 dark:border-white/20">
            <h2 className="mb-4 text-xl font-semibold">Gợi ý học tiếp</h2>

            {recommendation ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-black/10 p-4 dark:border-white/10">
                  <div className="text-sm text-black/60 dark:text-white/60">Chủ đề cần ưu tiên</div>
                  <div className="mt-2 text-lg font-semibold">{recommendation.title}</div>
                  <div className="mt-2 text-sm text-black/50 dark:text-white/50">
                    Điểm trung bình hiện tại: {recommendation.averagePercent.toFixed(1)}%
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link
                    href={`/topics/${recommendation.slug}`}
                    className="inline-block rounded-lg bg-black px-4 py-2 text-white dark:bg-white dark:text-black"
                  >
                    Xem bài học
                  </Link>

                  <Link
                    href={`/topics/${recommendation.slug}/quiz`}
                    className="inline-block rounded-lg border border-black/10 px-4 py-2 hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/5"
                  >
                    Làm lại quiz
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-black/60 dark:text-white/60">
                Chưa đủ dữ liệu để đề xuất. Làm thêm vài bài thi nữa nhé.
              </div>
            )}
          </div>
        </div>

        <div className="mb-6 grid gap-6 xl:grid-cols-3">
          <div className="rounded-2xl border border-black/10 p-6 dark:border-white/20 xl:col-span-2">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold">10 lần thi gần đây</h2>
              {latestAttempt && (
                <div className="text-sm text-black/50 dark:text-white/50">
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
                    attempt.total > 0 ? ((attempt.score / attempt.total) * 100).toFixed(1) : '0.0'

                  return (
                    <div
                      key={attempt.id}
                      className="rounded-xl border border-black/10 p-4 dark:border-white/10"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <div className="font-semibold">
                            {attempt.topics?.title || 'Không rõ chủ đề'}
                          </div>
                          <div className="mt-1 text-sm text-black/50 dark:text-white/50">
                            {attempt.created_at
                              ? new Date(attempt.created_at).toLocaleString('vi-VN')
                              : 'Không có thời gian'}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-lg font-bold">
                            {attempt.score}/{attempt.total}
                          </div>
                          <div className="text-sm text-black/60 dark:text-white/60">{percent}%</div>
                        </div>
                      </div>

                      {attempt.topics?.slug && (
                        <div className="mt-4 flex flex-wrap gap-3">
                          <Link
                            href={`/topics/${attempt.topics.slug}`}
                            className="inline-block rounded-lg border border-black/10 px-3 py-2 text-sm hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/5"
                          >
                            Xem bài
                          </Link>

                          <Link
                            href={`/topics/${attempt.topics.slug}/quiz`}
                            className="inline-block rounded-lg border border-black/10 px-3 py-2 text-sm hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/5"
                          >
                            Làm lại quiz
                          </Link>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-black/10 p-6 dark:border-white/20">
              <h2 className="mb-4 text-xl font-semibold">Chủ đề học nhiều</h2>

              {topTopics.length === 0 ? (
                <div className="text-black/60 dark:text-white/60">Chưa có dữ liệu chủ đề.</div>
              ) : (
                <div className="space-y-4">
                  {topTopics.map((item, index) => (
                    <div
                      key={item.slug}
                      className="rounded-xl border border-black/10 p-4 dark:border-white/10"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="font-semibold">
                            #{index + 1} {item.title}
                          </div>
                          <div className="mt-1 text-sm text-black/50 dark:text-white/50">
                            {item.count} lần thi
                          </div>
                        </div>

                        {item.slug !== 'unknown' && (
                          <Link
                            href={`/topics/${item.slug}`}
                            className="rounded-lg border border-black/10 px-3 py-2 text-sm hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/5"
                          >
                            Xem
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-black/10 p-6 dark:border-white/20">
              <h2 className="mb-4 text-xl font-semibold">Chủ đề điểm thấp</h2>

              {weakTopics.length === 0 ? (
                <div className="text-black/60 dark:text-white/60">Chưa có dữ liệu đánh giá.</div>
              ) : (
                <div className="space-y-4">
                  {weakTopics.map((item, index) => (
                    <div
                      key={item.slug}
                      className="rounded-xl border border-black/10 p-4 dark:border-white/10"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="font-semibold">
                            #{index + 1} {item.title}
                          </div>
                          <div className="mt-1 text-sm text-black/50 dark:text-white/50">
                            Trung bình: {item.averagePercent.toFixed(1)}%
                          </div>
                        </div>

                        <Link
                          href={`/topics/${item.slug}/quiz`}
                          className="rounded-lg border border-black/10 px-3 py-2 text-sm hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/5"
                        >
                          Ôn lại
                        </Link>
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