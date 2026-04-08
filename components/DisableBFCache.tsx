'use client'

import { useEffect } from 'react'

// Ce composant ajoute un listener 'unload' vide qui désactive le BFCache
// de Chrome pour toutes les pages de l'application.
// Sans BFCache, le retour arrière déclenche un vrai rechargement de page
// et useEffect s'exécute normalement.
export default function DisableBFCache() {
  useEffect(() => {
    const noop = () => {}
    window.addEventListener('unload', noop)
    return () => window.removeEventListener('unload', noop)
  }, [])
  return null
}