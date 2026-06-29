import { NextRequest, NextResponse } from 'next/server'
import { setComponentStatus } from '@/lib/queries'
import { OccConflict } from '@/lib/occ'
import type { ComponentStatus, RegionId } from '@/lib/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const region = (request.nextUrl.searchParams.get('region') as RegionId) || 'us-east-1'
  const body = await request.json()
  const { component_id, status } = body

  if (!component_id || !status) {
    return NextResponse.json({ error: 'component_id and status are required' }, { status: 400 })
  }

  try {
    const updated = await setComponentStatus(region, {
      componentId: component_id,
      status: status as ComponentStatus,
    })
    if (!updated) {
      return NextResponse.json({ error: 'Component not found' }, { status: 404 })
    }
    return NextResponse.json(updated)
  } catch (e) {
    if (e instanceof OccConflict) {
      return NextResponse.json({ error: 'write conflict — please retry', conflict: true }, { status: 409 })
    }
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
