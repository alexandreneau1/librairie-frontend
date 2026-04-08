'use client'

import { useState, useEffect } from 'react'
import Header from '../../components/Header'

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

const COULEURS_CATEGORIE: Record<string, { bg: string; color: string }> = {
  'Dédicace':       { bg: '#fff8e6', color: '#9A6F09' },
  'Rencontre':      { bg: '#EAF2EC', color: '#1A3C2E' },
  'Lecture':        { bg: '#e3f2fd', color: '#1565c0' },
  'Club de lecture':{ bg: '#f3e5f5', color: '#6a1b9a' },
  'Conférence':     { bg: '#fce4ec', color: '#880e4f' },
  'Atelier':        { bg: '#e8f5e9', color: '#2e7d32' },
}

function badgeCategorie(categorie: string | null) {
  if (!categorie) return null
  const style = COULEURS_CATEGORIE[categorie] || { bg: '#f5f5f5', color: '#666' }
  return (
    <span style={{ backgroundColor: style.bg, color: style.color, fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '20px', letterSpacing: '0.5px' }}>
      {categorie}
    </span>
  )
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return {
    jour: d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
    heure: d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    jourCourt: d.getDate(),
    mois: d.toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase(),
  }
}

type Evenement = {
  id: number
  titre: string
  description: string | null
  date_evenement: string
  categorie: string | null
  affiche_url: string | null
  actif: boolean
}

