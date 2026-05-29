import { NextRequest, NextResponse } from 'next/server';
import { rateLimitRequest, rejectCrossOriginPost } from '@/lib/request-security';
import { createSupabaseServerClient } from '@/lib/supabase-server';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function readArchiveState(request: NextRequest) {
  try {
    const body = (await request.json()) as { archived?: unknown };
    return typeof body.archived === 'boolean' ? body.archived : null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const originError = rejectCrossOriginPost(request);
  if (originError) return originError;

  const { id } = await params;

  if (!UUID_PATTERN.test(id)) {
    return NextResponse.json({ error: 'Invalid invoice id.' }, { status: 400 });
  }

  const archived = await readArchiveState(request);

  if (archived === null) {
    return NextResponse.json({ error: 'Archive state is required.' }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rateLimitError = rateLimitRequest(`invoice:archive:${user.id}`, {
    limit: 20,
    windowMs: 60_000,
  });
  if (rateLimitError) return rateLimitError;

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('invoices')
    .update({
      archived_at: archived ? now : null,
      updated_at: now,
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select('id,archived_at')
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: 'Invoice archive update failed.' }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: 'Invoice not found.' }, { status: 404 });
  }

  return NextResponse.json(data);
}
