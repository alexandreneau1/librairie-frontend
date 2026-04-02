'use client'

import { useState, useEffect } from 'react'
import { getNbArticles } from '../lib/panier'

const C = {
  vert: '#1A3C2E',
  or: '#C9A84C',
  fondAlt: '#EAF2EC',
}

type Props = {
  /** Lien actif dans la nav — pour le souligner */
  pageCourante?: 'accueil' | 'livres' | 'click-collect' | 'compte' | 'panier'
}

export default function Header({ pageCourante }: Props) {
  const [nbArticles, setNbArticles] = useState(0)
  const [clientConnecte, setClientConnecte] = useState(false)
  const [prenomClient, setPrenomClient] = useState<string | null>(null)
  const adresseMap = '42+rue+laugier+75017+Paris'

  useEffect(() => {
    // Init
    setNbArticles(getNbArticles())
    const info = localStorage.getItem('clientInfo')
    if (info) {
      const parsed = JSON.parse(info)
      setClientConnecte(true)
      setPrenomClient(parsed.prenom || null)
    }

    // Écouter les changements de panier
    const handlePanierChange = () => setNbArticles(getNbArticles())
    window.addEventListener('bookdog_panier_change', handlePanierChange)
    return () => window.removeEventListener('bookdog_panier_change', handlePanierChange)
  }, [])

  const lienStyle = (page: string): React.CSSProperties => ({
    color: pageCourante === page ? C.or : C.fondAlt,
    textDecoration: 'none',
    fontSize: '14px',
    letterSpacing: '0.5px',
    fontWeight: pageCourante === page ? '700' : '400',
    borderBottom: pageCourante === page ? `2px solid ${C.or}` : '2px solid transparent',
    paddingBottom: '2px',
    transition: 'color 0.15s',
  })

  return (
    <header style={{ backgroundColor: C.vert }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 24px 0', boxSizing: 'border-box' }}>

        {/* Ligne principale */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.15)' }}>

          {/* Logo */}
          <a href="/" style={{ textDecoration: 'none' }}>
            <h1 style={{ color: 'white', fontSize: '28px', fontWeight: '700', margin: 0, letterSpacing: '2px' }}>BOOKDOG</h1>
            <p style={{ color: C.fondAlt, fontSize: '12px', margin: '2px 0 0', letterSpacing: '1px' }}>Librairie indépendante — Paris 17e</p>
          </a>

          {/* Nav */}
          <nav style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
            <a href="/" style={lienStyle('accueil')}>Accueil</a>
            <a href="/livres" style={lienStyle('livres')}>Catalogue</a>
            <a href="/click-collect" style={lienStyle('click-collect')}>Click & Collect</a>

            {/* Compte */}
            <a
              href={clientConnecte ? '/compte/dashboard' : '/compte/connexion'}
              style={lienStyle('compte')}
            >
              {clientConnecte && prenomClient ? `${prenomClient}` : 'Mon compte'}
            </a>

            {/* Panier avec compteur */}
            <a
              href="/panier"
              style={{
                ...lienStyle('panier'),
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: nbArticles > 0 ? C.or : 'rgba(255,255,255,0.1)',
                color: 'white',
                padding: '6px 14px',
                borderRadius: '40px',
                border: 'none',
                fontWeight: '700',
                fontSize: '14px',
                transition: 'background 0.15s',
              }}
            >
              🛒
              {nbArticles > 0 && (
                <span style={{
                  backgroundColor: 'white',
                  color: C.vert,
                  borderRadius: '50%',
                  width: '20px',
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: '700',
                  flexShrink: 0,
                }}>
                  {nbArticles > 99 ? '99+' : nbArticles}
                </span>
              )}
            </a>
          </nav>
        </div>

        {/* Ligne infos pratiques */}
        <div style={{ padding: '14px 0', display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
          <a href={`https://www.google.com/maps/search/?api=1&query=${adresseMap}`} target="_blank" rel="noopener noreferrer" style={{ color: C.fondAlt, textDecoration: 'none', fontSize: '13px' }}>
            📍 42 rue Laugier, 75017 Paris
          </a>
          <span style={{ color: C.fondAlt, fontSize: '13px' }}>🕐 Lun–Sam : 10h–20h</span>
          <a href="tel:0677402151" style={{ color: C.fondAlt, textDecoration: 'none', fontSize: '13px' }}>📞 06 77 40 21 51</a>
        </div>
      </div>
    </header>
  )
}