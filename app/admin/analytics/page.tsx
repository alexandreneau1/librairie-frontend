'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

const C = {
  vert: '#1A3C2E', or: '#D4AF37', orIntense: '#B8960C',
  fond: '#F9F6F0', fondAlt: '#EAF2EC', texte: '#1C1C1C',
  texteSecondaire: '#6B6B5E', footer: '#0f2419',
  rouge: '#C0392B', rougeAlt: '#FDECEA',
}
const FONT = "'EB Garamond', Georgia, serif"

type Periode = '7j' | '30j' | '3m' | '6m' | '1an' | 'tout'
const PERIODES: { id: Periode; label: string }[] = [
  { id: '7j', label: '7 j' }, { id: '30j', label: '30 j' }, { id: '3m', label: '3 mois' },
  { id: '6m', label: '6 mois' }, { id: '1an', label: '1 an' }, { id: 'tout', label: 'Tout' },
]

type Charge = { id: number; nom: string; montant: number; categorie: string | null; actif: boolean }
type DonneesVentes = {
  ca_total: number; ca_ht: number; ca_precedent: number
  marge_brute: number; taux_marge: number; taux_marge_estime: number; couverture_prix_achat: number
  charges_mensuelles: number; charges_periode: number; charges_detail: Charge[]
  resultat_exploitation: number; taux_resultat: number
  ca_mensuel: { mois: string; ca: number; marge: number }[]
  nb_ventes: number; nb_commandes: number; panier_moyen: number
  top_livres: { titre: string; auteur: string; prix_achat: number | null; nb_vendus: number; ca: number; ca_ht: number; marge_brute: number; source_marge: string }[]
  remises_ce: { ce_nom: string; taux_remise: number; nb_ventes: number; ca_facture: number; ca_prix_public: number; remise_accordee: number }[]
  statuts: { statut: string; nb: number }[]
}
type DonneesClients = {
  total_clients: number; clients_actifs: number
  clients_mensuel: { mois: string; nb: number }[]
  top_clients: { nom: string; prenom: string; email: string; nb_commandes: number; ca_total: number }[]
  repartition_ce: { type: string; nb: number }[]
  optins: { recos: number; relance: number; total: number }
  commandes_attente: number
}
type DonneesCatalogue = {
  genres: { genre: string; nb_titres: number; stock_total: number }[]
  genres_ventes: { genre: string; nb_ventes: number; ca: number }[]
  total_livres: number; stock_total: number
  ruptures: { id: number; titre: string; auteur: string; genre: string; prix: number }[]
  stock_faible: { id: number; titre: string; auteur: string; genre: string; stock: number; prix: number }[]
  valeur_stock: number; valeur_stock_achat: number; couverture_prix_achat: number
}

function euros(n: number | string) {
  return Number(n).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
}
function moisCourt(s: string) {
  const [, m] = s.split('-')
  return ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'][parseInt(m) - 1]
}
function evo(actuel: number, precedent: number) {
  if (!precedent) return null
  return Math.round(((actuel - precedent) / precedent) * 100)
}

// ── Composants de base ────────────────────────────────────────────────────────

function KPI({ label, valeur, sous, evolution, accent }: { label: string; valeur: string; sous?: string; evolution?: number | null; accent?: string }) {
  return (
    <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px 22px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderTop: `3px solid ${accent || C.or}` }}>
      <p style={{ fontSize: '11px', color: C.texteSecondaire, letterSpacing: '1.5px', fontWeight: '600', margin: '0 0 8px', textTransform: 'uppercase' as const, fontFamily: FONT }}>{label}</p>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
        <p style={{ fontSize: '24px', fontWeight: '700', color: C.vert, margin: 0, fontFamily: FONT }}>{valeur}</p>
        {evolution !== null && evolution !== undefined && (
          <span style={{ fontSize: '12px', fontWeight: '700', color: evolution >= 0 ? '#2e7d32' : C.rouge, backgroundColor: evolution >= 0 ? '#e8f5e9' : C.rougeAlt, padding: '2px 8px', borderRadius: '20px' }}>
            {evolution >= 0 ? '+' : ''}{evolution}%
          </span>
        )}
      </div>
      {sous && <p style={{ fontSize: '12px', color: C.texteSecondaire, margin: '4px 0 0', fontFamily: FONT }}>{sous}</p>}
    </div>
  )
}

