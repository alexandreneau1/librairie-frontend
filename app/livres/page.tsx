'use client'

import React, { useState, useEffect, useRef } from 'react'
import Header from '../../components/Header'
import { ajouterAuPanier, estDansPanier, getPanier } from '../../lib/panier'

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
      { label: 'SF & Fantasy', genres: ['Science-fiction', 'Fantasy'] },
      { label: 'Essai / Idées', genres: ['Essai', 'Histoire', 'Philosophie', 'Biographie', 'Développement personnel'] },
      { label: 'Jeunesse', genres: ['Jeunesse'] },
      { label: 'Bande dessinée', genres: ['Bande dessinée'] },
    ],
  },
  {
    question: 'Quelle ambiance recherchez-vous ?',
    icone: '🌿',
    options: [
      { label: 'Me dépayser', tag: 'depaysement' },
      { label: 'Ressentir des émotions', tag: 'emotion' },
      { label: 'Réfléchir, apprendre', tag: 'reflexion' },
      { label: 'Me détendre', tag: 'detente' },
      { label: 'Avoir des frissons', tag: 'frissons' },
    ],
  },
  {
    question: 'Pour qui est ce livre ?',
    icone: '🎁',
    options: [
      { label: 'Pour moi', tag: 'moi' },
      { label: 'Cadeau — adulte', tag: 'cadeau_adulte' },
      { label: 'Cadeau — enfant / ado', tag: 'cadeau_enfant' },
    ],
  },
  {
    question: 'Combien de temps avez-vous ?',
    icone: '⏱',
    options: [
      { label: 'Une soirée (< 200 pages)', tag: 'court' },
      { label: 'Un week-end (200–400 pages)', tag: 'moyen' },
      { label: 'Plusieurs semaines (> 400 pages)', tag: 'long' },
      { label: 'Peu importe', tag: 'indifferent' },
    ],
  },
  {
    question: 'Une époque de prédilection ?',
    icone: '🕰',
    options: [
      { label: 'Classique (avant 1960)', tag: 'classique' },
      { label: 'Contemporain (après 1960)', tag: 'contemporain' },
      { label: 'Peu importe', tag: 'indifferent' },
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
  livre_genre?: string | null
}

type Selections = {
  coups_de_coeur: SelectionLivre[]
  prix: SelectionLivre[]
  top_ventes: SelectionLivre[]
}

const SELECTIONS_VIDES: Selections = { coups_de_coeur: [], prix: [], top_ventes: [] }

// ── Cache module-level ────────────────────────────────────────────────────────
// Persiste pour toute la durée de vie du bundle JS.
// NE PAS utiliser dans useState() — mismatch SSR/client.
// Lire uniquement dans useEffect().
let _moduleCache: Selections | null = null

function lireCache(): Selections | null {
  if (_moduleCache) return _moduleCache
  try {
    const raw = sessionStorage.getItem('bookdog_selections')
    if (raw) { _moduleCache = JSON.parse(raw); return _moduleCache }
  } catch {}
  return null
}

function ecrireCache(d: Selections) {
  _moduleCache = d
  try { sessionStorage.setItem('bookdog_selections', JSON.stringify(d)) } catch {}
}

// ── Trophée SVG ───────────────────────────────────────────────────────────────
type Badge = { type: 'coeur' | 'trophee' | 'prix'; label?: string | null; rang?: number | null }

function TrophéeSVG({ rang, taille = 44 }: { rang: number; taille?: number }) {
  const h = Math.round(taille * 48 / 44)
  return (
    <svg width={taille} height={h} viewBox="0 0 44 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 4 H36 L32 24 Q30 32 22 34 Q14 32 12 24 Z" fill="#B07D4E" />
      <path d="M12 6 H20 L18 20 Q16 26 13 28 Q10 22 12 6 Z" fill="rgba(255,255,255,0.15)" />
      <path d="M8 8 Q2 8 2 16 Q2 22 8 22" stroke="#8C6239" strokeWidth="3" fill="none" strokeLinecap="round"/>
      <path d="M36 8 Q42 8 42 16 Q42 22 36 22" stroke="#8C6239" strokeWidth="3" fill="none" strokeLinecap="round"/>
      <rect x="17" y="34" width="10" height="6" fill="#8C6239" rx="1"/>
      <rect x="13" y="40" width="18" height="4" fill="#8C6239" rx="2"/>
      <text x="22" y="22" textAnchor="middle" dominantBaseline="middle" fontSize="14" fontWeight="900" fill="#F9F6F0" fontFamily="Georgia, serif">{rang}</text>
    </svg>
  )
}

function LauriersSVG({ taille = 44 }: { taille?: number }) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M22 38 Q8 30 6 20 Q5 12 8 8" stroke="#2D6347" strokeWidth="1.5" fill="none"/>
      <ellipse cx="8" cy="9" rx="5" ry="2.5" fill="#2D6347" transform="rotate(-40 8 9)"/>
      <ellipse cx="8" cy="16" rx="5" ry="2.5" fill="#3B7A57" transform="rotate(-25 8 16)"/>
      <ellipse cx="10" cy="23" rx="5" ry="2.5" fill="#2D6347" transform="rotate(-12 10 23)"/>
      <ellipse cx="14" cy="30" rx="5" ry="2.5" fill="#3B7A57" transform="rotate(0 14 30)"/>
      <ellipse cx="19" cy="36" rx="5" ry="2.5" fill="#2D6347" transform="rotate(12 19 36)"/>
      <path d="M22 38 Q36 30 38 20 Q39 12 36 8" stroke="#2D6347" strokeWidth="1.5" fill="none"/>
      <ellipse cx="36" cy="9" rx="5" ry="2.5" fill="#2D6347" transform="rotate(40 36 9)"/>
      <ellipse cx="36" cy="16" rx="5" ry="2.5" fill="#3B7A57" transform="rotate(25 36 16)"/>
      <ellipse cx="34" cy="23" rx="5" ry="2.5" fill="#2D6347" transform="rotate(12 34 23)"/>
      <ellipse cx="30" cy="30" rx="5" ry="2.5" fill="#3B7A57" transform="rotate(0 30 30)"/>
      <ellipse cx="25" cy="36" rx="5" ry="2.5" fill="#2D6347" transform="rotate(-12 25 36)"/>
      <ellipse cx="22" cy="5" rx="5" ry="2.5" fill="#2D6347"/>
      <path d="M17 38 Q22 42 27 38" stroke="#8C6239" strokeWidth="1.5" fill="none"/>
    </svg>
  )
}

