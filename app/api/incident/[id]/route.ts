import { NextRequest, NextResponse } from 'next/server'
import { getIncident } from '@/lib/queries'
import type { RegionId } from '@/lib/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const region = (request.nextUrl.searchParams.get('region') as RegionId) || 'us-east-1'
  try {
    const incident = await getIncident(region, id)
    if (!incident) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 })
    }
    return NextResponse.json(incident)
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
