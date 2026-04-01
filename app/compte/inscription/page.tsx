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

export default function Inscription() {
  const router = useRouter()
  const [form, setForm] = useState({ nom: '', prenom: '', email: '', mot_de_passe: '' })
  const [erreur, setErreur] = useState('')
  const [chargement, setChargement] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErreur('')
    if (!form.prenom || !form.nom || !form.email || !form.mot_de_passe) { setErreur('Tous les champs sont obligatoires'); return }
    if (form.mot_de_passe.length < 8) { setErreur('Le mot de passe doit contenir au minimum 8 caractères'); return }
    setChargement(true)
    try {
      const res = await fetch('http://localhost:3001/compte/inscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (!res.ok) setErreur(data.message || "Erreur lors de l'inscription")
      else router.push('/compte/connexion')
    } catch { setErreur('Impossible de contacter le serveur') }
    finally { setChargement(false) }
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
          <a href="/compte/connexion" style={{ color: C.fondAlt, textDecoration: 'none', fontSize: '14px' }}>Déjà un compte ? Se connecter</a>
        </div>
      </header>

      <main style={{ maxWidth: '480px', margin: '0 auto', padding: '80px 24px', boxSizing: 'border-box' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <p style={{ color: C.vert, fontSize: '12px', letterSpacing: '2px', marginBottom: '8px' }}>Espace client</p>
          <h2 style={{ fontSize: '32px', fontWeight: '700', color: C.texte, margin: 0 }}>Créer un compte</h2>
        </div>

        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '40px', boxShadow: '0 2px 20px rgba(0,0,0,0.07)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: C.texteSecondaire, marginBottom: '8px' }}>Prénom</label>
              <input type="text" name="prenom" value={form.prenom} onChange={handleChange} placeholder="Jean" style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: C.texteSecondaire, marginBottom: '8px' }}>Nom</label>
              <input type="text" name="nom" value={form.nom} onChange={handleChange} placeholder="Dupont" style={inputStyle} />
            </div>
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', color: C.texteSecondaire, marginBottom: '8px' }}>Email</label>
            <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="votre@email.com" style={inputStyle} />
          </div>
          <div style={{ marginBottom: '28px' }}>
            <label style={{ display: 'block', fontSize: '13px', color: C.texteSecondaire, marginBottom: '8px' }}>Mot de passe</label>
            <input type="password" name="mot_de_passe" value={form.mot_de_passe} onChange={handleChange} placeholder="••••••••" style={inputStyle} />
          </div>
          {erreur && <div style={{ backgroundColor: '#fff0f0', border: '1px solid #ffcccc', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', color: '#c0392b', fontSize: '14px' }}>{erreur}</div>}
          <button onClick={handleSubmit} disabled={chargement} style={{ width: '100%', padding: '14px', backgroundColor: C.vert, color: 'white', border: 'none', borderRadius: '40px', fontSize: '15px', fontWeight: '700', cursor: chargement ? 'not-allowed' : 'pointer', fontFamily: 'Georgia, serif', opacity: chargement ? 0.7 : 1 }}>
            {chargement ? 'Création...' : 'Créer mon compte'}
          </button>
          <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: C.texteSecondaire }}>
            Déjà un compte ?{' '}<a href="/compte/connexion" style={{ color: C.vert, fontWeight: '700', textDecoration: 'none' }}>Se connecter</a>
          </p>
        </div>
      </main>

      <footer style={{ backgroundColor: C.footer, padding: '24px', textAlign: 'center' }}>
        <p style={{ color: C.fondAlt, fontSize: '13px', margin: 0 }}>2026 Bookdog — Librairie independante Paris 17e</p>
      </footer>
    </div>
  )
}