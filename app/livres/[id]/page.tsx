'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Header from '../../../components/Header'
import { ajouterAuPanier, estDansPanier } from '../../../lib/panier'

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
  description: string | null
  editeur: string | null
  collection: string | null
  date_publication: string | null
  url_goodreads: string | null
}

type Avis = {
  id: number
  note: number
  commentaire: string | null
  date_avis: string
  prenom: string
  nom: string
}

export default function FicheLivre() {
  const params = useParams()
  const id = params.id as string

  const [livre, setLivre] = useState<Livre | null>(null)
  const [avis, setAvis] = useState<Avis[]>([])
  const [moyenne, setMoyenne] = useState<string | null>(null)
  const [chargement, setChargement] = useState(true)

  // Réservation
  const [nom, setNom] = useState('')
  const [email, setEmail] = useState('')
  const [confirmation, setConfirmation] = useState(false)
  const [erreurResa, setErreurResa] = useState('')

  // Panier
  const [dansPanier, setDansPanier] = useState(false)
  const [ajoutAnimation, setAjoutAnimation] = useState(false)

  // Wishlist
  const [clientConnecte, setClientConnecte] = useState(false)
  const [inWishlist, setInWishlist] = useState(false)
  const [wishlistLoading, setWishlistLoading] = useState(false)

  // Avis
  const [maNote, setMaNote] = useState(0)
  const [monCommentaire, setMonCommentaire] = useState('')
  const [avisEnvoye, setAvisEnvoye] = useState(false)
  const [erreurAvis, setErreurAvis] = useState('')

  useEffect(() => {
    fetch(`http://localhost:3001/livres/${id}`)
      .then(r => r.json())
      .then(data => { setLivre(data); setChargement(false) })

    fetch(`http://localhost:3001/avis/${id}`)
      .then(r => r.json())
      .then(data => { setAvis(data.avis || []); setMoyenne(data.moyenne) })

    const token = localStorage.getItem('clientToken')
    setClientConnecte(!!token)

    // Vérifier wishlist
    if (token) {
      fetch('http://localhost:3001/compte/wishlist', { headers: { Authorization: 'Bearer ' + token } })
        .then(r => r.json())
        .then(data => {
          if (Array.isArray(data)) setInWishlist(data.some((w: any) => w.livre_id === parseInt(id)))
        })
    }

    // Init état panier
    setDansPanier(estDansPanier(parseInt(id)))
    const handlePanierChange = () => setDansPanier(estDansPanier(parseInt(id)))
    window.addEventListener('bookdog_panier_change', handlePanierChange)
    return () => window.removeEventListener('bookdog_panier_change', handlePanierChange)
  }, [id])

  const handleAjouterPanier = () => {
    if (!livre) return
    ajouterAuPanier({
      livre_id: livre.id,
      titre: livre.titre,
      auteur: livre.auteur,
      isbn: livre.isbn,
      prix: livre.prix,
      stock: livre.stock,
    })
    setAjoutAnimation(true)
    setTimeout(() => setAjoutAnimation(false), 1500)
  }

  const handleReservation = async () => {
    if (!nom || !email) { setErreurResa('Veuillez remplir votre nom et email.'); return }
    const res = await fetch('http://localhost:3001/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ livre_id: livre?.id, nom, email }),
    })
    if (res.ok) { setConfirmation(true); setNom(''); setEmail('') }
    else setErreurResa('Une erreur est survenue.')
  }

  const handleWishlist = async () => {
    if (!clientConnecte) { window.location.href = '/compte/connexion'; return }
    setWishlistLoading(true)
    const token = localStorage.getItem('clientToken')
    if (inWishlist) {
      await fetch(`http://localhost:3001/compte/wishlist/${id}`, { method: 'DELETE', headers: { Authorization: 'Bearer ' + token } })
      setInWishlist(false)
    } else {
      await fetch('http://localhost:3001/compte/wishlist', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify({ livre_id: parseInt(id) }) })
      setInWishlist(true)
    }
    setWishlistLoading(false)
  }

  const handleAvis = async () => {
    if (maNote === 0) { setErreurAvis('Veuillez sélectionner une note.'); return }
    const token = localStorage.getItem('clientToken')
    const res = await fetch(`http://localhost:3001/avis/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({ note: maNote, commentaire: monCommentaire }),
    })
    const data = await res.json()
    if (res.ok) {
      setAvisEnvoye(true)
      const updated = await fetch(`http://localhost:3001/avis/${id}`).then(r => r.json())
      setAvis(updated.avis || []); setMoyenne(updated.moyenne)
    } else {
      setErreurAvis(data.message || "Erreur lors de l'envoi.")
    }
  }

  function etoiles(note: number, taille = 16) {
    return (
      <span style={{ fontSize: taille + 'px', letterSpacing: '2px' }}>
        {[1,2,3,4,5].map(i => <span key={i} style={{ color: i <= note ? C.or : '#ddd' }}>★</span>)}
      </span>
    )
  }

  if (chargement) return (
    <div style={{ backgroundColor: C.fond, minHeight: '100vh', fontFamily: 'Georgia, serif' }}>
      <Header pageCourante="livres" />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '120px 0' }}>
        <p style={{ color: C.texteSecondaire }}>Chargement...</p>
      </div>
    </div>
  )

  if (!livre) return (
    <div style={{ backgroundColor: C.fond, minHeight: '100vh', fontFamily: 'Georgia, serif' }}>
      <Header pageCourante="livres" />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '120px 0' }}>
        <p style={{ color: C.texteSecondaire }}>Livre introuvable.</p>
      </div>
    </div>
  )

  const couvertureUrl = `https://books.google.com/books/content?vid=ISBN${livre.isbn}&printsec=frontcover&img=1&zoom=3`

  return (
    <div style={{ backgroundColor: C.fond, minHeight: '100vh', fontFamily: 'Georgia, serif' }}>
      <Header pageCourante="livres" />

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '48px 24px', boxSizing: 'border-box' }}>

        <a href="/livres" style={{ color: C.texteSecondaire, textDecoration: 'none', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '32px' }}>
          ← Retour au catalogue
        </a>

        <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr 320px', gap: '48px', alignItems: 'start' }}>

          {/* ── COLONNE 1 : Couverture ── */}
          <div>
            <img
              src={couvertureUrl}
              alt={`Couverture ${livre.titre}`}
              style={{ width: '100%', borderRadius: '8px', boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}
              onError={e => {
                const el = e.currentTarget
                el.style.display = 'none'
                const ph = el.nextElementSibling as HTMLElement
                if (ph) ph.style.display = 'flex'
              }}
            />
            <div style={{ display: 'none', width: '100%', aspectRatio: '2/3', backgroundColor: C.fondAlt, borderRadius: '8px', alignItems: 'center', justifyContent: 'center', color: C.texteSecondaire, fontSize: '13px', textAlign: 'center', padding: '16px', boxSizing: 'border-box' }}>
              Couverture non disponible
            </div>
            {moyenne && (
              <div style={{ marginTop: '20px', textAlign: 'center', backgroundColor: 'white', borderRadius: '10px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <p style={{ fontSize: '28px', fontWeight: '700', color: C.vert, margin: '0 0 4px' }}>
                  {moyenne}<span style={{ fontSize: '16px', color: C.texteSecondaire }}>/5</span>
                </p>
                {etoiles(Math.round(parseFloat(moyenne)))}
                <p style={{ fontSize: '12px', color: C.texteSecondaire, margin: '6px 0 0' }}>{avis.length} avis</p>
              </div>
            )}
          </div>

          {/* ── COLONNE 2 : Détails + Avis ── */}
          <div>
            {livre.genre && (
              <span style={{ backgroundColor: C.fondAlt, color: C.vert, padding: '4px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', display: 'inline-block', marginBottom: '16px' }}>{livre.genre}</span>
            )}
            <h1 style={{ fontSize: '32px', fontWeight: '700', color: C.texte, margin: '0 0 8px', lineHeight: '1.2' }}>{livre.titre}</h1>
            <p style={{ fontSize: '18px', color: C.texteSecondaire, margin: '0 0 24px', fontStyle: 'italic' }}>{livre.auteur}</p>

            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginBottom: '32px', paddingBottom: '32px', borderBottom: '1px solid #eee' }}>
              {livre.editeur && <div><p style={{ fontSize: '11px', color: C.texteSecondaire, letterSpacing: '1px', margin: '0 0 4px' }}>ÉDITEUR</p><p style={{ fontSize: '14px', color: C.texte, margin: 0, fontWeight: '500' }}>{livre.editeur}</p></div>}
              {livre.collection && <div><p style={{ fontSize: '11px', color: C.texteSecondaire, letterSpacing: '1px', margin: '0 0 4px' }}>COLLECTION</p><p style={{ fontSize: '14px', color: C.texte, margin: 0, fontWeight: '500' }}>{livre.collection}</p></div>}
              {livre.date_publication && <div><p style={{ fontSize: '11px', color: C.texteSecondaire, letterSpacing: '1px', margin: '0 0 4px' }}>PUBLICATION</p><p style={{ fontSize: '14px', color: C.texte, margin: 0, fontWeight: '500' }}>{livre.date_publication}</p></div>}
              <div><p style={{ fontSize: '11px', color: C.texteSecondaire, letterSpacing: '1px', margin: '0 0 4px' }}>ISBN</p><p style={{ fontSize: '14px', color: C.texte, margin: 0, fontWeight: '500' }}>{livre.isbn}</p></div>
            </div>

            {livre.description && (
              <div style={{ marginBottom: '32px' }}>
                <p style={{ fontSize: '11px', color: C.texteSecondaire, letterSpacing: '1px', margin: '0 0 12px', fontWeight: '600' }}>DESCRIPTION</p>
                <p style={{ fontSize: '15px', color: C.texte, lineHeight: '1.8', margin: 0 }}>{livre.description}</p>
              </div>
            )}

            {livre.url_goodreads && (
              <a href={livre.url_goodreads} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: C.texteSecondaire, fontSize: '13px', textDecoration: 'none', border: '1px solid #ddd', borderRadius: '8px', padding: '8px 16px', marginBottom: '48px' }}>
                Voir sur Goodreads →
              </a>
            )}

            {/* Avis */}
            <div>
              <p style={{ fontSize: '11px', color: C.texteSecondaire, letterSpacing: '1px', margin: '0 0 20px', fontWeight: '600' }}>AVIS DES LECTEURS</p>
              {avis.length === 0 && <p style={{ color: C.texteSecondaire, fontSize: '14px' }}>Aucun avis pour ce livre.</p>}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
                {avis.map(a => (
                  <div key={a.id} style={{ backgroundColor: 'white', borderRadius: '10px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontWeight: '600', fontSize: '14px', color: C.texte }}>{a.prenom} {a.nom.charAt(0)}.</span>
                      <span style={{ fontSize: '12px', color: C.texteSecondaire }}>{new Date(a.date_avis).toLocaleDateString('fr-FR')}</span>
                    </div>
                    {etoiles(a.note, 14)}
                    {a.commentaire && <p style={{ fontSize: '14px', color: C.texte, margin: '10px 0 0', lineHeight: '1.6' }}>{a.commentaire}</p>}
                  </div>
                ))}
              </div>
              {clientConnecte && !avisEnvoye && (
                <div style={{ backgroundColor: C.fondAlt, borderRadius: '12px', padding: '24px' }}>
                  <p style={{ fontSize: '14px', fontWeight: '600', color: C.vert, margin: '0 0 16px' }}>Laisser un avis</p>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                    {[1,2,3,4,5].map(i => <button key={i} onClick={() => setMaNote(i)} style={{ fontSize: '24px', background: 'none', border: 'none', cursor: 'pointer', color: i <= maNote ? C.or : '#ccc', padding: '0' }}>★</button>)}
                  </div>
                  <textarea value={monCommentaire} onChange={e => setMonCommentaire(e.target.value)} placeholder="Votre commentaire (optionnel)..." rows={3} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', boxSizing: 'border-box', fontFamily: 'Georgia, serif', resize: 'vertical' }} />
                  {erreurAvis && <p style={{ color: '#c0392b', fontSize: '13px', margin: '8px 0 0' }}>{erreurAvis}</p>}
                  <button onClick={handleAvis} style={{ marginTop: '12px', padding: '10px 24px', backgroundColor: C.vert, color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>Publier mon avis</button>
                </div>
              )}
              {avisEnvoye && <div style={{ backgroundColor: C.fondAlt, borderRadius: '10px', padding: '16px', color: C.vert, fontSize: '14px', fontWeight: '600' }}>Merci pour votre avis !</div>}
              {!clientConnecte && <p style={{ fontSize: '13px', color: C.texteSecondaire }}><a href="/compte/connexion" style={{ color: C.vert, fontWeight: '600' }}>Connectez-vous</a> pour laisser un avis.</p>}
            </div>
          </div>

          {/* ── COLONNE 3 : Prix + CTA ── */}
          <div style={{ position: 'sticky', top: '24px' }}>
            <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>

              <p style={{ fontSize: '36px', fontWeight: '700', color: C.vert, margin: '0 0 8px' }}>{livre.prix} €</p>
              <span style={{ display: 'inline-block', fontSize: '13px', fontWeight: '600', padding: '5px 14px', borderRadius: '20px', marginBottom: '28px', backgroundColor: livre.stock > 0 ? C.fondAlt : '#fff8e6', color: livre.stock > 0 ? C.vert : C.orIntense }}>
                {livre.stock > 0 ? `${livre.stock} exemplaire${livre.stock > 1 ? 's' : ''} en stock` : 'Sur commande'}
              </span>

              {/* ── Bouton Ajouter au panier ── */}
              <button
                onClick={handleAjouterPanier}
                style={{
                  width: '100%', padding: '14px', marginBottom: '10px',
                  backgroundColor: ajoutAnimation ? C.vert : C.orIntense,
                  color: 'white', border: 'none', borderRadius: '10px',
                  fontSize: '15px', fontWeight: '700', cursor: 'pointer',
                  fontFamily: 'Georgia, serif',
                  transition: 'background 0.3s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                }}
              >
                {ajoutAnimation ? '✓ Ajouté au panier !' : dansPanier ? '🛒 Ajouter à nouveau' : '🛒 Ajouter au panier'}
              </button>

              {dansPanier && !ajoutAnimation && (
                <a href="/panier" style={{ display: 'block', textAlign: 'center', fontSize: '13px', color: C.vert, fontWeight: '600', marginBottom: '10px', textDecoration: 'none' }}>
                  → Voir le panier
                </a>
              )}

              {/* Wishlist */}
              <button
                onClick={handleWishlist}
                disabled={wishlistLoading}
                style={{ width: '100%', padding: '10px', marginBottom: '20px', backgroundColor: inWishlist ? '#fff8e6' : 'white', color: inWishlist ? C.orIntense : C.texteSecondaire, border: `1px solid ${inWishlist ? C.or : '#ddd'}`, borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: 'Georgia, serif' }}
              >
                {inWishlist ? '♥ Dans ma wishlist' : '♡ Ajouter à la wishlist'}
              </button>

              <div style={{ borderTop: '1px solid #eee', paddingTop: '20px', marginBottom: '20px' }}>
                <p style={{ fontSize: '13px', fontWeight: '600', color: C.texteSecondaire, letterSpacing: '1px', margin: '0 0 12px' }}>RÉSERVER CE LIVRE</p>
                {!confirmation ? (
                  <>
                    <input type="text" placeholder="Votre nom" value={nom} onChange={e => setNom(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', boxSizing: 'border-box', marginBottom: '10px', fontFamily: 'Georgia, serif' }} />
                    <input type="email" placeholder="Votre email" value={email} onChange={e => setEmail(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', boxSizing: 'border-box', marginBottom: '12px', fontFamily: 'Georgia, serif' }} />
                    {erreurResa && <p style={{ color: '#c0392b', fontSize: '13px', margin: '0 0 10px' }}>{erreurResa}</p>}
                    <button onClick={handleReservation} style={{ width: '100%', padding: '12px', backgroundColor: C.vert, color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Georgia, serif' }}>
                      Réserver — Paiement en boutique
                    </button>
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: '12px 0' }}>
                    <div style={{ fontSize: '28px', marginBottom: '8px' }}>✓</div>
                    <p style={{ fontWeight: '700', color: C.vert, margin: '0 0 4px' }}>Réservation confirmée !</p>
                    <p style={{ fontSize: '13px', color: C.texteSecondaire, margin: 0 }}>Confirmation par email.</p>
                  </div>
                )}
              </div>

              <div style={{ fontSize: '13px', color: C.texteSecondaire, lineHeight: '1.8' }}>
                <p style={{ margin: '0 0 4px' }}>📍 42 rue Laugier, 75017 Paris</p>
                <p style={{ margin: '0 0 4px' }}>🕐 Lun–Sam : 10h–20h</p>
                <p style={{ margin: 0 }}>📞 06 77 40 21 51</p>
              </div>
            </div>
          </div>

        </div>
      </main>

      <footer style={{ backgroundColor: C.footer, padding: '24px', textAlign: 'center', marginTop: '60px' }}>
        <p style={{ color: C.fondAlt, fontSize: '13px', margin: 0 }}>2026 Bookdog — Librairie indépendante Paris 17e</p>
      </footer>
    </div>
  )
}