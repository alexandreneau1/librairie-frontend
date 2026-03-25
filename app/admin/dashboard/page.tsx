'use client'

import { useState, useEffect } from 'react'

export default function Dashboard() {
  const [reservations, setReservations] = useState([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')

  const chargerReservations = function() {
    const token = localStorage.getItem('token')
    if (!token) {
      window.location.href = '/admin'
      return
    }
    fetch('http://localhost:3001/reservations', {
      headers: { 'Authorization': 'Bearer ' + token }
    })
      .then(res => {
        if (res.status === 401 || res.status === 403) {
          window.location.href = '/admin'
          return null
        }
        return res.json()
      })
      .then(data => {
        if (data) setReservations(data)
        setChargement(false)
      })
      .catch(() => {
        setErreur('Impossible de charger les réservations.')
        setChargement(false)
      })
  }

  useEffect(() => {
    chargerReservations()
  }, [])

  const changerStatut = async function(id, statut) {
    const token = localStorage.getItem('token')
    await fetch(`http://localhost:3001/reservations/${id}/statut`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({ statut })
    })
    chargerReservations()
  }

  const handleDeconnexion = function() {
    localStorage.removeItem('token')
    window.location.href = '/admin'
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
          <button
            onClick={handleDeconnexion}
            style={{
              backgroundColor: 'transparent',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '14px',
              cursor: 'pointer'
            }}>
            Déconnexion
          </button>
        </div>
      </header>

      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 24px', boxSizing: 'border-box' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '24px', color: '#1a1a1a' }}>
          Réservations
        </h2>

        {chargement && <p style={{ color: '#999' }}>Chargement...</p>}
        {erreur && <p style={{ color: '#e53935' }}>{erreur}</p>}

        {!chargement && reservations.length === 0 && (
          <p style={{ color: '#999' }}>Aucune réservation pour le moment.</p>
        )}

        {!chargement && reservations.length > 0 && (
          <div style={{ backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.07)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f5f5f5' }}>
                  <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '13px', color: '#666', fontWeight: '600' }}>Client</th>
                  <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '13px', color: '#666', fontWeight: '600' }}>Email</th>
                  <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '13px', color: '#666', fontWeight: '600' }}>Livre</th>
                  <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '13px', color: '#666', fontWeight: '600' }}>Date</th>
                  <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '13px', color: '#666', fontWeight: '600' }}>Statut</th>
                  <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '13px', color: '#666', fontWeight: '600' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map((r, index) => (
                  <tr key={r.id} style={{ borderTop: '1px solid #f0f0f0', backgroundColor: index % 2 === 0 ? 'white' : '#fafafa' }}>
                    <td style={{ padding: '14px 20px', fontSize: '14px', color: '#1a1a1a' }}>{r.nom}</td>
                    <td style={{ padding: '14px 20px', fontSize: '14px', color: '#666' }}>{r.email}</td>
                    <td style={{ padding: '14px 20px', fontSize: '14px', color: '#1a1a1a' }}>{r.titre}</td>
                    <td style={{ padding: '14px 20px', fontSize: '14px', color: '#666' }}>
                      {new Date(r.date_reservation).toLocaleDateString('fr-FR')}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{
                        backgroundColor: r.statut === 'en attente' ? '#fff3e0' : r.statut === 'validee' ? '#e8f5e9' : '#ffebee',
                        color: r.statut === 'en attente' ? '#e65100' : r.statut === 'validee' ? '#1a3d2b' : '#c62828',
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                        {r.statut}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      {r.statut === 'en attente' && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => changerStatut(r.id, 'validee')}
                            style={{
                              backgroundColor: '#1a3d2b',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '6px 12px',
                              fontSize: '12px',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}>
                            Valider
                          </button>
                          <button
                            onClick={() => changerStatut(r.id, 'annulee')}
                            style={{
                              backgroundColor: 'transparent',
                              color: '#c62828',
                              border: '1px solid #c62828',
                              borderRadius: '6px',
                              padding: '6px 12px',
                              fontSize: '12px',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}>
                            Annuler
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}