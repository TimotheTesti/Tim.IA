import { NextResponse } from 'next/server'
import { createSupabaseUserClient } from '@/lib/supabase-user'

function getBearerToken(request: Request) {
  const a = request.headers.get('authorization')
  return a?.startsWith('Bearer ') ? a.slice(7) : null
}

export async function GET(request: Request) {
  const token = getBearerToken(request)
  const supabase = token ? createSupabaseUserClient(token) : null
  if (!supabase) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('user_memory_entries')
    .select('id, content, created_at')
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
  return NextResponse.json({ entries: data ?? [] })
}

export async function DELETE(request: Request) {
  const token = getBearerToken(request)
  const supabase = token ? createSupabaseUserClient(token) : null
  if (!supabase) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: userRes } = await supabase.auth.getUser()
  const userId = userRes.user?.id
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { error } = await supabase
    .from('user_memory_entries')
    .delete()
    .eq('user_id', userId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
