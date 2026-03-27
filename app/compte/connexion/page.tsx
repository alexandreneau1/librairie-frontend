'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Connexion() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', mot_de_passe: '' })
  const [erreur, setErreur] = useState('')
  const [chargement, setChargement] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErreur('')
    setChargement(true)
    try {
      const res = await fetch('http://localhost:3001/compte/connexion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (!res.ok) {
        setErreur(data.message || 'Erreur de connexion')
      } else {
        localStorage.setItem('clientToken', data.token)
        localStorage.setItem('clientInfo', JSON.stringify(data.client))
        router.push('/compte/dashboard')
      }
    } catch {
      setErreur('Impossible de contacter le serveur')
    } finally {
      setChargement(false)
    }
  }

  return (
    <div style={{ backgroundColor: '#f9f6f1', minHeight: '100vh', fontFamily: 'Georgia, serif' }}>

      <header style={{ backgroundColor: '#1a3d2b' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px', boxSizing: 'border-box', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <a href="/" style={{ textDecoration: 'none' }}>
            <h1 style={{ color: 'white', fontSize: '28px', fontWeight: '700', margin: 0, letterSpacing: '2px' }}>BOOKDOG</h1>
            <p style={{ color: '#a8d5b5', fontSize: '12px', margin: '2px 0 0', letterSpacing: '1px' }}>Librairie independante — Paris 17e</p>
          </a>
          <a href="/compte/inscription" style={{ color: '#a8d5b5', textDecoration: 'none', fontSize: '14px' }}>
            Pas encore de compte ? S'inscrire
          </a>
        </div>
      </header>

      <main style={{ maxWidth: '480px', margin: '0 auto', padding: '80px 24px', boxSizing: 'border-box' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <p style={{ color: '#1a3d2b', fontSize: '12px', letterSpacing: '2px', marginBottom: '8px' }}>Espace client</p>
          <h2 style={{ fontSize: '32px', fontWeight: '700', color: '#1a1a1a', margin: 0 }}>Connexion</h2>
        </div>

        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '40px', boxShadow: '0 2px 20px rgba(0,0,0,0.07)' }}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', color: '#555', marginBottom: '8px', letterSpacing: '0.5px' }}>Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="votre@email.com"
              style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '15px', boxSizing: 'border-box', fontFamily: 'Georgia, serif' }}
            />
          </div>

          <div style={{ marginBottom: '28px' }}>
            <label style={{ display: 'block', fontSize: '13px', color: '#555', marginBottom: '8px', letterSpacing: '0.5px' }}>Mot de passe</label>
            <input
              type="password"
              name="mot_de_passe"
              value={form.mot_de_passe}
              onChange={handleChange}
              placeholder="••••••••"
              style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '15px', boxSizing: 'border-box', fontFamily: 'Georgia, serif' }}
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
            style={{ width: '100%', padding: '14px', backgroundColor: '#1a3d2b', color: 'white', border: 'none', borderRadius: '40px', fontSize: '15px', fontWeight: '700', cursor: chargement ? 'not-allowed' : 'pointer', fontFamily: 'Georgia, serif', opacity: chargement ? 0.7 : 1 }}
          >
            {chargement ? 'Connexion...' : 'Se connecter'}
          </button>

          <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: '#888' }}>
            Pas encore de compte ?{' '}
            <a href="/compte/inscription" style={{ color: '#1a3d2b', fontWeight: '700', textDecoration: 'none' }}>S'inscrire</a>
          </p>
        </div>
      </main>

      <footer style={{ backgroundColor: '#0f2419', padding: '24px', textAlign: 'center' }}>
        <p style={{ color: '#a8d5b5', fontSize: '13px', margin: 0 }}>2026 Bookdog — Librairie independante Paris 17e</p>
      </footer>

    </div>
  )
}