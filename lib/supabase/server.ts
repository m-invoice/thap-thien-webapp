import { createServerClient as createSSRServerClient } from '@supabase/ssr'
import { createClient as createPublicClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set. Vui lòng cấu hình biến môi trường.')
  }

  if (!anonKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set. Vui lòng cấu hình biến môi trường.')
  }

  return createSSRServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        } catch {
          // Bỏ qua khi set cookie trong môi trường không cho phép
        }
      },
    },
  })
}

export async function createServerClient() {
  return createClient()
}

export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set. Vui lòng cấu hình biến môi trường.')
  }

  if (!serviceKey && !anonKey) {
    throw new Error(
      'Không tìm thấy SUPABASE_SERVICE_ROLE_KEY hoặc NEXT_PUBLIC_SUPABASE_ANON_KEY. Vui lòng thiết lập biến môi trường.'
    )
  }

  const key = serviceKey ?? anonKey!

  return createPublicClient(supabaseUrl, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}