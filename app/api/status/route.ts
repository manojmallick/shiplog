import { NextRequest, NextResponse } from 'next/server'
import { getStatus } from '@/lib/queries'
import type { RegionId } from '@/lib/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const region = (request.nextUrl.searchParams.get('region') as RegionId) || 'us-east-1'
  try {
    const payload = await getStatus(region)
    return NextResponse.json(payload, { headers: { 'cache-control': 'no-store' } })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message, region }, { status: 500 })
  }
}
