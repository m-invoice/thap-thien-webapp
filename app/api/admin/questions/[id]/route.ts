import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

function normalizeOptions(options: string[] | null | undefined) {
  return [...new Set((options || []).map((x) => String(x).trim().toUpperCase()))].sort()
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    if (
      !topic_id ||
      !question ||
      !option_a ||
      !option_b ||
      !option_c ||
      !option_d
    ) {
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
      .update({
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
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch {
    return NextResponse.json(
      { error: 'Không cập nhật được câu hỏi' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createAdminClient()

    const { error } = await supabase
      .from('questions')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: 'Không xóa được câu hỏi' },
      { status: 500 }
    )
  }
}