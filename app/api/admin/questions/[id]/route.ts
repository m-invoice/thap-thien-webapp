import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const body = await req.json()

    const {
      topic_id,
      question,
      option_a,
      option_b,
      option_c,
      option_d,
      correct_option,
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
      !option_d ||
      !correct_option
    ) {
      return NextResponse.json(
        { error: 'Thiếu dữ liệu bắt buộc' },
        { status: 400 }
      )
    }

    const validOption = ['A', 'B', 'C', 'D'].includes(
      String(correct_option).toUpperCase()
    )

    if (!validOption) {
      return NextResponse.json(
        { error: 'correct_option phải là A, B, C hoặc D' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('questions')
      .update({
        topic_id,
        question: String(question).trim(),
        option_a: String(option_a).trim(),
        option_b: String(option_b).trim(),
        option_c: String(option_c).trim(),
        option_d: String(option_d).trim(),
        correct_option: String(correct_option).trim().toUpperCase(),
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
  } catch (error) {
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
    const supabase = await createClient()

    const { error } = await supabase
      .from('questions')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Không xóa được câu hỏi' },
      { status: 500 }
    )
  }
}