export default function Evenements() {
  const [evenements, setEvenements] = useState<Evenement[]>([])
  const [chargement, setChargement] = useState(true)
  const [filtre, setFiltre] = useState<string>('tous')

  useEffect(() => {
    fetch('http://localhost:3001/evenements')
      .then(r => r.json())
      .then(d => { setEvenements(Array.isArray(d) ? d : []); setChargement(false) })
      .catch(() => setChargement(false))
  }, [])

  const maintenant = new Date()
  const aVenir = evenements.filter(e => new Date(e.date_evenement) >= maintenant)
  const passes = evenements.filter(e => new Date(e.date_evenement) < maintenant)

  const categories = ['tous', ...Array.from(new Set(evenements.map(e => e.categorie).filter(Boolean) as string[]))]

  const filtrer = (liste: Evenement[]) =>
    filtre === 'tous' ? liste : liste.filter(e => e.categorie === filtre)

  return (
    <div style={{ backgroundColor: C.fond, minHeight: '100vh', fontFamily: 'Georgia, serif' }}>
      <Header pageCourante="evenements" />

      {/* Hero */}
      <div style={{ backgroundColor: C.vert, paddingBottom: '48px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '48px 24px 0', boxSizing: 'border-box', textAlign: 'center' }}>
          <p style={{ color: C.or, fontSize: '12px', letterSpacing: '2px', margin: '0 0 12px', fontWeight: '600' }}>LA VIE DE LA LIBRAIRIE</p>
          <h1 style={{ color: 'white', fontSize: '40px', fontWeight: '700', margin: '0 0 16px', lineHeight: '1.2' }}>Événements</h1>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '16px', maxWidth: '480px', margin: '0 auto', lineHeight: '1.8' }}>
            Dédicaces, rencontres d'auteurs, ateliers lecture — rejoignez-nous pour partager la passion des livres.
          </p>
        </div>
      </div>
      <div style={{ backgroundColor: C.vert, height: '32px', borderRadius: '0 0 50% 50% / 0 0 28px 28px' }} />

      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '48px 24px 60px', boxSizing: 'border-box' }}>

        {/* Filtres catégories */}
        {categories.length > 1 && (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '36px', flexWrap: 'wrap' }}>
            {categories.map(cat => (
              <button key={cat} onClick={() => setFiltre(cat)}
                style={{ padding: '7px 18px', borderRadius: '40px', border: 'none', cursor: 'pointer', fontSize: '13px', fontFamily: 'Georgia, serif', fontWeight: filtre === cat ? '700' : '400', backgroundColor: filtre === cat ? C.vert : 'white', color: filtre === cat ? 'white' : C.texteSecondaire, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                {cat === 'tous' ? 'Tous les événements' : cat}
              </button>
            ))}
          </div>
        )}

        {chargement && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: C.texteSecondaire }}>Chargement...</div>
        )}

        {!chargement && evenements.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <p style={{ fontSize: '40px', marginBottom: '16px' }}>📅</p>
            <p style={{ fontSize: '18px', color: C.texteSecondaire, margin: '0 0 8px' }}>Aucun événement programmé</p>
            <p style={{ fontSize: '14px', color: '#bbb' }}>Revenez bientôt !</p>
          </div>
        )}

        {/* Événements à venir */}
        {filtrer(aVenir).length > 0 && (
          <div style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: C.texte, margin: '0 0 24px', paddingBottom: '10px', borderBottom: `2px solid ${C.vert}` }}>
              À venir
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
              {filtrer(aVenir).map(e => {
                const date = formatDate(e.date_evenement)
                return (
                  <div key={e.id} style={{ backgroundColor: 'white', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', display: 'flex', flexDirection: 'column' }}>
                    {/* Affiche */}
                    {e.affiche_url ? (
                      <div style={{ height: '200px', overflow: 'hidden' }}>
                        <img src={e.affiche_url} alt={e.titre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    ) : (
                      <div style={{ height: '140px', backgroundColor: C.fondAlt, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: '48px' }}>📖</span>
                      </div>
                    )}
                    <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      {/* Date + catégorie */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ backgroundColor: C.vert, borderRadius: '8px', padding: '6px 10px', textAlign: 'center', minWidth: '44px' }}>
                            <p style={{ color: C.or, fontSize: '18px', fontWeight: '700', margin: 0, lineHeight: 1 }}>{date.jourCourt}</p>
                            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '10px', margin: 0, letterSpacing: '1px' }}>{date.mois}</p>
                          </div>
                          <p style={{ fontSize: '13px', color: C.texteSecondaire, margin: 0 }}>{date.heure}</p>
                        </div>
                        {badgeCategorie(e.categorie)}
                      </div>
                      <h3 style={{ fontSize: '17px', fontWeight: '700', color: C.texte, margin: '0 0 10px', lineHeight: '1.3' }}>{e.titre}</h3>
                      {e.description && <p style={{ fontSize: '13px', color: C.texteSecondaire, margin: '0 0 16px', lineHeight: '1.7', flex: 1 }}>{e.description}</p>}
                      <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid #f0f0f0', fontSize: '12px', color: C.texteSecondaire }}>
                        📍 42 rue Laugier, Paris 17e
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Événements passés */}
        {filtrer(passes).length > 0 && (
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: C.texteSecondaire, margin: '0 0 20px', paddingBottom: '10px', borderBottom: '1px solid #eee' }}>
              Événements passés
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filtrer(passes).map(e => {
                const date = formatDate(e.date_evenement)
                return (
                  <div key={e.id} style={{ backgroundColor: 'white', borderRadius: '12px', padding: '16px 20px', boxShadow: '0 1px 6px rgba(0,0,0,0.05)', display: 'flex', gap: '16px', alignItems: 'center', opacity: 0.7 }}>
                    <div style={{ backgroundColor: '#f5f5f5', borderRadius: '8px', padding: '8px 12px', textAlign: 'center', minWidth: '48px', flexShrink: 0 }}>
                      <p style={{ color: C.texteSecondaire, fontSize: '18px', fontWeight: '700', margin: 0, lineHeight: 1 }}>{date.jourCourt}</p>
                      <p style={{ color: '#bbb', fontSize: '10px', margin: 0, letterSpacing: '1px' }}>{date.mois}</p>
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '15px', fontWeight: '600', color: C.texte, margin: '0 0 4px' }}>{e.titre}</p>
                      <p style={{ fontSize: '12px', color: C.texteSecondaire, margin: 0 }}>{date.heure}</p>
                    </div>
                    {badgeCategorie(e.categorie)}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </main>

      <footer style={{ backgroundColor: C.footer, padding: '24px', textAlign: 'center', marginTop: '40px' }}>
        <p style={{ color: C.fondAlt, fontSize: '13px', margin: 0 }}>2026 Bookdog — Librairie indépendante Paris 17e</p>
      </footer>
    </div>
  )
}