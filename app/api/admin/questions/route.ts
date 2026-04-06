import { NextResponse } from 'next/server'
import { createAdminClient, createServerClient } from '@/lib/supabase/server'

type ProfileRow = {
  role: string | null
} | null

type CreateQuestionBody = {
  topic_id?: string | null
  lesson_id?: string | null
  question?: string | null
  option_a?: string | null
  option_b?: string | null
  option_c?: string | null
  option_d?: string | null
  correct_options?: string[] | null
  explanation?: string | null
  sort_order?: number | null
  is_published?: boolean | null
}

function normalizeNullableString(value: unknown) {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function normalizeCorrectOptions(value: unknown) {
  if (!Array.isArray(value)) return []
  return [...new Set(value.map((x) => String(x).trim().toUpperCase()).filter(Boolean))].sort()
}

async function requireAdmin() {
  const supabase = await createServerClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { error: 'UNAUTHORIZED', user: null }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  const safeProfile = profile as ProfileRow

  if (safeProfile?.role !== 'admin') {
    return { error: 'FORBIDDEN', user: null }
  }

  return { error: null, user }
}

export async function GET() {
  try {
    const auth = await requireAdmin()

    if (auth.error === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Bạn chưa đăng nhập' }, { status: 401 })
    }

    if (auth.error === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Bạn không có quyền admin' }, { status: 403 })
    }

    const adminClient = createAdminClient()

    const { data, error } = await adminClient
      .from('questions')
      .select(`
        id,
        topic_id,
        lesson_id,
        question,
        option_a,
        option_b,
        option_c,
        option_d,
        correct_options,
        explanation,
        sort_order,
        is_published,
        created_at,
        updated_at,
        topics (
          id,
          title,
          slug
        ),
        lessons (
          id,
          title
        )
      `)
      .order('sort_order', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Có lỗi xảy ra khi tải câu hỏi' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAdmin()

    if (auth.error === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Bạn chưa đăng nhập' }, { status: 401 })
    }

    if (auth.error === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Bạn không có quyền admin' }, { status: 403 })
    }

    const body = (await req.json()) as CreateQuestionBody

    const topic_id = normalizeNullableString(body.topic_id)
    const lesson_id = normalizeNullableString(body.lesson_id)
    const question = normalizeNullableString(body.question)
    const option_a = normalizeNullableString(body.option_a)
    const option_b = normalizeNullableString(body.option_b)
    const option_c = normalizeNullableString(body.option_c)
    const option_d = normalizeNullableString(body.option_d)
    const correct_options = normalizeCorrectOptions(body.correct_options)
    const explanation = normalizeNullableString(body.explanation)
    const sort_order = Number(body.sort_order ?? 0)
    const is_published = Boolean(body.is_published)

    if (!topic_id) {
      return NextResponse.json({ error: 'Thiếu topic_id' }, { status: 400 })
    }

    if (!question) {
      return NextResponse.json({ error: 'Nội dung câu hỏi không được để trống' }, { status: 400 })
    }

    if (!option_a || !option_b) {
      return NextResponse.json({ error: 'Ít nhất phải có đáp án A và B' }, { status: 400 })
    }

    if (correct_options.length === 0) {
      return NextResponse.json({ error: 'Phải chọn ít nhất 1 đáp án đúng' }, { status: 400 })
    }

    const validOptions = ['A', 'B', 'C', 'D']
    const hasInvalid = correct_options.some((item) => !validOptions.includes(item))
    if (hasInvalid) {
      return NextResponse.json({ error: 'correct_options không hợp lệ' }, { status: 400 })
    }

    const adminClient = createAdminClient()

    const payload = {
      topic_id,
      lesson_id,
      question,
      option_a,
      option_b,
      option_c,
      option_d,
      correct_options,
      explanation,
      sort_order: Number.isFinite(sort_order) ? sort_order : 0,
      is_published,
    }

    const { data, error } = await adminClient
      .from('questions')
      .insert(payload)
      .select(`
        id,
        topic_id,
        lesson_id,
        question,
        option_a,
        option_b,
        option_c,
        option_d,
        correct_options,
        explanation,
        sort_order,
        is_published,
        created_at,
        updated_at
      `)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Có lỗi xảy ra khi tạo câu hỏi' },
      { status: 500 }
    )
  }
}