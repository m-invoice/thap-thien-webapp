import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
  }

  const body = await req.json()

  const { score, total, topicTitle } = body

  // tìm topic theo title
  const { data: topic } = await supabase
    .from('topics')
    .select('id')
    .eq('title', topicTitle)
    .single()

  const { data, error } = await supabase
    .from('quiz_attempts')
    .insert({
      user_id: user.id,
      topic_id: topic?.id,
      score,
      total,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ id: data.id })
}