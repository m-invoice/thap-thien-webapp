import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

type TopicInfo = {
  title: string
  slug: string
} | null

type RawTopic = {
  title: string
  slug: string
}

type AttemptData = {
  id: string
  score: number
  total: number
  topics: TopicInfo
}

type RawAttempt = {
  id: string
  score: number | null
  total: number | null
  user_id: string
  topics: RawTopic[] | null
}

type RawWrongAnswer = {
  id: string
  selected_options: string[] | null
  correct_options: string[] | null
  is_correct: boolean | null
  questions: {
    question: string
    option_a: string
    option_b: string
    option_c: string
    option_d: string
    explanation: string | null
  }[] | null
}

function getComment(percent: number) {
  if (percent >= 90) return 'Rất tốt. Anh nắm bài khá chắc.'
  if (percent >= 70) return 'Khá tốt. Chỉ cần ôn lại vài ý chưa vững.'
  if (percent >= 50) return 'Tạm ổn. Nên xem lại bài học và phần câu sai.'
  return 'Cần ôn lại kỹ hơn. Học lại đúng chỗ sẽ tiến bộ rất nhanh.'
}

export default async function ResultPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>
}) {
  const params = await searchParams
  const attemptId = params.id

  if (!attemptId) {
    redirect('/dashboard')
  }

  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/login')
  }

  const { data: attemptRaw, error: attemptError } = await supabase
    .from('quiz_attempts')
    .select(`
      id,
      score,
      total,
      user_id,
      topics (
        title,
        slug
      )
    `)
    .eq('id', attemptId)
    .single()

  const attemptData = attemptRaw as RawAttempt | null

  if (attemptError || !attemptData) {
    return (
      <main className="min-h-screen bg-white text-black dark:bg-black dark:text-white p-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-red-400 mb-6">
            Không tìm thấy kết quả bài thi.
          </div>
          <Link
            href="/dashboard"
            className="inline-block px-5 py-3 bg-black text-white dark:bg-white dark:text-black rounded-lg font-semibold"
          >
            Về Dashboard
          </Link>
        </div>
      </main>
    )
  }

  if (attemptData.user_id !== user.id) {
    redirect('/dashboard')
  }

  const firstTopic = attemptData.topics && attemptData.topics.length > 0 ? attemptData.topics[0] : null

  const attempt: AttemptData = {
    id: attemptRaw.id,
    score: attemptRaw.score ?? 0,
    total: attemptRaw.total ?? 0,
    topics: firstTopic
      ? {
          title: firstTopic.title ?? 'Không rõ chủ đề',
          slug: firstTopic.slug ?? '',
        }
      : null,
  }

  const percent =
    attempt.total > 0 ? Math.round((attempt.score / attempt.total) * 100) : 0

  const comment = getComment(percent)

  const { data: wrongRaw, error: wrongError } = await supabase
    .from('quiz_answers')
    .select(`
      id,
      selected_options,
      correct_options,
      is_correct,
      questions (
        question,
        option_a,
        option_b,
        option_c,
        option_d,
        explanation
      )
    `)
    .eq('attempt_id', attemptId)
    .eq('is_correct', false)

  const wrongAnswers = ((wrongRaw as RawWrongAnswer[]) || []).map(
    (item) => {
      const firstQuestion = item.questions && item.questions.length > 0 ? item.questions[0] : null

      return {
        id: item.id,
        selected_options: item.selected_options ?? [],
        correct_options: item.correct_options ?? [],
        is_correct: item.is_correct ?? false,
        questions: firstQuestion
          ? {
              question: firstQuestion.question,
              option_a: firstQuestion.option_a,
              option_b: firstQuestion.option_b,
              option_c: firstQuestion.option_c,
              option_d: firstQuestion.option_d,
              explanation: firstQuestion.explanation ?? null,
            }
          : null,
      }
    }
  )

  const reviewCount = wrongAnswers.length

  return (
    <main className="min-h-screen bg-white text-black dark:bg-black dark:text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">🎉 Hoàn thành bài kiểm tra</h1>
          <p className="text-black/70 dark:text-white/70 text-lg">
            Chủ đề: {attempt.topics?.title || 'Không rõ chủ đề'}
          </p>
        </div>

        <div className="border border-black/10 dark:border-white/20 rounded-2xl p-6 mb-8">
          <div className="grid md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-black/60 dark:text-white/60 text-sm">Điểm số</div>
              <div className="text-3xl font-bold mt-2">
                {attempt.score}/{attempt.total}
              </div>
            </div>

            <div>
              <div className="text-black/60 dark:text-white/60 text-sm">Tỷ lệ đúng</div>
              <div className="text-3xl font-bold mt-2">{percent}%</div>
            </div>

            <div>
              <div className="text-black/60 dark:text-white/60 text-sm">Câu cần ôn lại</div>
              <div className="text-3xl font-bold mt-2">{reviewCount}</div>
            </div>
          </div>

          <div className="mt-6 text-center text-black/75 dark:text-white/75">
            {comment}
          </div>
        </div>

        <div className="flex justify-center gap-4 flex-wrap mb-10">
          <a
            href="/dashboard"
            className="px-5 py-3 bg-black text-white dark:bg-white dark:text-black rounded-lg font-semibold"
          >
            Về Dashboard
          </a>

          <Link
            href="/topics"
            className="px-5 py-3 border border-black/10 dark:border-white/20 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
          >
            Học tiếp
          </Link>

          {attempt.topics?.slug && (
            <Link
              href={`/topics/${attempt.topics.slug}/quiz`}
              className="px-5 py-3 border border-black/10 dark:border-white/20 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
            >
              Làm lại bài
            </Link>
          )}
        </div>

        <div className="border border-black/10 dark:border-white/20 rounded-2xl p-6">
          <h2 className="text-2xl font-semibold mb-6">Phần cần ôn lại</h2>

          {wrongError && (
            <div className="text-red-400 mb-4">
              Không tải được danh sách câu sai: {wrongError.message}
            </div>
          )}

          {wrongAnswers.length === 0 ? (
            <div className="border border-green-400/20 rounded-xl p-5 text-green-500 dark:text-green-300">
              Rất tốt. Anh không có câu sai nào trong bài này.
            </div>
          ) : (
            <div className="space-y-6">
              {wrongAnswers.map((item, index) => (
                <div
                  key={item.id}
                  className="border border-black/10 dark:border-white/10 rounded-2xl p-5"
                >
                  <h3 className="text-xl font-semibold mb-4">
                    Câu sai {index + 1}: {item.questions?.question || 'Không rõ nội dung'}
                  </h3>

                  <div className="space-y-2 text-black/80 dark:text-white/80">
                    <div>A. {item.questions?.option_a}</div>
                    <div>B. {item.questions?.option_b}</div>
                    <div>C. {item.questions?.option_c}</div>
                    <div>D. {item.questions?.option_d}</div>
                  </div>

                  <div className="mt-4 text-red-500 dark:text-red-400">
                    Anh đã chọn: {(item.selected_options || []).join(', ') || 'Chưa chọn'}
                  </div>

                  <div className="mt-2 text-green-600 dark:text-green-400">
                    Đáp án đúng: {(item.correct_options || []).join(', ') || 'Không rõ'}
                  </div>

                  {item.questions?.explanation && (
                    <div className="mt-4 text-black/70 dark:text-white/70">
                      <span className="font-semibold text-black dark:text-white">Lời giải:</span>{' '}
                      {item.questions.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}