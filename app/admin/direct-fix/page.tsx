"use client"

import { useState } from "react"
import AdminLayout from "@/components/admin/AdminLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { collection, getDocs, doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

export default function DirectFixPage() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<string[]>([])

  const addDebug = (message: string) => {
    setDebugInfo((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const runDirectFix = async () => {
    setLoading(true)
    setError(null)
    setResults(null)
    setDebugInfo([])

    try {
      addDebug("Starting direct fix...")

      // Get all players
      addDebug("Loading players collection...")
      const playersRef = collection(db, "players")
      const playersSnapshot = await getDocs(playersRef)
      addDebug(`Loaded ${playersSnapshot.docs.length} total players`)

      // Find players with numeric IDs
      const numericIdPlayers = playersSnapshot.docs.filter((doc) => /^\d+$/.test(doc.id))
      addDebug(`Found ${numericIdPlayers.length} players with numeric IDs`)

      // Get all registry players (non-numeric IDs)
      const registryPlayers = playersSnapshot.docs
        .filter((doc) => !/^\d+$/.test(doc.id))
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
      addDebug(`Found ${registryPlayers.length} registry players`)

      let updated = 0
      let failed = 0
      const updateResults = []

      // Process each numeric ID player
      for (const playerDoc of numericIdPlayers) {
        const playerData = playerDoc.data()
        const playerName = playerData.name || ""
        const playerTeam = playerData.team || ""

        addDebug(`Processing: ${playerName} (${playerTeam}) - ID: ${playerDoc.id}`)

        if (!playerName) {
          failed++
          updateResults.push({
            id: playerDoc.id,
            name: "Unknown",
            team: playerTeam,
            status: "no-name",
          })
          continue
        }

        // Find exact match
        const exactMatch = registryPlayers.find((p) => p.name === playerName && p.team === playerTeam)

        if (exactMatch) {
          try {
            await updateDoc(doc(db, "players", playerDoc.id), {
              registryId: exactMatch.id,
            })

            updated++
            updateResults.push({
              id: playerDoc.id,
              name: playerName,
              team: playerTeam,
              registryId: exactMatch.id,
              status: "updated-exact",
            })
            addDebug(`✓ Updated ${playerName} with registryId: ${exactMatch.id}`)
          } catch (error) {
            failed++
            updateResults.push({
              id: playerDoc.id,
              name: playerName,
              team: playerTeam,
              error: error.message,
              status: "failed",
            })
            addDebug(`✗ Failed to update ${playerName}: ${error.message}`)
          }
        } else {
          // Try fuzzy match by name only
          const fuzzyMatch = registryPlayers.find((p) => {
            if (!p.name) return false
            return p.name.toLowerCase() === playerName.toLowerCase()
          })

          if (fuzzyMatch) {
            try {
              await updateDoc(doc(db, "players", playerDoc.id), {
                registryId: fuzzyMatch.id,
              })

              updated++
              updateResults.push({
                id: playerDoc.id,
                name: playerName,
                team: playerTeam,
                registryId: fuzzyMatch.id,
                status: "updated-fuzzy",
              })
              addDebug(`✓ Fuzzy matched ${playerName} with registryId: ${fuzzyMatch.id}`)
            } catch (error) {
              failed++
              updateResults.push({
                id: playerDoc.id,
                name: playerName,
                team: playerTeam,
                error: error.message,
                status: "failed",
              })
              addDebug(`✗ Failed fuzzy update ${playerName}: ${error.message}`)
            }
          } else {
            failed++
            updateResults.push({
              id: playerDoc.id,
              name: playerName,
              team: playerTeam,
              status: "no-match",
            })
            addDebug(`- No match found for ${playerName}`)
          }
        }
      }

      addDebug(`Completed! Updated: ${updated}, Failed: ${failed}`)

      setResults({
        total: numericIdPlayers.length,
        updated,
        failed,
        results: updateResults,
      })
    } catch (err) {
      addDebug(`Error: ${err.message}`)
      setError(err.message || "Failed to run direct fix")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Direct Fix Player IDs</h1>
          <p className="text-gray-600 mt-2">Direct client-side fix for all players with numeric IDs</p>
        </div>

        <div className="flex gap-4">
          <Button onClick={runDirectFix} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
            {loading ? "Fixing..." : "Run Direct Fix"}
          </Button>
        </div>

        {/* Debug Info */}
        {debugInfo.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Debug Log</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm max-h-60 overflow-y-auto">
                {debugInfo.map((info, index) => (
                  <div key={index}>{info}</div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {results && (
          <Card>
            <CardHeader>
              <CardTitle>Fix Results</CardTitle>
              <CardDescription>Results of the direct fix operation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-blue-50 border border-blue-200 rounded p-4 text-center">
                    <div className="text-2xl font-bold">{results.total}</div>
                    <div className="text-sm text-gray-600">Total Players</div>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">{results.updated}</div>
                    <div className="text-sm text-gray-600">Updated</div>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded p-4 text-center">
                    <div className="text-2xl font-bold text-red-600">{results.failed}</div>
                    <div className="text-sm text-gray-600">Failed</div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 px-4 py-2 text-left">ID</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Name</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Team</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Registry ID</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.results.map((result, index) => (
                        <tr key={index}>
                          <td className="border border-gray-300 px-4 py-2">{result.id}</td>
                          <td className="border border-gray-300 px-4 py-2">{result.name}</td>
                          <td className="border border-gray-300 px-4 py-2">{result.team}</td>
                          <td className="border border-gray-300 px-4 py-2 font-mono text-xs">
                            {result.registryId || "-"}
                          </td>
                          <td className="border border-gray-300 px-4 py-2">
                            <span
                              className={
                                result.status.includes("updated")
                                  ? "text-green-600"
                                  : result.status === "no-match"
                                    ? "text-yellow-600"
                                    : "text-red-600"
                              }
                            >
                              {result.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {error && (
          <Card>
            <CardContent>
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  )
}
