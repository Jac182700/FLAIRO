'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import ControlCenter from './control-center';

type AdminRole = 'owner' | 'admin' | 'operations';

type FlairoAdminProfile = {
  id: string;
  email: string;
  fullName: string;
  role: AdminRole;
  status: 'active' | 'invited' | 'disabled';
};

type AdminSession = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  profile: FlairoAdminProfile;
};

type AuthResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  user?: {
    email?: string;
  };
  error?: string;
  error_description?: string;
  msg?: string;
};

const ADMIN_SESSION_STORAGE_KEY = 'flairo-control-center-admin-session-v1';
const adminRoles = new Set<string>(['owner', 'admin', 'operations']);

function normalizeSupabaseUrl(url: string) {
  return url.trim().replace(/\/$/, '');
}

function authorizationHeaders(accessToken: string) {
  return {
    Authorization: `Bearer ${accessToken}`,
  };
}

function authErrorMessage(data: AuthResponse, fallback: string) {
  return data.error_description || data.msg || data.error || fallback;
}

async function readJsonResponse<T>(response: Response) {
  const text = await response.text();
  if (!text) return {} as T;

  try {
    return JSON.parse(text) as T;
  } catch {
    return {} as T;
  }
}

async function loadAdminProfile(
  supabaseUrl: string,
  supabasePublishableKey: string,
  accessToken: string,
  emailHint: string,
) {
  const headers = {
    ...authorizationHeaders(accessToken),
    apikey: supabasePublishableKey,
    'Content-Type': 'application/json',
  };

  const profileResponse = await fetch(
    `${supabaseUrl}/rest/v1/flairo_app_users?select=id,email,full_name,role,status&email=eq.${encodeURIComponent(emailHint.toLowerCase())}&limit=1`,
    {
      headers: {
        ...headers,
        Accept: 'application/json',
      },
    },
  );

  if (!profileResponse.ok) {
    throw new Error('FLAIRO could not verify this administrator profile yet.');
  }

  const rows = await readJsonResponse<Array<{
    id: string;
    email: string;
    full_name: string;
    role: string;
    status: 'active' | 'invited' | 'disabled';
  }>>(profileResponse);
  const profile = rows[0];

  if (!profile || profile.status !== 'active' || !adminRoles.has(profile.role)) {
    throw new Error('This email is signed in, but it is not approved for FLAIRO Admin access.');
  }

  return {
    email: profile.email,
    fullName: profile.full_name,
    id: profile.id,
    role: profile.role as AdminRole,
    status: profile.status,
  };
}

async function createSession(
  supabaseUrl: string,
  supabasePublishableKey: string,
  email: string,
  password: string,
) {
  const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    body: JSON.stringify({ email, password }),
    headers: {
      apikey: supabasePublishableKey,
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });
  const data = await readJsonResponse<AuthResponse>(response);

  if (!response.ok || !data.access_token || !data.refresh_token) {
    throw new Error(authErrorMessage(data, 'FLAIRO Admin sign-in failed.'));
  }

  const signedInEmail = data.user?.email ?? email;
  const profile = await loadAdminProfile(
    supabaseUrl,
    supabasePublishableKey,
    data.access_token,
    signedInEmail,
  );

  return {
    accessToken: data.access_token,
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
    profile,
    refreshToken: data.refresh_token,
  };
}

async function refreshSession(
  supabaseUrl: string,
  supabasePublishableKey: string,
  storedSession: AdminSession,
) {
  const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
    body: JSON.stringify({ refresh_token: storedSession.refreshToken }),
    headers: {
      apikey: supabasePublishableKey,
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });
  const data = await readJsonResponse<AuthResponse>(response);

  if (!response.ok || !data.access_token || !data.refresh_token) {
    throw new Error(authErrorMessage(data, 'FLAIRO Admin session expired.'));
  }

  const profile = await loadAdminProfile(
    supabaseUrl,
    supabasePublishableKey,
    data.access_token,
    data.user?.email ?? storedSession.profile.email,
  );

  return {
    accessToken: data.access_token,
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
    profile,
    refreshToken: data.refresh_token,
  };
}

function readStoredSession() {
  try {
    const raw = window.localStorage.getItem(ADMIN_SESSION_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AdminSession) : null;
  } catch {
    return null;
  }
}

function writeStoredSession(session: AdminSession | null) {
  if (session) {
    window.localStorage.setItem(ADMIN_SESSION_STORAGE_KEY, JSON.stringify(session));
    return;
  }

  window.localStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
}

