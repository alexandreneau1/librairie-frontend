'use client'

import { useState, useEffect } from 'react'

export default function Dashboard() {
  const [onglet, setOnglet] = useState('reservations')
  const [reservations, setReservations] = useState([])
  const [livres, setLivres] = useState([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')
  const [formulaireLivre, setFormulaireLivre] = useState(false)
  const [livreEdite, setLivreEdite] = useState(null)
  const [titre, setTitre] = useState('')
  const [auteur, setAuteur] = useState('')
  const [isbn, setIsbn] = useState('')
  const [prix, setPrix] = useState('')
  const [stock, setStock] = useState('')

  const token = function() { return localStorage.getItem('token') }

  const chargerReservations = function() {
    fetch('http://localhost:3001/reservations', {
      headers: { 'Authorization': 'Bearer ' + token() }
    })
      .then(res => res.json())
      .then(data => { setReservations(data); setChargement(false) })
      .catch(() => { setErreur('Erreur chargement réservations.'); setChargement(false) })
  }

  const chargerLivres = function() {
    fetch('http://localhost:3001/livres')
      .then(res => res.json())
      .then(data => setLivres(data))
  }

  useEffect(() => {
    if (!token()) { window.location.href = '/admin'; return }
    chargerReservations()
    chargerLivres()
  }, [])

  const changerStatut = async function(id, statut) {
    await fetch(`http://localhost:3001/reservations/${id}/statut`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token() },
      body: JSON.stringify({ statut })
    })
    chargerReservations()
  }

  const ouvrirFormulaire = function(livre) {
    if (livre) {
      setLivreEdite(livre)
      setTitre(livre.titre)
      setAuteur(livre.auteur)
      setIsbn(livre.isbn)
      setPrix(livre.prix)
      setStock(livre.stock)
    } else {
      setLivreEdite(null)
      setTitre('')
      setAuteur('')
      setIsbn('')
      setPrix('')
      setStock('')
    }
    setFormulaireLivre(true)
  }

  const sauvegarderLivre = async function() {
    const body = JSON.stringify({ titre, auteur, isbn, prix: parseFloat(prix), stock: parseInt(stock) })
    const headers = { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token() }
    if (livreEdite) {
      await fetch(`http://localhost:3001/livres/${livreEdite.id}`, { method: 'PUT', headers, body })
    } else {
      await fetch('http://localhost:3001/livres', { method: 'POST', headers, body })
    }
    setFormulaireLivre(false)
    chargerLivres()
  }

  const supprimerLivre = async function(id) {
    if (!confirm('Supprimer ce livre ?')) return
    await fetch(`http://localhost:3001/livres/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + token() }
    })
    chargerLivres()
  }

  const handleDeconnexion = function() {
    localStorage.removeItem('token')
    window.location.href = '/admin'
  }

  const styleOnglet = function(nom) {
    return {
      padding: '10px 24px',
      borderRadius: '8px',
      border: 'none',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      backgroundColor: onglet === nom ? '#1a3d2b' : 'transparent',
      color: onglet === nom ? 'white' : '#666'
    }
  }

  return (
    <div style={{ backgroundColor: '#f9f6f1', minHeight: '100vh' }}>
      <header style={{ backgroundColor: '#1a3d2b', padding: '20px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ color: 'white', fontSize: '22px', fontWeight: '700', margin: 0 }}>Ma Librairie</h1>
          <p style={{ color: '#a8d5b5', fontSize: '13px', margin: '2px 0 0' }}>Tableau de bord</p>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <a href="/" style={{ color: '#a8d5b5', fontSize: '14px', textDecoration: 'none' }}>← Site public</a>
          <button onClick={handleDeconnexion} style={{ backgroundColor: 'transparent', color: 'white', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '8px', padding: '8px 16px', fontSize: '14px', cursor: 'pointer' }}>
            Déconnexion
          </button>
        </div>
      </header>

      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 24px', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', backgroundColor: '#f0ede8', borderRadius: '10px', padding: '6px', width: 'fit-content' }}>
          <button onClick={() => setOnglet('reservations')} style={styleOnglet('reservations')}>Réservations</button>
          <button onClick={() => setOnglet('catalogue')} style={styleOnglet('catalogue')}>Catalogue</button>
        </div>

        {onglet === 'reservations' && (
          <>
            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '24px', color: '#1a1a1a' }}>Réservations</h2>
            {chargement && <p style={{ color: '#999' }}>Chargement...</p>}
            {erreur && <p style={{ color: '#e53935' }}>{erreur}</p>}
            {!chargement && reservations.length === 0 && <p style={{ color: '#999' }}>Aucune réservation.</p>}
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
                        <td style={{ padding: '14px 20px' }}>
                          <span style={{
                            backgroundColor: r.statut === 'en attente' ? '#fff3e0' : r.statut === 'validee' ? '#e8f5e9' : '#ffebee',
                            color: r.statut === 'en attente' ? '#e65100' : r.statut === 'validee' ? '#1a3d2b' : '#c62828',
                            padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600'
                          }}>{r.statut}</span>
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          {r.statut === 'en attente' && (
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button onClick={() => changerStatut(r.id, 'validee')} style={{ backgroundColor: '#1a3d2b', color: 'white', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>Valider</button>
                              <button onClick={() => changerStatut(r.id, 'annulee')} style={{ backgroundColor: 'transparent', color: '#c62828', border: '1px solid #c62828', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>Annuler</button>
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
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px' }}>{livreEdite ? 'Modifier le livre' : 'Nouveau livre'}</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {[['Titre', titre, setTitre], ['Auteur', auteur, setAuteur], ['ISBN', isbn, setIsbn], ['Prix (€)', prix, setPrix], ['Stock', stock, setStock]].map(([label, val, setter]) => (
                    <div key={label}>
                      <label style={{ fontSize: '12px', color: '#999', display: 'block', marginBottom: '4px' }}>{label}</label>
                      <input
                        type="text"
                        value={val}
                        onChange={e => setter(e.target.value)}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', boxSizing: 'border-box' }}
                      />
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
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
                    {['Titre', 'Auteur', 'ISBN', 'Prix', 'Stock', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '14px 20px', textAlign: 'left', fontSize: '13px', color: '#666', fontWeight: '600' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {livres.map((l, i) => (
                    <tr key={l.id} style={{ borderTop: '1px solid #f0f0f0', backgroundColor: i % 2 === 0 ? 'white' : '#fafafa' }}>
                      <td style={{ padding: '14px 20px', fontSize: '14px', fontWeight: '500' }}>{l.titre}</td>
                      <td style={{ padding: '14px 20px', fontSize: '14px', color: '#666' }}>{l.auteur}</td>
                      <td style={{ padding: '14px 20px', fontSize: '14px', color: '#666' }}>{l.isbn}</td>
                      <td style={{ padding: '14px 20px', fontSize: '14px', fontWeight: '600', color: '#1a3d2b' }}>{l.prix} €</td>
                      <td style={{ padding: '14px 20px', fontSize: '14px' }}>{l.stock}</td>
                      <td style={{ padding: '14px 20px' }}>
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