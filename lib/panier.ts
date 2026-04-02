// ─── Types ────────────────────────────────────────────────────────────────────
export type ArticlePanier = {
  livre_id: number
  titre: string
  auteur: string
  isbn: string
  prix: number
  stock: number
  quantite: number
}

const CLE = 'bookdog_panier'

// ─── Lire le panier ───────────────────────────────────────────────────────────
export function getPanier(): ArticlePanier[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(CLE)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

// ─── Sauvegarder ─────────────────────────────────────────────────────────────
function sauvegarder(panier: ArticlePanier[]) {
  localStorage.setItem(CLE, JSON.stringify(panier))
  // Émet un événement custom pour que les composants se mettent à jour
  window.dispatchEvent(new Event('bookdog_panier_change'))
}

// ─── Ajouter ou incrémenter ───────────────────────────────────────────────────
export function ajouterAuPanier(article: Omit<ArticlePanier, 'quantite'>, quantite = 1): void {
  const panier = getPanier()
  const index = panier.findIndex(a => a.livre_id === article.livre_id)
  if (index !== -1) {
    panier[index].quantite += quantite
  } else {
    panier.push({ ...article, quantite })
  }
  sauvegarder(panier)
}

// ─── Modifier la quantité ─────────────────────────────────────────────────────
export function setQuantite(livre_id: number, quantite: number): void {
  const panier = getPanier()
  const index = panier.findIndex(a => a.livre_id === livre_id)
  if (index === -1) return
  if (quantite <= 0) {
    panier.splice(index, 1)
  } else {
    panier[index].quantite = quantite
  }
  sauvegarder(panier)
}

// ─── Retirer un article ───────────────────────────────────────────────────────
export function retirerDuPanier(livre_id: number): void {
  const panier = getPanier().filter(a => a.livre_id !== livre_id)
  sauvegarder(panier)
}

// ─── Vider le panier ──────────────────────────────────────────────────────────
export function viderPanier(): void {
  sauvegarder([])
}

// ─── Nombre total d'articles ──────────────────────────────────────────────────
export function getNbArticles(): number {
  return getPanier().reduce((acc, a) => acc + a.quantite, 0)
}

// ─── Total prix ───────────────────────────────────────────────────────────────
export function getTotal(): number {
  return getPanier().reduce((acc, a) => acc + a.prix * a.quantite, 0)
}

// ─── Est dans le panier ? ─────────────────────────────────────────────────────
export function estDansPanier(livre_id: number): boolean {
  return getPanier().some(a => a.livre_id === livre_id)
}