import { NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase/server'

type ProfileRow = {
  role: string | null
} | null

type CreateLessonBody = {
  topic_id?: string | null
  title?: string | null
  slug?: string | null
  lesson_no?: number | null
  summary?: string | null
  content?: string | null
  sort_order?: number | null
  is_published?: boolean | null
}

function normalizeNullableString(value: unknown) {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function normalizeNullableNumber(value: unknown) {
  if (value === null || value === undefined || value === '') return null
  const num = Number(value)
  return Number.isFinite(num) ? num : null
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
      .from('lessons')
      .select(`
        id,
        topic_id,
        title,
        slug,
        lesson_no,
        summary,
        content,
        sort_order,
        is_published,
        created_at,
        updated_at,
        topics (
          id,
          title,
          slug
        )
      `)
      .order('sort_order', { ascending: true })
      .order('lesson_no', { ascending: true, nullsFirst: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Có lỗi xảy ra khi tải bài giảng',
      },
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

    const body = (await req.json()) as CreateLessonBody

    const topic_id = normalizeNullableString(body.topic_id)
    const title = normalizeNullableString(body.title)
    const slug = normalizeNullableString(body.slug)
    const summary = normalizeNullableString(body.summary)
    const content = normalizeNullableString(body.content)
    const lesson_no = normalizeNullableNumber(body.lesson_no)
    const sort_order = normalizeNullableNumber(body.sort_order) ?? 0
    const is_published = Boolean(body.is_published)

    if (!topic_id) {
      return NextResponse.json({ error: 'Thiếu topic_id' }, { status: 400 })
    }

    if (!title) {
      return NextResponse.json({ error: 'Tiêu đề bài giảng không được để trống' }, { status: 400 })
    }

    const adminClient = createAdminClient()

    const { data: topicExists, error: topicError } = await adminClient
      .from('topics')
      .select('id')
      .eq('id', topic_id)
      .maybeSingle()

    if (topicError) {
      return NextResponse.json({ error: topicError.message }, { status: 400 })
    }

    if (!topicExists) {
      return NextResponse.json({ error: 'Chủ đề không tồn tại' }, { status: 400 })
    }

    if (slug) {
      const { data: existingSlug, error: slugError } = await adminClient
        .from('lessons')
        .select('id')
        .eq('slug', slug)
        .maybeSingle()

      if (slugError) {
        return NextResponse.json({ error: slugError.message }, { status: 400 })
      }

      if (existingSlug) {
        return NextResponse.json({ error: 'Slug đã tồn tại, vui lòng chọn slug khác' }, { status: 400 })
      }
    }

    const payload = {
        topic_id,
        title,
        slug,
        lesson_no,
        summary,
        content,
        sort_order,
        is_published,
    }

    const { data, error } = await adminClient
      .from('lessons')
      .insert(payload)
      .select(`
        id,
        topic_id,
        title,
        slug,
        lesson_no,
        summary,
        content,
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
      {
        error: error instanceof Error ? error.message : 'Có lỗi xảy ra khi tạo bài giảng',
      },
      { status: 500 }
    )
  }
}