function BarChart({ data, couleur, couleur2, label2 }: { data: { label: string; valeur: number; valeur2?: number }[]; couleur?: string; couleur2?: string; label2?: string }) {
  if (!data.length) return <p style={{ color: C.texteSecondaire, fontSize: '13px', fontFamily: FONT }}>Aucune donnée</p>
  const max = Math.max(...data.map(d => Math.max(d.valeur, d.valeur2 || 0)), 1)
  return (
    <div style={{ overflowX: 'auto' }}>
      {couleur2 && label2 && (
        <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: couleur || C.vert }} /><span style={{ fontSize: '11px', color: C.texteSecondaire, fontFamily: FONT }}>CA HT</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: couleur2 }} /><span style={{ fontSize: '11px', color: C.texteSecondaire, fontFamily: FONT }}>{label2}</span></div>
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '160px', minWidth: data.length * 44 + 'px', paddingBottom: '24px', position: 'relative' }}>
        <div style={{ position: 'absolute', bottom: '24px', left: 0, right: 0, height: '1px', backgroundColor: '#eee' }} />
        {data.map((d, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: '1px', height: '100%', justifyContent: 'center', position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1px', height: '136px' }}>
              <div style={{ width: couleur2 ? '45%' : '100%', height: `${(d.valeur / max) * 134}px`, backgroundColor: couleur || C.vert, borderRadius: '3px 3px 0 0', minHeight: d.valeur > 0 ? '3px' : '0', opacity: 0.85 }} />
              {couleur2 && d.valeur2 !== undefined && (
                <div style={{ width: '45%', height: `${(d.valeur2 / max) * 134}px`, backgroundColor: couleur2, borderRadius: '3px 3px 0 0', minHeight: d.valeur2 > 0 ? '3px' : '0', opacity: 0.85 }} />
              )}
            </div>
            <span style={{ fontSize: '9px', color: C.texteSecondaire, position: 'absolute', bottom: '4px', textAlign: 'center', width: '100%', fontFamily: FONT }}>{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function Camembert({ data }: { data: { label: string; valeur: number; couleur: string }[] }) {
  const total = data.reduce((s, d) => s + Number(d.valeur), 0)
  if (!total) return <p style={{ color: C.texteSecondaire, fontSize: '13px', fontFamily: FONT }}>Aucune donnée</p>
  let cumul = 0
  const gradient = data.map(d => {
    const debut = (cumul / total) * 360; cumul += Number(d.valeur); const fin = (cumul / total) * 360
    return `${d.couleur} ${debut}deg ${fin}deg`
  }).join(', ')
  return (
    <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
      <div style={{ width: '110px', height: '110px', borderRadius: '50%', flexShrink: 0, background: `conic-gradient(${gradient})`, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
        {data.map((d, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: d.couleur, flexShrink: 0 }} />
            <span style={{ fontSize: '13px', color: C.texte, fontFamily: FONT }}>{d.label}</span>
            <span style={{ fontSize: '12px', color: C.texteSecondaire, marginLeft: '8px' }}>{Math.round((Number(d.valeur) / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function Progressbar({ label, valeur, max, detail }: { label: string; valeur: number; max: number; detail?: string }) {
  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
        <span style={{ fontSize: '13px', color: C.texte, fontFamily: FONT }}>{label}</span>
        <span style={{ fontSize: '12px', color: C.texteSecondaire, fontFamily: FONT }}>{detail || valeur}</span>
      </div>
      <div style={{ height: '6px', backgroundColor: '#f0f0f0', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${max > 0 ? Math.min((valeur / max) * 100, 100) : 0}%`, backgroundColor: C.vert, borderRadius: '3px' }} />
      </div>
    </div>
  )
}

function Carte({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', ...style }}>{children}</div>
}

function SectionTitre({ children }: { children: React.ReactNode }) {
  return <h3 style={{ fontSize: '11px', fontWeight: '700', color: C.texteSecondaire, margin: '0 0 16px', letterSpacing: '1.5px', textTransform: 'uppercase' as const, fontFamily: FONT }}>{children}</h3>
}

function SelecteurPeriode({ periode, onChange }: { periode: Periode; onChange: (p: Periode) => void }) {
  return (
    <div style={{ display: 'flex', gap: '4px', backgroundColor: '#ede9e3', borderRadius: '8px', padding: '4px' }}>
      {PERIODES.map(p => (
        <button key={p.id} onClick={() => onChange(p.id)} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', fontSize: '13px', fontWeight: '600', cursor: 'pointer', backgroundColor: periode === p.id ? C.vert : 'transparent', color: periode === p.id ? 'white' : C.texteSecondaire, fontFamily: FONT }}>
          {p.label}
        </button>
      ))}
    </div>
  )
}

// ── Module Charges Fixes ───────────────────────────────────────────────────────

function ModuleCharges({ token, onUpdate }: { token: string; onUpdate: () => void }) {
  const [charges, setCharges] = useState<Charge[]>([])
  const [ouvert, setOuvert] = useState(false)
  const [formulaire, setFormulaire] = useState(false)
  const [edite, setEdite] = useState<Charge | null>(null)
  const [nom, setNom] = useState('')
  const [montant, setMontant] = useState('')
  const [categorie, setCategorie] = useState('')
  const [erreur, setErreur] = useState('')

  const h = () => ({ 'Authorization': 'Bearer ' + token })
  const hj = () => ({ 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token })

  const charger = () => {
    fetch('http://localhost:3001/api/analytics/charges', { headers: h() })
      .then(r => r.json()).then(d => setCharges(d.charges || []))
  }

  useEffect(() => { charger() }, [])

  const ouvrir = (c: Charge | null) => {
    setEdite(c)
    setNom(c?.nom || '')
    setMontant(c ? String(c.montant) : '')
    setCategorie(c?.categorie || '')
    setErreur('')
    setFormulaire(true)
    setOuvert(true)
  }

  const sauvegarder = async () => {
    if (!nom || !montant) { setErreur('Nom et montant requis'); return }
    const body = JSON.stringify({ nom, montant: parseFloat(montant), categorie: categorie || null, actif: true })
    if (edite) {
      await fetch(`http://localhost:3001/api/analytics/charges/${edite.id}`, { method: 'PUT', headers: hj(), body })
    } else {
      await fetch('http://localhost:3001/api/analytics/charges', { method: 'POST', headers: hj(), body })
    }
    setFormulaire(false); charger(); onUpdate()
  }

  const toggleActif = async (c: Charge) => {
    await fetch(`http://localhost:3001/api/analytics/charges/${c.id}`, {
      method: 'PUT', headers: hj(),
      body: JSON.stringify({ nom: c.nom, montant: c.montant, categorie: c.categorie, actif: !c.actif })
    })
    charger(); onUpdate()
  }

  const supprimer = async (id: number) => {
    if (!confirm('Supprimer cette charge ?')) return
    await fetch(`http://localhost:3001/api/analytics/charges/${id}`, { method: 'DELETE', headers: h() })
    charger(); onUpdate()
  }

  const total = charges.filter(c => c.actif).reduce((s, c) => s + parseFloat(String(c.montant)), 0)
  const categories = [...new Set(charges.map(c => c.categorie || 'Autre'))]

  const inputStyle = { width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', boxSizing: 'border-box' as const, fontFamily: FONT }

  return (
    <Carte style={{ marginBottom: '24px', borderLeft: `4px solid ${C.vert}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <SectionTitre>Charges fixes mensuelles</SectionTitre>
          <p style={{ fontSize: '22px', fontWeight: '700', color: C.rouge, margin: '-8px 0 0', fontFamily: FONT }}>{euros(total)} / mois</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => ouvrir(null)} style={{ backgroundColor: C.vert, color: 'white', border: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT }}>+ Ajouter</button>
          <button onClick={() => setOuvert(!ouvert)} style={{ backgroundColor: 'transparent', color: C.texteSecondaire, border: '1px solid #ddd', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', cursor: 'pointer', fontFamily: FONT }}>
            {ouvert ? '▲ Réduire' : '▼ Détail'}
          </button>
        </div>
      </div>

      {ouvert && (
        <div style={{ marginTop: '20px' }}>
          {/* Formulaire */}
          {formulaire && (
            <div style={{ backgroundColor: C.fondAlt, borderRadius: '10px', padding: '20px', marginBottom: '20px' }}>
              <p style={{ fontSize: '13px', fontWeight: '700', color: C.texte, margin: '0 0 14px', fontFamily: FONT }}>{edite ? 'Modifier la charge' : 'Nouvelle charge'}</p>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: C.texteSecondaire, display: 'block', marginBottom: '4px', fontFamily: FONT }}>Nom *</label>
                  <input value={nom} onChange={e => setNom(e.target.value)} placeholder="ex. Loyer" style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: C.texteSecondaire, display: 'block', marginBottom: '4px', fontFamily: FONT }}>Montant mensuel (€) *</label>
                  <input type="number" value={montant} onChange={e => setMontant(e.target.value)} placeholder="2000" style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: C.texteSecondaire, display: 'block', marginBottom: '4px', fontFamily: FONT }}>Catégorie</label>
                  <input value={categorie} onChange={e => setCategorie(e.target.value)} placeholder="ex. Immobilier" style={inputStyle} />
                </div>
              </div>
              {erreur && <p style={{ color: C.rouge, fontSize: '12px', margin: '0 0 10px', fontFamily: FONT }}>{erreur}</p>}
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button onClick={() => setFormulaire(false)} style={{ backgroundColor: 'transparent', color: C.texteSecondaire, border: '1px solid #ddd', borderRadius: '8px', padding: '8px 20px', fontSize: '13px', cursor: 'pointer', fontFamily: FONT }}>Annuler</button>
                <button onClick={sauvegarder} style={{ backgroundColor: C.vert, color: 'white', border: 'none', borderRadius: '8px', padding: '8px 20px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT }}>{edite ? 'Enregistrer' : 'Ajouter'}</button>
              </div>
            </div>
          )}

          {/* Liste par catégorie */}
          {categories.map(cat => {
            const lignes = charges.filter(c => (c.categorie || 'Autre') === cat)
            const totalCat = lignes.filter(c => c.actif).reduce((s, c) => s + parseFloat(String(c.montant)), 0)
            return (
              <div key={cat} style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', color: C.texteSecondaire, letterSpacing: '1px', fontWeight: '700', textTransform: 'uppercase', fontFamily: FONT }}>{cat}</span>
                  <span style={{ fontSize: '12px', color: C.texteSecondaire, fontFamily: FONT }}>{euros(totalCat)}</span>
                </div>
                {lignes.map(c => (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: '8px', backgroundColor: c.actif ? 'white' : '#f9f9f9', marginBottom: '4px', border: '1px solid #f0f0f0', opacity: c.actif ? 1 : 0.5 }}>
                    <span style={{ fontSize: '14px', color: C.texte, fontFamily: FONT, flex: 1 }}>{c.nom}</span>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: C.rouge, marginRight: '16px', fontFamily: FONT }}>{euros(c.montant)}</span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => toggleActif(c)} style={{ padding: '3px 10px', borderRadius: '20px', border: 'none', fontSize: '11px', fontWeight: '600', cursor: 'pointer', backgroundColor: c.actif ? C.fondAlt : '#f0f0f0', color: c.actif ? C.vert : '#bbb', fontFamily: FONT }}>{c.actif ? '✓ Actif' : '○ Inactif'}</button>
                      <button onClick={() => ouvrir(c)} style={{ padding: '3px 10px', borderRadius: '6px', border: 'none', backgroundColor: '#f0f0f0', color: C.texte, fontSize: '11px', cursor: 'pointer' }}>Modifier</button>
                      <button onClick={() => supprimer(c.id)} style={{ padding: '3px 10px', borderRadius: '6px', border: '1px solid #fcc', backgroundColor: 'transparent', color: C.rouge, fontSize: '11px', cursor: 'pointer' }}>✕</button>
                    </div>
                  </div>
                ))}
              </div>
            )
          })}

          {/* Total */}
          <div style={{ borderTop: '2px solid #eee', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: '700', color: C.texte, fontFamily: FONT }}>Total mensuel</span>
            <span style={{ fontSize: '18px', fontWeight: '700', color: C.rouge, fontFamily: FONT }}>{euros(total)}</span>
          </div>
        </div>
      )}
    </Carte>
  )
}

// ── Compte de résultat simplifié ──────────────────────────────────────────────

function CompteResultat({ d, periode }: { d: DonneesVentes; periode: Periode }) {
  const labelPeriode = { '7j': '7 derniers jours', '30j': '30 derniers jours', '3m': '3 derniers mois', '6m': '6 derniers mois', '1an': '12 derniers mois', 'tout': 'Toute la période' }[periode]

  const lignes = [
    { label: 'CA HT', valeur: d.ca_ht, couleur: C.vert, bold: true },
    { label: `Coût d'achat (${d.couverture_prix_achat < 100 ? `~${100 - d.couverture_prix_achat}% estimé` : 'réel'})`, valeur: -(d.ca_ht - d.marge_brute), couleur: C.rouge },
    { label: 'Marge brute', valeur: d.marge_brute, couleur: C.vert, bold: true, separateur: true },
    { label: `Charges fixes (${labelPeriode})`, valeur: -d.charges_periode, couleur: C.rouge },
    { label: 'Résultat d\'exploitation', valeur: d.resultat_exploitation, couleur: d.resultat_exploitation >= 0 ? C.vert : C.rouge, bold: true, grand: true },
  ]

  return (
    <Carte style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <SectionTitre>Compte de résultat — {labelPeriode}</SectionTitre>
        {d.couverture_prix_achat < 100 && (
          <span style={{ fontSize: '11px', backgroundColor: '#fff8e6', color: C.orIntense, padding: '3px 10px', borderRadius: '20px', fontWeight: '600', fontFamily: FONT }}>
            ~ {100 - d.couverture_prix_achat}% estimé
          </span>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
        {lignes.map((l, i) => (
          <div key={i}>
            {l.separateur && <div style={{ height: '1px', backgroundColor: '#eee', margin: '8px 0' }} />}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: l.grand ? '12px 16px' : '8px 16px', backgroundColor: l.grand ? (d.resultat_exploitation >= 0 ? C.fondAlt : '#fff0f0') : 'transparent', borderRadius: l.grand ? '8px' : '0' }}>
              <span style={{ fontSize: l.grand ? '15px' : '13px', fontWeight: l.bold ? '700' : '400', color: C.texte, fontFamily: FONT }}>{l.label}</span>
              <span style={{ fontSize: l.grand ? '18px' : '14px', fontWeight: l.bold ? '700' : '500', color: l.couleur, fontFamily: FONT }}>
                {l.valeur >= 0 ? '' : '−'}{euros(Math.abs(l.valeur))}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Taux de résultat */}
      <div style={{ marginTop: '16px', display: 'flex', gap: '16px' }}>
        <div style={{ flex: 1, padding: '12px 16px', backgroundColor: '#f9f9f9', borderRadius: '8px', textAlign: 'center' }}>
          <p style={{ fontSize: '11px', color: C.texteSecondaire, margin: '0 0 4px', letterSpacing: '1px', fontFamily: FONT }}>TAUX DE MARGE BRUTE</p>
          <p style={{ fontSize: '20px', fontWeight: '700', color: C.vert, margin: 0, fontFamily: FONT }}>{d.taux_marge}%</p>
          {d.couverture_prix_achat < 100 && <p style={{ fontSize: '10px', color: C.texteSecondaire, margin: '2px 0 0', fontFamily: FONT }}>~ estimé à {d.taux_marge_estime}% pour {100 - d.couverture_prix_achat}% des ventes</p>}
        </div>
        <div style={{ flex: 1, padding: '12px 16px', backgroundColor: '#f9f9f9', borderRadius: '8px', textAlign: 'center' }}>
          <p style={{ fontSize: '11px', color: C.texteSecondaire, margin: '0 0 4px', letterSpacing: '1px', fontFamily: FONT }}>TAUX DE RÉSULTAT</p>
          <p style={{ fontSize: '20px', fontWeight: '700', color: d.taux_resultat >= 0 ? C.vert : C.rouge, margin: 0, fontFamily: FONT }}>{d.taux_resultat}%</p>
        </div>
        <div style={{ flex: 1, padding: '12px 16px', backgroundColor: '#f9f9f9', borderRadius: '8px', textAlign: 'center' }}>
          <p style={{ fontSize: '11px', color: C.texteSecondaire, margin: '0 0 4px', letterSpacing: '1px', fontFamily: FONT }}>CHARGES / MARGE</p>
          <p style={{ fontSize: '20px', fontWeight: '700', color: d.marge_brute > 0 ? (d.charges_periode / d.marge_brute > 0.9 ? C.rouge : C.orIntense) : C.rouge, margin: 0, fontFamily: FONT }}>
            {d.marge_brute > 0 ? Math.round((d.charges_periode / d.marge_brute) * 100) : '—'}%
          </p>
        </div>
      </div>
    </Carte>
  )
}

// ── Onglet Ventes ──────────────────────────────────────────────────────────────

function OngletVentes({ token, periode }: { token: string; periode: Periode }) {
  const [d, setD] = useState<DonneesVentes | null>(null)
  const [chargement, setChargement] = useState(true)
  const [afficherMarge, setAfficherMarge] = useState(true)
  const [version, setVersion] = useState(0)

  const charger = (silencieux = false) => {
    if (!silencieux) setChargement(true)
    fetch(`http://localhost:3001/api/analytics/ventes?periode=${periode}`, { headers: { Authorization: 'Bearer ' + token } })
      .then(r => r.json()).then(data => { setD(data); setChargement(false) }).catch(() => setChargement(false))
  }

  const handleChargesUpdate = useCallback(() => { charger(true) }, [periode])

  useEffect(() => { charger(false) }, [periode])
  useEffect(() => { if (version > 0) charger(true) }, [version])

  const evolution = d ? evo(d.ca_total, d.ca_precedent) : null
  const couleursCamembert = [C.vert, C.or, '#3B7A57', C.orIntense, C.texteSecondaire]
  const statutsData = d ? d.statuts.map((s, i) => ({ label: s.statut.charAt(0).toUpperCase() + s.statut.slice(1), valeur: Number(s.nb), couleur: couleursCamembert[i % couleursCamembert.length] })) : []
  const totalRemiseCE = d?.remises_ce?.reduce((s, r) => s + parseFloat(r.remise_accordee as any), 0) || 0

  if (chargement && !d) return <div style={{ textAlign: 'center', padding: '80px', color: C.texteSecondaire, fontFamily: FONT }}>Chargement...</div>
  if (!d) return <div style={{ textAlign: 'center', padding: '80px', color: C.rouge, fontFamily: FONT }}>Erreur de chargement</div>

  return (
    <div>
      {/* Alerte couverture */}
      {d && d.couverture_prix_achat < 100 && (
        <div style={{ backgroundColor: '#fff8e6', border: `1px solid ${C.or}`, borderRadius: '10px', padding: '12px 18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '18px' }}>⚠️</span>
          <div>
            <p style={{ fontSize: '13px', fontWeight: '600', color: C.orIntense, margin: '0 0 2px', fontFamily: FONT }}>Prix d'achat manquant sur {100 - d.couverture_prix_achat}% des ventes</p>
            <p style={{ fontSize: '12px', color: C.texteSecondaire, margin: 0, fontFamily: FONT }}>Marge partiellement estimée ({d.taux_marge_estime}% appliqué). Importez un CSV avec colonne "remise" pour des données réelles.</p>
          </div>
        </div>
      )}

      {/* KPIs et données — rendus seulement si d disponible */}
      {d && <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px', marginBottom: '24px' }}>
        <KPI label="CA HT" valeur={euros(d.ca_ht)} evolution={evolution} accent={C.vert} />
        <KPI label="Marge brute" valeur={euros(d.marge_brute)} sous={`Taux : ${d.taux_marge}%`} accent={C.or} />
        <KPI label="Charges (période)" valeur={euros(d.charges_periode)} sous={`${euros(d.charges_mensuelles)} / mois`} accent={C.rouge} />
        <KPI label="Résultat exploit." valeur={euros(d.resultat_exploitation)} accent={d.resultat_exploitation >= 0 ? C.vert : C.rouge} />
        <KPI label="Ventes" valeur={d.nb_ventes.toString()} sous="exemplaires" accent={C.vert} />
        <KPI label="Panier moyen" valeur={euros(d.panier_moyen)} accent={C.vert} />
      </div>

      {/* Charges fixes */}
      <ModuleCharges token={token} onUpdate={handleChargesUpdate} />

      {/* Compte de résultat */}
      <CompteResultat d={d} periode={periode} />

      {/* Graphique */}
      <Carte style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <SectionTitre>Évolution mensuelle</SectionTitre>
          <button onClick={() => setAfficherMarge(!afficherMarge)} style={{ padding: '4px 12px', borderRadius: '6px', border: `1px solid ${C.fondAlt}`, backgroundColor: afficherMarge ? C.fondAlt : 'white', color: afficherMarge ? C.vert : C.texteSecondaire, fontSize: '12px', cursor: 'pointer', fontFamily: FONT }}>
            {afficherMarge ? '✓ Marge visible' : '○ Afficher marge'}
          </button>
        </div>
        <BarChart
          data={d.ca_mensuel.map(m => ({ label: moisCourt(m.mois), valeur: parseFloat(m.ca as any) / TVA_CONST, valeur2: afficherMarge ? parseFloat(m.marge as any) : undefined }))}
          couleur={C.vert} couleur2={afficherMarge ? C.or : undefined} label2="Marge brute"
        />
      </Carte>

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '24px', marginBottom: '24px' }}>
        {/* Top livres */}
        <Carte>
          <SectionTitre>Top 10 livres</SectionTitre>
          {d.top_livres.length === 0 && <p style={{ color: C.texteSecondaire, fontSize: '13px', fontFamily: FONT }}>Aucune vente sur cette période</p>}
          {d.top_livres.map((l, i) => {
            const caHT = parseFloat(l.ca_ht as any)
            const marge = parseFloat(l.marge_brute as any)
            const taux = caHT > 0 ? Math.round((marge / caHT) * 100) : 0
            return (
              <div key={i} style={{ padding: '10px 0', borderBottom: i < d.top_livres.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, minWidth: 0, marginRight: '12px' }}>
                    <p style={{ fontSize: '13px', fontWeight: '600', color: C.texte, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: FONT }}>
                      <span style={{ color: C.or, marginRight: '6px' }}>#{i + 1}</span>{l.titre}
                    </p>
                    <p style={{ fontSize: '11px', color: C.texteSecondaire, margin: 0, fontFamily: FONT }}>{l.auteur} · {l.nb_vendus} ex.</p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontSize: '13px', fontWeight: '700', color: C.vert, margin: '0 0 2px', fontFamily: FONT }}>{euros(parseFloat(l.ca as any))}</p>
                    <span style={{ fontSize: '11px', color: taux > 25 ? C.vert : C.orIntense, fontWeight: '600', fontFamily: FONT }}>
                      marge {taux}%
                      <span style={{ fontSize: '10px', backgroundColor: l.source_marge === 'estime' ? '#fff8e6' : C.fondAlt, color: l.source_marge === 'estime' ? C.orIntense : C.vert, padding: '1px 5px', borderRadius: '10px', marginLeft: '4px' }}>
                        {l.source_marge === 'estime' ? '~' : '✓'}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </Carte>

        {/* Statuts */}
        <Carte>
          <SectionTitre>Statuts des commandes</SectionTitre>
          <Camembert data={statutsData} />
        </Carte>
      </div>

      {/* Remises CE */}
      {d.remises_ce && d.remises_ce.length > 0 && (
        <Carte style={{ borderLeft: `4px solid ${C.or}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <SectionTitre>Remises CE accordées</SectionTitre>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '11px', color: C.texteSecondaire, margin: '0 0 2px', fontFamily: FONT }}>Total manque à gagner</p>
              <p style={{ fontSize: '20px', fontWeight: '700', color: C.orIntense, margin: 0, fontFamily: FONT }}>{euros(totalRemiseCE)}</p>
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #eee' }}>
                  {['CE', 'Remise', 'Ventes', 'CA facturé', 'Prix public', 'Remise accordée'].map(h => (
                    <th key={h} style={{ textAlign: ['CE','Remise'].includes(h) ? 'left' : 'right', padding: '8px 12px', color: C.texteSecondaire, fontWeight: '600', fontSize: '11px', letterSpacing: '1px', fontFamily: FONT }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {d.remises_ce.map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f5f5f5' }}>
                    <td style={{ padding: '10px 12px', fontWeight: '600', color: C.texte, fontFamily: FONT }}>{r.ce_nom}</td>
                    <td style={{ padding: '10px 12px', fontFamily: FONT }}><span style={{ backgroundColor: C.fondAlt, color: C.vert, padding: '2px 8px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>-{r.taux_remise}%</span></td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', color: C.texteSecondaire, fontFamily: FONT }}>{r.nb_ventes}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '600', color: C.texte, fontFamily: FONT }}>{euros(parseFloat(r.ca_facture as any))}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', color: C.texteSecondaire, fontFamily: FONT }}>{euros(parseFloat(r.ca_prix_public as any))}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '700', color: C.orIntense, fontFamily: FONT }}>−{euros(parseFloat(r.remise_accordee as any))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Carte>
      )}
      </div>}
    </div>
  )
}

const TVA_CONST = 1.055

// ── Onglet Clients ─────────────────────────────────────────────────────────────

function OngletClients({ token, periode }: { token: string; periode: Periode }) {
  const [d, setD] = useState<DonneesClients | null>(null)
  const [chargement, setChargement] = useState(true)

  useEffect(() => {
    setChargement(true)
    fetch(`http://localhost:3001/api/analytics/clients?periode=${periode}`, { headers: { Authorization: 'Bearer ' + token } })
      .then(r => r.json()).then(data => { setD(data); setChargement(false) }).catch(() => setChargement(false))
  }, [periode])

  if (chargement) return <div style={{ textAlign: 'center', padding: '80px', color: C.texteSecondaire, fontFamily: FONT }}>Chargement...</div>
  if (!d) return <div style={{ textAlign: 'center', padding: '80px', color: C.rouge, fontFamily: FONT }}>Erreur de chargement</div>

  const clientsActifs = d.clients_actifs ?? 0
  const tauxActifs = d.total_clients > 0 ? Math.round((clientsActifs / d.total_clients) * 100) : 0
  const ceData = (d.repartition_ce || []).map((r, i) => ({ label: r.type, valeur: Number(r.nb), couleur: i === 0 ? C.vert : C.or }))

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '24px' }}>
        <KPI label="Clients inscrits" valeur={d.total_clients.toString()} />
        <KPI label="Clients actifs" valeur={clientsActifs.toString()} sous={`${tauxActifs}% ont commandé`} />
        <KPI label="Sans achat" valeur={(d.total_clients - clientsActifs).toString()} sous="À activer" accent={C.orIntense} />
        <KPI label="C&C en attente" valeur={d.commandes_attente.toString()} sous="À préparer" accent={C.orIntense} />
      </div>
      <Carte style={{ marginBottom: '24px' }}>
        <SectionTitre>Nouvelles inscriptions par mois</SectionTitre>
        <BarChart data={d.clients_mensuel.map(m => ({ label: moisCourt(m.mois), valeur: parseInt(m.nb as any) }))} couleur={C.or} />
      </Carte>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        <Carte>
          <SectionTitre>Opt-in emails</SectionTitre>
          <Progressbar label="Recommandations mensuelles" valeur={d.optins?.recos || 0} max={d.optins?.total || 1} detail={`${d.optins?.recos || 0} / ${d.optins?.total || 0}`} />
          <Progressbar label="Relance saga" valeur={d.optins?.relance || 0} max={d.optins?.total || 1} detail={`${d.optins?.relance || 0} / ${d.optins?.total || 0}`} />
          <div style={{ marginTop: '16px', padding: '12px 16px', backgroundColor: C.fondAlt, borderRadius: '8px' }}>
            <p style={{ fontSize: '12px', color: C.texteSecondaire, margin: '0 0 4px', fontFamily: FONT }}>Taux opt-in recommandations</p>
            <p style={{ fontSize: '22px', fontWeight: '700', color: C.vert, margin: 0, fontFamily: FONT }}>{d.optins?.total ? Math.round((d.optins.recos / d.optins.total) * 100) : 0}%</p>
          </div>
        </Carte>
        <Carte>
          <SectionTitre>Clients CE vs Standard</SectionTitre>
          <Camembert data={ceData} />
        </Carte>
      </div>
      <Carte>
        <SectionTitre>Top 10 clients</SectionTitre>
        {d.top_clients.length === 0 && <p style={{ color: C.texteSecondaire, fontSize: '13px', fontFamily: FONT }}>Aucun achat enregistré</p>}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead><tr style={{ borderBottom: '2px solid #eee' }}>{['#','Client','Email','Achats','CA total'].map(h => <th key={h} style={{ textAlign: ['Achats','CA total'].includes(h)?'right':'left', padding: '8px 12px', color: C.texteSecondaire, fontWeight: '600', fontSize: '11px', letterSpacing: '1px', fontFamily: FONT }}>{h}</th>)}</tr></thead>
            <tbody>{d.top_clients.map((c, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #f5f5f5' }}>
                <td style={{ padding: '10px 12px', color: C.or, fontWeight: '700', fontFamily: FONT }}>#{i+1}</td>
                <td style={{ padding: '10px 12px', fontWeight: '600', color: C.texte, fontFamily: FONT }}>{c.prenom} {c.nom}</td>
                <td style={{ padding: '10px 12px', fontSize: '12px', color: C.texteSecondaire, fontFamily: FONT }}>{c.email}</td>
                <td style={{ padding: '10px 12px', textAlign: 'right', color: C.texteSecondaire, fontFamily: FONT }}>{c.nb_commandes}</td>
                <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '700', color: C.vert, fontFamily: FONT }}>{euros(parseFloat(c.ca_total as any))}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </Carte>
    </div>
  )
}

// ── Onglet Catalogue ───────────────────────────────────────────────────────────

function OngletCatalogue({ token }: { token: string }) {
  const [d, setD] = useState<DonneesCatalogue | null>(null)
  const [chargement, setChargement] = useState(true)

  useEffect(() => {
    fetch('http://localhost:3001/api/analytics/catalogue', { headers: { Authorization: 'Bearer ' + token } })
      .then(r => r.json()).then(data => { setD(data); setChargement(false) }).catch(() => setChargement(false))
  }, [])

  if (chargement) return <div style={{ textAlign: 'center', padding: '80px', color: C.texteSecondaire, fontFamily: FONT }}>Chargement...</div>
  if (!d) return <div style={{ textAlign: 'center', padding: '80px', color: C.rouge, fontFamily: FONT }}>Erreur de chargement</div>

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '24px' }}>
        <KPI label="Titres au catalogue" valeur={d.total_livres.toString()} />
        <KPI label="Exemplaires en stock" valeur={d.stock_total.toString()} />
        <KPI label="Valeur stock TTC" valeur={euros(d.valeur_stock)} />
        <KPI label="Valeur stock achat" valeur={euros(d.valeur_stock_achat)} sous="Prix fournisseur" accent={C.orIntense} />
        <KPI label="Ruptures" valeur={d.ruptures.length.toString()} accent={d.ruptures.length > 0 ? C.rouge : C.vert} />
      </div>
      {d.couverture_prix_achat < 100 && (
        <div style={{ backgroundColor: '#fff8e6', border: `1px solid ${C.or}`, borderRadius: '10px', padding: '12px 18px', marginBottom: '20px' }}>
          <Progressbar label={`Prix d'achat renseigné`} valeur={d.couverture_prix_achat} max={100} detail={`${d.couverture_prix_achat}% du catalogue`} />
          <p style={{ fontSize: '12px', color: C.texteSecondaire, margin: 0, fontFamily: FONT }}>Importez un CSV avec colonne "remise" pour enrichir automatiquement.</p>
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        <Carte>
          <SectionTitre>Répartition par genre</SectionTitre>
          <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
            {d.genres.map((g, i) => <Progressbar key={i} label={g.genre} valeur={g.nb_titres} max={d.total_livres} detail={`${g.nb_titres} titres · ${g.stock_total} ex.`} />)}
          </div>
        </Carte>
        <Carte>
          <SectionTitre>Ventes par genre</SectionTitre>
          <BarChart data={(d.genres_ventes || []).map(g => ({ label: g.genre.slice(0, 8), valeur: Number(g.nb_ventes) }))} couleur={C.orIntense} />
        </Carte>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <Carte>
          <SectionTitre>Stock faible</SectionTitre>
          {d.stock_faible.length === 0 ? <p style={{ color: C.texteSecondaire, fontSize: '13px', fontFamily: FONT }}>Aucun livre en stock faible</p> : (
            <div style={{ maxHeight: '260px', overflowY: 'auto' }}>
              {d.stock_faible.map((l, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < d.stock_faible.length - 1 ? '1px solid #f5f5f5' : 'none' }}>
                  <div style={{ flex: 1, minWidth: 0, marginRight: '8px' }}>
                    <p style={{ fontSize: '13px', fontWeight: '600', color: C.texte, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: FONT }}>{l.titre}</p>
                    <p style={{ fontSize: '11px', color: C.texteSecondaire, margin: 0, fontFamily: FONT }}>{l.auteur}</p>
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: '700', padding: '2px 8px', borderRadius: '12px', backgroundColor: l.stock === 1 ? C.rougeAlt : '#fff3e0', color: l.stock === 1 ? C.rouge : '#e65100', flexShrink: 0 }}>{l.stock} ex.</span>
                </div>
              ))}
            </div>
          )}
        </Carte>
        {d.ruptures.length > 0 ? (
          <Carte style={{ borderLeft: `4px solid ${C.rouge}` }}>
            <SectionTitre>Ruptures — {d.ruptures.length} titre{d.ruptures.length > 1 ? 's' : ''}</SectionTitre>
            <div style={{ maxHeight: '260px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {d.ruptures.map((l, i) => (
                <div key={i} style={{ backgroundColor: C.rougeAlt, borderRadius: '8px', padding: '9px 12px' }}>
                  <p style={{ fontSize: '13px', fontWeight: '600', color: C.texte, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: FONT }}>{l.titre}</p>
                  <p style={{ fontSize: '11px', color: C.texteSecondaire, margin: 0, fontFamily: FONT }}>{l.auteur} · {l.prix} €</p>
                </div>
              ))}
            </div>
          </Carte>
        ) : (
          <Carte>
            <SectionTitre>Ruptures</SectionTitre>
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <p style={{ fontSize: '32px', margin: '0 0 8px' }}>✅</p>
              <p style={{ color: C.texteSecondaire, fontSize: '14px', margin: 0, fontFamily: FONT }}>Aucune rupture de stock</p>
            </div>
          </Carte>
        )}
      </div>
    </div>
  )
}

// ── Page principale ────────────────────────────────────────────────────────────

export default function Analytics() {
  const router = useRouter()
  const [onglet, setOnglet] = useState<'ventes' | 'clients' | 'catalogue'>('ventes')
  const [periode, setPeriode] = useState<Periode>('1an')
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    const t = localStorage.getItem('token')
    if (!t) { router.push('/admin'); return }
    setToken(t)
  }, [])

  if (!token) return null

  return (
    <div style={{ backgroundColor: C.fond, minHeight: '100vh', fontFamily: FONT }}>
      <header style={{ backgroundColor: C.vert, padding: '20px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ color: 'white', fontSize: '22px', fontWeight: '700', margin: 0, fontFamily: FONT }}>Bookdog</h1>
          <p style={{ color: C.fondAlt, fontSize: '13px', margin: '2px 0 0', fontFamily: FONT }}>Analytics</p>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <a href="/admin/dashboard" style={{ color: C.fondAlt, fontSize: '14px', textDecoration: 'none', fontFamily: FONT }}>← Dashboard</a>
          <a href="/" style={{ color: C.fondAlt, fontSize: '14px', textDecoration: 'none', fontFamily: FONT }}>Site public</a>
          <button onClick={() => { localStorage.removeItem('token'); router.push('/admin') }} style={{ backgroundColor: 'transparent', color: 'white', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '8px', padding: '8px 16px', fontSize: '14px', cursor: 'pointer', fontFamily: FONT }}>Déconnexion</button>
        </div>
      </header>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 24px 80px', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '4px', backgroundColor: 'white', padding: '4px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            {([{ id: 'ventes', label: '📈 Ventes' }, { id: 'clients', label: '👤 Clients' }, { id: 'catalogue', label: '📚 Catalogue' }] as { id: 'ventes'|'clients'|'catalogue'; label: string }[]).map(o => (
              <button key={o.id} onClick={() => setOnglet(o.id)} style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', backgroundColor: onglet === o.id ? C.vert : 'transparent', color: onglet === o.id ? 'white' : C.texteSecondaire, fontSize: '14px', fontWeight: onglet === o.id ? '700' : '400', cursor: 'pointer', fontFamily: FONT }}>
                {o.label}
              </button>
            ))}
          </div>
          {onglet !== 'catalogue' && <SelecteurPeriode periode={periode} onChange={setPeriode} />}
        </div>

        {onglet === 'ventes' && <OngletVentes token={token} periode={periode} />}
        {onglet === 'clients' && <OngletClients token={token} periode={periode} />}
        {onglet === 'catalogue' && <OngletCatalogue token={token} />}
      </main>

      <footer style={{ backgroundColor: C.footer, padding: '24px', textAlign: 'center' }}>
        <p style={{ color: C.fondAlt, fontSize: '13px', margin: 0, fontFamily: FONT }}>© 2026 Bookdog — Librairie indépendante Paris 17e</p>
      </footer>
    </div>
  )
}