import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    staleTimes: { dynamic: 0, static: 30 },
  },
  async headers() {
    return [
      {
        // Cache-Control: no-store désactive le BFCache de Chrome sur cette route.
        // Sans BFCache, le retour arrière déclenche un vrai rechargement de page
        // et useEffect s'exécute normalement.
        source: '/livres',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store',
          },
        ],
      },
    ]
  },
}

export default nextConfig