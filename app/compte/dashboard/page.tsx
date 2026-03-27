'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type Commande = { id: number; titre: string; auteur: string; prix: number; type: string; statut: string; date_commande: string }
type Reservation = { id: number; titre: string; auteur: string; prix: number; statut: string; date_reservation: string }
type Vente = { id: number; titre: string; auteur: string; quantite: number; prix_unitaire: number; date_vente: string }
type WishlistItem = { id: number; livre_id: number; titre: string; auteur: string; prix: number; stock: number; date_ajout: string }

export default function Dashboard() {
  const router = useRouter()
  const [onglet, setOnglet] = useState<'commandes' | 'reservations' | 'achats' | 'wishlist'>('commandes')
  const [client, setClient] = useState<{ nom: string; prenom: string; email: string } | null>(null)
  const [commandes, setCommandes] = useState<Commande[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [ventes, setVentes] = useState<Vente[]>([])
  const [wishlist, setWishlist] = useState<WishlistItem[]>([])
  const [chargement, setChargement] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('clientToken')
    const info = localStorage.getItem('clientInfo')
    if (!token || !info) {
      router.push('/compte/connexion')
      return
    }
    setClient(JSON.parse(info))

    fetch('http://localhost:3001/compte/historique', {
      headers: { 'Authorization': 'Bearer ' + token }
    })
      .then(res => res.json())
      .then(data => {
        setCommandes(data.commandes || [])
        setReservations(data.reservations || [])
        setVentes(data.ventes || [])
      })

    fetch('http://localhost:3001/compte/wishlist', {
      headers: { 'Authorization': 'Bearer ' + token }
    })
      .then(res => res.json())
      .then(data => setWishlist(data || []))
      .finally(() => setChargement(false))
  }, [router])

  function deconnexion() {
    localStorage.removeItem('clientToken')
    localStorage.removeItem('clientInfo')
    router.push('/')
  }

  async function retirerWishlist(livre_id: number) {
    const token = localStorage.getItem('clientToken')
    await fetch('http://localhost:3001/compte/wishlist/' + livre_id, {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + token }
    })
    setWishlist(wishlist.filter(w => w.livre_id !== livre_id))
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
  }

  function badgeStatut(statut: string) {
    const couleurs: Record<string, { bg: string; color: string }> = {
      'en attente': { bg: '#fff8e6', color: '#b8860b' },
      'validee': { bg: '#e8f5e9', color: '#2e7d32' },
      'annulee': { bg: '#fff0f0', color: '#c0392b' },
      'pret': { bg: '#e3f2fd', color: '#1565c0' },
      'recupere': { bg: '#e8f5e9', color: '#2e7d32' },
    }
    const style = couleurs[statut] || { bg: '#f5f5f5', color: '#666' }
    return (
      <span style={{ backgroundColor: style.bg, color: style.color, padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
        {statut}
      </span>
    )
  }

  const onglets = [
    { id: 'commandes', label: 'Click & Collect', count: commandes.length },
    { id: 'reservations', label: 'Réservations', count: reservations.length },
    { id: 'achats', label: 'Achats en magasin', count: ventes.length },
    { id: 'wishlist', label: 'Wishlist', count: wishlist.length },
  ]

  if (chargement) {
    return (
      <div style={{ backgroundColor: '#f9f6f1', minHeight: '100vh', fontFamily: 'Georgia, serif', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#888' }}>Chargement...</p>
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: '#f9f6f1', minHeight: '100vh', fontFamily: 'Georgia, serif' }}>

      <header style={{ backgroundColor: '#1a3d2b' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px', boxSizing: 'border-box', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <a href="/" style={{ textDecoration: 'none' }}>
            <h1 style={{ color: 'white', fontSize: '28px', fontWeight: '700', margin: 0, letterSpacing: '2px' }}>BOOKDOG</h1>
            <p style={{ color: '#a8d5b5', fontSize: '12px', margin: '2px 0 0', letterSpacing: '1px' }}>Librairie independante — Paris 17e</p>
          </a>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            {client && (
              <span style={{ color: '#a8d5b5', fontSize: '14px' }}>
                Bonjour, <strong style={{ color: 'white' }}>{client.prenom}</strong>
              </span>
            )}
            <button
              onClick={deconnexion}
              style={{ backgroundColor: 'transparent', border: '1px solid rgba(255,255,255,0.3)', color: '#a8d5b5', padding: '8px 20px', borderRadius: '40px', fontSize: '13px', cursor: 'pointer', fontFamily: 'Georgia, serif' }}
            >
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '60px 24px', boxSizing: 'border-box' }}>
        <div style={{ marginBottom: '40px' }}>
          <p style={{ color: '#1a3d2b', fontSize: '12px', letterSpacing: '2px', marginBottom: '8px' }}>Espace client</p>
          <h2 style={{ fontSize: '32px', fontWeight: '700', color: '#1a1a1a', margin: 0 }}>Mon compte</h2>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', flexWrap: 'wrap' }}>
          {onglets.map(o => (
            <button
              key={o.id}
              onClick={() => setOnglet(o.id as typeof onglet)}
              style={{
                padding: '10px 20px', borderRadius: '40px', border: 'none', cursor: 'pointer', fontSize: '14px', fontFamily: 'Georgia, serif', fontWeight: onglet === o.id ? '700' : '400',
                backgroundColor: onglet === o.id ? '#1a3d2b' : 'white',
                color: onglet === o.id ? 'white' : '#555',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
              }}
            >
              {o.label} {o.count > 0 && <span style={{ marginLeft: '6px', backgroundColor: onglet === o.id ? 'rgba(255,255,255,0.25)' : '#f0f0f0', padding: '2px 8px', borderRadius: '20px', fontSize: '12px' }}>{o.count}</span>}
            </button>
          ))}
        </div>

        {onglet === 'commandes' && (
          <div>
            {commandes.length === 0 ? (
              <p style={{ color: '#999', textAlign: 'center', padding: '60px 0' }}>Aucune commande Click & Collect</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {commandes.map(c => (
                  <div key={c.id} style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <p style={{ fontWeight: '700', fontSize: '16px', margin: '0 0 4px', color: '#1a1a1a' }}>{c.titre}</p>
                      <p style={{ fontSize: '13px', color: '#888', margin: '0 0 8px', fontStyle: 'italic' }}>{c.auteur}</p>
                      <p style={{ fontSize: '12px', color: '#bbb', margin: 0 }}>{formatDate(c.date_commande)}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <span style={{ fontSize: '18px', fontWeight: '700', color: '#1a3d2b' }}>{c.prix} €</span>
                      {badgeStatut(c.statut)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {onglet === 'reservations' && (
          <div>
            {reservations.length === 0 ? (
              <p style={{ color: '#999', textAlign: 'center', padding: '60px 0' }}>Aucune réservation</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {reservations.map(r => (
                  <div key={r.id} style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <p style={{ fontWeight: '700', fontSize: '16px', margin: '0 0 4px', color: '#1a1a1a' }}>{r.titre}</p>
                      <p style={{ fontSize: '13px', color: '#888', margin: '0 0 8px', fontStyle: 'italic' }}>{r.auteur}</p>
                      <p style={{ fontSize: '12px', color: '#bbb', margin: 0 }}>{formatDate(r.date_reservation)}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <span style={{ fontSize: '18px', fontWeight: '700', color: '#1a3d2b' }}>{r.prix} €</span>
                      {badgeStatut(r.statut)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {onglet === 'achats' && (
          <div>
            {ventes.length === 0 ? (
              <p style={{ color: '#999', textAlign: 'center', padding: '60px 0' }}>Aucun achat en magasin enregistré</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {ventes.map(v => (
                  <div key={v.id} style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <p style={{ fontWeight: '700', fontSize: '16px', margin: '0 0 4px', color: '#1a1a1a' }}>{v.titre}</p>
                      <p style={{ fontSize: '13px', color: '#888', margin: '0 0 8px', fontStyle: 'italic' }}>{v.auteur}</p>
                      <p style={{ fontSize: '12px', color: '#bbb', margin: 0 }}>{formatDate(v.date_vente)}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '18px', fontWeight: '700', color: '#1a3d2b', margin: '0 0 4px' }}>{(v.prix_unitaire * v.quantite).toFixed(2)} €</p>
                      <p style={{ fontSize: '12px', color: '#bbb', margin: 0 }}>{v.quantite} ex. × {v.prix_unitaire} €</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {onglet === 'wishlist' && (
          <div>
            {wishlist.length === 0 ? (
              <p style={{ color: '#999', textAlign: 'center', padding: '60px 0' }}>Votre wishlist est vide</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '24px' }}>
                {wishlist.map(w => (
                  <div key={w.id} style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', borderTop: '4px solid #c9a84c' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 6px', color: '#1a1a1a', lineHeight: '1.3' }}>{w.titre}</h3>
                    <p style={{ fontSize: '13px', color: '#888', margin: '0 0 20px', fontStyle: 'italic' }}>{w.auteur}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <span style={{ fontSize: '18px', fontWeight: '700', color: '#1a3d2b' }}>{w.prix} €</span>
                      <span style={{ fontSize: '11px', color: w.stock > 0 ? '#2e7d32' : '#888', backgroundColor: w.stock > 0 ? '#e8f5e9' : '#f5f5f5', padding: '4px 10px', borderRadius: '20px' }}>
                        {w.stock > 0 ? 'En stock' : 'Sur commande'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      
                    <a href={'/livres/' + w.livre_id}
                        style={{ flex: 1, textAlign: 'center' as const, padding: '10px', backgroundColor: '#1a3d2b', color: 'white', borderRadius: '40px', textDecoration: 'none', fontSize: '13px', fontWeight: '700' }}
                      >
                        Réserver
                      </a>
                      <button
                        onClick={() => retirerWishlist(w.livre_id)}
                        style={{ padding: '10px 14px', backgroundColor: '#fff0f0', color: '#c0392b', border: 'none', borderRadius: '40px', fontSize: '13px', cursor: 'pointer', fontFamily: 'Georgia, serif' }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <footer style={{ backgroundColor: '#0f2419', padding: '24px', textAlign: 'center', marginTop: '60px' }}>
        <p style={{ color: '#a8d5b5', fontSize: '13px', margin: 0 }}>2026 Bookdog — Librairie independante Paris 17e</p>
      </footer>

    </div>
  )
}