function BadgesMultiples({ badges }: { badges: Badge[] }) {
  const [hover, setHover] = useState(false)
  const tooltip = badges.map(b => {
    if (b.type === 'trophee') return `Top ${b.rang} des ventes en France`
    if (b.type === 'coeur') return b.label ? `Coup de cœur — ${b.label}` : 'Coup de cœur'
    if (b.type === 'prix') return b.label ? `Prix littéraire — ${b.label}` : 'Prix littéraire'
    return ''
  }).join(' · ')

  return (
    <div
      style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '8px', cursor: 'default' }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {badges.map((b, i) => (
        <span key={i} style={{ display: 'flex', alignItems: 'center' }}>
          {b.type === 'trophee' && <TrophéeSVG rang={b.rang!} taille={28} />}
          {b.type === 'coeur' && <span style={{ fontSize: '22px', lineHeight: 1 }}>❤️</span>}
          {b.type === 'prix' && <LauriersSVG taille={28} />}
        </span>
      ))}
      {hover && (
        <div style={{
          position: 'absolute', bottom: 'calc(100% + 6px)', left: '50%', transform: 'translateX(-50%)',
          backgroundColor: C.vert, color: 'white', fontSize: '11px', fontWeight: '600',
          padding: '6px 10px', borderRadius: '6px', whiteSpace: 'nowrap', zIndex: 10,
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)', pointerEvents: 'none',
        }}>
          {tooltip}
          <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: `5px solid ${C.vert}` }} />
        </div>
      )}
    </div>
  )
}

