'use client'

import Header from '../../components/Header'

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

const SERVICES = [
  { icone: '🎁', titre: 'Cadeaux professionnels', description: 'Offrez des livres choisis avec soin à vos collaborateurs, clients ou partenaires. Emballage cadeau et carte personnalisée inclus.' },
  { icone: '🏢', titre: 'Comités d\'entreprise', description: 'Partenariats CE avec tarifs préférentiels, bons d\'achat et accès à notre catalogue complet pour vos salariés.' },
  { icone: '📦', titre: 'Commandes groupées', description: 'Commandes en volume pour vos événements, séminaires ou bibliothèques d\'entreprise. Devis sur mesure.' },
  { icone: '📚', titre: 'Bibliothèques d\'entreprise', description: 'Constituez ou enrichissez votre bibliothèque d\'entreprise avec notre sélection thématique et nos conseils personnalisés.' },
  { icone: '🎤', titre: 'Ateliers & événements', description: 'Rencontres d\'auteurs, ateliers lecture, clubs de lecture en entreprise — nous organisons vos événements culturels.' },
  { icone: '🧾', titre: 'Facturation entreprise', description: 'Facturation en bonne et due forme, paiement différé pour les entreprises référencées, TVA déductible.' },
]

export default function Entreprises() {
  return (
    <div style={{ backgroundColor: C.fond, minHeight: '100vh', fontFamily: 'Georgia, serif' }}>
      <Header pageCourante="entreprises" />

      {/* Hero */}
      <div style={{ backgroundColor: C.vert, paddingBottom: '48px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '48px 24px 0', boxSizing: 'border-box', textAlign: 'center' }}>
          <p style={{ color: C.or, fontSize: '12px', letterSpacing: '2px', margin: '0 0 12px', fontWeight: '600' }}>SERVICES PROFESSIONNELS</p>
          <h1 style={{ color: 'white', fontSize: '40px', fontWeight: '700', margin: '0 0 16px', lineHeight: '1.2' }}>Bookdog pour les entreprises</h1>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '16px', maxWidth: '560px', margin: '0 auto', lineHeight: '1.8' }}>
            Des solutions sur mesure pour enrichir la culture de vos équipes, récompenser vos collaborateurs et célébrer vos partenaires.
          </p>
        </div>
      </div>
      <div style={{ backgroundColor: C.vert, height: '32px', borderRadius: '0 0 50% 50% / 0 0 28px 28px' }} />

      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '48px 24px 60px', boxSizing: 'border-box' }}>

        {/* Badge "en développement" */}
        <div style={{ backgroundColor: '#fff8e6', border: '1px solid #ffe0a0', borderRadius: '12px', padding: '16px 24px', marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '20px' }}>🚧</span>
          <p style={{ fontSize: '14px', color: C.orIntense, margin: 0, lineHeight: '1.5' }}>
            <strong>Espace en cours de développement.</strong> Les services ci-dessous seront disponibles prochainement. En attendant, contactez-nous directement pour toute demande professionnelle.
          </p>
        </div>

        {/* Grille services */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px', marginBottom: '48px' }}>
          {SERVICES.map((s, i) => (
            <div key={i} style={{ backgroundColor: 'white', borderRadius: '14px', padding: '28px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', borderTop: `3px solid ${C.or}` }}>
              <span style={{ fontSize: '28px', display: 'block', marginBottom: '12px' }}>{s.icone}</span>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: C.texte, margin: '0 0 10px' }}>{s.titre}</h3>
              <p style={{ fontSize: '14px', color: C.texteSecondaire, lineHeight: '1.7', margin: 0 }}>{s.description}</p>
            </div>
          ))}
        </div>

        {/* CTA contact */}
        <div style={{ backgroundColor: C.vert, borderRadius: '16px', padding: '40px', textAlign: 'center' }}>
          <p style={{ color: C.or, fontSize: '11px', letterSpacing: '2px', fontWeight: '600', margin: '0 0 12px' }}>PRENDRE CONTACT</p>
          <h2 style={{ color: 'white', fontSize: '26px', fontWeight: '700', margin: '0 0 12px' }}>Une demande professionnelle ?</h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', margin: '0 0 28px', lineHeight: '1.7' }}>
            Notre équipe vous répond sous 24h pour étudier votre projet et vous proposer une offre adaptée.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <a
              href="mailto:Bookdog@librairie.com?subject=Demande services entreprise"
              style={{ backgroundColor: C.or, color: C.vert, padding: '13px 28px', borderRadius: '40px', fontSize: '15px', fontWeight: '700', textDecoration: 'none' }}
            >
              ✉️ Nous écrire
            </a>
            <a
              href="tel:0677402151"
              style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', padding: '13px 28px', borderRadius: '40px', fontSize: '15px', fontWeight: '600', textDecoration: 'none', border: '1px solid rgba(255,255,255,0.2)' }}
            >
              📞 06 77 40 21 51
            </a>
          </div>
        </div>
      </main>

      <footer style={{ backgroundColor: C.footer, padding: '24px', textAlign: 'center' }}>
        <p style={{ color: C.fondAlt, fontSize: '13px', margin: 0 }}>2026 Bookdog — Librairie indépendante Paris 17e</p>
      </footer>
    </div>
  )
}