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
        .replace(/\s+/g, '')
      fetch(`http://localhost:3001/livres${recherchePropre ? '?titre=' + encodeURIComponent(recherchePropre) : ''}`)
        .then(res => res.json())
        .then(data => setLivres(data))
    }, 300)
    return () => clearTimeout(delai)
  }, [recherche])

  return (
    <div style={{ backgroundColor: '#f9f6f1', minHeight: '100vh' }}>
      <header style={{ backgroundColor: '#1a3d2b', padding: '32px 48px', textAlign: 'center' }}>
        <h1 style={{ color: 'white', fontSize: '32px', fontWeight: '700', margin: 0, letterSpacing: '1px' }}>
          Ma Librairie
        </h1>
        <p style={{ color: '#a8d5b5', margin: '8px 0 0', fontSize: '15px' }}>
          Découvrez notre catalogue
        </p>
      </header>

      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '48px 24px', boxSizing: 'border-box' }}>
        <input
          type="text"
          placeholder="Rechercher un livre par titre, auteur..."
          value={recherche}
          onChange={e => setRecherche(e.target.value)}
          style={{
            width: '100%',
            padding: '14px 20px',
            borderRadius: '10px',
            border: '1px solid #ddd',
            fontSize: '16px',
            marginBottom: '40px',
            boxSizing: 'border-box',
            backgroundColor: 'white',
            boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
          }}
        />

        {livres.length === 0 && recherche && (
          <p style={{ textAlign: 'center', color: '#999', marginTop: '40px' }}>
            Aucun livre trouvé pour "{recherche}"
          </p>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '28px' }}>
          {livres.map((livre) => (
            <a key={livre.id} href={`/livres/${livre.id}`} style={{ textDecoration: 'none' }}>
              <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.07)',
                borderTop: '4px solid #1a3d2b',
                cursor: 'pointer',
                transition: 'transform 0.15s ease'
              }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <h2 style={{ fontSize: '17px', fontWeight: '600', marginBottom: '6px', color: '#1a1a1a' }}>{livre.titre}</h2>
                <p style={{ fontSize: '14px', color: '#888', marginBottom: '20px' }}>{livre.auteur}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '20px', fontWeight: '700', color: '#1a3d2b' }}>{livre.prix} €</span>
                  <span style={{ fontSize: '12px', color: '#bbb', backgroundColor: '#f5f5f5', padding: '3px 8px', borderRadius: '20px' }}>
                    Stock : {livre.stock}
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </main>
    </div>
  )
}