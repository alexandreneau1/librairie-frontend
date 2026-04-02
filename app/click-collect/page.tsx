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

export default function ClickCollect() {
  const [livres, setLivres] = useState([])
  const [recherche, setRecherche] = useState('')
  const [livreSelectionne, setLivreSelectionne] = useState(null)
  const [nom, setNom] = useState('')
  const [email, setEmail] = useState('')
  const [telephone, setTelephone] = useState('')
  const [erreur, setErreur] = useState('')
  const [confirmation, setConfirmation] = useState(null)
  const [chargement, setChargement] = useState(false)

  useEffect(() => {
    const delai = setTimeout(() => {
      const recherchePropre = recherche.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, '')
      fetch('http://localhost:3001/livres' + (recherchePropre ? '?titre=' + encodeURIComponent(recherchePropre) : ''))
        .then(res => res.json())
        .then(data => setLivres(data))
    }, 300)
    return () => clearTimeout(delai)
  }, [recherche])

  const handleCommande = async function() {
    if (!nom || !email) { setErreur('Veuillez remplir votre nom et email.'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setErreur('Adresse email invalide.'); return }
    setChargement(true)
    setErreur('')
    try {
      const res = await fetch('http://localhost:3001/commandes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ livre_id: livreSelectionne.id, nom, email, telephone, type: livreSelectionne.stock > 0 ? 'stock' : 'commande' })
      })
      const data = await res.json()
      if (!res.ok) { setErreur(data.message || 'Une erreur est survenue.'); setChargement(false); return }
      setConfirmation({ livre: livreSelectionne, type: livreSelectionne.stock > 0 ? 'stock' : 'commande' })
      setLivreSelectionne(null); setNom(''); setEmail(''); setTelephone('')
    } catch { setErreur('Impossible de contacter le serveur.') }
    setChargement(false)
  }

  const inputStyle = { width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', boxSizing: 'border-box' as const, fontFamily: 'Georgia, serif' }

  return (
    <div style={{ backgroundColor: C.fond, minHeight: '100vh', fontFamily: 'Georgia, serif' }}>
      <header style={{ backgroundColor: C.vert }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px', boxSizing: 'border-box', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <a href="/" style={{ textDecoration: 'none' }}>
            <h1 style={{ color: 'white', fontSize: '28px', fontWeight: '700', margin: 0, letterSpacing: '2px' }}>BOOKDOG</h1>
            <p style={{ color: C.fondAlt, fontSize: '13px', margin: '4px 0 0' }}>Librairie independante — Paris 17e</p>
          </a>
          <a href="/" style={{ color: C.fondAlt, fontSize: '14px', textDecoration: 'none' }}>Retour au site</a>
        </div>
      </header>

      <div style={{ backgroundColor: C.vert, paddingBottom: '40px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 24px 0', boxSizing: 'border-box', textAlign: 'center' }}>
          <p style={{ color: C.or, fontSize: '12px', letterSpacing: '2px', marginBottom: '12px' }}>Commandez en ligne</p>
          <h2 style={{ color: 'white', fontSize: '36px', fontWeight: '700', margin: '0 0 16px' }}>Click and Collect</h2>
          <p style={{ color: C.fondAlt, fontSize: '15px', maxWidth: '520px', margin: '0 auto', lineHeight: '1.8' }}>
            Commandez votre livre en ligne et venez le retirer en boutique. Paiement sur place au retrait.
          </p>
        </div>
      </div>
      <div style={{ backgroundColor: C.vert, height: '40px', borderRadius: '0 0 50% 50% / 0 0 40px 40px' }} />

      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '48px 24px', boxSizing: 'border-box' }}>
        {confirmation && (
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '40px', marginBottom: '40px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', borderTop: '6px solid ' + C.or, textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>✓</div>
            <h3 style={{ fontSize: '22px', fontWeight: '700', color: C.texte, marginBottom: '12px' }}>Commande enregistrée !</h3>
            <p style={{ fontSize: '16px', color: C.texteSecondaire, marginBottom: '8px' }}><strong>{confirmation.livre.titre}</strong> — {confirmation.livre.auteur}</p>
            {confirmation.type === 'stock' ? (
              <div style={{ backgroundColor: C.fondAlt, borderRadius: '10px', padding: '16px', marginTop: '20px' }}>
                <p style={{ color: C.vert, fontWeight: '600', margin: 0 }}>Ce livre est en stock. Il sera mis de côté dans l'heure suivant la validation.</p>
              </div>
            ) : (
              <div style={{ backgroundColor: '#fff8e1', borderRadius: '10px', padding: '16px', marginTop: '20px' }}>
                <p style={{ color: C.orIntense, fontWeight: '600', margin: 0 }}>Ce livre sera commandé auprès de notre distributeur. Disponible sous 3 à 5 jours ouvrés.</p>
              </div>
            )}
            <button onClick={() => setConfirmation(null)} style={{ marginTop: '24px', backgroundColor: C.vert, color: 'white', border: 'none', borderRadius: '8px', padding: '12px 28px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
              Commander un autre livre
            </button>
          </div>
        )}

        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h3 style={{ fontSize: '24px', fontWeight: '700', color: C.texte, margin: '0 0 8px' }}>Choisissez votre livre</h3>
          <p style={{ color: C.texteSecondaire, fontSize: '14px' }}>Recherchez dans notre catalogue ou commandez un titre absent</p>
        </div>

        <input type="text" placeholder="Rechercher un livre..." value={recherche} onChange={e => setRecherche(e.target.value)} style={{ width: '100%', padding: '14px 20px', borderRadius: '40px', border: '1px solid #ddd', fontSize: '15px', marginBottom: '32px', boxSizing: 'border-box', backgroundColor: 'white', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }} />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px', marginBottom: '48px' }}>
          {livres.map((livre: any) => (
            <div key={livre.id} onClick={() => setLivreSelectionne(livre)}
              style={{ backgroundColor: livreSelectionne && livreSelectionne.id === livre.id ? C.vert : 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', borderTop: '4px solid ' + (livre.stock > 0 ? C.vert : C.or), cursor: 'pointer', transition: 'transform 0.15s ease' }}
              onMouseEnter={e => { if (!livreSelectionne || livreSelectionne.id !== livre.id) e.currentTarget.style.transform = 'translateY(-3px)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)' }}
            >
              <h2 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '6px', color: livreSelectionne && livreSelectionne.id === livre.id ? 'white' : C.texte }}>{livre.titre}</h2>
              <p style={{ fontSize: '13px', color: livreSelectionne && livreSelectionne.id === livre.id ? C.fondAlt : C.texteSecondaire, marginBottom: '16px', fontStyle: 'italic' }}>{livre.auteur}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '18px', fontWeight: '700', color: livreSelectionne && livreSelectionne.id === livre.id ? C.fondAlt : C.vert }}>{livre.prix} €</span>
                <span style={{ fontSize: '11px', fontWeight: '600', padding: '4px 10px', borderRadius: '20px', backgroundColor: livre.stock > 0 ? C.fondAlt : '#fff8e1', color: livre.stock > 0 ? C.vert : C.orIntense }}>
                  {livre.stock > 0 ? 'En stock' : 'Sur commande'}
                </span>
              </div>
            </div>
          ))}
        </div>

        {livreSelectionne && (
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '40px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', borderTop: '6px solid ' + C.or }}>
            <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px', color: C.texte }}>Commander : {livreSelectionne.titre}</h3>
            <p style={{ fontSize: '14px', color: C.texteSecondaire, marginBottom: '8px', fontStyle: 'italic' }}>{livreSelectionne.auteur}</p>
            {livreSelectionne.stock > 0 ? (
              <div style={{ backgroundColor: C.fondAlt, borderRadius: '8px', padding: '12px 16px', marginBottom: '24px' }}>
                <p style={{ color: C.vert, fontSize: '13px', fontWeight: '600', margin: 0 }}>Ce livre est en stock. Il sera mis de côté dans l'heure.</p>
              </div>
            ) : (
              <div style={{ backgroundColor: '#fff8e1', borderRadius: '8px', padding: '12px 16px', marginBottom: '24px' }}>
                <p style={{ color: C.orIntense, fontSize: '13px', fontWeight: '600', margin: 0 }}>Ce livre n'est pas en stock. Disponible sous 3 à 5 jours ouvrés après confirmation.</p>
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', color: C.texteSecondaire, display: 'block', marginBottom: '4px' }}>Nom complet *</label>
                <input type="text" value={nom} onChange={e => setNom(e.target.value)} placeholder="Votre nom" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: C.texteSecondaire, display: 'block', marginBottom: '4px' }}>Email *</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Votre email" style={inputStyle} />
              </div>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '12px', color: C.texteSecondaire, display: 'block', marginBottom: '4px' }}>Téléphone (optionnel)</label>
              <input type="tel" value={telephone} onChange={e => setTelephone(e.target.value)} placeholder="06 XX XX XX XX" style={inputStyle} />
            </div>
            {erreur && <p style={{ color: '#e53935', fontSize: '14px', marginBottom: '16px' }}>{erreur}</p>}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={handleCommande} disabled={chargement} style={{ backgroundColor: chargement ? '#aaa' : C.orIntense, color: 'white', border: 'none', borderRadius: '10px', padding: '14px 32px', fontSize: '15px', fontWeight: '700', cursor: chargement ? 'not-allowed' : 'pointer', flex: 1 }}>
                {chargement ? 'Envoi...' : 'Confirmer — Paiement en boutique'}
              </button>
              <button onClick={() => setLivreSelectionne(null)} style={{ backgroundColor: 'transparent', color: C.texteSecondaire, border: '1px solid #ddd', borderRadius: '10px', padding: '14px 24px', fontSize: '14px', cursor: 'pointer' }}>
                Annuler
              </button>
            </div>
          </div>
        )}
      </main>

      <footer style={{ backgroundColor: C.footer, padding: '24px', textAlign: 'center' }}>
        <p style={{ color: C.fondAlt, fontSize: '13px', margin: 0 }}>2026 Bookdog — Librairie independante Paris 17e</p>
      </footer>
    </div>
  )
}