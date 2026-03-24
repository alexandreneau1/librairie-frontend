'use client'

import { useState, useEffect } from 'react'

export default function Home() {
  const [livres, setLivres] = useState([])
  const [recherche, setRecherche] = useState('')

  useEffect(() => {
    const delai = setTimeout(() => {
      fetch(`http://localhost:3001/livres${recherche ? '?titre=' + recherche : ''}`)
        .then(res => res.json())
        .then(data => setLivres(data))
    }, 300)
    return () => clearTimeout(delai)
  }, [recherche])

  return (
<main className="max-w-4xl mx-auto p-8 bg-white text-black min-h-screen">      <h1 className="text-3xl font-bold mb-2">Ma Librairie</h1>
      <p className="text-gray-500 mb-6">Découvrez notre catalogue</p>

      <input
        type="text"
        placeholder="Rechercher un livre..."
        value={recherche}
        onChange={e => setRecherche(e.target.value)}
        className="w-full border rounded-lg px-4 py-2 mb-8 text-black"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {livres.map((livre) => (
          <div key={livre.id} className="border rounded-lg p-4 hover:shadow-md transition">
            <h2 className="font-semibold text-lg mb-1">{livre.titre}</h2>
            <p className="text-gray-500 text-sm mb-3">{livre.auteur}</p>
            <div className="flex justify-between items-center">
              <span className="font-bold text-lg">{livre.prix} €</span>
              <span className="text-sm text-gray-400">Stock : {livre.stock}</span>
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}