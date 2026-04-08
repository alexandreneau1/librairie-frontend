'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Header from '../../../components/Header'

const C = {
  vert: '#1A3C2E',
  or: '#C9A84C',
  orIntense: '#9A6F09',
  fond: '#F9F6F0',
  fondAlt: '#EAF2EC',
  texte: '#1C1C1C',
  texteSecondaire: '#6B6B5E',
  footer: '#0f2419',
  rouge: '#C0392B',
  rougeAlt: '#FDECEA',
}

// ── Types ─────────────────────────────────────────────────────────────────────
type DonneesVentes = {
  ca_total: number
  ca_mensuel: { mois: string; ca: number }[]
  nb_commandes: number
  panier_moyen: number
  top_livres: { titre: string; auteur: string; nb_vendus: number; ca: number }[]
  statuts: { statut: string; nb: number }[]
}

type DonneesClients = {
  total_clients: number
  clients_mensuel: { mois: string; nb: number }[]
  top_clients: { nom: string; prenom: string; email: string; nb_commandes: number; ca_total: number }[]
  commandes_attente: number
}

type DonneesCatalogue = {
  genres: { genre: string; nb_titres: number; stock_total: number }[]
  total_livres: number
  stock_total: number
  ruptures: { id: number; titre: string; auteur: string; genre: string; prix: number }[]
  stock_faible: { id: number; titre: string; auteur: string; genre: string; stock: number; prix: number }[]
  valeur_stock: number
}

// ── Utilitaires ───────────────────────────────────────────────────────────────
function formaterEuros(n: number): string {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
}

function formaterMois(mois: string): string {
  const [annee, m] = mois.split('-')
  const noms = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
  return noms[parseInt(m) - 1] + ' ' + annee.slice(2)
}

// ── Carte KPI ─────────────────────────────────────────────────────────────────
function CarteKPI({ label, valeur, sous }: { label: string; valeur: string; sous?: string }) {
  return (
    <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderTop: `3px solid ${C.or}` }}>
      <p style={{ fontSize: '11px', color: C.texteSecondaire, letterSpacing: '1.5px', fontWeight: '600', margin: '0 0 8px', textTransform: 'uppercase' as const }}>{label}</p>
      <p style={{ fontSize: '28px', fontWeight: '700', color: C.vert, margin: '0 0 4px', fontFamily: 'Georgia, serif' }}>{valeur}</p>
      {sous && <p style={{ fontSize: '12px', color: C.texteSecondaire, margin: 0 }}>{sous}</p>}
    </div>
  )
}

