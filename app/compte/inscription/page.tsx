'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

const C = {
  vert: '#1A3C2E', or: '#D4AF37', orIntense: '#B8960C',
  fond: '#F9F6F0', fondAlt: '#EAF2EC', texte: '#1C1C1C',
  texteSecondaire: '#6B6B5E', footer: '#0f2419',
}
const FONT = "'EB Garamond', Georgia, serif"

type CE = { id: number; nom: string; code: string; remise: number }

export default function Inscription() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Params CE depuis l'URL (?ce=sanofi&email=prenom.nom@sanofi.com)
  const ceCode = searchParams.get('ce') || ''
  const emailParam = searchParams.get('email') || ''

  const [form, setForm] = useState({
    nom: '', prenom: '', email: emailParam, mot_de_passe: ''
  })
  const [erreur, setErreur] = useState('')
  const [chargement, setChargement] = useState(false)
  const [ce, setCe] = useState<CE | null>(null)
  const [detectionCe, setDetectionCe] = useState(false)

  // Si un code CE est passé en URL, charger les infos CE
  useEffect(() => {
    if (!ceCode) return
    fetch(`http://localhost:3001/ce/${ceCode}`)
      .then(r => r.json())
      .then(data => { if (data.id) setCe(data) })
      .catch(() => {})
  }, [ceCode])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  // Détection automatique du CE par domaine email (sur blur du champ email)
  async function handleEmailBlur() {
    if (ce) return // déjà détecté via URL
    const email = form.email.trim()
    if (!email.includes('@')) return
    const domaine = email.split('@')[1]?.toLowerCase()
    if (!domaine) return

    setDetectionCe(true)
    try {
      const res = await fetch(`http://localhost:3001/ce/domaine/${domaine}`)
      const data = await res.json()
      if (data.ce) setCe(data.ce)
    } catch {}
    setDetectionCe(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErreur('')
    if (!form.prenom || !form.nom || !form.email || !form.mot_de_passe) {
      setErreur('Tous les champs sont obligatoires'); return
    }
    if (form.mot_de_passe.length < 8) {
      setErreur('Le mot de passe doit contenir au minimum 8 caractères'); return
    }

    setChargement(true)
    try {
      const res = await fetch('http://localhost:3001/compte/inscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          ce_id: ce?.id || null,
        })
      })
      const data = await res.json()
      if (!res.ok) setErreur(data.message || "Erreur lors de l'inscription")
      else {
        if (data.rapprochement_propose) {
          localStorage.setItem('rapprochementPropose', JSON.stringify(data.rapprochement_propose))
        }
        router.push('/compte/connexion')
      }
    } catch {
      setErreur('Impossible de contacter le serveur')
    } finally {
      setChargement(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 16px', borderRadius: '8px',
    border: '1px solid #ddd', fontSize: '15px',
    boxSizing: 'border-box', fontFamily: FONT,
  }

  const fluxCE = !!ceCode || !!ce

  return (
    <div style={{ backgroundColor: C.fond, minHeight: '100vh', fontFamily: FONT }}>

      <header style={{ backgroundColor: C.vert }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px 24px', boxSizing: 'border-box', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <a href="/" style={{ textDecoration: 'none' }}>
            <h1 style={{ color: 'white', fontSize: '26px', fontWeight: '700', margin: 0, letterSpacing: '2px', fontFamily: FONT }}>BOOKDOG</h1>
            <p style={{ color: C.fondAlt, fontSize: '12px', margin: '2px 0 0', fontFamily: FONT }}>Librairie indépendante — Paris 17e</p>
          </a>
          {ce && (
            <span style={{ backgroundColor: 'rgba(255,255,255,0.12)', color: C.or, fontSize: '12px', fontWeight: '700', padding: '5px 14px', borderRadius: '20px', letterSpacing: '1px', fontFamily: FONT }}>
              ESPACE {ce.nom.toUpperCase()}
            </span>
          )}
          <a href="/compte/connexion" style={{ color: C.fondAlt, textDecoration: 'none', fontSize: '14px', fontFamily: FONT }}>Déjà un compte ? Se connecter</a>
        </div>
      </header>

      <main style={{ maxWidth: '480px', margin: '0 auto', padding: '64px 24px 80px', boxSizing: 'border-box' }}>

        {/* Titre */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          {fluxCE && ce ? (
            <>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: C.fondAlt, borderRadius: '40px', padding: '6px 16px', marginBottom: '16px' }}>
                <span>🏢</span>
                <span style={{ fontSize: '13px', fontWeight: '600', color: C.vert, fontFamily: FONT }}>Offre CE — {ce.nom}</span>
              </div>
              <h2 style={{ fontSize: '30px', fontWeight: '700', color: C.texte, margin: '0 0 8px', fontFamily: FONT }}>Créer mon compte</h2>
              <p style={{ color: C.texteSecondaire, fontSize: '15px', margin: 0, fontFamily: FONT }}>
                Remise de <strong style={{ color: C.vert }}>{ce.remise}%</strong> automatiquement appliquée à votre compte.
              </p>
            </>
          ) : (
            <>
              <p style={{ color: C.vert, fontSize: '12px', letterSpacing: '2px', marginBottom: '8px', fontFamily: FONT }}>Espace client</p>
              <h2 style={{ fontSize: '32px', fontWeight: '700', color: C.texte, margin: 0, fontFamily: FONT }}>Créer un compte</h2>
            </>
          )}
        </div>

        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '36px', boxShadow: '0 2px 20px rgba(0,0,0,0.07)' }}>

          {/* Prénom + Nom */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: C.texteSecondaire, marginBottom: '8px', fontFamily: FONT }}>Prénom</label>
              <input type="text" name="prenom" value={form.prenom} onChange={handleChange} placeholder="Jean" style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: C.texteSecondaire, marginBottom: '8px', fontFamily: FONT }}>Nom</label>
              <input type="text" name="nom" value={form.nom} onChange={handleChange} placeholder="Dupont" style={inputStyle} />
            </div>
          </div>

          {/* Email */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', color: C.texteSecondaire, marginBottom: '8px', fontFamily: FONT }}>
              Email {fluxCE ? 'professionnel' : ''}
            </label>
            <input
              type="email" name="email" value={form.email}
              onChange={handleChange} onBlur={handleEmailBlur}
              placeholder={fluxCE ? 'prenom.nom@entreprise.com' : 'votre@email.com'}
              style={{ ...inputStyle, backgroundColor: emailParam ? C.fondAlt : 'white' }}
              readOnly={!!emailParam}
            />
            {detectionCe && <p style={{ fontSize: '12px', color: C.texteSecondaire, margin: '6px 0 0', fontFamily: FONT }}>🔍 Vérification de votre CE...</p>}
            {!detectionCe && ce && !ceCode && (
              <p style={{ fontSize: '12px', color: C.vert, margin: '6px 0 0', fontWeight: '600', fontFamily: FONT }}>
                ✓ CE {ce.nom} détecté — remise de {ce.remise}% appliquée
              </p>
            )}
          </div>

          {/* Mot de passe */}
          <div style={{ marginBottom: '28px' }}>
            <label style={{ display: 'block', fontSize: '13px', color: C.texteSecondaire, marginBottom: '8px', fontFamily: FONT }}>Mot de passe</label>
            <input type="password" name="mot_de_passe" value={form.mot_de_passe} onChange={handleChange} placeholder="••••••••" style={inputStyle} />
            <p style={{ fontSize: '12px', color: '#bbb', margin: '6px 0 0', fontFamily: FONT }}>8 caractères minimum</p>
          </div>

          {/* Récap CE si détecté */}
          {ce && (
            <div style={{ backgroundColor: C.fondAlt, borderRadius: '10px', padding: '14px 16px', marginBottom: '20px' }}>
              <p style={{ fontSize: '12px', color: C.texteSecondaire, margin: '0 0 6px', fontWeight: '600', fontFamily: FONT }}>AVANTAGES CE INCLUS</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <p style={{ fontSize: '13px', color: C.texte, margin: 0, fontFamily: FONT }}>✓ Remise de {ce.remise}% sur tout le catalogue</p>
                <p style={{ fontSize: '13px', color: C.texte, margin: 0, fontFamily: FONT }}>✓ Livraison à votre entreprise disponible</p>
                <p style={{ fontSize: '13px', color: C.texte, margin: 0, fontFamily: FONT }}>✓ Retrait en boutique disponible</p>
              </div>
            </div>
          )}

          {erreur && (
            <div style={{ backgroundColor: '#fff0f0', border: '1px solid #ffcccc', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', color: '#c0392b', fontSize: '14px', fontFamily: FONT }}>
              {erreur}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={chargement}
            style={{ width: '100%', padding: '14px', backgroundColor: C.vert, color: 'white', border: 'none', borderRadius: '40px', fontSize: '15px', fontWeight: '700', cursor: chargement ? 'not-allowed' : 'pointer', fontFamily: FONT, opacity: chargement ? 0.7 : 1 }}
          >
            {chargement ? 'Création...' : 'Créer mon compte'}
          </button>

          <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: C.texteSecondaire, fontFamily: FONT }}>
            Déjà un compte ?{' '}
            <a href={`/compte/connexion${ceCode ? `?ce=${ceCode}` : ''}`} style={{ color: C.vert, fontWeight: '700', textDecoration: 'none' }}>
              Se connecter
            </a>
          </p>
        </div>
      </main>

      <footer style={{ backgroundColor: C.footer, padding: '24px', textAlign: 'center' }}>
        <p style={{ color: C.fondAlt, fontSize: '13px', margin: 0, fontFamily: FONT }}>2026 Bookdog — Librairie indépendante Paris 17e</p>
      </footer>
    </div>
  )
}