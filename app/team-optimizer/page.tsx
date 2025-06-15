"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function TeamOptimizerPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to team builder
    router.push("/team-builder")
  }, [router])

  // Return null or a loading state while redirecting
  return null
}
