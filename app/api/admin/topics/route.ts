import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('topics')
      .select('id, title, slug, sort_order')
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Supabase topics error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: data || [] })
  } catch (error: unknown) {
    console.error('GET /api/admin/topics crash:', error)
    const message = error instanceof Error ? error.message : 'Không lấy được danh sách chủ đề'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}