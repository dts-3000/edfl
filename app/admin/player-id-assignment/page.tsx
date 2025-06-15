"use client"

import { useState, useEffect } from "react"
import { collection, getDocs, doc, writeBatch } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Search, Save, CheckCircle, Users, Database } from "lucide-react"
import AdminLayout from "@/components/admin/AdminLayout"

interface Player {
  id: string
  name: string
  team: string
  position?: string
  price?: number
  registryId?: string
  hasFirebaseId: boolean
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

export default function PlayerIdAssignmentPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<string[]>([])
  const [collections, setCollections] = useState<{ [key: string]: number }>({})
  const [players, setPlayers] = useState<Player[]>([])
  const [registryPlayers, setRegistryPlayers] = useState<RegistryPlayer[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [teamFilter, setTeamFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("missing")
  const [assignments, setAssignments] = useState<{ [key: string]: string }>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function checkFirebase() {
      setLoading(true)
      setError(null)

      try {
        // Add debug info
        setDebugInfo((prev) => [...prev, "Starting Firebase check..."])

        // Check if db is initialized
        if (!db) {
          setError("Firebase database not initialized")
          setDebugInfo((prev) => [...prev, "Error: Firebase database not initialized"])
          return
        }

        setDebugInfo((prev) => [...prev, "Firebase database initialized"])

        // Try to access different collections
        const possibleCollections = [
          "players",
          "fantasyPlayers",
          "playerRegistry",
          "playerStats",
          "matches",
          "teams",
          "users",
        ]

        const collectionCounts: { [key: string]: number } = {}

        for (const collName of possibleCollections) {
          try {
            setDebugInfo((prev) => [...prev, `Checking collection: ${collName}...`])
            const collRef = collection(db, collName)
            const snapshot = await getDocs(collRef)
            collectionCounts[collName] = snapshot.size
            setDebugInfo((prev) => [...prev, `Found ${snapshot.size} documents in ${collName}`])
          } catch (err) {
            setDebugInfo((prev) => [...prev, `Error accessing ${collName}: ${err}`])
          }
        }

        setCollections(collectionCounts)
        await loadData()
      } catch (err) {
        console.error("Firebase check error:", err)
        setError(`Firebase check error: ${err}`)
        setDebugInfo((prev) => [...prev, `Fatal error: ${err}`])
      } finally {
        setLoading(false)
      }
    }

    checkFirebase()
  }, [])

