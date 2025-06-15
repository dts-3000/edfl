"use client"

import { useState, useEffect } from "react"
import { collection, getDocs, doc, updateDoc, query, where } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Search, Save, CheckCircle, Users, Database, RefreshCw } from "lucide-react"
import AdminLayout from "@/components/admin/AdminLayout"

interface Player {
  id: string
  name: string
  team: string
  position?: string
  price?: number
  registryId?: string
  playerNumber?: string
  hasValidFirebaseId: boolean
}

interface RegistryPlayer {
  id: string
  firstName?: string
  lastName?: string
  fullName: string
  currentTeam?: string
  team?: string
  position?: string
  aliases?: string[]
}

export default function FixPlayerIdsPage() {
  const [loading, setLoading] = useState(true)
  const [players, setPlayers] = useState<Player[]>([])
  const [registryPlayers, setRegistryPlayers] = useState<RegistryPlayer[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [assignments, setAssignments] = useState<{ [key: string]: string }>({})
  const [saving, setSaving] = useState(false)
  const [debugInfo, setDebugInfo] = useState<string[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    setDebugInfo(["Loading player data..."])

    try {
      // Load main players
      const playersSnapshot = await getDocs(collection(db, "players"))
      const playersData: Player[] = playersSnapshot.docs.map((doc) => {
        const data = doc.data()
        const registryId = data.registryId || data.playerId || ""

        // Check if registryId is a valid Firebase ID (should be a long string, not just a number)
        const hasValidFirebaseId = registryId && registryId.length > 10 && isNaN(Number(registryId))

        return {
          id: doc.id,
          name: data.name || data.fullName || `${data.firstName || ""} ${data.lastName || ""}`.trim(),
          team: data.team || data.currentTeam || "",
          position: data.position || "",
          price: data.price || data.salary || 0,
          registryId: registryId,
          playerNumber: data.playerNumber || "",
          hasValidFirebaseId,
        }
      })

      // Load registry players
      const registrySnapshot = await getDocs(collection(db, "players"))
      const registryData: RegistryPlayer[] = registrySnapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          firstName: data.firstName,
          lastName: data.lastName,
          fullName: data.fullName || data.name || `${data.firstName || ""} ${data.lastName || ""}`.trim(),
          currentTeam: data.currentTeam || data.team,
          team: data.team || data.currentTeam,
          position: data.position,
          aliases: data.aliases || [],
        }
      })

      setPlayers(playersData)
      setRegistryPlayers(registryData)
      setDebugInfo((prev) => [
        ...prev,
        `Loaded ${playersData.length} players`,
        `Found ${playersData.filter((p) => !p.hasValidFirebaseId).length} players with invalid Firebase IDs`,
        `Loaded ${registryData.length} registry entries`,
      ])
    } catch (error) {
      console.error("Error loading data:", error)
      setDebugInfo((prev) => [...prev, `Error: ${error}`])
    } finally {
      setLoading(false)
    }
  }

  const handleAssignment = (playerId: string, registryId: string) => {
    if (registryId === "none") {
      setAssignments((prev) => {
        const newAssignments = { ...prev }
        delete newAssignments[playerId]
        return newAssignments
      })
    } else {
      setAssignments((prev) => ({
        ...prev,
        [playerId]: registryId,
      }))
    }
  }

  const autoFixIds = () => {
    const newAssignments: { [key: string]: string } = {}

    // Focus on players with invalid Firebase IDs
    const playersNeedingFix = players.filter((p) => !p.hasValidFirebaseId)

    playersNeedingFix.forEach((player) => {
      // Try to find exact match in registry by name and team
      const exactMatch = registryPlayers.find(
        (reg) =>
          reg.fullName.toLowerCase() === player.name.toLowerCase() &&
          (reg.currentTeam === player.team || reg.team === player.team),
      )

      if (exactMatch) {
        newAssignments[player.id] = exactMatch.id
        return
      }

      // Try fuzzy match by name only
      const fuzzyMatch = registryPlayers.find((reg) => {
        const regName = reg.fullName.toLowerCase()
        const playerName = player.name.toLowerCase()

        // Handle special characters like apostrophes
        const normalizedRegName = regName.replace(/[^a-z0-9]/gi, "")
        const normalizedPlayerName = playerName.replace(/[^a-z0-9]/gi, "")

        return (
          regName.includes(playerName) || playerName.includes(regName) || normalizedRegName === normalizedPlayerName
        )
      })

      if (fuzzyMatch) {
        newAssignments[player.id] = fuzzyMatch.id
      }
    })

    setAssignments(newAssignments)
    setDebugInfo((prev) => [...prev, `Auto-assigned ${Object.keys(newAssignments).length} players`])
  }

  const saveAssignments = async () => {
    setSaving(true)
    setDebugInfo((prev) => [...prev, "Saving player ID fixes..."])

    try {
      let updateCount = 0

      for (const [playerId, registryId] of Object.entries(assignments)) {
        if (registryId && registryId !== "none") {
          const playerRef = doc(db, "players", playerId)
          await updateDoc(playerRef, {
            registryId: registryId,
            playerId: registryId,
            updatedAt: new Date().toISOString(),
          })
          updateCount++

          // Also update player stats
          const player = players.find((p) => p.id === playerId)
          if (player) {
            const statsQuery = query(
              collection(db, "playerStats"),
              where("playerName", "==", player.name),
              where("team", "==", player.team),
            )
            const statsSnapshot = await getDocs(statsQuery)

            for (const statDoc of statsSnapshot.docs) {
              await updateDoc(statDoc.ref, {
                playerId: registryId,
                updatedAt: new Date().toISOString(),
              })
            }
          }
        }
      }

      setDebugInfo((prev) => [...prev, `Successfully updated ${updateCount} players`])

      // Reload data
      await loadData()
      setAssignments({})
    } catch (error) {
      console.error("Error saving:", error)
      setDebugInfo((prev) => [...prev, `Error saving: ${error}`])
    } finally {
      setSaving(false)
    }
  }

  // Filter to show only players with invalid Firebase IDs
  const playersNeedingFix = players.filter((player) => {
    const matchesSearch =
      player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      player.team.toLowerCase().includes(searchTerm.toLowerCase())

    return !player.hasValidFirebaseId && matchesSearch
  })

  const getSuggestedMatches = (player: Player): RegistryPlayer[] => {
    return registryPlayers
      .filter((reg) => {
        const regName = reg.fullName.toLowerCase()
        const playerName = player.name.toLowerCase()
        const teamMatch = reg.currentTeam === player.team || reg.team === player.team

        // Exact name and team match
        if (regName === playerName && teamMatch) return true

        // Name similarity
        if (regName.includes(playerName) || playerName.includes(regName)) return true

        // Handle special characters
        const normalizedRegName = regName.replace(/[^a-z0-9]/gi, "")
        const normalizedPlayerName = playerName.replace(/[^a-z0-9]/gi, "")
        if (normalizedRegName === normalizedPlayerName) return true

        // Check aliases
        if (reg.aliases?.some((alias) => alias.toLowerCase().includes(playerName))) return true

        return false
      })
      .sort((a, b) => {
        // Sort by relevance - exact team matches first
        const aTeamMatch = a.currentTeam === player.team || a.team === player.team
        const bTeamMatch = b.currentTeam === player.team || b.team === player.team

        if (aTeamMatch && !bTeamMatch) return -1
        if (!aTeamMatch && bTeamMatch) return 1

        return a.fullName.localeCompare(b.fullName)
      })
      .slice(0, 5)
  }

  const getAssignmentCount = () => {
    return Object.keys(assignments).filter((key) => assignments[key] && assignments[key] !== "none").length
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Fix Player Firebase IDs</h1>
            <p className="text-gray-600">
              Fix players with invalid Firebase IDs (numeric IDs instead of proper Firebase document IDs)
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={autoFixIds} variant="outline" disabled={loading}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Auto-Fix Invalid IDs
            </Button>
            <Button
              onClick={saveAssignments}
              disabled={saving || getAssignmentCount() === 0}
              className="bg-green-600 hover:bg-green-700"
            >
              <Save className="h-4 w-4 mr-2" />
              Save {getAssignmentCount()} Fixes
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Players</p>
                  <p className="text-2xl font-bold">{players.length}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Invalid Firebase IDs</p>
                  <p className="text-2xl font-bold text-red-600">
                    {players.filter((p) => !p.hasValidFirebaseId).length}
                  </p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Valid Firebase IDs</p>
                  <p className="text-2xl font-bold text-green-600">
                    {players.filter((p) => p.hasValidFirebaseId).length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Ready to Fix</p>
                  <p className="text-2xl font-bold text-blue-600">{getAssignmentCount()}</p>
                </div>
                <Database className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Debug Info */}
        {debugInfo.length > 0 && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  {debugInfo.map((line, i) => (
                    <div key={i}>{line}</div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-2">Search Players</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by name or team..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex items-end">
                <Button onClick={loadData} variant="outline" disabled={loading}>
                  {loading ? "Loading..." : "Refresh Data"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Players List */}
        <Card>
          <CardHeader>
            <CardTitle>Players with Invalid Firebase IDs ({playersNeedingFix.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p>Loading players...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {playersNeedingFix.map((player) => {
                  const suggestedMatches = getSuggestedMatches(player)
                  const currentAssignment = assignments[player.id]

                  return (
                    <div key={player.id} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-lg">{player.name}</h3>
                          <p className="text-gray-600">
                            {player.team} | {player.position} | ${player.price?.toLocaleString()}
                          </p>
                          <p className="text-sm text-red-600">
                            Current Invalid ID: <code className="bg-red-100 px-1 rounded">{player.registryId}</code>
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="destructive">Invalid Firebase ID</Badge>
                          {currentAssignment && currentAssignment !== "none" && (
                            <Badge variant="outline" className="bg-blue-100 text-blue-800">
                              Fix Ready
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="mt-3">
                        <label className="block text-sm font-medium mb-2">Assign Correct Firebase ID:</label>
                        <Select
                          value={currentAssignment || "none"}
                          onValueChange={(value) => handleAssignment(player.id, value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select correct registry player..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">-- No Assignment --</SelectItem>
                            {suggestedMatches.map((match) => (
                              <SelectItem key={match.id} value={match.id}>
                                {match.fullName} ({match.currentTeam || match.team || "No team"}) - ID:{" "}
                                {match.id.substring(0, 8)}...
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {suggestedMatches.length === 0 && (
                          <p className="text-sm text-gray-500 mt-1">
                            No suggested matches found. This player may need to be created in the registry first.
                          </p>
                        )}
                      </div>

                      {currentAssignment && currentAssignment !== "none" && (
                        <div className="mt-2 text-sm text-green-600">
                          Will be updated to: <code className="bg-green-100 px-1 rounded">{currentAssignment}</code>
                        </div>
                      )}
                    </div>
                  )
                })}

                {playersNeedingFix.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    {searchTerm ? "No players match your search criteria." : "All players have valid Firebase IDs!"}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