// ── Graphique barres (pur CSS — pas de Chart.js pour éviter les dépendances) ──
function GraphiqueBarres({ donnees, labelX, labelY, couleur }: {
  donnees: { label: string; valeur: number }[]
  labelX?: string
  labelY?: string
  couleur?: string
}) {
  if (!donnees.length) return null
  const max = Math.max(...donnees.map(d => d.valeur), 1)

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '160px', minWidth: donnees.length * 40 + 'px', paddingBottom: '28px', position: 'relative' }}>
        {/* Ligne de base */}
        <div style={{ position: 'absolute', bottom: '28px', left: 0, right: 0, height: '1px', backgroundColor: '#eee' }} />
        {donnees.map((d, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', height: '100%', justifyContent: 'flex-end' }}>
            <span style={{ fontSize: '10px', color: C.texteSecondaire, fontWeight: '600' }}>
              {d.valeur > 0 ? (d.valeur >= 1000 ? (d.valeur / 1000).toFixed(1) + 'k' : d.valeur.toString()) : ''}
            </span>
            <div
              style={{
                width: '100%',
                height: `${(d.valeur / max) * 120}px`,
                backgroundColor: couleur || C.vert,
                borderRadius: '4px 4px 0 0',
                minHeight: d.valeur > 0 ? '4px' : '0',
                transition: 'height 0.3s ease',
                opacity: 0.85,
              }}
            />
            <span style={{ fontSize: '9px', color: C.texteSecondaire, position: 'absolute', bottom: '4px', textAlign: 'center', width: '100%' }}>{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Graphique camembert (pur CSS avec conic-gradient) ─────────────────────────
function GraphiqueCamembert({ donnees }: { donnees: { label: string; valeur: number; couleur: string }[] }) {
  if (!donnees.length) return null
  const total = donnees.reduce((s, d) => s + d.valeur, 0)
  if (total === 0) return null

  let cumul = 0
  const segments = donnees.map(d => {
    const debut = (cumul / total) * 360
    cumul += d.valeur
    const fin = (cumul / total) * 360
    return { ...d, debut, fin }
  })

  const gradient = segments.map(s => `${s.couleur} ${s.debut}deg ${s.fin}deg`).join(', ')

  return (
    <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
      <div style={{
        width: '120px', height: '120px', borderRadius: '50%', flexShrink: 0,
        background: `conic-gradient(${gradient})`,
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {donnees.map((d, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: d.couleur, flexShrink: 0 }} />
            <span style={{ fontSize: '12px', color: C.texte }}>{d.label}</span>
            <span style={{ fontSize: '12px', color: C.texteSecondaire, marginLeft: 'auto' }}>
              {total > 0 ? Math.round((d.valeur / total) * 100) : 0}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Onglet Ventes ─────────────────────────────────────────────────────────────
function OngletVentes({ token }: { token: string }) {
  const [donnees, setDonnees] = useState<DonneesVentes | null>(null)
  const [chargement, setChargement] = useState(true)

  useEffect(() => {
    fetch('http://localhost:3001/api/analytics/ventes', { headers: { Authorization: 'Bearer ' + token } })
      .then(r => r.json())
      .then(d => { setDonnees(d); setChargement(false) })
      .catch(() => setChargement(false))
  }, [])

  if (chargement) return <div style={{ textAlign: 'center', padding: '60px', color: C.texteSecondaire }}>Chargement...</div>
  if (!donnees) return <div style={{ textAlign: 'center', padding: '60px', color: C.rouge }}>Erreur de chargement</div>

  const couleursCamembert = [C.vert, C.or, '#3B7A57', '#C9A84C88', '#6B6B5E', '#EAF2EC']
  const statutsData = donnees.statuts.map((s, i) => ({
    label: s.statut.charAt(0).toUpperCase() + s.statut.slice(1),
    valeur: parseInt(s.nb as any),
    couleur: couleursCamembert[i % couleursCamembert.length]
  }))

  return (
    <div>
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <CarteKPI label="Chiffre d'affaires" valeur={formaterEuros(donnees.ca_total)} />
        <CarteKPI label="Commandes" valeur={donnees.nb_commandes.toString()} />
        <CarteKPI label="Panier moyen" valeur={formaterEuros(donnees.panier_moyen)} />
      </div>

      {/* CA mensuel */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '700', color: C.texte, margin: '0 0 20px', letterSpacing: '0.5px' }}>CHIFFRE D'AFFAIRES MENSUEL</h3>
        {donnees.ca_mensuel.length > 0 ? (
          <GraphiqueBarres
            donnees={donnees.ca_mensuel.map(d => ({ label: formaterMois(d.mois), valeur: parseFloat(d.ca as any) }))}
            couleur={C.vert}
          />
        ) : (
          <p style={{ color: C.texteSecondaire, fontSize: '13px' }}>Aucune donnée disponible</p>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        {/* Top livres */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '700', color: C.texte, margin: '0 0 16px', letterSpacing: '0.5px' }}>TOP 10 LIVRES</h3>
          {donnees.top_livres.length > 0 ? donnees.top_livres.map((l, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < donnees.top_livres.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
              <div style={{ flex: 1, minWidth: 0, marginRight: '12px' }}>
                <p style={{ fontSize: '13px', fontWeight: '600', color: C.texte, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <span style={{ color: C.or, marginRight: '6px', fontFamily: 'Georgia, serif' }}>#{i + 1}</span>
                  {l.titre}
                </p>
                <p style={{ fontSize: '11px', color: C.texteSecondaire, margin: 0, fontStyle: 'italic' }}>{l.auteur} · {l.nb_vendus} ex.</p>
              </div>
              <span style={{ fontSize: '13px', fontWeight: '700', color: C.vert, flexShrink: 0 }}>{formaterEuros(parseFloat(l.ca as any))}</span>
            </div>
          )) : (
            <p style={{ color: C.texteSecondaire, fontSize: '13px' }}>Aucune vente enregistrée</p>
          )}
        </div>

        {/* Statuts commandes */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '700', color: C.texte, margin: '0 0 16px', letterSpacing: '0.5px' }}>STATUTS DES COMMANDES</h3>
          {statutsData.length > 0 ? (
            <GraphiqueCamembert donnees={statutsData} />
          ) : (
            <p style={{ color: C.texteSecondaire, fontSize: '13px' }}>Aucune commande</p>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Onglet Clients ────────────────────────────────────────────────────────────
function OngletClients({ token }: { token: string }) {
  const [donnees, setDonnees] = useState<DonneesClients | null>(null)
  const [chargement, setChargement] = useState(true)

  useEffect(() => {
    fetch('http://localhost:3001/api/analytics/clients', { headers: { Authorization: 'Bearer ' + token } })
      .then(r => r.json())
      .then(d => { setDonnees(d); setChargement(false) })
      .catch(() => setChargement(false))
  }, [])

  if (chargement) return <div style={{ textAlign: 'center', padding: '60px', color: C.texteSecondaire }}>Chargement...</div>
  if (!donnees) return <div style={{ textAlign: 'center', padding: '60px', color: C.rouge }}>Erreur de chargement</div>

  const tauxActifs = donnees.total_clients > 0
    ? Math.round(((donnees.total_clients - donnees.commandes_attente) / donnees.total_clients) * 100)
    : 0

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <CarteKPI label="Clients inscrits" valeur={donnees.total_clients.toString()} />
        <CarteKPI label="Clients actifs" valeur={`${donnees.total_clients - donnees.commandes_attente}`} sous={`${tauxActifs}% ont commandé`} />
        <CarteKPI label="Sans commande" valeur={donnees.commandes_attente.toString()} sous="Jamais commandé" />
      </div>

      {/* Nouveaux clients par mois */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '700', color: C.texte, margin: '0 0 20px', letterSpacing: '0.5px' }}>NOUVEAUX CLIENTS PAR MOIS</h3>
        {donnees.clients_mensuel.length > 0 ? (
          <GraphiqueBarres
            donnees={donnees.clients_mensuel.map(d => ({ label: formaterMois(d.mois), valeur: parseInt(d.nb as any) }))}
            couleur={C.or}
          />
        ) : (
          <p style={{ color: C.texteSecondaire, fontSize: '13px' }}>Aucune donnée disponible</p>
        )}
      </div>

      {/* Top clients */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '700', color: C.texte, margin: '0 0 16px', letterSpacing: '0.5px' }}>TOP 10 CLIENTS</h3>
        {donnees.top_clients.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #eee' }}>
                  <th style={{ textAlign: 'left', padding: '8px 12px', color: C.texteSecondaire, fontWeight: '600', fontSize: '11px', letterSpacing: '1px' }}>#</th>
                  <th style={{ textAlign: 'left', padding: '8px 12px', color: C.texteSecondaire, fontWeight: '600', fontSize: '11px', letterSpacing: '1px' }}>CLIENT</th>
                  <th style={{ textAlign: 'right', padding: '8px 12px', color: C.texteSecondaire, fontWeight: '600', fontSize: '11px', letterSpacing: '1px' }}>COMMANDES</th>
                  <th style={{ textAlign: 'right', padding: '8px 12px', color: C.texteSecondaire, fontWeight: '600', fontSize: '11px', letterSpacing: '1px' }}>CA TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {donnees.top_clients.map((c, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f5f5f5' }}>
                    <td style={{ padding: '10px 12px', color: C.or, fontWeight: '700', fontFamily: 'Georgia, serif' }}>#{i + 1}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <p style={{ margin: 0, fontWeight: '600', color: C.texte }}>{c.prenom} {c.nom}</p>
                      <p style={{ margin: 0, fontSize: '11px', color: C.texteSecondaire }}>{c.email}</p>
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', color: C.texteSecondaire }}>{c.nb_commandes}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '700', color: C.vert }}>{formaterEuros(parseFloat(c.ca_total as any))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: C.texteSecondaire, fontSize: '13px' }}>Aucun client avec commande</p>
        )}
      </div>
    </div>
  )
}

// ── Onglet Catalogue ──────────────────────────────────────────────────────────
function OngletCatalogue({ token }: { token: string }) {
  const [donnees, setDonnees] = useState<DonneesCatalogue | null>(null)
  const [chargement, setChargement] = useState(true)

  useEffect(() => {
    fetch('http://localhost:3001/api/analytics/catalogue', { headers: { Authorization: 'Bearer ' + token } })
      .then(r => r.json())
      .then(d => { setDonnees(d); setChargement(false) })
      .catch(() => setChargement(false))
  }, [])

  if (chargement) return <div style={{ textAlign: 'center', padding: '60px', color: C.texteSecondaire }}>Chargement...</div>
  if (!donnees) return <div style={{ textAlign: 'center', padding: '60px', color: C.rouge }}>Erreur de chargement</div>

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <CarteKPI label="Titres au catalogue" valeur={donnees.total_livres.toString()} />
        <CarteKPI label="Exemplaires en stock" valeur={donnees.stock_total.toString()} />
        <CarteKPI label="Valeur du stock" valeur={formaterEuros(donnees.valeur_stock)} />
        <CarteKPI label="Ruptures de stock" valeur={donnees.ruptures.length.toString()} sous={donnees.ruptures.length > 0 ? 'Réapprovisionner' : 'Tout est dispo'} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        {/* Répartition genres */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '700', color: C.texte, margin: '0 0 16px', letterSpacing: '0.5px' }}>RÉPARTITION PAR GENRE</h3>
          {donnees.genres.length > 0 ? (
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {donnees.genres.map((g, i) => (
                <div key={i} style={{ marginBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '13px', color: C.texte }}>{g.genre}</span>
                    <span style={{ fontSize: '12px', color: C.texteSecondaire }}>{g.nb_titres} titres · {g.stock_total} ex.</span>
                  </div>
                  <div style={{ height: '6px', backgroundColor: '#f0f0f0', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${(g.nb_titres / donnees.total_livres) * 100}%`,
                      backgroundColor: C.vert,
                      borderRadius: '3px',
                    }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: C.texteSecondaire, fontSize: '13px' }}>Aucun genre renseigné</p>
          )}
        </div>

        {/* Stock faible */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '700', color: C.texte, margin: '0 0 16px', letterSpacing: '0.5px' }}>
            STOCK FAIBLE
            {donnees.stock_faible.length > 0 && (
              <span style={{ marginLeft: '8px', backgroundColor: '#fff3e0', color: '#e65100', fontSize: '11px', padding: '2px 8px', borderRadius: '12px' }}>
                {donnees.stock_faible.length} livres
              </span>
            )}
          </h3>
          {donnees.stock_faible.length > 0 ? (
            <div style={{ maxHeight: '260px', overflowY: 'auto' }}>
              {donnees.stock_faible.map((l, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < donnees.stock_faible.length - 1 ? '1px solid #f5f5f5' : 'none' }}>
                  <div style={{ flex: 1, minWidth: 0, marginRight: '8px' }}>
                    <p style={{ fontSize: '13px', fontWeight: '600', color: C.texte, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.titre}</p>
                    <p style={{ fontSize: '11px', color: C.texteSecondaire, margin: 0, fontStyle: 'italic' }}>{l.auteur}</p>
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: '700', padding: '2px 8px', borderRadius: '12px', backgroundColor: l.stock === 1 ? C.rougeAlt : '#fff3e0', color: l.stock === 1 ? C.rouge : '#e65100', flexShrink: 0 }}>
                    {l.stock} ex.
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: C.texteSecondaire, fontSize: '13px' }}>Aucun livre en stock faible</p>
          )}
        </div>
      </div>

      {/* Ruptures */}
      {donnees.ruptures.length > 0 && (
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderLeft: `4px solid ${C.rouge}` }}>
          <h3 style={{ fontSize: '14px', fontWeight: '700', color: C.rouge, margin: '0 0 16px', letterSpacing: '0.5px' }}>
            RUPTURES DE STOCK — {donnees.ruptures.length} TITRE{donnees.ruptures.length > 1 ? 'S' : ''}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '8px' }}>
            {donnees.ruptures.map((l, i) => (
              <div key={i} style={{ backgroundColor: C.rougeAlt, borderRadius: '8px', padding: '10px 14px' }}>
                <p style={{ fontSize: '13px', fontWeight: '600', color: C.texte, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.titre}</p>
                <p style={{ fontSize: '11px', color: C.texteSecondaire, margin: 0, fontStyle: 'italic' }}>{l.auteur} · {l.genre || 'Non classé'} · {l.prix} €</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Page principale ───────────────────────────────────────────────────────────
export default function Analytics() {
  const router = useRouter()
  const [onglet, setOnglet] = useState<'ventes' | 'clients' | 'catalogue'>('ventes')
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    const t = localStorage.getItem('token')
    if (!t) {
      router.push('/admin')
      return
    }
    setToken(t)
  }, [])

  if (!token) return null

  const onglets: { id: 'ventes' | 'clients' | 'catalogue'; label: string; icone: string }[] = [
    { id: 'ventes', label: 'Ventes', icone: '📈' },
    { id: 'clients', label: 'Clients', icone: '👤' },
    { id: 'catalogue', label: 'Catalogue', icone: '📚' },
  ]

  return (
    <div style={{ backgroundColor: C.fond, minHeight: '100vh', fontFamily: 'Georgia, serif' }}>
      <Header pageCourante="admin" />

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 24px 80px', boxSizing: 'border-box' }}>

        {/* En-tête */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <p style={{ fontSize: '11px', color: C.or, letterSpacing: '2px', fontWeight: '600', margin: '0 0 6px' }}>TABLEAU DE BORD</p>
              <h1 style={{ fontSize: '32px', fontWeight: '700', color: C.vert, margin: 0 }}>Analytics</h1>
            </div>
            <a href="/admin/dashboard" style={{ fontSize: '13px', color: C.texteSecondaire, textDecoration: 'none', padding: '8px 16px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: 'white' }}>
              ← Dashboard admin
            </a>
          </div>
        </div>

        {/* Onglets */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '32px', backgroundColor: 'white', padding: '4px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', width: 'fit-content' }}>
          {onglets.map(o => (
            <button
              key={o.id}
              onClick={() => setOnglet(o.id)}
              style={{
                padding: '10px 24px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: onglet === o.id ? C.vert : 'transparent',
                color: onglet === o.id ? 'white' : C.texteSecondaire,
                fontSize: '14px',
                fontWeight: onglet === o.id ? '700' : '400',
                cursor: 'pointer',
                fontFamily: 'Georgia, serif',
                transition: 'all 0.15s',
              }}
            >
              {o.icone} {o.label}
            </button>
          ))}
        </div>

        {/* Contenu */}
        {onglet === 'ventes' && <OngletVentes token={token} />}
        {onglet === 'clients' && <OngletClients token={token} />}
        {onglet === 'catalogue' && <OngletCatalogue token={token} />}
      </div>

      <footer style={{ backgroundColor: C.footer, padding: '24px', textAlign: 'center' }}>
        <p style={{ color: C.fondAlt, fontSize: '13px', margin: 0 }}>2026 Bookdog — Librairie indépendante Paris 17e</p>
      </footer>
    </div>
  )
}