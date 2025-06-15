"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { initializeApp } from "firebase/app"
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signInAnonymously } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, AlertCircle } from "lucide-react"
import Link from "next/link"

// Initialize Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)

export default function LoginPage() {
  const [usernameOrEmail, setUsernameOrEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [guestLoading, setGuestLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()
  const errorParam = searchParams.get("error")

  useEffect(() => {
    // Check if user is already logged in
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Check if user is admin
          const idTokenResult = await user.getIdTokenResult()
          const isAdmin = idTokenResult.claims.admin === true

          if (isAdmin) {
            router.push("/admin")
          } else {
            router.push("/dashboard")
          }
        } catch (error) {
          console.error("Error checking admin status:", error)
          setCheckingAuth(false)
        }
      } else {
        setCheckingAuth(false)
      }
    })

    return () => unsubscribe()
  }, [router])

  useEffect(() => {
    if (errorParam === "unauthorized") {
      setError("You don't have permission to access the admin area.")
    } else if (errorParam === "auth") {
      setError("Authentication error. Please log in again.")
    }
  }, [errorParam])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // Determine if input is username or email
      let email = usernameOrEmail
      if (!usernameOrEmail.includes("@")) {
        email = `${usernameOrEmail}@edfl.fantasy.com`
      }

      // Sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // Check if user is admin
      const idTokenResult = await user.getIdTokenResult()
      const isAdmin = idTokenResult.claims.admin === true

      // Redirect based on role
      if (isAdmin) {
        router.push("/admin")
      } else {
        router.push("/dashboard")
      }
    } catch (error: any) {
      console.error("Login error:", error)
      if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
        setError("Invalid username or password.")
      } else {
        setError("An error occurred during login. Please try again.")
      }
      setLoading(false)
    }
  }

  const handleGuestAccess = async () => {
    setError(null)
    setGuestLoading(true)

    try {
      // Sign in anonymously with Firebase Auth
      await signInAnonymously(auth)

      // Set guest flag in localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("guestUser", "true")
      }

      // Redirect to dashboard
      router.push("/dashboard")
    } catch (error: any) {
      console.error("Guest login error:", error)
      setError("An error occurred during guest access. Please try again.")
      setGuestLoading(false)
    }
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2">Checking authentication...</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">EDFL Fantasy</h1>
          <p className="text-gray-600">Sign in to your account</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>Enter your credentials to access your account</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="usernameOrEmail">Username or Email</Label>
                <Input
                  id="usernameOrEmail"
                  type="text"
                  placeholder="your_username or your.email@example.com"
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link href="#" className="text-xs text-blue-600 hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <Button onClick={handleLogin} disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
            <div className="relative w-full py-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300"></span>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">Or</span>
              </div>
            </div>
            <Button variant="outline" onClick={handleGuestAccess} disabled={guestLoading} className="w-full">
              {guestLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Accessing as guest...
                </>
              ) : (
                "Continue as Guest"
              )}
            </Button>
          </CardFooter>
        </Card>

        <div className="text-center mt-4">
          <p className="text-sm text-gray-600">
            Don't have an account?{" "}
            <Link href="/signup" className="text-blue-600 hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
