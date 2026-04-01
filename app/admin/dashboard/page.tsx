'use client'

import { useState, useEffect, useRef } from 'react'

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

const GENRES = ['Roman','Policier','Science-fiction','Fantasy','Biographie','Histoire','Essai','Jeunesse','Bande dessinée','Poésie','Thriller','Romance','Développement personnel','Philosophie','Autre']
const TYPES_SELECTION = [{ value: 'coup_de_coeur', label: 'Coup de cœur' },{ value: 'prix', label: 'Prix littéraire' },{ value: 'top_vente', label: 'Top vente' }]

type Livre = { id: number; titre: string; auteur: string; isbn: string; prix: number; stock: number; genre: string | null; editeur: string | null; description: string | null; collection: string | null; date_publication: string | null; url_goodreads: string | null }
type Selection = { id: number; livre_id: number; type: string; label: string | null; rang: number | null; genre: string | null; actif: boolean; titre: string; auteur: string; isbn: string; prix: number; stock: number }

type RapportImport = {
  message: string
  total?: number
  crees?: number
  mis_a_jour?: number
  ajoutes?: number
  deja_presents?: number
  ignores?: number
  erreurs?: string[]
  isbn_introuvable?: string[]
  scrapes?: number
  associes?: number
  non_trouves_en_base?: number
  non_trouves?: { rang: number; titre: string; auteur: string }[]
}

type AperçuCatalogue = {
  colonnes_brutes: string[]
  colonnes_mappees: Record<string, string | null>
  apercu: Record<string, string>[]
  total_estime: number
  separateur: string
}

