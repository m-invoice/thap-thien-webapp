import { createClient } from '@/lib/supabase/server'

export async function isAdmin() {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { ok: false, user: null, role: null }
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return { ok: false, user, role: null }
  }

  return {
    ok: profile.role === 'admin',
    user,
    role: profile.role,
  }
}