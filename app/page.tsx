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
      fetch('http://localhost:3001/livres' + (recherchePropre ? '?titre=' + encodeURIComponent(recherchePropre) : ''))
        .then(res => res.json())
        .then(data => setLivres(data))
    }, 300)
    return () => clearTimeout(delai)
  }, [recherche])

  const adresseMap = '42+rue+laugier+75017+Paris'

  return (
    <div style={{ backgroundColor: '#f9f6f1', minHeight: '100vh', fontFamily: 'Georgia, serif' }}>

      <header style={{ backgroundColor: '#1a3d2b' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px 24px 0', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
            <div>
              <h1 style={{ color: 'white', fontSize: '36px', fontWeight: '700', margin: 0, letterSpacing: '2px' }}>BOOKDOG</h1>
              <p style={{ color: '#a8d5b5', fontSize: '13px', margin: '4px 0 0', letterSpacing: '1px' }}>Librairie independante — Paris 17e</p>
            </div>
            <nav style={{ display: 'flex', gap: '32px' }}>
              <a href="#catalogue" style={{ color: '#a8d5b5', textDecoration: 'none', fontSize: '14px', letterSpacing: '0.5px' }}>Catalogue</a>
              <a href="/click-collect" style={{ color: '#a8d5b5', textDecoration: 'none', fontSize: '14px', letterSpacing: '0.5px' }}>Click and Collect</a>
              <a href="#infos" style={{ color: '#a8d5b5', textDecoration: 'none', fontSize: '14px', letterSpacing: '0.5px' }}>Infos pratiques</a>
              <a href="/compte/connexion" style={{ color: '#a8d5b5', textDecoration: 'none', fontSize: '14px', letterSpacing: '0.5px' }}>Mon compte</a>
            </nav>
          </div>

          <div style={{ display: 'flex', gap: '40px', padding: '16px 0', flexWrap: 'wrap' }}>
            <a href={'https://www.google.com/maps/search/?api=1&query=' + adresseMap} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#a8d5b5', textDecoration: 'none', fontSize: '13px' }}>
              42 rue Laugier, 75017 Paris
            </a>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#a8d5b5', fontSize: '13px' }}>
              Lun-Sam : 10h-20h
            </div>
            <a href="tel:0677402151" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#a8d5b5', textDecoration: 'none', fontSize: '13px' }}>
              06 77 40 21 51
            </a>
            <a href="mailto:Bookdog@librairie.com" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#a8d5b5', textDecoration: 'none', fontSize: '13px' }}>
              Bookdog@librairie.com
            </a>
          </div>
        </div>
      </header>

      <div style={{ backgroundColor: '#1a3d2b', paddingBottom: '60px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '60px 24px 0', boxSizing: 'border-box', textAlign: 'center' }}>
          <p style={{ color: '#a8d5b5', fontSize: '14px', letterSpacing: '2px', marginBottom: '16px' }}>Bienvenue chez Bookdog</p>
          <h2 style={{ color: 'white', fontSize: '48px', fontWeight: '700', margin: '0 0 20px', lineHeight: '1.2' }}>
            Des livres choisis avec passion
          </h2>
          <p style={{ color: '#a8d5b5', fontSize: '16px', maxWidth: '520px', margin: '0 auto 40px', lineHeight: '1.8' }}>
            Librairie independante au coeur du 17e arrondissement. Venez decouvrir notre selection ou reservez en ligne.
          </p>
          <a href="#catalogue" style={{ display: 'inline-block', backgroundColor: 'white', color: '#1a3d2b', padding: '14px 36px', borderRadius: '40px', fontWeight: '700', fontSize: '15px', textDecoration: 'none' }}>
            Decouvrir le catalogue
          </a>
        </div>
      </div>

      <div style={{ backgroundColor: '#1a3d2b', height: '40px', borderRadius: '0 0 50% 50% / 0 0 40px 40px' }} />

      <main id="catalogue" style={{ maxWidth: '1100px', margin: '0 auto', padding: '60px 24px', boxSizing: 'border-box' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <p style={{ color: '#1a3d2b', fontSize: '12px', letterSpacing: '2px', marginBottom: '8px' }}>Notre selection</p>
          <h2 style={{ fontSize: '32px', fontWeight: '700', color: '#1a1a1a', margin: 0 }}>Le catalogue</h2>
        </div>

        <input
          type="text"
          placeholder="Rechercher un livre par titre, auteur..."
          value={recherche}
          onChange={e => setRecherche(e.target.value)}
          style={{ width: '100%', padding: '14px 20px', borderRadius: '40px', border: '1px solid #ddd', fontSize: '15px', marginBottom: '40px', boxSizing: 'border-box', backgroundColor: 'white', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
        />

        {livres.length === 0 && recherche && (
          <p style={{ textAlign: 'center', color: '#999', marginTop: '40px' }}>Aucun livre trouve pour {recherche}</p>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '28px' }}>
          {livres.map((livre: any) => (
            <a key={livre.id} href={'/livres/' + livre.id} style={{ textDecoration: 'none' }}>
              <div
                style={{ backgroundColor: 'white', borderRadius: '12px', padding: '28px 24px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', borderTop: '4px solid #1a3d2b', cursor: 'pointer', transition: 'transform 0.15s ease' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)' }}
              >
                <h2 style={{ fontSize: '17px', fontWeight: '700', marginBottom: '8px', color: '#1a1a1a', lineHeight: '1.3' }}>{livre.titre}</h2>
                <p style={{ fontSize: '13px', color: '#888', marginBottom: '24px', fontStyle: 'italic' }}>{livre.auteur}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '20px', fontWeight: '700', color: '#1a3d2b' }}>{livre.prix} €</span>
                  <span style={{ fontSize: '11px', color: '#bbb', backgroundColor: '#f5f5f5', padding: '4px 10px', borderRadius: '20px' }}>
                    {livre.stock > 0 ? livre.stock + ' en stock' : 'Sur commande'}
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </main>

      <div id="infos" style={{ backgroundColor: '#1a3d2b', marginTop: '40px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '60px 24px', boxSizing: 'border-box' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <p style={{ color: '#a8d5b5', fontSize: '12px', letterSpacing: '2px', marginBottom: '8px' }}>Nous trouver</p>
            <h2 style={{ color: 'white', fontSize: '32px', fontWeight: '700', margin: 0 }}>Infos pratiques</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '24px' }}>
            <div style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '12px', padding: '28px' }}>
              <p style={{ color: '#a8d5b5', fontSize: '12px', letterSpacing: '1px', marginBottom: '12px' }}>Adresse</p>
              <a href={'https://www.google.com/maps/search/?api=1&query=' + adresseMap} target="_blank" rel="noopener noreferrer" style={{ color: 'white', textDecoration: 'none', fontSize: '16px', fontWeight: '500', lineHeight: '1.6' }}>
                42 rue Laugier, 75017 Paris
                <br />
                <span style={{ color: '#a8d5b5', fontSize: '13px', fontWeight: '400' }}>Ouvrir dans Maps</span>
              </a>
            </div>

            <div style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '12px', padding: '28px' }}>
              <p style={{ color: '#a8d5b5', fontSize: '12px', letterSpacing: '1px', marginBottom: '12px' }}>Horaires</p>
              <p style={{ color: 'white', fontSize: '16px', fontWeight: '500', lineHeight: '1.8', margin: 0 }}>
                Lundi - Samedi : 10h00 - 20h00
              </p>
              <p style={{ color: '#a8d5b5', fontSize: '13px', marginTop: '8px' }}>Ferme le dimanche</p>
            </div>

            <div style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '12px', padding: '28px' }}>
              <p style={{ color: '#a8d5b5', fontSize: '12px', letterSpacing: '1px', marginBottom: '12px' }}>Contact</p>
              <a href="tel:0677402151" style={{ display: 'block', color: 'white', textDecoration: 'none', fontSize: '16px', fontWeight: '500', marginBottom: '8px' }}>
                06 77 40 21 51
              </a>
              <a href="mailto:Bookdog@librairie.com" style={{ display: 'block', color: '#a8d5b5', textDecoration: 'none', fontSize: '14px' }}>
                Bookdog@librairie.com
              </a>
            </div>
          </div>
        </div>
      </div>

      <footer style={{ backgroundColor: '#0f2419', padding: '24px', textAlign: 'center' }}>
        <p style={{ color: '#a8d5b5', fontSize: '13px', margin: 0 }}>2026 Bookdog — Librairie independante Paris 17e</p>
      </footer>

    </div>
  )
}