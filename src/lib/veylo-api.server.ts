import { createClient } from '@supabase/supabase-js';

function supabaseFetch(key: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(typeof Request !== 'undefined' && input instanceof Request ? input.headers : undefined);
    if (init?.headers) new Headers(init.headers).forEach((value, name) => headers.set(name, value));
    headers.set('apikey', key);
    if (key.startsWith('sb_publishable_') && headers.get('Authorization') === `Bearer ${key}`) headers.delete('Authorization');
    return fetch(input, { ...init, headers });
  };
}

export async function authenticate(request: Request) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  const authorization = request.headers.get('authorization') ?? '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  if (!url || !key || !token) return null;
  const authClient = createClient(url, key, {
    global: { fetch: supabaseFetch(key), headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await authClient.auth.getClaims(token);
  if (error || typeof data.claims?.sub !== 'string') return null;
  return { userId: data.claims.sub, token };
}

export function adminDb() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase server environment is incomplete');
  return createClient(url, key, {
    global: { fetch: supabaseFetch(key) },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { 'cache-control': 'no-store' } });
}

export async function readObject(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const data = await request.json();
    return data && typeof data === 'object' && !Array.isArray(data) ? data as Record<string, unknown> : null;
  } catch {
    return null;
  }
}

export async function ownedClient(db: ReturnType<typeof adminDb>, userId: string) {
  return db.from('veylo_clients').select('*').eq('user_id', userId).maybeSingle();
}

export async function activeClient(request: Request) {
  const auth = await authenticate(request);
  if (!auth) return { response: json({ error: 'Unauthorized' }, 401) } as const;
  const db = adminDb();
  const { data: client, error } = await ownedClient(db, auth.userId);
  if (error || !client) return { response: json({ error: 'WhatsApp is not configured' }, 404) } as const;
  return { auth, db, client } as const;
}

