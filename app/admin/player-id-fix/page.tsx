"use client"

import { useState, useEffect } from "react"
import { collection, getDocs, doc, updateDoc, query, where } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AlertCircle, Search, RefreshCw, CheckCircle } from "lucide-react"
import AdminLayout from "@/components/admin/AdminLayout"

interface Player {
  id: string
  name: string
  team: string
  position: string
  price: number
  status?: string
  registryId?: string
}

export default function PlayerIdFixPage() {
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [players, setPlayers] = useState<Player[]>([])
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>([])
  const [debugInfo, setDebugInfo] = useState<string>("")
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    loadPlayers()
  }, [])

  useEffect(() => {
    if (searchTerm) {
      const filtered = players.filter(
        (player) =>
          player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          player.team.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      setFilteredPlayers(filtered)
    } else {
      setFilteredPlayers(players)
    }
  }, [searchTerm, players])

  const loadPlayers = async () => {
    setLoading(true)
    setDebugInfo("Loading players...")

    try {
      // Load players with numeric IDs
      const playersRef = collection(db, "players")
      const playersSnapshot = await getDocs(playersRef)

      const allPlayers = playersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Player[]

      // Filter for players with numeric IDs
      const numericIdPlayers = allPlayers.filter((player) => {
        return !isNaN(Number(player.id)) || /^\d+$/.test(player.id)
      })

      setPlayers(numericIdPlayers)
      setFilteredPlayers(numericIdPlayers)
      setDebugInfo(
        `Loaded ${numericIdPlayers.length} players with numeric IDs out of ${allPlayers.length} total players`,
      )
    } catch (err) {
      console.error("Error loading players:", err)
      setDebugInfo(`Error: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  const findMatchingStats = async (player: Player) => {
    setDebugInfo(`Searching for stats for ${player.name} (${player.team})...`)

    try {
      // Try to find stats by name and team
      const statsRef = collection(db, "playerStats")
      const nameQuery = query(
        statsRef,
        where("playerName", "==", player.name),
        where("team", "==", player.team),
        where("quarter", "in", ["Total", "All", "total", "all"]),
      )
      const nameSnapshot = await getDocs(nameQuery)

      if (!nameSnapshot.empty) {
        const statDoc = nameSnapshot.docs[0]
        const playerId = statDoc.data().playerId

        setDebugInfo(`Found matching stats for ${player.name} with playerId: ${playerId}`)
        return playerId
      }

      // If no exact match, try fuzzy name matching
      const allStatsQuery = query(
        statsRef,
        where("team", "==", player.team),
        where("quarter", "in", ["Total", "All", "total", "all"]),
      )
      const allStatsSnapshot = await getDocs(allStatsQuery)

      // Simple fuzzy matching - check if player name is contained in stat name or vice versa
      for (const doc of allStatsSnapshot.docs) {
        const statPlayerName = doc.data().playerName

        if (!statPlayerName) continue

        const playerNameLower = player.name.toLowerCase()
        const statNameLower = statPlayerName.toLowerCase()

        if (playerNameLower.includes(statNameLower) || statNameLower.includes(playerNameLower)) {
          const playerId = doc.data().playerId
          setDebugInfo(`Found fuzzy match for ${player.name} → ${statPlayerName} with playerId: ${playerId}`)
          return playerId
        }
      }

      setDebugInfo(`No matching stats found for ${player.name}`)
      return null
    } catch (err) {
      console.error("Error finding matching stats:", err)
      setDebugInfo(`Error finding stats: ${err}`)
      return null
    }
  }

  const updatePlayer = async (player: Player) => {
    setUpdating(true)
    setDebugInfo(`Updating ${player.name}...`)

    try {
      const registryId = await findMatchingStats(player)

      if (registryId) {
        // Update the player document with the registry ID
        const playerRef = doc(db, "players", player.id)
        await updateDoc(playerRef, {
          registryId: registryId,
          updatedAt: new Date(),
        })

        setDebugInfo(`Updated ${player.name} with registryId: ${registryId}`)

        // Update local state
        setPlayers((prev) => prev.map((p) => (p.id === player.id ? { ...p, registryId } : p)))

        return true
      } else {
        setDebugInfo(`Could not update ${player.name} - no matching stats found`)
        return false
      }
    } catch (err) {
      console.error("Error updating player:", err)
      setDebugInfo(`Error updating ${player.name}: ${err}`)
      return false
    } finally {
      setUpdating(false)
    }
  }

  const updateAllPlayers = async () => {
    setUpdating(true)
    setDebugInfo("Starting batch update of all players...")

    let successCount = 0
    let failCount = 0

    for (const player of filteredPlayers) {
      setDebugInfo(`Processing ${player.name} (${player.team})...`)
      const success = await updatePlayer(player)

      if (success) {
        successCount++
      } else {
        failCount++
      }
    }

    setDebugInfo(`Batch update complete. Updated ${successCount} players. Failed: ${failCount}`)
    setUpdating(false)
  }

  const searchMatthewHanson = async () => {
    setSearchTerm("Matthew Hanson")
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Player ID Fix</h1>
          <div className="flex gap-2">
            <Button onClick={loadPlayers} disabled={loading}>
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reload Players
                </>
              )}
            </Button>
            <Button onClick={searchMatthewHanson} variant="outline">
              <Search className="h-4 w-4 mr-2" />
              Find Matthew Hanson
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Players with Numeric IDs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              This tool finds players with numeric IDs and links them to their corresponding stats records.
            </p>

            <div className="mb-4">
              <Input
                placeholder="Search by player name or team..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mb-4"
              />

              <div className="flex gap-2">
                <Button onClick={updateAllPlayers} disabled={updating || filteredPlayers.length === 0}>
                  {updating ? "Updating..." : `Update All Players (${filteredPlayers.length})`}
                </Button>
              </div>
            </div>

            {filteredPlayers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {players.length === 0 ? (
                  <>
                    <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                    <p>No players with numeric IDs found.</p>
                  </>
                ) : (
                  <p>No players match your search criteria.</p>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Player</th>
                      <th className="text-left p-2">Team</th>
                      <th className="text-left p-2">Position</th>
                      <th className="text-left p-2">ID</th>
                      <th className="text-left p-2">Registry ID</th>
                      <th className="text-right p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPlayers.map((player) => (
                      <tr key={player.id} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-medium">{player.name}</td>
                        <td className="p-2">{player.team}</td>
                        <td className="p-2">{player.position}</td>
                        <td className="p-2 font-mono">{player.id}</td>
                        <td className="p-2 font-mono">
                          {player.registryId ? (
                            <span className="text-green-600">{player.registryId}</span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="p-2 text-right">
                          <Button
                            onClick={() => updatePlayer(player)}
                            disabled={updating || !!player.registryId}
                            size="sm"
                            variant={player.registryId ? "outline" : "default"}
                          >
                            {player.registryId ? "Updated" : "Update"}
                          </Button>
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
                <div className="text-sm text-blue-800 whitespace-pre-line">{debugInfo}</div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  )
}