  const loadData = async () => {
    setDebugInfo((prev) => [...prev, "Loading player data..."])

    try {
      // First, let's check what collections exist and load from the correct ones
      const collectionsToLoad = ["players", "fantasyPlayers", "playerRegistry"]
      let allPlayers: Player[] = []
      let registryData: RegistryPlayer[] = []

      // Try to load from different possible collections
      for (const collectionName of collectionsToLoad) {
        try {
          const collectionRef = collection(db, collectionName)
          const snapshot = await getDocs(collectionRef)

          if (!snapshot.empty) {
            setDebugInfo((prev) => [...prev, `Found ${snapshot.size} documents in ${collectionName}`])

            if (collectionName === "players" || collectionName === "fantasyPlayers") {
              // Load main players
              const players: Player[] = snapshot.docs
                .map((doc) => {
                  const data = doc.data()
                  const name =
                    data.name ||
                    data.fullName ||
                    data.playerName ||
                    `${data.firstName || ""} ${data.lastName || ""}`.trim()

                  const team = data.team || data.currentTeam || "Unknown"

                  return {
                    id: doc.id,
                    name: name || "Unknown Player",
                    team: team,
                    position: data.position || "Unknown",
                    price: data.price || data.salary || 0,
                    registryId: data.registryId || data.playerId || "",
                    hasFirebaseId: !!(data.registryId || data.playerId),
                  }
                })
                .filter((player) => player.name && player.name.trim() !== "" && player.name !== "Unknown Player")

              allPlayers = [...allPlayers, ...players]
            }

            if (collectionName === "players" || collectionName === "playerRegistry") {
              // Load registry players (for assignment options)
              const registry: RegistryPlayer[] = snapshot.docs
                .map((doc) => {
                  const data = doc.data()
                  const fullName = data.fullName || data.name || `${data.firstName || ""} ${data.lastName || ""}`.trim()

                  return {
                    id: doc.id,
                    firstName: data.firstName || "",
                    lastName: data.lastName || "",
                    fullName: fullName || "Unknown Player",
                    currentTeam: data.currentTeam || data.team || "Unknown",
                    team: data.team || data.currentTeam || "Unknown",
                    position: data.position || "Unknown",
                    aliases: data.aliases || [],
                  }
                })
                .filter(
                  (player) => player.fullName && player.fullName.trim() !== "" && player.fullName !== "Unknown Player",
                )

              registryData = [...registryData, ...registry]
            }
          }
        } catch (error) {
          setDebugInfo((prev) => [...prev, `Error loading ${collectionName}: ${error}`])
        }
      }

      // Remove duplicates from allPlayers based on name and team
      const uniquePlayers = allPlayers.filter(
        (player, index, self) => index === self.findIndex((p) => p.name === player.name && p.team === player.team),
      )

      // Remove duplicates from registryData based on fullName
      const uniqueRegistry = registryData.filter(
        (player, index, self) => index === self.findIndex((p) => p.fullName === player.fullName),
      )

      setPlayers(uniquePlayers)
      setRegistryPlayers(uniqueRegistry)
      setDebugInfo((prev) => [
        ...prev,
        `Final: ${uniquePlayers.length} unique players, ${uniqueRegistry.length} registry entries`,
      ])
    } catch (error) {
      console.error("Error loading data:", error)
      setDebugInfo((prev) => [...prev, `Error: ${error}`])
    }
  }

  const handleAssignment = (playerId: string, registryId: string) => {
    if (registryId === "none") {
      // Remove assignment
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

  const saveAssignments = async () => {
    setSaving(true)
    setDebugInfo((prev) => [...prev, "Saving player ID assignments..."])

    try {
      const batch = writeBatch(db)
      let updateCount = 0

      // Update each player with their assigned registry ID
      for (const [playerId, registryId] of Object.entries(assignments)) {
        if (registryId && registryId !== "none") {
          // Try to update in the collection where this player was found
          const collections = ["players", "fantasyPlayers"]

          for (const collectionName of collections) {
            try {
              const playerRef = doc(db, collectionName, playerId)
              batch.update(playerRef, {
                registryId: registryId,
                playerId: registryId, // Also set playerId for compatibility
                updatedAt: new Date().toISOString(),
              })
              updateCount++
              break // Only update in one collection
            } catch (error) {
              // Continue to next collection if this one fails
            }
          }
        }
      }

      if (updateCount > 0) {
        await batch.commit()
        setDebugInfo((prev) => [...prev, `Successfully updated ${updateCount} player assignments`])

        // Update player stats with the new registry IDs
        await updatePlayerStats()

        // Reload data to reflect changes
        await loadData()

        // Clear assignments
        setAssignments({})
      } else {
        setDebugInfo((prev) => [...prev, "No valid assignments to save"])
      }
    } catch (error) {
      console.error("Error saving assignments:", error)
      setDebugInfo((prev) => [...prev, `Error saving: ${error}`])
    } finally {
      setSaving(false)
    }
  }

  const updatePlayerStats = async () => {
    setDebugInfo((prev) => [...prev, "Updating player stats with new IDs..."])

    try {
      // Get all player stats
      const statsRef = collection(db, "playerStats")
      const statsSnapshot = await getDocs(statsRef)

      const batch = writeBatch(db)
      let statsUpdateCount = 0

      // For each assignment, update corresponding stats
      for (const [playerId, registryId] of Object.entries(assignments)) {
        if (!registryId || registryId === "none") continue

        // Find the player to get their name and team
        const player = players.find((p) => p.id === playerId)
        if (!player) continue

        // Find stats records that match this player by name and team
        const matchingStats = statsSnapshot.docs.filter((doc) => {
          const data = doc.data()
          return (
            data.playerName === player.name && data.team === player.team && !data.playerId // Only update stats that don't already have a player ID
          )
        })

        // Update each matching stat record
        matchingStats.forEach((statDoc) => {
          batch.update(statDoc.ref, {
            playerId: registryId,
            updatedAt: new Date().toISOString(),
          })
          statsUpdateCount++
        })
      }

      if (statsUpdateCount > 0) {
        await batch.commit()
        setDebugInfo((prev) => [...prev, `Updated ${statsUpdateCount} player stat records`])
      } else {
        setDebugInfo((prev) => [...prev, "No player stats needed updating"])
      }
    } catch (error) {
      console.error("Error updating player stats:", error)
      setDebugInfo((prev) => [...prev, `Error updating stats: ${error}`])
    }
  }

  const autoAssignMatches = () => {
    const newAssignments: { [key: string]: string } = {}

    players.forEach((player) => {
      if (player.hasFirebaseId) return // Skip players that already have IDs

      // Try to find exact match in registry
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
        return regName.includes(playerName) || playerName.includes(regName)
      })

      if (fuzzyMatch) {
        newAssignments[player.id] = fuzzyMatch.id
      }
    })

    setAssignments(newAssignments)
    setDebugInfo((prev) => [...prev, `Auto-assigned ${Object.keys(newAssignments).length} players`])
  }

