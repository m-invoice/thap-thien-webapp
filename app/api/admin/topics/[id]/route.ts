import { NextResponse } from 'next/server'
import { createAdminClient, createServerClient } from '@/lib/supabase/server'

type ProfileRow = {
  role: string | null
} | null

type UpdateTopicBody = {
  title?: string | null
  slug?: string | null
  description?: string | null
  sort_order?: number | null
  is_published?: boolean | null
}

function normalizeNullableString(value: unknown) {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
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

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin()

    if (auth.error === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Bạn chưa đăng nhập' }, { status: 401 })
    }

    if (auth.error === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Bạn không có quyền admin' }, { status: 403 })
    }

    const { id } = await params
    const adminClient = createAdminClient()

    const { data, error } = await adminClient
      .from('topics')
      .select(`
        id,
        title,
        slug,
        description,
        sort_order,
        is_published,
        created_at,
        updated_at
      `)
      .eq('id', id)
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Không tìm thấy chủ đề' }, { status: 404 })
    }

    return NextResponse.json({ data }, { status: 200 })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Có lỗi xảy ra khi tải chủ đề',
      },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin()

    if (auth.error === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Bạn chưa đăng nhập' }, { status: 401 })
    }

    if (auth.error === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Bạn không có quyền admin' }, { status: 403 })
    }

    const { id } = await params
    const body = (await req.json()) as UpdateTopicBody

    const title = normalizeNullableString(body.title)
    const slug = normalizeNullableString(body.slug)
    const description = normalizeNullableString(body.description)
    const sort_order = Number(body.sort_order ?? 0)
    const is_published = Boolean(body.is_published)

    if (!title) {
      return NextResponse.json({ error: 'Tên chủ đề không được để trống' }, { status: 400 })
    }

    if (!slug) {
      return NextResponse.json({ error: 'Slug không được để trống' }, { status: 400 })
    }

    const adminClient = createAdminClient()

    const { data: exists, error: checkError } = await adminClient
      .from('topics')
      .select('id')
      .eq('id', id)
      .maybeSingle()

    if (checkError) {
      return NextResponse.json({ error: checkError.message }, { status: 400 })
    }

    if (!exists) {
      return NextResponse.json({ error: 'Chủ đề không tồn tại' }, { status: 404 })
    }

    const { data: existingSlug, error: slugError } = await adminClient
      .from('topics')
      .select('id')
      .eq('slug', slug)
      .neq('id', id)
      .maybeSingle()

    if (slugError) {
      return NextResponse.json({ error: slugError.message }, { status: 400 })
    }

    if (existingSlug) {
      return NextResponse.json({ error: 'Slug đã tồn tại, vui lòng chọn slug khác' }, { status: 400 })
    }

    const payload = {
      title,
      slug,
      description,
      sort_order: Number.isFinite(sort_order) ? sort_order : 0,
      is_published,
    }

    const { data, error } = await adminClient
      .from('topics')
      .update(payload)
      .eq('id', id)
      .select(`
        id,
        title,
        slug,
        description,
        sort_order,
        is_published,
        created_at,
        updated_at
      `)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ data }, { status: 200 })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Có lỗi xảy ra khi cập nhật chủ đề',
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin()

    if (auth.error === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Bạn chưa đăng nhập' }, { status: 401 })
    }

    if (auth.error === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Bạn không có quyền admin' }, { status: 403 })
    }

    const { id } = await params
    const adminClient = createAdminClient()

    const { data: exists, error: checkError } = await adminClient
      .from('topics')
      .select('id')
      .eq('id', id)
      .maybeSingle()

    if (checkError) {
      return NextResponse.json({ error: checkError.message }, { status: 400 })
    }

    if (!exists) {
      return NextResponse.json({ error: 'Chủ đề không tồn tại' }, { status: 404 })
    }

    const { error } = await adminClient
      .from('topics')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Có lỗi xảy ra khi xóa chủ đề',
      },
      { status: 500 }
    )
  }
}