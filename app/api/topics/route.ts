import { NextResponse } from 'next/server'
import { getPublishedTopics } from '@/lib/queries/topics'

export async function GET() {
  try {
    const topics = await getPublishedTopics()
    return NextResponse.json({ ok: true, data: topics })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}