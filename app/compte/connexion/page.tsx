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

export default function Connexion() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', mot_de_passe: '' })
  const [erreur, setErreur] = useState('')
  const [chargement, setChargement] = useState(false)
  const [modeReset, setModeReset] = useState(false)
  const [emailReset, setEmailReset] = useState('')
  const [messageReset, setMessageReset] = useState('')
  const [chargementReset, setChargementReset] = useState(false)

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
      if (!res.ok) setErreur(data.message || 'Erreur de connexion')
      else {
        localStorage.setItem('clientToken', data.token)
        localStorage.setItem('clientInfo', JSON.stringify(data.client))
        router.push('/compte/dashboard')
      }
    } catch { setErreur('Impossible de contacter le serveur') }
    finally { setChargement(false) }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setChargementReset(true)
    try {
      const res = await fetch('http://localhost:3001/compte/reset-demande', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailReset })
      })
      const data = await res.json()
      setMessageReset(data.message)
    } catch { setMessageReset('Impossible de contacter le serveur') }
    finally { setChargementReset(false) }
  }

  const inputStyle = { width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '15px', boxSizing: 'border-box' as const, fontFamily: 'Georgia, serif' }

  return (
    <div style={{ backgroundColor: C.fond, minHeight: '100vh', fontFamily: 'Georgia, serif' }}>
      <header style={{ backgroundColor: C.vert }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px', boxSizing: 'border-box', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <a href="/" style={{ textDecoration: 'none' }}>
            <h1 style={{ color: 'white', fontSize: '28px', fontWeight: '700', margin: 0, letterSpacing: '2px' }}>BOOKDOG</h1>
            <p style={{ color: C.fondAlt, fontSize: '12px', margin: '2px 0 0' }}>Librairie independante — Paris 17e</p>
          </a>
          <a href="/compte/inscription" style={{ color: C.fondAlt, textDecoration: 'none', fontSize: '14px' }}>Pas encore de compte ? S'inscrire</a>
        </div>
      </header>

      <main style={{ maxWidth: '480px', margin: '0 auto', padding: '80px 24px', boxSizing: 'border-box' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <p style={{ color: C.vert, fontSize: '12px', letterSpacing: '2px', marginBottom: '8px' }}>Espace client</p>
          <h2 style={{ fontSize: '32px', fontWeight: '700', color: C.texte, margin: 0 }}>{modeReset ? 'Mot de passe oublié' : 'Connexion'}</h2>
        </div>

        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '40px', boxShadow: '0 2px 20px rgba(0,0,0,0.07)' }}>
          {!modeReset ? (
            <>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: C.texteSecondaire, marginBottom: '8px' }}>Email</label>
                <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="votre@email.com" style={inputStyle} />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: C.texteSecondaire, marginBottom: '8px' }}>Mot de passe</label>
                <input type="password" name="mot_de_passe" value={form.mot_de_passe} onChange={handleChange} placeholder="••••••••" style={inputStyle} />
              </div>
              <div style={{ textAlign: 'right', marginBottom: '24px' }}>
                <button onClick={() => { setModeReset(true); setErreur('') }} style={{ background: 'none', border: 'none', color: C.vert, fontSize: '13px', cursor: 'pointer', fontFamily: 'Georgia, serif', textDecoration: 'underline' }}>
                  Mot de passe oublié ?
                </button>
              </div>
              {erreur && <div style={{ backgroundColor: '#fff0f0', border: '1px solid #ffcccc', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', color: '#c0392b', fontSize: '14px' }}>{erreur}</div>}
              <button onClick={handleSubmit} disabled={chargement} style={{ width: '100%', padding: '14px', backgroundColor: C.vert, color: 'white', border: 'none', borderRadius: '40px', fontSize: '15px', fontWeight: '700', cursor: chargement ? 'not-allowed' : 'pointer', fontFamily: 'Georgia, serif', opacity: chargement ? 0.7 : 1 }}>
                {chargement ? 'Connexion...' : 'Se connecter'}
              </button>
              <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: C.texteSecondaire }}>
                Pas encore de compte ?{' '}<a href="/compte/inscription" style={{ color: C.vert, fontWeight: '700', textDecoration: 'none' }}>S'inscrire</a>
              </p>
            </>
          ) : (
            <>
              {!messageReset ? (
                <>
                  <p style={{ fontSize: '14px', color: C.texteSecondaire, lineHeight: '1.6', marginBottom: '24px' }}>
                    Saisissez votre email. Si un compte existe, vous recevrez un lien de réinitialisation.
                  </p>
                  <div style={{ marginBottom: '28px' }}>
                    <label style={{ display: 'block', fontSize: '13px', color: C.texteSecondaire, marginBottom: '8px' }}>Email</label>
                    <input type="email" value={emailReset} onChange={e => setEmailReset(e.target.value)} placeholder="votre@email.com" style={inputStyle} />
                  </div>
                  <button onClick={handleReset} disabled={chargementReset} style={{ width: '100%', padding: '14px', backgroundColor: C.vert, color: 'white', border: 'none', borderRadius: '40px', fontSize: '15px', fontWeight: '700', cursor: chargementReset ? 'not-allowed' : 'pointer', fontFamily: 'Georgia, serif', opacity: chargementReset ? 0.7 : 1 }}>
                    {chargementReset ? 'Envoi...' : 'Envoyer le lien'}
                  </button>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div style={{ fontSize: '40px', marginBottom: '16px' }}>✉️</div>
                  <p style={{ fontSize: '15px', color: C.texte, lineHeight: '1.6' }}>{messageReset}</p>
                </div>
              )}
              <button onClick={() => { setModeReset(false); setMessageReset(''); setEmailReset('') }} style={{ width: '100%', marginTop: '20px', padding: '12px', backgroundColor: 'transparent', color: C.texteSecondaire, border: '1px solid #ddd', borderRadius: '40px', fontSize: '14px', cursor: 'pointer', fontFamily: 'Georgia, serif' }}>
                Retour à la connexion
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