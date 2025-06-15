"use client"

import { useState, useEffect } from "react"
import { getAuth } from "firebase/auth"
import { initializeApp } from "firebase/app"

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

export default function CheckAdminStatus() {
  const [status, setStatus] = useState<string>("Checking...")
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [claims, setClaims] = useState<any>(null)

  useEffect(() => {
    const checkAuth = async () => {
      const auth = getAuth()
      const user = auth.currentUser

      if (user) {
        setUserEmail(user.email)
        try {
          const idTokenResult = await user.getIdTokenResult()
          setClaims(idTokenResult.claims)

          if (idTokenResult.claims.admin === true) {
            setStatus("You have admin privileges")
          } else {
            setStatus("You do NOT have admin privileges")
          }
        } catch (error: any) {
          setStatus(`Error checking admin status: ${error.message}`)
        }
      } else {
        setStatus("No user is signed in")
      }
    }

    checkAuth()

    // Also set up an auth state listener in case the user isn't loaded yet
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        checkAuth()
      }
    })

    return () => unsubscribe()
  }, [])

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Admin Status Check</h1>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <p className="mb-2">
          <strong>User:</strong> {userEmail || "Not signed in"}
        </p>
        <p className="mb-4">
          <strong>Status:</strong> {status}
        </p>

        <div className="mt-4">
          <h2 className="text-lg font-semibold mb-2">All Claims:</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto">
            {claims ? JSON.stringify(claims, null, 2) : "No claims data"}
          </pre>
        </div>
      </div>
    </div>
  )
}
