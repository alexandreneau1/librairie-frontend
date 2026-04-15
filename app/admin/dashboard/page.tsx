'use client'

import { useState, useEffect, useRef } from 'react'

const C = {
  vert: '#1A3C2E', or: '#D4AF37', orIntense: '#B8960C',
  fond: '#F9F6F0', fondAlt: '#EAF2EC', texte: '#1C1C1C',
  texteSecondaire: '#6B6B5E', footer: '#0f2419',
}
const FONT = 'Georgia, serif'

const GENRES = ['Roman','Policier','Science-fiction','Fantasy','Biographie','Histoire','Essai','Jeunesse','Bande dessinée','Poésie','Thriller','Romance','Développement personnel','Philosophie','Autre']
const TYPES_SELECTION = [{ value: 'coup_de_coeur', label: 'Coup de cœur' },{ value: 'prix', label: 'Prix littéraire' },{ value: 'top_vente', label: 'Top vente' }]
const CATEGORIES_EVENEMENT = ['Dédicace', 'Rencontre', 'Lecture', 'Club de lecture', 'Conférence', 'Atelier', 'Autre']

type Livre = { id: number; titre: string; auteur: string; isbn: string; prix: number; stock: number; genre: string | null; editeur: string | null; description: string | null; collection: string | null; date_publication: string | null; url_goodreads: string | null }
type Selection = { id: number; livre_id: number; type: string; label: string | null; rang: number | null; genre: string | null; actif: boolean; titre: string; auteur: string; isbn: string; prix: number; stock: number }
type Evenement = { id: number; titre: string; description: string | null; date_evenement: string; categorie: string | null; affiche_url: string | null; actif: boolean }
type CE = { id: number; nom: string; code: string; remise: number; adresse_livraison: string | null; contact_nom: string | null; contact_email: string | null; actif: boolean; date_creation: string; domaines: string[] }

type RapportImport = { message: string; total?: number; crees?: number; mis_a_jour?: number; ajoutes?: number; deja_presents?: number; ignores?: number; erreurs?: string[]; isbn_introuvable?: string[]; scrapes?: number; associes?: number; non_trouves_en_base?: number; non_trouves?: { rang: number; titre: string; auteur: string }[] }
type AperçuCatalogue = { colonnes_brutes: string[]; colonnes_mappees: Record<string, string | null>; apercu: Record<string, string>[]; total_estime: number; separateur: string }

