import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

type RawQuestion = {
  id: string
  question: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  explanation: string | null
}

type WrongAnswer = {
  id: string
  selected_options: string[] | null
  correct_options: string[] | null
  questions: RawQuestion | RawQuestion[] | null
}

export default async function ReviewPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: wrongAnswers, error } = await supabase
    .from('quiz_answers')
    .select(`
      id,
      selected_options,
      correct_options,
      is_correct,
      questions (
        id,
        question,
        explanation,
        option_a,
        option_b,
        option_c,
        option_d
      ),
      quiz_attempts!inner (
        user_id
      )
    `)
    .eq('quiz_attempts.user_id', user.id)
    .eq('is_correct', false)

  return (
    <main className="min-h-screen bg-white text-black dark:bg-black dark:text-white transition-colors p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Ôn lại câu sai</h1>

        {error && (
          <div className="text-red-400 mb-4">
            Lỗi: {error.message}
          </div>
        )}

        {!wrongAnswers || wrongAnswers.length === 0 ? (
          <div className="border border-white/20 rounded-2xl p-6">
            Chưa có câu sai nào.
          </div>
        ) : (
          <div className="grid xl:grid-cols-[1fr_220px] gap-6">
            <div className="space-y-6">
              {wrongAnswers.map((item: WrongAnswer, index: number) => {
                const question = item.questions
                  ? Array.isArray(item.questions)
                    ? item.questions[0]
                    : item.questions
                  : null

                return (
                  <div
                    id={`q${index + 1}`}
                    key={item.id}
                    className="border border-white/20 rounded-2xl p-6"
                  >
                  <h2 className="text-xl font-semibold mb-4">
                    Câu {index + 1}: {question?.question ?? 'Không rõ câu hỏi'}
                  </h2>

                  <div className="space-y-2">
                    {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                      const value =
                        opt === 'A'
                          ? question?.option_a
                          : opt === 'B'
                          ? question?.option_b
                          : opt === 'C'
                          ? question?.option_c
                          : question?.option_d

                      const selected = (item.selected_options || []).includes(opt)
                      const correct = (item.correct_options || []).includes(opt)

                      const bgClass = selected && correct
                        ? 'bg-emerald-600/20 border-emerald-400 text-emerald-200'
                        : selected
                        ? 'bg-red-600/20 border-red-400 text-red-200'
                        : correct
                        ? 'bg-emerald-600/20 border-emerald-400 text-emerald-200'
                        : 'bg-black/10 dark:bg-white/10 text-white/80'

                      return (
                        <div
                          key={opt}
                          className={`p-2 rounded-lg border ${bgClass} flex justify-between items-center`}
                        >
                          <span>{opt}. {value || '---'}</span>
                          <span className="text-xs font-semibold">
                            {selected && correct ? '✓ Đã chọn đúng' : selected ? '✗ Sai' : correct ? '✔ Đáp án' : ''}
                          </span>
                        </div>
                      )
                    })}
                  </div>

                  <div className="mt-4 text-red-400">
                    Bạn chọn: {(item.selected_options || []).join(', ') || 'Chưa chọn'}
                  </div>

                  <div className="mt-2 text-green-400">
                    Đáp án đúng: {(item.correct_options || []).join(', ') || 'Không rõ'}
                  </div>

                  <div className="mt-3 text-black/70 dark:text-white/70">
                    <span className="font-semibold">Giải thích:</span>{' '}
                    {question?.explanation || 'Chưa có giải thích cho câu này.'}
                  </div>
                </div>
              )})}            </div>

            <aside className="sticky top-24 self-start border border-white/20 rounded-2xl p-4 h-fit bg-black/70">
              <h3 className="text-lg font-semibold mb-3">Điều hướng câu sai</h3>
              <p className="text-sm text-white/60 mb-3">Nhấp để xem chi tiết</p>
              <div className="grid grid-cols-5 gap-2">
                {wrongAnswers.map((_, idx) => (
                  <a
                    key={idx}
                    href={`#q${idx + 1}`}
                    className="text-center py-2 rounded-lg border border-white/20 bg-black/10 hover:bg-sky-500 hover:text-white"
                  >
                    {idx + 1}
                  </a>
                ))}
              </div>
            </aside>          </div>
        )}
      </div>
    </main>
  )
}