import { createAdminClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

type ImportRow = {
  topic_slug: string
  question: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_option: string
  explanation?: string
  sort_order?: number
  is_published?: boolean
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const adminSupabase = createAdminClient()

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

    const body = await req.json()
    const rows: ImportRow[] = Array.isArray(body.rows) ? body.rows : []

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'Không có dữ liệu để import' },
        { status: 400 }
      )
    }

    const topicSlugs = [...new Set(rows.map((row) => row.topic_slug).filter(Boolean))]

    const { data: topics, error: topicsError } = await supabase
      .from('topics')
      .select('id, slug')
      .in('slug', topicSlugs)

    if (topicsError) {
      return NextResponse.json(
        { error: `Lỗi đọc chủ đề: ${topicsError.message}` },
        { status: 500 }
      )
    }

    const topicMap = new Map<string, string>()
    for (const topic of topics || []) {
      topicMap.set(topic.slug, topic.id)
    }

    const invalidSlugs = topicSlugs.filter((slug) => !topicMap.has(slug))
    if (invalidSlugs.length > 0) {
      return NextResponse.json(
        {
          error: `Không tìm thấy topic_slug: ${invalidSlugs.join(', ')}`,
        },
        { status: 400 }
      )
    }

    const validOptions = new Set(['A', 'B', 'C', 'D'])

    const insertRows = rows.map((row, index) => {
      const correctOption = String(row.correct_option || '')
        .trim()
        .toUpperCase()

      if (!validOptions.has(correctOption)) {
        throw new Error(
          `Dòng ${index + 1}: correct_option phải là A, B, C hoặc D`
        )
      }

      return {
        topic_id: topicMap.get(row.topic_slug)!,
        question: String(row.question || '').trim(),
        option_a: String(row.option_a || '').trim(),
        option_b: String(row.option_b || '').trim(),
        option_c: String(row.option_c || '').trim(),
        option_d: String(row.option_d || '').trim(),
        correct_option: correctOption,
        correct_options: [correctOption],
        explanation: String(row.explanation || '').trim(),
        sort_order: Number(row.sort_order || 0),
        is_published:
          typeof row.is_published === 'boolean' ? row.is_published : true,
      }
    })

    const missingRequired = insertRows.findIndex(
      (row) =>
        !row.topic_id ||
        !row.question ||
        !row.option_a ||
        !row.option_b ||
        !row.option_c ||
        !row.option_d ||
        !row.correct_option
    )

    if (missingRequired >= 0) {
      return NextResponse.json(
        {
          error: `Dòng ${missingRequired + 1} thiếu dữ liệu bắt buộc`,
        },
        { status: 400 }
      )
    }

    const { error: insertError } = await adminSupabase
      .from('questions')
      .insert(insertRows)

    if (insertError) {
      return NextResponse.json(
        { error: `Lỗi insert: ${insertError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      insertedCount: insertRows.length,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Lỗi server khi import câu hỏi'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}