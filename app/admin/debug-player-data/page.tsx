"use client"

import { useState } from "react"
import AdminLayout from "@/components/admin/AdminLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { getFirestore, collection, getDocs } from "firebase/firestore"
import { initializeApp } from "firebase/app"

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

export default function DebugPlayerDataPage() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any>(null)

  const checkFirebaseCollections = async () => {
    setLoading(true)
    try {
      const collectionsToCheck = ["players", "playerRegistry", "fantasyPlayers"]
      const results: any = {
        collections: {},
        totalPlayers: 0,
        sampleData: [],
      }

      for (const collectionName of collectionsToCheck) {
        try {
          console.log(`Checking collection: ${collectionName}`)
          const snapshot = await getDocs(collection(db, collectionName))

          results.collections[collectionName] = {
            exists: true,
            count: snapshot.size,
            docs: snapshot.docs.slice(0, 3).map((doc) => ({
              id: doc.id,
              data: doc.data(),
            })),
          }

          if (snapshot.size > 0) {
            results.totalPlayers += snapshot.size
            results.sampleData.push({
              collection: collectionName,
              sample: snapshot.docs[0].data(),
            })
          }
        } catch (error) {
          results.collections[collectionName] = {
            exists: false,
            error: error.message,
          }
        }
      }

      setResults(results)
    } catch (error) {
      console.error("Error checking Firebase:", error)
      setResults({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Debug Player Data</h1>
          <p className="text-muted-foreground">Check what player data exists in Firebase</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Firebase Collections Check</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={checkFirebaseCollections} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Checking Firebase...
                </>
              ) : (
                "Check Firebase Collections"
              )}
            </Button>

            {results && (
              <div className="space-y-4">
                {results.error ? (
                  <div className="bg-red-50 p-4 rounded-md">
                    <h3 className="font-semibold text-red-800">Error</h3>
                    <p className="text-red-600">{results.error}</p>
                  </div>
                ) : (
                  <>
                    <div className="bg-blue-50 p-4 rounded-md">
                      <h3 className="font-semibold text-blue-800">Summary</h3>
                      <p className="text-blue-600">Total players found: {results.totalPlayers}</p>
                    </div>

                    <div className="space-y-3">
                      <h3 className="font-semibold">Collections:</h3>
                      {Object.entries(results.collections).map(([name, info]: [string, any]) => (
                        <div key={name} className="border p-3 rounded-md">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium">{name}</span>
                            <span
                              className={`px-2 py-1 rounded text-xs ${
                                info.exists ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                              }`}
                            >
                              {info.exists ? `${info.count} docs` : "Not found"}
                            </span>
                          </div>

                          {info.exists && info.docs && info.docs.length > 0 && (
                            <div className="mt-2">
                              <p className="text-sm font-medium mb-1">Sample document:</p>
                              <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                                {JSON.stringify(info.docs[0], null, 2)}
                              </pre>
                            </div>
                          )}

                          {info.error && <p className="text-red-600 text-sm">{info.error}</p>}
                        </div>
                      ))}
                    </div>

                    {results.sampleData.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="font-semibold">Sample Data Structures:</h3>
                        {results.sampleData.map((item: any, index: number) => (
                          <div key={index} className="border p-3 rounded-md">
                            <p className="font-medium mb-2">From collection: {item.collection}</p>
                            <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                              {JSON.stringify(item.sample, null, 2)}
                            </pre>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
