import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const supabase = await createClient()

    const { topicSlug, score, total, answers, questions } = body

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Chưa đăng nhập' },
        { status: 401 }
      )
    }

    const { data: topic, error: topicError } = await supabase
      .from('topics')
      .select('id, slug, title')
      .eq('slug', topicSlug)
      .single()

    if (topicError || !topic) {
      return NextResponse.json(
        { error: 'Không tìm thấy chủ đề' },
        { status: 400 }
      )
    }

    const { data: attempt, error: attemptError } = await supabase
      .from('quiz_attempts')
      .insert({
        user_id: user.id,
        topic_id: topic.id,
        score,
        total,
      })
      .select()
      .single()

    if (attemptError || !attempt) {
      return NextResponse.json(
        { error: attemptError?.message || 'Không lưu được lần thi' },
        { status: 500 }
      )
    }

    const safeQuestions = Array.isArray(questions) ? questions : []
    const safeAnswers = answers || {}

    const answersData = safeQuestions.map((q: any) => ({
      attempt_id: attempt.id,
      question_id: q.id,
      selected_option: safeAnswers[q.id] || null,
      correct_option: q.correct_option,
      is_correct: safeAnswers[q.id] === q.correct_option,
    }))

    if (answersData.length > 0) {
      const { error: answersError } = await supabase
        .from('quiz_answers')
        .insert(answersData)

      if (answersError) {
        return NextResponse.json(
          { error: answersError.message },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      attemptId: attempt.id,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Lỗi server khi lưu kết quả' },
      { status: 500 }
    )
  }
}