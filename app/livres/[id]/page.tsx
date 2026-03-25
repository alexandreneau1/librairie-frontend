'use client'

import { useState, useEffect } from 'react'

export default function LivrePage({ params }) {
  const [livre, setLivre] = useState(null)
  const [livreId, setLivreId] = useState(null)
  const [afficherFormulaire, setAfficherFormulaire] = useState(false)
  const [nom, setNom] = useState('')
  const [email, setEmail] = useState('')
  const [confirmation, setConfirmation] = useState(false)
  const [erreur, setErreur] = useState('')
  const [chargement, setChargement] = useState(false)

  useEffect(() => {
    params.then(p => {
      setLivreId(p.id)
      fetch(`http://localhost:3001/livres/${p.id}`, { cache: 'no-store' })
        .then(res => res.json())
        .then(data => setLivre(data))
    })
  }, [])

  const handleReservation = async function() {
    if (!nom || !email) {
      setErreur('Veuillez remplir tous les champs.')
      return
    }
    const emailValide = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    if (!emailValide) {
      setErreur('Veuillez saisir une adresse email valide (exemple : nom@domaine.fr).')
      return
    }
    setChargement(true)
    setErreur('')
    try {
      const res = await fetch('http://localhost:3001/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ livre_id: livreId, nom, email })
      })
      const data = await res.json()
      if (!res.ok) {
        setErreur(data.message || 'Une erreur est survenue.')
        setChargement(false)
        return
      }
      setConfirmation(true)
      setAfficherFormulaire(false)
    } catch (err) {
      setErreur('Impossible de contacter le serveur.')
    }
    setChargement(false)
  }

  if (!livre) {
    return (
      <div style={{ backgroundColor: '#f9f6f1', minHeight: '100vh' }}>
        <header style={{ backgroundColor: '#1a3d2b', padding: '32px 48px', textAlign: 'center' }}>
          <h1 style={{ color: 'white', fontSize: '32px', fontWeight: '700', margin: 0 }}>Ma Librairie</h1>
        </header>
        <main style={{ maxWidth: '800px', margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
          <p style={{ color: '#999' }}>Chargement...</p>
        </main>
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: '#f9f6f1', minHeight: '100vh' }}>
      <header style={{ backgroundColor: '#1a3d2b', padding: '32px 48px', textAlign: 'center' }}>
        <a href="/" style={{ color: '#a8d5b5', fontSize: '14px', textDecoration: 'none' }}>
          ← Retour au catalogue
        </a>
        <h1 style={{ color: 'white', fontSize: '32px', fontWeight: '700', margin: '8px 0 0' }}>Ma Librairie</h1>
      </header>

      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '48px 24px', boxSizing: 'border-box' }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '40px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          borderTop: '6px solid #1a3d2b'
        }}>
          <h2 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px', color: '#1a1a1a' }}>
            {livre.titre}
          </h2>
          <p style={{ fontSize: '18px', color: '#666', marginBottom: '32px' }}>{livre.auteur}</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '32px' }}>
            <div style={{ backgroundColor: '#f9f6f1', borderRadius: '10px', padding: '16px' }}>
              <p style={{ fontSize: '12px', color: '#999', margin: '0 0 4px' }}>Prix</p>
              <p style={{ fontSize: '24px', fontWeight: '700', color: '#1a3d2b', margin: 0 }}>{livre.prix} €</p>
            </div>
            <div style={{ backgroundColor: '#f9f6f1', borderRadius: '10px', padding: '16px' }}>
              <p style={{ fontSize: '12px', color: '#999', margin: '0 0 4px' }}>Stock disponible</p>
              <p style={{ fontSize: '24px', fontWeight: '700', color: '#1a1a1a', margin: 0 }}>{livre.stock} exemplaires</p>
            </div>
          </div>

          <div style={{ backgroundColor: '#f9f6f1', borderRadius: '10px', padding: '16px', marginBottom: '32px' }}>
            <p style={{ fontSize: '12px', color: '#999', margin: '0 0 4px' }}>ISBN</p>
            <p style={{ fontSize: '16px', color: '#444', margin: 0 }}>{livre.isbn}</p>
          </div>

          {confirmation && (
            <div style={{ backgroundColor: '#e8f5e9', borderRadius: '10px', padding: '20px', textAlign: 'center' }}>
              <p style={{ color: '#1a3d2b', fontWeight: '600', margin: 0 }}>
                Réservation confirmée ! Nous vous contacterons à {email}.
              </p>
            </div>
          )}

          {!confirmation && !afficherFormulaire && (
            <button
              onClick={() => setAfficherFormulaire(true)}
              style={{
                backgroundColor: livre.stock === 0 ? '#ccc' : '#1a3d2b',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                padding: '14px 32px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: livre.stock === 0 ? 'not-allowed' : 'pointer',
                width: '100%'
              }}
              disabled={livre.stock === 0}>
              {livre.stock === 0 ? 'Stock épuisé' : 'Réserver ce livre'}
            </button>
          )}

          {afficherFormulaire && (
            <div style={{ marginTop: '8px' }}>
              <input
                type="text"
                placeholder="Votre nom"
                value={nom}
                onChange={e => setNom(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                  fontSize: '15px',
                  marginBottom: '12px',
                  boxSizing: 'border-box'
                }}
              />
              <input
                type="email"
                placeholder="Votre email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                  fontSize: '15px',
                  marginBottom: '12px',
                  boxSizing: 'border-box'
                }}
              />
              {erreur && (
                <p style={{ color: '#e53935', fontSize: '14px', marginBottom: '12px' }}>{erreur}</p>
              )}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={handleReservation}
                  disabled={chargement}
                  style={{
                    backgroundColor: chargement ? '#aaa' : '#1a3d2b',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '12px 24px',
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: chargement ? 'not-allowed' : 'pointer',
                    flex: 1
                  }}>
                  {chargement ? 'Envoi en cours...' : 'Confirmer la réservation'}
                </button>
                <button
                  onClick={() => setAfficherFormulaire(false)}
                  style={{
                    backgroundColor: 'transparent',
                    color: '#999',
                    border: '1px solid #ddd',
                    borderRadius: '10px',
                    padding: '12px 24px',
                    fontSize: '15px',
                    cursor: 'pointer'
                  }}>
                  Annuler
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}