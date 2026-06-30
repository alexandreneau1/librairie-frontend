'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from '../../../components/Header'
import { useFetchAuth } from '../../../lib/fetchAuth'

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
type Fiche = { id: number; livre_id: number; titre: string; auteur: string; isbn: string; note: number; commentaire: string | null; public: boolean; date_debut: string | null; date_fin: string | null; date_avis: string }
type LivreRecherche = { id: number; titre: string; auteur: string }

export default function Dashboard() {
  const router = useRouter()
  const { fetchAuth, deconnecter } = useFetchAuth()

  const [onglet, setOnglet] = useState<'commandes' | 'reservations' | 'achats' | 'wishlist' | 'lectures' | 'preferences'>('commandes')
  const [client, setClient] = useState<ClientInfo | null>(null)
  const [commandes, setCommandes] = useState<Commande[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [ventes, setVentes] = useState<Vente[]>([])
  const [wishlist, setWishlist] = useState<WishlistItem[]>([])
  const [chargement, setChargement] = useState(true)
  const [recommandations, setRecommandations] = useState<Recommandation[]>([])
  const [chargementReco, setChargementReco] = useState(false)
  const [recoChargees, setRecoChargees] = useState(false)

  const [rapprochement, setRapprochement] = useState<{ client_id: number; nb_achats: number } | null>(null)
  const [rapprochementVisible, setRapprochementVisible] = useState(false)

  // Fiches de lecture
  const [fiches, setFiches] = useState<Fiche[]>([])
  const [formOuvert, setFormOuvert] = useState(false)
  const [ficheEnEdition, setFicheEnEdition] = useState<Fiche | null>(null)
  const [rechercheTitre, setRechercheTitre] = useState('')
  const [resultatsRecherche, setResultatsRecherche] = useState<LivreRecherche[]>([])
  const [livreSelectionne, setLivreSelectionne] = useState<LivreRecherche | null>(null)
  const [formNote, setFormNote] = useState(0)
  const [formCommentaire, setFormCommentaire] = useState('')
  const [formPublic, setFormPublic] = useState(false)
  const [formDateDebut, setFormDateDebut] = useState('')
  const [formDateFin, setFormDateFin] = useState('')
  const [formErreur, setFormErreur] = useState('')
  const [formEnvoi, setFormEnvoi] = useState(false)

  // Préférences emails
  const [emailRecommandations, setEmailRecommandations] = useState(true)
  const [emailRelanceSaga, setEmailRelanceSaga] = useState(true)
  const [savingPrefs, setSavingPrefs] = useState(false)
  const [prefsSaved, setPrefsSaved] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('clientToken')
    const info = localStorage.getItem('clientInfo')
    if (!token || !info) { router.push('/compte/connexion'); return }

    try {
      const parsed: ClientInfo = JSON.parse(info)
      setClient(parsed)
    } catch {
      deconnecter()
      return
    }

    if (!sessionStorage.getItem('rapprochementFerme')) {
      const stored = localStorage.getItem('rapprochementPropose')
      if (stored) {
        try {
          setRapprochement(JSON.parse(stored))
          setRapprochementVisible(true)
        } catch {}
      }
    }

    Promise.all([
      fetchAuth('http://localhost:3001/compte/historique')
        .then(res => res ? res.json() : null)
        .then(data => {
          if (!data) return
          setCommandes(Array.isArray(data?.commandes) ? data.commandes : [])
          setReservations(Array.isArray(data?.reservations) ? data.reservations : [])
          setVentes(Array.isArray(data?.ventes) ? data.ventes : [])
        })
        .catch(() => {}),

      fetchAuth('http://localhost:3001/compte/wishlist')
        .then(res => res ? res.json() : null)
        .then(data => {
          if (data === null) return
          setWishlist(Array.isArray(data) ? data : [])
        })
        .catch(() => {}),

      fetchAuth('http://localhost:3001/compte/preferences')
        .then(res => res ? res.json() : null)
        .then(data => {
          if (!data) return
          setEmailRecommandations(data?.email_recommandations ?? true)
          setEmailRelanceSaga(data?.email_relance_saga ?? true)
        })
        .catch(() => {}),

      fetchAuth('http://localhost:3001/avis/mes-fiches')
        .then(res => res ? res.json() : null)
        .then(data => {
          if (data === null) return
          setFiches(Array.isArray(data) ? data : [])
        })
        .catch(() => {}),
    ]).finally(() => setChargement(false))
  }, [router, fetchAuth, deconnecter])

  async function confirmerRapprochement(accepte: boolean) {
    if (!rapprochement) return
    await fetchAuth('http://localhost:3001/compte/rapprochement/confirmer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: rapprochement.client_id, accepte }),
    })
    localStorage.removeItem('rapprochementPropose')
    setRapprochementVisible(false)
    if (accepte) {
      fetchAuth('http://localhost:3001/compte/historique')
        .then(res => res ? res.json() : null)
        .then(data => {
          if (!data) return
          setCommandes(Array.isArray(data?.commandes) ? data.commandes : [])
          setReservations(Array.isArray(data?.reservations) ? data.reservations : [])
          setVentes(Array.isArray(data?.ventes) ? data.ventes : [])
        })
        .catch(() => {})
    }
  }

  function fermerBandeauSession() {
    sessionStorage.setItem('rapprochementFerme', '1')
    setRapprochementVisible(false)
  }

  // Recherche de livre débouncée (formulaire "Ajouter une lecture")
  useEffect(() => {
    if (!formOuvert || ficheEnEdition || rechercheTitre.trim().length < 2) {
      setResultatsRecherche([])
      return
    }
    const handle = setTimeout(() => {
      fetch(`http://localhost:3001/livres?titre=${encodeURIComponent(rechercheTitre.trim())}`)
        .then(r => r.json())
        .then(data => setResultatsRecherche(Array.isArray(data) ? data.slice(0, 8) : []))
        .catch(() => {})
    }, 300)
    return () => clearTimeout(handle)
  }, [rechercheTitre, formOuvert, ficheEnEdition])

  function ouvrirAjoutLecture() {
    setFicheEnEdition(null)
    setLivreSelectionne(null)
    setRechercheTitre('')
    setResultatsRecherche([])
    setFormNote(0)
    setFormCommentaire('')
    setFormPublic(false)
    setFormDateDebut('')
    setFormDateFin('')
    setFormErreur('')
    setFormOuvert(true)
  }

  function ouvrirEditionFiche(fiche: Fiche) {
    setFicheEnEdition(fiche)
    setLivreSelectionne({ id: fiche.livre_id, titre: fiche.titre, auteur: fiche.auteur })
    setFormNote(fiche.note)
    setFormCommentaire(fiche.commentaire || '')
    setFormPublic(fiche.public)
    setFormDateDebut(fiche.date_debut ? fiche.date_debut.slice(0, 10) : '')
    setFormDateFin(fiche.date_fin ? fiche.date_fin.slice(0, 10) : '')
    setFormErreur('')
    setFormOuvert(true)
  }

  function selectionnerLivreRecherche(livre: LivreRecherche) {
    const ficheExistante = fiches.find(f => f.livre_id === livre.id)
    if (ficheExistante) {
      ouvrirEditionFiche(ficheExistante)
    } else {
      setLivreSelectionne(livre)
      setResultatsRecherche([])
      setRechercheTitre('')
    }
  }

  function fermerFormulaireLecture() {
    setFormOuvert(false)
    setFicheEnEdition(null)
    setLivreSelectionne(null)
  }

  async function enregistrerFiche() {
    if (!livreSelectionne) { setFormErreur('Sélectionnez un livre.'); return }
    if (formNote === 0) { setFormErreur('Veuillez sélectionner une note.'); return }
    setFormEnvoi(true)
    setFormErreur('')
    const body = JSON.stringify({
      note: formNote,
      commentaire: formCommentaire || null,
      public: formPublic,
      date_debut: formDateDebut || null,
      date_fin: formDateFin || null,
    })
    try {
      const url = ficheEnEdition
        ? `http://localhost:3001/avis/${ficheEnEdition.id}`
        : `http://localhost:3001/avis/${livreSelectionne.id}`
      const res = await fetchAuth(url, {
        method: ficheEnEdition ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      })
      if (!res) return
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setFormErreur(data?.message || 'Erreur lors de l\'enregistrement.')
        return
      }
      const saved = await res.json()
      const ficheMaj: Fiche = {
        ...saved,
        titre: livreSelectionne.titre,
        auteur: livreSelectionne.auteur,
        isbn: ficheEnEdition?.isbn || '',
      }
      setFiches(prev => {
        const sansCelle = prev.filter(f => f.id !== ficheMaj.id)
        return [ficheMaj, ...sansCelle]
      })
      fermerFormulaireLecture()
    } catch {
      setFormErreur('Impossible de contacter le serveur.')
    } finally {
      setFormEnvoi(false)
    }
  }

  async function toggleFichePublique(fiche: Fiche) {
    const res = await fetchAuth(`http://localhost:3001/avis/${fiche.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        note: fiche.note,
        commentaire: fiche.commentaire,
        public: !fiche.public,
        date_debut: fiche.date_debut,
        date_fin: fiche.date_fin,
      }),
    })
    if (!res || !res.ok) return
    setFiches(prev => prev.map(f => f.id === fiche.id ? { ...f, public: !f.public } : f))
  }

  async function supprimerFiche(id: number) {
    const res = await fetchAuth(`http://localhost:3001/avis/${id}`, { method: 'DELETE' })
    if (!res) return
    setFiches(prev => prev.filter(f => f.id !== id))
  }

  function formatPeriodeLecture(fiche: Fiche) {
    if (fiche.date_debut && fiche.date_fin) return `Lu du ${formatDate(fiche.date_debut)} au ${formatDate(fiche.date_fin)}`
    if (fiche.date_fin) return `Terminé le ${formatDate(fiche.date_fin)}`
    if (fiche.date_debut) return `Commencé le ${formatDate(fiche.date_debut)}`
    return null
  }

  async function chargerRecommandations() {
    setChargementReco(true)
    try {
      const res = await fetchAuth('http://localhost:3001/api/recommandations')
      if (!res) return
      const data = await res.json()
      if (Array.isArray(data?.recommandations)) setRecommandations(data.recommandations)
    } catch {}
    setChargementReco(false)
    setRecoChargees(true)
  }

  async function sauvegarderPreferences() {
    setSavingPrefs(true)
    try {
      const res = await fetchAuth('http://localhost:3001/compte/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email_recommandations: emailRecommandations, email_relance_saga: emailRelanceSaga }),
      })
      if (!res) return
      setPrefsSaved(true)
      setTimeout(() => setPrefsSaved(false), 3000)
    } catch {}
    setSavingPrefs(false)
  }

  async function retirerWishlist(livre_id: number) {
    const res = await fetchAuth('http://localhost:3001/compte/wishlist/' + livre_id, { method: 'DELETE' })
    if (!res) return
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

  const onglets = [
    ...(ce
      ? [{ id: 'commandes', label: 'Mes commandes', count: commandes.length + reservations.length }]
      : [
          { id: 'commandes',    label: 'Click & Collect', count: commandes.length },
          { id: 'reservations', label: 'Réservations',    count: reservations.length },
        ]),
    { id: 'achats',      label: 'Achats en magasin', count: ventes.length },
    { id: 'wishlist',    label: 'Wishlist',          count: wishlist.length },
    { id: 'lectures',    label: '📖 Mes lectures',   count: fiches.length },
    { id: 'preferences', label: '⚙️ Préférences',   count: 0 },
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
      <Header pageCourante="" />

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '48px 24px 80px', boxSizing: 'border-box' }}>

        {/* En-tête */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <p style={{ color: C.texteSecondaire, fontSize: '13px', letterSpacing: '2px', margin: '0 0 6px', fontFamily: FONT }}>Espace client</p>
            <h1 style={{ fontSize: '32px', fontWeight: '700', color: C.texte, margin: 0, fontFamily: FONT }}>Bonjour, {client?.prenom}</h1>
            <p style={{ fontSize: '15px', color: C.texteSecondaire, margin: '6px 0 8px', fontFamily: FONT }}>{client?.email}</p>
            <button onClick={() => deconnecter()}
              style={{ backgroundColor: 'transparent', border: `1px solid ${C.texteSecondaire}`, color: C.texteSecondaire, fontSize: '13px', cursor: 'pointer', fontFamily: FONT, padding: '6px 16px', borderRadius: '40px' }}>
              Déconnexion
            </button>
          </div>
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

        {/* Bandeau rapprochement magasin ↔ web */}
        {rapprochementVisible && rapprochement && (
          <div style={{ backgroundColor: C.fondAlt, border: `1px solid ${C.or}`, borderRadius: '14px', padding: '20px 24px', marginBottom: '32px', position: 'relative', fontFamily: FONT }}>
            <button onClick={fermerBandeauSession}
              style={{ position: 'absolute', top: '12px', right: '16px', background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: C.texteSecondaire }}>
              ✕
            </button>
            <p style={{ fontSize: '13px', color: C.vert, fontWeight: '700', letterSpacing: '1px', margin: '0 0 6px', fontFamily: FONT }}>HISTORIQUE MAGASIN</p>
            <p style={{ fontSize: '16px', color: C.texte, margin: '0 0 16px', fontFamily: FONT }}>
              Nous avons trouvé <strong>{rapprochement.nb_achats} achat{rapprochement.nb_achats > 1 ? 's' : ''}</strong> à votre nom en magasin — voulez-vous les ajouter à votre historique ?
            </p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button onClick={() => confirmerRapprochement(true)}
                style={{ padding: '10px 24px', backgroundColor: C.vert, color: 'white', border: 'none', borderRadius: '40px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', fontFamily: FONT }}>
                Oui, ajouter mon historique
              </button>
              <button onClick={() => confirmerRapprochement(false)}
                style={{ padding: '10px 24px', backgroundColor: 'white', color: C.texteSecondaire, border: `1px solid ${C.texteSecondaire}`, borderRadius: '40px', fontSize: '14px', cursor: 'pointer', fontFamily: FONT }}>
                Non, garder séparé
              </button>
            </div>
          </div>
        )}

        {/* Recommandations IA */}
        <div style={{ backgroundColor: C.vert, borderRadius: '16px', padding: '28px 32px', marginBottom: '40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: recoChargees && recommandations.length > 0 ? '24px' : '0', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <p style={{ color: C.or, fontSize: '11px', letterSpacing: '2px', fontWeight: '600', margin: '0 0 4px', fontFamily: FONT }}>INTELLIGENCE ARTIFICIELLE</p>
              <h3 style={{ color: 'white', fontSize: '20px', fontWeight: '700', margin: 0, fontFamily: FONT }}>Nos suggestions pour vous</h3>
            </div>
            {!recoChargees
              ? <button onClick={chargerRecommandations} disabled={chargementReco}
                  style={{ backgroundColor: chargementReco ? 'rgba(255,255,255,0.1)' : C.or, color: chargementReco ? 'rgba(255,255,255,0.5)' : C.vert, border: 'none', borderRadius: '40px', padding: '10px 24px', fontSize: '14px', fontWeight: '700', cursor: chargementReco ? 'not-allowed' : 'pointer', fontFamily: FONT, whiteSpace: 'nowrap' as const }}>
                  {chargementReco ? '✨ Analyse en cours...' : '✨ Obtenir mes recommandations'}
                </button>
              : <button onClick={chargerRecommandations} disabled={chargementReco}
                  style={{ backgroundColor: 'transparent', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '40px', padding: '8px 16px', fontSize: '12px', cursor: chargementReco ? 'not-allowed' : 'pointer', fontFamily: FONT }}>
                  {chargementReco ? '...' : '↺ Actualiser'}
                </button>}
          </div>
          {chargementReco && !recoChargees && <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', margin: '16px 0 0', fontFamily: FONT }}>Notre libraire IA analyse vos lectures...</p>}
          {recoChargees && recommandations.length === 0 && <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', marginTop: '16px', fontFamily: FONT }}>Aucune recommandation disponible pour le moment.</p>}
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

        {/* Onglets */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', flexWrap: 'wrap' }}>
          {onglets.map(o => (
            <button key={o.id} onClick={() => setOnglet(o.id as typeof onglet)}
              style={{ padding: '10px 22px', borderRadius: '40px', border: 'none', cursor: 'pointer', fontSize: '15px', fontFamily: FONT, fontWeight: onglet === o.id ? '700' : '400', backgroundColor: onglet === o.id ? C.vert : 'white', color: onglet === o.id ? 'white' : C.texteSecondaire, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', transition: 'all 0.15s' }}>
              {o.label}
              {o.count > 0 && <span style={{ marginLeft: '8px', backgroundColor: onglet === o.id ? 'rgba(255,255,255,0.25)' : C.fondAlt, color: onglet === o.id ? 'white' : C.vert, padding: '2px 8px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>{o.count}</span>}
            </button>
          ))}
        </div>

        {/* Click & Collect (sans CE) */}
        {onglet === 'commandes' && !ce && (
          <div>
            {commandes.length === 0 ? <EmptyState emoji="📦" texte="Aucune commande Click & Collect" />
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

        {/* Réservations (sans CE) */}
        {onglet === 'reservations' && !ce && (
          <div>
            {reservations.length === 0 ? <EmptyState emoji="📚" texte="Aucune réservation" />
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

        {/* Mes commandes (CE — fusionné) */}
        {onglet === 'commandes' && ce && (
          <div>
            {commandes.length === 0 && reservations.length === 0 ? <EmptyState emoji="📦" texte="Aucune commande pour le moment" />
              : <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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

        {/* Achats en magasin */}
        {onglet === 'achats' && (
          <div>
            {ventes.length === 0 ? <EmptyState emoji="🛍️" texte="Aucun achat en magasin enregistré" />
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

        {/* Wishlist */}
        {onglet === 'wishlist' && (
          <div>
            {wishlist.length === 0 ? <EmptyState emoji="♡" texte="Votre wishlist est vide" />
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
                        <a href={`/livres/${w.livre_id}`} style={{ flex: 1, textAlign: 'center', padding: '10px', backgroundColor: C.vert, color: 'white', borderRadius: '40px', textDecoration: 'none', fontSize: '14px', fontWeight: '700', fontFamily: FONT }}>Voir le livre</a>
                        <button onClick={() => retirerWishlist(w.livre_id)} style={{ padding: '10px 14px', backgroundColor: '#fff0f0', color: '#c0392b', border: 'none', borderRadius: '40px', fontSize: '14px', cursor: 'pointer', fontFamily: FONT }}>✕</button>
                      </div>
                    </div>
                  ))}
                </div>}
          </div>
        )}

        {/* Mes lectures */}
        {onglet === 'lectures' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
              {!formOuvert && (
                <button onClick={ouvrirAjoutLecture}
                  style={{ padding: '10px 22px', backgroundColor: C.vert, color: 'white', border: 'none', borderRadius: '40px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', fontFamily: FONT }}>
                  + Ajouter une lecture
                </button>
              )}
            </div>

            {formOuvert && (
              <div style={{ backgroundColor: 'white', borderRadius: '14px', padding: '28px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginBottom: '28px' }}>
                <p style={{ fontSize: '16px', fontWeight: '700', color: C.vert, margin: '0 0 20px', fontFamily: FONT }}>
                  {ficheEnEdition ? 'Modifier ma fiche de lecture' : 'Ajouter une lecture'}
                </p>

                {!livreSelectionne && (
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '13px', color: C.texteSecondaire, marginBottom: '8px', fontFamily: FONT }}>Rechercher un livre</label>
                    <input type="text" value={rechercheTitre} onChange={e => setRechercheTitre(e.target.value)}
                      placeholder="Titre du livre..."
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', boxSizing: 'border-box', fontFamily: FONT }} />
                    {resultatsRecherche.length > 0 && (
                      <div style={{ marginTop: '10px', border: '1px solid #eee', borderRadius: '8px', overflow: 'hidden' }}>
                        {resultatsRecherche.map(l => (
                          <button key={l.id} onClick={() => selectionnerLivreRecherche(l)}
                            style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px', background: 'white', border: 'none', borderBottom: '1px solid #f0f0f0', cursor: 'pointer', fontFamily: FONT }}>
                            <span style={{ fontSize: '14px', color: C.texte, fontWeight: '600' }}>{l.titre}</span>
                            <span style={{ fontSize: '13px', color: C.texteSecondaire, fontStyle: 'italic' }}> — {l.auteur}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {livreSelectionne && (
                  <>
                    <div style={{ backgroundColor: C.fondAlt, borderRadius: '10px', padding: '14px 16px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                      <div>
                        <p style={{ fontSize: '15px', fontWeight: '700', color: C.texte, margin: '0 0 2px', fontFamily: FONT }}>{livreSelectionne.titre}</p>
                        <p style={{ fontSize: '13px', color: C.texteSecondaire, margin: 0, fontStyle: 'italic', fontFamily: FONT }}>{livreSelectionne.auteur}</p>
                      </div>
                      {!ficheEnEdition && (
                        <button onClick={() => setLivreSelectionne(null)}
                          style={{ background: 'none', border: 'none', color: C.texteSecondaire, fontSize: '13px', cursor: 'pointer', fontFamily: FONT }}>
                          Changer
                        </button>
                      )}
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ display: 'block', fontSize: '13px', color: C.texteSecondaire, marginBottom: '8px', fontFamily: FONT }}>Note</label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {[1,2,3,4,5].map(i => (
                          <button key={i} onClick={() => setFormNote(i)} style={{ fontSize: '26px', background: 'none', border: 'none', cursor: 'pointer', color: i <= formNote ? C.or : '#ccc', padding: 0 }}>★</button>
                        ))}
                      </div>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ display: 'block', fontSize: '13px', color: C.texteSecondaire, marginBottom: '8px', fontFamily: FONT }}>Commentaire (optionnel)</label>
                      <textarea value={formCommentaire} onChange={e => setFormCommentaire(e.target.value)} rows={3}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', boxSizing: 'border-box', fontFamily: FONT, resize: 'vertical' }} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '13px', color: C.texteSecondaire, marginBottom: '8px', fontFamily: FONT }}>Début de lecture</label>
                        <input type="date" value={formDateDebut} onChange={e => setFormDateDebut(e.target.value)}
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', boxSizing: 'border-box', fontFamily: FONT }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '13px', color: C.texteSecondaire, marginBottom: '8px', fontFamily: FONT }}>Fin de lecture</label>
                        <input type="date" value={formDateFin} onChange={e => setFormDateFin(e.target.value)}
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', boxSizing: 'border-box', fontFamily: FONT }} />
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', backgroundColor: C.fond, borderRadius: '10px', padding: '14px 16px' }}>
                      <div>
                        <p style={{ fontSize: '14px', fontWeight: '600', color: C.texte, margin: '0 0 2px', fontFamily: FONT }}>Rendre public</p>
                        <p style={{ fontSize: '12px', color: C.texteSecondaire, margin: 0, fontFamily: FONT }}>Visible sur la fiche du livre par tous les visiteurs.</p>
                      </div>
                      <Toggle active={formPublic} onChange={setFormPublic} />
                    </div>

                    {formErreur && <p style={{ color: '#c0392b', fontSize: '13px', margin: '0 0 16px', fontFamily: FONT }}>{formErreur}</p>}

                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button onClick={enregistrerFiche} disabled={formEnvoi}
                        style={{ padding: '12px 28px', backgroundColor: formEnvoi ? '#aaa' : C.vert, color: 'white', border: 'none', borderRadius: '40px', fontSize: '14px', fontWeight: '700', cursor: formEnvoi ? 'not-allowed' : 'pointer', fontFamily: FONT }}>
                        {formEnvoi ? 'Enregistrement...' : 'Enregistrer'}
                      </button>
                      <button onClick={fermerFormulaireLecture}
                        style={{ padding: '12px 28px', backgroundColor: 'white', color: C.texteSecondaire, border: `1px solid ${C.texteSecondaire}`, borderRadius: '40px', fontSize: '14px', cursor: 'pointer', fontFamily: FONT }}>
                        Annuler
                      </button>
                    </div>
                  </>
                )}

                {!livreSelectionne && (
                  <button onClick={fermerFormulaireLecture}
                    style={{ marginTop: '8px', background: 'none', border: 'none', color: C.texteSecondaire, fontSize: '13px', cursor: 'pointer', fontFamily: FONT }}>
                    Annuler
                  </button>
                )}
              </div>
            )}

            {fiches.length === 0 ? <EmptyState emoji="📖" texte="Aucune fiche de lecture pour le moment" />
              : <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {fiches.map(f => (
                    <div key={f.id} style={carteStyle}>
                      <div>
                        <p style={{ fontWeight: '700', fontSize: '16px', margin: '0 0 4px', color: C.texte, fontFamily: FONT }}>{f.titre}</p>
                        <p style={{ fontSize: '14px', color: C.texteSecondaire, margin: '0 0 6px', fontStyle: 'italic', fontFamily: FONT }}>{f.auteur}</p>
                        <span style={{ fontSize: '15px', letterSpacing: '1px' }}>
                          {[1,2,3,4,5].map(i => <span key={i} style={{ color: i <= f.note ? C.or : '#ddd' }}>★</span>)}
                        </span>
                        {f.commentaire && <p style={{ fontSize: '13px', color: C.texte, margin: '8px 0 0', maxWidth: '480px', lineHeight: '1.5' }}>{f.commentaire}</p>}
                        {formatPeriodeLecture(f) && <p style={{ fontSize: '12px', color: '#bbb', margin: '8px 0 0', fontFamily: FONT }}>{formatPeriodeLecture(f)}</p>}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                        <button onClick={() => toggleFichePublique(f)}
                          style={{ fontSize: '12px', fontWeight: '600', padding: '4px 12px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontFamily: FONT, backgroundColor: f.public ? C.fondAlt : '#f5f5f5', color: f.public ? C.vert : C.texteSecondaire }}>
                          {f.public ? '🌍 Public' : '🔒 Privé'}
                        </button>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => ouvrirEditionFiche(f)}
                            style={{ padding: '6px 14px', backgroundColor: 'white', color: C.vert, border: `1px solid ${C.vert}`, borderRadius: '40px', fontSize: '12px', cursor: 'pointer', fontFamily: FONT }}>
                            Modifier
                          </button>
                          <button onClick={() => supprimerFiche(f.id)}
                            style={{ padding: '6px 14px', backgroundColor: '#fff0f0', color: '#c0392b', border: 'none', borderRadius: '40px', fontSize: '12px', cursor: 'pointer', fontFamily: FONT }}>
                            Supprimer
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>}
          </div>
        )}

        {/* Préférences */}
        {onglet === 'preferences' && (
          <div style={{ maxWidth: '600px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: '700', color: C.texte, margin: '0 0 8px', fontFamily: FONT }}>Mes préférences emails</h2>
            <p style={{ fontSize: '14px', color: C.texteSecondaire, margin: '0 0 32px', fontFamily: FONT }}>
              Gérez les emails que Bookdog vous envoie. Vous pouvez modifier ces préférences à tout moment.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>

              {/* Toggle recommandations mensuelles */}
              <div style={{ backgroundColor: 'white', borderRadius: '14px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '16px', fontWeight: '700', color: C.texte, margin: '0 0 4px', fontFamily: FONT }}>📚 Recommandations du mois</p>
                  <p style={{ fontSize: '13px', color: C.texteSecondaire, margin: 0, fontFamily: FONT, lineHeight: '1.6' }}>
                    Une sélection personnalisée de 3 livres basée sur vos lectures, envoyée le 1er de chaque mois.
                  </p>
                </div>
                <Toggle active={emailRecommandations} onChange={setEmailRecommandations} />
              </div>

              {/* Toggle relance saga */}
              <div style={{ backgroundColor: 'white', borderRadius: '14px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '16px', fontWeight: '700', color: C.texte, margin: '0 0 4px', fontFamily: FONT }}>📖 Rappels suite de série</p>
                  <p style={{ fontSize: '13px', color: C.texteSecondaire, margin: 0, fontFamily: FONT, lineHeight: '1.6' }}>
                    Quand vous achetez un tome, on vous rappelle la suite quelques semaines plus tard — le temps de le lire.
                  </p>
                </div>
                <Toggle active={emailRelanceSaga} onChange={setEmailRelanceSaga} />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button onClick={sauvegarderPreferences} disabled={savingPrefs}
                style={{ padding: '12px 32px', backgroundColor: savingPrefs ? '#aaa' : C.vert, color: 'white', border: 'none', borderRadius: '40px', fontSize: '15px', fontWeight: '700', cursor: savingPrefs ? 'not-allowed' : 'pointer', fontFamily: FONT }}>
                {savingPrefs ? 'Enregistrement...' : 'Enregistrer mes préférences'}
              </button>
              {prefsSaved && <span style={{ color: C.vert, fontSize: '14px', fontWeight: '600', fontFamily: FONT }}>✓ Sauvegardé</span>}
            </div>
          </div>
        )}
      </main>

      <footer style={{ backgroundColor: C.footer, padding: '28px', textAlign: 'center' }}>
        <p style={{ color: C.fondAlt, fontSize: '14px', margin: 0, fontFamily: FONT }}>2026 Bookdog — Librairie indépendante Paris 17e</p>
      </footer>
    </div>
  )
}

function Toggle({ active, onChange }: { active: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!active)}
      style={{ width: '52px', height: '28px', borderRadius: '14px', border: 'none', cursor: 'pointer', backgroundColor: active ? '#1A3C2E' : '#ddd', position: 'relative', flexShrink: 0, transition: 'background 0.2s' }}>
      <span style={{ position: 'absolute', top: '3px', left: active ? '27px' : '3px', width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'white', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)', display: 'block' }} />
    </button>
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