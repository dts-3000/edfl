"use client"

import { useState, useEffect } from "react"
import { collection, getDocs, doc, writeBatch } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, RefreshCw, CheckCircle, Users } from "lucide-react"
import AdminLayout from "@/components/admin/AdminLayout"

interface FantasyPlayer {
  id: string
  name: string
  team: string
  position: string
  price: number
  status?: string
}

interface RegistryPlayer {
  id: string
  fullName: string
  firstName: string
  lastName: string
  team?: string
  position?: string
  aliases?: string[]
}

interface PlayerSync {
  fantasyId: string
  fantasyName: string
  fantasyTeam: string
  currentId: string
  suggestedId?: string
  registryName?: string
  confidence?: number
}

// Helper function to normalize names for comparison
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "") // Remove non-alphanumeric
    .trim()
}

// Calculate similarity between two strings (0-100)
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = normalizeName(str1)
  const s2 = normalizeName(str2)

  if (s1 === s2) return 100 // Exact match
  if (s1.includes(s2) || s2.includes(s1)) return 90 // One is substring of other

  // Check for partial matches
  const words1 = s1.split(/\s+/)
  const words2 = s2.split(/\s+/)

  // Count matching words
  let matchingWords = 0
  for (const word1 of words1) {
    if (word1.length < 2) continue // Skip very short words
    for (const word2 of words2) {
      if (word2.length < 2) continue
      if (word1 === word2 || word1.includes(word2) || word2.includes(word1)) {
        matchingWords++
        break
      }
    }
  }

  const totalWords = Math.max(words1.length, words2.length)
  if (totalWords === 0) return 0

  return Math.round((matchingWords / totalWords) * 100)
}

// Find best match for a fantasy player in the registry
function findBestRegistryMatch(
  fantasyPlayer: FantasyPlayer,
  registry: RegistryPlayer[],
): { id: string; name: string; confidence: number } | null {
  let bestMatch: { id: string; name: string; confidence: number } | null = null
  let bestConfidence = 0

  // First try exact match
  const exactMatch = registry.find(
    (p) =>
      normalizeName(p.fullName) === normalizeName(fantasyPlayer.name) ||
      (p.aliases || []).some((alias) => normalizeName(alias) === normalizeName(fantasyPlayer.name)),
  )

  if (exactMatch) {
    return { id: exactMatch.id, name: exactMatch.fullName, confidence: 100 }
  }

  // Try team-specific match first with higher confidence
  const teamMatches = registry.filter((p) => p.team === fantasyPlayer.team || !p.team)

  for (const player of teamMatches) {
    let confidence = calculateSimilarity(fantasyPlayer.name, player.fullName)

    // Check aliases too
    if (player.aliases) {
      for (const alias of player.aliases) {
        const aliasConfidence = calculateSimilarity(fantasyPlayer.name, alias)
        if (aliasConfidence > confidence) {
          confidence = aliasConfidence
        }
      }
    }

    // Boost confidence for team matches
    if (player.team === fantasyPlayer.team) {
      confidence += 10
      if (confidence > 100) confidence = 100
    }

    if (confidence > bestConfidence) {
      bestConfidence = confidence
      bestMatch = { id: player.id, name: player.fullName, confidence }
    }
  }

  // If no good team match, try all players
  if (bestConfidence < 70) {
    for (const player of registry) {
      // Skip already checked team players
      if (player.team === fantasyPlayer.team) continue

      let confidence = calculateSimilarity(fantasyPlayer.name, player.fullName)

      // Check aliases too
      if (player.aliases) {
        for (const alias of player.aliases) {
          const aliasConfidence = calculateSimilarity(fantasyPlayer.name, alias)
          if (aliasConfidence > confidence) {
            confidence = aliasConfidence
          }
        }
      }

      if (confidence > bestConfidence) {
        bestConfidence = confidence
        bestMatch = { id: player.id, name: player.fullName, confidence }
      }
    }
  }

  // Only return matches with reasonable confidence
  return bestConfidence >= 70 ? bestMatch : null
}

