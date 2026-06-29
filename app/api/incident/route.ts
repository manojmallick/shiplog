import { NextRequest, NextResponse } from 'next/server'
import { createIncident, listIncidents } from '@/lib/queries'
import { OccConflict } from '@/lib/occ'
import type { RegionId, Severity } from '@/lib/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const region = (request.nextUrl.searchParams.get('region') as RegionId) || 'us-east-1'
  try {
    return NextResponse.json(await listIncidents(region))
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const region = (request.nextUrl.searchParams.get('region') as RegionId) || 'us-east-1'
  const body = await request.json()
  const { title, message, severity, author } = body

  if (!title || !message) {
    return NextResponse.json({ error: 'title and message are required' }, { status: 400 })
  }

  try {
    const { incident, result } = await createIncident(region, {
      title,
      message,
      severity: (severity as Severity) || 'minor',
      author: author || 'On-call engineer',
    })
    return NextResponse.json({ incident, result }, { status: 201 })
  } catch (e) {
    if (e instanceof OccConflict) {
      return NextResponse.json({ error: 'write conflict — please retry', conflict: true }, { status: 409 })
    }
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
