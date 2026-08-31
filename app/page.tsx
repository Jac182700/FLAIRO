import { requireChatGPTUser } from './chatgpt-auth';
import ControlCenter from './control-center';

export const dynamic = 'force-dynamic';

const allowedControlCenterEmails = new Set([
  'jacquelyn.heflin@risere.com',
  'info@flairo.org',
]);

export default async function Home() {
  const viewer = await requireChatGPTUser('/');

  if (!allowedControlCenterEmails.has(viewer.email.toLowerCase())) {
    return (
      <main
        style={{
          alignItems: 'center',
          background: '#0D0D0F',
          color: '#F7F4EF',
          display: 'flex',
          fontFamily: 'system-ui, sans-serif',
          minHeight: '100vh',
          padding: 24,
        }}
      >
        <section
          style={{
            border: '1px solid #3B3332',
            borderRadius: 8,
            maxWidth: 520,
            padding: 24,
          }}
        >
          <p style={{ color: '#F0D58A', fontSize: 12, fontWeight: 800, letterSpacing: 1 }}>
            FLAIRO ADMIN
          </p>
          <h1 style={{ color: '#F786C7', fontSize: 34, margin: '8px 0' }}>
            Access needs approval.
          </h1>
          <p style={{ color: '#D9D2C8', lineHeight: 1.6 }}>
            This control center is restricted to approved FLAIRO administrator accounts.
            Contact info@flairo.org if this account should be added.
          </p>
        </section>
      </main>
    );
  }

  return (
    <ControlCenter
      viewerEmail="info@flairo.org"
      viewerName="FLAIRO ADMIN"
    />
  );
}
