'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

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

export default function ResetMotDePasse() {
  const router = useRouter()
  const params = useParams()
  const token = params.token as string
  const [motDePasse, setMotDePasse] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [erreur, setErreur] = useState('')
  const [succes, setSucces] = useState(false)
  const [chargement, setChargement] = useState(false)

  const inputStyle = { width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '15px', boxSizing: 'border-box' as const, fontFamily: 'Georgia, serif' }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErreur('')
    if (motDePasse.length < 8) { setErreur('Le mot de passe doit contenir au minimum 8 caractères'); return }
    if (motDePasse !== confirmation) { setErreur('Les mots de passe ne correspondent pas'); return }
    setChargement(true)
    try {
      const res = await fetch('http://localhost:3001/compte/reset-confirmer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, mot_de_passe: motDePasse })
      })
      const data = await res.json()
      if (!res.ok) setErreur(data.message || 'Erreur lors de la réinitialisation')
      else { setSucces(true); setTimeout(() => router.push('/compte/connexion'), 3000) }
    } catch { setErreur('Impossible de contacter le serveur') }
    finally { setChargement(false) }
  }

  return (
    <div style={{ backgroundColor: C.fond, minHeight: '100vh', fontFamily: 'Georgia, serif' }}>
      <header style={{ backgroundColor: C.vert }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px', boxSizing: 'border-box' }}>
          <a href="/" style={{ textDecoration: 'none' }}>
            <h1 style={{ color: 'white', fontSize: '28px', fontWeight: '700', margin: 0, letterSpacing: '2px' }}>BOOKDOG</h1>
            <p style={{ color: C.fondAlt, fontSize: '12px', margin: '2px 0 0' }}>Librairie independante — Paris 17e</p>
          </a>
        </div>
      </header>

      <main style={{ maxWidth: '480px', margin: '0 auto', padding: '80px 24px', boxSizing: 'border-box' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <p style={{ color: C.vert, fontSize: '12px', letterSpacing: '2px', marginBottom: '8px' }}>Espace client</p>
          <h2 style={{ fontSize: '32px', fontWeight: '700', color: C.texte, margin: 0 }}>Nouveau mot de passe</h2>
        </div>
        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '40px', boxShadow: '0 2px 20px rgba(0,0,0,0.07)' }}>
          {succes ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: '40px', marginBottom: '16px' }}>✅</div>
              <p style={{ fontSize: '15px', color: C.texte, lineHeight: '1.6' }}>Mot de passe mis à jour !</p>
              <p style={{ fontSize: '13px', color: C.texteSecondaire }}>Redirection vers la connexion...</p>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: C.texteSecondaire, marginBottom: '8px' }}>Nouveau mot de passe</label>
                <input type="password" value={motDePasse} onChange={e => setMotDePasse(e.target.value)} placeholder="••••••••" style={inputStyle} />
              </div>
              <div style={{ marginBottom: '28px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: C.texteSecondaire, marginBottom: '8px' }}>Confirmer le mot de passe</label>
                <input type="password" value={confirmation} onChange={e => setConfirmation(e.target.value)} placeholder="••••••••" style={inputStyle} />
              </div>
              {erreur && <div style={{ backgroundColor: '#fff0f0', border: '1px solid #ffcccc', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', color: '#c0392b', fontSize: '14px' }}>{erreur}</div>}
              <button onClick={handleSubmit} disabled={chargement} style={{ width: '100%', padding: '14px', backgroundColor: C.vert, color: 'white', border: 'none', borderRadius: '40px', fontSize: '15px', fontWeight: '700', cursor: chargement ? 'not-allowed' : 'pointer', fontFamily: 'Georgia, serif', opacity: chargement ? 0.7 : 1 }}>
                {chargement ? 'Mise à jour...' : 'Enregistrer le mot de passe'}
              </button>
            </>
          )}
        </div>
      </main>

      <footer style={{ backgroundColor: C.footer, padding: '24px', textAlign: 'center' }}>
        <p style={{ color: C.fondAlt, fontSize: '13px', margin: 0 }}>2026 Bookdog — Librairie independante Paris 17e</p>
      </footer>
    </div>
  )
}