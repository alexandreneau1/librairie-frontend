'use client'

import { useState, useEffect } from 'react'

export default function Dashboard() {
  const [onglet, setOnglet] = useState('reservations')
  const [reservations, setReservations] = useState([])
  const [commandes, setCommandes] = useState([])
  const [livres, setLivres] = useState([])
  const [chargement, setChargement] = useState(true)
  const [formulaireLivre, setFormulaireLivre] = useState(false)
  const [livreEdite, setLivreEdite] = useState(null)
  const [titre, setTitre] = useState('')
  const [auteur, setAuteur] = useState('')
  const [isbn, setIsbn] = useState('')
  const [prix, setPrix] = useState('')
  const [stock, setStock] = useState('')
  const [genre, setGenre] = useState('')
  const [description, setDescription] = useState('')
  const [editeur, setEditeur] = useState('')
  const [collection, setCollection] = useState('')
  const [datePublication, setDatePublication] = useState('')
  const [urlGoodreads, setUrlGoodreads] = useState('')
  const [rechercheLivre, setRechercheLivre] = useState(false)
  const [apercuCouverture, setApercuCouverture] = useState('')

  const token = function() { return localStorage.getItem('token') }

  const chargerDonnees = function() {
    const headers = { 'Authorization': 'Bearer ' + token() }
    fetch('http://localhost:3001/reservations', { headers })
      .then(res => res.json())
      .then(data => setReservations(Array.isArray(data) ? data : []))
    fetch('http://localhost:3001/commandes', { headers })
      .then(res => res.json())
      .then(data => setCommandes(Array.isArray(data) ? data : []))
    fetch('http://localhost:3001/livres')
      .then(res => res.json())
      .then(data => { setLivres(Array.isArray(data) ? data : []); setChargement(false) })
  }

  useEffect(() => {
    if (!token()) { window.location.href = '/admin'; return }
    chargerDonnees()
  }, [])

  const rechercherGoogleBooks = async function() {
  if (!isbn) return
  setRechercheLivre(true)
  try {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_BOOKS_API_KEY
    const res = await fetch('https://www.googleapis.com/books/v1/volumes?q=isbn:' + isbn + '&key=' + apiKey)
    const data = await res.json()
    if (data.items && data.items.length > 0) {
      const info = data.items[0].volumeInfo
      setTitre(info.title || '')
      setAuteur(info.authors ? info.authors.join(', ') : '')
      setDescription(info.description || '')
      setEditeur(info.publisher || '')
      setDatePublication(info.publishedDate || '')
      if (info.imageLinks && info.imageLinks.thumbnail) {
        setApercuCouverture(info.imageLinks.thumbnail.replace('http://', 'https://'))
      } else {
        setApercuCouverture('')
      }
    } else {
      alert('Aucun livre trouve pour cet ISBN')
    }
  } catch (err) {
    alert('Erreur lors de la recherche Google Books')
  } finally {
    setRechercheLivre(false)
  }
}

  const changerStatutReservation = async function(id, statut) {
    await fetch('http://localhost:3001/reservations/' + id + '/statut', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token() },
      body: JSON.stringify({ statut })
    })
    chargerDonnees()
  }

  const changerStatutCommande = async function(id, statut) {
    await fetch('http://localhost:3001/commandes/' + id + '/statut', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token() },
      body: JSON.stringify({ statut })
    })
    chargerDonnees()
  }

  const ouvrirFormulaire = function(livre) {
    if (livre) {
      setLivreEdite(livre)
      setTitre(livre.titre || '')
      setAuteur(livre.auteur || '')
      setIsbn(livre.isbn || '')
      setPrix(livre.prix || '')
      setStock(livre.stock || '')
      setGenre(livre.genre || '')
      setDescription(livre.description || '')
      setEditeur(livre.editeur || '')
      setCollection(livre.collection || '')
      setDatePublication(livre.date_publication || '')
      setUrlGoodreads(livre.url_goodreads || '')
      setApercuCouverture(livre.isbn ? 'https://books.google.com/books/content?vid=ISBN' + livre.isbn + '&printsec=frontcover&img=1&zoom=1' : '')
    } else {
      setLivreEdite(null)
      setTitre('')
      setAuteur('')
      setIsbn('')
      setPrix('')
      setStock('')
      setGenre('')
      setDescription('')
      setEditeur('')
      setCollection('')
      setDatePublication('')
      setUrlGoodreads('')
      setApercuCouverture('')
    }
    setFormulaireLivre(true)
  }

  const sauvegarderLivre = async function() {
    const body = JSON.stringify({
      titre, auteur, isbn,
      prix: parseFloat(prix),
      stock: parseInt(stock),
      genre, description, editeur, collection,
      date_publication: datePublication,
      url_goodreads: urlGoodreads
    })
    const headers = { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token() }
    if (livreEdite) {
      await fetch('http://localhost:3001/livres/' + livreEdite.id, { method: 'PUT', headers, body })
    } else {
      await fetch('http://localhost:3001/livres', { method: 'POST', headers, body })
    }
    setFormulaireLivre(false)
    chargerDonnees()
  }

  const supprimerLivre = async function(id) {
    if (!confirm('Supprimer ce livre ?')) return
    await fetch('http://localhost:3001/livres/' + id, {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + token() }
    })
    chargerDonnees()
  }

  const handleDeconnexion = function() {
    localStorage.removeItem('token')
    window.location.href = '/admin'
  }

  const styleOnglet = function(nom) {
    return {
      padding: '10px 24px', borderRadius: '8px', border: 'none', fontSize: '14px',
      fontWeight: '600', cursor: 'pointer',
      backgroundColor: onglet === nom ? '#1a3d2b' : 'transparent',
      color: onglet === nom ? 'white' : '#666'
    }
  }

  const badgeStatut = function(statut) {
    const styles = {
      'en attente': { backgroundColor: '#fff3e0', color: '#e65100' },
      'validee': { backgroundColor: '#e8f5e9', color: '#1a3d2b' },
      'annulee': { backgroundColor: '#ffebee', color: '#c62828' },
      'pret': { backgroundColor: '#e3f2fd', color: '#1565c0' },
      'recupere': { backgroundColor: '#f3e5f5', color: '#6a1b9a' }
    }
    const s = styles[statut] || { backgroundColor: '#f5f5f5', color: '#666' }
    return { ...s, padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }
  }

  const GENRES = [
    'Roman', 'Policier', 'Science-fiction', 'Fantasy', 'Biographie',
    'Histoire', 'Essai', 'Jeunesse', 'Bande dessinee', 'Poesie',
    'Thriller', 'Romance', 'Developpement personnel', 'Philosophie', 'Autre'
  ]

  const inputStyle = { width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', boxSizing: 'border-box' as const, fontFamily: 'Georgia, serif' }
  const labelStyle = { fontSize: '12px', color: '#999', display: 'block' as const, marginBottom: '4px' }
  const sectionTitleStyle = { fontSize: '12px', color: '#999', letterSpacing: '1px', marginBottom: '12px', fontWeight: '600' as const }

  return (
    <div style={{ backgroundColor: '#f9f6f1', minHeight: '100vh' }}>
      <header style={{ backgroundColor: '#1a3d2b', padding: '20px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ color: 'white', fontSize: '22px', fontWeight: '700', margin: 0 }}>Bookdog</h1>
          <p style={{ color: '#a8d5b5', fontSize: '13px', margin: '2px 0 0' }}>Tableau de bord</p>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <a href="/" style={{ color: '#a8d5b5', fontSize: '14px', textDecoration: 'none' }}>Site public</a>
          <button onClick={handleDeconnexion} style={{ backgroundColor: 'transparent', color: 'white', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '8px', padding: '8px 16px', fontSize: '14px', cursor: 'pointer' }}>
            Deconnexion
          </button>
        </div>
      </header>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 24px', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', backgroundColor: '#f0ede8', borderRadius: '10px', padding: '6px', width: 'fit-content' }}>
          <button onClick={() => setOnglet('reservations')} style={styleOnglet('reservations')}>Reservations</button>
          <button onClick={() => setOnglet('commandes')} style={styleOnglet('commandes')}>Click and Collect</button>
          <button onClick={() => setOnglet('catalogue')} style={styleOnglet('catalogue')}>Catalogue</button>
        </div>

        {onglet === 'reservations' && (
          <>
            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '24px', color: '#1a1a1a' }}>
              Reservations ({reservations.filter(r => r.statut === 'en attente').length} en attente)
            </h2>
            {chargement && <p style={{ color: '#999' }}>Chargement...</p>}
            {!chargement && reservations.length === 0 && <p style={{ color: '#999' }}>Aucune reservation.</p>}
            {!chargement && reservations.length > 0 && (
              <div style={{ backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.07)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f5f5f5' }}>
                      {['Client', 'Email', 'Livre', 'Date', 'Statut', 'Actions'].map(h => (
                        <th key={h} style={{ padding: '14px 20px', textAlign: 'left', fontSize: '13px', color: '#666', fontWeight: '600' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {reservations.map((r, i) => (
                      <tr key={r.id} style={{ borderTop: '1px solid #f0f0f0', backgroundColor: i % 2 === 0 ? 'white' : '#fafafa' }}>
                        <td style={{ padding: '14px 20px', fontSize: '14px' }}>{r.nom}</td>
                        <td style={{ padding: '14px 20px', fontSize: '14px', color: '#666' }}>{r.email}</td>
                        <td style={{ padding: '14px 20px', fontSize: '14px' }}>{r.titre}</td>
                        <td style={{ padding: '14px 20px', fontSize: '14px', color: '#666' }}>{new Date(r.date_reservation).toLocaleDateString('fr-FR')}</td>
                        <td style={{ padding: '14px 20px' }}><span style={badgeStatut(r.statut)}>{r.statut}</span></td>
                        <td style={{ padding: '14px 20px' }}>
                          {r.statut === 'en attente' && (
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button onClick={() => changerStatutReservation(r.id, 'validee')} style={{ backgroundColor: '#1a3d2b', color: 'white', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>Valider</button>
                              <button onClick={() => changerStatutReservation(r.id, 'annulee')} style={{ backgroundColor: 'transparent', color: '#c62828', border: '1px solid #c62828', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>Annuler</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {onglet === 'commandes' && (
          <>
            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '24px', color: '#1a1a1a' }}>
              Click and Collect ({commandes.filter(c => c.statut === 'en attente').length} en attente)
            </h2>
            {!chargement && commandes.length === 0 && <p style={{ color: '#999' }}>Aucune commande.</p>}
            {!chargement && commandes.length > 0 && (
              <div style={{ backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.07)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f5f5f5' }}>
                      {['Client', 'Email', 'Tel', 'Livre', 'Prix', 'Type', 'Date', 'Statut', 'Actions'].map(h => (
                        <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px', color: '#666', fontWeight: '600' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {commandes.map((c, i) => (
                      <tr key={c.id} style={{ borderTop: '1px solid #f0f0f0', backgroundColor: i % 2 === 0 ? 'white' : '#fafafa' }}>
                        <td style={{ padding: '14px 16px', fontSize: '14px' }}>{c.nom}</td>
                        <td style={{ padding: '14px 16px', fontSize: '13px', color: '#666' }}>{c.email}</td>
                        <td style={{ padding: '14px 16px', fontSize: '13px', color: '#666' }}>{c.telephone || '—'}</td>
                        <td style={{ padding: '14px 16px', fontSize: '14px' }}>{c.titre}</td>
                        <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: '600', color: '#1a3d2b' }}>{c.prix} €</td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ backgroundColor: c.type === 'stock' ? '#e8f5e9' : '#fff8e1', color: c.type === 'stock' ? '#1a3d2b' : '#e65100', padding: '3px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' }}>
                            {c.type === 'stock' ? 'En stock' : 'A commander'}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: '13px', color: '#666' }}>{new Date(c.date_commande).toLocaleDateString('fr-FR')}</td>
                        <td style={{ padding: '14px 16px' }}><span style={badgeStatut(c.statut)}>{c.statut}</span></td>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            {c.statut === 'en attente' && (
                              <>
                                <button onClick={() => changerStatutCommande(c.id, 'pret')} style={{ backgroundColor: '#1a3d2b', color: 'white', border: 'none', borderRadius: '6px', padding: '5px 10px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>Pret</button>
                                <button onClick={() => changerStatutCommande(c.id, 'annulee')} style={{ backgroundColor: 'transparent', color: '#c62828', border: '1px solid #c62828', borderRadius: '6px', padding: '5px 10px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>Annuler</button>
                              </>
                            )}
                            {c.statut === 'pret' && (
                              <button onClick={() => changerStatutCommande(c.id, 'recupere')} style={{ backgroundColor: '#1565c0', color: 'white', border: 'none', borderRadius: '6px', padding: '5px 10px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>Recupere</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {onglet === 'catalogue' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#1a1a1a', margin: 0 }}>Catalogue</h2>
              <button onClick={() => ouvrirFormulaire(null)} style={{ backgroundColor: '#1a3d2b', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                + Ajouter un livre
              </button>
            </div>

            {formulaireLivre && (
              <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '28px', marginBottom: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.07)', borderTop: '4px solid #1a3d2b' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '24px' }}>{livreEdite ? 'Modifier le livre' : 'Nouveau livre'}</h3>

                <p style={sectionTitleStyle}>RECHERCHE AUTOMATIQUE VIA GOOGLE BOOKS</p>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', alignItems: 'flex-end' }}>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>ISBN</label>
                    <input type="text" value={isbn} onChange={e => setIsbn(e.target.value)} placeholder="ex. 9782070360024" style={inputStyle} />
                  </div>
                  <button
                    onClick={rechercherGoogleBooks}
                    disabled={rechercheLivre || !isbn}
                    style={{ padding: '10px 20px', backgroundColor: rechercheLivre || !isbn ? '#ccc' : '#c9a84c', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: rechercheLivre || !isbn ? 'not-allowed' as const : 'pointer' as const, whiteSpace: 'nowrap' as const }}
                  >
                    {rechercheLivre ? 'Recherche...' : 'Remplir via Google Books'}
                  </button>
                  {apercuCouverture && (
                    <img src={apercuCouverture} alt="Couverture" style={{ height: '80px', borderRadius: '4px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }} />
                  )}
                </div>

                <p style={sectionTitleStyle}>INFORMATIONS PRINCIPALES</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                  <div>
                    <label style={labelStyle}>Titre</label>
                    <input type="text" value={titre} onChange={e => setTitre(e.target.value)} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Auteur</label>
                    <input type="text" value={auteur} onChange={e => setAuteur(e.target.value)} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Genre</label>
                    <select value={genre} onChange={e => setGenre(e.target.value)} style={{ ...inputStyle, backgroundColor: 'white' }}>
                      <option value="">— Selectionner un genre —</option>
                      {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Prix (€)</label>
                    <input type="text" value={prix} onChange={e => setPrix(e.target.value)} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Stock</label>
                    <input type="text" value={stock} onChange={e => setStock(e.target.value)} style={inputStyle} />
                  </div>
                </div>

                <p style={sectionTitleStyle}>INFORMATIONS EDITEUR</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                  <div>
                    <label style={labelStyle}>Editeur</label>
                    <input type="text" value={editeur} onChange={e => setEditeur(e.target.value)} style={inputStyle} placeholder="ex. Gallimard" />
                  </div>
                  <div>
                    <label style={labelStyle}>Collection</label>
                    <input type="text" value={collection} onChange={e => setCollection(e.target.value)} style={inputStyle} placeholder="ex. Folio" />
                  </div>
                  <div>
                    <label style={labelStyle}>Date de publication</label>
                    <input type="text" value={datePublication} onChange={e => setDatePublication(e.target.value)} style={inputStyle} placeholder="ex. 2024-01-15" />
                  </div>
                  <div>
                    <label style={labelStyle}>Lien Goodreads</label>
                    <input type="text" value={urlGoodreads} onChange={e => setUrlGoodreads(e.target.value)} style={inputStyle} placeholder="https://www.goodreads.com/book/..." />
                  </div>
                </div>

                <p style={sectionTitleStyle}>DESCRIPTION</p>
                <div style={{ marginBottom: '24px' }}>
                  <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} placeholder="Resume ou presentation du livre..." style={{ ...inputStyle, resize: 'vertical' as const }} />
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={sauvegarderLivre} style={{ backgroundColor: '#1a3d2b', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 24px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                    {livreEdite ? 'Enregistrer' : 'Ajouter'}
                  </button>
                  <button onClick={() => setFormulaireLivre(false)} style={{ backgroundColor: 'transparent', color: '#999', border: '1px solid #ddd', borderRadius: '8px', padding: '10px 24px', fontSize: '14px', cursor: 'pointer' }}>
                    Annuler
                  </button>
                </div>
              </div>
            )}

            <div style={{ backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.07)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f5f5f5' }}>
                    {['Couverture', 'Titre', 'Auteur', 'Genre', 'Editeur', 'Prix', 'Stock', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px', color: '#666', fontWeight: '600' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {livres.map((l, i) => (
                    <tr key={l.id} style={{ borderTop: '1px solid #f0f0f0', backgroundColor: i % 2 === 0 ? 'white' : '#fafafa' }}>
                      <td style={{ padding: '10px 16px' }}>
                        <img
                          src={'https://books.google.com/books/content?vid=ISBN' + l.isbn + '&printsec=frontcover&img=1&zoom=1'}
                          alt={l.titre}
                          style={{ height: '50px', width: '34px', objectFit: 'cover' as const, borderRadius: '2px', boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }}
                          onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                        />
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: '500' }}>{l.titre}</td>
                      <td style={{ padding: '14px 16px', fontSize: '14px', color: '#666' }}>{l.auteur}</td>
                      <td style={{ padding: '14px 16px' }}>
                        {l.genre ? (
                          <span style={{ backgroundColor: '#f0f7f4', color: '#1a3d2b', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>{l.genre}</span>
                        ) : <span style={{ color: '#ccc', fontSize: '13px' }}>—</span>}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '14px', color: '#666' }}>{l.editeur || '—'}</td>
                      <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: '600', color: '#1a3d2b' }}>{l.prix} €</td>
                      <td style={{ padding: '14px 16px', fontSize: '14px' }}>{l.stock}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => ouvrirFormulaire(l)} style={{ backgroundColor: '#f0f0f0', color: '#333', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>Modifier</button>
                          <button onClick={() => supprimerLivre(l.id)} style={{ backgroundColor: 'transparent', color: '#c62828', border: '1px solid #c62828', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>Supprimer</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </div>
  )
}