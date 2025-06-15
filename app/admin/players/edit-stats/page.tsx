"use client"

import { useState, useEffect } from "react"
import { collection, getDocs, doc, addDoc, setDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Save, Plus, AlertCircle, RefreshCw } from "lucide-react"
import AdminLayout from "@/components/admin/AdminLayout"

interface Player {
  id: string
  name: string
  team: string
  position: string
  avgScore?: number
  breakeven?: number
  price?: number
}

const POSITIONS = ["Forward", "Midfielder", "Defender", "Ruck", "Forward/Midfielder", "Midfielder/Defender"]

export default function EditPlayerStatsPage() {
  const [players, setPlayers] = useState<Player[]>([])
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [editedPlayers, setEditedPlayers] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<string>("")

  useEffect(() => {
    loadPlayers()
  }, [])

  useEffect(() => {
    try {
      if (!Array.isArray(players)) {
        setFilteredPlayers([])
        return
      }

      const filtered = players.filter((player) => {
        if (!player || typeof player !== "object") return false

        const name = player.name || ""
        const team = player.team || ""
        const position = player.position || ""
        const search = searchTerm || ""

        return (
          name.toLowerCase().includes(search.toLowerCase()) ||
          team.toLowerCase().includes(search.toLowerCase()) ||
          position.toLowerCase().includes(search.toLowerCase())
        )
      })
      setFilteredPlayers(filtered)
    } catch (err) {
      console.error("Error filtering players:", err)
      setFilteredPlayers([])
    }
  }, [players, searchTerm])

  const loadPlayers = async () => {
    try {
      setError(null)
      setDebugInfo("Loading players from database...")

      // First try to load from fantasyPlayers collection
      const fantasyPlayersRef = collection(db, "fantasyPlayers")
      const fantasySnapshot = await getDocs(fantasyPlayersRef)

      if (fantasySnapshot.docs.length > 0) {
        const fantasyPlayers = fantasySnapshot.docs.map((doc) => {
          const data = doc.data()
          return {
            id: doc.id,
            name: data.name || "Unknown Player",
            team: data.team || "Unknown Team",
            position: data.position || "Unknown",
            avgScore: typeof data.avgScore === "number" ? data.avgScore : 0,
            breakeven: typeof data.breakeven === "number" ? data.breakeven : 0,
            price: typeof data.price === "number" ? data.price : 0,
          }
        })

        setPlayers(fantasyPlayers)
        setDebugInfo(`Loaded ${fantasyPlayers.length} players from fantasy collection`)
        setLoading(false)
        return
      }

      // If no fantasy players, extract from player stats
      setDebugInfo("Extracting unique players from player stats...")

      const playerStatsRef = collection(db, "playerStats")
      const statsSnapshot = await getDocs(playerStatsRef)

      setDebugInfo(`Found ${statsSnapshot.docs.length} player stat records`)

      // Extract unique players from stats
      const uniquePlayers = new Map<string, Player>()

      statsSnapshot.docs.forEach((doc) => {
        const data = doc.data()
        const playerName = data.playerName || data.name
        const team = data.team

        if (playerName && team && !uniquePlayers.has(playerName)) {
          uniquePlayers.set(playerName, {
            id: `${playerName}-${team}`.replace(/\s+/g, "-").toLowerCase(),
            name: playerName,
            team: team,
            position: "Unknown", // We'll let users set this
            avgScore: 0,
            breakeven: 0,
            price: 300000, // Default price
          })
        }
      })

      const playersArray = Array.from(uniquePlayers.values())
      setPlayers(playersArray)
      setDebugInfo(`Extracted ${playersArray.length} unique players from stats`)
      setLoading(false)
    } catch (error: any) {
      console.error("Error loading players:", error)

      let errorMessage = "Error loading players"
      if (error.message?.includes("timeout")) {
        errorMessage = "Connection timeout - Firebase may be blocked by ad blocker or firewall"
      } else if (error.message?.includes("ERR_BLOCKED_BY_CLIENT")) {
        errorMessage = "Requests blocked - Please disable ad blocker and try again"
      } else if (error.code === "permission-denied") {
        errorMessage = "Permission denied - Please check Firebase security rules"
      } else {
        errorMessage = `Error: ${error.message || error}`
      }

      setError(errorMessage)
      setDebugInfo(`Error details: ${error}`)
      setLoading(false)
    }
  }

  const createSamplePlayers = async () => {
    const samplePlayers = [
      { name: "John Smith", team: "Airport West", position: "Forward", avgScore: 85, breakeven: 65, price: 350000 },
      { name: "Mike Johnson", team: "East Keilor", position: "Midfielder", avgScore: 92, breakeven: 70, price: 400000 },
      { name: "Tom Wilson", team: "Greenvale", position: "Defender", avgScore: 78, breakeven: 60, price: 320000 },
      { name: "Chris Brown", team: "Strathmore", position: "Ruck", avgScore: 88, breakeven: 68, price: 380000 },
      { name: "David Lee", team: "Keilor", position: "Forward", avgScore: 95, breakeven: 75, price: 450000 },
    ]

    try {
      setDebugInfo("Creating sample players...")
      const fantasyPlayersRef = collection(db, "fantasyPlayers")

      for (const player of samplePlayers) {
        await addDoc(fantasyPlayersRef, {
          ...player,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      }

      setDebugInfo("Sample players created successfully")
      await loadPlayers()
    } catch (error: any) {
      const errorMsg = `Error creating sample players: ${error.message || error}`
      setError(errorMsg)
      setDebugInfo(errorMsg)
    }
  }

  const updatePlayer = (playerId: string, field: "avgScore" | "breakeven" | "position", value: string) => {
    try {
      let updateValue: any = value
      if (field === "avgScore" || field === "breakeven") {
        updateValue = Number.parseFloat(value) || 0
      }

      setPlayers((prev) =>
        prev.map((player) => (player.id === playerId ? { ...player, [field]: updateValue } : player)),
      )
      setEditedPlayers((prev) => new Set(prev).add(playerId))
    } catch (err) {
      console.error("Error updating player:", err)
    }
  }

  const savePlayer = async (player: Player) => {
    if (!player?.id) return

    setSaving(player.id)
    try {
      const playerRef = doc(db, "fantasyPlayers", player.id)
      await setDoc(
        playerRef,
        {
          name: player.name,
          team: player.team,
          position: player.position,
          avgScore: player.avgScore || 0,
          breakeven: player.breakeven || 0,
          price: player.price || 300000,
          updatedAt: new Date(),
        },
        { merge: true },
      )

      setEditedPlayers((prev) => {
        const newSet = new Set(prev)
        newSet.delete(player.id)
        return newSet
      })
    } catch (error: any) {
      console.error("Error saving player:", error)
      setError(`Error saving player: ${error.message || error}`)
    } finally {
      setSaving(null)
    }
  }

  const saveAllEdited = async () => {
    const editedPlayersList = players.filter((p) => editedPlayers.has(p.id))

    for (const player of editedPlayersList) {
      await savePlayer(player)
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-4">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
              <div className="text-lg mb-2">Loading players...</div>
              <div className="text-sm text-gray-600">{debugInfo}</div>
            </div>
          </div>
        </div>
      </AdminLayout>
    )
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="space-y-4">
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-800 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Error Loading Players
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-700 mb-4">{error}</p>
              <p className="text-sm text-gray-600 mb-4">Debug info: {debugInfo}</p>
              <div className="flex gap-2">
                <Button onClick={loadPlayers} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry Loading
                </Button>
                <Button onClick={createSamplePlayers} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Sample Data
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Edit Player Stats</h1>
          <div className="flex gap-2">
            <Button onClick={createSamplePlayers} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Sample Players
            </Button>
            <Button
              onClick={saveAllEdited}
              disabled={editedPlayers.size === 0}
              className="bg-green-600 hover:bg-green-700"
            >
              <Save className="h-4 w-4 mr-2" />
              Save All ({editedPlayers.size})
            </Button>
          </div>
        </div>

        {debugInfo && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-4">
              <p className="text-blue-800 text-sm">Debug: {debugInfo}</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Search Players</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, team, or position..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value || "")}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Player Statistics ({filteredPlayers.length} players)</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredPlayers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">
                  {players.length === 0 ? "No players found in database." : "No players match your search."}
                </p>
                {players.length === 0 && (
                  <Button onClick={createSamplePlayers}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Sample Players
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Name</th>
                      <th className="text-left p-2">Team</th>
                      <th className="text-left p-2">Position</th>
                      <th className="text-left p-2">Avg Score</th>
                      <th className="text-left p-2">Breakeven</th>
                      <th className="text-left p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPlayers.map((player) => (
                      <tr key={player.id} className={`border-b ${editedPlayers.has(player.id) ? "bg-yellow-50" : ""}`}>
                        <td className="p-2 font-medium">{player.name}</td>
                        <td className="p-2">{player.team}</td>
                        <td className="p-2">
                          <Select
                            value={player.position}
                            onValueChange={(value) => updatePlayer(player.id, "position", value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue placeholder="Position" />
                            </SelectTrigger>
                            <SelectContent>
                              {POSITIONS.map((pos) => (
                                <SelectItem key={pos} value={pos}>
                                  {pos}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            value={player.avgScore || 0}
                            onChange={(e) => updatePlayer(player.id, "avgScore", e.target.value)}
                            className="w-20"
                            min="0"
                            max="200"
                            step="0.1"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            value={player.breakeven || 0}
                            onChange={(e) => updatePlayer(player.id, "breakeven", e.target.value)}
                            className="w-20"
                            min="0"
                            max="200"
                            step="1"
                          />
                        </td>
                        <td className="p-2">
                          <Button
                            size="sm"
                            onClick={() => savePlayer(player)}
                            disabled={saving === player.id || !editedPlayers.has(player.id)}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            {saving === player.id ? "Saving..." : "Save"}
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

        {editedPlayers.size > 0 && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <span className="text-yellow-800">{editedPlayers.size} player(s) have unsaved changes</span>
                <Button onClick={saveAllEdited} className="bg-green-600 hover:bg-green-700">
                  <Save className="h-4 w-4 mr-2" />
                  Save All Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  )
}
