'use client'

import { useState, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import Header from '../../components/Header'
import { ajouterAuPanier, estDansPanier, getNbArticles } from '../../lib/panier'

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

const ETAPES = [
  {
    question: 'Quel type de lecture vous attire ?',
    icone: '📖',
    options: [
      { label: 'Roman / Littérature', genres: ['Roman', 'Romance', 'Poésie'] },
      { label: 'Policier / Thriller', genres: ['Policier', 'Thriller'] },
      { label: 'SF & Fantasy',        genres: ['Science-fiction', 'Fantasy'] },
      { label: 'Essai / Idées',       genres: ['Essai', 'Histoire', 'Philosophie', 'Biographie', 'Développement personnel'] },
      { label: 'Jeunesse',            genres: ['Jeunesse'] },
      { label: 'Bande dessinée',      genres: ['Bande dessinée'] },
    ],
  },
  {
    question: 'Quelle ambiance recherchez-vous ?',
    icone: '🌿',
    options: [
      { label: 'Me dépayser',             tag: 'depaysement' },
      { label: 'Ressentir des émotions',  tag: 'emotion' },
      { label: 'Réfléchir, apprendre',    tag: 'reflexion' },
      { label: 'Me détendre',             tag: 'detente' },
      { label: 'Avoir des frissons',      tag: 'frissons' },
    ],
  },
  {
    question: 'Pour qui est ce livre ?',
    icone: '🎁',
    options: [
      { label: 'Pour moi',              tag: 'moi' },
      { label: 'Cadeau — adulte',       tag: 'cadeau_adulte' },
      { label: 'Cadeau — enfant / ado', tag: 'cadeau_enfant' },
    ],
  },
  {
    question: 'Combien de temps avez-vous ?',
    icone: '⏱',
    options: [
      { label: 'Une soirée (< 200 pages)',          tag: 'court' },
      { label: 'Un week-end (200–400 pages)',        tag: 'moyen' },
      { label: 'Plusieurs semaines (> 400 pages)',   tag: 'long' },
      { label: 'Peu importe',                        tag: 'indifferent' },
    ],
  },
  {
    question: 'Une époque de prédilection ?',
    icone: '🕰',
    options: [
      { label: 'Classique (avant 1960)',    tag: 'classique' },
      { label: 'Contemporain (après 1960)', tag: 'contemporain' },
      { label: 'Peu importe',               tag: 'indifferent' },
    ],
  },
]

type SelectionLivre = {
  id: number
  livre_id: number
  type: string
  label: string | null
  rang: number | null
  titre: string
  auteur: string
  isbn: string
  prix: number
  stock: number
}

type Selections = {
  coups_de_coeur: SelectionLivre[]
  prix: SelectionLivre[]
  top_ventes: SelectionLivre[]
}

// ── Carte livre individuelle ──────────────────────────────────────────────────
function CarteLivre({
  livre, label, clientConnecte, wishlistIds, onWishlist,
}: {
  livre: SelectionLivre
  label?: string | null
  clientConnecte: boolean
  wishlistIds: Set<number>
  onWishlist: (id: number, inList: boolean) => void
}) {
  const [imgOk, setImgOk] = useState(true)
  const [ajout, setAjout] = useState(false)
  const inWishlist = wishlistIds.has(livre.livre_id)
  const couverture = `https://covers.openlibrary.org/b/isbn/${livre.isbn}-M.jpg`

  const handlePanier = (e: React.MouseEvent) => {
    e.preventDefault()
    ajouterAuPanier({ livre_id: livre.livre_id, titre: livre.titre, auteur: livre.auteur, isbn: livre.isbn, prix: livre.prix, stock: livre.stock })
    setAjout(true)
    setTimeout(() => setAjout(false), 1500)
  }

  return (
    <a href={`/livres/${livre.livre_id}`} style={{ textDecoration: 'none', flexShrink: 0, width: '160px', display: 'flex', flexDirection: 'column' }}>
      {/* Couverture */}
      <div style={{ position: 'relative', width: '160px', height: '220px', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.15)', backgroundColor: C.fondAlt, marginBottom: '10px', flexShrink: 0 }}>
        {imgOk ? (
          <img src={couverture} alt={livre.titre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setImgOk(false)} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px', boxSizing: 'border-box', textAlign: 'center' }}>
            <span style={{ fontSize: '32px', marginBottom: '8px' }}>📚</span>
            <p style={{ fontSize: '12px', color: C.texteSecondaire, margin: 0, fontStyle: 'italic', lineHeight: '1.3' }}>{livre.titre}</p>
          </div>
        )}
        {/* Label libraire */}
        {label && (
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(26,60,46,0.95))', padding: '20px 8px 8px' }}>
            <p style={{ color: C.or, fontSize: '10px', margin: 0, lineHeight: '1.3', fontStyle: 'italic' }}>{label}</p>
          </div>
        )}
      </div>

      {/* Infos */}
      <p style={{ fontSize: '13px', fontWeight: '700', color: C.texte, margin: '0 0 2px', lineHeight: '1.3', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>{livre.titre}</p>
      <p style={{ fontSize: '11px', color: C.texteSecondaire, margin: '0 0 8px', fontStyle: 'italic', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{livre.auteur}</p>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{ fontSize: '15px', fontWeight: '700', color: C.vert }}>{livre.prix} €</span>
        <span style={{ fontSize: '10px', fontWeight: '600', padding: '2px 7px', borderRadius: '20px', backgroundColor: livre.stock > 0 ? C.fondAlt : '#fff8e6', color: livre.stock > 0 ? C.vert : C.orIntense }}>
          {livre.stock > 0 ? 'En stock' : 'Commande'}
        </span>
      </div>

      {/* Boutons */}
      <div style={{ display: 'flex', gap: '6px' }} onClick={e => e.preventDefault()}>
        <button
          onClick={e => { e.preventDefault(); if (!clientConnecte) { window.location.href = '/compte/connexion'; return } onWishlist(livre.livre_id, inWishlist) }}
          style={{ flex: 1, padding: '6px 0', border: `1px solid ${inWishlist ? C.or : '#ddd'}`, borderRadius: '6px', backgroundColor: inWishlist ? '#fff8e6' : 'white', color: inWishlist ? C.orIntense : C.texteSecondaire, fontSize: '13px', cursor: 'pointer' }}
        >
          {inWishlist ? '♥' : '♡'}
        </button>
        <button
          onClick={handlePanier}
          style={{ flex: 1, padding: '6px 0', border: `1px solid ${ajout ? C.vert : '#ddd'}`, borderRadius: '6px', backgroundColor: ajout ? C.fondAlt : 'white', color: ajout ? C.vert : C.texteSecondaire, fontSize: '12px', cursor: 'pointer', fontWeight: ajout ? '700' : '400', transition: 'all 0.2s' }}
        >
          {ajout ? '✓' : '🛒'}
        </button>
      </div>
    </a>
  )
}

// ── Section carousel ──────────────────────────────────────────────────────────
function SectionCarousel({
  titre, sousTitre, livres, clientConnecte, wishlistIds, onWishlist, accentColor,
}: {
  titre: string
  sousTitre?: string
  livres: SelectionLivre[]
  clientConnecte: boolean
  wishlistIds: Set<number>
  onWishlist: (id: number, inList: boolean) => void
  accentColor?: string
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  if (!livres || livres.length === 0) return null

  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'right' ? 400 : -400, behavior: 'smooth' })
  }

  return (
    <div style={{ marginBottom: '48px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '16px', borderBottom: `2px solid ${accentColor || C.vert}`, paddingBottom: '10px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: C.texte, margin: '0 0 2px' }}>{titre}</h2>
          {sousTitre && <p style={{ fontSize: '12px', color: C.texteSecondaire, margin: 0 }}>{sousTitre}</p>}
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button onClick={() => scroll('left')} style={{ width: '30px', height: '30px', borderRadius: '50%', border: '1px solid #ddd', backgroundColor: 'white', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.texteSecondaire }}>‹</button>
          <button onClick={() => scroll('right')} style={{ width: '30px', height: '30px', borderRadius: '50%', border: '1px solid #ddd', backgroundColor: 'white', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.texteSecondaire }}>›</button>
        </div>
      </div>
      <div ref={scrollRef} style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '8px', scrollbarWidth: 'none' }}>
        {livres.map(l => (
          <CarteLivre key={l.id} livre={l} label={l.label} clientConnecte={clientConnecte} wishlistIds={wishlistIds} onWishlist={onWishlist} />
        ))}
      </div>
    </div>
  )
}

