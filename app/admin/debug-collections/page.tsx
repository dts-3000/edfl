"use client"

import { useState } from "react"
import { collection, getDocs, doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, Database, Search } from "lucide-react"
import AdminLayout from "@/components/admin/AdminLayout"

export default function DebugCollectionsPage() {
  const [loading, setLoading] = useState(false)
  const [debugInfo, setDebugInfo] = useState<string>("")
  const [collections, setCollections] = useState<any[]>([])

  const checkCollections = async () => {
    setLoading(true)
    setDebugInfo("Checking all collections for player data...")

    try {
      const collectionsToCheck = ["fantasyPlayers", "players", "playerStats", "users", "teams", "matches", "vflStats"]

      const results = []

      for (const collectionName of collectionsToCheck) {
        try {
          const collectionRef = collection(db, collectionName)
          const snapshot = await getDocs(collectionRef)

          const docs = snapshot.docs.map((doc) => ({
            id: doc.id,
            data: doc.data(),
          }))

          results.push({
            name: collectionName,
            count: docs.length,
            sampleDoc: docs[0] || null,
            hasPlayerData: docs.some(
              (doc) => doc.data.name || doc.data.fullName || doc.data.firstName || doc.data.playerName,
            ),
          })

          setDebugInfo((prev) => `${prev}\n${collectionName}: ${docs.length} documents`)

          // If this looks like player data, show sample
          if (docs.length > 0 && (docs[0].data.name || docs[0].data.fullName)) {
            setDebugInfo((prev) => `${prev}\n  Sample: ${JSON.stringify(docs[0].data, null, 2).substring(0, 200)}...`)
          }
        } catch (err) {
          setDebugInfo((prev) => `${prev}\n${collectionName}: Error - ${err}`)
          results.push({
            name: collectionName,
            count: 0,
            error: err.toString(),
          })
        }
      }

      setCollections(results)

      // Check if Matthew Hanson exists anywhere
      setDebugInfo((prev) => `${prev}\n\nSearching for Matthew Hanson...`)

      for (const result of results) {
        if (result.count > 0) {
          try {
            const collectionRef = collection(db, result.name)
            const snapshot = await getDocs(collectionRef)

            const matthewDocs = snapshot.docs.filter((doc) => {
              const data = doc.data()
              const searchText = JSON.stringify(data).toLowerCase()
              return searchText.includes("matthew") && searchText.includes("hanson")
            })

            if (matthewDocs.length > 0) {
              setDebugInfo((prev) => `${prev}\nFound Matthew Hanson in ${result.name}:`)
              matthewDocs.forEach((doc) => {
                setDebugInfo((prev) => `${prev}\n  ID: ${doc.id}`)
                setDebugInfo((prev) => `${prev}\n  Data: ${JSON.stringify(doc.data(), null, 2)}`)
              })
            }
          } catch (err) {
            setDebugInfo((prev) => `${prev}\nError searching ${result.name}: ${err}`)
          }
        }
      }
    } catch (err) {
      setDebugInfo((prev) => `${prev}\nError: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  const checkSpecificPlayer = async () => {
    setDebugInfo((prev) => `${prev}\n\nChecking specific player ID 36...`)

    try {
      // Try to find document with ID "36" in various collections
      const collectionsToCheck = ["fantasyPlayers", "players", "playerStats"]

      for (const collectionName of collectionsToCheck) {
        try {
          const docRef = doc(db, collectionName, "36")
          const docSnap = await getDoc(docRef)

          if (docSnap.exists()) {
            setDebugInfo((prev) => `${prev}\nFound document with ID "36" in ${collectionName}:`)
            setDebugInfo((prev) => `${prev}\n${JSON.stringify(docSnap.data(), null, 2)}`)
          } else {
            setDebugInfo((prev) => `${prev}\nNo document with ID "36" in ${collectionName}`)
          }
        } catch (err) {
          setDebugInfo((prev) => `${prev}\nError checking ${collectionName} for ID "36": ${err}`)
        }
      }

      // Also check if there are any documents where a field equals "36"
      for (const collectionName of collectionsToCheck) {
        try {
          const collectionRef = collection(db, collectionName)
          const snapshot = await getDocs(collectionRef)

          const matchingDocs = snapshot.docs.filter((doc) => {
            const data = doc.data()
            return Object.values(data).includes("36") || Object.values(data).includes(36)
          })

          if (matchingDocs.length > 0) {
            setDebugInfo((prev) => `${prev}\nFound documents with value "36" in ${collectionName}:`)
            matchingDocs.forEach((doc) => {
              setDebugInfo((prev) => `${prev}\n  ID: ${doc.id}, Data: ${JSON.stringify(doc.data(), null, 2)}`)
            })
          }
        } catch (err) {
          setDebugInfo((prev) => `${prev}\nError searching for value "36" in ${collectionName}: ${err}`)
        }
      }
    } catch (err) {
      setDebugInfo((prev) => `${prev}\nError checking specific player: ${err}`)
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Debug Collections</h1>
          <div className="flex gap-2">
            <Button onClick={checkCollections} disabled={loading}>
              {loading ? "Checking..." : "Check All Collections"}
            </Button>
            <Button onClick={checkSpecificPlayer} disabled={loading} variant="outline">
              <Search className="h-4 w-4 mr-2" />
              Find Player ID 36
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Collection Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              This tool scans all collections to find where player data is stored and locate Matthew Hanson.
            </p>

            {collections.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Collection</th>
                      <th className="text-right p-2">Document Count</th>
                      <th className="text-center p-2">Has Player Data</th>
                      <th className="text-left p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {collections.map((col) => (
                      <tr key={col.name} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-medium">{col.name}</td>
                        <td className="p-2 text-right">{col.count}</td>
                        <td className="p-2 text-center">
                          {col.hasPlayerData ? (
                            <span className="text-green-600">✓</span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="p-2">
                          {col.error ? (
                            <span className="text-red-500">Error</span>
                          ) : col.count > 0 ? (
                            <span className="text-green-600">Active</span>
                          ) : (
                            <span className="text-gray-500">Empty</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Debug Info */}
        {debugInfo && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800 whitespace-pre-line font-mono">{debugInfo}</div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  )
}
