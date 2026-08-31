import { env } from 'cloudflare:workers';
import SupabaseAdminGate from './supabase-admin-gate';

export const dynamic = 'force-dynamic';

export default function Home() {
  const runtimeEnv = env as unknown as Record<string, string | undefined>;

  return (
    <SupabaseAdminGate
      supabasePublishableKey={runtimeEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? ''}
      supabaseUrl={runtimeEnv.NEXT_PUBLIC_SUPABASE_URL ?? ''}
    />
  );
}