export default function Dashboard() {
  const [onglet, setOnglet] = useState('reservations')
  const [reservations, setReservations] = useState([])
  const [commandes, setCommandes] = useState([])
  const [livres, setLivres] = useState<Livre[]>([])
  const [chargement, setChargement] = useState(true)

  // — Catalogue —
  const [formulaireLivre, setFormulaireLivre] = useState(false)
  const [livreEdite, setLivreEdite] = useState<Livre | null>(null)
  const [titre, setTitre] = useState(''); const [auteur, setAuteur] = useState(''); const [isbn, setIsbn] = useState('')
  const [prix, setPrix] = useState(''); const [stock, setStock] = useState(''); const [genre, setGenre] = useState('')
  const [description, setDescription] = useState(''); const [editeur, setEditeur] = useState('')
  const [collection, setCollection] = useState(''); const [datePublication, setDatePublication] = useState(''); const [urlGoodreads, setUrlGoodreads] = useState('')

  // — Sélections —
  const [selections, setSelections] = useState<Selection[]>([])
  const [typeSelectionne, setTypeSelectionne] = useState('coup_de_coeur')
  const [formulaireSelection, setFormulaireSelection] = useState(false)
  const [selectionEditee, setSelectionEditee] = useState<Selection | null>(null)
  const [selLivreId, setSelLivreId] = useState<number | null>(null)
  const [selType, setSelType] = useState('coup_de_coeur')
  const [selLabel, setSelLabel] = useState(''); const [selRang, setSelRang] = useState(''); const [selGenre, setSelGenre] = useState(''); const [selActif, setSelActif] = useState(true)
  const [rechercheAjout, setRechercheAjout] = useState(''); const [erreurSel, setErreurSel] = useState('')

  // — Import —
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

  const token = () => localStorage.getItem('token')

  const chargerDonnees = () => {
    const headers = { 'Authorization': 'Bearer ' + token() }
    fetch('http://localhost:3001/reservations', { headers }).then(r => r.json()).then(d => setReservations(Array.isArray(d) ? d : []))
    fetch('http://localhost:3001/commandes', { headers }).then(r => r.json()).then(d => setCommandes(Array.isArray(d) ? d : []))
    fetch('http://localhost:3001/livres').then(r => r.json()).then(d => { setLivres(Array.isArray(d) ? d : []); setChargement(false) })
  }

  const chargerSelections = () => {
    fetch('http://localhost:3001/selections').then(r => r.json()).then(d => {
      setSelections([...(d.coups_de_coeur||[]),...(d.prix||[]),...(d.top_ventes||[])])
    })
  }

  useEffect(() => {
    if (!token()) { window.location.href = '/admin'; return }
    chargerDonnees()
    chargerSelections()
  }, [])

  // ── Réservations / Commandes ──────────────────────────────────────────────
  const changerStatutReservation = async (id: number, statut: string) => {
    await fetch(`http://localhost:3001/reservations/${id}/statut`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token() }, body: JSON.stringify({ statut }) })
    chargerDonnees()
  }

  const changerStatutCommande = async (id: number, statut: string) => {
    await fetch(`http://localhost:3001/commandes/${id}/statut`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token() }, body: JSON.stringify({ statut }) })
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
    const headers = { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token() }
    if (livreEdite) await fetch(`http://localhost:3001/livres/${livreEdite.id}`, { method: 'PUT', headers, body })
    else await fetch('http://localhost:3001/livres', { method: 'POST', headers, body })
    setFormulaireLivre(false); chargerDonnees()
  }

  const supprimerLivre = async (id: number) => {
    if (!confirm('Supprimer ce livre ?')) return
    await fetch(`http://localhost:3001/livres/${id}`, { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + token() } })
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
    const headers = { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token() }
    if (selectionEditee) {
      await fetch(`http://localhost:3001/selections/${selectionEditee.id}`, { method: 'PUT', headers, body: JSON.stringify({ label: selLabel||null, rang: selRang?parseInt(selRang):null, genre: selGenre||null, actif: selActif }) })
    } else {
      await fetch('http://localhost:3001/selections', { method: 'POST', headers, body: JSON.stringify({ livre_id: selLivreId, type: selType, label: selLabel||null, rang: selRang?parseInt(selRang):null, genre: selGenre||null }) })
    }
    setFormulaireSelection(false); chargerSelections()
  }

  const supprimerSelection = async (id: number) => {
    if (!confirm('Retirer ce livre de la sélection ?')) return
    await fetch(`http://localhost:3001/selections/${id}`, { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + token() } })
    chargerSelections()
  }

  const toggleActif = async (sel: Selection) => {
    await fetch(`http://localhost:3001/selections/${sel.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token() }, body: JSON.stringify({ label: sel.label, rang: sel.rang, genre: sel.genre, actif: !sel.actif }) })
    chargerSelections()
  }

  // ── Import ────────────────────────────────────────────────────────────────
  const chargerAperçu = async (fichier: File) => {
    setChargementAperçu(true); setAperçu(null); setErreurImport(null)
    const fd = new FormData(); fd.append('fichier', fichier)
    try {
      const res = await fetch('http://localhost:3001/import/apercu-catalogue', { method: 'POST', headers: { 'Authorization': 'Bearer ' + token() }, body: fd })
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
      const res = await fetch('http://localhost:3001/import/catalogue', { method: 'POST', headers: { 'Authorization': 'Bearer ' + token() }, body: fd })
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
      const res = await fetch('http://localhost:3001/import/top-ventes', { method: 'POST', headers: { 'Authorization': 'Bearer ' + token() } })
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
      const res = await fetch('http://localhost:3001/import/prix', { method: 'POST', headers: { 'Authorization': 'Bearer ' + token() }, body: fd })
      const data = await res.json()
      if (!res.ok) { setErreurImport(data.message); return }
      setRapportImport(data); setFichierPrix(null)
      if (inputPrixRef.current) inputPrixRef.current.value = ''
      chargerSelections()
    } catch { setErreurImport('Impossible de contacter le serveur') }
    finally { setImportEnCours(null) }
  }

  // ── Styles ────────────────────────────────────────────────────────────────
  const styleOnglet = (nom: string) => ({ padding: '10px 24px', borderRadius: '8px', border: 'none', fontSize: '14px', fontWeight: '600' as const, cursor: 'pointer', backgroundColor: onglet === nom ? C.vert : 'transparent', color: onglet === nom ? 'white' : C.texteSecondaire })
  const badgeStatut = (statut: string) => {
    const s: Record<string, any> = { 'en attente': { backgroundColor: '#fff8e6', color: C.orIntense }, 'validee': { backgroundColor: C.fondAlt, color: C.vert }, 'annulee': { backgroundColor: '#ffebee', color: '#c62828' }, 'pret': { backgroundColor: '#e3f2fd', color: '#1565c0' }, 'recupere': { backgroundColor: C.fondAlt, color: C.vert } }
    return { ...(s[statut]||{ backgroundColor: '#f5f5f5', color: C.texteSecondaire }), padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' as const }
  }
  const inputStyle = { width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', boxSizing: 'border-box' as const, fontFamily: 'Georgia, serif' }
  const labelStyle = { fontSize: '12px', color: C.texteSecondaire, display: 'block' as const, marginBottom: '4px' }

  const selectionsFiltrees = selections.filter(s => s.type === typeSelectionne)
  const livreSelectionne = selLivreId ? livres.find(l => l.id === selLivreId) : null

  return (
    <div style={{ backgroundColor: C.fond, minHeight: '100vh' }}>
      <header style={{ backgroundColor: C.vert, padding: '20px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ color: 'white', fontSize: '22px', fontWeight: '700', margin: 0 }}>Bookdog</h1>
          <p style={{ color: C.fondAlt, fontSize: '13px', margin: '2px 0 0' }}>Tableau de bord</p>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <a href="/" style={{ color: C.fondAlt, fontSize: '14px', textDecoration: 'none' }}>Site public</a>
          <button onClick={() => { localStorage.removeItem('token'); window.location.href = '/admin' }} style={{ backgroundColor: 'transparent', color: 'white', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '8px', padding: '8px 16px', fontSize: '14px', cursor: 'pointer' }}>Déconnexion</button>
        </div>
      </header>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 24px', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', backgroundColor: '#ede9e3', borderRadius: '10px', padding: '6px', width: 'fit-content' }}>
          <button onClick={() => setOnglet('reservations')} style={styleOnglet('reservations')}>Réservations</button>
          <button onClick={() => setOnglet('commandes')} style={styleOnglet('commandes')}>Click & Collect</button>
          <button onClick={() => setOnglet('catalogue')} style={styleOnglet('catalogue')}>Catalogue</button>
          <button onClick={() => setOnglet('selections')} style={styleOnglet('selections')}>Sélections</button>
          <button onClick={() => { setOnglet('import'); setRapportImport(null); setErreurImport(null) }} style={styleOnglet('import')}>Import</button>
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
                <button onClick={() => setOnglet('import')} style={{ backgroundColor: 'white', color: C.vert, border: `1px solid ${C.vert}`, borderRadius: '8px', padding: '10px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>↑ Import CSV</button>
                <button onClick={() => ouvrirFormulaire(null)} style={{ backgroundColor: C.vert, color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>+ Ajouter</button>
              </div>
            </div>
            {formulaireLivre && (
              <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '28px', marginBottom: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.07)', borderTop: '4px solid ' + C.vert }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px', color: C.texte }}>{livreEdite ? 'Modifier le livre' : 'Nouveau livre'}</h3>
                <p style={{ fontSize: '12px', color: C.texteSecondaire, letterSpacing: '1px', marginBottom: '12px', fontWeight: '600' }}>INFORMATIONS PRINCIPALES</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                  <div><label style={labelStyle}>Titre</label><input type="text" value={titre} onChange={e => setTitre(e.target.value)} style={inputStyle} /></div>
                  <div><label style={labelStyle}>Auteur</label><input type="text" value={auteur} onChange={e => setAuteur(e.target.value)} style={inputStyle} /></div>
                  <div><label style={labelStyle}>ISBN</label><input type="text" value={isbn} onChange={e => setIsbn(e.target.value)} style={inputStyle} /></div>
                  <div><label style={labelStyle}>Genre</label><select value={genre} onChange={e => setGenre(e.target.value)} style={{ ...inputStyle, backgroundColor: 'white' }}><option value="">— Sélectionner —</option>{GENRES.map(g => <option key={g} value={g}>{g}</option>)}</select></div>
                  <div><label style={labelStyle}>Prix (€)</label><input type="text" value={prix} onChange={e => setPrix(e.target.value)} style={inputStyle} /></div>
                  <div><label style={labelStyle}>Stock</label><input type="text" value={stock} onChange={e => setStock(e.target.value)} style={inputStyle} /></div>
                </div>
                <p style={{ fontSize: '12px', color: C.texteSecondaire, letterSpacing: '1px', marginBottom: '12px', fontWeight: '600' }}>INFORMATIONS ÉDITEUR</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                  <div><label style={labelStyle}>Éditeur</label><input type="text" value={editeur} onChange={e => setEditeur(e.target.value)} style={inputStyle} placeholder="ex. Gallimard" /></div>
                  <div><label style={labelStyle}>Collection</label><input type="text" value={collection} onChange={e => setCollection(e.target.value)} style={inputStyle} placeholder="ex. Folio" /></div>
                  <div><label style={labelStyle}>Date de publication</label><input type="text" value={datePublication} onChange={e => setDatePublication(e.target.value)} style={inputStyle} /></div>
                  <div><label style={labelStyle}>Lien Goodreads</label><input type="text" value={urlGoodreads} onChange={e => setUrlGoodreads(e.target.value)} style={inputStyle} /></div>
                </div>
                <p style={{ fontSize: '12px', color: C.texteSecondaire, letterSpacing: '1px', marginBottom: '12px', fontWeight: '600' }}>DESCRIPTION</p>
                <div style={{ marginBottom: '20px' }}><textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} style={{ ...inputStyle, resize: 'vertical' as const }} /></div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={sauvegarderLivre} style={{ backgroundColor: C.vert, color: 'white', border: 'none', borderRadius: '8px', padding: '10px 24px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>{livreEdite ? 'Enregistrer' : 'Ajouter'}</button>
                  <button onClick={() => setFormulaireLivre(false)} style={{ backgroundColor: 'transparent', color: C.texteSecondaire, border: '1px solid #ddd', borderRadius: '8px', padding: '10px 24px', fontSize: '14px', cursor: 'pointer' }}>Annuler</button>
                </div>
              </div>
            )}
            <div style={{ backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.07)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr style={{ backgroundColor: '#f5f5f5' }}>{['Titre','Auteur','Genre','Éditeur','ISBN','Prix','Stock','Actions'].map(h => <th key={h} style={{ padding: '14px 20px', textAlign: 'left', fontSize: '13px', color: C.texteSecondaire, fontWeight: '600' }}>{h}</th>)}</tr></thead>
                <tbody>{livres.map((l, i) => (
                  <tr key={l.id} style={{ borderTop: '1px solid #f0f0f0', backgroundColor: i%2===0?'white':'#fafafa' }}>
                    <td style={{ padding: '14px 20px', fontSize: '14px', fontWeight: '500', color: C.texte }}>{l.titre}</td>
                    <td style={{ padding: '14px 20px', fontSize: '14px', color: C.texteSecondaire }}>{l.auteur}</td>
                    <td style={{ padding: '14px 20px' }}>{l.genre?<span style={{ backgroundColor: C.fondAlt, color: C.vert, padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>{l.genre}</span>:<span style={{ color: '#ccc' }}>—</span>}</td>
                    <td style={{ padding: '14px 20px', fontSize: '14px', color: C.texteSecondaire }}>{l.editeur||'—'}</td>
                    <td style={{ padding: '14px 20px', fontSize: '14px', color: C.texteSecondaire }}>{l.isbn}</td>
                    <td style={{ padding: '14px 20px', fontSize: '14px', fontWeight: '600', color: C.vert }}>{l.prix} €</td>
                    <td style={{ padding: '14px 20px', fontSize: '14px', color: C.texte }}>{l.stock}</td>
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
              <button onClick={() => ouvrirFormulaireSelection(null)} style={{ backgroundColor: C.vert, color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>+ Ajouter</button>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
              {TYPES_SELECTION.map(t => {
                const count = selections.filter(s => s.type === t.value).length
                return (
                  <button key={t.value} onClick={() => setTypeSelectionne(t.value)} style={{ padding: '8px 20px', borderRadius: '40px', border: 'none', cursor: 'pointer', fontSize: '14px', fontFamily: 'Georgia, serif', backgroundColor: typeSelectionne===t.value?C.vert:'white', color: typeSelectionne===t.value?'white':C.texteSecondaire, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', fontWeight: typeSelectionne===t.value?'700':'400' }}>
                    {t.label} <span style={{ marginLeft: '8px', backgroundColor: typeSelectionne===t.value?'rgba(255,255,255,0.25)':C.fondAlt, color: typeSelectionne===t.value?'white':C.vert, padding: '2px 8px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>{count}</span>
                  </button>
                )
              })}
            </div>
            {formulaireSelection && (
              <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '28px', marginBottom: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.07)', borderTop: '4px solid ' + C.or }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px', color: C.texte }}>{selectionEditee?'Modifier la sélection':'Ajouter à la sélection'}</h3>
                {!selectionEditee && (
                  <div style={{ marginBottom: '20px' }}>
                    <p style={{ fontSize: '12px', color: C.texteSecondaire, letterSpacing: '1px', margin: '0 0 12px', fontWeight: '600' }}>TYPE</p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {TYPES_SELECTION.map(t => <button key={t.value} onClick={() => setSelType(t.value)} style={{ padding: '8px 16px', borderRadius: '8px', border: `1px solid ${selType===t.value?C.vert:'#ddd'}`, backgroundColor: selType===t.value?C.fondAlt:'white', color: selType===t.value?C.vert:C.texteSecondaire, fontSize: '13px', fontWeight: selType===t.value?'700':'400', cursor: 'pointer', fontFamily: 'Georgia, serif' }}>{t.label}</button>)}
                    </div>
                  </div>
                )}
                {!selectionEditee && (
                  <div style={{ marginBottom: '20px' }}>
                    <p style={{ fontSize: '12px', color: C.texteSecondaire, letterSpacing: '1px', margin: '0 0 12px', fontWeight: '600' }}>LIVRE *</p>
                    {livreSelectionne ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.fondAlt, borderRadius: '8px', padding: '12px 16px' }}>
                        <div><p style={{ fontWeight: '700', fontSize: '14px', margin: '0 0 2px', color: C.texte }}>{livreSelectionne.titre}</p><p style={{ fontSize: '13px', color: C.texteSecondaire, margin: 0, fontStyle: 'italic' }}>{livreSelectionne.auteur}</p></div>
                        <button onClick={() => { setSelLivreId(null); setRechercheAjout('') }} style={{ background: 'none', border: 'none', color: C.texteSecondaire, cursor: 'pointer', fontSize: '18px' }}>✕</button>
                      </div>
                    ) : (
                      <div>
                        <input type="text" placeholder="Rechercher un livre..." value={rechercheAjout} onChange={e => setRechercheAjout(e.target.value)} style={{ ...inputStyle, marginBottom: '8px' }} />
                        {rechercheAjout && <div style={{ border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden', maxHeight: '200px', overflowY: 'auto' }}>
                          {livresFiltresAjout.length===0?<p style={{ padding: '12px 16px', fontSize: '14px', color: C.texteSecondaire, margin: 0 }}>Aucun résultat</p>
                          :livresFiltresAjout.slice(0,8).map((l,i) => <button key={l.id} onClick={() => { setSelLivreId(l.id); setRechercheAjout('') }} style={{ width: '100%', textAlign: 'left', padding: '10px 16px', border: 'none', backgroundColor: i%2===0?'white':'#fafafa', borderTop: i>0?'1px solid #f0f0f0':'none', cursor: 'pointer', fontFamily: 'Georgia, serif' }}><span style={{ fontSize: '14px', fontWeight: '600', color: C.texte }}>{l.titre}</span><span style={{ fontSize: '13px', color: C.texteSecondaire, fontStyle: 'italic', marginLeft: '8px' }}>{l.auteur}</span></button>)}
                        </div>}
                      </div>
                    )}
                  </div>
                )}
                {selectionEditee && <div style={{ backgroundColor: C.fondAlt, borderRadius: '8px', padding: '12px 16px', marginBottom: '20px' }}><p style={{ fontWeight: '700', fontSize: '14px', margin: '0 0 2px', color: C.texte }}>{selectionEditee.titre}</p><p style={{ fontSize: '13px', color: C.texteSecondaire, margin: 0, fontStyle: 'italic' }}>{selectionEditee.auteur}</p></div>}
                <p style={{ fontSize: '12px', color: C.texteSecondaire, letterSpacing: '1px', margin: '0 0 12px', fontWeight: '600' }}>INFORMATIONS COMPLÉMENTAIRES</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                  <div><label style={labelStyle}>Label (affiché sur la couverture)</label><input type="text" value={selLabel} onChange={e => setSelLabel(e.target.value)} placeholder='ex. "Recommandé par Marie"' style={inputStyle} /></div>
                  {(selType==='top_vente'||selectionEditee?.type==='top_vente') && <div><label style={labelStyle}>Rang</label><input type="number" value={selRang} onChange={e => setSelRang(e.target.value)} placeholder="ex. 1" min={1} style={inputStyle} /></div>}
                  <div><label style={labelStyle}>Genre (filtre wizard)</label><select value={selGenre} onChange={e => setSelGenre(e.target.value)} style={{ ...inputStyle, backgroundColor: 'white' }}><option value="">— Tous —</option>{GENRES.map(g => <option key={g} value={g}>{g}</option>)}</select></div>
                  {selectionEditee && <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '20px' }}><button onClick={() => setSelActif(!selActif)} style={{ padding: '8px 16px', borderRadius: '8px', border: `1px solid ${selActif?C.vert:'#ddd'}`, backgroundColor: selActif?C.fondAlt:'white', color: selActif?C.vert:C.texteSecondaire, fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Georgia, serif' }}>{selActif?'✓ Actif':'○ Masqué'}</button></div>}
                </div>
                {erreurSel && <p style={{ color: '#c0392b', fontSize: '13px', marginBottom: '12px' }}>{erreurSel}</p>}
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={sauvegarderSelection} style={{ backgroundColor: C.vert, color: 'white', border: 'none', borderRadius: '8px', padding: '10px 24px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>{selectionEditee?'Enregistrer':'Ajouter'}</button>
                  <button onClick={() => setFormulaireSelection(false)} style={{ backgroundColor: 'transparent', color: C.texteSecondaire, border: '1px solid #ddd', borderRadius: '8px', padding: '10px 24px', fontSize: '14px', cursor: 'pointer' }}>Annuler</button>
                </div>
              </div>
            )}
            {selectionsFiltrees.length === 0 ? (
              <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '48px', textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                <p style={{ fontSize: '32px', marginBottom: '12px' }}>📚</p>
                <p style={{ color: C.texteSecondaire, fontSize: '15px', margin: '0 0 20px' }}>Aucun livre dans cette sélection</p>
                <button onClick={() => ouvrirFormulaireSelection(null)} style={{ backgroundColor: C.vert, color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>+ Premier livre</button>
              </div>
            ) : (
              <div style={{ backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.07)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr style={{ backgroundColor: '#f5f5f5' }}>{[typeSelectionne==='top_vente'?'Rang':null,'Livre','Auteur','Prix','Stock','Label','Genre','Statut','Actions'].filter(Boolean).map(h => <th key={h as string} style={{ padding: '14px 20px', textAlign: 'left', fontSize: '13px', color: C.texteSecondaire, fontWeight: '600' }}>{h}</th>)}</tr></thead>
                  <tbody>{selectionsFiltrees.map((s, i) => (
                    <tr key={s.id} style={{ borderTop: '1px solid #f0f0f0', backgroundColor: i%2===0?'white':'#fafafa' }}>
                      {typeSelectionne==='top_vente'&&<td style={{ padding: '14px 20px' }}>{s.rang!==null?<span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '50%', backgroundColor: s.rang<=3?C.or:C.fondAlt, color: s.rang<=3?'white':C.vert, fontSize: '13px', fontWeight: '700' }}>#{s.rang}</span>:<span style={{ color: '#ccc' }}>—</span>}</td>}
                      <td style={{ padding: '14px 20px', fontSize: '14px', fontWeight: '600', color: C.texte }}>{s.titre}</td>
                      <td style={{ padding: '14px 20px', fontSize: '14px', color: C.texteSecondaire, fontStyle: 'italic' }}>{s.auteur}</td>
                      <td style={{ padding: '14px 20px', fontSize: '14px', fontWeight: '600', color: C.vert }}>{s.prix} €</td>
                      <td style={{ padding: '14px 20px', fontSize: '14px', color: s.stock>0?C.vert:C.orIntense, fontWeight: '600' }}>{s.stock>0?s.stock+' en stock':'Commande'}</td>
                      <td style={{ padding: '14px 20px', fontSize: '13px', color: C.texteSecondaire, fontStyle: s.label?'italic':'normal' }}>{s.label||'—'}</td>
                      <td style={{ padding: '14px 20px' }}>{s.genre?<span style={{ backgroundColor: C.fondAlt, color: C.vert, padding: '3px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' }}>{s.genre}</span>:<span style={{ color: '#ccc' }}>—</span>}</td>
                      <td style={{ padding: '14px 20px' }}><button onClick={() => toggleActif(s)} style={{ padding: '4px 12px', borderRadius: '20px', border: 'none', fontSize: '12px', fontWeight: '600', cursor: 'pointer', backgroundColor: s.actif?C.fondAlt:'#f5f5f5', color: s.actif?C.vert:'#bbb', fontFamily: 'Georgia, serif' }}>{s.actif?'✓ Actif':'○ Masqué'}</button></td>
                      <td style={{ padding: '14px 20px' }}><div style={{ display: 'flex', gap: '8px' }}><button onClick={() => ouvrirFormulaireSelection(s)} style={{ backgroundColor: '#f0f0f0', color: C.texte, border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>Modifier</button><button onClick={() => supprimerSelection(s.id)} style={{ backgroundColor: 'transparent', color: '#c62828', border: '1px solid #c62828', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>Retirer</button></div></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* ── IMPORT ────────────────────────────────────────────────────── */}
        {onglet === 'import' && (
          <>
            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px', color: C.texte }}>Import de données</h2>
            <p style={{ fontSize: '14px', color: C.texteSecondaire, marginBottom: '32px' }}>
              Séquence recommandée : <strong style={{ color: C.texte }}>1. Catalogue</strong> → <strong style={{ color: C.texte }}>2. Top ventes</strong> → <strong style={{ color: C.texte }}>3. Prix littéraires</strong>
            </p>

            {/* Rapport */}
            {rapportImport && (
              <div style={{ backgroundColor: C.fondAlt, border: `1px solid ${C.vert}`, borderRadius: '12px', padding: '20px 24px', marginBottom: '24px' }}>
                <p style={{ fontWeight: '700', color: C.vert, margin: '0 0 12px', fontSize: '15px' }}>✓ {rapportImport.message}</p>
                <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginBottom: rapportImport.non_trouves?.length ? '12px' : '0' }}>
                  {rapportImport.crees !== undefined && <div><p style={{ fontSize: '11px', color: C.texteSecondaire, letterSpacing: '1px', margin: '0 0 2px', fontWeight: '600' }}>CRÉÉS</p><p style={{ fontSize: '22px', fontWeight: '700', color: C.vert, margin: 0 }}>{rapportImport.crees}</p></div>}
                  {rapportImport.mis_a_jour !== undefined && <div><p style={{ fontSize: '11px', color: C.texteSecondaire, letterSpacing: '1px', margin: '0 0 2px', fontWeight: '600' }}>MIS À JOUR</p><p style={{ fontSize: '22px', fontWeight: '700', color: C.texte, margin: 0 }}>{rapportImport.mis_a_jour}</p></div>}
                  {rapportImport.ajoutes !== undefined && <div><p style={{ fontSize: '11px', color: C.texteSecondaire, letterSpacing: '1px', margin: '0 0 2px', fontWeight: '600' }}>AJOUTÉS</p><p style={{ fontSize: '22px', fontWeight: '700', color: C.vert, margin: 0 }}>{rapportImport.ajoutes}</p></div>}
                  {rapportImport.associes !== undefined && <div><p style={{ fontSize: '11px', color: C.texteSecondaire, letterSpacing: '1px', margin: '0 0 2px', fontWeight: '600' }}>ASSOCIÉS</p><p style={{ fontSize: '22px', fontWeight: '700', color: C.vert, margin: 0 }}>{rapportImport.associes}</p></div>}
                  {rapportImport.scrapes !== undefined && <div><p style={{ fontSize: '11px', color: C.texteSecondaire, letterSpacing: '1px', margin: '0 0 2px', fontWeight: '600' }}>SCRAPÉS</p><p style={{ fontSize: '22px', fontWeight: '700', color: C.texte, margin: 0 }}>{rapportImport.scrapes}</p></div>}
                  {(rapportImport.ignores ?? 0) + (rapportImport.non_trouves_en_base ?? 0) > 0 && <div><p style={{ fontSize: '11px', color: C.texteSecondaire, letterSpacing: '1px', margin: '0 0 2px', fontWeight: '600' }}>IGNORÉS</p><p style={{ fontSize: '22px', fontWeight: '700', color: C.orIntense, margin: 0 }}>{(rapportImport.ignores||0)+(rapportImport.non_trouves_en_base||0)}</p></div>}
                </div>
                {rapportImport.non_trouves && rapportImport.non_trouves.length > 0 && (
                  <details style={{ marginTop: '12px' }}>
                    <summary style={{ fontSize: '13px', color: C.orIntense, cursor: 'pointer', fontWeight: '600' }}>{rapportImport.non_trouves_en_base} titre(s) de Babelio non trouvés dans le catalogue — voir la liste</summary>
                    <div style={{ marginTop: '8px', maxHeight: '160px', overflowY: 'auto', backgroundColor: 'white', borderRadius: '8px', padding: '12px' }}>
                      {rapportImport.non_trouves.map((t, i) => <p key={i} style={{ fontSize: '13px', color: C.texte, margin: '0 0 4px' }}>#{t.rang} {t.titre} <span style={{ color: C.texteSecondaire, fontStyle: 'italic' }}>{t.auteur}</span></p>)}
                    </div>
                  </details>
                )}
              </div>
            )}

            {erreurImport && (
              <div style={{ backgroundColor: '#fff0f0', border: '1px solid #ffcccc', borderRadius: '12px', padding: '16px 20px', marginBottom: '24px', color: '#c0392b', fontSize: '14px' }}>
                ⚠️ {erreurImport}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>

              {/* 1 — Catalogue Dilicom */}
              <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '28px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', borderTop: '4px solid ' + C.vert }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <span style={{ fontSize: '28px' }}>📦</span>
                  <div>
                    <p style={{ fontWeight: '700', fontSize: '16px', margin: 0, color: C.texte }}>Catalogue</p>
                    <p style={{ fontSize: '12px', color: C.texteSecondaire, margin: 0 }}>Fichier CSV Dilicom</p>
                  </div>
                </div>
                <p style={{ fontSize: '13px', color: C.texteSecondaire, lineHeight: '1.6', marginBottom: '20px' }}>
                  Import ou mise à jour de masse depuis votre distributeur. Les livres existants (même ISBN) sont mis à jour, les nouveaux sont créés.
                </p>
                <div
                  style={{ border: `2px dashed ${fichierCatalogue ? C.vert : '#ddd'}`, borderRadius: '10px', padding: '20px', textAlign: 'center', cursor: 'pointer', backgroundColor: fichierCatalogue ? C.fondAlt : '#fafafa', marginBottom: '16px', transition: 'all 0.15s' }}
                  onClick={() => inputCatalogueRef.current?.click()}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) { setFichierCatalogue(f); setAperçu(null); setRapportImport(null); chargerAperçu(f) } }}
                >
                  <input ref={inputCatalogueRef} type="file" accept=".csv,.txt" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) { setFichierCatalogue(f); setAperçu(null); setRapportImport(null); chargerAperçu(f) } }} />
                  {fichierCatalogue ? (
                    <div><p style={{ fontSize: '14px', fontWeight: '600', color: C.vert, margin: '0 0 4px' }}>{fichierCatalogue.name}</p><p style={{ fontSize: '12px', color: C.texteSecondaire, margin: 0 }}>{(fichierCatalogue.size / 1024).toFixed(0)} Ko</p></div>
                  ) : (
                    <div><p style={{ fontSize: '24px', margin: '0 0 8px' }}>📄</p><p style={{ fontSize: '13px', color: C.texteSecondaire, margin: 0 }}>Glisser le fichier ici ou cliquer</p></div>
                  )}
                </div>

                {/* Aperçu colonnes */}
                {chargementAperçu && <p style={{ fontSize: '13px', color: C.texteSecondaire, marginBottom: '12px' }}>Analyse du fichier...</p>}
                {aperçu && (
                  <div style={{ backgroundColor: C.fondAlt, borderRadius: '8px', padding: '12px', marginBottom: '12px' }}>
                    <p style={{ fontSize: '12px', fontWeight: '600', color: C.vert, margin: '0 0 8px', letterSpacing: '1px' }}>COLONNES DÉTECTÉES</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                      {Object.entries(aperçu.colonnes_mappees).map(([champ, col]) => col ? (
                        <span key={champ} style={{ fontSize: '11px', backgroundColor: 'white', border: `1px solid ${C.vert}`, color: C.vert, padding: '3px 8px', borderRadius: '20px', fontWeight: '600' }}>
                          {champ} ← {col}
                        </span>
                      ) : (
                        <span key={champ} style={{ fontSize: '11px', backgroundColor: '#f5f5f5', color: '#bbb', padding: '3px 8px', borderRadius: '20px' }}>{champ} —</span>
                      ))}
                    </div>
                    <p style={{ fontSize: '12px', color: C.texteSecondaire, margin: 0 }}>~{aperçu.total_estime.toLocaleString('fr-FR')} lignes · séparateur « {aperçu.separateur} »</p>
                  </div>
                )}

                <button
                  onClick={lancerImportCatalogue}
                  disabled={!fichierCatalogue || importEnCours === 'catalogue'}
                  style={{ width: '100%', padding: '12px', backgroundColor: fichierCatalogue ? C.vert : '#ddd', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: fichierCatalogue ? 'pointer' : 'not-allowed', fontFamily: 'Georgia, serif' }}
                >
                  {importEnCours === 'catalogue' ? '⏳ Import en cours...' : 'Lancer l\'import'}
                </button>
              </div>

              {/* 2 — Top ventes Babelio */}
              <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '28px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', borderTop: '4px solid ' + C.or }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <span style={{ fontSize: '28px' }}>📈</span>
                  <div>
                    <p style={{ fontWeight: '700', fontSize: '16px', margin: 0, color: C.texte }}>Top ventes France</p>
                    <p style={{ fontSize: '12px', color: C.texteSecondaire, margin: 0 }}>Depuis Babelio</p>
                  </div>
                </div>
                <p style={{ fontSize: '13px', color: C.texteSecondaire, lineHeight: '1.6', marginBottom: '20px' }}>
                  Récupère les ~60 meilleures ventes actuelles sur Babelio et les croise avec les livres de votre catalogue. Les top ventes existants sont remplacés.
                </p>
                <div style={{ backgroundColor: '#fff8e6', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px' }}>
                  <p style={{ fontSize: '12px', color: C.orIntense, margin: 0, lineHeight: '1.5' }}>
                    ⚠️ Les titres non présents dans votre catalogue ne seront pas associés. Importez d'abord le catalogue Dilicom pour maximiser les correspondances.
                  </p>
                </div>
                <div style={{ flex: 1 }} />
                <button
                  onClick={lancerScrapingBabelio}
                  disabled={scrapingEnCours}
                  style={{ width: '100%', padding: '12px', backgroundColor: scrapingEnCours ? '#ddd' : C.orIntense, color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: scrapingEnCours ? 'not-allowed' : 'pointer', fontFamily: 'Georgia, serif', marginTop: '8px' }}
                >
                  {scrapingEnCours ? '⏳ Récupération en cours...' : 'Mettre à jour le top ventes'}
                </button>
                <p style={{ fontSize: '11px', color: '#bbb', textAlign: 'center', marginTop: '8px', marginBottom: 0 }}>Durée estimée : 10 à 20 secondes</p>
              </div>

              {/* 3 — Prix littéraires */}
              <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '28px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', borderTop: '4px solid #8B4513' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <span style={{ fontSize: '28px' }}>🏆</span>
                  <div>
                    <p style={{ fontWeight: '700', fontSize: '16px', margin: 0, color: C.texte }}>Prix littéraires</p>
                    <p style={{ fontSize: '12px', color: C.texteSecondaire, margin: 0 }}>CSV : isbn + label</p>
                  </div>
                </div>
                <p style={{ fontSize: '13px', color: C.texteSecondaire, lineHeight: '1.6', marginBottom: '12px' }}>
                  Fichier CSV à deux colonnes. Les doublons (même ISBN + même label) sont ignorés. Les prix précédents ne sont pas effacés.
                </p>
                <div style={{ backgroundColor: C.fondAlt, borderRadius: '8px', padding: '12px', marginBottom: '16px', fontFamily: 'monospace', fontSize: '12px', color: C.texte }}>
                  <p style={{ margin: '0 0 4px', color: C.texteSecondaire, fontFamily: 'Georgia, serif', fontSize: '11px', letterSpacing: '1px', fontWeight: '600' }}>FORMAT ATTENDU</p>
                  isbn;label<br />
                  9782070360024;Prix Goncourt 2023<br />
                  9782072972232;Prix Renaudot 2023
                </div>
                <div
                  style={{ border: `2px dashed ${fichierPrix ? '#8B4513' : '#ddd'}`, borderRadius: '10px', padding: '16px', textAlign: 'center', cursor: 'pointer', backgroundColor: fichierPrix ? '#fdf5ee' : '#fafafa', marginBottom: '12px' }}
                  onClick={() => inputPrixRef.current?.click()}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) { setFichierPrix(f); setRapportImport(null) } }}
                >
                  <input ref={inputPrixRef} type="file" accept=".csv,.txt" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) { setFichierPrix(f); setRapportImport(null) } }} />
                  {fichierPrix ? <p style={{ fontSize: '14px', fontWeight: '600', color: '#8B4513', margin: 0 }}>{fichierPrix.name}</p> : <p style={{ fontSize: '13px', color: C.texteSecondaire, margin: 0 }}>📄 Glisser ou cliquer</p>}
                </div>
                <button
                  onClick={lancerImportPrix}
                  disabled={!fichierPrix || importEnCours === 'prix'}
                  style={{ width: '100%', padding: '12px', backgroundColor: fichierPrix ? '#8B4513' : '#ddd', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: fichierPrix ? 'pointer' : 'not-allowed', fontFamily: 'Georgia, serif' }}
                >
                  {importEnCours === 'prix' ? '⏳ Import en cours...' : 'Importer les prix'}
                </button>
              </div>

            </div>
          </>
        )}
      </main>
    </div>
  )
}