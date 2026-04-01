'use client'

import { useState, useEffect } from 'react'

const C = {
  vert: '#1A3C2E',
  or: '#C9A84C',
  orIntense: '#9A6F09',
  fond: '#F9F6F0',
  fondAlt: '#EAF2EC',
  texte: '#1C1C1C',
  texteSecondaire: '#6B6B5E',
  footer: '#0f2419',
}

type Livre = {
  id: number
  titre: string
  auteur: string
  isbn: string
  prix: number
  stock: number
  genre: string | null
}

export default function Catalogue() {
  const [livres, setLivres] = useState<Livre[]>([])
  const [chargement, setChargement] = useState(true)
  const [recherche, setRecherche] = useState('')
  const [genreSelectionne, setGenreSelectionne] = useState('')
  const [disponibilite, setDisponibilite] = useState('tous')
  const [prixMax, setPrixMax] = useState(100)
  const [tri, setTri] = useState('pertinence')

  useEffect(() => {
    fetch('http://localhost:3001/livres')
      .then(res => res.json())
      .then(data => { setLivres(Array.isArray(data) ? data : []); setChargement(false) })
  }, [])

  const normalise = (str: string) =>
    str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]/g, '')

  const livresFiltres = livres
    .filter(l => recherche ? normalise(l.titre).includes(normalise(recherche)) || normalise(l.auteur).includes(normalise(recherche)) : true)
    .filter(l => genreSelectionne ? l.genre === genreSelectionne : true)
    .filter(l => disponibilite === 'stock' ? l.stock > 0 : disponibilite === 'commande' ? l.stock === 0 : true)
    .filter(l => l.prix <= prixMax)
    .sort((a, b) => {
      if (tri === 'prix_asc') return a.prix - b.prix
      if (tri === 'prix_desc') return b.prix - a.prix
      if (tri === 'titre') return a.titre.localeCompare(b.titre)
      return 0
    })

  const genresDisponibles = Array.from(new Set(livres.map(l => l.genre).filter(Boolean))) as string[]
  const prixMaxCatalogue = livres.length > 0 ? Math.ceil(Math.max(...livres.map(l => l.prix))) : 100

  const resetFiltres = () => {
    setRecherche('')
    setGenreSelectionne('')
    setDisponibilite('tous')
    setPrixMax(prixMaxCatalogue)
    setTri('pertinence')
  }

  const filtersActifs = recherche || genreSelectionne || disponibilite !== 'tous' || prixMax < prixMaxCatalogue || tri !== 'pertinence'

  const sidebarCard = { backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', marginBottom: '16px' }
  const sectionLabel = { fontSize: '11px', color: C.texteSecondaire, letterSpacing: '1.5px', margin: '0 0 14px', fontWeight: '600' as const }

  return (
    <div style={{ backgroundColor: C.fond, minHeight: '100vh', fontFamily: 'Georgia, serif' }}>

      <header style={{ backgroundColor: C.vert }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 24px 0', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
            <a href="/" style={{ textDecoration: 'none' }}>
              <h1 style={{ color: 'white', fontSize: '28px', fontWeight: '700', margin: 0, letterSpacing: '2px' }}>BOOKDOG</h1>
              <p style={{ color: C.fondAlt, fontSize: '12px', margin: '2px 0 0', letterSpacing: '1px' }}>Librairie independante — Paris 17e</p>
            </a>
            <nav style={{ display: 'flex', gap: '32px' }}>
              <a href="/" style={{ color: C.fondAlt, textDecoration: 'none', fontSize: '14px' }}>Accueil</a>
              <a href="/click-collect" style={{ color: C.fondAlt, textDecoration: 'none', fontSize: '14px' }}>Click & Collect</a>
              <a href="/compte/connexion" style={{ color: C.fondAlt, textDecoration: 'none', fontSize: '14px' }}>Mon compte</a>
            </nav>
          </div>
          <div style={{ padding: '16px 0' }}>
            <p style={{ color: C.fondAlt, fontSize: '13px', margin: 0 }}>Lun-Sam : 10h-20h &nbsp;·&nbsp; 42 rue Laugier, 75017 Paris &nbsp;·&nbsp; 06 77 40 21 51</p>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '48px 24px', boxSizing: 'border-box' }}>
        <div style={{ marginBottom: '40px' }}>
          <p style={{ color: C.vert, fontSize: '12px', letterSpacing: '2px', marginBottom: '8px' }}>Notre sélection</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
            <h2 style={{ fontSize: '36px', fontWeight: '700', color: C.texte, margin: 0 }}>Le catalogue</h2>
            <p style={{ color: C.texteSecondaire, fontSize: '14px', margin: 0 }}>
              {chargement ? '...' : livresFiltres.length + ' livre' + (livresFiltres.length > 1 ? 's' : '')}
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '40px', alignItems: 'start' }}>

          <div style={{ position: 'sticky', top: '24px' }}>
            <div style={sidebarCard}>
              <input
                type="text"
                placeholder="Titre, auteur..."
                value={recherche}
                onChange={e => setRecherche(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', boxSizing: 'border-box', fontFamily: 'Georgia, serif' }}
              />
            </div>

            <div style={sidebarCard}>
              <p style={sectionLabel}>TRIER PAR</p>
              {[['pertinence', 'Pertinence'], ['prix_asc', 'Prix croissant'], ['prix_desc', 'Prix décroissant'], ['titre', 'Titre A→Z']].map(([val, label]) => (
                <label key={val} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', cursor: 'pointer', fontSize: '14px', color: tri === val ? C.vert : C.texte, fontWeight: tri === val ? '700' : '400' }}>
                  <input type="radio" name="tri" value={val} checked={tri === val} onChange={() => setTri(val)} style={{ accentColor: C.vert }} />
                  {label}
                </label>
              ))}
            </div>

            <div style={sidebarCard}>
              <p style={sectionLabel}>GENRE</p>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', cursor: 'pointer', fontSize: '14px', color: !genreSelectionne ? C.vert : C.texte, fontWeight: !genreSelectionne ? '700' : '400' }}>
                <input type="radio" name="genre" value="" checked={!genreSelectionne} onChange={() => setGenreSelectionne('')} style={{ accentColor: C.vert }} />
                Tous les genres
              </label>
              {genresDisponibles.map(g => (
                <label key={g} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', cursor: 'pointer', fontSize: '14px', color: genreSelectionne === g ? C.vert : C.texte, fontWeight: genreSelectionne === g ? '700' : '400' }}>
                  <input type="radio" name="genre" value={g} checked={genreSelectionne === g} onChange={() => setGenreSelectionne(g)} style={{ accentColor: C.vert }} />
                  {g}
                </label>
              ))}
            </div>

            <div style={sidebarCard}>
              <p style={sectionLabel}>DISPONIBILITÉ</p>
              {[['tous', 'Tous'], ['stock', 'En stock'], ['commande', 'Sur commande']].map(([val, label]) => (
                <label key={val} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', cursor: 'pointer', fontSize: '14px', color: disponibilite === val ? C.vert : C.texte, fontWeight: disponibilite === val ? '700' : '400' }}>
                  <input type="radio" name="dispo" value={val} checked={disponibilite === val} onChange={() => setDisponibilite(val)} style={{ accentColor: C.vert }} />
                  {label}
                </label>
              ))}
            </div>

            <div style={sidebarCard}>
              <p style={sectionLabel}>PRIX MAX</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '13px', color: C.texteSecondaire }}>0 €</span>
                <span style={{ fontSize: '14px', fontWeight: '700', color: C.vert }}>{prixMax} €</span>
              </div>
              <input type="range" min={0} max={prixMaxCatalogue} value={prixMax} onChange={e => setPrixMax(Number(e.target.value))} style={{ width: '100%', accentColor: C.vert }} />
            </div>

            <div style={{ ...sidebarCard, opacity: 0.5 }}>
              <p style={sectionLabel}>RECOMMANDÉ POUR VOUS</p>
              <p style={{ fontSize: '13px', color: C.texteSecondaire, margin: 0, lineHeight: '1.5' }}>Disponible prochainement</p>
            </div>

            {filtersActifs && (
              <button onClick={resetFiltres} style={{ width: '100%', padding: '12px', backgroundColor: 'transparent', color: '#c0392b', border: '1px solid #c0392b', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontFamily: 'Georgia, serif' }}>
                Réinitialiser les filtres
              </button>
            )}
          </div>

          <div>
            {chargement && <div style={{ textAlign: 'center', padding: '80px 0', color: C.texteSecondaire }}>Chargement...</div>}
            {!chargement && livresFiltres.length === 0 && (
              <div style={{ textAlign: 'center', padding: '80px 0' }}>
                <p style={{ fontSize: '18px', color: C.texteSecondaire, marginBottom: '8px' }}>Aucun livre trouvé</p>
                <p style={{ fontSize: '14px', color: '#bbb' }}>Essayez de modifier vos filtres</p>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {livresFiltres.map(l => (
                <a key={l.id} href={'/livres/' + l.id} style={{ textDecoration: 'none' }}>
                  <div
                    style={{ backgroundColor: 'white', borderRadius: '12px', padding: '28px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '24px', borderLeft: '4px solid ' + C.vert, transition: 'transform 0.15s ease, box-shadow 0.15s ease' }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateX(4px)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)' }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateX(0)'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.05)' }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: '700', color: C.texte, margin: 0 }}>{l.titre}</h3>
                        {l.genre && (
                          <span style={{ backgroundColor: C.fondAlt, color: C.vert, padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>{l.genre}</span>
                        )}
                      </div>
                      <p style={{ fontSize: '14px', color: C.texteSecondaire, margin: '0 0 12px', fontStyle: 'italic' }}>{l.auteur}</p>
                      <p style={{ fontSize: '12px', color: '#bbb', margin: 0 }}>ISBN : {l.isbn}</p>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ fontSize: '24px', fontWeight: '700', color: C.vert, margin: '0 0 8px' }}>{l.prix} €</p>
                      <span style={{ display: 'inline-block', fontSize: '12px', fontWeight: '600', padding: '4px 12px', borderRadius: '20px', backgroundColor: l.stock > 0 ? C.fondAlt : '#fff8e6', color: l.stock > 0 ? C.vert : C.orIntense }}>
                        {l.stock > 0 ? l.stock + ' en stock' : 'Sur commande'}
                      </span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      <footer style={{ backgroundColor: C.footer, padding: '24px', textAlign: 'center', marginTop: '60px' }}>
        <p style={{ color: C.fondAlt, fontSize: '13px', margin: 0 }}>2026 Bookdog — Librairie independante Paris 17e</p>
      </footer>

    </div>
  )
}