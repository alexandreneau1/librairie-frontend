'use client'

import { useState, useEffect } from 'react'

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
      const recherchePropre = recherche
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9 ]/g, '')
        .replace(/\s+/g, '')
      fetch('http://localhost:3001/livres' + (recherchePropre ? '?titre=' + encodeURIComponent(recherchePropre) : ''))
        .then(res => res.json())
        .then(data => setLivres(data))
    }, 300)
    return () => clearTimeout(delai)
  }, [recherche])

  const handleCommande = async function() {
    if (!nom || !email) {
      setErreur('Veuillez remplir votre nom et email.')
      return
    }
    const emailValide = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    if (!emailValide) {
      setErreur('Veuillez saisir une adresse email valide.')
      return
    }
    setChargement(true)
    setErreur('')
    try {
      const res = await fetch('http://localhost:3001/commandes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          livre_id: livreSelectionne.id,
          nom,
          email,
          telephone,
          type: livreSelectionne.stock > 0 ? 'stock' : 'commande'
        })
      })
      const data = await res.json()
      if (!res.ok) {
        setErreur(data.message || 'Une erreur est survenue.')
        setChargement(false)
        return
      }
      setConfirmation({
        livre: livreSelectionne,
        type: livreSelectionne.stock > 0 ? 'stock' : 'commande'
      })
      setLivreSelectionne(null)
      setNom('')
      setEmail('')
      setTelephone('')
    } catch (err) {
      setErreur('Impossible de contacter le serveur.')
    }
    setChargement(false)
  }

  return (
    <div style={{ backgroundColor: '#f9f6f1', minHeight: '100vh', fontFamily: 'Georgia, serif' }}>

      <header style={{ backgroundColor: '#1a3d2b' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px', boxSizing: 'border-box', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <a href="/" style={{ textDecoration: 'none' }}>
              <h1 style={{ color: 'white', fontSize: '28px', fontWeight: '700', margin: 0, letterSpacing: '2px' }}>BOOKDOG</h1>
            </a>
            <p style={{ color: '#a8d5b5', fontSize: '13px', margin: '4px 0 0' }}>Librairie independante — Paris 17e</p>
          </div>
          <a href="/" style={{ color: '#a8d5b5', fontSize: '14px', textDecoration: 'none' }}>
            Retour au site
          </a>
        </div>
      </header>

      <div style={{ backgroundColor: '#1a3d2b', paddingBottom: '40px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 24px 0', boxSizing: 'border-box', textAlign: 'center' }}>
          <p style={{ color: '#a8d5b5', fontSize: '12px', letterSpacing: '2px', marginBottom: '12px' }}>Commandez en ligne</p>
          <h2 style={{ color: 'white', fontSize: '36px', fontWeight: '700', margin: '0 0 16px' }}>Click and Collect</h2>
          <p style={{ color: '#a8d5b5', fontSize: '15px', maxWidth: '520px', margin: '0 auto', lineHeight: '1.8' }}>
            Commandez votre livre en ligne et venez le retirer en boutique. Paiement sur place au retrait.
          </p>
        </div>
      </div>

      <div style={{ backgroundColor: '#1a3d2b', height: '40px', borderRadius: '0 0 50% 50% / 0 0 40px 40px' }} />

      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '48px 24px', boxSizing: 'border-box' }}>

        {confirmation && (
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '40px', marginBottom: '40px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', borderTop: '6px solid #c9a84c', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>✓</div>
            <h3 style={{ fontSize: '22px', fontWeight: '700', color: '#1a1a1a', marginBottom: '12px' }}>Commande enregistree !</h3>
            <p style={{ fontSize: '16px', color: '#444', marginBottom: '8px' }}>
              <strong>{confirmation.livre.titre}</strong> — {confirmation.livre.auteur}
            </p>
            {confirmation.type === 'stock' ? (
              <div style={{ backgroundColor: '#e8f5e9', borderRadius: '10px', padding: '16px', marginTop: '20px' }}>
                <p style={{ color: '#1a3d2b', fontWeight: '600', margin: 0 }}>
                  Ce livre est en stock. Il sera mis de cote dans l heure suivant la validation de votre commande.
                </p>
              </div>
            ) : (
              <div style={{ backgroundColor: '#fff8e1', borderRadius: '10px', padding: '16px', marginTop: '20px' }}>
                <p style={{ color: '#e65100', fontWeight: '600', margin: 0 }}>
                  Ce livre sera commande aupres de notre distributeur. Disponible en boutique sous 3 a 5 jours ouvres apres confirmation.
                </p>
              </div>
            )}
            <button
              onClick={() => setConfirmation(null)}
              style={{ marginTop: '24px', backgroundColor: '#1a3d2b', color: 'white', border: 'none', borderRadius: '8px', padding: '12px 28px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
              Commander un autre livre
            </button>
          </div>
        )}

        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h3 style={{ fontSize: '24px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 8px' }}>Choisissez votre livre</h3>
          <p style={{ color: '#888', fontSize: '14px' }}>Recherchez dans notre catalogue ou commandez un titre absent</p>
        </div>

        <input
          type="text"
          placeholder="Rechercher un livre..."
          value={recherche}
          onChange={e => setRecherche(e.target.value)}
          style={{ width: '100%', padding: '14px 20px', borderRadius: '40px', border: '1px solid #ddd', fontSize: '15px', marginBottom: '32px', boxSizing: 'border-box', backgroundColor: 'white', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
        />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px', marginBottom: '48px' }}>
          {livres.map((livre) => (
            <div
              key={livre.id}
              onClick={() => setLivreSelectionne(livre)}
              style={{
                backgroundColor: livreSelectionne && livreSelectionne.id === livre.id ? '#1a3d2b' : 'white',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
                borderTop: '4px solid ' + (livre.stock > 0 ? '#1a3d2b' : '#c9a84c'),
                cursor: 'pointer',
                transition: 'transform 0.15s ease'
              }}
              onMouseEnter={e => { if (!livreSelectionne || livreSelectionne.id !== livre.id) e.currentTarget.style.transform = 'translateY(-3px)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)' }}
            >
              <h2 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '6px', color: livreSelectionne && livreSelectionne.id === livre.id ? 'white' : '#1a1a1a' }}>{livre.titre}</h2>
              <p style={{ fontSize: '13px', color: livreSelectionne && livreSelectionne.id === livre.id ? '#a8d5b5' : '#888', marginBottom: '16px', fontStyle: 'italic' }}>{livre.auteur}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '18px', fontWeight: '700', color: livreSelectionne && livreSelectionne.id === livre.id ? '#a8d5b5' : '#1a3d2b' }}>{livre.prix} €</span>
                <span style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  padding: '4px 10px',
                  borderRadius: '20px',
                  backgroundColor: livre.stock > 0 ? '#e8f5e9' : '#fff8e1',
                  color: livre.stock > 0 ? '#1a3d2b' : '#e65100'
                }}>
                  {livre.stock > 0 ? 'En stock' : 'Sur commande'}
                </span>
              </div>
            </div>
          ))}
        </div>

        {livreSelectionne && (
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '40px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', borderTop: '6px solid #c9a84c' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px', color: '#1a1a1a' }}>
              Commander : {livreSelectionne.titre}
            </h3>
            <p style={{ fontSize: '14px', color: '#888', marginBottom: '8px', fontStyle: 'italic' }}>{livreSelectionne.auteur}</p>

            {livreSelectionne.stock > 0 ? (
              <div style={{ backgroundColor: '#e8f5e9', borderRadius: '8px', padding: '12px 16px', marginBottom: '24px' }}>
                <p style={{ color: '#1a3d2b', fontSize: '13px', fontWeight: '600', margin: 0 }}>
                  Ce livre est en stock. Il sera mis de cote dans l heure suivant votre commande.
                </p>
              </div>
            ) : (
              <div style={{ backgroundColor: '#fff8e1', borderRadius: '8px', padding: '12px 16px', marginBottom: '24px' }}>
                <p style={{ color: '#e65100', fontSize: '13px', fontWeight: '600', margin: 0 }}>
                  Ce livre n est pas en stock. Il sera commande aupres de notre distributeur — disponible sous 3 a 5 jours ouvres apres confirmation.
                </p>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#999', display: 'block', marginBottom: '4px' }}>Nom complet *</label>
                <input type="text" value={nom} onChange={e => setNom(e.target.value)} placeholder="Votre nom" style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#999', display: 'block', marginBottom: '4px' }}>Email *</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Votre email" style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', boxSizing: 'border-box' }} />
              </div>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '12px', color: '#999', display: 'block', marginBottom: '4px' }}>Telephone (optionnel)</label>
              <input type="tel" value={telephone} onChange={e => setTelephone(e.target.value)} placeholder="06 XX XX XX XX" style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', boxSizing: 'border-box' }} />
            </div>

            {erreur && <p style={{ color: '#e53935', fontSize: '14px', marginBottom: '16px' }}>{erreur}</p>}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleCommande}
                disabled={chargement}
                style={{ backgroundColor: chargement ? '#aaa' : '#c9a84c', color: 'white', border: 'none', borderRadius: '10px', padding: '14px 32px', fontSize: '15px', fontWeight: '700', cursor: chargement ? 'not-allowed' : 'pointer', flex: 1 }}>
                {chargement ? 'Envoi...' : 'Confirmer la commande — Paiement en boutique'}
              </button>
              <button
                onClick={() => setLivreSelectionne(null)}
                style={{ backgroundColor: 'transparent', color: '#999', border: '1px solid #ddd', borderRadius: '10px', padding: '14px 24px', fontSize: '14px', cursor: 'pointer' }}>
                Annuler
              </button>
            </div>
          </div>
        )}
      </main>

      <footer style={{ backgroundColor: '#0f2419', padding: '24px', textAlign: 'center' }}>
        <p style={{ color: '#a8d5b5', fontSize: '13px', margin: 0 }}>2026 Bookdog — Librairie independante Paris 17e</p>
      </footer>

    </div>
  )
}