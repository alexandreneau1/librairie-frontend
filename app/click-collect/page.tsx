'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ClickCollect() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/panier')
  }, [])
  return null
}