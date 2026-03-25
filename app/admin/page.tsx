'use client'

import { useState } from 'react'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [erreur, setErreur] = useState('')
  const [chargement, setChargement] = useState(false)

  const handleConnexion = async function() {
    if (!email || !motDePasse) {
      setErreur('Veuillez remplir tous les champs.')
      return
    }
    setChargement(true)
    setErreur('')
    try {
      const res = await fetch('http://localhost:3001/auth/connexion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, mot_de_passe: motDePasse })
      })
      const data = await res.json()
      if (!res.ok) {
        setErreur(data.message || 'Identifiants incorrects.')
        setChargement(false)
        return
      }
      localStorage.setItem('token', data.token)
      window.location.href = '/admin/dashboard'
    } catch (err) {
      setErreur('Impossible de contacter le serveur.')
    }
    setChargement(false)
  }

  return (
    <div style={{ backgroundColor: '#f9f6f1', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '48px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        width: '100%',
        maxWidth: '420px',
        borderTop: '6px solid #1a3d2b'
      }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px', color: '#1a1a1a' }}>
          Administration
        </h1>
        <p style={{ fontSize: '14px', color: '#999', marginBottom: '32px' }}>
          Accès réservé au libraire
        </p>

        <input
          type="email"
          placeholder="Email"
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
        <input
          type="password"
          placeholder="Mot de passe"
          value={motDePasse}
          onChange={e => setMotDePasse(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: '8px',
            border: '1px solid #ddd',
            fontSize: '15px',
            marginBottom: '20px',
            boxSizing: 'border-box'
          }}
        />

        {erreur && (
          <p style={{ color: '#e53935', fontSize: '14px', marginBottom: '16px' }}>{erreur}</p>
        )}

        <button
          onClick={handleConnexion}
          disabled={chargement}
          style={{
            backgroundColor: chargement ? '#aaa' : '#1a3d2b',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            padding: '14px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: chargement ? 'not-allowed' : 'pointer',
            width: '100%'
          }}>
          {chargement ? 'Connexion...' : 'Se connecter'}
        </button>
      </div>
    </div>
  )
}