export default function Dashboard() {
  const [onglet, setOnglet] = useState('reservations')
  const [reservations, setReservations] = useState([])
  const [commandes, setCommandes] = useState([])
  const [livres, setLivres] = useState<Livre[]>([])
  const [chargement, setChargement] = useState(true)

  // Catalogue
  const [formulaireLivre, setFormulaireLivre] = useState(false)
  const [livreEdite, setLivreEdite] = useState<Livre | null>(null)
  const [titre, setTitre] = useState(''); const [auteur, setAuteur] = useState(''); const [isbn, setIsbn] = useState('')
  const [prix, setPrix] = useState(''); const [stock, setStock] = useState(''); const [genre, setGenre] = useState('')
  const [description, setDescription] = useState(''); const [editeur, setEditeur] = useState('')
  const [collection, setCollection] = useState(''); const [datePublication, setDatePublication] = useState(''); const [urlGoodreads, setUrlGoodreads] = useState('')

  // Sélections
  const [selections, setSelections] = useState<Selection[]>([])
  const [typeSelectionne, setTypeSelectionne] = useState('coup_de_coeur')
  const [formulaireSelection, setFormulaireSelection] = useState(false)
  const [selectionEditee, setSelectionEditee] = useState<Selection | null>(null)
  const [selLivreId, setSelLivreId] = useState<number | null>(null)
  const [selType, setSelType] = useState('coup_de_coeur')
  const [selLabel, setSelLabel] = useState(''); const [selRang, setSelRang] = useState(''); const [selGenre, setSelGenre] = useState(''); const [selActif, setSelActif] = useState(true)
  const [rechercheAjout, setRechercheAjout] = useState(''); const [erreurSel, setErreurSel] = useState('')

  // Import
  const [fichierCatalogue, setFichierCatalogue] = useState<File | null>(null)
  const [fichierPrix, setFichierPrix] = useState<File | null>(null)
  const [aperçu, setAperçu] = useState<AperçuCatalogue | null>(null)
  const [chargementAperçu, setChargementAperçu] = useState(false)
  const [importEnCours, setImportEnCours] = useState<string | null>(null)
  const [rapportImport, setRapportImport] = useState<RapportImport | null>(null)
  const [erreurImport, setErreurImport] = useState<string | null>(null)
  const [scrapingEnCours, setScrapingEnCours] = useState(false)
  const inputCatalogueRef = useRef<HTMLInputElement>(null)
  const inputPrixRef = useRef<HTMLInputElement>(null)

  // Événements
  const [evenements, setEvenements] = useState<Evenement[]>([])
  const [formulaireEvenement, setFormulaireEvenement] = useState(false)
  const [evenementEdite, setEvenementEdite] = useState<Evenement | null>(null)
  const [evTitre, setEvTitre] = useState(''); const [evDescription, setEvDescription] = useState('')
  const [evDate, setEvDate] = useState(''); const [evCategorie, setEvCategorie] = useState('')
  const [evAfficheUrl, setEvAfficheUrl] = useState(''); const [evActif, setEvActif] = useState(true)

  // CE
  const [ces, setCes] = useState<CE[]>([])
  const [formulaireCE, setFormulaireCE] = useState(false)
  const [ceEdite, setCeEdite] = useState<CE | null>(null)
  const [ceNom, setCeNom] = useState(''); const [ceCode, setCeCode] = useState('')
  const [ceRemise, setCeRemise] = useState('5'); const [ceAdresse, setCeAdresse] = useState('')
  const [ceContactNom, setCeContactNom] = useState(''); const [ceContactEmail, setCeContactEmail] = useState('')
  const [ceActif, setCeActif] = useState(true)
  const [ceErreur, setCeErreur] = useState('')
  // Domaines
  const [ceExpandId, setCeExpandId] = useState<number | null>(null)
  const [nouveauDomaine, setNouveauDomaine] = useState('')
  const [erreurDomaine, setErreurDomaine] = useState('')

  const token = () => localStorage.getItem('token')
  const headers = () => ({ 'Authorization': 'Bearer ' + token() })
  const headersJson = () => ({ 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token() })

  const chargerDonnees = () => {
    fetch('http://localhost:3001/reservations', { headers: headers() }).then(r => r.json()).then(d => setReservations(Array.isArray(d) ? d : []))
    fetch('http://localhost:3001/commandes', { headers: headers() }).then(r => r.json()).then(d => setCommandes(Array.isArray(d) ? d : []))
    fetch('http://localhost:3001/livres').then(r => r.json()).then(d => { setLivres(Array.isArray(d) ? d : []); setChargement(false) })
  }
  const chargerSelections = () => {
    fetch('http://localhost:3001/selections').then(r => r.json()).then(d => {
      setSelections([...(d.coups_de_coeur||[]),...(d.prix||[]),...(d.top_ventes||[])])
    })
  }
  const chargerEvenements = () => {
    fetch('http://localhost:3001/evenements/tous', { headers: headers() }).then(r => r.json()).then(d => setEvenements(Array.isArray(d) ? d : [])).catch(() => {})
  }
  const chargerCEs = () => {
    fetch('http://localhost:3001/ce', { headers: headers() }).then(r => r.json()).then(d => setCes(Array.isArray(d) ? d : [])).catch(() => {})
  }

  useEffect(() => {
    if (!token()) { window.location.href = '/admin'; return }
    chargerDonnees(); chargerSelections(); chargerEvenements(); chargerCEs()
  }, [])

  // ── Réservations / Commandes ──────────────────────────────────────────────
  const changerStatutReservation = async (id: number, statut: string) => {
    await fetch(`http://localhost:3001/reservations/${id}/statut`, { method: 'PUT', headers: headersJson(), body: JSON.stringify({ statut }) })
    chargerDonnees()
  }
  const changerStatutCommande = async (id: number, statut: string) => {
    await fetch(`http://localhost:3001/commandes/${id}/statut`, { method: 'PUT', headers: headersJson(), body: JSON.stringify({ statut }) })
    chargerDonnees()
  }

  // ── Catalogue ─────────────────────────────────────────────────────────────
  const ouvrirFormulaire = (livre: Livre | null) => {
    if (livre) {
      setLivreEdite(livre); setTitre(livre.titre||''); setAuteur(livre.auteur||''); setIsbn(livre.isbn||'')
      setPrix(String(livre.prix||'')); setStock(String(livre.stock||'')); setGenre(livre.genre||'')
      setDescription(livre.description||''); setEditeur(livre.editeur||''); setCollection(livre.collection||'')
      setDatePublication(livre.date_publication||''); setUrlGoodreads(livre.url_goodreads||'')
    } else {
      setLivreEdite(null); setTitre(''); setAuteur(''); setIsbn(''); setPrix(''); setStock(''); setGenre('')
      setDescription(''); setEditeur(''); setCollection(''); setDatePublication(''); setUrlGoodreads('')
    }
    setFormulaireLivre(true)
  }
  const sauvegarderLivre = async () => {
    const body = JSON.stringify({ titre, auteur, isbn, prix: parseFloat(prix), stock: parseInt(stock), genre, description, editeur, collection, date_publication: datePublication, url_goodreads: urlGoodreads })
    if (livreEdite) await fetch(`http://localhost:3001/livres/${livreEdite.id}`, { method: 'PUT', headers: headersJson(), body })
    else await fetch('http://localhost:3001/livres', { method: 'POST', headers: headersJson(), body })
    setFormulaireLivre(false); chargerDonnees()
  }
  const supprimerLivre = async (id: number) => {
    if (!confirm('Supprimer ce livre ?')) return
    await fetch(`http://localhost:3001/livres/${id}`, { method: 'DELETE', headers: headers() })
    chargerDonnees()
  }

  // ── Sélections ────────────────────────────────────────────────────────────
  const livresFiltresAjout = livres.filter(l => {
    if (!rechercheAjout) return true
    const q = rechercheAjout.toLowerCase()
    return l.titre.toLowerCase().includes(q) || l.auteur.toLowerCase().includes(q)
  })
  const ouvrirFormulaireSelection = (sel: Selection | null) => {
    if (sel) {
      setSelectionEditee(sel); setSelLivreId(sel.livre_id); setSelType(sel.type)
      setSelLabel(sel.label||''); setSelRang(sel.rang!==null?String(sel.rang):''); setSelGenre(sel.genre||''); setSelActif(sel.actif)
    } else {
      setSelectionEditee(null); setSelLivreId(null); setSelType(typeSelectionne)
      setSelLabel(''); setSelRang(''); setSelGenre(''); setSelActif(true)
    }
    setRechercheAjout(''); setErreurSel(''); setFormulaireSelection(true)
  }
  const sauvegarderSelection = async () => {
    setErreurSel('')
    if (!selectionEditee && !selLivreId) { setErreurSel('Veuillez sélectionner un livre.'); return }
    if (selectionEditee) {
      await fetch(`http://localhost:3001/selections/${selectionEditee.id}`, { method: 'PUT', headers: headersJson(), body: JSON.stringify({ label: selLabel||null, rang: selRang?parseInt(selRang):null, genre: selGenre||null, actif: selActif }) })
    } else {
      await fetch('http://localhost:3001/selections', { method: 'POST', headers: headersJson(), body: JSON.stringify({ livre_id: selLivreId, type: selType, label: selLabel||null, rang: selRang?parseInt(selRang):null, genre: selGenre||null }) })
    }
    setFormulaireSelection(false); chargerSelections()
  }
  const supprimerSelection = async (id: number) => {
    if (!confirm('Retirer ce livre de la sélection ?')) return
    await fetch(`http://localhost:3001/selections/${id}`, { method: 'DELETE', headers: headers() })
    chargerSelections()
  }
  const toggleActif = async (sel: Selection) => {
    await fetch(`http://localhost:3001/selections/${sel.id}`, { method: 'PUT', headers: headersJson(), body: JSON.stringify({ label: sel.label, rang: sel.rang, genre: sel.genre, actif: !sel.actif }) })
    chargerSelections()
  }

  // ── Événements ────────────────────────────────────────────────────────────
  const ouvrirFormulaireEvenement = (ev: Evenement | null) => {
    if (ev) {
      setEvenementEdite(ev); setEvTitre(ev.titre); setEvDescription(ev.description||'')
      const d = new Date(ev.date_evenement)
      setEvDate(new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16))
      setEvCategorie(ev.categorie||''); setEvAfficheUrl(ev.affiche_url||''); setEvActif(ev.actif)
    } else {
      setEvenementEdite(null); setEvTitre(''); setEvDescription(''); setEvDate(''); setEvCategorie(''); setEvAfficheUrl(''); setEvActif(true)
    }
    setFormulaireEvenement(true)
  }
  const sauvegarderEvenement = async () => {
    if (!evTitre || !evDate) return
    const body = JSON.stringify({ titre: evTitre, description: evDescription||null, date_evenement: evDate, categorie: evCategorie||null, affiche_url: evAfficheUrl||null, actif: evActif })
    if (evenementEdite) await fetch(`http://localhost:3001/evenements/${evenementEdite.id}`, { method: 'PUT', headers: headersJson(), body })
    else await fetch('http://localhost:3001/evenements', { method: 'POST', headers: headersJson(), body })
    setFormulaireEvenement(false); chargerEvenements()
  }
  const supprimerEvenement = async (id: number) => {
    if (!confirm('Supprimer cet événement ?')) return
    await fetch(`http://localhost:3001/evenements/${id}`, { method: 'DELETE', headers: headers() })
    chargerEvenements()
  }
  const toggleActifEvenement = async (ev: Evenement) => {
    await fetch(`http://localhost:3001/evenements/${ev.id}`, { method: 'PUT', headers: headersJson(), body: JSON.stringify({ ...ev, actif: !ev.actif }) })
    chargerEvenements()
  }

  // ── CE ────────────────────────────────────────────────────────────────────
  const ouvrirFormulaireCE = (ce: CE | null) => {
    if (ce) {
      setCeEdite(ce); setCeNom(ce.nom); setCeCode(ce.code); setCeRemise(String(ce.remise))
      setCeAdresse(ce.adresse_livraison||''); setCeContactNom(ce.contact_nom||'')
      setCeContactEmail(ce.contact_email||''); setCeActif(ce.actif)
    } else {
      setCeEdite(null); setCeNom(''); setCeCode(''); setCeRemise('5')
      setCeAdresse(''); setCeContactNom(''); setCeContactEmail(''); setCeActif(true)
    }
    setCeErreur(''); setFormulaireCE(true)
  }

  const sauvegarderCE = async () => {
    setCeErreur('')
    if (!ceNom || !ceCode) { setCeErreur('Nom et code requis'); return }
    try {
      if (ceEdite) {
        const res = await fetch(`http://localhost:3001/ce/${ceEdite.id}`, {
          method: 'PUT', headers: headersJson(),
          body: JSON.stringify({ nom: ceNom, remise: parseFloat(ceRemise)||5, adresse_livraison: ceAdresse||null, contact_nom: ceContactNom||null, contact_email: ceContactEmail||null, actif: ceActif })
        })
        if (!res.ok) { const d = await res.json(); setCeErreur(d.message); return }
      } else {
        const res = await fetch('http://localhost:3001/ce', {
          method: 'POST', headers: headersJson(),
          body: JSON.stringify({ nom: ceNom, code: ceCode.toLowerCase().trim(), remise: parseFloat(ceRemise)||5, adresse_livraison: ceAdresse||null, contact_nom: ceContactNom||null, contact_email: ceContactEmail||null })
        })
        if (!res.ok) { const d = await res.json(); setCeErreur(d.message); return }
      }
      setFormulaireCE(false); chargerCEs()
    } catch { setCeErreur('Impossible de contacter le serveur') }
  }

  const supprimerCE = async (id: number) => {
    if (!confirm('Supprimer ce CE ? Les comptes clients liés perdront leur remise.')) return
    await fetch(`http://localhost:3001/ce/${id}`, { method: 'DELETE', headers: headers() })
    chargerCEs()
  }

  const toggleActifCE = async (ce: CE) => {
    await fetch(`http://localhost:3001/ce/${ce.id}`, {
      method: 'PUT', headers: headersJson(),
      body: JSON.stringify({ nom: ce.nom, remise: ce.remise, adresse_livraison: ce.adresse_livraison, contact_nom: ce.contact_nom, contact_email: ce.contact_email, actif: !ce.actif })
    })
    chargerCEs()
  }

  const ajouterDomaine = async (ceId: number) => {
    setErreurDomaine('')
    const dom = nouveauDomaine.toLowerCase().trim()
    if (!dom) { setErreurDomaine('Domaine requis'); return }
    try {
      const res = await fetch(`http://localhost:3001/ce/${ceId}/domaines`, {
        method: 'POST', headers: headersJson(), body: JSON.stringify({ domaine: dom })
      })
      const data = await res.json()
      if (!res.ok) { setErreurDomaine(data.message); return }
      setNouveauDomaine(''); chargerCEs()
    } catch { setErreurDomaine('Erreur serveur') }
  }

  const supprimerDomaine = async (domaineId: number) => {
    await fetch(`http://localhost:3001/ce/domaines/${domaineId}`, { method: 'DELETE', headers: headers() })
    chargerCEs()
  }

  // ── Import ────────────────────────────────────────────────────────────────
  const chargerAperçu = async (fichier: File) => {
    setChargementAperçu(true); setAperçu(null); setErreurImport(null)
    const fd = new FormData(); fd.append('fichier', fichier)
    try {
      const res = await fetch('http://localhost:3001/import/apercu-catalogue', { method: 'POST', headers: headers(), body: fd })
      const data = await res.json()
      if (!res.ok) { setErreurImport(data.message); return }
      setAperçu(data)
    } catch { setErreurImport('Impossible de contacter le serveur') }
    finally { setChargementAperçu(false) }
  }
  const lancerImportCatalogue = async () => {
    if (!fichierCatalogue) return
    setImportEnCours('catalogue'); setRapportImport(null); setErreurImport(null)
    const fd = new FormData(); fd.append('fichier', fichierCatalogue)
    try {
      const res = await fetch('http://localhost:3001/import/catalogue', { method: 'POST', headers: headers(), body: fd })
      const data = await res.json()
      if (!res.ok) { setErreurImport(data.message); return }
      setRapportImport(data); setFichierCatalogue(null); setAperçu(null)
      if (inputCatalogueRef.current) inputCatalogueRef.current.value = ''
      chargerDonnees()
    } catch { setErreurImport('Impossible de contacter le serveur') }
    finally { setImportEnCours(null) }
  }
  const lancerScrapingBabelio = async () => {
    setScrapingEnCours(true); setRapportImport(null); setErreurImport(null)
    try {
      const res = await fetch('http://localhost:3001/import/top-ventes', { method: 'POST', headers: headers() })
      const data = await res.json()
      if (!res.ok) { setErreurImport(data.message); return }
      setRapportImport(data); chargerSelections()
    } catch { setErreurImport('Impossible de contacter le serveur') }
    finally { setScrapingEnCours(false) }
  }
  const lancerImportPrix = async () => {
    if (!fichierPrix) return
    setImportEnCours('prix'); setRapportImport(null); setErreurImport(null)
    const fd = new FormData(); fd.append('fichier', fichierPrix)
    try {
      const res = await fetch('http://localhost:3001/import/prix', { method: 'POST', headers: headers(), body: fd })
      const data = await res.json()
      if (!res.ok) { setErreurImport(data.message); return }
      setRapportImport(data); setFichierPrix(null)
      if (inputPrixRef.current) inputPrixRef.current.value = ''
      chargerSelections()
    } catch { setErreurImport('Impossible de contacter le serveur') }
    finally { setImportEnCours(null) }
  }

  // ── Styles ────────────────────────────────────────────────────────────────
  const styleOnglet = (nom: string) => ({ padding: '10px 20px', borderRadius: '8px', border: 'none', fontSize: '14px', fontWeight: '600' as const, cursor: 'pointer', backgroundColor: onglet === nom ? C.vert : 'transparent', color: onglet === nom ? 'white' : C.texteSecondaire, fontFamily: FONT })
  const badgeStatut = (statut: string) => {
    const s: Record<string, any> = { 'en attente': { backgroundColor: '#fff8e6', color: C.orIntense }, 'validee': { backgroundColor: C.fondAlt, color: C.vert }, 'annulee': { backgroundColor: '#ffebee', color: '#c62828' }, 'pret': { backgroundColor: '#e3f2fd', color: '#1565c0' }, 'recupere': { backgroundColor: C.fondAlt, color: C.vert } }
    return { ...(s[statut]||{ backgroundColor: '#f5f5f5', color: C.texteSecondaire }), padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' as const }
  }
  const inputStyle = { width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', boxSizing: 'border-box' as const, fontFamily: FONT }
  const labelStyle = { fontSize: '12px', color: C.texteSecondaire, display: 'block' as const, marginBottom: '4px' }

  const selectionsFiltrees = selections.filter(s => s.type === typeSelectionne)
  const livreSelectionne = selLivreId ? livres.find(l => l.id === selLivreId) : null
  const maintenant = new Date()
  const evAVenir = evenements.filter(e => new Date(e.date_evenement) >= maintenant)
  const evPassés = evenements.filter(e => new Date(e.date_evenement) < maintenant)
  function formatDateEv(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div style={{ backgroundColor: C.fond, minHeight: '100vh', fontFamily: FONT }}>
      <header style={{ backgroundColor: C.vert, padding: '20px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ color: 'white', fontSize: '22px', fontWeight: '700', margin: 0, fontFamily: FONT }}>Bookdog</h1>
          <p style={{ color: C.fondAlt, fontSize: '13px', margin: '2px 0 0', fontFamily: FONT }}>Tableau de bord</p>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <a href="/admin/analytics" style={{ color: C.fondAlt, fontSize: '14px', textDecoration: 'none', fontFamily: FONT }}>Analytics</a>
          <a href="/" style={{ color: C.fondAlt, fontSize: '14px', textDecoration: 'none', fontFamily: FONT }}>Site public</a>
          <button onClick={() => { localStorage.removeItem('token'); window.location.href = '/admin' }} style={{ backgroundColor: 'transparent', color: 'white', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '8px', padding: '8px 16px', fontSize: '14px', cursor: 'pointer', fontFamily: FONT }}>Déconnexion</button>
        </div>
      </header>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 24px', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', gap: '6px', marginBottom: '32px', backgroundColor: '#ede9e3', borderRadius: '10px', padding: '6px', width: 'fit-content', flexWrap: 'wrap' }}>
          {[
            { id: 'reservations', label: 'Réservations' },
            { id: 'commandes', label: 'Click & Collect' },
            { id: 'catalogue', label: 'Catalogue' },
            { id: 'selections', label: 'Sélections' },
            { id: 'evenements', label: 'Événements' },
            { id: 'ce', label: '🏢 CE' },
            { id: 'import', label: 'Import' },
          ].map(o => (
            <button key={o.id} onClick={() => { setOnglet(o.id); if (o.id === 'import') { setRapportImport(null); setErreurImport(null) } }} style={styleOnglet(o.id)}>{o.label}</button>
          ))}
        </div>

        {/* ── RÉSERVATIONS ──────────────────────────────────────────────── */}
        {onglet === 'reservations' && (
          <>
            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '24px', color: C.texte }}>Réservations ({reservations.filter((r: any) => r.statut === 'en attente').length} en attente)</h2>
            {chargement && <p style={{ color: C.texteSecondaire }}>Chargement...</p>}
            {!chargement && reservations.length === 0 && <p style={{ color: C.texteSecondaire }}>Aucune réservation.</p>}
            {!chargement && reservations.length > 0 && (
              <div style={{ backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.07)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr style={{ backgroundColor: '#f5f5f5' }}>{['Client','Email','Livre','Date','Statut','Actions'].map(h => <th key={h} style={{ padding: '14px 20px', textAlign: 'left', fontSize: '13px', color: C.texteSecondaire, fontWeight: '600' }}>{h}</th>)}</tr></thead>
                  <tbody>{reservations.map((r: any, i: number) => (
                    <tr key={r.id} style={{ borderTop: '1px solid #f0f0f0', backgroundColor: i%2===0?'white':'#fafafa' }}>
                      <td style={{ padding: '14px 20px', fontSize: '14px' }}>{r.nom}</td>
                      <td style={{ padding: '14px 20px', fontSize: '14px', color: C.texteSecondaire }}>{r.email}</td>
                      <td style={{ padding: '14px 20px', fontSize: '14px' }}>{r.titre}</td>
                      <td style={{ padding: '14px 20px', fontSize: '14px', color: C.texteSecondaire }}>{new Date(r.date_reservation).toLocaleDateString('fr-FR')}</td>
                      <td style={{ padding: '14px 20px' }}><span style={badgeStatut(r.statut)}>{r.statut}</span></td>
                      <td style={{ padding: '14px 20px' }}>{r.statut==='en attente'&&<div style={{ display: 'flex', gap: '8px' }}><button onClick={()=>changerStatutReservation(r.id,'validee')} style={{ backgroundColor: C.vert, color: 'white', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>Valider</button><button onClick={()=>changerStatutReservation(r.id,'annulee')} style={{ backgroundColor: 'transparent', color: '#c62828', border: '1px solid #c62828', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>Annuler</button></div>}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* ── CLICK & COLLECT ───────────────────────────────────────────── */}
        {onglet === 'commandes' && (
          <>
            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '24px', color: C.texte }}>Click & Collect ({commandes.filter((c: any) => c.statut === 'en attente').length} en attente)</h2>
            {!chargement && commandes.length === 0 && <p style={{ color: C.texteSecondaire }}>Aucune commande.</p>}
            {!chargement && commandes.length > 0 && (
              <div style={{ backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.07)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr style={{ backgroundColor: '#f5f5f5' }}>{['Client','Email','Tel','Livre','Prix','Type','Date','Statut','Actions'].map(h => <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px', color: C.texteSecondaire, fontWeight: '600' }}>{h}</th>)}</tr></thead>
                  <tbody>{commandes.map((c: any, i: number) => (
                    <tr key={c.id} style={{ borderTop: '1px solid #f0f0f0', backgroundColor: i%2===0?'white':'#fafafa' }}>
                      <td style={{ padding: '14px 16px', fontSize: '14px' }}>{c.nom}</td>
                      <td style={{ padding: '14px 16px', fontSize: '13px', color: C.texteSecondaire }}>{c.email}</td>
                      <td style={{ padding: '14px 16px', fontSize: '13px', color: C.texteSecondaire }}>{c.telephone||'—'}</td>
                      <td style={{ padding: '14px 16px', fontSize: '14px' }}>{c.titre}</td>
                      <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: '600', color: C.vert }}>{c.prix} €</td>
                      <td style={{ padding: '14px 16px' }}><span style={{ backgroundColor: c.type==='stock'?C.fondAlt:'#fff8e1', color: c.type==='stock'?C.vert:C.orIntense, padding: '3px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' }}>{c.type==='stock'?'En stock':'À commander'}</span></td>
                      <td style={{ padding: '14px 16px', fontSize: '13px', color: C.texteSecondaire }}>{new Date(c.date_commande).toLocaleDateString('fr-FR')}</td>
                      <td style={{ padding: '14px 16px' }}><span style={badgeStatut(c.statut)}>{c.statut}</span></td>
                      <td style={{ padding: '14px 16px' }}><div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>{c.statut==='en attente'&&<><button onClick={()=>changerStatutCommande(c.id,'pret')} style={{ backgroundColor: C.vert, color: 'white', border: 'none', borderRadius: '6px', padding: '5px 10px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>Prêt</button><button onClick={()=>changerStatutCommande(c.id,'annulee')} style={{ backgroundColor: 'transparent', color: '#c62828', border: '1px solid #c62828', borderRadius: '6px', padding: '5px 10px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>Annuler</button></>}{c.statut==='pret'&&<button onClick={()=>changerStatutCommande(c.id,'recupere')} style={{ backgroundColor: '#1565c0', color: 'white', border: 'none', borderRadius: '6px', padding: '5px 10px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>Récupéré</button>}</div></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* ── CATALOGUE ─────────────────────────────────────────────────── */}
        {onglet === 'catalogue' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '600', color: C.texte, margin: 0 }}>Catalogue <span style={{ fontSize: '15px', fontWeight: '400', color: C.texteSecondaire }}>({livres.length} livres)</span></h2>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setOnglet('import')} style={{ backgroundColor: 'white', color: C.vert, border: `1px solid ${C.vert}`, borderRadius: '8px', padding: '10px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT }}>↑ Import CSV</button>
                <button onClick={() => ouvrirFormulaire(null)} style={{ backgroundColor: C.vert, color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT }}>+ Ajouter</button>
              </div>
            </div>
            {formulaireLivre && (
              <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '28px', marginBottom: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.07)', borderTop: '4px solid ' + C.vert }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px', color: C.texte }}>{livreEdite ? 'Modifier le livre' : 'Nouveau livre'}</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                  <div><label style={labelStyle}>Titre</label><input type="text" value={titre} onChange={e => setTitre(e.target.value)} style={inputStyle} /></div>
                  <div><label style={labelStyle}>Auteur</label><input type="text" value={auteur} onChange={e => setAuteur(e.target.value)} style={inputStyle} /></div>
                  <div><label style={labelStyle}>ISBN</label><input type="text" value={isbn} onChange={e => setIsbn(e.target.value)} style={inputStyle} /></div>
                  <div><label style={labelStyle}>Genre</label><select value={genre} onChange={e => setGenre(e.target.value)} style={{ ...inputStyle, backgroundColor: 'white' }}><option value="">— Sélectionner —</option>{GENRES.map(g => <option key={g} value={g}>{g}</option>)}</select></div>
                  <div><label style={labelStyle}>Prix (€)</label><input type="text" value={prix} onChange={e => setPrix(e.target.value)} style={inputStyle} /></div>
                  <div><label style={labelStyle}>Stock</label><input type="text" value={stock} onChange={e => setStock(e.target.value)} style={inputStyle} /></div>
                  <div><label style={labelStyle}>Éditeur</label><input type="text" value={editeur} onChange={e => setEditeur(e.target.value)} style={inputStyle} /></div>
                  <div><label style={labelStyle}>Collection</label><input type="text" value={collection} onChange={e => setCollection(e.target.value)} style={inputStyle} /></div>
                  <div><label style={labelStyle}>Date de publication</label><input type="text" value={datePublication} onChange={e => setDatePublication(e.target.value)} style={inputStyle} /></div>
                  <div><label style={labelStyle}>Lien Goodreads</label><input type="text" value={urlGoodreads} onChange={e => setUrlGoodreads(e.target.value)} style={inputStyle} /></div>
                </div>
                <div style={{ marginBottom: '20px' }}><label style={labelStyle}>Description</label><textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} style={{ ...inputStyle, resize: 'vertical' as const }} /></div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={sauvegarderLivre} style={{ backgroundColor: C.vert, color: 'white', border: 'none', borderRadius: '8px', padding: '10px 24px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT }}>{livreEdite ? 'Enregistrer' : 'Ajouter'}</button>
                  <button onClick={() => setFormulaireLivre(false)} style={{ backgroundColor: 'transparent', color: C.texteSecondaire, border: '1px solid #ddd', borderRadius: '8px', padding: '10px 24px', fontSize: '14px', cursor: 'pointer', fontFamily: FONT }}>Annuler</button>
                </div>
              </div>
            )}
            <div style={{ backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.07)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr style={{ backgroundColor: '#f5f5f5' }}>{['Titre','Auteur','Genre','ISBN','Prix','Stock','Actions'].map(h => <th key={h} style={{ padding: '14px 20px', textAlign: 'left', fontSize: '13px', color: C.texteSecondaire, fontWeight: '600' }}>{h}</th>)}</tr></thead>
                <tbody>{livres.map((l, i) => (
                  <tr key={l.id} style={{ borderTop: '1px solid #f0f0f0', backgroundColor: i%2===0?'white':'#fafafa' }}>
                    <td style={{ padding: '14px 20px', fontSize: '14px', fontWeight: '500' }}>{l.titre}</td>
                    <td style={{ padding: '14px 20px', fontSize: '14px', color: C.texteSecondaire }}>{l.auteur}</td>
                    <td style={{ padding: '14px 20px' }}>{l.genre?<span style={{ backgroundColor: C.fondAlt, color: C.vert, padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>{l.genre}</span>:<span style={{ color: '#ccc' }}>—</span>}</td>
                    <td style={{ padding: '14px 20px', fontSize: '13px', color: C.texteSecondaire }}>{l.isbn}</td>
                    <td style={{ padding: '14px 20px', fontSize: '14px', fontWeight: '600', color: C.vert }}>{l.prix} €</td>
                    <td style={{ padding: '14px 20px', fontSize: '14px' }}>{l.stock}</td>
                    <td style={{ padding: '14px 20px' }}><div style={{ display: 'flex', gap: '8px' }}><button onClick={() => ouvrirFormulaire(l)} style={{ backgroundColor: '#f0f0f0', color: C.texte, border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>Modifier</button><button onClick={() => supprimerLivre(l.id)} style={{ backgroundColor: 'transparent', color: '#c62828', border: '1px solid #c62828', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>Supprimer</button></div></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </>
        )}

        {/* ── SÉLECTIONS ────────────────────────────────────────────────── */}
        {onglet === 'selections' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '600', color: C.texte, margin: 0 }}>Sélections éditoriales</h2>
              <button onClick={() => ouvrirFormulaireSelection(null)} style={{ backgroundColor: C.vert, color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT }}>+ Ajouter</button>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
              {TYPES_SELECTION.map(t => {
                const count = selections.filter(s => s.type === t.value).length
                return <button key={t.value} onClick={() => setTypeSelectionne(t.value)} style={{ padding: '8px 20px', borderRadius: '40px', border: 'none', cursor: 'pointer', fontSize: '14px', fontFamily: FONT, backgroundColor: typeSelectionne===t.value?C.vert:'white', color: typeSelectionne===t.value?'white':C.texteSecondaire, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', fontWeight: typeSelectionne===t.value?'700':'400' }}>{t.label} <span style={{ marginLeft: '8px', backgroundColor: typeSelectionne===t.value?'rgba(255,255,255,0.25)':C.fondAlt, color: typeSelectionne===t.value?'white':C.vert, padding: '2px 8px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>{count}</span></button>
              })}
            </div>
            {formulaireSelection && (
              <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '28px', marginBottom: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.07)', borderTop: '4px solid ' + C.or }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px', color: C.texte }}>{selectionEditee?'Modifier la sélection':'Ajouter à la sélection'}</h3>
                {!selectionEditee && (<div style={{ marginBottom: '20px' }}><p style={{ fontSize: '12px', color: C.texteSecondaire, letterSpacing: '1px', margin: '0 0 12px', fontWeight: '600' }}>TYPE</p><div style={{ display: 'flex', gap: '8px' }}>{TYPES_SELECTION.map(t => <button key={t.value} onClick={() => setSelType(t.value)} style={{ padding: '8px 16px', borderRadius: '8px', border: `1px solid ${selType===t.value?C.vert:'#ddd'}`, backgroundColor: selType===t.value?C.fondAlt:'white', color: selType===t.value?C.vert:C.texteSecondaire, fontSize: '13px', fontWeight: selType===t.value?'700':'400', cursor: 'pointer', fontFamily: FONT }}>{t.label}</button>)}</div></div>)}
                {!selectionEditee && (<div style={{ marginBottom: '20px' }}><p style={{ fontSize: '12px', color: C.texteSecondaire, letterSpacing: '1px', margin: '0 0 12px', fontWeight: '600' }}>LIVRE *</p>{livreSelectionne?(<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.fondAlt, borderRadius: '8px', padding: '12px 16px' }}><div><p style={{ fontWeight: '700', fontSize: '14px', margin: '0 0 2px', color: C.texte }}>{livreSelectionne.titre}</p><p style={{ fontSize: '13px', color: C.texteSecondaire, margin: 0, fontStyle: 'italic' }}>{livreSelectionne.auteur}</p></div><button onClick={() => { setSelLivreId(null); setRechercheAjout('') }} style={{ background: 'none', border: 'none', color: C.texteSecondaire, cursor: 'pointer', fontSize: '18px' }}>✕</button></div>):(<div><input type="text" placeholder="Rechercher un livre..." value={rechercheAjout} onChange={e => setRechercheAjout(e.target.value)} style={{ ...inputStyle, marginBottom: '8px' }} />{rechercheAjout&&<div style={{ border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden', maxHeight: '200px', overflowY: 'auto' }}>{livresFiltresAjout.length===0?<p style={{ padding: '12px 16px', fontSize: '14px', color: C.texteSecondaire, margin: 0 }}>Aucun résultat</p>:livresFiltresAjout.slice(0,8).map((l,i) => <button key={l.id} onClick={() => { setSelLivreId(l.id); setRechercheAjout('') }} style={{ width: '100%', textAlign: 'left', padding: '10px 16px', border: 'none', backgroundColor: i%2===0?'white':'#fafafa', borderTop: i>0?'1px solid #f0f0f0':'none', cursor: 'pointer', fontFamily: FONT }}><span style={{ fontSize: '14px', fontWeight: '600', color: C.texte }}>{l.titre}</span><span style={{ fontSize: '13px', color: C.texteSecondaire, fontStyle: 'italic', marginLeft: '8px' }}>{l.auteur}</span></button>)}</div>}</div>)}</div>)}
                {selectionEditee && <div style={{ backgroundColor: C.fondAlt, borderRadius: '8px', padding: '12px 16px', marginBottom: '20px' }}><p style={{ fontWeight: '700', fontSize: '14px', margin: '0 0 2px', color: C.texte }}>{selectionEditee.titre}</p><p style={{ fontSize: '13px', color: C.texteSecondaire, margin: 0, fontStyle: 'italic' }}>{selectionEditee.auteur}</p></div>}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                  <div><label style={labelStyle}>Label</label><input type="text" value={selLabel} onChange={e => setSelLabel(e.target.value)} style={inputStyle} /></div>
                  {(selType==='top_vente'||selectionEditee?.type==='top_vente') && <div><label style={labelStyle}>Rang</label><input type="number" value={selRang} onChange={e => setSelRang(e.target.value)} min={1} style={inputStyle} /></div>}
                  <div><label style={labelStyle}>Genre</label><select value={selGenre} onChange={e => setSelGenre(e.target.value)} style={{ ...inputStyle, backgroundColor: 'white' }}><option value="">— Tous —</option>{GENRES.map(g => <option key={g} value={g}>{g}</option>)}</select></div>
                  {selectionEditee && <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '20px' }}><button onClick={() => setSelActif(!selActif)} style={{ padding: '8px 16px', borderRadius: '8px', border: `1px solid ${selActif?C.vert:'#ddd'}`, backgroundColor: selActif?C.fondAlt:'white', color: selActif?C.vert:C.texteSecondaire, fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: FONT }}>{selActif?'✓ Actif':'○ Masqué'}</button></div>}
                </div>
                {erreurSel && <p style={{ color: '#c0392b', fontSize: '13px', marginBottom: '12px' }}>{erreurSel}</p>}
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={sauvegarderSelection} style={{ backgroundColor: C.vert, color: 'white', border: 'none', borderRadius: '8px', padding: '10px 24px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT }}>{selectionEditee?'Enregistrer':'Ajouter'}</button>
                  <button onClick={() => setFormulaireSelection(false)} style={{ backgroundColor: 'transparent', color: C.texteSecondaire, border: '1px solid #ddd', borderRadius: '8px', padding: '10px 24px', fontSize: '14px', cursor: 'pointer', fontFamily: FONT }}>Annuler</button>
                </div>
              </div>
            )}
            {selectionsFiltrees.length === 0 ? (
              <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '48px', textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                <p style={{ fontSize: '32px', marginBottom: '12px' }}>📚</p>
                <p style={{ color: C.texteSecondaire, fontSize: '15px', margin: '0 0 20px' }}>Aucun livre dans cette sélection</p>
                <button onClick={() => ouvrirFormulaireSelection(null)} style={{ backgroundColor: C.vert, color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT }}>+ Premier livre</button>
              </div>
            ) : (
              <div style={{ backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.07)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr style={{ backgroundColor: '#f5f5f5' }}>{[typeSelectionne==='top_vente'?'Rang':null,'Livre','Auteur','Prix','Stock','Label','Statut','Actions'].filter(Boolean).map(h => <th key={h as string} style={{ padding: '14px 20px', textAlign: 'left', fontSize: '13px', color: C.texteSecondaire, fontWeight: '600' }}>{h}</th>)}</tr></thead>
                  <tbody>{selectionsFiltrees.map((s, i) => (
                    <tr key={s.id} style={{ borderTop: '1px solid #f0f0f0', backgroundColor: i%2===0?'white':'#fafafa' }}>
                      {typeSelectionne==='top_vente'&&<td style={{ padding: '14px 20px' }}>{s.rang!==null?<span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '50%', backgroundColor: s.rang<=3?C.or:C.fondAlt, color: s.rang<=3?'white':C.vert, fontSize: '13px', fontWeight: '700' }}>#{s.rang}</span>:<span style={{ color: '#ccc' }}>—</span>}</td>}
                      <td style={{ padding: '14px 20px', fontSize: '14px', fontWeight: '600' }}>{s.titre}</td>
                      <td style={{ padding: '14px 20px', fontSize: '14px', color: C.texteSecondaire, fontStyle: 'italic' }}>{s.auteur}</td>
                      <td style={{ padding: '14px 20px', fontSize: '14px', fontWeight: '600', color: C.vert }}>{s.prix} €</td>
                      <td style={{ padding: '14px 20px', fontSize: '14px', color: s.stock>0?C.vert:C.orIntense, fontWeight: '600' }}>{s.stock>0?s.stock+' en stock':'Commande'}</td>
                      <td style={{ padding: '14px 20px', fontSize: '13px', color: C.texteSecondaire, fontStyle: s.label?'italic':'normal' }}>{s.label||'—'}</td>
                      <td style={{ padding: '14px 20px' }}><button onClick={() => toggleActif(s)} style={{ padding: '4px 12px', borderRadius: '20px', border: 'none', fontSize: '12px', fontWeight: '600', cursor: 'pointer', backgroundColor: s.actif?C.fondAlt:'#f5f5f5', color: s.actif?C.vert:'#bbb', fontFamily: FONT }}>{s.actif?'✓ Actif':'○ Masqué'}</button></td>
                      <td style={{ padding: '14px 20px' }}><div style={{ display: 'flex', gap: '8px' }}><button onClick={() => ouvrirFormulaireSelection(s)} style={{ backgroundColor: '#f0f0f0', color: C.texte, border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>Modifier</button><button onClick={() => supprimerSelection(s.id)} style={{ backgroundColor: 'transparent', color: '#c62828', border: '1px solid #c62828', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>Retirer</button></div></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* ── ÉVÉNEMENTS ────────────────────────────────────────────────── */}
        {onglet === 'evenements' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '600', color: C.texte, margin: 0 }}>Événements <span style={{ fontSize: '15px', fontWeight: '400', color: C.texteSecondaire }}>({evAVenir.length} à venir)</span></h2>
              <button onClick={() => ouvrirFormulaireEvenement(null)} style={{ backgroundColor: C.vert, color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT }}>+ Ajouter</button>
            </div>
            {formulaireEvenement && (
              <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '28px', marginBottom: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.07)', borderTop: `4px solid ${C.or}` }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px', color: C.texte }}>{evenementEdite ? 'Modifier l\'événement' : 'Nouvel événement'}</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ gridColumn: '1 / -1' }}><label style={labelStyle}>Titre *</label><input type="text" value={evTitre} onChange={e => setEvTitre(e.target.value)} style={inputStyle} /></div>
                  <div><label style={labelStyle}>Date et heure *</label><input type="datetime-local" value={evDate} onChange={e => setEvDate(e.target.value)} style={inputStyle} /></div>
                  <div><label style={labelStyle}>Catégorie</label><select value={evCategorie} onChange={e => setEvCategorie(e.target.value)} style={{ ...inputStyle, backgroundColor: 'white' }}><option value="">— Sélectionner —</option>{CATEGORIES_EVENEMENT.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                  <div style={{ gridColumn: '1 / -1' }}><label style={labelStyle}>URL de l'affiche</label><input type="text" value={evAfficheUrl} onChange={e => setEvAfficheUrl(e.target.value)} style={inputStyle} /></div>
                  <div style={{ gridColumn: '1 / -1' }}><label style={labelStyle}>Description</label><textarea value={evDescription} onChange={e => setEvDescription(e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical' as const }} /></div>
                  <div><button onClick={() => setEvActif(!evActif)} style={{ padding: '8px 16px', borderRadius: '8px', border: `1px solid ${evActif?C.vert:'#ddd'}`, backgroundColor: evActif?C.fondAlt:'white', color: evActif?C.vert:C.texteSecondaire, fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: FONT }}>{evActif ? '✓ Visible sur le site' : '○ Masqué'}</button></div>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={sauvegarderEvenement} disabled={!evTitre || !evDate} style={{ backgroundColor: evTitre && evDate ? C.vert : '#ddd', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 24px', fontSize: '14px', fontWeight: '600', cursor: evTitre && evDate ? 'pointer' : 'not-allowed', fontFamily: FONT }}>{evenementEdite ? 'Enregistrer' : 'Créer'}</button>
                  <button onClick={() => setFormulaireEvenement(false)} style={{ backgroundColor: 'transparent', color: C.texteSecondaire, border: '1px solid #ddd', borderRadius: '8px', padding: '10px 24px', fontSize: '14px', cursor: 'pointer', fontFamily: FONT }}>Annuler</button>
                </div>
              </div>
            )}
            {evAVenir.length > 0 && (<div style={{ marginBottom: '32px' }}><p style={{ fontSize: '12px', color: C.texteSecondaire, letterSpacing: '1px', fontWeight: '600', margin: '0 0 16px' }}>À VENIR</p><div style={{ backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.07)' }}><table style={{ width: '100%', borderCollapse: 'collapse' }}><thead><tr style={{ backgroundColor: '#f5f5f5' }}>{['Titre','Date','Catégorie','Statut','Actions'].map(h => <th key={h} style={{ padding: '14px 20px', textAlign: 'left', fontSize: '13px', color: C.texteSecondaire, fontWeight: '600' }}>{h}</th>)}</tr></thead><tbody>{evAVenir.map((ev, i) => (<tr key={ev.id} style={{ borderTop: '1px solid #f0f0f0', backgroundColor: i%2===0?'white':'#fafafa' }}><td style={{ padding: '14px 20px', fontSize: '14px', fontWeight: '600', color: C.texte }}>{ev.titre}</td><td style={{ padding: '14px 20px', fontSize: '13px', color: C.texteSecondaire }}>{formatDateEv(ev.date_evenement)}</td><td style={{ padding: '14px 20px' }}>{ev.categorie?<span style={{ backgroundColor: C.fondAlt, color: C.vert, padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>{ev.categorie}</span>:<span style={{ color: '#ccc' }}>—</span>}</td><td style={{ padding: '14px 20px' }}><button onClick={() => toggleActifEvenement(ev)} style={{ padding: '4px 12px', borderRadius: '20px', border: 'none', fontSize: '12px', fontWeight: '600', cursor: 'pointer', backgroundColor: ev.actif?C.fondAlt:'#f5f5f5', color: ev.actif?C.vert:'#bbb', fontFamily: FONT }}>{ev.actif?'✓ Visible':'○ Masqué'}</button></td><td style={{ padding: '14px 20px' }}><div style={{ display: 'flex', gap: '8px' }}><button onClick={() => ouvrirFormulaireEvenement(ev)} style={{ backgroundColor: '#f0f0f0', color: C.texte, border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>Modifier</button><button onClick={() => supprimerEvenement(ev.id)} style={{ backgroundColor: 'transparent', color: '#c62828', border: '1px solid #c62828', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>Supprimer</button></div></td></tr>))}</tbody></table></div></div>)}
            {evPassés.length > 0 && (<div><p style={{ fontSize: '12px', color: C.texteSecondaire, letterSpacing: '1px', fontWeight: '600', margin: '0 0 16px' }}>PASSÉS</p><div style={{ backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.07)', opacity: 0.7 }}><table style={{ width: '100%', borderCollapse: 'collapse' }}><thead><tr style={{ backgroundColor: '#f5f5f5' }}>{['Titre','Date','Catégorie','Actions'].map(h => <th key={h} style={{ padding: '14px 20px', textAlign: 'left', fontSize: '13px', color: C.texteSecondaire, fontWeight: '600' }}>{h}</th>)}</tr></thead><tbody>{evPassés.map((ev, i) => (<tr key={ev.id} style={{ borderTop: '1px solid #f0f0f0', backgroundColor: i%2===0?'white':'#fafafa' }}><td style={{ padding: '14px 20px', fontSize: '14px', color: C.texteSecondaire }}>{ev.titre}</td><td style={{ padding: '14px 20px', fontSize: '13px', color: C.texteSecondaire }}>{formatDateEv(ev.date_evenement)}</td><td style={{ padding: '14px 20px' }}>{ev.categorie?<span style={{ backgroundColor: '#f5f5f5', color: C.texteSecondaire, padding: '3px 10px', borderRadius: '20px', fontSize: '12px' }}>{ev.categorie}</span>:<span style={{ color: '#ccc' }}>—</span>}</td><td style={{ padding: '14px 20px' }}><button onClick={() => supprimerEvenement(ev.id)} style={{ backgroundColor: 'transparent', color: '#c62828', border: '1px solid #c62828', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>Supprimer</button></td></tr>))}</tbody></table></div></div>)}
            {evenements.length === 0 && !formulaireEvenement && (<div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '60px', textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}><p style={{ fontSize: '40px', marginBottom: '16px' }}>📅</p><p style={{ color: C.texteSecondaire, fontSize: '15px', margin: '0 0 20px' }}>Aucun événement programmé</p><button onClick={() => ouvrirFormulaireEvenement(null)} style={{ backgroundColor: C.vert, color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT }}>+ Premier événement</button></div>)}
          </>
        )}

        {/* ── CE ────────────────────────────────────────────────────────── */}
        {onglet === 'ce' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: '600', color: C.texte, margin: '0 0 4px' }}>Comités d'Entreprise <span style={{ fontSize: '15px', fontWeight: '400', color: C.texteSecondaire }}>({ces.length} partenaires)</span></h2>
                <p style={{ fontSize: '13px', color: C.texteSecondaire, margin: 0 }}>Gérez les accès CE, les remises et les domaines email autorisés.</p>
              </div>
              <button onClick={() => ouvrirFormulaireCE(null)} style={{ backgroundColor: C.vert, color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT }}>+ Nouveau CE</button>
            </div>

            {/* Formulaire CE */}
            {formulaireCE && (
              <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '28px', marginBottom: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.07)', borderTop: '4px solid ' + C.vert }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px', color: C.texte }}>{ceEdite ? 'Modifier le CE' : 'Nouveau partenaire CE'}</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                  <div><label style={labelStyle}>Nom de l'entreprise *</label><input type="text" value={ceNom} onChange={e => setCeNom(e.target.value)} placeholder="ex. Sanofi" style={inputStyle} /></div>
                  <div>
                    <label style={labelStyle}>Code URL * {ceEdite && <span style={{ color: '#bbb', fontWeight: '400' }}>(non modifiable)</span>}</label>
                    <input type="text" value={ceCode} onChange={e => setCeCode(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} placeholder="ex. sanofi" style={{ ...inputStyle, backgroundColor: ceEdite ? C.fondAlt : 'white', color: ceEdite ? C.texteSecondaire : C.texte }} readOnly={!!ceEdite} />
                    {!ceEdite && <p style={{ fontSize: '11px', color: '#bbb', margin: '4px 0 0' }}>URL d'accès : bookdog.fr/ce/{ceCode || 'code'}</p>}
                  </div>
                  <div><label style={labelStyle}>Remise (%)</label><input type="number" value={ceRemise} onChange={e => setCeRemise(e.target.value)} min="0" max="50" style={inputStyle} /></div>
                  <div><label style={labelStyle}>Adresse de livraison entreprise</label><input type="text" value={ceAdresse} onChange={e => setCeAdresse(e.target.value)} placeholder="54 rue du Château, 92200 Neuilly" style={inputStyle} /></div>
                  <div><label style={labelStyle}>Contact CE — Nom</label><input type="text" value={ceContactNom} onChange={e => setCeContactNom(e.target.value)} placeholder="Marie Dupont" style={inputStyle} /></div>
                  <div><label style={labelStyle}>Contact CE — Email</label><input type="email" value={ceContactEmail} onChange={e => setCeContactEmail(e.target.value)} placeholder="marie.dupont@sanofi.com" style={inputStyle} /></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingTop: '18px' }}>
                    <button onClick={() => setCeActif(!ceActif)} style={{ padding: '8px 16px', borderRadius: '8px', border: `1px solid ${ceActif?C.vert:'#ddd'}`, backgroundColor: ceActif?C.fondAlt:'white', color: ceActif?C.vert:C.texteSecondaire, fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: FONT }}>{ceActif ? '✓ Actif' : '○ Inactif'}</button>
                  </div>
                </div>
                {ceErreur && <p style={{ color: '#c0392b', fontSize: '13px', marginBottom: '12px' }}>{ceErreur}</p>}
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={sauvegarderCE} style={{ backgroundColor: C.vert, color: 'white', border: 'none', borderRadius: '8px', padding: '10px 24px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT }}>{ceEdite ? 'Enregistrer' : 'Créer le CE'}</button>
                  <button onClick={() => setFormulaireCE(false)} style={{ backgroundColor: 'transparent', color: C.texteSecondaire, border: '1px solid #ddd', borderRadius: '8px', padding: '10px 24px', fontSize: '14px', cursor: 'pointer', fontFamily: FONT }}>Annuler</button>
                </div>
              </div>
            )}

            {/* Liste CE */}
            {ces.length === 0 && !formulaireCE ? (
              <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '60px', textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                <p style={{ fontSize: '40px', marginBottom: '16px' }}>🏢</p>
                <p style={{ color: C.texteSecondaire, fontSize: '15px', margin: '0 0 20px' }}>Aucun partenaire CE configuré</p>
                <button onClick={() => ouvrirFormulaireCE(null)} style={{ backgroundColor: C.vert, color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT }}>+ Premier CE</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {ces.map(ce => (
                  <div key={ce.id} style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden', borderLeft: `4px solid ${ce.actif ? C.vert : '#ddd'}` }}>
                    {/* Header CE */}
                    <div style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
                          <h3 style={{ fontSize: '16px', fontWeight: '700', color: C.texte, margin: 0 }}>{ce.nom}</h3>
                          <span style={{ backgroundColor: C.fondAlt, color: C.vert, fontSize: '12px', fontWeight: '600', padding: '3px 10px', borderRadius: '20px' }}>
                            -{ce.remise}%
                          </span>
                          <span style={{ backgroundColor: ce.actif ? '#e8f5e9' : '#f5f5f5', color: ce.actif ? '#2e7d32' : '#bbb', fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '20px' }}>
                            {ce.actif ? '✓ Actif' : '○ Inactif'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                          <div>
                            <p style={{ fontSize: '11px', color: C.texteSecondaire, letterSpacing: '1px', margin: '0 0 2px', fontWeight: '600' }}>URL D'ACCÈS</p>
                            <code style={{ fontSize: '12px', color: C.vert, backgroundColor: C.fondAlt, padding: '2px 8px', borderRadius: '4px' }}>bookdog.fr/ce/{ce.code}</code>
                          </div>
                          {ce.adresse_livraison && (
                            <div>
                              <p style={{ fontSize: '11px', color: C.texteSecondaire, letterSpacing: '1px', margin: '0 0 2px', fontWeight: '600' }}>LIVRAISON</p>
                              <p style={{ fontSize: '13px', color: C.texte, margin: 0 }}>{ce.adresse_livraison}</p>
                            </div>
                          )}
                          {ce.contact_nom && (
                            <div>
                              <p style={{ fontSize: '11px', color: C.texteSecondaire, letterSpacing: '1px', margin: '0 0 2px', fontWeight: '600' }}>CONTACT CE</p>
                              <p style={{ fontSize: '13px', color: C.texte, margin: 0 }}>{ce.contact_nom} {ce.contact_email && <span style={{ color: C.texteSecondaire }}>— {ce.contact_email}</span>}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', flexShrink: 0, marginLeft: '16px' }}>
                        <button onClick={() => setCeExpandId(ceExpandId === ce.id ? null : ce.id)} style={{ backgroundColor: '#f0f0f0', color: C.texte, border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT }}>
                          {ceExpandId === ce.id ? '▲ Domaines' : '▼ Domaines'} ({ce.domaines?.length || 0})
                        </button>
                        <button onClick={() => ouvrirFormulaireCE(ce)} style={{ backgroundColor: '#f0f0f0', color: C.texte, border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>Modifier</button>
                        <button onClick={() => toggleActifCE(ce)} style={{ backgroundColor: 'transparent', color: ce.actif ? C.orIntense : C.vert, border: `1px solid ${ce.actif ? C.orIntense : C.vert}`, borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                          {ce.actif ? 'Désactiver' : 'Activer'}
                        </button>
                        <button onClick={() => supprimerCE(ce.id)} style={{ backgroundColor: 'transparent', color: '#c62828', border: '1px solid #c62828', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>Supprimer</button>
                      </div>
                    </div>

                    {/* Panel domaines */}
                    {ceExpandId === ce.id && (
                      <div style={{ borderTop: '1px solid #f0f0f0', padding: '20px 24px', backgroundColor: '#fafafa' }}>
                        <p style={{ fontSize: '12px', color: C.texteSecondaire, letterSpacing: '1px', fontWeight: '600', margin: '0 0 12px' }}>DOMAINES EMAIL AUTORISÉS</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                          {ce.domaines && ce.domaines.length > 0 ? ce.domaines.map((dom, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: C.fondAlt, borderRadius: '20px', padding: '5px 12px' }}>
                              <span style={{ fontSize: '13px', color: C.vert, fontWeight: '600' }}>@{dom}</span>
                              <button
                                onClick={() => supprimerDomaine(i)}
                                style={{ background: 'none', border: 'none', color: C.texteSecondaire, cursor: 'pointer', fontSize: '14px', padding: '0', lineHeight: 1, display: 'flex', alignItems: 'center' }}
                              >✕</button>
                            </div>
                          )) : <p style={{ fontSize: '13px', color: '#bbb', margin: 0 }}>Aucun domaine configuré</p>}
                        </div>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden', backgroundColor: 'white' }}>
                              <span style={{ padding: '10px 12px', color: C.texteSecondaire, fontSize: '14px', backgroundColor: '#f5f5f5', borderRight: '1px solid #ddd' }}>@</span>
                              <input
                                type="text"
                                value={nouveauDomaine}
                                onChange={e => { setNouveauDomaine(e.target.value); setErreurDomaine('') }}
                                placeholder="sanofi.com"
                                onKeyDown={e => e.key === 'Enter' && ajouterDomaine(ce.id)}
                                style={{ flex: 1, padding: '10px 14px', border: 'none', fontSize: '14px', fontFamily: FONT, outline: 'none' }}
                              />
                            </div>
                            {erreurDomaine && <p style={{ color: '#c0392b', fontSize: '12px', margin: '4px 0 0' }}>{erreurDomaine}</p>}
                          </div>
                          <button onClick={() => ajouterDomaine(ce.id)} style={{ padding: '10px 20px', backgroundColor: C.vert, color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT, whiteSpace: 'nowrap' }}>
                            + Ajouter
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── IMPORT ────────────────────────────────────────────────────── */}
        {onglet === 'import' && (
          <>
            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px', color: C.texte }}>Import de données</h2>
            <p style={{ fontSize: '14px', color: C.texteSecondaire, marginBottom: '32px' }}>Séquence recommandée : <strong style={{ color: C.texte }}>1. Catalogue</strong> → <strong style={{ color: C.texte }}>2. Top ventes</strong> → <strong style={{ color: C.texte }}>3. Prix littéraires</strong></p>
            {rapportImport && (<div style={{ backgroundColor: C.fondAlt, border: `1px solid ${C.vert}`, borderRadius: '12px', padding: '20px 24px', marginBottom: '24px' }}><p style={{ fontWeight: '700', color: C.vert, margin: '0 0 12px', fontSize: '15px' }}>✓ {rapportImport.message}</p><div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>{rapportImport.crees !== undefined && <div><p style={{ fontSize: '11px', color: C.texteSecondaire, letterSpacing: '1px', margin: '0 0 2px', fontWeight: '600' }}>CRÉÉS</p><p style={{ fontSize: '22px', fontWeight: '700', color: C.vert, margin: 0 }}>{rapportImport.crees}</p></div>}{rapportImport.mis_a_jour !== undefined && <div><p style={{ fontSize: '11px', color: C.texteSecondaire, letterSpacing: '1px', margin: '0 0 2px', fontWeight: '600' }}>MIS À JOUR</p><p style={{ fontSize: '22px', fontWeight: '700', color: C.texte, margin: 0 }}>{rapportImport.mis_a_jour}</p></div>}{rapportImport.ajoutes !== undefined && <div><p style={{ fontSize: '11px', color: C.texteSecondaire, letterSpacing: '1px', margin: '0 0 2px', fontWeight: '600' }}>AJOUTÉS</p><p style={{ fontSize: '22px', fontWeight: '700', color: C.vert, margin: 0 }}>{rapportImport.ajoutes}</p></div>}</div></div>)}
            {erreurImport && <div style={{ backgroundColor: '#fff0f0', border: '1px solid #ffcccc', borderRadius: '12px', padding: '16px 20px', marginBottom: '24px', color: '#c0392b', fontSize: '14px' }}>⚠️ {erreurImport}</div>}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
              <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '28px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', borderTop: '4px solid ' + C.vert }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}><span style={{ fontSize: '28px' }}>📦</span><div><p style={{ fontWeight: '700', fontSize: '16px', margin: 0, color: C.texte }}>Catalogue</p><p style={{ fontSize: '12px', color: C.texteSecondaire, margin: 0 }}>Fichier CSV Dilicom</p></div></div>
                <div style={{ border: `2px dashed ${fichierCatalogue ? C.vert : '#ddd'}`, borderRadius: '10px', padding: '20px', textAlign: 'center', cursor: 'pointer', backgroundColor: fichierCatalogue ? C.fondAlt : '#fafafa', marginBottom: '16px' }} onClick={() => inputCatalogueRef.current?.click()} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) { setFichierCatalogue(f); setAperçu(null); chargerAperçu(f) } }}>
                  <input ref={inputCatalogueRef} type="file" accept=".csv,.txt" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) { setFichierCatalogue(f); chargerAperçu(f) } }} />
                  {fichierCatalogue ? <p style={{ fontSize: '14px', fontWeight: '600', color: C.vert, margin: 0 }}>{fichierCatalogue.name}</p> : <p style={{ fontSize: '13px', color: C.texteSecondaire, margin: 0 }}>📄 Glisser ou cliquer</p>}
                </div>
                {aperçu && <div style={{ backgroundColor: C.fondAlt, borderRadius: '8px', padding: '10px', marginBottom: '12px', fontSize: '12px', color: C.texteSecondaire }}>~{aperçu.total_estime.toLocaleString('fr-FR')} lignes détectées</div>}
                <button onClick={lancerImportCatalogue} disabled={!fichierCatalogue || importEnCours === 'catalogue'} style={{ width: '100%', padding: '12px', backgroundColor: fichierCatalogue ? C.vert : '#ddd', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: fichierCatalogue ? 'pointer' : 'not-allowed', fontFamily: FONT }}>{importEnCours === 'catalogue' ? '⏳ Import...' : 'Lancer l\'import'}</button>
              </div>
              <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '28px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', borderTop: '4px solid ' + C.or }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}><span style={{ fontSize: '28px' }}>📈</span><div><p style={{ fontWeight: '700', fontSize: '16px', margin: 0, color: C.texte }}>Top ventes France</p><p style={{ fontSize: '12px', color: C.texteSecondaire, margin: 0 }}>Depuis Babelio</p></div></div>
                <p style={{ fontSize: '13px', color: C.texteSecondaire, lineHeight: '1.6', marginBottom: '20px' }}>Récupère les ~60 meilleures ventes actuelles sur Babelio et les croise avec votre catalogue.</p>
                <button onClick={lancerScrapingBabelio} disabled={scrapingEnCours} style={{ width: '100%', padding: '12px', backgroundColor: scrapingEnCours ? '#ddd' : C.orIntense, color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: scrapingEnCours ? 'not-allowed' : 'pointer', fontFamily: FONT }}>{scrapingEnCours ? '⏳ Récupération...' : 'Mettre à jour le top ventes'}</button>
              </div>
              <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '28px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', borderTop: '4px solid #8B4513' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}><span style={{ fontSize: '28px' }}>🏆</span><div><p style={{ fontWeight: '700', fontSize: '16px', margin: 0, color: C.texte }}>Prix littéraires</p><p style={{ fontSize: '12px', color: C.texteSecondaire, margin: 0 }}>CSV : isbn + label</p></div></div>
                <div style={{ border: `2px dashed ${fichierPrix ? '#8B4513' : '#ddd'}`, borderRadius: '10px', padding: '16px', textAlign: 'center', cursor: 'pointer', backgroundColor: fichierPrix ? '#fdf5ee' : '#fafafa', marginBottom: '12px' }} onClick={() => inputPrixRef.current?.click()} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) setFichierPrix(f) }}>
                  <input ref={inputPrixRef} type="file" accept=".csv,.txt" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) setFichierPrix(f) }} />
                  {fichierPrix ? <p style={{ fontSize: '14px', fontWeight: '600', color: '#8B4513', margin: 0 }}>{fichierPrix.name}</p> : <p style={{ fontSize: '13px', color: C.texteSecondaire, margin: 0 }}>📄 Glisser ou cliquer</p>}
                </div>
                <button onClick={lancerImportPrix} disabled={!fichierPrix || importEnCours === 'prix'} style={{ width: '100%', padding: '12px', backgroundColor: fichierPrix ? '#8B4513' : '#ddd', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: fichierPrix ? 'pointer' : 'not-allowed', fontFamily: FONT }}>{importEnCours === 'prix' ? '⏳ Import...' : 'Importer les prix'}</button>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}