// ── Carte livre ───────────────────────────────────────────────────────────────
function CarteLivre({ livre, badges, clientConnecte, wishlistIds, onWishlist }: {
  livre: SelectionLivre
  badges: Badge[]
  clientConnecte: boolean
  wishlistIds: Set<number>
  onWishlist: (id: number, inList: boolean) => void
}) {
  const [imgOk, setImgOk] = useState(true)
  const [ajout, setAjout] = useState(false)
  const [dansPanier, setDansPanier] = useState(false)
  const inWishlist = wishlistIds.has(livre.livre_id)
  const couverture = `https://covers.openlibrary.org/b/isbn/${livre.isbn}-M.jpg`
  const badgeUnique = badges.length === 1 ? badges[0] : null

  useEffect(() => {
    setDansPanier(estDansPanier(livre.livre_id))
    const handler = () => setDansPanier(estDansPanier(livre.livre_id))
    window.addEventListener('bookdog_panier_change', handler)
    return () => window.removeEventListener('bookdog_panier_change', handler)
  }, [livre.livre_id])

  const handlePanier = (e: React.MouseEvent) => {
    e.preventDefault()
    if (dansPanier) {
      const panier = getPanier()
      const article = panier.find(a => a.livre_id === livre.livre_id)
      const qteActuelle = article?.quantite || 1
      if (!confirm(`"${livre.titre}" est déjà dans votre panier (${qteActuelle} ex.). Ajouter un exemplaire supplémentaire ?`)) return
    }
    ajouterAuPanier({ livre_id: livre.livre_id, titre: livre.titre, auteur: livre.auteur, isbn: livre.isbn, prix: livre.prix, stock: livre.stock })
    setAjout(true)
    setDansPanier(true)
    setTimeout(() => setAjout(false), 1500)
  }

  return (
    <a href={`/livres/${livre.livre_id}`} style={{ textDecoration: 'none', flexShrink: 0, width: '170px', display: 'flex', flexDirection: 'column' }}>

      {/* Badges au-dessus de l'image */}
      {badges.length > 1 && <BadgesMultiples badges={badges} />}
      {badgeUnique?.type === 'trophee' && badgeUnique.rang && (
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '6px' }}>
          <TrophéeSVG rang={badgeUnique.rang} />
        </div>
      )}
      {badgeUnique?.type === 'coeur' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', padding: '0 2px' }}>
          <span style={{ fontSize: '16px', lineHeight: 1, flexShrink: 0 }}>❤️</span>
          <p style={{ color: C.vert, fontSize: '13px', fontWeight: '700', margin: 0, lineHeight: '1.2', fontStyle: 'italic' }}>{badgeUnique.label}</p>
        </div>
      )}
      {badgeUnique?.type === 'prix' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', padding: '0 2px' }}>
          <LauriersSVG taille={36} />
          <p style={{ color: '#2D6347', fontSize: '12px', fontWeight: '700', margin: 0, lineHeight: '1.2', fontStyle: 'italic' }}>{badgeUnique.label || 'Prix littéraire'}</p>
        </div>
      )}

      {/* Image */}
      <div style={{ width: '170px', height: '240px', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.15)', backgroundColor: C.fondAlt, marginBottom: '10px', flexShrink: 0 }}>
        {imgOk ? (
          <img src={couverture} alt={livre.titre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setImgOk(false)} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px', boxSizing: 'border-box', textAlign: 'center' }}>
            <span style={{ fontSize: '32px', marginBottom: '8px' }}>📚</span>
            <p style={{ fontSize: '12px', color: C.texteSecondaire, margin: 0, fontStyle: 'italic', lineHeight: '1.3' }}>{livre.titre}</p>
          </div>
        )}
      </div>

      <p style={{ fontSize: '14px', fontWeight: '700', color: C.texte, margin: '0 0 3px', lineHeight: '1.3', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>{livre.titre}</p>
      <p style={{ fontSize: '13px', color: C.texteSecondaire, margin: '0 0 8px', fontStyle: 'italic', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{livre.auteur}</p>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{ fontSize: '16px', fontWeight: '700', color: C.vert }}>{livre.prix} €</span>
        <span style={{ fontSize: '11px', fontWeight: '600', color: livre.stock > 0 ? C.vert : C.orIntense }}>
          {livre.stock > 0 ? 'En stock' : 'Commande'}
        </span>
      </div>
      <div style={{ display: 'flex', gap: '6px' }} onClick={e => e.preventDefault()}>
        <button
          onClick={e => { e.preventDefault(); if (!clientConnecte) { window.location.href = '/compte/connexion'; return } onWishlist(livre.livre_id, inWishlist) }}
          style={{ flex: 1, padding: '7px 0', border: `1px solid ${inWishlist ? C.or : '#ddd'}`, borderRadius: '6px', backgroundColor: inWishlist ? '#fff8e6' : 'white', color: inWishlist ? C.orIntense : C.texteSecondaire, fontSize: '14px', cursor: 'pointer' }}
        >
          {inWishlist ? '♥' : '♡'}
        </button>
        <button
          onClick={handlePanier}
          style={{ flex: 1, padding: '7px 0', border: `1px solid ${ajout ? C.vert : dansPanier ? C.or : '#ddd'}`, borderRadius: '6px', backgroundColor: ajout ? C.fondAlt : dansPanier ? '#fff8e6' : 'white', color: ajout ? C.vert : dansPanier ? C.orIntense : C.texteSecondaire, fontSize: '14px', cursor: 'pointer', fontWeight: ajout || dansPanier ? '700' : '400', transition: 'all 0.2s' }}
        >
          {ajout ? '✓' : '🛒'}
        </button>
      </div>
    </a>
  )
}

// ── Carousel ──────────────────────────────────────────────────────────────────
function SectionCarousel({ titre, sousTitre, livres, badgesMap, clientConnecte, wishlistIds, onWishlist, accentColor }: {
  titre: string
  sousTitre?: string
  livres: SelectionLivre[]
  badgesMap: Map<number, Badge[]>
  clientConnecte: boolean
  wishlistIds: Set<number>
  onWishlist: (id: number, inList: boolean) => void
  accentColor?: string
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  if (!livres || livres.length === 0) return null
  const scroll = (dir: 'left' | 'right') => scrollRef.current?.scrollBy({ left: dir === 'right' ? 400 : -400, behavior: 'smooth' })

  return (
    <div style={{ marginBottom: '48px' }}>
      {titre && (
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
      )}
      {!titre && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', marginBottom: '12px' }}>
          <button onClick={() => scroll('left')} style={{ width: '30px', height: '30px', borderRadius: '50%', border: '1px solid #ddd', backgroundColor: 'white', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.texteSecondaire }}>‹</button>
          <button onClick={() => scroll('right')} style={{ width: '30px', height: '30px', borderRadius: '50%', border: '1px solid #ddd', backgroundColor: 'white', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.texteSecondaire }}>›</button>
        </div>
      )}
      <div ref={scrollRef} style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '8px', scrollbarWidth: 'none' }}>
        {livres.map(l => (
          <CarteLivre key={l.id} livre={l} badges={badgesMap.get(l.livre_id) || []} clientConnecte={clientConnecte} wishlistIds={wishlistIds} onWishlist={onWishlist} />
        ))}
      </div>
    </div>
  )
}

