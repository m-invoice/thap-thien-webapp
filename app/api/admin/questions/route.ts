import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

function normalizeOptions(options: string[] | null | undefined) {
  return [...new Set((options || []).map((x) => String(x).trim().toUpperCase()))].sort()
}

export async function GET(req: Request) {
  try {
    const supabase = createAdminClient()
    const { searchParams } = new URL(req.url)
    const topicId = searchParams.get('topic_id')

    let query = supabase
      .from('questions')
      .select('*')
      .order('sort_order', { ascending: true })

    if (topicId) {
      query = query.eq('topic_id', topicId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Supabase questions error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: data || [] })
  } catch (error: unknown) {
    console.error('GET /api/admin/questions crash:', error)
    const message = error instanceof Error ? error.message : 'Không lấy được danh sách câu hỏi'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const supabase = createAdminClient()
    const body = await req.json()

    const {
      topic_id,
      question,
      option_a,
      option_b,
      option_c,
      option_d,
      correct_options,
      explanation,
      sort_order,
      is_published,
    } = body

    if (!topic_id || !question || !option_a || !option_b || !option_c || !option_d) {
      return NextResponse.json(
        { error: 'Thiếu dữ liệu bắt buộc' },
        { status: 400 }
      )
    }

    const normalized = normalizeOptions(correct_options)

    if (normalized.length === 0) {
      return NextResponse.json(
        { error: 'Phải chọn ít nhất 1 đáp án đúng' },
        { status: 400 }
      )
    }

    const valid = normalized.every((x) => ['A', 'B', 'C', 'D'].includes(x))
    if (!valid) {
      return NextResponse.json(
        { error: 'correct_options chỉ được chứa A, B, C, D' },
        { status: 400 }
      )
    }

    const firstCorrect = normalized[0] || null

    const { data, error } = await supabase
      .from('questions')
      .insert({
        topic_id,
        question: String(question).trim(),
        option_a: String(option_a).trim(),
        option_b: String(option_b).trim(),
        option_c: String(option_c).trim(),
        option_d: String(option_d).trim(),
        correct_options: normalized,
        correct_option: firstCorrect,
        explanation: String(explanation || '').trim(),
        sort_order: Number(sort_order || 0),
        is_published: Boolean(is_published),
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase insert question error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error: unknown) {
    console.error('POST /api/admin/questions crash:', error)
    const message = error instanceof Error ? error.message : 'Không thêm được câu hỏi'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}