  // Filter players
  const filteredPlayers = players.filter((player) => {
    const matchesSearch =
      player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      player.team.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesTeam = teamFilter === "all" || player.team === teamFilter

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "missing" && !player.hasFirebaseId) ||
      (statusFilter === "hasid" && player.hasFirebaseId) ||
      (statusFilter === "assigned" && assignments[player.id])

    return matchesSearch && matchesTeam && matchesStatus
  })

  // Get unique teams (filter out empty/undefined teams)
  const teams = [
    "all",
    ...Array.from(new Set(players.map((p) => p.team).filter((team) => team && team.trim() !== ""))).sort(),
  ]

  // Get suggested registry players for a specific player
  const getSuggestedMatches = (player: Player): RegistryPlayer[] => {
    return registryPlayers
      .filter((reg) => {
        const regName = reg.fullName.toLowerCase()
        const playerName = player.name.toLowerCase()
        const teamMatch = reg.currentTeam === player.team || reg.team === player.team

        // Exact name match with team match gets highest priority
        if (regName === playerName && teamMatch) return true

        // Name similarity
        if (regName.includes(playerName) || playerName.includes(regName)) return true

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
      .slice(0, 5) // Limit to top 5 suggestions
  }

  const getAssignmentCount = () => {
    return Object.keys(assignments).filter((key) => assignments[key] && assignments[key] !== "none").length
  }

  const getMissingIdCount = () => {
    return players.filter((p) => !p.hasFirebaseId).length
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Player ID Assignment</h1>
            <p className="text-gray-600">Assign Firebase IDs to players and update across the app</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={autoAssignMatches} variant="outline" disabled={loading}>
              <Users className="h-4 w-4 mr-2" />
              Auto-Assign Matches
            </Button>
            <Button
              onClick={saveAssignments}
              disabled={saving || getAssignmentCount() === 0}
              className="bg-green-600 hover:bg-green-700"
            >
              <Save className="h-4 w-4 mr-2" />
              Save {getAssignmentCount()} Assignments
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
                  <p className="text-sm text-gray-600">Missing Firebase ID</p>
                  <p className="text-2xl font-bold text-red-600">{getMissingIdCount()}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Has Firebase ID</p>
                  <p className="text-2xl font-bold text-green-600">{players.length - getMissingIdCount()}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Ready to Save</p>
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
                <div className="text-sm text-blue-800 whitespace-pre-line">
                  {debugInfo.map((line, i) => (
                    <div key={i}>{line}</div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Firebase Debug */}
        {loading ? (
          <div className="bg-blue-50 p-4 rounded-md">
            <p>Loading Firebase data...</p>
            <div className="mt-2 animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 p-4 rounded-md text-red-700 border border-red-200">
            <h2 className="font-bold">Error</h2>
            <p>{error}</p>
          </div>
        ) : (
          <div>
            <div className="bg-green-50 p-4 rounded-md mb-6 border border-green-200">
              <h2 className="font-bold text-green-800">Firebase Connected Successfully</h2>
              <p className="text-green-700">Your Firebase connection is working.</p>
            </div>

            <h2 className="text-xl font-semibold mb-2">Collections Found:</h2>
            <div className="bg-white p-4 rounded-md shadow mb-6">
              <ul className="space-y-1">
                {Object.entries(collections).map(([name, count]) => (
                  <li key={name} className="flex justify-between">
                    <span className="font-medium">{name}</span>
                    <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs">
                      {count} documents
                    </span>
                  </li>
                ))}
                {Object.keys(collections).length === 0 && (
                  <li className="text-gray-500">No collections found or accessible</li>
                )}
              </ul>
            </div>
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Search</label>
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

              <div>
                <label className="block text-sm font-medium mb-2">Team</label>
                <Select value={teamFilter} onValueChange={setTeamFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select team" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Teams</SelectItem>
                    {teams
                      .filter((team) => team !== "all")
                      .map((team) => (
                        <SelectItem key={team} value={team}>
                          {team}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Players</SelectItem>
                    <SelectItem value="missing">Missing Firebase ID</SelectItem>
                    <SelectItem value="hasid">Has Firebase ID</SelectItem>
                    <SelectItem value="assigned">Assigned (Unsaved)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button onClick={loadData} variant="outline" disabled={loading} className="w-full">
                  {loading ? "Loading..." : "Refresh Data"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Players List */}
        <Card>
          <CardHeader>
            <CardTitle>Players ({filteredPlayers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p>Loading players...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPlayers.map((player) => {
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
                        </div>
                        <div className="flex items-center gap-2">
                          {player.hasFirebaseId ? (
                            <Badge variant="default" className="bg-green-100 text-green-800">
                              Has Firebase ID
                            </Badge>
                          ) : (
                            <Badge variant="destructive">Missing Firebase ID</Badge>
                          )}
                          {currentAssignment && currentAssignment !== "none" && (
                            <Badge variant="outline" className="bg-blue-100 text-blue-800">
                              Assigned
                            </Badge>
                          )}
                        </div>
                      </div>

                      {!player.hasFirebaseId && (
                        <div className="mt-3">
                          <label className="block text-sm font-medium mb-2">Assign Firebase ID:</label>
                          <Select
                            value={currentAssignment || "none"}
                            onValueChange={(value) => handleAssignment(player.id, value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a registry player..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">-- No Assignment --</SelectItem>
                              {suggestedMatches.map((match) => (
                                <SelectItem key={match.id} value={match.id}>
                                  {match.fullName} ({match.currentTeam || match.team || "No team"})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          {suggestedMatches.length === 0 && (
                            <p className="text-sm text-gray-500 mt-1">
                              No suggested matches found. You may need to create a registry entry first.
                            </p>
                          )}
                        </div>
                      )}

                      {player.registryId && (
                        <div className="mt-2 text-sm text-gray-600">
                          Current Firebase ID: <code className="bg-gray-200 px-1 rounded">{player.registryId}</code>
                        </div>
                      )}
                    </div>
                  )
                })}

                {filteredPlayers.length === 0 && (
                  <div className="text-center py-8 text-gray-500">No players match your filter criteria.</div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
