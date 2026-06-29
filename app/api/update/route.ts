import { NextRequest, NextResponse } from 'next/server'
import { postUpdate } from '@/lib/queries'
import { OccConflict } from '@/lib/occ'
import type { IncidentStatus, RegionId } from '@/lib/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const region = (request.nextUrl.searchParams.get('region') as RegionId) || 'us-east-1'
  const body = await request.json()
  const { incident_id, message, status, author } = body

  if (!incident_id || !message) {
    return NextResponse.json({ error: 'incident_id and message are required' }, { status: 400 })
  }

  try {
    const updated = await postUpdate(region, {
      incidentId: incident_id,
      message,
      status: (status as IncidentStatus) || null,
      author: author || 'On-call engineer',
    })
    if (!updated) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 })
    }
    return NextResponse.json(updated)
  } catch (e) {
    if (e instanceof OccConflict) {
      return NextResponse.json({ error: 'write conflict — please retry', conflict: true }, { status: 409 })
    }
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
