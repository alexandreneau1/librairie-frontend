'use client'

import { useState, useEffect } from 'react'
import { getNbArticles } from '../lib/panier'

const C = {
  vert: '#1A3C2E',
  or: '#C9A84C',
  fondAlt: '#EAF2EC',
}

const FONT = "'EB Garamond', Georgia, serif"

type Props = {
  pageCourante?: 'accueil' | 'livres' | 'compte' | 'panier' | 'entreprises' | 'evenements'
}

export default function Header({ pageCourante }: Props) {
  const [nbArticles, setNbArticles] = useState(0)
  const [clientConnecte, setClientConnecte] = useState(false)
  const [prenomClient, setPrenomClient] = useState<string | null>(null)
  const [recherche, setRecherche] = useState('')
  const [resultats, setResultats] = useState<any[]>([])
  const [rechercheActive, setRechercheActive] = useState(false)
  const adresseMap = '42+rue+laugier+75017+Paris'

  useEffect(() => {
    setNbArticles(getNbArticles())
    const info = localStorage.getItem('clientInfo')
    if (info) {
      try {
        const parsed = JSON.parse(info)
        setClientConnecte(true)
        setPrenomClient(parsed.prenom || null)
      } catch {}
    }
    const handlePanierChange = () => setNbArticles(getNbArticles())
    window.addEventListener('bookdog_panier_change', handlePanierChange)
    return () => window.removeEventListener('bookdog_panier_change', handlePanierChange)
  }, [])

  useEffect(() => {
    if (!recherche.trim()) { setResultats([]); setRechercheActive(false); return }
    const delai = setTimeout(() => {
      const q = recherche.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]/g, '')
      fetch(`http://localhost:3001/livres?titre=${encodeURIComponent(q)}`)
        .then(r => r.json())
        .then(d => { setResultats(Array.isArray(d) ? d : []); setRechercheActive(true) })
        .catch(() => {})
    }, 280)
    return () => clearTimeout(delai)
  }, [recherche])

  const effacerRecherche = () => { setRecherche(''); setRechercheActive(false); setResultats([]) }

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
          font-family: 'EB Garamond', Georgia, serif;
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
          font-family: 'EB Garamond', Georgia, serif;
        }
        .bd-nav a.bd-btob:hover {
          background-color: #C9A84C;
          color: #1A3C2E;
        }
        .bd-search-input::placeholder { color: #9aab9a; }
        .bd-search-input:focus { outline: none; }
        .bd-search-result:hover { background-color: #EAF2EC !important; }
      `}</style>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px 24px 0', boxSizing: 'border-box' }}>

        {/* Ligne principale : logo | recherche | nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.15)' }}>

          {/* Logo */}
          <a href="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
            <h1 style={{ color: 'white', fontSize: '26px', fontWeight: '700', margin: 0, letterSpacing: '2px', fontFamily: FONT }}>BOOKDOG</h1>
            <p style={{ color: C.fondAlt, fontSize: '11px', margin: '2px 0 0', letterSpacing: '1px', fontFamily: FONT }}>Librairie indépendante — Paris 17e</p>
          </a>

          {/* Barre de recherche centrale */}
          <div style={{ flex: 1, maxWidth: '480px', position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: '40px', padding: '0 16px', border: '1px solid rgba(255,255,255,0.2)', transition: 'background 0.15s' }}>
              <span style={{ fontSize: '15px', marginRight: '10px', flexShrink: 0 }}>🔍</span>
              <input
                type="text"
                className="bd-search-input"
                placeholder="Rechercher un livre, un auteur..."
                value={recherche}
                onChange={e => setRecherche(e.target.value)}
                onFocus={e => e.currentTarget.parentElement!.style.backgroundColor = 'rgba(255,255,255,0.18)'}
                onBlur={e => e.currentTarget.parentElement!.style.backgroundColor = 'rgba(255,255,255,0.12)'}
                style={{ flex: 1, background: 'none', border: 'none', color: 'white', fontSize: '14px', padding: '10px 0', fontFamily: FONT }}
              />
              {recherche && (
                <button onClick={effacerRecherche} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '16px', cursor: 'pointer', padding: '0', marginLeft: '6px', flexShrink: 0 }}>✕</button>
              )}
            </div>

            {/* Dropdown résultats */}
            {rechercheActive && (
              <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0, backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.2)', zIndex: 500, overflow: 'hidden', maxHeight: '320px', overflowY: 'auto' }}>
                {resultats.length === 0
                  ? <p style={{ padding: '16px 20px', color: '#6B6B5E', margin: 0, fontSize: '14px', fontFamily: FONT }}>Aucun résultat pour « {recherche} »</p>
                  : resultats.slice(0, 6).map((l: any) => (
                    <a key={l.id} href={`/livres/${l.id}`} className="bd-search-result"
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderBottom: '1px solid #f5f5f5', textDecoration: 'none', backgroundColor: 'white' }}>
                      <div>
                        <p style={{ fontSize: '14px', fontWeight: '600', color: '#1C1C1C', margin: '0 0 2px', fontFamily: FONT }}>{l.titre}</p>
                        <p style={{ fontSize: '12px', color: '#6B6B5E', margin: 0, fontStyle: 'italic', fontFamily: FONT }}>{l.auteur}</p>
                      </div>
                      <span style={{ fontSize: '14px', fontWeight: '700', color: C.vert, flexShrink: 0, marginLeft: '12px', fontFamily: FONT }}>{l.prix} €</span>
                    </a>
                  ))}
                {resultats.length > 6 && (
                  <a href={`/livres?q=${encodeURIComponent(recherche)}`} style={{ display: 'block', padding: '12px 20px', textAlign: 'center', fontSize: '13px', color: C.vert, fontWeight: '600', textDecoration: 'none', backgroundColor: '#EAF2EC', fontFamily: FONT }}>
                    Voir tous les résultats ({resultats.length}) →
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="bd-nav" style={{ display: 'flex', gap: '4px', alignItems: 'center', flexShrink: 0 }}>
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

        {/* Ligne infos pratiques */}
        <div style={{ padding: '12px 0', display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
          <a href={`https://www.google.com/maps/search/?api=1&query=${adresseMap}`} target="_blank" rel="noopener noreferrer" style={{ color: C.fondAlt, textDecoration: 'none', fontSize: '13px', fontFamily: FONT }}>
            📍 42 rue Laugier, 75017 Paris
          </a>
          <span style={{ color: C.fondAlt, fontSize: '13px', fontFamily: FONT }}>🕐 Lun–Sam : 10h–20h</span>
          <a href="tel:0677402151" style={{ color: C.fondAlt, textDecoration: 'none', fontSize: '13px', fontFamily: FONT }}>📞 06 77 40 21 51</a>
        </div>
      </div>
    </header>
  )
}