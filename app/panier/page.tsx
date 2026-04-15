'use client'

import { useState, useEffect } from 'react'
import Header from '../../components/Header'
import {
  getPanier, setQuantite, retirerDuPanier, viderPanier, getTotal,
  type ArticlePanier,
} from '../../lib/panier'

const C = {
  vert: '#1A3C2E', or: '#D4AF37', orIntense: '#B8960C',
  fond: '#F9F6F0', fondAlt: '#EAF2EC', texte: '#1C1C1C',
  texteSecondaire: '#6B6B5E', footer: '#0f2419',
}
const FONT = "'EB Garamond', Georgia, serif"

type Etape = 'panier' | 'coordonnees' | 'confirmation'
type ModeLivraison = 'boutique' | 'entreprise'

type RecapLigne = {
  titre: string; auteur: string; prix: number
  quantite: number; type: string; total: string
}
type ClientInfo = {
  nom: string; prenom: string; email: string
  ce?: { id: number; nom: string; remise: number; adresse_livraison: string | null } | null
}

function labelDelai(delai: number | null | undefined): string {
  if (delai != null && delai > 0) return `sous ${delai} jour${delai > 1 ? 's' : ''}`
  return 'délai sur demande'
}
function labelDelaiConfirmation(delai: number | null | undefined): string {
  if (delai != null && delai > 0) return `Sur commande (${delai} jour${delai > 1 ? 's' : ''})`
  return 'Sur commande (délai sur demande)'
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
  const [clientConnecte, setClientConnecte] = useState(false)
  const [clientInfo, setClientInfo] = useState<ClientInfo | null>(null)
  const [modeLivraison, setModeLivraison] = useState<ModeLivraison>('boutique')

  const syncPanier = () => {
    const p = getPanier()
    setPanier(p)
    setTotal(getTotal())
  }

  useEffect(() => {
    syncPanier()
    const info = localStorage.getItem('clientInfo')
    const token = localStorage.getItem('clientToken')
    if (info && token) {
      const parsed: ClientInfo = JSON.parse(info)
      setClientConnecte(true)
      setClientInfo(parsed)
      setNom(`${parsed.prenom || ''} ${parsed.nom || ''}`.trim())
      setEmail(parsed.email || '')
    }
    const handleChange = () => syncPanier()
    window.addEventListener('bookdog_panier_change', handleChange)
    return () => window.removeEventListener('bookdog_panier_change', handleChange)
  }, [])

  // ── CE : calcul remise ────────────────────────────────────────────────────
  const ce = clientInfo?.ce || null
  const remise = ce ? ce.remise : 0
  const totalApresRemise = remise > 0 ? total * (1 - remise / 100) : total
  const economie = total - totalApresRemise

  // ── Handlers commande ─────────────────────────────────────────────────────
  const buildPayload = () => ({
    nom: nom.trim(),
    email: email.trim(),
    telephone: telephone.trim() || null,
    articles: panier.map(a => ({ livre_id: a.livre_id, quantite: a.quantite })),
    ce_id: ce?.id || null,
    remise: remise || null,
    mode_livraison: modeLivraison,
    adresse_livraison: modeLivraison === 'entreprise' ? ce?.adresse_livraison || null : null,
  })

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
        body: JSON.stringify(buildPayload()),
      })
      const data = await res.json()
      if (!res.ok) { setErreur(data.message || 'Une erreur est survenue.'); return }
      setRecap(data.recap || [])
      setTotalFinal(data.total || '0.00')
      viderPanier(); syncPanier()
      setEtape('confirmation')
    } catch { setErreur('Impossible de contacter le serveur.') }
    finally { setChargement(false) }
  }

  const handleCommanderConnecte = async () => {
    setErreur('')
    setChargement(true)
    try {
      const res = await fetch('http://localhost:3001/commandes/panier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload()),
      })
      const data = await res.json()
      if (!res.ok) { setErreur(data.message || 'Une erreur est survenue.'); setChargement(false); return }
      setRecap(data.recap || [])
      setTotalFinal(data.total || '0.00')
      viderPanier(); syncPanier()
      setEtape('confirmation')
    } catch { setErreur('Impossible de contacter le serveur.') }
    finally { setChargement(false) }
  }

  const articlesEnReappro = panier.filter(a => a.stock === 0 || a.quantite > a.stock)

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 16px', borderRadius: '8px',
    border: '1px solid #ddd', fontSize: '15px',
    boxSizing: 'border-box', fontFamily: FONT,
  }

  return (
    <div style={{ backgroundColor: C.fond, minHeight: '100vh', fontFamily: FONT }}>
      <Header pageCourante="panier" />

      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '48px 24px 80px', boxSizing: 'border-box' }}>

        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '40px' }}>
          {(['panier', 'coordonnees', 'confirmation'] as Etape[]).map((e, i) => {
            const labels: Record<Etape, string> = { panier: 'Panier', coordonnees: 'Coordonnées', confirmation: 'Confirmation' }
            const actif = etape === e
            const passe = ['panier', 'coordonnees', 'confirmation'].indexOf(etape) > i
            if (e === 'coordonnees' && clientConnecte) return null
            return (
              <div key={e} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700', backgroundColor: passe ? C.vert : actif ? C.orIntense : '#ddd', color: passe || actif ? 'white' : C.texteSecondaire }}>
                  {passe ? '✓' : i + 1}
                </span>
                <span style={{ fontSize: '14px', fontWeight: actif ? '700' : '400', color: actif ? C.texte : C.texteSecondaire, fontFamily: FONT }}>{labels[e]}</span>
                {i < 2 && !clientConnecte && <span style={{ color: '#ddd', fontSize: '18px' }}>›</span>}
                {i === 0 && clientConnecte && <span style={{ color: '#ddd', fontSize: '18px' }}>›</span>}
              </div>
            )
          })}
        </div>

        {/* ── ÉTAPE 1 : PANIER ─────────────────────────────────────────── */}
        {etape === 'panier' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '24px' }}>
              <h1 style={{ fontSize: '28px', fontWeight: '700', color: C.texte, margin: 0, fontFamily: FONT }}>
                Mon panier
                {panier.length > 0 && <span style={{ fontSize: '16px', color: C.texteSecondaire, fontWeight: '400', marginLeft: '12px' }}>{panier.length} titre{panier.length > 1 ? 's' : ''}</span>}
              </h1>
              {panier.length > 0 && (
                <button onClick={() => { if (confirm('Vider le panier ?')) { viderPanier(); syncPanier() } }} style={{ background: 'none', border: 'none', color: '#c0392b', fontSize: '13px', cursor: 'pointer', fontFamily: FONT, textDecoration: 'underline' }}>
                  Vider le panier
                </button>
              )}
            </div>

            {/* Badge CE */}
            {ce && (
              <div style={{ backgroundColor: C.vert, borderRadius: '10px', padding: '12px 18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '20px' }}>🏢</span>
                <div>
                  <p style={{ color: C.or, fontSize: '11px', letterSpacing: '1.5px', fontWeight: '600', margin: '0 0 2px', fontFamily: FONT }}>AVANTAGE CE — {ce.nom.toUpperCase()}</p>
                  <p style={{ color: 'white', fontSize: '14px', margin: 0, fontFamily: FONT }}>Remise de {ce.remise}% appliquée sur tous les livres</p>
                </div>
              </div>
            )}

            {panier.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 0' }}>
                <p style={{ fontSize: '48px', marginBottom: '16px' }}>🛒</p>
                <p style={{ fontSize: '18px', color: C.texteSecondaire, marginBottom: '8px', fontFamily: FONT }}>Votre panier est vide</p>
                <p style={{ fontSize: '14px', color: '#bbb', marginBottom: '32px', fontFamily: FONT }}>Parcourez notre catalogue pour trouver votre prochain livre</p>
                <a href="/livres" style={{ display: 'inline-block', backgroundColor: C.vert, color: 'white', padding: '12px 28px', borderRadius: '40px', textDecoration: 'none', fontWeight: '700', fontSize: '14px', fontFamily: FONT }}>
                  Découvrir le catalogue
                </a>
              </div>
            ) : (
              <>
                {/* Articles */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
                  {panier.map(article => {
                    const prixAffiche = ce ? article.prix * (1 - remise / 100) : article.prix
                    const totalArticle = prixAffiche * article.quantite
                    return (
                      <div key={article.livre_id} style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '20px', borderLeft: `4px solid ${C.vert}` }}>
                        <div style={{ flex: 1 }}>
                          <a href={`/livres/${article.livre_id}`} style={{ textDecoration: 'none' }}>
                            <p style={{ fontWeight: '700', fontSize: '16px', color: C.texte, margin: '0 0 4px', fontFamily: FONT }}>{article.titre}</p>
                          </a>
                          <p style={{ fontSize: '13px', color: C.texteSecondaire, margin: '0 0 8px', fontStyle: 'italic', fontFamily: FONT }}>{article.auteur}</p>
                          {article.stock === 0 ? (
                            <span style={{ fontSize: '11px', fontWeight: '600', padding: '3px 10px', borderRadius: '20px', backgroundColor: '#fff8e6', color: C.orIntense, fontFamily: FONT }}>
                              Sur commande — disponible {labelDelai(article.delai_reappro)}
                            </span>
                          ) : article.quantite <= article.stock ? (
                            <span style={{ fontSize: '11px', fontWeight: '600', padding: '3px 10px', borderRadius: '20px', backgroundColor: C.fondAlt, color: C.vert, fontFamily: FONT }}>
                              {article.stock} en stock
                            </span>
                          ) : (
                            <span style={{ fontSize: '11px', fontWeight: '600', padding: '3px 10px', borderRadius: '20px', backgroundColor: '#fff8e6', color: C.orIntense, fontFamily: FONT }}>
                              {article.stock} en stock · {article.quantite - article.stock} {labelDelai(article.delai_reappro)}
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button onClick={() => { setQuantite(article.livre_id, article.quantite - 1); syncPanier() }} style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #ddd', backgroundColor: 'white', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.texteSecondaire }}>−</button>
                          <span style={{ width: '32px', textAlign: 'center', fontWeight: '700', fontSize: '16px', color: C.texte, fontFamily: FONT }}>{article.quantite}</span>
                          <button onClick={() => { setQuantite(article.livre_id, article.quantite + 1); syncPanier() }} style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #ddd', backgroundColor: 'white', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.texteSecondaire }}>+</button>
                        </div>
                        <div style={{ textAlign: 'right', minWidth: '90px' }}>
                          <p style={{ fontSize: '18px', fontWeight: '700', color: C.vert, margin: '0 0 2px', fontFamily: FONT }}>{totalArticle.toFixed(2)} €</p>
                          {ce && <p style={{ fontSize: '11px', color: '#bbb', margin: '0 0 1px', textDecoration: 'line-through', fontFamily: FONT }}>{(article.prix * article.quantite).toFixed(2)} €</p>}
                          {article.quantite > 1 && <p style={{ fontSize: '11px', color: '#bbb', margin: 0, fontFamily: FONT }}>{prixAffiche.toFixed(2)} € × {article.quantite}</p>}
                        </div>
                        <button onClick={() => { retirerDuPanier(article.livre_id); syncPanier() }} style={{ padding: '6px 10px', backgroundColor: '#fff0f0', border: 'none', borderRadius: '8px', color: '#c0392b', cursor: 'pointer', fontSize: '16px' }}>✕</button>
                      </div>
                    )
                  })}
                </div>

                {/* Total */}
                <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #eee' }}>
                    <span style={{ fontSize: '14px', color: C.texteSecondaire, fontFamily: FONT }}>{panier.reduce((acc, a) => acc + a.quantite, 0)} exemplaire{panier.reduce((acc, a) => acc + a.quantite, 0) > 1 ? 's' : ''}</span>
                    <span style={{ fontSize: '14px', color: ce ? '#bbb' : C.texteSecondaire, textDecoration: ce ? 'line-through' : 'none', fontFamily: FONT }}>{total.toFixed(2)} €</span>
                  </div>
                  {ce && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ fontSize: '14px', color: C.vert, fontWeight: '600', fontFamily: FONT }}>Remise CE {ce.nom} ({ce.remise}%)</span>
                      <span style={{ fontSize: '14px', color: C.vert, fontWeight: '600', fontFamily: FONT }}>−{economie.toFixed(2)} €</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '16px', fontWeight: '700', color: C.texte, fontFamily: FONT }}>Total</span>
                    <span style={{ fontSize: '24px', fontWeight: '700', color: C.vert, fontFamily: FONT }}>{totalApresRemise.toFixed(2)} €</span>
                  </div>
                  <p style={{ fontSize: '12px', color: '#bbb', margin: '8px 0 0', textAlign: 'right', fontFamily: FONT }}>Paiement sur place au retrait</p>
                </div>

                {/* Bandeau réappro */}
                {articlesEnReappro.length > 0 && (
                  <div style={{ backgroundColor: '#fff8e6', borderRadius: '10px', padding: '14px 18px', marginBottom: '20px' }}>
                    <p style={{ color: C.orIntense, fontSize: '13px', margin: 0, fontWeight: '600', fontFamily: FONT }}>
                      ⚠️ Certains exemplaires seront commandés auprès de notre distributeur.{' '}
                      {articlesEnReappro.every(a => a.delai_reappro != null)
                        ? `Comptez ${Math.max(...articlesEnReappro.map(a => a.delai_reappro as number))} jours supplémentaires.`
                        : 'Délai sur demande en boutique.'}
                    </p>
                  </div>
                )}

                {/* Choix livraison CE */}
                {ce && clientConnecte && (
                  <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginBottom: '20px' }}>
                    <p style={{ fontSize: '13px', color: C.texteSecondaire, letterSpacing: '1px', fontWeight: '600', margin: '0 0 14px', fontFamily: FONT }}>MODE DE RETRAIT</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer', padding: '12px', borderRadius: '8px', border: `2px solid ${modeLivraison === 'boutique' ? C.vert : '#eee'}`, backgroundColor: modeLivraison === 'boutique' ? C.fondAlt : 'white' }}>
                        <input type="radio" name="livraison" value="boutique" checked={modeLivraison === 'boutique'} onChange={() => setModeLivraison('boutique')} style={{ accentColor: C.vert, marginTop: '2px', flexShrink: 0 }} />
                        <div>
                          <p style={{ fontSize: '14px', fontWeight: '700', color: C.texte, margin: '0 0 2px', fontFamily: FONT }}>🏪 Retrait en boutique</p>
                          <p style={{ fontSize: '13px', color: C.texteSecondaire, margin: 0, fontFamily: FONT }}>42 rue Laugier, Paris 17e — Lun–Sam 10h–20h</p>
                        </div>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: ce.adresse_livraison ? 'pointer' : 'not-allowed', padding: '12px', borderRadius: '8px', border: `2px solid ${modeLivraison === 'entreprise' ? C.vert : '#eee'}`, backgroundColor: modeLivraison === 'entreprise' ? C.fondAlt : 'white', opacity: ce.adresse_livraison ? 1 : 0.5 }}>
                        <input type="radio" name="livraison" value="entreprise" checked={modeLivraison === 'entreprise'} onChange={() => ce.adresse_livraison && setModeLivraison('entreprise')} disabled={!ce.adresse_livraison} style={{ accentColor: C.vert, marginTop: '2px', flexShrink: 0 }} />
                        <div>
                          <p style={{ fontSize: '14px', fontWeight: '700', color: C.texte, margin: '0 0 2px', fontFamily: FONT }}>🏢 Livraison à votre entreprise</p>
                          <p style={{ fontSize: '13px', color: C.texteSecondaire, margin: 0, fontFamily: FONT }}>
                            {ce.adresse_livraison || 'Adresse non configurée — contactez-nous'}
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>
                )}

                {/* Client connecté */}
                {clientConnecte && clientInfo ? (
                  <div>
                    <div style={{ backgroundColor: C.fondAlt, borderRadius: '12px', padding: '20px 24px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ fontSize: '12px', color: C.texteSecondaire, letterSpacing: '1px', margin: '0 0 6px', fontWeight: '600', fontFamily: FONT }}>RÉSERVATION AU NOM DE</p>
                        <p style={{ fontSize: '16px', fontWeight: '700', color: C.texte, margin: '0 0 2px', fontFamily: FONT }}>{clientInfo.prenom} {clientInfo.nom}</p>
                        <p style={{ fontSize: '14px', color: C.texteSecondaire, margin: 0, fontFamily: FONT }}>{clientInfo.email}</p>
                      </div>
                      <a href="/compte/dashboard" style={{ fontSize: '13px', color: C.texteSecondaire, textDecoration: 'underline', fontFamily: FONT }}>Modifier</a>
                    </div>
                    {erreur && <div style={{ backgroundColor: '#fff0f0', border: '1px solid #ffcccc', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', color: '#c0392b', fontSize: '14px', fontFamily: FONT }}>{erreur}</div>}
                    <button onClick={handleCommanderConnecte} disabled={chargement}
                      style={{ width: '100%', padding: '16px', backgroundColor: chargement ? '#aaa' : C.orIntense, color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '700', cursor: chargement ? 'not-allowed' : 'pointer', fontFamily: FONT, marginBottom: '12px' }}>
                      {chargement ? 'Envoi en cours...' : 'Confirmer la réservation — Paiement en boutique'}
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setEtape('coordonnees')}
                    style={{ width: '100%', padding: '16px', backgroundColor: C.vert, color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '700', cursor: 'pointer', fontFamily: FONT }}>
                    Réserver →
                  </button>
                )}

                <a href="/livres" style={{ display: 'block', textAlign: 'center', marginTop: '16px', color: C.texteSecondaire, fontSize: '14px', textDecoration: 'none', fontFamily: FONT }}>← Continuer mes achats</a>
              </>
            )}
          </>
        )}

        {/* ── ÉTAPE 2 : COORDONNÉES ────────────────────────────────────── */}
        {etape === 'coordonnees' && (
          <>
            <h1 style={{ fontSize: '28px', fontWeight: '700', color: C.texte, margin: '0 0 8px', fontFamily: FONT }}>Vos coordonnées</h1>
            <p style={{ color: C.texteSecondaire, fontSize: '14px', marginBottom: '32px', fontFamily: FONT }}>Pour vous prévenir quand votre réservation est prête à retirer.</p>

            <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 2px 16px rgba(0,0,0,0.06)', marginBottom: '24px' }}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: C.texteSecondaire, marginBottom: '8px', fontWeight: '600', fontFamily: FONT }}>Nom complet *</label>
                <input type="text" value={nom} onChange={e => setNom(e.target.value)} placeholder="Jean Dupont" style={inputStyle} />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: C.texteSecondaire, marginBottom: '8px', fontWeight: '600', fontFamily: FONT }}>Email *</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="votre@email.com" style={inputStyle} />
                <p style={{ fontSize: '12px', color: '#bbb', margin: '6px 0 0', fontFamily: FONT }}>Vous recevrez un email quand votre réservation sera prête.</p>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: C.texteSecondaire, marginBottom: '8px', fontWeight: '600', fontFamily: FONT }}>Téléphone <span style={{ fontWeight: '400', color: '#bbb' }}>(optionnel)</span></label>
                <input type="tel" value={telephone} onChange={e => setTelephone(e.target.value)} placeholder="06 XX XX XX XX" style={inputStyle} />
              </div>
            </div>

            {/* Récap mini */}
            <div style={{ backgroundColor: C.fondAlt, borderRadius: '12px', padding: '16px 20px', marginBottom: '24px' }}>
              <p style={{ fontSize: '12px', color: C.texteSecondaire, letterSpacing: '1px', margin: '0 0 10px', fontWeight: '600', fontFamily: FONT }}>RÉCAPITULATIF</p>
              {panier.map(a => (
                <div key={a.livre_id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '13px', color: C.texte, fontFamily: FONT }}>{a.titre} <span style={{ color: C.texteSecondaire }}>× {a.quantite}</span></span>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: C.vert, fontFamily: FONT }}>{(a.prix * a.quantite).toFixed(2)} €</span>
                </div>
              ))}
              <div style={{ borderTop: '1px solid rgba(0,0,0,0.08)', marginTop: '10px', paddingTop: '10px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: '700', fontSize: '14px', color: C.texte, fontFamily: FONT }}>Total</span>
                <span style={{ fontWeight: '700', fontSize: '16px', color: C.vert, fontFamily: FONT }}>{totalApresRemise.toFixed(2)} €</span>
              </div>
            </div>

            {erreur && <div style={{ backgroundColor: '#fff0f0', border: '1px solid #ffcccc', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', color: '#c0392b', fontSize: '14px', fontFamily: FONT }}>{erreur}</div>}

            <button onClick={handleValider} disabled={chargement}
              style={{ width: '100%', padding: '16px', backgroundColor: chargement ? '#aaa' : C.orIntense, color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '700', cursor: chargement ? 'not-allowed' : 'pointer', fontFamily: FONT, marginBottom: '12px' }}>
              {chargement ? 'Envoi en cours...' : 'Confirmer la réservation — Paiement en boutique'}
            </button>
            <button onClick={() => { setEtape('panier'); setErreur('') }}
              style={{ width: '100%', padding: '12px', backgroundColor: 'transparent', color: C.texteSecondaire, border: '1px solid #ddd', borderRadius: '12px', fontSize: '14px', cursor: 'pointer', fontFamily: FONT }}>
              ← Retour au panier
            </button>
          </>
        )}

        {/* ── ÉTAPE 3 : CONFIRMATION ────────────────────────────────────── */}
        {etape === 'confirmation' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>✅</div>
            <h1 style={{ fontSize: '28px', fontWeight: '700', color: C.texte, margin: '0 0 12px', fontFamily: FONT }}>Réservation confirmée !</h1>
            <p style={{ color: C.texteSecondaire, fontSize: '15px', marginBottom: '32px', lineHeight: '1.7', fontFamily: FONT }}>
              Un email de confirmation a été envoyé à <strong>{email}</strong>.<br />
              Nous vous préviendrons dès que votre réservation sera prête.
            </p>

            {recap.length > 0 && (
              <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '28px', boxShadow: '0 2px 16px rgba(0,0,0,0.06)', marginBottom: '32px', textAlign: 'left' }}>
                <p style={{ fontSize: '12px', color: C.texteSecondaire, letterSpacing: '1px', margin: '0 0 16px', fontWeight: '600', fontFamily: FONT }}>VOTRE RÉSERVATION</p>
                {recap.map((l, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: i < recap.length - 1 ? '1px solid #eee' : 'none' }}>
                    <div>
                      <p style={{ fontWeight: '700', fontSize: '15px', color: C.texte, margin: '0 0 2px', fontFamily: FONT }}>{l.titre}</p>
                      <p style={{ fontSize: '13px', color: C.texteSecondaire, margin: '0 0 4px', fontStyle: 'italic', fontFamily: FONT }}>{l.auteur}</p>
                      <span style={{ fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '20px', backgroundColor: l.type === 'stock' ? C.fondAlt : '#fff8e6', color: l.type === 'stock' ? C.vert : C.orIntense, fontFamily: FONT }}>
                        {l.type === 'stock' ? 'En stock' : labelDelaiConfirmation(null)}
                      </span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontWeight: '700', fontSize: '16px', color: C.vert, margin: '0 0 2px', fontFamily: FONT }}>{l.total} €</p>
                      {l.quantite > 1 && <p style={{ fontSize: '12px', color: '#bbb', margin: 0, fontFamily: FONT }}>× {l.quantite}</p>}
                    </div>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '16px', marginTop: '4px' }}>
                  <span style={{ fontWeight: '700', fontSize: '16px', color: C.texte, fontFamily: FONT }}>Total</span>
                  <span style={{ fontWeight: '700', fontSize: '20px', color: C.vert, fontFamily: FONT }}>{totalFinal} €</span>
                </div>
              </div>
            )}

            <div style={{ backgroundColor: C.fondAlt, borderRadius: '12px', padding: '20px 24px', marginBottom: '32px', textAlign: 'left' }}>
              <p style={{ fontWeight: '700', color: C.vert, margin: '0 0 8px', fontSize: '15px', fontFamily: FONT }}>
                {modeLivraison === 'entreprise' ? '🏢 Livraison à votre entreprise' : '📍 Où retirer votre réservation ?'}
              </p>
              {modeLivraison === 'entreprise' && ce?.adresse_livraison ? (
                <p style={{ color: C.texteSecondaire, fontSize: '14px', margin: '0 0 4px', fontFamily: FONT }}>{ce.adresse_livraison}</p>
              ) : (
                <>
                  <p style={{ color: C.texteSecondaire, fontSize: '14px', margin: '0 0 4px', fontFamily: FONT }}>42 rue Laugier, 75017 Paris</p>
                  <p style={{ color: C.texteSecondaire, fontSize: '14px', margin: '0 0 4px', fontFamily: FONT }}>Lun–Sam : 10h00 – 20h00</p>
                  <p style={{ color: C.texteSecondaire, fontSize: '14px', margin: 0, fontFamily: FONT }}>Paiement sur place (espèces ou carte)</p>
                </>
              )}
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <a href="/livres" style={{ display: 'inline-block', backgroundColor: C.vert, color: 'white', padding: '12px 28px', borderRadius: '40px', textDecoration: 'none', fontWeight: '700', fontSize: '14px', fontFamily: FONT }}>
                Continuer mes achats
              </a>
              <a href="/compte/dashboard" style={{ display: 'inline-block', backgroundColor: 'white', color: C.vert, padding: '12px 28px', borderRadius: '40px', textDecoration: 'none', fontWeight: '700', fontSize: '14px', border: `1px solid ${C.vert}`, fontFamily: FONT }}>
                Voir mes réservations
              </a>
            </div>
          </div>
        )}
      </main>

      <footer style={{ backgroundColor: C.footer, padding: '24px', textAlign: 'center' }}>
        <p style={{ color: C.fondAlt, fontSize: '13px', margin: 0, fontFamily: FONT }}>2026 Bookdog — Librairie indépendante Paris 17e</p>
      </footer>
    </div>
  )
}