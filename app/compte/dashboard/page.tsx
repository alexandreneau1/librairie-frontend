'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from '../../../components/Header'

const C = {
  vert: '#1A3C2E', or: '#D4AF37', orIntense: '#B8960C',
  fond: '#F9F6F0', fondAlt: '#EAF2EC', texte: '#1C1C1C',
  texteSecondaire: '#6B6B5E', footer: '#0f2419',
}
const FONT = "'EB Garamond', Georgia, serif"

type Commande = { id: number; titre: string; auteur: string; prix: number; type: string; statut: string; date_commande: string }
type Reservation = { id: number; titre: string; auteur: string; prix: number; statut: string; date_reservation: string }
type Vente = { id: number; titre: string; auteur: string; quantite: number; prix_unitaire: number; date_vente: string }
type WishlistItem = { id: number; livre_id: number; titre: string; auteur: string; prix: number; stock: number; date_ajout: string }
type Recommandation = { livre_id: number; titre: string; auteur: string; genre: string; prix: number; raison: string }
type CE = { id: number; nom: string; code: string; remise: number; adresse_livraison: string | null }
type ClientInfo = { nom: string; prenom: string; email: string; ce?: CE | null }

export default function Dashboard() {
  const router = useRouter()
  const [onglet, setOnglet] = useState<'commandes' | 'reservations' | 'achats' | 'wishlist'>('commandes')
  const [client, setClient] = useState<ClientInfo | null>(null)
  const [commandes, setCommandes] = useState<Commande[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [ventes, setVentes] = useState<Vente[]>([])
  const [wishlist, setWishlist] = useState<WishlistItem[]>([])
  const [chargement, setChargement] = useState(true)
  const [recommandations, setRecommandations] = useState<Recommandation[]>([])
  const [chargementReco, setChargementReco] = useState(false)
  const [recoChargees, setRecoChargees] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('clientToken')
    const info = localStorage.getItem('clientInfo')
    if (!token || !info) { router.push('/compte/connexion'); return }
    const parsed: ClientInfo = JSON.parse(info)
    setClient(parsed)

    fetch('http://localhost:3001/compte/historique', { headers: { 'Authorization': 'Bearer ' + token } })
      .then(res => res.json())
      .then(data => {
        setCommandes(data.commandes || [])
        setReservations(data.reservations || [])
        setVentes(data.ventes || [])
      })
    fetch('http://localhost:3001/compte/wishlist', { headers: { 'Authorization': 'Bearer ' + token } })
      .then(res => res.json())
      .then(data => setWishlist(data || []))
      .finally(() => setChargement(false))
  }, [router])

  async function chargerRecommandations() {
    const token = localStorage.getItem('clientToken')
    if (!token) return
    setChargementReco(true)
    try {
      const res = await fetch('http://localhost:3001/api/recommandations', { headers: { 'Authorization': 'Bearer ' + token } })
      const data = await res.json()
      if (data.recommandations) setRecommandations(data.recommandations)
    } catch {}
    setChargementReco(false)
    setRecoChargees(true)
  }

  async function retirerWishlist(livre_id: number) {
    const token = localStorage.getItem('clientToken')
    await fetch('http://localhost:3001/compte/wishlist/' + livre_id, { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + token } })
    setWishlist(wishlist.filter(w => w.livre_id !== livre_id))
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
  }

  function badgeStatut(statut: string) {
    const couleurs: Record<string, { bg: string; color: string }> = {
      'en attente': { bg: '#fff8e6', color: C.orIntense },
      'validee':    { bg: C.fondAlt, color: C.vert },
      'annulee':    { bg: '#fff0f0', color: '#c0392b' },
      'pret':       { bg: '#e3f2fd', color: '#1565c0' },
      'recupere':   { bg: C.fondAlt, color: C.vert },
    }
    const style = couleurs[statut] || { bg: '#f5f5f5', color: C.texteSecondaire }
    return (
      <span style={{ backgroundColor: style.bg, color: style.color, padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', fontFamily: FONT }}>
        {statut}
      </span>
    )
  }

  const ce = client?.ce || null

  const onglets = ce
    ? [
        { id: 'commandes',    label: 'Mes commandes',     count: commandes.length + reservations.length },
        { id: 'achats',       label: 'Achats en magasin', count: ventes.length },
        { id: 'wishlist',     label: 'Wishlist',          count: wishlist.length },
      ]
    : [
        { id: 'commandes',    label: 'Click & Collect',  count: commandes.length },
        { id: 'reservations', label: 'Réservations',      count: reservations.length },
        { id: 'achats',       label: 'Achats en magasin', count: ventes.length },
        { id: 'wishlist',     label: 'Wishlist',          count: wishlist.length },
      ]


  const carteStyle = {
    backgroundColor: 'white', borderRadius: '12px', padding: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex',
    justifyContent: 'space-between', alignItems: 'center',
    flexWrap: 'wrap' as const, gap: '12px',
    borderLeft: `4px solid ${C.vert}`,
  }

  if (chargement) return (
    <div style={{ backgroundColor: C.fond, minHeight: '100vh', fontFamily: FONT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: C.texteSecondaire }}>Chargement...</p>
    </div>
  )

  return (
    <div style={{ backgroundColor: C.fond, minHeight: '100vh', fontFamily: FONT }}>

      {/* Header partagé — accès catalogue, accueil, événements */}
      <Header pageCourante="" />

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '48px 24px 80px', boxSizing: 'border-box' }}>

        {/* ── En-tête compte ──────────────────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <p style={{ color: C.texteSecondaire, fontSize: '13px', letterSpacing: '2px', margin: '0 0 6px', fontFamily: FONT }}>Espace client</p>
            <h1 style={{ fontSize: '32px', fontWeight: '700', color: C.texte, margin: 0, fontFamily: FONT }}>
              Bonjour, {client?.prenom}
            </h1>
            <p style={{ fontSize: '15px', color: C.texteSecondaire, margin: '6px 0 8px', fontFamily: FONT }}>{client?.email}</p>
            <button onClick={() => { localStorage.removeItem('clientToken'); localStorage.removeItem('clientInfo'); window.location.href = '/' }} style={{ backgroundColor: 'transparent', border: `1px solid ${C.texteSecondaire}`, color: C.texteSecondaire, fontSize: '13px', cursor: 'pointer', fontFamily: FONT, padding: '6px 16px', borderRadius: '40px' }}>Déconnexion</button>
          </div>

          {/* Badge CE */}
          {ce && (
            <div style={{ backgroundColor: C.vert, borderRadius: '14px', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ fontSize: '28px' }}>🏢</span>
              <div>
                <p style={{ color: C.or, fontSize: '11px', letterSpacing: '1.5px', fontWeight: '700', margin: '0 0 4px', fontFamily: FONT }}>AVANTAGE CE</p>
                <p style={{ color: 'white', fontSize: '16px', fontWeight: '700', margin: '0 0 2px', fontFamily: FONT }}>{ce.nom}</p>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', margin: 0, fontFamily: FONT }}>
                  Remise de <strong style={{ color: C.or }}>{ce.remise}%</strong> sur tout le catalogue
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Recommandations IA ──────────────────────────────────────── */}
        <div style={{ backgroundColor: C.vert, borderRadius: '16px', padding: '28px 32px', marginBottom: '40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: recoChargees && recommandations.length > 0 ? '24px' : '0', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <p style={{ color: C.or, fontSize: '11px', letterSpacing: '2px', fontWeight: '600', margin: '0 0 4px', fontFamily: FONT }}>INTELLIGENCE ARTIFICIELLE</p>
              <h3 style={{ color: 'white', fontSize: '20px', fontWeight: '700', margin: 0, fontFamily: FONT }}>Nos suggestions pour vous</h3>
            </div>
            {!recoChargees ? (
              <button onClick={chargerRecommandations} disabled={chargementReco}
                style={{ backgroundColor: chargementReco ? 'rgba(255,255,255,0.1)' : C.or, color: chargementReco ? 'rgba(255,255,255,0.5)' : C.vert, border: 'none', borderRadius: '40px', padding: '10px 24px', fontSize: '14px', fontWeight: '700', cursor: chargementReco ? 'not-allowed' : 'pointer', fontFamily: FONT, whiteSpace: 'nowrap' as const }}>
                {chargementReco ? '✨ Analyse en cours...' : '✨ Obtenir mes recommandations'}
              </button>
            ) : (
              <button onClick={chargerRecommandations} disabled={chargementReco}
                style={{ backgroundColor: 'transparent', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '40px', padding: '8px 16px', fontSize: '12px', cursor: chargementReco ? 'not-allowed' : 'pointer', fontFamily: FONT }}>
                {chargementReco ? '...' : '↺ Actualiser'}
              </button>
            )}
          </div>

          {chargementReco && !recoChargees && (
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', margin: '16px 0 0', fontFamily: FONT }}>
              Notre libraire IA analyse vos lectures...
            </p>
          )}
          {recoChargees && recommandations.length === 0 && (
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', marginTop: '16px', fontFamily: FONT }}>Aucune recommandation disponible pour le moment.</p>
          )}
          {recoChargees && recommandations.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
              {recommandations.map((r, i) => (
                <a key={i} href={`/livres/${r.livre_id}`} style={{ textDecoration: 'none' }}>
                  <div style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '12px', padding: '20px', border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.14)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <span style={{ backgroundColor: C.or, color: C.vert, fontSize: '10px', fontWeight: '700', padding: '3px 8px', borderRadius: '20px', fontFamily: FONT }}>#{i + 1}</span>
                      <span style={{ color: C.or, fontSize: '15px', fontWeight: '700', fontFamily: FONT }}>{Number(r.prix).toFixed(2)} €</span>
                    </div>
                    <p style={{ color: 'white', fontSize: '15px', fontWeight: '700', margin: '0 0 4px', lineHeight: '1.3', fontFamily: FONT }}>{r.titre}</p>
                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', margin: '0 0 10px', fontStyle: 'italic', fontFamily: FONT }}>{r.auteur}</p>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', margin: 0, lineHeight: '1.5', fontStyle: 'italic', fontFamily: FONT }}>{r.raison}</p>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* ── Onglets ─────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', flexWrap: 'wrap' }}>
          {onglets.map(o => (
            <button key={o.id} onClick={() => setOnglet(o.id as typeof onglet)}
              style={{ padding: '10px 22px', borderRadius: '40px', border: 'none', cursor: 'pointer', fontSize: '15px', fontFamily: FONT, fontWeight: onglet === o.id ? '700' : '400', backgroundColor: onglet === o.id ? C.vert : 'white', color: onglet === o.id ? 'white' : C.texteSecondaire, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', transition: 'all 0.15s' }}>
              {o.label}
              {o.count > 0 && (
                <span style={{ marginLeft: '8px', backgroundColor: onglet === o.id ? 'rgba(255,255,255,0.25)' : C.fondAlt, color: onglet === o.id ? 'white' : C.vert, padding: '2px 8px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
                  {o.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Commandes (fusionnées pour CE, séparées sinon) ─────────── */}
        {onglet === 'commandes' && !ce && (
          <div>
            {commandes.length === 0
              ? <EmptyState emoji="📦" texte="Aucune commande Click & Collect" />
              : <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {commandes.map(c => (
                    <div key={c.id} style={carteStyle}>
                      <div>
                        <p style={{ fontWeight: '700', fontSize: '16px', margin: '0 0 4px', color: C.texte, fontFamily: FONT }}>{c.titre}</p>
                        <p style={{ fontSize: '14px', color: C.texteSecondaire, margin: '0 0 6px', fontStyle: 'italic', fontFamily: FONT }}>{c.auteur}</p>
                        <p style={{ fontSize: '12px', color: '#bbb', margin: 0, fontFamily: FONT }}>{formatDate(c.date_commande)}</p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <span style={{ fontSize: '18px', fontWeight: '700', color: C.vert, fontFamily: FONT }}>{c.prix} €</span>
                        {badgeStatut(c.statut)}
                      </div>
                    </div>
                  ))}
                </div>}
          </div>
        )}

        {/* ── Réservations (clients sans CE seulement) ────────────────── */}
        {onglet === 'reservations' && !ce && (
          <div>
            {reservations.length === 0
              ? <EmptyState emoji="📚" texte="Aucune réservation" />
              : <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {reservations.map(r => (
                    <div key={r.id} style={carteStyle}>
                      <div>
                        <p style={{ fontWeight: '700', fontSize: '16px', margin: '0 0 4px', color: C.texte, fontFamily: FONT }}>{r.titre}</p>
                        <p style={{ fontSize: '14px', color: C.texteSecondaire, margin: '0 0 6px', fontStyle: 'italic', fontFamily: FONT }}>{r.auteur}</p>
                        <p style={{ fontSize: '12px', color: '#bbb', margin: 0, fontFamily: FONT }}>{formatDate(r.date_reservation)}</p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <span style={{ fontSize: '18px', fontWeight: '700', color: C.vert, fontFamily: FONT }}>{r.prix} €</span>
                        {badgeStatut(r.statut)}
                      </div>
                    </div>
                  ))}
                </div>}
          </div>
        )}

        {/* ── Mes commandes (clients CE — fusionné) ───────────────────── */}
        {onglet === 'commandes' && ce && (
          <div>
            {commandes.length === 0 && reservations.length === 0
              ? <EmptyState emoji="📦" texte="Aucune commande pour le moment" />
              : <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* Réservations */}
                  {reservations.map(r => (
                    <div key={'r-' + r.id} style={carteStyle}>
                      <div>
                        <p style={{ fontWeight: '700', fontSize: '16px', margin: '0 0 4px', color: C.texte, fontFamily: FONT }}>{r.titre}</p>
                        <p style={{ fontSize: '14px', color: C.texteSecondaire, margin: '0 0 6px', fontStyle: 'italic', fontFamily: FONT }}>{r.auteur}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <p style={{ fontSize: '12px', color: '#bbb', margin: 0, fontFamily: FONT }}>{formatDate(r.date_reservation)}</p>
                          <span style={{ fontSize: '11px', backgroundColor: C.fondAlt, color: C.vert, padding: '2px 8px', borderRadius: '20px', fontWeight: '600', fontFamily: FONT }}>Réservation boutique</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <span style={{ fontSize: '18px', fontWeight: '700', color: C.vert, fontFamily: FONT }}>{r.prix} €</span>
                        {badgeStatut(r.statut)}
                      </div>
                    </div>
                  ))}
                  {/* Click & Collect */}
                  {commandes.map(c => (
                    <div key={'c-' + c.id} style={carteStyle}>
                      <div>
                        <p style={{ fontWeight: '700', fontSize: '16px', margin: '0 0 4px', color: C.texte, fontFamily: FONT }}>{c.titre}</p>
                        <p style={{ fontSize: '14px', color: C.texteSecondaire, margin: '0 0 6px', fontStyle: 'italic', fontFamily: FONT }}>{c.auteur}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <p style={{ fontSize: '12px', color: '#bbb', margin: 0, fontFamily: FONT }}>{formatDate(c.date_commande)}</p>
                          <span style={{ fontSize: '11px', backgroundColor: '#e3f2fd', color: '#1565c0', padding: '2px 8px', borderRadius: '20px', fontWeight: '600', fontFamily: FONT }}>Click & Collect</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <span style={{ fontSize: '18px', fontWeight: '700', color: C.vert, fontFamily: FONT }}>{c.prix} €</span>
                        {badgeStatut(c.statut)}
                      </div>
                    </div>
                  ))}
                </div>}
          </div>
        )}

        {/* ── Achats en magasin ───────────────────────────────────────── */}
        {onglet === 'achats' && (
          <div>
            {ventes.length === 0
              ? <EmptyState emoji="🛍️" texte="Aucun achat en magasin enregistré" />
              : <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {ventes.map(v => (
                    <div key={v.id} style={carteStyle}>
                      <div>
                        <p style={{ fontWeight: '700', fontSize: '16px', margin: '0 0 4px', color: C.texte, fontFamily: FONT }}>{v.titre}</p>
                        <p style={{ fontSize: '14px', color: C.texteSecondaire, margin: '0 0 6px', fontStyle: 'italic', fontFamily: FONT }}>{v.auteur}</p>
                        <p style={{ fontSize: '12px', color: '#bbb', margin: 0, fontFamily: FONT }}>{formatDate(v.date_vente)}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '18px', fontWeight: '700', color: C.vert, margin: '0 0 4px', fontFamily: FONT }}>{(v.prix_unitaire * v.quantite).toFixed(2)} €</p>
                        {v.quantite > 1 && <p style={{ fontSize: '12px', color: '#bbb', margin: 0, fontFamily: FONT }}>{v.quantite} ex. × {v.prix_unitaire} €</p>}
                      </div>
                    </div>
                  ))}
                </div>}
          </div>
        )}

        {/* ── Wishlist ────────────────────────────────────────────────── */}
        {onglet === 'wishlist' && (
          <div>
            {wishlist.length === 0
              ? <EmptyState emoji="♡" texte="Votre wishlist est vide" />
              : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }}>
                  {wishlist.map(w => (
                    <div key={w.id} style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', borderTop: `4px solid ${C.or}` }}>
                      <a href={`/livres/${w.livre_id}`} style={{ textDecoration: 'none' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 6px', color: C.texte, lineHeight: '1.3', fontFamily: FONT }}>{w.titre}</h3>
                        <p style={{ fontSize: '14px', color: C.texteSecondaire, margin: '0 0 16px', fontStyle: 'italic', fontFamily: FONT }}>{w.auteur}</p>
                      </a>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <span style={{ fontSize: '18px', fontWeight: '700', color: C.vert, fontFamily: FONT }}>{w.prix} €</span>
                        <span style={{ fontSize: '11px', color: w.stock > 0 ? C.vert : C.texteSecondaire, backgroundColor: w.stock > 0 ? C.fondAlt : '#f5f5f5', padding: '4px 10px', borderRadius: '20px', fontFamily: FONT }}>
                          {w.stock > 0 ? 'En stock' : 'Sur commande'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <a href={`/livres/${w.livre_id}`} style={{ flex: 1, textAlign: 'center', padding: '10px', backgroundColor: C.vert, color: 'white', borderRadius: '40px', textDecoration: 'none', fontSize: '14px', fontWeight: '700', fontFamily: FONT }}>
                          Voir le livre
                        </a>
                        <button onClick={() => retirerWishlist(w.livre_id)} style={{ padding: '10px 14px', backgroundColor: '#fff0f0', color: '#c0392b', border: 'none', borderRadius: '40px', fontSize: '14px', cursor: 'pointer', fontFamily: FONT }}>✕</button>
                      </div>
                    </div>
                  ))}
                </div>}
          </div>
        )}
      </main>

      <footer style={{ backgroundColor: C.footer, padding: '28px', textAlign: 'center' }}>
        <p style={{ color: C.fondAlt, fontSize: '14px', margin: 0, fontFamily: FONT }}>2026 Bookdog — Librairie indépendante Paris 17e</p>
      </footer>
    </div>
  )
}

function EmptyState({ emoji, texte }: { emoji: string; texte: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '80px 0' }}>
      <p style={{ fontSize: '40px', marginBottom: '12px' }}>{emoji}</p>
      <p style={{ color: '#bbb', fontSize: '16px', margin: '0 0 24px', fontFamily: "'EB Garamond', Georgia, serif" }}>{texte}</p>
      <a href="/livres" style={{ display: 'inline-block', backgroundColor: '#1A3C2E', color: 'white', padding: '12px 28px', borderRadius: '40px', textDecoration: 'none', fontWeight: '700', fontSize: '15px', fontFamily: "'EB Garamond', Georgia, serif" }}>
        Découvrir le catalogue
      </a>
    </div>
  )
}