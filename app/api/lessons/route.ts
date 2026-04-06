import { NextResponse } from 'next/server'
import { getPublishedLessons } from '@/lib/queries/lessons'

export async function GET() {
  try {
    const lessons = await getPublishedLessons()
    return NextResponse.json({ ok: true, data: lessons })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}