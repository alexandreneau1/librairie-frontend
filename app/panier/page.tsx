'use client'

import { useState, useEffect } from 'react'
import Header from '../../components/Header'
import {
  getPanier, setQuantite, retirerDuPanier, viderPanier, getTotal,
  type ArticlePanier,
} from '../../lib/panier'

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

type Etape = 'panier' | 'coordonnees' | 'confirmation'

type RecapLigne = {
  titre: string
  auteur: string
  prix: number
  quantite: number
  type: string
  total: string
}

export default function PagePanier() {
  const [panier, setPanier] = useState<ArticlePanier[]>([])
  const [total, setTotal] = useState(0)
  const [etape, setEtape] = useState<Etape>('panier')
  const [nom, setNom] = useState('')
  const [email, setEmail] = useState('')
  const [telephone, setTelephone] = useState('')
  const [erreur, setErreur] = useState('')
  const [chargement, setChargement] = useState(false)
  const [recap, setRecap] = useState<RecapLigne[]>([])
  const [totalFinal, setTotalFinal] = useState('0.00')

  // Sync panier depuis localStorage
  const syncPanier = () => {
    const p = getPanier()
    setPanier(p)
    setTotal(getTotal())
  }

  useEffect(() => {
    syncPanier()

    // Pré-remplir si client connecté
    const info = localStorage.getItem('clientInfo')
    if (info) {
      const parsed = JSON.parse(info)
      setNom(`${parsed.prenom || ''} ${parsed.nom || ''}`.trim())
      setEmail(parsed.email || '')
    }

    const handleChange = () => syncPanier()
    window.addEventListener('bookdog_panier_change', handleChange)
    return () => window.removeEventListener('bookdog_panier_change', handleChange)
  }, [])

  // ── Modifier quantité ─────────────────────────────────────────────────────
  const handleQuantite = (livre_id: number, val: number) => {
    setQuantite(livre_id, val)
    syncPanier()
  }

  // ── Retirer article ───────────────────────────────────────────────────────
  const handleRetirer = (livre_id: number) => {
    retirerDuPanier(livre_id)
    syncPanier()
  }

  // ── Valider commande ──────────────────────────────────────────────────────
  const handleValider = async () => {
    setErreur('')
    if (!nom.trim()) { setErreur('Veuillez indiquer votre nom.'); return }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErreur('Adresse email invalide.'); return
    }

    setChargement(true)
    try {
      const res = await fetch('http://localhost:3001/commandes/panier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom: nom.trim(),
          email: email.trim(),
          telephone: telephone.trim() || null,
          articles: panier.map(a => ({ livre_id: a.livre_id, quantite: a.quantite })),
        }),
      })
      const data = await res.json()
      if (!res.ok) { setErreur(data.message || 'Une erreur est survenue.'); return }

      setRecap(data.recap || [])
      setTotalFinal(data.total || '0.00')
      viderPanier()
      syncPanier()
      setEtape('confirmation')
    } catch {
      setErreur('Impossible de contacter le serveur.')
    } finally {
      setChargement(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 16px', borderRadius: '8px',
    border: '1px solid #ddd', fontSize: '15px',
    boxSizing: 'border-box', fontFamily: 'Georgia, serif',
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ backgroundColor: C.fond, minHeight: '100vh', fontFamily: 'Georgia, serif' }}>
      <Header pageCourante="panier" />

      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '48px 24px 80px', boxSizing: 'border-box' }}>

        {/* Breadcrumb étapes */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '40px' }}>
          {(['panier', 'coordonnees', 'confirmation'] as Etape[]).map((e, i) => {
            const labels: Record<Etape, string> = { panier: 'Panier', coordonnees: 'Coordonnées', confirmation: 'Confirmation' }
            const actif = etape === e
            const passe = ['panier', 'coordonnees', 'confirmation'].indexOf(etape) > i
            return (
              <div key={e} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    width: '28px', height: '28px', borderRadius: '50%', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700',
                    backgroundColor: passe ? C.vert : actif ? C.orIntense : '#ddd',
                    color: passe || actif ? 'white' : C.texteSecondaire,
                  }}>
                    {passe ? '✓' : i + 1}
                  </span>
                  <span style={{ fontSize: '14px', fontWeight: actif ? '700' : '400', color: actif ? C.texte : C.texteSecondaire }}>
                    {labels[e]}
                  </span>
                </div>
                {i < 2 && <span style={{ color: '#ddd', fontSize: '18px' }}>›</span>}
              </div>
            )
          })}
        </div>

        {/* ── ÉTAPE 1 : PANIER ─────────────────────────────────────────── */}
        {etape === 'panier' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '24px' }}>
              <h1 style={{ fontSize: '28px', fontWeight: '700', color: C.texte, margin: 0 }}>
                Mon panier
                {panier.length > 0 && <span style={{ fontSize: '16px', color: C.texteSecondaire, fontWeight: '400', marginLeft: '12px' }}>{panier.length} titre{panier.length > 1 ? 's' : ''}</span>}
              </h1>
              {panier.length > 0 && (
                <button
                  onClick={() => { if (confirm('Vider le panier ?')) { viderPanier(); syncPanier() } }}
                  style={{ background: 'none', border: 'none', color: '#c0392b', fontSize: '13px', cursor: 'pointer', fontFamily: 'Georgia, serif', textDecoration: 'underline' }}
                >
                  Vider le panier
                </button>
              )}
            </div>

            {panier.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 0' }}>
                <p style={{ fontSize: '48px', marginBottom: '16px' }}>🛒</p>
                <p style={{ fontSize: '18px', color: C.texteSecondaire, marginBottom: '8px' }}>Votre panier est vide</p>
                <p style={{ fontSize: '14px', color: '#bbb', marginBottom: '32px' }}>Parcourez notre catalogue pour trouver votre prochain livre</p>
                <a href="/livres" style={{ display: 'inline-block', backgroundColor: C.vert, color: 'white', padding: '12px 28px', borderRadius: '40px', textDecoration: 'none', fontWeight: '700', fontSize: '14px' }}>
                  Découvrir le catalogue
                </a>
              </div>
            ) : (
              <>
                {/* Liste articles */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
                  {panier.map(article => (
                    <div
                      key={article.livre_id}
                      style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '20px', borderLeft: `4px solid ${C.vert}` }}
                    >
                      {/* Infos livre */}
                      <div style={{ flex: 1 }}>
                        <a href={`/livres/${article.livre_id}`} style={{ textDecoration: 'none' }}>
                          <p style={{ fontWeight: '700', fontSize: '16px', color: C.texte, margin: '0 0 4px' }}>{article.titre}</p>
                        </a>
                        <p style={{ fontSize: '13px', color: C.texteSecondaire, margin: '0 0 8px', fontStyle: 'italic' }}>{article.auteur}</p>
                        {/* Badge disponibilité selon quantité vs stock */}
                        {article.stock === 0 ? (
                          <span style={{ fontSize: '11px', fontWeight: '600', padding: '3px 10px', borderRadius: '20px', backgroundColor: '#fff8e6', color: C.orIntense }}>
                            Sur commande — disponible sous 10 jours
                          </span>
                        ) : article.quantite <= article.stock ? (
                          <span style={{ fontSize: '11px', fontWeight: '600', padding: '3px 10px', borderRadius: '20px', backgroundColor: C.fondAlt, color: C.vert }}>
                            {article.stock} en stock
                          </span>
                        ) : (
                          <span style={{ fontSize: '11px', fontWeight: '600', padding: '3px 10px', borderRadius: '20px', backgroundColor: '#fff8e6', color: C.orIntense }}>
                            {article.stock} en stock · {article.quantite - article.stock} disponible{article.quantite - article.stock > 1 ? 's' : ''} sous 10 jours
                          </span>
                        )}
                      </div>

                      {/* Contrôle quantité */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          onClick={() => handleQuantite(article.livre_id, article.quantite - 1)}
                          style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #ddd', backgroundColor: 'white', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.texteSecondaire }}
                        >
                          −
                        </button>
                        <span style={{ width: '32px', textAlign: 'center', fontWeight: '700', fontSize: '16px', color: C.texte }}>
                          {article.quantite}
                        </span>
                        <button
                          onClick={() => handleQuantite(article.livre_id, article.quantite + 1)}
                          style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #ddd', backgroundColor: 'white', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.texteSecondaire }}
                        >
                          +
                        </button>
                      </div>

                      {/* Prix */}
                      <div style={{ textAlign: 'right', minWidth: '80px' }}>
                        <p style={{ fontSize: '18px', fontWeight: '700', color: C.vert, margin: '0 0 2px' }}>
                          {(article.prix * article.quantite).toFixed(2)} €
                        </p>
                        {article.quantite > 1 && (
                          <p style={{ fontSize: '12px', color: '#bbb', margin: 0 }}>{article.prix} € × {article.quantite}</p>
                        )}
                      </div>

                      {/* Supprimer */}
                      <button
                        onClick={() => handleRetirer(article.livre_id)}
                        title="Retirer du panier"
                        style={{ padding: '6px 10px', backgroundColor: '#fff0f0', border: 'none', borderRadius: '8px', color: '#c0392b', cursor: 'pointer', fontSize: '16px' }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                {/* Récapitulatif total */}
                <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #eee' }}>
                    <span style={{ fontSize: '14px', color: C.texteSecondaire }}>
                      {panier.reduce((acc, a) => acc + a.quantite, 0)} exemplaire{panier.reduce((acc, a) => acc + a.quantite, 0) > 1 ? 's' : ''}
                    </span>
                    <span style={{ fontSize: '14px', color: C.texteSecondaire }}>{total.toFixed(2)} €</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '16px', fontWeight: '700', color: C.texte }}>Total</span>
                    <span style={{ fontSize: '24px', fontWeight: '700', color: C.vert }}>{total.toFixed(2)} €</span>
                  </div>
                  <p style={{ fontSize: '12px', color: '#bbb', margin: '8px 0 0', textAlign: 'right' }}>Paiement sur place au retrait en boutique</p>
                </div>

                {panier.some(a => a.stock === 0 || a.quantite > a.stock) && (
                  <div style={{ backgroundColor: '#fff8e6', borderRadius: '10px', padding: '14px 18px', marginBottom: '20px' }}>
                    <p style={{ color: C.orIntense, fontSize: '13px', margin: 0, fontWeight: '600' }}>
                      ⚠️ Certains exemplaires ne sont pas disponibles en rayon et seront commandés auprès de notre distributeur. Comptez 10 jours supplémentaires pour ces titres.
                    </p>
                  </div>
                )}

                <button
                  onClick={() => setEtape('coordonnees')}
                  style={{ width: '100%', padding: '16px', backgroundColor: C.vert, color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Georgia, serif' }}
                >
                  Passer la commande →
                </button>

                <a href="/livres" style={{ display: 'block', textAlign: 'center', marginTop: '16px', color: C.texteSecondaire, fontSize: '14px', textDecoration: 'none' }}>
                  ← Continuer mes achats
                </a>
              </>
            )}
          </>
        )}

        {/* ── ÉTAPE 2 : COORDONNÉES ─────────────────────────────────────── */}
        {etape === 'coordonnees' && (
          <>
            <h1 style={{ fontSize: '28px', fontWeight: '700', color: C.texte, margin: '0 0 8px' }}>Vos coordonnées</h1>
            <p style={{ color: C.texteSecondaire, fontSize: '14px', marginBottom: '32px' }}>
              Pour vous prévenir quand votre commande est prête à retirer.
            </p>

            <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 2px 16px rgba(0,0,0,0.06)', marginBottom: '24px' }}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: C.texteSecondaire, marginBottom: '8px', fontWeight: '600' }}>
                  Nom complet *
                </label>
                <input
                  type="text"
                  value={nom}
                  onChange={e => setNom(e.target.value)}
                  placeholder="Jean Dupont"
                  style={inputStyle}
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: C.texteSecondaire, marginBottom: '8px', fontWeight: '600' }}>
                  Email *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  style={inputStyle}
                />
                <p style={{ fontSize: '12px', color: '#bbb', margin: '6px 0 0' }}>
                  Vous recevrez une confirmation et un mail quand votre commande sera prête.
                </p>
              </div>
              <div style={{ marginBottom: '8px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: C.texteSecondaire, marginBottom: '8px', fontWeight: '600' }}>
                  Téléphone <span style={{ fontWeight: '400', color: '#bbb' }}>(optionnel)</span>
                </label>
                <input
                  type="tel"
                  value={telephone}
                  onChange={e => setTelephone(e.target.value)}
                  placeholder="06 XX XX XX XX"
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Récap mini */}
            <div style={{ backgroundColor: C.fondAlt, borderRadius: '12px', padding: '16px 20px', marginBottom: '24px' }}>
              <p style={{ fontSize: '12px', color: C.texteSecondaire, letterSpacing: '1px', margin: '0 0 10px', fontWeight: '600' }}>RÉCAPITULATIF</p>
              {panier.map(a => (
                <div key={a.livre_id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '13px', color: C.texte }}>{a.titre} <span style={{ color: C.texteSecondaire }}>× {a.quantite}</span></span>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: C.vert }}>{(a.prix * a.quantite).toFixed(2)} €</span>
                </div>
              ))}
              <div style={{ borderTop: '1px solid rgba(0,0,0,0.08)', marginTop: '10px', paddingTop: '10px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: '700', fontSize: '14px', color: C.texte }}>Total</span>
                <span style={{ fontWeight: '700', fontSize: '16px', color: C.vert }}>{total.toFixed(2)} €</span>
              </div>
            </div>

            {erreur && (
              <div style={{ backgroundColor: '#fff0f0', border: '1px solid #ffcccc', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', color: '#c0392b', fontSize: '14px' }}>
                {erreur}
              </div>
            )}

            <button
              onClick={handleValider}
              disabled={chargement}
              style={{ width: '100%', padding: '16px', backgroundColor: chargement ? '#aaa' : C.orIntense, color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '700', cursor: chargement ? 'not-allowed' : 'pointer', fontFamily: 'Georgia, serif', marginBottom: '12px' }}
            >
              {chargement ? 'Envoi en cours...' : 'Confirmer la commande — Paiement en boutique'}
            </button>

            <button
              onClick={() => { setEtape('panier'); setErreur('') }}
              style={{ width: '100%', padding: '12px', backgroundColor: 'transparent', color: C.texteSecondaire, border: '1px solid #ddd', borderRadius: '12px', fontSize: '14px', cursor: 'pointer', fontFamily: 'Georgia, serif' }}
            >
              ← Retour au panier
            </button>
          </>
        )}

        {/* ── ÉTAPE 3 : CONFIRMATION ────────────────────────────────────── */}
        {etape === 'confirmation' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>✅</div>
            <h1 style={{ fontSize: '28px', fontWeight: '700', color: C.texte, margin: '0 0 12px' }}>Commande confirmée !</h1>
            <p style={{ color: C.texteSecondaire, fontSize: '15px', marginBottom: '32px', lineHeight: '1.7' }}>
              Un email de confirmation a été envoyé à <strong>{email}</strong>.<br />
              Nous vous préviendrons dès que votre commande sera prête à retirer.
            </p>

            {/* Récap commande */}
            {recap.length > 0 && (
              <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '28px', boxShadow: '0 2px 16px rgba(0,0,0,0.06)', marginBottom: '32px', textAlign: 'left' }}>
                <p style={{ fontSize: '12px', color: C.texteSecondaire, letterSpacing: '1px', margin: '0 0 16px', fontWeight: '600' }}>VOTRE COMMANDE</p>
                {recap.map((l, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: i < recap.length - 1 ? '1px solid #eee' : 'none' }}>
                    <div>
                      <p style={{ fontWeight: '700', fontSize: '15px', color: C.texte, margin: '0 0 2px' }}>{l.titre}</p>
                      <p style={{ fontSize: '13px', color: C.texteSecondaire, margin: '0 0 4px', fontStyle: 'italic' }}>{l.auteur}</p>
                      <span style={{ fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '20px', backgroundColor: l.type === 'stock' ? C.fondAlt : '#fff8e6', color: l.type === 'stock' ? C.vert : C.orIntense }}>
                        {l.type === 'stock' ? 'En stock' : 'Sur commande (3–5 jours)'}
                      </span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontWeight: '700', fontSize: '16px', color: C.vert, margin: '0 0 2px' }}>{l.total} €</p>
                      {l.quantite > 1 && <p style={{ fontSize: '12px', color: '#bbb', margin: 0 }}>× {l.quantite}</p>}
                    </div>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '16px', marginTop: '4px' }}>
                  <span style={{ fontWeight: '700', fontSize: '16px', color: C.texte }}>Total</span>
                  <span style={{ fontWeight: '700', fontSize: '20px', color: C.vert }}>{totalFinal} €</span>
                </div>
              </div>
            )}

            {/* Infos retrait */}
            <div style={{ backgroundColor: C.fondAlt, borderRadius: '12px', padding: '20px 24px', marginBottom: '32px', textAlign: 'left' }}>
              <p style={{ fontWeight: '700', color: C.vert, margin: '0 0 8px', fontSize: '15px' }}>📍 Où retirer votre commande ?</p>
              <p style={{ color: C.texteSecondaire, fontSize: '14px', margin: '0 0 4px' }}>42 rue Laugier, 75017 Paris</p>
              <p style={{ color: C.texteSecondaire, fontSize: '14px', margin: '0 0 4px' }}>Lun–Sam : 10h00 – 20h00</p>
              <p style={{ color: C.texteSecondaire, fontSize: '14px', margin: 0 }}>Paiement sur place (espèces ou carte)</p>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <a href="/livres" style={{ display: 'inline-block', backgroundColor: C.vert, color: 'white', padding: '12px 28px', borderRadius: '40px', textDecoration: 'none', fontWeight: '700', fontSize: '14px' }}>
                Continuer mes achats
              </a>
              <a href="/compte/dashboard" style={{ display: 'inline-block', backgroundColor: 'white', color: C.vert, padding: '12px 28px', borderRadius: '40px', textDecoration: 'none', fontWeight: '700', fontSize: '14px', border: `1px solid ${C.vert}` }}>
                Voir mes commandes
              </a>
            </div>
          </div>
        )}
      </main>

      <footer style={{ backgroundColor: C.footer, padding: '24px', textAlign: 'center' }}>
        <p style={{ color: C.fondAlt, fontSize: '13px', margin: 0 }}>2026 Bookdog — Librairie indépendante Paris 17e</p>
      </footer>
    </div>
  )
}