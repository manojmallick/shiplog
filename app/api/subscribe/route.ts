import { NextRequest, NextResponse } from 'next/server'
import { subscribe } from '@/lib/queries'
import type { RegionId } from '@/lib/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const region = (request.nextUrl.searchParams.get('region') as RegionId) || 'us-east-1'
  const body = await request.json()
  const { email } = body

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
  }

  try {
    const result = await subscribe(region, email)
    return NextResponse.json({ ...result, email })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
