'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'

const C = {
  vert: '#1A3C2E', or: '#D4AF37', orIntense: '#B8960C',
  fond: '#F9F6F0', fondAlt: '#EAF2EC', texte: '#1C1C1C',
  texteSecondaire: '#6B6B5E', footer: '#0f2419',
}
const FONT = "'EB Garamond', Georgia, serif"

type CE = {
  id: number
  nom: string
  code: string
  remise: number
  adresse_livraison: string | null
}

export default function PageCE() {
  const params = useParams()
  const searchParams = useSearchParams()
  const code = params.code as string
  const emailParam = searchParams.get('email') || ''

  const [ce, setCe] = useState<CE | null>(null)
  const [introuvable, setIntrouvable] = useState(false)
  const [chargement, setChargement] = useState(true)

  useEffect(() => {
    fetch(`http://localhost:3001/ce/${code}`)
      .then(r => r.json())
      .then(data => {
        if (data.id) setCe(data)
        else setIntrouvable(true)
      })
      .catch(() => setIntrouvable(true))
      .finally(() => setChargement(false))
  }, [code])

  const handleContinuer = () => {
    const params = new URLSearchParams()
    params.set('ce', code)
    if (emailParam) params.set('email', emailParam)
    window.location.href = `/compte/inscription?${params.toString()}`
  }

  const handleConnexion = () => {
    window.location.href = `/compte/connexion?ce=${code}`
  }

  if (chargement) return (
    <div style={{ backgroundColor: C.fond, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT }}>
      <p style={{ color: C.texteSecondaire }}>Chargement...</p>
    </div>
  )

  if (introuvable) return (
    <div style={{ backgroundColor: C.fond, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT }}>
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <p style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</p>
        <h2 style={{ fontSize: '24px', color: C.texte, marginBottom: '12px' }}>Espace CE introuvable</h2>
        <p style={{ color: C.texteSecondaire, marginBottom: '24px' }}>Ce lien CE n'est pas valide ou a expiré.</p>
        <a href="/" style={{ color: C.vert, textDecoration: 'none', fontWeight: '700' }}>← Retour à la librairie</a>
      </div>
    </div>
  )

  return (
    <div style={{ backgroundColor: C.fond, minHeight: '100vh', fontFamily: FONT }}>

      {/* Header */}
      <header style={{ backgroundColor: C.vert }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px 24px', boxSizing: 'border-box', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <a href="/" style={{ textDecoration: 'none' }}>
            <h1 style={{ color: 'white', fontSize: '26px', fontWeight: '700', margin: 0, letterSpacing: '2px', fontFamily: FONT }}>BOOKDOG</h1>
            <p style={{ color: C.fondAlt, fontSize: '12px', margin: '2px 0 0', fontFamily: FONT }}>Librairie indépendante — Paris 17e</p>
          </a>
          <span style={{ backgroundColor: 'rgba(255,255,255,0.12)', color: C.or, fontSize: '12px', fontWeight: '700', padding: '5px 14px', borderRadius: '20px', letterSpacing: '1px', fontFamily: FONT }}>
            ESPACE {ce!.nom.toUpperCase()}
          </span>
        </div>
      </header>

      <main style={{ maxWidth: '560px', margin: '0 auto', padding: '64px 24px 80px', boxSizing: 'border-box' }}>

        {/* Badge CE */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', backgroundColor: C.fondAlt, borderRadius: '40px', padding: '8px 20px', marginBottom: '24px' }}>
            <span style={{ fontSize: '20px' }}>🏢</span>
            <span style={{ fontSize: '14px', fontWeight: '600', color: C.vert, fontFamily: FONT }}>Offre partenaire — {ce!.nom}</span>
          </div>
          <h2 style={{ fontSize: '34px', fontWeight: '700', color: C.texte, margin: '0 0 12px', lineHeight: '1.2', fontFamily: FONT }}>
            Bienvenue chez Bookdog
          </h2>
          <p style={{ color: C.texteSecondaire, fontSize: '16px', lineHeight: '1.7', margin: 0, fontFamily: FONT }}>
            En tant que salarié {ce!.nom}, bénéficiez d'une remise exclusive sur tous nos livres.
          </p>
        </div>

        {/* Carte avantage */}
        <div style={{ backgroundColor: C.vert, borderRadius: '16px', padding: '32px', marginBottom: '32px', textAlign: 'center' }}>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', letterSpacing: '2px', fontWeight: '600', margin: '0 0 8px', fontFamily: FONT }}>VOTRE AVANTAGE CE</p>
          <p style={{ color: C.or, fontSize: '52px', fontWeight: '700', margin: '0 0 4px', lineHeight: 1, fontFamily: FONT }}>
            -{ce!.remise}%
          </p>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '15px', margin: '0 0 24px', fontFamily: FONT }}>sur tous les livres du catalogue</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'left' }}>
            {[
              { icon: '📚', text: 'Accès à tout notre catalogue — plus de 1 000 titres' },
              { icon: '🏠', text: ce!.adresse_livraison ? `Livraison à votre entreprise — ${ce!.adresse_livraison}` : 'Livraison à votre adresse professionnelle' },
              { icon: '🏪', text: 'Retrait en boutique — 42 rue Laugier, Paris 17e' },
              { icon: '💳', text: 'Paiement sécurisé par carte bancaire' },
            ].map(({ icon, text }) => (
              <div key={text} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <span style={{ fontSize: '16px', flexShrink: 0, marginTop: '1px' }}>{icon}</span>
                <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', fontFamily: FONT }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Email pré-rempli si disponible */}
        {emailParam && (
          <div style={{ backgroundColor: C.fondAlt, borderRadius: '12px', padding: '16px 20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '18px' }}>✉️</span>
            <div>
              <p style={{ fontSize: '12px', color: C.texteSecondaire, margin: '0 0 2px', fontWeight: '600', fontFamily: FONT }}>VOTRE EMAIL PROFESSIONNEL</p>
              <p style={{ fontSize: '15px', color: C.texte, margin: 0, fontWeight: '600', fontFamily: FONT }}>{emailParam}</p>
            </div>
          </div>
        )}

        {/* CTA */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button
            onClick={handleContinuer}
            style={{ width: '100%', padding: '16px', backgroundColor: C.orIntense, color: 'white', border: 'none', borderRadius: '40px', fontSize: '16px', fontWeight: '700', cursor: 'pointer', fontFamily: FONT }}
          >
            {emailParam ? 'Créer mon compte avec cet email →' : 'Créer mon compte CE →'}
          </button>
          <button
            onClick={handleConnexion}
            style={{ width: '100%', padding: '14px', backgroundColor: 'white', color: C.vert, border: `1px solid ${C.vert}`, borderRadius: '40px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT }}
          >
            J'ai déjà un compte — me connecter
          </button>
        </div>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '13px', color: C.texteSecondaire, fontFamily: FONT }}>
          La remise est automatiquement appliquée à votre compte via votre email professionnel.
        </p>

      </main>

      <footer style={{ backgroundColor: C.footer, padding: '24px', textAlign: 'center' }}>
        <p style={{ color: C.fondAlt, fontSize: '13px', margin: 0, fontFamily: FONT }}>2026 Bookdog — Librairie indépendante Paris 17e</p>
      </footer>
    </div>
  )
}