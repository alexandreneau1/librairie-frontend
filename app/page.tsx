'use client'

import { useState, useEffect, useRef } from 'react'
import Header from '../components/Header'
import { ajouterAuPanier, estDansPanier, getPanier } from '../lib/panier'

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

const GENRES = [
  'Roman', 'Policier', 'Thriller', 'Science-fiction', 'Fantasy',
  'Histoire', 'Biographie', 'Essai', 'Philosophie', 'Jeunesse',
  'Bande dessinée', 'Poésie', 'Romance', 'Développement personnel',
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

type Recommandation = {
  livre_id: number
  titre: string
  auteur: string
  genre: string
  prix: number
  raison: string
}

function TrophéeSVG({ rang }: { rang: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '6px' }}>
      <svg width="44" height="48" viewBox="0 0 44 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 4 H36 L32 24 Q30 32 22 34 Q14 32 12 24 Z" fill="#B07D4E" />
        <path d="M12 6 H20 L18 20 Q16 26 13 28 Q10 22 12 6 Z" fill="rgba(255,255,255,0.15)" />
        <path d="M8 8 Q2 8 2 16 Q2 22 8 22" stroke="#8C6239" strokeWidth="3" fill="none" strokeLinecap="round"/>
        <path d="M36 8 Q42 8 42 16 Q42 22 36 22" stroke="#8C6239" strokeWidth="3" fill="none" strokeLinecap="round"/>
        <rect x="17" y="34" width="10" height="6" fill="#8C6239" rx="1"/>
        <rect x="13" y="40" width="18" height="4" fill="#8C6239" rx="2"/>
        <text x="22" y="22" textAnchor="middle" dominantBaseline="middle" fontSize="14" fontWeight="900" fill="#F9F6F0" fontFamily="Georgia, serif">{rang}</text>
      </svg>
    </div>
  )
}

function CarteLivre({ livre, label, rang }: { livre: SelectionLivre; label?: string | null; rang?: number | null }) {
  const [imgOk, setImgOk] = useState(true)
  const [ajout, setAjout] = useState(false)
  const [dansPanier, setDansPanier] = useState(false)
  const couverture = `https://covers.openlibrary.org/b/isbn/${livre.isbn}-M.jpg`

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

      {/* Badge au-dessus de l'image */}
      {rang && <TrophéeSVG rang={rang} />}
      {label && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', padding: '0 2px' }}>
          <span style={{ fontSize: '16px', lineHeight: 1, flexShrink: 0 }}>❤️</span>
          <p style={{ color: C.vert, fontSize: '13px', fontWeight: '700', margin: 0, lineHeight: '1.2', fontStyle: 'italic' }}>{label}</p>
        </div>
      )}

      {/* Image */}
      <div style={{ width: '170px', height: '240px', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.15)', backgroundColor: C.fondAlt, marginBottom: '10px', flexShrink: 0 }}>
        {imgOk ? (
          <img src={couverture} alt={livre.titre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setImgOk(false)} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '12px', boxSizing: 'border-box', textAlign: 'center' }}>
            <span style={{ fontSize: '32px', marginBottom: '8px' }}>📚</span>
            <p style={{ fontSize: '12px', color: C.texteSecondaire, margin: 0, fontStyle: 'italic', lineHeight: '1.4' }}>{livre.titre}</p>
          </div>
        )}
      </div>

      {/* Infos */}
      <p style={{ fontSize: '14px', fontWeight: '700', color: C.texte, margin: '0 0 3px', lineHeight: '1.3', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>{livre.titre}</p>
      <p style={{ fontSize: '13px', color: C.texteSecondaire, margin: '0 0 10px', fontStyle: 'italic', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{livre.auteur}</p>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{ fontSize: '16px', fontWeight: '700', color: C.vert }}>{livre.prix} €</span>
        <span style={{ fontSize: '11px', fontWeight: '600', color: livre.stock > 0 ? C.vert : C.orIntense }}>
          {livre.stock > 0 ? 'En stock' : 'Commande'}
        </span>
      </div>
      <button
        onClick={handlePanier}
        style={{ width: '100%', padding: '8px 0', border: `1px solid ${ajout ? C.vert : dansPanier ? C.or : '#ddd'}`, borderRadius: '6px', backgroundColor: ajout ? C.fondAlt : dansPanier ? '#fff8e6' : 'white', color: ajout ? C.vert : dansPanier ? C.orIntense : C.texteSecondaire, fontSize: '14px', cursor: 'pointer', fontWeight: ajout || dansPanier ? '700' : '400', transition: 'all 0.2s', fontFamily: 'Georgia, serif' }}
      >
        {ajout ? '✓ Ajouté' : dansPanier ? '🛒 Dans le panier' : '🛒 Panier'}
      </button>
    </a>
  )
}

function SectionCarousel({ titre, sousTitre, livres, accentColor }: {
  titre: string
  sousTitre?: string
  livres: SelectionLivre[]
  accentColor?: string
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  if (!livres || livres.length === 0) return null
  const scroll = (dir: 'left' | 'right') => scrollRef.current?.scrollBy({ left: dir === 'right' ? 360 : -360, behavior: 'smooth' })

  return (
    <div style={{ marginBottom: '48px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '16px', borderBottom: `2px solid ${accentColor || C.vert}`, paddingBottom: '10px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: C.texte, margin: '0 0 2px' }}>{titre}</h2>
          {sousTitre && <p style={{ fontSize: '12px', color: C.texteSecondaire, margin: 0 }}>{sousTitre}</p>}
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button onClick={() => scroll('left')} style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid #ddd', backgroundColor: 'white', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.texteSecondaire }}>‹</button>
          <button onClick={() => scroll('right')} style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid #ddd', backgroundColor: 'white', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.texteSecondaire }}>›</button>
        </div>
      </div>
      <div ref={scrollRef} style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '8px', scrollbarWidth: 'none' }}>
        {livres.map(l => <CarteLivre key={l.id} livre={l} label={l.label} rang={l.rang} />)}
      </div>
    </div>
  )
}