// ── Page principale ───────────────────────────────────────────────────────────
export default function Livres() {
  const [selections, setSelections] = useState<Selections | null>(null)
  const [wishlistIds, setWishlistIds] = useState<Set<number>>(new Set())
  const [clientConnecte, setClientConnecte] = useState(false)

  // Wizard
  const [panelVisible, setPanelVisible] = useState(true)
  const [wizardOuvert, setWizardOuvert] = useState(false)
  const [etape, setEtape] = useState(0)
  const [reponses, setReponses] = useState<Record<number, any>>({})
  const [wizardTermine, setWizardTermine] = useState(false)

  // Filtres sidebar
  const pathname = usePathname()
  const [recherche, setRecherche] = useState('')
  const [genreFiltre, setGenreFiltre] = useState('')

  // Chargement initial + rechargement a chaque fois qu on revient sur la page
  useEffect(() => {
    const saved = localStorage.getItem('bookdog_panel_visible')
    if (saved === 'false') setPanelVisible(false)
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('clientToken')
    setClientConnecte(!!token)

    // Cache-busting : timestamp force le navigateur a ne pas utiliser le cache
    fetch('http://localhost:3001/selections?t=' + Date.now())
      .then(r => r.json())
      .then(d => setSelections(d))
      .catch(() => setSelections({ coups_de_coeur: [], prix: [], top_ventes: [] }))

    if (token) {
      fetch('http://localhost:3001/compte/wishlist', { headers: { Authorization: 'Bearer ' + token } })
        .then(r => r.json())
        .then(data => { if (Array.isArray(data)) setWishlistIds(new Set(data.map((w: any) => w.livre_id))) })
    }

    // Force re-execution au retour arriere navigateur
    const onPageShow = () => {
      fetch('http://localhost:3001/selections?t=' + Date.now())
        .then(r => r.json())
        .then(d => setSelections(d))
        .catch(() => {})
    }
    window.addEventListener('pageshow', onPageShow)
    return () => window.removeEventListener('pageshow', onPageShow)
  }, [])

  const togglePanel = () => {
    const next = !panelVisible
    setPanelVisible(next)
    localStorage.setItem('bookdog_panel_visible', String(next))
    if (!next) { setWizardOuvert(false); setWizardTermine(false); setEtape(0); setReponses({}) }
  }

  const handleReponse = (val: any) => {
    const nr = { ...reponses, [etape]: val }
    setReponses(nr)
    if (etape < ETAPES.length - 1) {
      setEtape(etape + 1)
    } else {
      if (nr[0]?.genres?.length) setGenreFiltre(nr[0].genres[0])
      setWizardTermine(true)
      setWizardOuvert(false)
    }
  }

  const resetWizard = () => {
    setEtape(0); setReponses({}); setWizardTermine(false); setWizardOuvert(true)
    setGenreFiltre('')
  }

  async function toggleWishlist(livre_id: number, inList: boolean) {
    const token = localStorage.getItem('clientToken')
    if (!token) return
    if (inList) {
      await fetch(`http://localhost:3001/compte/wishlist/${livre_id}`, { method: 'DELETE', headers: { Authorization: 'Bearer ' + token } })
      setWishlistIds(prev => { const n = new Set(prev); n.delete(livre_id); return n })
    } else {
      await fetch('http://localhost:3001/compte/wishlist', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify({ livre_id }) })
      setWishlistIds(prev => new Set([...prev, livre_id]))
    }
  }

  // Filtrage des sélections par genre/recherche si wizard actif
  const filtrerLivres = (livres: SelectionLivre[]) => {
    if (!genreFiltre && !recherche) return livres
    return livres.filter(l => {
      const matchGenre = genreFiltre ? l.livre_genre === genreFiltre : true
      const matchRecherche = recherche
        ? l.titre.toLowerCase().includes(recherche.toLowerCase()) || l.auteur.toLowerCase().includes(recherche.toLowerCase())
        : true
      return matchGenre && matchRecherche
    })
  }

  const sidebarCard: React.CSSProperties = { backgroundColor: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginBottom: '12px' }
  const sectionLabel: React.CSSProperties = { fontSize: '11px', color: C.texteSecondaire, letterSpacing: '1.5px', margin: '0 0 12px', fontWeight: '600' }
  const etapeCourante = ETAPES[etape]

  return (
    <div style={{ backgroundColor: C.fond, minHeight: '100vh', fontFamily: 'Georgia, serif' }}>
      <Header pageCourante="livres" />

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 24px 80px', boxSizing: 'border-box' }}>

        {/* ── PANEL WIZARD ── */}
        <div style={{ marginBottom: '32px' }}>
          {panelVisible ? (
            <div style={{ backgroundColor: C.vert, borderRadius: '12px', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ flex: 1 }}>
                {!wizardOuvert && !wizardTermine && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => setWizardOuvert(true)}
                      style={{ backgroundColor: C.orIntense, color: 'white', border: 'none', borderRadius: '40px', padding: '10px 22px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Georgia, serif', whiteSpace: 'nowrap' }}
                    >
                      Pas d'idée ? Trouvons un livre ensemble →
                    </button>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', margin: 0 }}>5 questions pour trouver votre prochain coup de cœur</p>
                  </div>
                )}

                {wizardOuvert && (
                  <div>
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
                      {ETAPES.map((_, i) => (
                        <div key={i} style={{ flex: 1, height: '3px', borderRadius: '2px', backgroundColor: i <= etape ? C.or : 'rgba(255,255,255,0.2)' }} />
                      ))}
                    </div>
                    <p style={{ color: C.or, fontSize: '11px', letterSpacing: '1.5px', margin: '0 0 8px', fontWeight: '600' }}>
                      {etapeCourante.icone} QUESTION {etape + 1} / {ETAPES.length} — {etapeCourante.question}
                    </p>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {etapeCourante.options.map((opt, i) => (
                        <button key={i} onClick={() => handleReponse(opt)}
                          style={{ padding: '7px 14px', backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: '40px', color: 'white', fontSize: '13px', cursor: 'pointer', fontFamily: 'Georgia, serif' }}
                          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.22)' }}
                          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)' }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    {etape > 0 && (
                      <button onClick={() => setEtape(etape - 1)} style={{ marginTop: '10px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '12px', cursor: 'pointer', fontFamily: 'Georgia, serif' }}>← Retour</button>
                    )}
                  </div>
                )}

                {wizardTermine && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                    <div>
                      <p style={{ color: C.or, fontSize: '11px', letterSpacing: '1px', margin: '0 0 3px', fontWeight: '600' }}>SÉLECTION PERSONNALISÉE</p>
                      <p style={{ color: 'white', fontSize: '14px', margin: 0 }}>{reponses[0]?.label} · {reponses[1]?.label}</p>
                    </div>
                    <button onClick={resetWizard} style={{ padding: '6px 14px', backgroundColor: 'transparent', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '20px', color: 'rgba(255,255,255,0.7)', fontSize: '13px', cursor: 'pointer', fontFamily: 'Georgia, serif' }}>
                      Recommencer
                    </button>
                  </div>
                )}
              </div>

              <button onClick={togglePanel} title="Masquer" style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '18px', cursor: 'pointer', padding: '4px', flexShrink: 0 }}>✕</button>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={togglePanel} style={{ backgroundColor: 'white', border: '1px solid #ddd', borderRadius: '40px', padding: '7px 16px', fontSize: '13px', color: C.texteSecondaire, cursor: 'pointer', fontFamily: 'Georgia, serif', boxShadow: '0 2px 6px rgba(0,0,0,0.05)' }}>
                💡 Trouver un livre
              </button>
            </div>
          )}
        </div>

        {/* ── LAYOUT PRINCIPAL : sidebar gauche + sélections droite ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '32px', alignItems: 'start' }}>

          {/* ── SIDEBAR ── */}
          <div style={{ position: 'sticky', top: '24px' }}>

            {/* Recherche */}
            <div style={sidebarCard}>
              <input
                type="text"
                placeholder="Titre, auteur..."
                value={recherche}
                onChange={e => setRecherche(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '13px', boxSizing: 'border-box', fontFamily: 'Georgia, serif' }}
              />
            </div>

            {/* Filtre genre (lié au wizard) */}
            {genreFiltre && (
              <div style={{ backgroundColor: C.fondAlt, borderRadius: '10px', padding: '10px 14px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: C.vert, fontWeight: '600' }}>{genreFiltre}</span>
                <button onClick={() => { setGenreFiltre(''); setWizardTermine(false); setEtape(0); setReponses({}) }} style={{ background: 'none', border: 'none', color: C.texteSecondaire, cursor: 'pointer', fontSize: '14px', padding: 0 }}>✕</button>
              </div>
            )}

            <div style={sidebarCard}>
              <p style={sectionLabel}>GENRE</p>
              {['Roman', 'Policier', 'Thriller', 'Science-fiction', 'Fantasy', 'Histoire', 'Biographie', 'Essai', 'Jeunesse', 'Bande dessinée', 'Poésie', 'Romance', 'Développement personnel', 'Philosophie'].map(g => (
                <label key={g} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', cursor: 'pointer', fontSize: '13px', color: genreFiltre === g ? C.vert : C.texte, fontWeight: genreFiltre === g ? '700' : '400' }}>
                  <input type="radio" name="genre" checked={genreFiltre === g} onChange={() => setGenreFiltre(g)} style={{ accentColor: C.vert }} />
                  {g}
                </label>
              ))}
              {genreFiltre && (
                <button onClick={() => setGenreFiltre('')} style={{ marginTop: '4px', background: 'none', border: 'none', color: C.texteSecondaire, fontSize: '12px', cursor: 'pointer', fontFamily: 'Georgia, serif', textDecoration: 'underline', padding: 0 }}>
                  Tous les genres
                </button>
              )}
            </div>

            <a href="/livres/catalogue" style={{ display: 'block', textAlign: 'center', padding: '10px', backgroundColor: 'white', border: `1px solid ${C.vert}`, borderRadius: '10px', color: C.vert, textDecoration: 'none', fontSize: '13px', fontWeight: '700' }}>
              Voir tout le catalogue →
            </a>
          </div>

          {/* ── SÉLECTIONS ── */}
          <div>
            {selections === null ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: C.texteSecondaire }}>Chargement des sélections...</div>
            ) : (
              <>
                <SectionCarousel
                  titre="Coups de cœur de vos libraires"
                  sousTitre="Une sélection passionnée, renouvelée chaque semaine"
                  livres={filtrerLivres(selections.coups_de_coeur)}
                  clientConnecte={clientConnecte}
                  wishlistIds={wishlistIds}
                  onWishlist={toggleWishlist}
                  accentColor={C.vert}
                />
                <SectionCarousel
                  titre="Top ventes"
                  sousTitre="Les titres les plus demandés en ce moment"
                  livres={filtrerLivres(selections.top_ventes)}
                  clientConnecte={clientConnecte}
                  wishlistIds={wishlistIds}
                  onWishlist={toggleWishlist}
                  accentColor={C.or}
                />
                <SectionCarousel
                  titre="Récompensés"
                  sousTitre="Prix littéraires et distinctions"
                  livres={filtrerLivres(selections.prix)}
                  clientConnecte={clientConnecte}
                  wishlistIds={wishlistIds}
                  onWishlist={toggleWishlist}
                  accentColor="#8B4513"
                />

                {selections.coups_de_coeur.length === 0 && selections.top_ventes.length === 0 && selections.prix.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '80px 0' }}>
                    <p style={{ fontSize: '40px', marginBottom: '12px' }}>📚</p>
                    <p style={{ color: C.texteSecondaire, fontSize: '16px', margin: '0 0 8px' }}>Aucune sélection pour le moment</p>
                    <p style={{ color: '#bbb', fontSize: '13px' }}>Ajoutez des livres depuis le dashboard admin → onglet Sélections</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <footer style={{ backgroundColor: C.footer, padding: '24px', textAlign: 'center' }}>
        <p style={{ color: C.fondAlt, fontSize: '13px', margin: 0 }}>2026 Bookdog — Librairie indépendante Paris 17e</p>
      </footer>
    </div>
  )
}