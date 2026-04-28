'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Hook réutilisable pour les fetches authentifiées côté client.
 *
 * - Ajoute automatiquement le header Authorization avec le clientToken du localStorage
 * - Si le serveur répond 401 ou 403 (token expiré ou invalide), nettoie le localStorage
 *   et redirige vers /compte/connexion avec un message flash dans sessionStorage
 * - Renvoie la Response si tout va bien, null si la déconnexion a été déclenchée
 *
 * Usage :
 *   const { fetchAuth, deconnecter } = useFetchAuth()
 *
 *   const res = await fetchAuth('http://localhost:3001/compte/wishlist')
 *   if (!res) return // l'utilisateur a été déconnecté, on n'essaie pas de parser
 *   const data = await res.json()
 */
export function useFetchAuth() {
  const router = useRouter()

  const deconnecter = useCallback((message?: string) => {
    localStorage.removeItem('clientToken')
    localStorage.removeItem('clientInfo')
    if (message) sessionStorage.setItem('flashMessage', message)
    router.push('/compte/connexion')
  }, [router])

  const fetchAuth = useCallback(async (url: string, options: RequestInit = {}): Promise<Response | null> => {
    const token = localStorage.getItem('clientToken')
    if (!token) {
      deconnecter()
      return null
    }
    const headers = {
      ...(options.headers || {}),
      'Authorization': 'Bearer ' + token,
    }
    const res = await fetch(url, { ...options, headers })
    if (res.status === 401 || res.status === 403) {
      deconnecter('Votre session a expiré. Merci de vous reconnecter.')
      return null
    }
    return res
  }, [deconnecter])

  return { fetchAuth, deconnecter }
}