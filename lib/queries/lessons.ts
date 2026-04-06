import { createClient } from '@/lib/supabase/server'

export async function getPublishedLessons() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('lessons')
    .select(`
      id,
      lesson_no,
      title,
      slug,
      short_summary,
      estimated_minutes,
      sort_order,
      lesson_topics (
        is_primary,
        topics (
          id,
          title,
          slug
        )
      )
    `)
    .eq('is_published', true)
    .order('lesson_no', { ascending: true })

  if (error) throw error
  return data ?? []
}

export async function getLessonBySlug(slug: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('lessons')
    .select(`
      id,
      lesson_no,
      title,
      slug,
      summary,
      short_summary,
      estimated_minutes,
      lesson_topics (
        is_primary,
        topics (
          id,
          title,
          slug
        )
      ),
      lesson_documents (
        id,
        title,
        summary,
        content_md,
        reading_minutes,
        sort_order
      ),
      lesson_videos (
        id,
        title,
        video_url,
        youtube_id,
        duration_seconds,
        thumbnail_url,
        sort_order
      )
    `)
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (error) throw error

  const { data: questions, error: qError } = await supabase
    .from('questions')
    .select(`
      id,
      question,
      option_a,
      option_b,
      option_c,
      option_d,
      correct_options,
      explanation,
      sort_order
    `)
    .eq('lesson_id', data.id)
    .eq('is_published', true)
    .order('sort_order', { ascending: true })

  if (qError) throw qError

  return {
    ...data,
    questions: questions ?? [],
  }
}