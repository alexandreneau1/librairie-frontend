'use client'

import { useState, useEffect } from 'react'
import { getNbArticles } from '../lib/panier'

const C = {
  vert: '#1A3C2E',
  or: '#C9A84C',
  fondAlt: '#EAF2EC',
}

type Props = {
  pageCourante?: 'accueil' | 'livres' | 'compte' | 'panier' | 'entreprises' | 'evenements'
}

export default function Header({ pageCourante }: Props) {
  const [nbArticles, setNbArticles] = useState(0)
  const [clientConnecte, setClientConnecte] = useState(false)
  const [prenomClient, setPrenomClient] = useState<string | null>(null)
  const adresseMap = '42+rue+laugier+75017+Paris'

  useEffect(() => {
    setNbArticles(getNbArticles())
    const info = localStorage.getItem('clientInfo')
    if (info) {
      const parsed = JSON.parse(info)
      setClientConnecte(true)
      setPrenomClient(parsed.prenom || null)
    }
    const handlePanierChange = () => setNbArticles(getNbArticles())
    window.addEventListener('bookdog_panier_change', handlePanierChange)
    return () => window.removeEventListener('bookdog_panier_change', handlePanierChange)
  }, [])

  return (
    <header style={{ backgroundColor: C.vert }}>
      <style>{`
        .bd-nav a.bd-lien {
          color: #EAF2EC;
          text-decoration: none;
          font-size: 14px;
          font-weight: 400;
          padding: 5px 10px;
          border-radius: 6px;
          border: 1px solid transparent;
          transition: border 0.15s, color 0.15s;
          letter-spacing: 0.5px;
        }
        .bd-nav a.bd-lien:hover {
          border: 1px solid rgba(255,255,255,0.45);
          color: white;
        }
        .bd-nav a.bd-lien.actif {
          color: #C9A84C;
          font-weight: 700;
        }
        .bd-nav a.bd-btob {
          color: #C9A84C;
          text-decoration: none;
          font-size: 13px;
          font-weight: 700;
          padding: 5px 12px;
          border-radius: 6px;
          background-color: rgba(201,168,76,0.15);
          border: 1px solid #C9A84C;
          transition: background 0.15s, color 0.15s;
          letter-spacing: 0.5px;
          white-space: nowrap;
        }
        .bd-nav a.bd-btob:hover {
          background-color: #C9A84C;
          color: #1A3C2E;
        }
      `}</style>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 24px 0', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
          <a href="/" style={{ textDecoration: 'none' }}>
            <h1 style={{ color: 'white', fontSize: '28px', fontWeight: '700', margin: 0, letterSpacing: '2px' }}>BOOKDOG</h1>
            <p style={{ color: C.fondAlt, fontSize: '12px', margin: '2px 0 0', letterSpacing: '1px' }}>Librairie indépendante — Paris 17e</p>
          </a>
          <nav className="bd-nav" style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <a href="/" className={`bd-lien${pageCourante === 'accueil' ? ' actif' : ''}`}>Accueil</a>
            <a href="/livres" className={`bd-lien${pageCourante === 'livres' ? ' actif' : ''}`}>Catalogue</a>
            <a href="/evenements" className={`bd-lien${pageCourante === 'evenements' ? ' actif' : ''}`}>Événements</a>
            <a href="/entreprises" className="bd-btob">Espace Pro</a>
            <a href={clientConnecte ? '/compte/dashboard' : '/compte/connexion'} className={`bd-lien${pageCourante === 'compte' ? ' actif' : ''}`}>
              {clientConnecte && prenomClient ? prenomClient : 'Mon compte'}
            </a>
            <a href="/panier" style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              backgroundColor: nbArticles > 0 ? C.or : 'rgba(255,255,255,0.1)',
              color: 'white', padding: '6px 14px', borderRadius: '40px',
              textDecoration: 'none', fontWeight: '700', fontSize: '14px', marginLeft: '4px',
            }}>
              🛒
              {nbArticles > 0 && (
                <span style={{ backgroundColor: 'white', color: C.vert, borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', flexShrink: 0 }}>
                  {nbArticles > 99 ? '99+' : nbArticles}
                </span>
              )}
            </a>
          </nav>
        </div>
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