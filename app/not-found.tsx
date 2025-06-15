"use client"

import Link from "next/link"
import { useAuth } from "@/lib/auth"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function NotFound() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Auto-redirect after 3 seconds if user is authenticated
    if (!loading && user) {
      const timer = setTimeout(() => {
        router.push("/dashboard")
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <h1 className="text-4xl font-bold mb-4 text-gray-900">404</h1>
        <h2 className="text-xl font-semibold mb-4 text-gray-700">Page Not Found</h2>
        <p className="mb-8 text-gray-600">The page you are looking for does not exist or may have been moved.</p>

        <div className="space-y-4">
          <Link
            href={user ? "/dashboard" : "/login"}
            className="block w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Go to {user ? "Dashboard" : "Login"}
          </Link>

          {user && (
            <div className="grid grid-cols-2 gap-2 text-sm">
              <Link
                href="/team-builder"
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
              >
                Team Builder
              </Link>
              <Link
                href="/player-stats"
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
              >
                Player Stats
              </Link>
              <Link
                href="/game-stats"
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
              >
                Game Stats
              </Link>
              <Link
                href="/test-value"
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
              >
                Test Values
              </Link>
            </div>
          )}
        </div>

        {user && <p className="mt-4 text-sm text-gray-500">Redirecting to dashboard in 3 seconds...</p>}
      </div>
    </div>
  )
}