export default function SyncFantasyPlayersPage() {
  const [loading, setLoading] = useState(false)
  const [fantasyPlayers, setFantasyPlayers] = useState<FantasyPlayer[]>([])
  const [registryPlayers, setRegistryPlayers] = useState<RegistryPlayer[]>([])
  const [syncNeeded, setSyncNeeded] = useState<PlayerSync[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTeam, setSelectedTeam] = useState<string>("All")
  const [teams, setTeams] = useState<string[]>([])
  const [debugInfo, setDebugInfo] = useState<string>("")
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    setDebugInfo("Loading fantasy players and registry...")

    try {
      // Load fantasy players
      const fantasyRef = collection(db, "fantasyPlayers")
      const fantasySnapshot = await getDocs(fantasyRef)
      const fantasy = fantasySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as FantasyPlayer[]

      setFantasyPlayers(fantasy)
      setDebugInfo((prev) => `${prev}\nLoaded ${fantasy.length} fantasy players`)

      // Load registry players
      const registryRef = collection(db, "players")
      const registrySnapshot = await getDocs(registryRef)
      const registry = registrySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        fullName: doc.data().fullName || `${doc.data().firstName || ""} ${doc.data().lastName || ""}`.trim(),
      })) as RegistryPlayer[]

      setRegistryPlayers(registry)
      setDebugInfo((prev) => `${prev}\nLoaded ${registry.length} registry players`)

      // Get unique teams
      const teamNames = new Set<string>()
      fantasy.forEach((p) => teamNames.add(p.team))
      setTeams(["All", ...Array.from(teamNames).sort()])

      // Find players that need syncing
      const needsSync: PlayerSync[] = []

      for (const fantasyPlayer of fantasy) {
        // Check if the fantasy player ID is numeric (old format)
        const isNumericId = !isNaN(Number(fantasyPlayer.id)) || /^\d+$/.test(fantasyPlayer.id)

        if (isNumericId) {
          // Find matching registry player
          const match = findBestRegistryMatch(fantasyPlayer, registry)

          needsSync.push({
            fantasyId: fantasyPlayer.id,
            fantasyName: fantasyPlayer.name,
            fantasyTeam: fantasyPlayer.team,
            currentId: fantasyPlayer.id,
            suggestedId: match?.id,
            registryName: match?.name,
            confidence: match?.confidence,
          })
        }
      }

      setSyncNeeded(needsSync)
      setDebugInfo((prev) => `${prev}\nFound ${needsSync.length} players that need ID syncing`)
    } catch (err) {
      console.error("Error loading data:", err)
      setDebugInfo((prev) => `${prev}\nError: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  const syncFantasyPlayers = async () => {
    setSyncing(true)
    setDebugInfo((prev) => `${prev}\nStarting fantasy player sync...`)

    try {
      const batch = writeBatch(db)
      let updateCount = 0

      for (const sync of syncNeeded) {
        if (sync.suggestedId) {
          // Update the fantasy player document with the new Firebase ID
          const fantasyRef = doc(db, "fantasyPlayers", sync.fantasyId)

          // Delete the old document and create a new one with the Firebase ID
          // Note: We can't change document IDs, so we'll update a field instead
          batch.update(fantasyRef, {
            registryId: sync.suggestedId,
            syncedAt: new Date(),
          })

          updateCount++
          setDebugInfo((prev) => `${prev}\nQueued update for ${sync.fantasyName}`)
        }
      }

      await batch.commit()
      setDebugInfo((prev) => `${prev}\nUpdated ${updateCount} fantasy players with registry IDs`)

      // Reload data to show changes
      await loadData()
    } catch (err) {
      console.error("Error syncing fantasy players:", err)
      setDebugInfo((prev) => `${prev}\nError syncing: ${err}`)
    } finally {
      setSyncing(false)
    }
  }

  const createNewFantasyCollection = async () => {
    setSyncing(true)
    setDebugInfo((prev) => `${prev}\nCreating new fantasy players collection...`)

    try {
      const batch = writeBatch(db)
      let createCount = 0

      for (const sync of syncNeeded) {
        if (sync.suggestedId) {
          // Create new document with Firebase ID
          const newFantasyRef = doc(db, "fantasyPlayersNew", sync.suggestedId)
          const originalPlayer = fantasyPlayers.find((p) => p.id === sync.fantasyId)

          if (originalPlayer) {
            batch.set(newFantasyRef, {
              ...originalPlayer,
              id: sync.suggestedId,
              originalId: sync.fantasyId,
              registryId: sync.suggestedId,
              syncedAt: new Date(),
            })

            createCount++
            setDebugInfo((prev) => `${prev}\nQueued creation for ${sync.fantasyName}`)
          }
        }
      }

      await batch.commit()
      setDebugInfo((prev) => `${prev}\nCreated ${createCount} players in fantasyPlayersNew collection`)
    } catch (err) {
      console.error("Error creating new collection:", err)
      setDebugInfo((prev) => `${prev}\nError creating collection: ${err}`)
    } finally {
      setSyncing(false)
    }
  }

  const filteredSyncNeeded = syncNeeded.filter(
    (sync) =>
      (selectedTeam === "All" || sync.fantasyTeam === selectedTeam) &&
      (sync.fantasyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sync.fantasyTeam.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Sync Fantasy Players</h1>
          <Button onClick={loadData} disabled={loading}>
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Reload Data
              </>
            )}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Fantasy Player ID Sync
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              This tool syncs fantasy players with numeric IDs to use the new Firebase IDs from the player registry.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-2">Team Filter</label>
                <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select team" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map((team) => (
                      <SelectItem key={team} value={team}>
                        {team}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Search</label>
                <Input
                  placeholder="Search by player name or team..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={syncFantasyPlayers} disabled={syncing || syncNeeded.length === 0}>
                {syncing ? "Syncing..." : `Update Fantasy Players (${syncNeeded.length})`}
              </Button>
              <Button
                onClick={createNewFantasyCollection}
                disabled={syncing || syncNeeded.length === 0}
                variant="outline"
              >
                Create New Collection
              </Button>
            </div>
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

        <Card>
          <CardHeader>
            <CardTitle>Players Needing Sync ({filteredSyncNeeded.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredSyncNeeded.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {syncNeeded.length === 0 ? (
                  <>
                    <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                    <p>All fantasy players are already synced with Firebase IDs.</p>
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
                      <th className="text-left p-2">Fantasy Player</th>
                      <th className="text-left p-2">Team</th>
                      <th className="text-left p-2">Current ID</th>
                      <th className="text-left p-2">Registry Match</th>
                      <th className="text-left p-2">New ID</th>
                      <th className="text-right p-2">Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSyncNeeded.map((sync) => (
                      <tr key={sync.fantasyId} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-medium">{sync.fantasyName}</td>
                        <td className="p-2">{sync.fantasyTeam}</td>
                        <td className="p-2 font-mono">{sync.currentId}</td>
                        <td className="p-2">
                          {sync.registryName ? (
                            sync.registryName
                          ) : (
                            <span className="text-orange-500">No match found</span>
                          )}
                        </td>
                        <td className="p-2 font-mono">
                          {sync.suggestedId ? sync.suggestedId : <span className="text-red-500">No ID available</span>}
                        </td>
                        <td className="p-2 text-right">
                          {sync.confidence ? (
                            <span
                              className={`px-2 py-1 rounded text-xs ${
                                sync.confidence >= 90
                                  ? "bg-green-100 text-green-800"
                                  : sync.confidence >= 80
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-red-100 text-red-800"
                              }`}
                            >
                              {sync.confidence}%
                            </span>
                          ) : (
                            "—"
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
      </div>
    </AdminLayout>
  )
}