// ── Page principale ───────────────────────────────────────────────────────────
export default function Livres() {
  // Toujours initialisé à vide — identique serveur et client, zéro mismatch
  const [selections, setSelections] = useState<Selections>(SELECTIONS_VIDES)
  const [loaded, setLoaded] = useState(false)
  const [wishlistIds, setWishlistIds] = useState<Set<number>>(new Set())
  const [clientConnecte, setClientConnecte] = useState(false)
  const [panelVisible, setPanelVisible] = useState(true)
  const [wizardOuvert, setWizardOuvert] = useState(false)
  const [etape, setEtape] = useState(0)
  const [reponses, setReponses] = useState<Record<number, any>>({})
  const [wizardTermine, setWizardTermine] = useState(false)
  const [genreFiltre, setGenreFiltre] = useState('')
  const [recherche, setRecherche] = useState('')

  const changerGenre = (genre: string) => {
    setGenreFiltre(genre)
    const url = new URL(window.location.href)
    if (genre) url.searchParams.set('genre', genre)
    else url.searchParams.delete('genre')
    window.history.replaceState(null, '', url.toString())
  }

  useEffect(() => {
    if (localStorage.getItem('bookdog_panel_visible') === 'false') setPanelVisible(false)

    // Lire le genre depuis l'URL (?genre=Policier)
    const params = new URLSearchParams(window.location.search)
    const genreUrl = params.get('genre')
    if (genreUrl) setGenreFiltre(decodeURIComponent(genreUrl))

    const token = localStorage.getItem('clientToken')
    setClientConnecte(!!token)
    if (token) {
      fetch('http://localhost:3001/compte/wishlist', { headers: { Authorization: 'Bearer ' + token } })
        .then(r => r.json())
        .then(data => { if (Array.isArray(data)) setWishlistIds(new Set(data.map((w: any) => w.livre_id))) })
        .catch(() => {})
    }

    // Lecture du cache module dans useEffect — côté client uniquement, zéro mismatch
    const cached = lireCache()
    if (cached) {
      setSelections(cached)
      setLoaded(true)
    } else {
      fetch('http://localhost:3001/selections')
        .then(r => r.json())
        .then(d => {
          ecrireCache(d)
          setSelections(d)
          setLoaded(true)
        })
        .catch(() => {
          setSelections(SELECTIONS_VIDES)
          setLoaded(true)
        })
    }
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
      if (nr[0]?.genres?.length) changerGenre(nr[0].genres[0])
      setWizardTermine(true)
      setWizardOuvert(false)
    }
  }

  const resetWizard = () => {
    setEtape(0); setReponses({}); setWizardTermine(false); setWizardOuvert(true); changerGenre('')
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

  const filtrerLivres = (livres: SelectionLivre[]) => {
    if (!genreFiltre && !recherche) return livres
    return livres.filter(l => {
      const matchGenre = genreFiltre ? l.livre_genre === genreFiltre : true
      const matchRecherche = recherche ? l.titre.toLowerCase().includes(recherche.toLowerCase()) || l.auteur.toLowerCase().includes(recherche.toLowerCase()) : true
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

        <div style={{ marginBottom: '32px' }}>
          {panelVisible ? (
            <div style={{ backgroundColor: C.vert, borderRadius: '12px', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ flex: 1 }}>
                {!wizardOuvert && !wizardTermine && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                    <button onClick={() => setWizardOuvert(true)} style={{ backgroundColor: C.orIntense, color: 'white', border: 'none', borderRadius: '40px', padding: '10px 22px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Georgia, serif', whiteSpace: 'nowrap' }}>
                      Pas d'idée ? Trouvons un livre ensemble →
                    </button>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', margin: 0 }}>5 questions pour trouver votre prochain coup de cœur</p>
                  </div>
                )}
                {wizardOuvert && (
                  <div>
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
                      {ETAPES.map((_, i) => <div key={i} style={{ flex: 1, height: '3px', borderRadius: '2px', backgroundColor: i <= etape ? C.or : 'rgba(255,255,255,0.2)' }} />)}
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
                    {etape > 0 && <button onClick={() => setEtape(etape - 1)} style={{ marginTop: '10px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '12px', cursor: 'pointer', fontFamily: 'Georgia, serif' }}>← Retour</button>}
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
              <button onClick={togglePanel} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '18px', cursor: 'pointer', padding: '4px', flexShrink: 0 }}>✕</button>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={togglePanel} style={{ backgroundColor: 'white', border: '1px solid #ddd', borderRadius: '40px', padding: '7px 16px', fontSize: '13px', color: C.texteSecondaire, cursor: 'pointer', fontFamily: 'Georgia, serif', boxShadow: '0 2px 6px rgba(0,0,0,0.05)' }}>
                💡 Trouver un livre
              </button>
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '32px', alignItems: 'start' }}>
          <div style={{ position: 'sticky', top: '24px' }}>
            <div style={sidebarCard}>
              <input type="text" placeholder="Titre, auteur..." value={recherche} onChange={e => setRecherche(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '13px', boxSizing: 'border-box', fontFamily: 'Georgia, serif' }} />
            </div>
            {genreFiltre && (
              <div style={{ backgroundColor: C.fondAlt, borderRadius: '10px', padding: '10px 14px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: C.vert, fontWeight: '600' }}>{genreFiltre}</span>
                <button onClick={() => { changerGenre(''); setWizardTermine(false); setEtape(0); setReponses({}) }} style={{ background: 'none', border: 'none', color: C.texteSecondaire, cursor: 'pointer', fontSize: '14px', padding: 0 }}>✕</button>
              </div>
            )}
            <div style={sidebarCard}>
              <p style={sectionLabel}>GENRE</p>
              {['Roman', 'Policier', 'Thriller', 'Science-fiction', 'Fantasy', 'Histoire', 'Biographie', 'Essai', 'Jeunesse', 'Bande dessinée', 'Poésie', 'Romance', 'Développement personnel', 'Philosophie'].map(g => (
                <label key={g} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', cursor: 'pointer', fontSize: '13px', color: genreFiltre === g ? C.vert : C.texte, fontWeight: genreFiltre === g ? '700' : '400' }}>
                  <input type="radio" name="genre" checked={genreFiltre === g} onChange={() => changerGenre(g)} style={{ accentColor: C.vert }} />
                  {g}
                </label>
              ))}
              {genreFiltre && (
                <button onClick={() => changerGenre('')} style={{ marginTop: '4px', background: 'none', border: 'none', color: C.texteSecondaire, fontSize: '12px', cursor: 'pointer', fontFamily: 'Georgia, serif', textDecoration: 'underline', padding: 0 }}>
                  Tous les genres
                </button>
              )}
            </div>
            <a href="/livres/catalogue" style={{ display: 'block', textAlign: 'center', padding: '10px', backgroundColor: 'white', border: `1px solid ${C.vert}`, borderRadius: '10px', color: C.vert, textDecoration: 'none', fontSize: '13px', fontWeight: '700' }}>
              Voir tout le catalogue →
            </a>
          </div>

          <div>
            {!loaded ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: C.texteSecondaire }}>Chargement des sélections...</div>
            ) : (
              <>
                {(() => {
                  const badgesMap = new Map<number, Badge[]>()
                  const ajouter = (l: SelectionLivre, badge: Badge) => {
                    const existing = badgesMap.get(l.livre_id) || []
                    badgesMap.set(l.livre_id, [...existing, badge])
                  }
                  selections.coups_de_coeur.forEach(l => ajouter(l, { type: 'coeur', label: l.label }))
                  selections.top_ventes.forEach(l => ajouter(l, { type: 'trophee', rang: l.rang, label: l.label }))
                  selections.prix.forEach(l => ajouter(l, { type: 'prix', label: l.label }))

                  // Dédoublonner par livre_id pour n'afficher chaque livre qu'une fois
                  const vus = new Set<number>()
                  const tousLesLivres: SelectionLivre[] = []
                  ;[...selections.coups_de_coeur, ...selections.top_ventes, ...selections.prix].forEach(l => {
                    if (!vus.has(l.livre_id)) { vus.add(l.livre_id); tousLesLivres.push(l) }
                  })

                  const livresFiltres = filtrerLivres(tousLesLivres)

                  if (livresFiltres.length === 0) return (
                    <div style={{ textAlign: 'center', padding: '80px 0' }}>
                      <p style={{ fontSize: '40px', marginBottom: '12px' }}>📚</p>
                      <p style={{ color: C.texteSecondaire, fontSize: '16px', margin: '0 0 8px' }}>Aucune sélection pour le moment</p>
                      <p style={{ color: '#bbb', fontSize: '13px' }}>Ajoutez des livres depuis le dashboard admin → onglet Sélections</p>
                    </div>
                  )

                  return <SectionCarousel titre="" livres={livresFiltres} badgesMap={badgesMap} clientConnecte={clientConnecte} wishlistIds={wishlistIds} onWishlist={toggleWishlist} accentColor="transparent" />
                })()}
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