export default function SupabaseAdminGate({
  supabasePublishableKey,
  supabaseUrl,
}: {
  supabasePublishableKey: string;
  supabaseUrl: string;
}) {
  const normalizedSupabaseUrl = useMemo(() => normalizeSupabaseUrl(supabaseUrl), [supabaseUrl]);
  const [session, setSession] = useState<AdminSession | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState('info@flairo.org');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const hasSupabaseConfig = Boolean(normalizedSupabaseUrl && supabasePublishableKey);

  useEffect(() => {
    let active = true;
    const markReady = () => {
      if (active) setReady(true);
    };

    if (!hasSupabaseConfig) {
      queueMicrotask(markReady);
      return () => {
        active = false;
      };
    }

    const storedSession = readStoredSession();

    if (!storedSession) {
      queueMicrotask(markReady);
      return () => {
        active = false;
      };
    }

    refreshSession(normalizedSupabaseUrl, supabasePublishableKey, storedSession)
      .then((freshSession) => {
        if (!active) return;
        writeStoredSession(freshSession);
        setSession(freshSession);
      })
      .catch((error: Error) => {
        if (!active) return;
        writeStoredSession(null);
        setMessage(error.message);
      })
      .finally(() => {
        markReady();
      });

    return () => {
      active = false;
    };
  }, [hasSupabaseConfig, normalizedSupabaseUrl, supabasePublishableKey]);

  const signOut = async () => {
    const currentToken = session?.accessToken;
    writeStoredSession(null);
    setSession(null);
    setPassword('');
    setMessage('Signed out of FLAIRO Admin.');

    if (!currentToken || !hasSupabaseConfig) return;

    await fetch(`${normalizedSupabaseUrl}/auth/v1/logout`, {
      headers: {
        Authorization: `Bearer ${currentToken}`,
        apikey: supabasePublishableKey,
      },
      method: 'POST',
    }).catch(() => undefined);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!hasSupabaseConfig) return;

    setBusy(true);
    setMessage('');

    try {
      const nextSession = await createSession(
        normalizedSupabaseUrl,
        supabasePublishableKey,
        email.trim(),
        password,
      );
      writeStoredSession(nextSession);
      setSession(nextSession);
      setPassword('');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'FLAIRO Admin sign-in failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleAccessRejected = () => {
    writeStoredSession(null);
    setSession(null);
    setMessage('Your FLAIRO Admin session needs a fresh sign-in.');
  };

  if (!ready) {
    return (
      <main className="admin-auth-shell">
        <section className="admin-auth-card">
          <p className="eyebrow gold">FLAIRO Admin</p>
          <h1>Checking secure access</h1>
          <p>One moment while FLAIRO confirms your administrator session.</p>
        </section>
      </main>
    );
  }

  if (session) {
    return (
      <ControlCenter
        authToken={session.accessToken}
        onAccessRejected={handleAccessRejected}
        onSignOut={signOut}
        viewerEmail={session.profile.email}
        viewerName={session.profile.fullName || 'FLAIRO Administrator'}
      />
    );
  }

  return (
    <main className="admin-auth-shell">
      <section className="admin-auth-card">
        <div className="admin-auth-brand">
          <img alt="" className="brand-mark" src="/flairo-assets/flairo-app-icon-gold.png" />
          <div>
            <p className="brand-name">Flairo</p>
            <p className="brand-subtitle">Admin Control</p>
          </div>
        </div>

        <p className="eyebrow gold">FLAIRO Admin</p>
        <h1>Sign in to manage the Control Center.</h1>
        <p>
          This public page uses Supabase login before any resident, vendor, invoice,
          or Plume Point controls are available.
        </p>

        {!hasSupabaseConfig && (
          <div className="admin-auth-alert">
            Supabase is not connected for this deployment yet. Add the public Supabase URL and publishable key to the Site environment settings.
          </div>
        )}

        {message && <div className="admin-auth-alert">{message}</div>}

        <form className="admin-auth-form" onSubmit={handleSubmit}>
          <label>
            <span>Email</span>
            <input
              autoComplete="email"
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
          </label>
          <label>
            <span>Password</span>
            <input
              autoComplete="current-password"
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </label>
          <button disabled={busy || !hasSupabaseConfig} type="submit">
            {busy ? 'Verifying access' : 'Sign in to FLAIRO Admin'}
          </button>
        </form>

        <p className="admin-auth-note">
          Approved owner and admin profiles are managed in Supabase. Contact info@flairo.org if an account needs access.
        </p>
      </section>
    </main>
  );
}
