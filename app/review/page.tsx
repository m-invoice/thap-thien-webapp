import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

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
      selected_option,
      correct_option,
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
    <main className="min-h-screen bg-black text-white p-8">
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
          <div className="space-y-6">
            {wrongAnswers.map((item: any, index: number) => (
              <div
                key={item.id}
                className="border border-white/20 rounded-2xl p-6"
              >
                <h2 className="text-xl font-semibold mb-4">
                  Câu {index + 1}: {item.questions?.question}
                </h2>

                <div className="space-y-2 text-white/80">
                  <div>A. {item.questions?.option_a}</div>
                  <div>B. {item.questions?.option_b}</div>
                  <div>C. {item.questions?.option_c}</div>
                  <div>D. {item.questions?.option_d}</div>
                </div>

                <div className="mt-4 text-red-400">
                  Bạn chọn: {item.selected_option || 'Chưa chọn'}
                </div>

                <div className="mt-2 text-green-400">
                  Đáp án đúng: {item.correct_option}
                </div>

                {item.questions?.explanation && (
                  <div className="mt-3 text-white/70">
                    Giải thích: {item.questions.explanation}
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