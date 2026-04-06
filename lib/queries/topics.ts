import { createServerClient } from '@/lib/supabase/server'

export async function getPublishedTopics() {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('topic_tree_view')
    .select('*')
    .order('level', { ascending: true })
    .order('sort_order', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return data ?? []
}