async function getLivre(id) {
  const res = await fetch(`http://localhost:3001/livres/${id}`, { cache: 'no-store' })
  if (!res.ok) return null
  return res.json()
}

export default async function LivrePage({ params }) {
  const { id } = await params
  const livre = await getLivre(id)

  if (!livre) {
    return (
      <div style={{ backgroundColor: '#f9f6f1', minHeight: '100vh' }}>
        <header style={{ backgroundColor: '#1a3d2b', padding: '32px 48px', textAlign: 'center' }}>
          <h1 style={{ color: 'white', fontSize: '32px', fontWeight: '700', margin: 0 }}>Ma Librairie</h1>
        </header>
        <main style={{ maxWidth: '800px', margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
          <p style={{ color: '#999', fontSize: '18px' }}>Livre non trouvé.</p>
          <a href="/" style={{ color: '#1a3d2b', fontWeight: '600' }}>Retour au catalogue</a>
        </main>
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: '#f9f6f1', minHeight: '100vh' }}>
      <header style={{ backgroundColor: '#1a3d2b', padding: '32px 48px', textAlign: 'center' }}>
        <a href="/" style={{ color: '#a8d5b5', fontSize: '14px', textDecoration: 'none' }}>
          ← Retour au catalogue
        </a>
        <h1 style={{ color: 'white', fontSize: '32px', fontWeight: '700', margin: '8px 0 0' }}>Ma Librairie</h1>
      </header>

      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '48px 24px', boxSizing: 'border-box' }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '40px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          borderTop: '6px solid #1a3d2b'
        }}>
          <h2 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px', color: '#1a1a1a' }}>
            {livre.titre}
          </h2>
          <p style={{ fontSize: '18px', color: '#666', marginBottom: '32px' }}>{livre.auteur}</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '32px' }}>
            <div style={{ backgroundColor: '#f9f6f1', borderRadius: '10px', padding: '16px' }}>
              <p style={{ fontSize: '12px', color: '#999', margin: '0 0 4px' }}>Prix</p>
              <p style={{ fontSize: '24px', fontWeight: '700', color: '#1a3d2b', margin: 0 }}>{livre.prix} €</p>
            </div>
            <div style={{ backgroundColor: '#f9f6f1', borderRadius: '10px', padding: '16px' }}>
              <p style={{ fontSize: '12px', color: '#999', margin: '0 0 4px' }}>Stock disponible</p>
              <p style={{ fontSize: '24px', fontWeight: '700', color: '#1a1a1a', margin: 0 }}>{livre.stock} exemplaires</p>
            </div>
          </div>

          <div style={{ backgroundColor: '#f9f6f1', borderRadius: '10px', padding: '16px', marginBottom: '32px' }}>
            <p style={{ fontSize: '12px', color: '#999', margin: '0 0 4px' }}>ISBN</p>
            <p style={{ fontSize: '16px', color: '#444', margin: 0 }}>{livre.isbn}</p>
          </div>

          <button style={{
            backgroundColor: '#1a3d2b',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            padding: '14px 32px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            width: '100%'
          }}>
            Réserver ce livre
          </button>
        </div>
      </main>
    </div>
  )
}