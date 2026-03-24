'use client'

import { useState, useEffect } from 'react'

export default function Home() {
  const [livres, setLivres] = useState([])
  const [recherche, setRecherche] = useState('')

  useEffect(() => {
    const delai = setTimeout(() => {
      const recherchePropre = recherche
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9 ]/g, '')
      fetch(`http://localhost:3001/livres${recherchePropre ? '?titre=' + encodeURIComponent(recherchePropre) : ''}`)
        .then(res => res.json())
        .then(data => setLivres(data))
    }, 300)
    return () => clearTimeout(delai)
  }, [recherche])

  return (
    <div style={{ backgroundColor: '#f9f6f1', minHeight: '100vh' }}>
      <header style={{ backgroundColor: '#1a3d2b', padding: '24px 48px' }}>
        <h1 style={{ color: 'white', fontSize: '28px', fontWeight: '600', margin: 0 }}>
          Ma Librairie
        </h1>
        <p style={{ color: '#a8d5b5', margin: '4px 0 0', fontSize: '14px' }}>
          Découvrez notre catalogue
        </p>
      </header>

      <main style={{ maxWidth: '960px', margin: '0 auto', padding: '40px 24px' }}>
        <input
          type="text"
          placeholder="Rechercher un livre..."
          value={recherche}
          onChange={e => setRecherche(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: '8px',
            border: '1px solid #ddd',
            fontSize: '16px',
            marginBottom: '32px',
            boxSizing: 'border-box'
          }}
        />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '24px' }}>
          {livres.map((livre) => (
            <div key={livre.id} style={{
              backgroundColor: 'white',
              borderRadius: '10px',
              padding: '20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              borderTop: '4px solid #1a3d2b'
            }}>
              <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '6px' }}>{livre.titre}</h2>
              <p style={{ fontSize: '13px', color: '#888', marginBottom: '16px' }}>{livre.auteur}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '18px', fontWeight: '700', color: '#1a3d2b' }}>{livre.prix} €</span>
                <span style={{ fontSize: '12px', color: '#aaa' }}>Stock : {livre.stock}</span>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}