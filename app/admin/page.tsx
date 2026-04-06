'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

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

export default function AdminLogin() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [erreur, setErreur] = useState('')
  const [chargement, setChargement] = useState(false)

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    fontSize: '15px',
    boxSizing: 'border-box' as const,
    fontFamily: 'Georgia, serif',
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErreur('')
    setChargement(true)
    try {
      const res = await fetch('http://localhost:3001/auth/connexion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, mot_de_passe: motDePasse }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErreur(data.message || 'Identifiants incorrects')
      } else {
        localStorage.setItem('token', data.token)
        router.push('/admin/dashboard')
      }
    } catch {
      setErreur('Impossible de contacter le serveur')
    } finally {
      setChargement(false)
    }
  }

  return (
    <div style={{ backgroundColor: C.fond, minHeight: '100vh', fontFamily: 'Georgia, serif' }}>
      <header style={{ backgroundColor: C.vert }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px', boxSizing: 'border-box' }}>
          <a href="/" style={{ textDecoration: 'none' }}>
            <h1 style={{ color: 'white', fontSize: '28px', fontWeight: '700', margin: 0, letterSpacing: '2px' }}>BOOKDOG</h1>
            <p style={{ color: C.fondAlt, fontSize: '12px', margin: '2px 0 0' }}>Librairie indépendante — Paris 17e</p>
          </a>
        </div>
      </header>

      <main style={{ maxWidth: '440px', margin: '0 auto', padding: '80px 24px', boxSizing: 'border-box' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <p style={{ color: C.vert, fontSize: '12px', letterSpacing: '2px', marginBottom: '8px', fontWeight: '600' }}>ESPACE ADMINISTRATION</p>
          <h2 style={{ fontSize: '32px', fontWeight: '700', color: C.texte, margin: 0 }}>Connexion</h2>
        </div>

        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '40px', boxShadow: '0 2px 20px rgba(0,0,0,0.07)' }}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', color: C.texteSecondaire, marginBottom: '8px', fontWeight: '600' }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@bookdog.fr"
              style={inputStyle}
              onKeyDown={e => e.key === 'Enter' && handleSubmit(e)}
            />
          </div>
          <div style={{ marginBottom: '28px' }}>
            <label style={{ display: 'block', fontSize: '13px', color: C.texteSecondaire, marginBottom: '8px', fontWeight: '600' }}>Mot de passe</label>
            <input
              type="password"
              value={motDePasse}
              onChange={e => setMotDePasse(e.target.value)}
              placeholder="••••••••"
              style={inputStyle}
              onKeyDown={e => e.key === 'Enter' && handleSubmit(e)}
            />
          </div>
          {erreur && (
            <div style={{ backgroundColor: '#fff0f0', border: '1px solid #ffcccc', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', color: '#c0392b', fontSize: '14px' }}>
              {erreur}
            </div>
          )}
          <button
            onClick={handleSubmit}
            disabled={chargement}
            style={{ width: '100%', padding: '14px', backgroundColor: C.vert, color: 'white', border: 'none', borderRadius: '40px', fontSize: '15px', fontWeight: '700', cursor: chargement ? 'not-allowed' : 'pointer', fontFamily: 'Georgia, serif', opacity: chargement ? 0.7 : 1 }}
          >
            {chargement ? 'Connexion...' : 'Se connecter'}
          </button>
          <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: C.texteSecondaire }}>
            <a href="/" style={{ color: C.vert, textDecoration: 'none' }}>← Retour au site</a>
          </p>
        </div>
      </main>

      <footer style={{ backgroundColor: C.footer, padding: '24px', textAlign: 'center' }}>
        <p style={{ color: C.fondAlt, fontSize: '13px', margin: 0 }}>2026 Bookdog — Administration</p>
      </footer>
    </div>
  )
}