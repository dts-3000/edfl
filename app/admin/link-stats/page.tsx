"use client"

import { useState } from "react"
import AdminLayout from "@/components/admin/AdminLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { collection, getDocs, doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

export default function LinkStatsPage() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<string[]>([])

  const addDebug = (message: string) => {
    setDebugInfo((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const linkStatsToPlayers = async () => {
    setLoading(true)
    setError(null)
    setResults(null)
    setDebugInfo([])

    try {
      addDebug("Starting stats linking process...")

      // Get all players with numeric IDs
      addDebug("Loading players with numeric IDs...")
      const playersRef = collection(db, "players")
      const playersSnapshot = await getDocs(playersRef)
      const numericIdPlayers = playersSnapshot.docs
        .filter((doc) => /^\d+$/.test(doc.id))
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
      addDebug(`Found ${numericIdPlayers.length} players with numeric IDs`)

      // Get all player stats
      addDebug("Loading player stats...")
      const statsRef = collection(db, "playerStats")
      const statsSnapshot = await getDocs(statsRef)
      addDebug(`Found ${statsSnapshot.docs.length} total stats records`)

      let updated = 0
      let failed = 0
      const updateResults = []

      // Process each numeric ID player
      for (const player of numericIdPlayers) {
        const playerName = player.name || ""
        const playerTeam = player.team || ""

        addDebug(`Processing: ${playerName} (${playerTeam}) - ID: ${player.id}`)

        if (!playerName) {
          failed++
          updateResults.push({
            id: player.id,
            name: "Unknown",
            team: playerTeam,
            status: "no-name",
          })
          continue
        }

        // Find stats records for this player by name and team
        const playerStats = statsSnapshot.docs.filter((doc) => {
          const data = doc.data()
          return data.playerName === playerName && data.team === playerTeam
        })

        if (playerStats.length > 0) {
          // Get a unique playerId from the stats (they should all be the same)
          const statsPlayerId = playerStats[0].data().playerId

          if (statsPlayerId && statsPlayerId !== player.id) {
            try {
              // Update the player record with the stats playerId as registryId
              await updateDoc(doc(db, "players", player.id), {
                registryId: statsPlayerId,
              })

              updated++
              updateResults.push({
                id: player.id,
                name: playerName,
                team: playerTeam,
                registryId: statsPlayerId,
                statsCount: playerStats.length,
                status: "linked",
              })
              addDebug(`✓ Linked ${playerName} to stats playerId: ${statsPlayerId} (${playerStats.length} records)`)
            } catch (error) {
              failed++
              updateResults.push({
                id: player.id,
                name: playerName,
                team: playerTeam,
                error: error.message,
                status: "failed",
              })
              addDebug(`✗ Failed to link ${playerName}: ${error.message}`)
            }
          } else {
            // Player ID matches stats playerId, no update needed
            updateResults.push({
              id: player.id,
              name: playerName,
              team: playerTeam,
              statsCount: playerStats.length,
              status: "already-linked",
            })
            addDebug(`- ${playerName} already has matching playerId`)
          }
        } else {
          failed++
          updateResults.push({
            id: player.id,
            name: playerName,
            team: playerTeam,
            status: "no-stats",
          })
          addDebug(`- No stats found for ${playerName}`)
        }
      }

      addDebug(`Completed! Linked: ${updated}, Failed: ${failed}`)

      setResults({
        total: numericIdPlayers.length,
        updated,
        failed,
        results: updateResults,
      })
    } catch (err) {
      addDebug(`Error: ${err.message}`)
      setError(err.message || "Failed to link stats")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Link Stats to Players</h1>
          <p className="text-gray-600 mt-2">Link players with numeric IDs to their existing stats records</p>
        </div>

        <div className="flex gap-4">
          <Button onClick={linkStatsToPlayers} disabled={loading} className="bg-green-600 hover:bg-green-700">
            {loading ? "Linking..." : "Link Stats to Players"}
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
              <CardTitle>Linking Results</CardTitle>
              <CardDescription>Results of the stats linking operation</CardDescription>
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
                    <div className="text-sm text-gray-600">Linked</div>
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
                        <th className="border border-gray-300 px-4 py-2 text-left">Stats Count</th>
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
                          <td className="border border-gray-300 px-4 py-2">{result.statsCount || 0}</td>
                          <td className="border border-gray-300 px-4 py-2">
                            <span
                              className={
                                result.status === "linked"
                                  ? "text-green-600"
                                  : result.status === "no-stats"
                                    ? "text-yellow-600"
                                    : result.status === "already-linked"
                                      ? "text-blue-600"
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