export default function Home() {
  const [recherche, setRecherche] = useState('')
  const [resultats, setResultats] = useState<any[]>([])
  const [rechercheActive, setRechercheActive] = useState(false)
  const [selections, setSelections] = useState<Selections>({ coups_de_coeur: [], prix: [], top_ventes: [] })
  const [rayonsOuvert, setRayonsOuvert] = useState(false)
  const [clientConnecte, setClientConnecte] = useState(false)
  const [recommandations, setRecommandations] = useState<Recommandation[]>([])
  const [chargementReco, setChargementReco] = useState(false)
  const [recoChargees, setRecoChargees] = useState(false)
  const rayonsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Charger les sélections
    fetch('http://localhost:3001/selections')
      .then(r => r.json())
      .then(d => setSelections(d))
      .catch(() => {})

    // Vérifier connexion client
    const token = localStorage.getItem('clientToken')
    setClientConnecte(!!token)

    // Fermer le menu rayons au clic extérieur
    const handleClick = (e: MouseEvent) => {
      if (rayonsRef.current && !rayonsRef.current.contains(e.target as Node)) {
        setRayonsOuvert(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Recherche avec debounce
  useEffect(() => {
    if (!recherche.trim()) { setResultats([]); setRechercheActive(false); return }
    const delai = setTimeout(() => {
      const q = recherche.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]/g, '')
      fetch(`http://localhost:3001/livres?titre=${encodeURIComponent(q)}`)
        .then(r => r.json())
        .then(d => { setResultats(d); setRechercheActive(true) })
        .catch(() => {})
    }, 300)
    return () => clearTimeout(delai)
  }, [recherche])

  async function chargerRecommandations() {
    const token = localStorage.getItem('clientToken')
    if (!token) return
    setChargementReco(true)
    try {
      const res = await fetch('http://localhost:3001/api/recommandations', { headers: { Authorization: 'Bearer ' + token } })
      const data = await res.json()
      if (data.recommandations) setRecommandations(data.recommandations)
    } catch {}
    setChargementReco(false)
    setRecoChargees(true)
  }

  const adresseMap = '42+rue+laugier+75017+Paris'

  return (
    <div style={{ backgroundColor: C.fond, minHeight: '100vh', fontFamily: 'Georgia, serif' }}>

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <Header pageCourante="accueil" />

      {/* ── HERO — recherche + rayons ───────────────────────────────────────── */}
      <div style={{ backgroundColor: C.vert, paddingBottom: '48px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 24px 0', boxSizing: 'border-box' }}>

          {/* Titre compact */}
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <p style={{ color: C.or, fontSize: '12px', letterSpacing: '2px', margin: '0 0 8px' }}>Bienvenue chez Bookdog</p>
            <h2 style={{ color: 'white', fontSize: '32px', fontWeight: '700', margin: 0, lineHeight: '1.2' }}>
              Des livres choisis avec passion
            </h2>
          </div>

          {/* Barre de recherche */}
          <div style={{ position: 'relative', maxWidth: '680px', margin: '0 auto 24px' }}>
            <span style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', fontSize: '18px', pointerEvents: 'none' }}>🔍</span>
            <input
              type="text"
              placeholder="Rechercher un livre, un auteur..."
              value={recherche}
              onChange={e => setRecherche(e.target.value)}
              style={{ width: '100%', padding: '16px 20px 16px 52px', borderRadius: '40px', border: 'none', fontSize: '15px', boxSizing: 'border-box', backgroundColor: 'white', boxShadow: '0 4px 20px rgba(0,0,0,0.2)', outline: 'none', fontFamily: 'Georgia, serif' }}
            />
            {recherche && (
              <button onClick={() => { setRecherche(''); setRechercheActive(false) }} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: C.texteSecondaire }}>✕</button>
            )}

            {/* Résultats de recherche */}
            {rechercheActive && (
              <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0, backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.2)', zIndex: 100, overflow: 'hidden', maxHeight: '320px', overflowY: 'auto' }}>
                {resultats.length === 0 ? (
                  <p style={{ padding: '20px', color: C.texteSecondaire, margin: 0, fontSize: '14px' }}>Aucun résultat pour « {recherche} »</p>
                ) : resultats.slice(0, 6).map((l: any) => (
                  <a key={l.id} href={`/livres/${l.id}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid #f5f5f5', textDecoration: 'none', backgroundColor: 'white' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = C.fondAlt}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'white'}
                  >
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: '600', color: C.texte, margin: '0 0 2px' }}>{l.titre}</p>
                      <p style={{ fontSize: '12px', color: C.texteSecondaire, margin: 0, fontStyle: 'italic' }}>{l.auteur}</p>
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: '700', color: C.vert, flexShrink: 0, marginLeft: '16px' }}>{l.prix} €</span>
                  </a>
                ))}
                {resultats.length > 6 && (
                  <a href={`/livres?q=${encodeURIComponent(recherche)}`} style={{ display: 'block', padding: '12px 20px', textAlign: 'center', fontSize: '13px', color: C.vert, fontWeight: '600', textDecoration: 'none', backgroundColor: C.fondAlt }}>
                    Voir tous les résultats ({resultats.length}) →
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Boutons d'action */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>

            {/* Menu Rayons déroulant */}
            <div ref={rayonsRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setRayonsOuvert(!rayonsOuvert)}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', backgroundColor: rayonsOuvert ? 'white' : 'rgba(255,255,255,0.15)', color: rayonsOuvert ? C.vert : 'white', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '40px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: 'Georgia, serif' }}
              >
                ☰ Rayons {rayonsOuvert ? '▲' : '▼'}
              </button>
              {rayonsOuvert && (
                <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.2)', zIndex: 200, minWidth: '220px', overflow: 'hidden' }}>
                  {GENRES.map((g, i) => (
                    <a key={g} href={`/livres?genre=${encodeURIComponent(g)}`}
                      style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 20px', textDecoration: 'none', color: C.texte, fontSize: '14px', borderBottom: i < GENRES.length - 1 ? '1px solid #f5f5f5' : 'none', backgroundColor: 'white' }}
                      onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.fondAlt; e.currentTarget.style.color = C.vert }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'white'; e.currentTarget.style.color = C.texte }}
                    >
                      <span style={{ color: C.or, fontSize: '12px' }}>▶</span> {g}
                    </a>
                  ))}
                </div>
              )}
            </div>

            <a href="/livres" style={{ padding: '10px 20px', backgroundColor: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '40px', fontSize: '14px', fontWeight: '600', textDecoration: 'none' }}>
              Tout le catalogue
            </a>
            <a href="/click-collect" style={{ padding: '10px 20px', backgroundColor: C.orIntense, color: 'white', border: 'none', borderRadius: '40px', fontSize: '14px', fontWeight: '600', textDecoration: 'none' }}>
              Click & Collect
            </a>
          </div>
        </div>
      </div>

      <div style={{ backgroundColor: C.vert, height: '32px', borderRadius: '0 0 50% 50% / 0 0 28px 28px' }} />

      {/* ── CONTENU PRINCIPAL ───────────────────────────────────────────────── */}
      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '48px 24px 60px', boxSizing: 'border-box' }}>

        {/* Recommandations IA si connecté */}
        {clientConnecte && (
          <div style={{ backgroundColor: C.vert, borderRadius: '16px', padding: '24px 28px', marginBottom: '48px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: recoChargees && recommandations.length > 0 ? '20px' : '0', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <p style={{ color: C.or, fontSize: '11px', letterSpacing: '2px', fontWeight: '600', margin: '0 0 4px' }}>POUR VOUS</p>
                <h3 style={{ color: 'white', fontSize: '18px', fontWeight: '700', margin: 0 }}>Nos suggestions personnalisées</h3>
              </div>
              {!recoChargees ? (
                <button onClick={chargerRecommandations} disabled={chargementReco} style={{ backgroundColor: chargementReco ? 'rgba(255,255,255,0.1)' : C.or, color: chargementReco ? 'rgba(255,255,255,0.5)' : C.vert, border: 'none', borderRadius: '40px', padding: '9px 20px', fontSize: '13px', fontWeight: '700', cursor: chargementReco ? 'not-allowed' : 'pointer', fontFamily: 'Georgia, serif', whiteSpace: 'nowrap' as const }}>
                  {chargementReco ? '✨ Analyse...' : '✨ Voir mes recommandations'}
                </button>
              ) : (
                <button onClick={chargerRecommandations} disabled={chargementReco} style={{ backgroundColor: 'transparent', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '40px', padding: '7px 14px', fontSize: '12px', cursor: 'pointer', fontFamily: 'Georgia, serif' }}>
                  {chargementReco ? '...' : '↺ Actualiser'}
                </button>
              )}
            </div>
            {recoChargees && recommandations.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
                {recommandations.map((r, i) => (
                  <a key={i} href={`/livres/${r.livre_id}`} style={{ textDecoration: 'none' }}>
                    <div style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '10px', padding: '16px', border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer' }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.14)'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ backgroundColor: C.or, color: C.vert, fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '20px' }}>#{i + 1}</span>
                        <span style={{ color: C.or, fontSize: '14px', fontWeight: '700' }}>{Number(r.prix).toFixed(2)} €</span>
                      </div>
                      <p style={{ color: 'white', fontSize: '14px', fontWeight: '700', margin: '0 0 3px', lineHeight: '1.3' }}>{r.titre}</p>
                      <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '11px', margin: '0 0 8px', fontStyle: 'italic' }}>{r.auteur}</p>
                      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', margin: 0, lineHeight: '1.5', fontStyle: 'italic' }}>{r.raison}</p>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Coups de cœur */}
        <SectionCarousel
          titre="Coups de cœur de vos libraires"
          sousTitre="Une sélection passionnée, renouvelée chaque semaine"
          livres={selections.coups_de_coeur}
          accentColor={C.vert}
        />

        {/* Top ventes */}
        <SectionCarousel
          titre="Top ventes"
          sousTitre="Les titres les plus demandés en ce moment"
          livres={selections.top_ventes}
          accentColor={C.or}
        />

        {/* Récompensés */}
        <SectionCarousel
          titre="Récompensés"
          sousTitre="Prix littéraires et distinctions"
          livres={selections.prix}
          accentColor="#8B4513"
        />

        {/* Section Entreprises */}
        <div style={{ backgroundColor: C.vert, borderRadius: '16px', padding: '40px', marginBottom: '0', display: 'grid', gridTemplateColumns: '1fr auto', gap: '32px', alignItems: 'center' }}>
          <div>
            <p style={{ color: C.or, fontSize: '11px', letterSpacing: '2px', fontWeight: '600', margin: '0 0 8px' }}>SERVICES PROFESSIONNELS</p>
            <h2 style={{ color: 'white', fontSize: '24px', fontWeight: '700', margin: '0 0 12px' }}>Vous êtes une entreprise ?</h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', lineHeight: '1.7', margin: '0 0 20px' }}>
              Comités d'entreprise, cadeaux professionnels, bibliothèques d'entreprise, événements culturels — Bookdog accompagne les organisations avec des offres sur mesure.
            </p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {['Cadeaux CE', 'Ateliers lecture', 'Commandes groupées', 'Facturation entreprise'].map(tag => (
                <span key={tag} style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)', fontSize: '12px', padding: '4px 12px', borderRadius: '20px' }}>{tag}</span>
              ))}
            </div>
          </div>
          <div style={{ textAlign: 'center', flexShrink: 0 }}>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', margin: '0 0 12px' }}>Offre en cours de développement</p>
            <a href="mailto:Bookdog@librairie.com?subject=Services entreprise" style={{ display: 'inline-block', backgroundColor: C.or, color: C.vert, padding: '12px 24px', borderRadius: '40px', fontSize: '14px', fontWeight: '700', textDecoration: 'none' }}>
              Nous contacter →
            </a>
          </div>
        </div>
      </main>

      {/* ── INFOS PRATIQUES ─────────────────────────────────────────────────── */}
      <div id="infos" style={{ backgroundColor: C.vert, marginTop: '0' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '60px 24px', boxSizing: 'border-box' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <p style={{ color: C.or, fontSize: '12px', letterSpacing: '2px', marginBottom: '8px' }}>Nous trouver</p>
            <h2 style={{ color: 'white', fontSize: '28px', fontWeight: '700', margin: 0 }}>Infos pratiques</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }}>
            <div style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '12px', padding: '24px' }}>
              <p style={{ color: C.or, fontSize: '11px', letterSpacing: '1px', marginBottom: '10px', fontWeight: '600' }}>ADRESSE</p>
              <a href={`https://www.google.com/maps/search/?api=1&query=${adresseMap}`} target="_blank" rel="noopener noreferrer" style={{ color: 'white', textDecoration: 'none', fontSize: '15px', fontWeight: '500', lineHeight: '1.6' }}>
                42 rue Laugier, 75017 Paris<br />
                <span style={{ color: C.fondAlt, fontSize: '12px', fontWeight: '400' }}>Ouvrir dans Maps →</span>
              </a>
            </div>
            <div style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '12px', padding: '24px' }}>
              <p style={{ color: C.or, fontSize: '11px', letterSpacing: '1px', marginBottom: '10px', fontWeight: '600' }}>HORAIRES</p>
              <p style={{ color: 'white', fontSize: '15px', fontWeight: '500', lineHeight: '1.8', margin: 0 }}>Lundi – Samedi : 10h00 – 20h00</p>
              <p style={{ color: C.fondAlt, fontSize: '12px', marginTop: '6px' }}>Fermé le dimanche</p>
            </div>
            <div style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '12px', padding: '24px' }}>
              <p style={{ color: C.or, fontSize: '11px', letterSpacing: '1px', marginBottom: '10px', fontWeight: '600' }}>CONTACT</p>
              <a href="tel:0677402151" style={{ display: 'block', color: 'white', textDecoration: 'none', fontSize: '15px', fontWeight: '500', marginBottom: '6px' }}>06 77 40 21 51</a>
              <a href="mailto:Bookdog@librairie.com" style={{ display: 'block', color: C.fondAlt, textDecoration: 'none', fontSize: '13px' }}>Bookdog@librairie.com</a>
            </div>
          </div>
        </div>
      </div>

      <footer style={{ backgroundColor: C.footer, padding: '24px', textAlign: 'center' }}>
        <p style={{ color: C.fondAlt, fontSize: '13px', margin: 0 }}>2026 Bookdog — Librairie independante Paris 17e</p>
      </footer>
    </div>
  )
}