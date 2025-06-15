"use client"

import { useState } from "react"
import AdminLayout from "@/components/admin/AdminLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { Loader2, Link, CheckCircle, AlertCircle } from "lucide-react"
import { generatePlayerIdMapping } from "@/lib/playerRegistry"
import { getFirestore, doc, updateDoc, collection, getDocs } from "firebase/firestore"
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

interface LinkingResult {
  playerName: string
  fantasyId: string
  registryId: string | null
  status: "linked" | "not_found" | "error"
  message: string
}

export default function LinkRegistryIdsPage() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<LinkingResult[]>([])
  const [summary, setSummary] = useState<{
    total: number
    linked: number
    notFound: number
    errors: number
  }>({
    total: 0,
    linked: 0,
    notFound: 0,
    errors: 0,
  })

  const linkRegistryIds = async () => {
    try {
      setLoading(true)
      setResults([])

      // Get fantasy players and registry mapping
      console.log("Loading fantasy players and registry...")
      const [fantasyPlayers, registryMapping] = await Promise.all([
        // Get players from the correct collection
        getDocs(collection(db, "players")).then((playersSnapshot) =>
          playersSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })),
        ),
        generatePlayerIdMapping(),
      ])

      console.log(`Found ${fantasyPlayers.length} fantasy players`)
      console.log(`Found ${Object.keys(registryMapping).length} registry mappings`)

      const linkingResults: LinkingResult[] = []
      let linkedCount = 0
      let notFoundCount = 0
      let errorCount = 0

      // Process each fantasy player
      for (const player of fantasyPlayers) {
        try {
          const playerName = (player.fullName || player.firstName || "").toLowerCase()

          const registryId = registryMapping[playerName]

          if (registryId) {
            // Update the fantasy player with registryId
            const playerRef = doc(db, "players", player.id)
            await updateDoc(playerRef, {
              registryId: registryId,
            })

            linkingResults.push({
              playerName: player.fullName || player.firstName || "Unknown Player",
              fantasyId: player.id,
              registryId: registryId,
              status: "linked",
              message: "Successfully linked to registry",
            })
            linkedCount++
          } else {
            linkingResults.push({
              playerName: player.fullName || player.firstName || "Unknown Player",
              fantasyId: player.id,
              registryId: null,
              status: "not_found",
              message: "No matching player found in registry",
            })
            notFoundCount++
          }
        } catch (error) {
          console.error(`Error linking player ${player.name}:`, error)
          linkingResults.push({
            playerName: player.fullName || player.firstName || "Unknown Player",
            fantasyId: player.id,
            registryId: null,
            status: "error",
            message: `Error: ${error.message}`,
          })
          errorCount++
        }
      }

      setResults(linkingResults)
      setSummary({
        total: fantasyPlayers.length,
        linked: linkedCount,
        notFound: notFoundCount,
        errors: errorCount,
      })

      toast({
        title: "Linking Complete",
        description: `Linked ${linkedCount} players to registry. ${notFoundCount} not found, ${errorCount} errors.`,
      })
    } catch (error) {
      console.error("Error linking registry IDs:", error)
      toast({
        title: "Error",
        description: "Failed to link registry IDs. Please try again.",
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
          <h1 className="text-3xl font-bold tracking-tight">Link Registry IDs</h1>
          <p className="text-muted-foreground">
            Link fantasy players to their Player Registry IDs for proper data mapping
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Registry ID Linking</CardTitle>
            <CardDescription>
              This tool will add `registryId` fields to your fantasy players, linking them to the Player Registry. This
              fixes the ID mapping issues you're experiencing.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Link Fantasy Players to Registry</p>
                <p className="text-sm text-gray-500">
                  Updates fantasy players with registryId fields pointing to Player Registry
                </p>
              </div>
              <Button onClick={linkRegistryIds} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Linking...
                  </>
                ) : (
                  <>
                    <Link className="mr-2 h-4 w-4" />
                    Start Linking
                  </>
                )}
              </Button>
            </div>

            {summary.total > 0 && (
              <div className="grid grid-cols-4 gap-4 mt-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{summary.total}</div>
                  <div className="text-sm text-blue-600">Total Players</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{summary.linked}</div>
                  <div className="text-sm text-green-600">Successfully Linked</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{summary.notFound}</div>
                  <div className="text-sm text-yellow-600">Not Found in Registry</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{summary.errors}</div>
                  <div className="text-sm text-red-600">Errors</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {results.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Linking Results</CardTitle>
              <CardDescription>Detailed results of the registry ID linking process</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {results.map((result, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      result.status === "linked"
                        ? "bg-green-50 border-green-200"
                        : result.status === "not_found"
                          ? "bg-yellow-50 border-yellow-200"
                          : "bg-red-50 border-red-200"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      {result.status === "linked" ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-yellow-600" />
                      )}
                      <div>
                        <div className="font-medium">{result.playerName}</div>
                        <div className="text-sm text-gray-500">Fantasy ID: {result.fantasyId}</div>
                        {result.registryId && (
                          <div className="text-sm text-gray-500">Registry ID: {result.registryId}</div>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">{result.message}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  )
}
