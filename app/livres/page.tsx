'use client'

import { useState, useEffect } from 'react'

type Livre = {
  id: number
  titre: string
  auteur: string
  isbn: string
  prix: number
  stock: number
  genre: string | null
}

const GENRES = [
  'Roman', 'Policier', 'Science-fiction', 'Fantasy', 'Biographie',
  'Histoire', 'Essai', 'Jeunesse', 'Bande dessinée', 'Poésie',
  'Thriller', 'Romance', 'Développement personnel', 'Philosophie', 'Autre'
]

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
    .filter(l => {
      if (recherche) {
        const q = normalise(recherche)
        return normalise(l.titre).includes(q) || normalise(l.auteur).includes(q)
      }
      return true
    })
    .filter(l => genreSelectionne ? l.genre === genreSelectionne : true)
    .filter(l => {
      if (disponibilite === 'stock') return l.stock > 0
      if (disponibilite === 'commande') return l.stock === 0
      return true
    })
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

  return (
    <div style={{ backgroundColor: '#f9f6f1', minHeight: '100vh', fontFamily: 'Georgia, serif' }}>

      <header style={{ backgroundColor: '#1a3d2b' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 24px 0', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
            <a href="/" style={{ textDecoration: 'none' }}>
              <h1 style={{ color: 'white', fontSize: '28px', fontWeight: '700', margin: 0, letterSpacing: '2px' }}>BOOKDOG</h1>
              <p style={{ color: '#a8d5b5', fontSize: '12px', margin: '2px 0 0', letterSpacing: '1px' }}>Librairie independante — Paris 17e</p>
            </a>
            <nav style={{ display: 'flex', gap: '32px' }}>
              <a href="/" style={{ color: '#a8d5b5', textDecoration: 'none', fontSize: '14px' }}>Accueil</a>
              <a href="/click-collect" style={{ color: '#a8d5b5', textDecoration: 'none', fontSize: '14px' }}>Click & Collect</a>
              <a href="/compte/connexion" style={{ color: '#a8d5b5', textDecoration: 'none', fontSize: '14px' }}>Mon compte</a>
            </nav>
          </div>
          <div style={{ padding: '16px 0' }}>
            <p style={{ color: '#a8d5b5', fontSize: '13px', margin: 0 }}>Lun-Sam : 10h-20h &nbsp;·&nbsp; 42 rue Laugier, 75017 Paris &nbsp;·&nbsp; 06 77 40 21 51</p>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '48px 24px', boxSizing: 'border-box' }}>

        <div style={{ marginBottom: '40px' }}>
          <p style={{ color: '#1a3d2b', fontSize: '12px', letterSpacing: '2px', marginBottom: '8px' }}>Notre sélection</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
            <h2 style={{ fontSize: '36px', fontWeight: '700', color: '#1a1a1a', margin: 0 }}>Le catalogue</h2>
            <p style={{ color: '#888', fontSize: '14px', margin: 0 }}>
              {chargement ? '...' : livresFiltres.length + ' livre' + (livresFiltres.length > 1 ? 's' : '')}
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '40px', alignItems: 'start' }}>

          {/* SIDEBAR FILTRES */}
          <div style={{ position: 'sticky', top: '24px' }}>

            {/* Recherche */}
            <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', marginBottom: '16px' }}>
              <input
                type="text"
                placeholder="Titre, auteur..."
                value={recherche}
                onChange={e => setRecherche(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', boxSizing: 'border-box', fontFamily: 'Georgia, serif' }}
              />
            </div>

            {/* Tri */}
            <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', marginBottom: '16px' }}>
              <p style={{ fontSize: '12px', color: '#999', letterSpacing: '1px', margin: '0 0 14px', fontWeight: '600' }}>TRIER PAR</p>
              {[['pertinence', 'Pertinence'], ['prix_asc', 'Prix croissant'], ['prix_desc', 'Prix décroissant'], ['titre', 'Titre A→Z']].map(([val, label]) => (
                <label key={val} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', cursor: 'pointer', fontSize: '14px', color: tri === val ? '#1a3d2b' : '#444', fontWeight: tri === val ? '700' : '400' }}>
                  <input type="radio" name="tri" value={val} checked={tri === val} onChange={() => setTri(val)} style={{ accentColor: '#1a3d2b' }} />
                  {label}
                </label>
              ))}
            </div>

            {/* Genre */}
            <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', marginBottom: '16px' }}>
              <p style={{ fontSize: '12px', color: '#999', letterSpacing: '1px', margin: '0 0 14px', fontWeight: '600' }}>GENRE</p>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', cursor: 'pointer', fontSize: '14px', color: !genreSelectionne ? '#1a3d2b' : '#444', fontWeight: !genreSelectionne ? '700' : '400' }}>
                <input type="radio" name="genre" value="" checked={!genreSelectionne} onChange={() => setGenreSelectionne('')} style={{ accentColor: '#1a3d2b' }} />
                Tous les genres
              </label>
              {genresDisponibles.map(g => (
                <label key={g} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', cursor: 'pointer', fontSize: '14px', color: genreSelectionne === g ? '#1a3d2b' : '#444', fontWeight: genreSelectionne === g ? '700' : '400' }}>
                  <input type="radio" name="genre" value={g} checked={genreSelectionne === g} onChange={() => setGenreSelectionne(g)} style={{ accentColor: '#1a3d2b' }} />
                  {g}
                </label>
              ))}
            </div>

            {/* Disponibilité */}
            <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', marginBottom: '16px' }}>
              <p style={{ fontSize: '12px', color: '#999', letterSpacing: '1px', margin: '0 0 14px', fontWeight: '600' }}>DISPONIBILITÉ</p>
              {[['tous', 'Tous'], ['stock', 'En stock'], ['commande', 'Sur commande']].map(([val, label]) => (
                <label key={val} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', cursor: 'pointer', fontSize: '14px', color: disponibilite === val ? '#1a3d2b' : '#444', fontWeight: disponibilite === val ? '700' : '400' }}>
                  <input type="radio" name="dispo" value={val} checked={disponibilite === val} onChange={() => setDisponibilite(val)} style={{ accentColor: '#1a3d2b' }} />
                  {label}
                </label>
              ))}
            </div>

            {/* Prix */}
            <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', marginBottom: '16px' }}>
              <p style={{ fontSize: '12px', color: '#999', letterSpacing: '1px', margin: '0 0 14px', fontWeight: '600' }}>PRIX MAX</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '13px', color: '#888' }}>0 €</span>
                <span style={{ fontSize: '14px', fontWeight: '700', color: '#1a3d2b' }}>{prixMax} €</span>
              </div>
              <input
                type="range"
                min={0}
                max={prixMaxCatalogue}
                value={prixMax}
                onChange={e => setPrixMax(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#1a3d2b' }}
              />
            </div>

            {/* Recommandé pour vous */}
            <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', marginBottom: '16px', opacity: 0.6 }}>
              <p style={{ fontSize: '12px', color: '#999', letterSpacing: '1px', margin: '0 0 8px', fontWeight: '600' }}>RECOMMANDÉ POUR VOUS</p>
              <p style={{ fontSize: '13px', color: '#aaa', margin: 0, lineHeight: '1.5' }}>Disponible prochainement</p>
            </div>

            {/* Reset */}
            {filtersActifs && (
              <button
                onClick={resetFiltres}
                style={{ width: '100%', padding: '12px', backgroundColor: 'transparent', color: '#c0392b', border: '1px solid #c0392b', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontFamily: 'Georgia, serif' }}
              >
                Réinitialiser les filtres
              </button>
            )}
          </div>

          {/* LISTE LIVRES */}
          <div>
            {chargement && (
              <div style={{ textAlign: 'center', padding: '80px 0', color: '#888' }}>Chargement...</div>
            )}

            {!chargement && livresFiltres.length === 0 && (
              <div style={{ textAlign: 'center', padding: '80px 0' }}>
                <p style={{ fontSize: '18px', color: '#888', marginBottom: '8px' }}>Aucun livre trouvé</p>
                <p style={{ fontSize: '14px', color: '#bbb' }}>Essayez de modifier vos filtres</p>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {livresFiltres.map(l => (
                <a key={l.id} href={'/livres/' + l.id} style={{ textDecoration: 'none' }}>
                  <div
                    style={{ backgroundColor: 'white', borderRadius: '12px', padding: '28px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '24px', borderLeft: '4px solid #1a3d2b', transition: 'transform 0.15s ease, box-shadow 0.15s ease' }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateX(4px)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)' }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateX(0)'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.06)' }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1a1a1a', margin: 0 }}>{l.titre}</h3>
                        {l.genre && (
                          <span style={{ backgroundColor: '#f0f7f4', color: '#1a3d2b', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>{l.genre}</span>
                        )}
                      </div>
                      <p style={{ fontSize: '14px', color: '#888', margin: '0 0 12px', fontStyle: 'italic' }}>{l.auteur}</p>
                      <p style={{ fontSize: '12px', color: '#bbb', margin: 0 }}>ISBN : {l.isbn}</p>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ fontSize: '24px', fontWeight: '700', color: '#1a3d2b', margin: '0 0 8px' }}>{l.prix} €</p>
                      <span style={{
                        display: 'inline-block',
                        fontSize: '12px',
                        fontWeight: '600',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        backgroundColor: l.stock > 0 ? '#e8f5e9' : '#fff8e6',
                        color: l.stock > 0 ? '#2e7d32' : '#b8860b'
                      }}>
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

      <footer style={{ backgroundColor: '#0f2419', padding: '24px', textAlign: 'center', marginTop: '60px' }}>
        <p style={{ color: '#a8d5b5', fontSize: '13px', margin: 0 }}>2026 Bookdog — Librairie independante Paris 17e</p>
      </footer>

    </div>
  )
}
