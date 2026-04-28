'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

const C = {
  vert: '#1A3C2E', or: '#D4AF37', orIntense: '#B8960C',
  fond: '#F9F6F0', fondAlt: '#EAF2EC', texte: '#1C1C1C',
  texteSecondaire: '#6B6B5E', footer: '#0f2419',
}
const FONT = "'EB Garamond', Georgia, serif"

export default function Connexion() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const ceCode = searchParams.get('ce') || ''

  const [form, setForm] = useState({ email: '', mot_de_passe: '' })
  const [erreur, setErreur] = useState('')
  const [chargement, setChargement] = useState(false)
  const [modeReset, setModeReset] = useState(false)
  const [emailReset, setEmailReset] = useState('')
  const [messageReset, setMessageReset] = useState('')
  const [chargementReset, setChargementReset] = useState(false)
  const [flash, setFlash] = useState('')

  // Récupération d'un éventuel message flash (ex : session expirée) posé par useFetchAuth
  useEffect(() => {
    const msg = sessionStorage.getItem('flashMessage')
    if (msg) {
      setFlash(msg)
      sessionStorage.removeItem('flashMessage')
    }
  }, [])

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
        // On stocke tout le client y compris le CE s'il existe
        localStorage.setItem('clientInfo', JSON.stringify(data.client))
        router.push('/compte/dashboard')
      }
    } catch {
      setErreur('Impossible de contacter le serveur')
    } finally {
      setChargement(false)
    }
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
    } catch {
      setMessageReset('Impossible de contacter le serveur')
    } finally {
      setChargementReset(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 16px', borderRadius: '8px',
    border: '1px solid #ddd', fontSize: '15px',
    boxSizing: 'border-box', fontFamily: FONT,
  }

  return (
    <div style={{ backgroundColor: C.fond, minHeight: '100vh', fontFamily: FONT }}>

      <header style={{ backgroundColor: C.vert }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px 24px', boxSizing: 'border-box', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <a href="/" style={{ textDecoration: 'none' }}>
            <h1 style={{ color: 'white', fontSize: '26px', fontWeight: '700', margin: 0, letterSpacing: '2px', fontFamily: FONT }}>BOOKDOG</h1>
            <p style={{ color: C.fondAlt, fontSize: '12px', margin: '2px 0 0', fontFamily: FONT }}>Librairie indépendante — Paris 17e</p>
          </a>
          {ceCode && (
            <span style={{ backgroundColor: 'rgba(255,255,255,0.12)', color: C.or, fontSize: '12px', fontWeight: '700', padding: '5px 14px', borderRadius: '20px', letterSpacing: '1px', fontFamily: FONT }}>
              ESPACE CE
            </span>
          )}
          <a href={`/compte/inscription${ceCode ? `?ce=${ceCode}` : ''}`} style={{ color: C.fondAlt, textDecoration: 'none', fontSize: '14px', fontFamily: FONT }}>
            Pas encore de compte ? S'inscrire
          </a>
        </div>
      </header>

      <main style={{ maxWidth: '480px', margin: '0 auto', padding: '64px 24px 80px', boxSizing: 'border-box' }}>

        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <p style={{ color: C.vert, fontSize: '12px', letterSpacing: '2px', marginBottom: '8px', fontFamily: FONT }}>Espace client</p>
          <h2 style={{ fontSize: '32px', fontWeight: '700', color: C.texte, margin: 0, fontFamily: FONT }}>
            {modeReset ? 'Mot de passe oublié' : 'Connexion'}
          </h2>
        </div>

        {/* Bandeau flash — affiché si on a été redirigé ici (session expirée, etc.) */}
        {flash && (
          <div style={{
            backgroundColor: '#fff8e6',
            border: '1px solid #ead9a8',
            borderRadius: '12px',
            padding: '14px 18px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            color: C.orIntense,
            fontSize: '14px',
            lineHeight: '1.5',
            fontFamily: FONT,
          }}>
            <span style={{ fontSize: '18px', lineHeight: '1.2', flexShrink: 0 }}>⏱️</span>
            <span style={{ flex: 1 }}>{flash}</span>
            <button
              onClick={() => setFlash('')}
              aria-label="Fermer"
              style={{
                background: 'none', border: 'none', color: C.orIntense,
                fontSize: '16px', cursor: 'pointer', padding: 0, lineHeight: 1,
                fontFamily: FONT, flexShrink: 0,
              }}
            >✕</button>
          </div>
        )}

        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '36px', boxShadow: '0 2px 20px rgba(0,0,0,0.07)' }}>
          {!modeReset ? (
            <>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: C.texteSecondaire, marginBottom: '8px', fontFamily: FONT }}>Email</label>
                <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="votre@email.com" style={inputStyle} />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: C.texteSecondaire, marginBottom: '8px', fontFamily: FONT }}>Mot de passe</label>
                <input type="password" name="mot_de_passe" value={form.mot_de_passe} onChange={handleChange} placeholder="••••••••" style={inputStyle} />
              </div>
              <div style={{ textAlign: 'right', marginBottom: '24px' }}>
                <button onClick={() => { setModeReset(true); setErreur('') }} style={{ background: 'none', border: 'none', color: C.vert, fontSize: '13px', cursor: 'pointer', fontFamily: FONT, textDecoration: 'underline' }}>
                  Mot de passe oublié ?
                </button>
              </div>
              {erreur && (
                <div style={{ backgroundColor: '#fff0f0', border: '1px solid #ffcccc', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', color: '#c0392b', fontSize: '14px', fontFamily: FONT }}>
                  {erreur}
                </div>
              )}
              <button onClick={handleSubmit} disabled={chargement} style={{ width: '100%', padding: '14px', backgroundColor: C.vert, color: 'white', border: 'none', borderRadius: '40px', fontSize: '15px', fontWeight: '700', cursor: chargement ? 'not-allowed' : 'pointer', fontFamily: FONT, opacity: chargement ? 0.7 : 1 }}>
                {chargement ? 'Connexion...' : 'Se connecter'}
              </button>
              <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: C.texteSecondaire, fontFamily: FONT }}>
                Pas encore de compte ?{' '}
                <a href={`/compte/inscription${ceCode ? `?ce=${ceCode}` : ''}`} style={{ color: C.vert, fontWeight: '700', textDecoration: 'none' }}>
                  S'inscrire
                </a>
              </p>
            </>
          ) : (
            <>
              {!messageReset ? (
                <>
                  <p style={{ fontSize: '15px', color: C.texteSecondaire, lineHeight: '1.7', marginBottom: '24px', fontFamily: FONT }}>
                    Saisissez votre email. Si un compte existe, vous recevrez un lien de réinitialisation.
                  </p>
                  <div style={{ marginBottom: '28px' }}>
                    <label style={{ display: 'block', fontSize: '13px', color: C.texteSecondaire, marginBottom: '8px', fontFamily: FONT }}>Email</label>
                    <input type="email" value={emailReset} onChange={e => setEmailReset(e.target.value)} placeholder="votre@email.com" style={inputStyle} />
                  </div>
                  <button onClick={handleReset} disabled={chargementReset} style={{ width: '100%', padding: '14px', backgroundColor: C.vert, color: 'white', border: 'none', borderRadius: '40px', fontSize: '15px', fontWeight: '700', cursor: chargementReset ? 'not-allowed' : 'pointer', fontFamily: FONT, opacity: chargementReset ? 0.7 : 1 }}>
                    {chargementReset ? 'Envoi...' : 'Envoyer le lien'}
                  </button>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div style={{ fontSize: '40px', marginBottom: '16px' }}>✉️</div>
                  <p style={{ fontSize: '15px', color: C.texte, lineHeight: '1.6', fontFamily: FONT }}>{messageReset}</p>
                </div>
              )}
              <button onClick={() => { setModeReset(false); setMessageReset(''); setEmailReset('') }} style={{ width: '100%', marginTop: '20px', padding: '12px', backgroundColor: 'transparent', color: C.texteSecondaire, border: '1px solid #ddd', borderRadius: '40px', fontSize: '14px', cursor: 'pointer', fontFamily: FONT }}>
                Retour à la connexion
              </button>
            </>
          )}
        </div>
      </main>

      <footer style={{ backgroundColor: C.footer, padding: '24px', textAlign: 'center' }}>
        <p style={{ color: C.fondAlt, fontSize: '13px', margin: 0, fontFamily: FONT }}>2026 Bookdog — Librairie indépendante Paris 17e</p>
      </footer>
    </div>
  )
}