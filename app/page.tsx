import Link from 'next/link';

export default function HomePage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        fontFamily: 'system-ui, sans-serif',
        background: '#0A0A0C',
        color: '#F4F4F2',
        padding: 24,
      }}>
      <div style={{ maxWidth: 420, textAlign: 'center' }}>
        <p style={{ letterSpacing: 2, textTransform: 'uppercase', opacity: 0.6, fontSize: 12 }}>
          ByteSize
        </p>
        <h1 style={{ fontSize: 32, margin: '8px 0 16px' }}>Content admin</h1>
        <p style={{ opacity: 0.7, lineHeight: 1.5, marginBottom: 24 }}>
          Edit cards and series locally. Saving writes YAML into <code>content/</code>. Push to{' '}
          <code>main</code> to publish via GitHub Pages.
        </p>
        <Link
          href="/keystatic"
          style={{
            display: 'inline-block',
            background: '#D7F751',
            color: '#0A0A0C',
            padding: '12px 20px',
            borderRadius: 999,
            fontWeight: 700,
            textDecoration: 'none',
          }}>
          Open Keystatic
        </Link>
      </div>
    </main>
  );
}
