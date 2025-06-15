"use client"

import { useState, useEffect } from "react"
import { initializeApp } from "firebase/app"
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore"
import { getAuth, signInAnonymously } from "firebase/auth"
import AdminLayout from "@/components/admin/AdminLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle2, XCircle, AlertTriangle } from "lucide-react"

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
const db = getFirestore(app)
const auth = getAuth(app)

interface TestResult {
  name: string
  status: "pending" | "success" | "error" | "warning"
  message: string
  details?: any
}

export default function FirebaseDebugPage() {
  const [tests, setTests] = useState<TestResult[]>([])
  const [running, setRunning] = useState(false)
  const [matchCount, setMatchCount] = useState(0)
  const [statsCount, setStatsCount] = useState(0)

  const updateTest = (name: string, status: TestResult["status"], message: string, details?: any) => {
    setTests((prev) => {
      const existing = prev.find((t) => t.name === name)
      const newTest = { name, status, message, details }

      if (existing) {
        return prev.map((t) => (t.name === name ? newTest : t))
      } else {
        return [...prev, newTest]
      }
    })
  }

  const runFirebaseTests = async () => {
    setRunning(true)
    setTests([])

    // Test 1: Environment Variables
    updateTest("Environment Variables", "pending", "Checking Firebase configuration...")

    const envVars = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    }

    const missingVars = Object.entries(envVars).filter(([key, value]) => !value)

    if (missingVars.length > 0) {
      updateTest(
        "Environment Variables",
        "error",
        `Missing environment variables: ${missingVars.map(([key]) => key).join(", ")}`,
        { missing: missingVars, provided: envVars },
      )
    } else {
      updateTest("Environment Variables", "success", "All Firebase environment variables are set", envVars)
    }

    // Test 2: Firebase Authentication
    updateTest("Firebase Auth", "pending", "Testing Firebase Authentication...")

    try {
      const currentUser = auth.currentUser
      if (!currentUser) {
        const result = await signInAnonymously(auth)
        updateTest("Firebase Auth", "success", `Anonymous authentication successful. User ID: ${result.user.uid}`, {
          uid: result.user.uid,
          isAnonymous: result.user.isAnonymous,
        })
      } else {
        updateTest("Firebase Auth", "success", `Already authenticated. User ID: ${currentUser.uid}`, {
          uid: currentUser.uid,
          isAnonymous: currentUser.isAnonymous,
        })
      }
    } catch (error: any) {
      updateTest("Firebase Auth", "error", `Authentication failed: ${error.message}`, {
        error: error.code,
        details: error,
      })
    }

    // Test 3: Firestore Connection
    updateTest("Firestore Connection", "pending", "Testing Firestore connection...")

    try {
      const testCollection = collection(db, "connection-test")
      const testDoc = doc(testCollection, "test-doc")

      // Try to write
      await setDoc(testDoc, {
        timestamp: new Date().toISOString(),
        test: true,
      })

      // Try to read
      const snapshot = await getDocs(testCollection)

      // Clean up
      await deleteDoc(testDoc)

      updateTest("Firestore Connection", "success", "Firestore read/write operations successful", {
        documentsFound: snapshot.size,
      })
    } catch (error: any) {
      updateTest("Firestore Connection", "error", `Firestore operation failed: ${error.message}`, {
        error: error.code,
        details: error,
      })
    }

    // Test 4: Check Matches Collection
    updateTest("Matches Collection", "pending", "Checking matches collection...")

    try {
      const matchesSnapshot = await getDocs(collection(db, "matches"))
      const matchCount = matchesSnapshot.size
      setMatchCount(matchCount)

      if (matchCount > 0) {
        const matches = matchesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))

        updateTest(
          "Matches Collection",
          "success",
          `Found ${matchCount} matches in database`,
          { count: matchCount, matches: matches.slice(0, 3) }, // Show first 3 matches
        )
      } else {
        updateTest("Matches Collection", "warning", "No matches found in database", { count: 0 })
      }
    } catch (error: any) {
      updateTest("Matches Collection", "error", `Failed to read matches: ${error.message}`, {
        error: error.code,
        details: error,
      })
    }

    // Test 5: Check Player Stats Collection
    updateTest("Player Stats Collection", "pending", "Checking player stats collection...")

    try {
      const statsSnapshot = await getDocs(collection(db, "playerStats"))
      const statsCount = statsSnapshot.size
      setStatsCount(statsCount)

      if (statsCount > 0) {
        const stats = statsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))

        updateTest(
          "Player Stats Collection",
          "success",
          `Found ${statsCount} player stats records in database`,
          { count: statsCount, stats: stats.slice(0, 3) }, // Show first 3 stats
        )
      } else {
        updateTest("Player Stats Collection", "warning", "No player stats found in database", { count: 0 })
      }
    } catch (error: any) {
      updateTest("Player Stats Collection", "error", `Failed to read player stats: ${error.message}`, {
        error: error.code,
        details: error,
      })
    }

    setRunning(false)
  }

  const getStatusIcon = (status: TestResult["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case "pending":
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
    }
  }

  const getStatusBadge = (status: TestResult["status"]) => {
    const variants = {
      success: "default",
      error: "destructive",
      warning: "secondary",
      pending: "outline",
    } as const

    return <Badge variant={variants[status]}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>
  }

  useEffect(() => {
    runFirebaseTests()
  }, [])

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Firebase Debug</h1>
            <p className="text-muted-foreground">Diagnose Firebase connection and data retrieval</p>
          </div>
          <Button onClick={runFirebaseTests} disabled={running}>
            {running ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running Tests...
              </>
            ) : (
              "Run Tests Again"
            )}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Data Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Matches:</span>
                  <span className="font-bold">{matchCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Player Stats:</span>
                  <span className="font-bold">{statsCount}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Project Info</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Project ID:</span>
                  <br />
                  <span className="text-muted-foreground">
                    {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "Not set"}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Auth Domain:</span>
                  <br />
                  <span className="text-muted-foreground">
                    {process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "Not set"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Test Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Passed:</span>
                  <span className="font-bold text-green-600">{tests.filter((t) => t.status === "success").length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Failed:</span>
                  <span className="font-bold text-red-600">{tests.filter((t) => t.status === "error").length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Warnings:</span>
                  <span className="font-bold text-yellow-600">
                    {tests.filter((t) => t.status === "warning").length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Test Results</h2>

          {tests.map((test, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(test.status)}
                    <CardTitle className="text-lg">{test.name}</CardTitle>
                  </div>
                  {getStatusBadge(test.status)}
                </div>
                <CardDescription>{test.message}</CardDescription>
              </CardHeader>
              {test.details && (
                <CardContent>
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
                      View Details
                    </summary>
                    <pre className="mt-2 p-3 bg-muted rounded-md text-xs overflow-auto">
                      {JSON.stringify(test.details, null, 2)}
                    </pre>
                  </details>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      </div>
    </AdminLayout>
  )
}
