"use client"

import { useState } from "react"
import AdminLayout from "@/components/admin/AdminLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { Loader2, Search, Database } from "lucide-react"
import { getFirestore, collection, getDocs } from "firebase/firestore"
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
const db = getFirestore(app)

interface CollectionInfo {
  name: string
  count: number
  sampleDoc: any
  hasLinJong: boolean
}

export default function FindPlayersPage() {
  const [loading, setLoading] = useState(false)
  const [collections, setCollections] = useState<CollectionInfo[]>([])

  const findPlayerCollections = async () => {
    try {
      setLoading(true)
      setCollections([])

      // List of possible collection names where players might be stored
      const possibleCollections = [
        "fantasyPlayers",
        "players",
        "playerRegistry",
        "fantasy_players",
        "player_data",
        "edfl_players",
        "availablePlayers",
      ]

      const collectionInfos: CollectionInfo[] = []

      for (const collectionName of possibleCollections) {
        try {
          console.log(`Checking collection: ${collectionName}`)
          const collectionRef = collection(db, collectionName)
          const snapshot = await getDocs(collectionRef)

          if (!snapshot.empty) {
            const docs = snapshot.docs
            const sampleDoc = docs[0].data()

            // Check if Lin Jong exists in this collection
            const hasLinJong = docs.some((doc) => {
              const data = doc.data()
              const name = data.name || data.fullName || data.firstName + " " + data.lastName || ""
              return name.toLowerCase().includes("lin jong")
            })

            collectionInfos.push({
              name: collectionName,
              count: docs.length,
              sampleDoc: sampleDoc,
              hasLinJong: hasLinJong,
            })

            console.log(`Found ${docs.length} documents in ${collectionName}`)
            if (hasLinJong) {
              console.log(`Lin Jong found in ${collectionName}!`)
            }
          }
        } catch (error) {
          console.log(`Collection ${collectionName} doesn't exist or error:`, error.message)
        }
      }

      setCollections(collectionInfos)

      if (collectionInfos.length === 0) {
        toast({
          title: "No Player Collections Found",
          description: "No player collections were found in your Firebase database.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Collections Found",
          description: `Found ${collectionInfos.length} collections with player data.`,
        })
      }
    } catch (error) {
      console.error("Error finding player collections:", error)
      toast({
        title: "Error",
        description: "Failed to search for player collections.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Find Player Collections</h1>
          <p className="text-muted-foreground">Discover where your player data is actually stored in Firebase</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Collection Discovery</CardTitle>
            <CardDescription>
              This tool will search for all collections that might contain player data and show you where Lin Jong is
              stored.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Search for Player Collections</p>
                <p className="text-sm text-gray-500">Scans common collection names to find your player data</p>
              </div>
              <Button onClick={findPlayerCollections} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Find Collections
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {collections.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Found Collections</h2>
            {collections.map((collection, index) => (
              <Card key={index} className={collection.hasLinJong ? "border-green-500 bg-green-50" : ""}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center">
                      <Database className="mr-2 h-5 w-5" />
                      {collection.name}
                      {collection.hasLinJong && (
                        <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          Lin Jong Found!
                        </span>
                      )}
                    </span>
                    <span className="text-sm text-gray-500">{collection.count} documents</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      <strong>Document Count:</strong> {collection.count}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Has Lin Jong:</strong> {collection.hasLinJong ? "Yes ✅" : "No ❌"}
                    </p>
                    <details className="mt-4">
                      <summary className="cursor-pointer text-sm font-medium text-gray-700">
                        Sample Document Structure
                      </summary>
                      <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto max-h-40">
                        {JSON.stringify(collection.sampleDoc, null, 2)}
                      </pre>
                    </details>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {collections.length > 0 && (
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-800">Next Steps</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-blue-700 space-y-2">
                <p>Based on the results above:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Collections with Lin Jong (green highlight) contain your actual player data</li>
                  <li>Update the linking tool to use the correct collection name</li>
                  <li>The sample document structure shows what fields are available</li>
                  <li>Use the collection with the most complete player data as your source</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  )
}
