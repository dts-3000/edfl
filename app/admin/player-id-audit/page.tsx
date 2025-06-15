"use client"

import { useState, useEffect } from "react"
import { collection, getDocs, query, where, doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, Search, RefreshCw, CheckCircle } from "lucide-react"
import AdminLayout from "@/components/admin/AdminLayout"

interface Player {
  id: string
  name?: string
  firstName?: string
  lastName?: string
  fullName?: string
  team?: string
  position?: string
  playerId?: string
  aliases?: string[]
}

interface PlayerStat {
  id: string
  playerName: string
  team: string
  playerId?: string
  matchId: string
  season: number
  round: number
  quarter: string
}

interface PlayerIdMismatch {
  playerName: string
  team: string
  statId: string
  currentPlayerId?: string
  suggestedPlayerId?: string
  registryId?: string
  matchCount: number
  matchConfidence?: number
  possibleMatches?: Array<{ id: string; name: string; confidence: number }>
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

// Find best match for a player name in the registry
function findBestMatch(
  playerName: string,
  team: string,
  registry: Player[],
): { id: string; confidence: number } | null {
  const normalizedName = normalizeName(playerName)
  let bestMatch: { id: string; confidence: number } | null = null
  let bestConfidence = 0

  // First try exact match
  const exactMatch = registry.find(
    (p) =>
      normalizeName(p.fullName || "") === normalizedName ||
      (p.aliases || []).some((alias) => normalizeName(alias) === normalizedName),
  )

  if (exactMatch) {
    return { id: exactMatch.id, confidence: 100 }
  }

  // Try team-specific match first with higher confidence
  const teamMatches = registry.filter((p) => p.team === team || !p.team)

  for (const player of teamMatches) {
    const fullName = player.fullName || ""
    let confidence = calculateSimilarity(playerName, fullName)

    // Check aliases too
    if (player.aliases) {
      for (const alias of player.aliases) {
        const aliasConfidence = calculateSimilarity(playerName, alias)
        if (aliasConfidence > confidence) {
          confidence = aliasConfidence
        }
      }
    }

    // Boost confidence for team matches
    if (player.team === team) {
      confidence += 10
      if (confidence > 100) confidence = 100
    }

    if (confidence > bestConfidence) {
      bestConfidence = confidence
      bestMatch = { id: player.id, confidence }
    }
  }

  // If no good team match, try all players
  if (bestConfidence < 70) {
    for (const player of registry) {
      // Skip already checked team players
      if (player.team === team) continue

      const fullName = player.fullName || ""
      let confidence = calculateSimilarity(playerName, fullName)

      // Check aliases too
      if (player.aliases) {
        for (const alias of player.aliases) {
          const aliasConfidence = calculateSimilarity(playerName, alias)
          if (aliasConfidence > confidence) {
            confidence = aliasConfidence
          }
        }
      }

      if (confidence > bestConfidence) {
        bestConfidence = confidence
        bestMatch = { id: player.id, confidence }
      }
    }
  }

  // Only return matches with reasonable confidence
  return bestConfidence >= 70 ? bestMatch : null
}

// Find all possible matches for a player
function findPossibleMatches(
  playerName: string,
  team: string,
  registry: Player[],
): Array<{ id: string; name: string; confidence: number }> {
  const matches: Array<{ id: string; name: string; confidence: number }> = []

  for (const player of registry) {
    const fullName = player.fullName || ""
    let confidence = calculateSimilarity(playerName, fullName)

    // Check aliases too
    if (player.aliases) {
      for (const alias of player.aliases) {
        const aliasConfidence = calculateSimilarity(playerName, alias)
        if (aliasConfidence > confidence) {
          confidence = aliasConfidence
        }
      }
    }

    // Boost confidence for team matches
    if (player.team === team) {
      confidence += 10
      if (confidence > 100) confidence = 100
    }

    if (confidence >= 60) {
      matches.push({
        id: player.id,
        name: fullName,
        confidence,
      })
    }
  }

  // Sort by confidence (highest first)
  return matches.sort((a, b) => b.confidence - a.confidence).slice(0, 5)
}

export default function PlayerIdAuditPage() {
  const [loading, setLoading] = useState(false)
  const [registryPlayers, setRegistryPlayers] = useState<Player[]>([])
  const [fantasyPlayers, setFantasyPlayers] = useState<Player[]>([])
  const [playerStats, setPlayerStats] = useState<PlayerStat[]>([])
  const [mismatches, setMismatches] = useState<PlayerIdMismatch[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTeam, setSelectedTeam] = useState<string>("All")
  const [teams, setTeams] = useState<string[]>([])
  const [debugInfo, setDebugInfo] = useState<string>("")
  const [fixingId, setFixingId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("mismatches")
  const [selectedMatches, setSelectedMatches] = useState<{ [key: string]: string }>({})

  useEffect(() => {
    loadTeams()
  }, [])

  const loadTeams = async () => {
    try {
      setDebugInfo("Loading teams...")
      const statsRef = collection(db, "playerStats")
      const snapshot = await getDocs(statsRef)

      const teamNames = new Set<string>()
      snapshot.docs.forEach((doc) => {
        const data = doc.data()
        if (data.team && typeof data.team === "string") {
          teamNames.add(data.team)
        }
      })

      setTeams(["All", ...Array.from(teamNames).sort()])
      setDebugInfo(`Found ${teamNames.size} teams`)
    } catch (err) {
      console.error("Error loading teams:", err)
      setDebugInfo(`Error loading teams: ${err}`)
    }
  }

  const runAudit = async () => {
    setLoading(true)
    setDebugInfo("Starting player ID audit...")

    try {
      // Load players from registry
      const registryRef = collection(db, "players")
      const registrySnapshot = await getDocs(registryRef)
      const registry = registrySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        fullName: doc.data().fullName || `${doc.data().firstName || ""} ${doc.data().lastName || ""}`.trim(),
      })) as Player[]

      setRegistryPlayers(registry)
      setDebugInfo((prev) => `${prev}\nLoaded ${registry.length} players from registry`)

      // Load fantasy players
      const fantasyRef = collection(db, "fantasyPlayers")
      const fantasySnapshot = await getDocs(fantasyRef)
      const fantasy = fantasySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Player[]

      setFantasyPlayers(fantasy)
      setDebugInfo((prev) => `${prev}\nLoaded ${fantasy.length} fantasy players`)

      // Load player stats
      let statsQuery = collection(db, "playerStats")
      if (selectedTeam !== "All") {
        statsQuery = query(statsQuery, where("team", "==", selectedTeam))
      }

      const statsSnapshot = await getDocs(statsQuery)
      const stats = statsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as PlayerStat[]

      setPlayerStats(stats)
      setDebugInfo((prev) => `${prev}\nLoaded ${stats.length} player stat records`)

      // Find mismatches
      const foundMismatches: PlayerIdMismatch[] = []
      const processedPlayers = new Set<string>()

      for (const stat of stats) {
        // Skip if we've already processed this player+team combo
        const playerTeamKey = `${stat.playerName}-${stat.team}`
        if (processedPlayers.has(playerTeamKey)) continue
        processedPlayers.add(playerTeamKey)

        // Find matching registry player - first try exact match
        const exactMatch = registry.find((p) => p.fullName === stat.playerName && (!p.team || p.team === stat.team))

        // If no exact match, try fuzzy matching
        let bestMatch = null
        let possibleMatches = null

        if (!exactMatch) {
          bestMatch = findBestMatch(stat.playerName, stat.team, registry)
          possibleMatches = findPossibleMatches(stat.playerName, stat.team, registry)
        }

        // Count matches for this player
        const matchCount = stats.filter((s) => s.playerName === stat.playerName && s.team === stat.team).length

        // Check if player ID exists and matches
        if (
          !stat.playerId ||
          (exactMatch && stat.playerId !== exactMatch.id) ||
          (bestMatch && (!stat.playerId || stat.playerId !== bestMatch.id))
        ) {
          foundMismatches.push({
            playerName: stat.playerName,
            team: stat.team,
            statId: stat.id,
            currentPlayerId: stat.playerId,
            suggestedPlayerId: exactMatch?.id || bestMatch?.id,
            registryId: exactMatch?.id,
            matchCount,
            matchConfidence: bestMatch?.confidence,
            possibleMatches,
          })
        }
      }

      // Sort by match count (highest first)
      foundMismatches.sort((a, b) => b.matchCount - a.matchCount)

      setMismatches(foundMismatches)
      setDebugInfo((prev) => `${prev}\nFound ${foundMismatches.length} player ID mismatches`)

      // Initialize selected matches with best suggestions
      const initialSelections: { [key: string]: string } = {}
      foundMismatches.forEach((mismatch) => {
        if (mismatch.suggestedPlayerId) {
          initialSelections[`${mismatch.playerName}-${mismatch.team}`] = mismatch.suggestedPlayerId
        }
      })
      setSelectedMatches(initialSelections)
    } catch (err) {
      console.error("Error running audit:", err)
      setDebugInfo((prev) => `${prev}\nError: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  const fixPlayerIds = async (mismatch: PlayerIdMismatch, selectedId?: string) => {
    const playerId = selectedId || mismatch.suggestedPlayerId

    if (!playerId) {
      setDebugInfo((prev) => `${prev}\nCannot fix: No player ID selected for ${mismatch.playerName}`)
      return
    }

    setFixingId(mismatch.statId)
    setDebugInfo((prev) => `${prev}\nFixing player IDs for ${mismatch.playerName} (${mismatch.team})...`)

    try {
      // Get all stats for this player+team
      const statsRef = collection(db, "playerStats")
      const q = query(statsRef, where("playerName", "==", mismatch.playerName), where("team", "==", mismatch.team))

      const snapshot = await getDocs(q)
      setDebugInfo((prev) => `${prev}\nFound ${snapshot.docs.length} records to update`)

      // Update each record
      let updateCount = 0
      for (const docRef of snapshot.docs) {
        await updateDoc(doc(db, "playerStats", docRef.id), {
          playerId: playerId,
        })
        updateCount++
      }

      setDebugInfo((prev) => `${prev}\nUpdated ${updateCount} records with player ID ${playerId}`)

      // Remove from mismatches list
      setMismatches((prev) => prev.filter((m) => !(m.playerName === mismatch.playerName && m.team === mismatch.team)))

      // Remove from selected matches
      const newSelectedMatches = { ...selectedMatches }
      delete newSelectedMatches[`${mismatch.playerName}-${mismatch.team}`]
      setSelectedMatches(newSelectedMatches)
    } catch (err) {
      console.error("Error fixing player IDs:", err)
      setDebugInfo((prev) => `${prev}\nError fixing player IDs: ${err}`)
    } finally {
      setFixingId(null)
    }
  }

  const fixAllPlayerIds = async () => {
    setDebugInfo((prev) => `${prev}\nStarting to fix all player ID mismatches...`)
    setLoading(true)

    try {
      let fixedCount = 0
      let errorCount = 0
      let skippedCount = 0

      for (const mismatch of mismatches) {
        const key = `${mismatch.playerName}-${mismatch.team}`
        const selectedId = selectedMatches[key]

        if (selectedId) {
          try {
            setDebugInfo((prev) => `${prev}\nProcessing ${mismatch.playerName} (${mismatch.team})...`)
            await fixPlayerIds(mismatch, selectedId)
            fixedCount++
            setDebugInfo((prev) => `${prev}\nFixed ${fixedCount}/${mismatches.length} players`)
          } catch (error) {
            errorCount++
            setDebugInfo((prev) => `${prev}\nError fixing ${mismatch.playerName}: ${error}`)
          }
        } else {
          skippedCount++
          setDebugInfo((prev) => `${prev}\nSkipping ${mismatch.playerName} - no ID selected`)
        }
      }

      setDebugInfo(
        (prev) =>
          `${prev}\nCompleted fixing player IDs. Fixed: ${fixedCount}, Skipped: ${skippedCount}, Errors: ${errorCount}`,
      )
    } catch (error) {
      setDebugInfo((prev) => `${prev}\nError in fixAllPlayerIds: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const exportMismatchesCSV = () => {
    if (mismatches.length === 0) {
      setDebugInfo((prev) => `${prev}\nNo mismatches to export`)
      return
    }

    // Create CSV content
    const headers = ["Player Name", "Team", "Current ID", "Suggested ID", "Match Confidence", "Match Count", "Status"]
    const csvContent = [
      headers.join(","),
      ...mismatches.map((mismatch) => {
        const key = `${mismatch.playerName}-${mismatch.team}`
        const selectedId = selectedMatches[key] || mismatch.suggestedPlayerId

        return [
          `"${mismatch.playerName}"`,
          `"${mismatch.team}"`,
          mismatch.currentPlayerId || "Missing",
          selectedId || "Not Found",
          mismatch.matchConfidence || "N/A",
          mismatch.matchCount,
          selectedId ? "Ready to Fix" : "Needs Manual Selection",
        ].join(",")
      }),
    ].join("\n")

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `player-id-mismatches-${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    setDebugInfo((prev) => `${prev}\nExported ${mismatches.length} mismatches to CSV`)
  }

  const handleSelectMatch = (mismatch: PlayerIdMismatch, playerId: string) => {
    setSelectedMatches((prev) => ({
      ...prev,
      [`${mismatch.playerName}-${mismatch.team}`]: playerId,
    }))
  }

  const filteredMismatches = mismatches.filter(
    (mismatch) =>
      mismatch.playerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mismatch.team.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getSelectedCount = () => {
    return Object.keys(selectedMatches).length
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Player ID Audit Tool</h1>
          <Button onClick={runAudit} disabled={loading}>
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Running Audit...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Run Audit
              </>
            )}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Audit Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by player name or team..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
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

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="mismatches">ID Mismatches ({mismatches.length})</TabsTrigger>
            <TabsTrigger value="registry">Player Registry ({registryPlayers.length})</TabsTrigger>
            <TabsTrigger value="fantasy">Fantasy Players ({fantasyPlayers.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="mismatches">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Player ID Mismatches</CardTitle>
                <div className="flex gap-2">
                  {mismatches.length > 0 && (
                    <>
                      <Button onClick={exportMismatchesCSV} variant="outline" disabled={loading}>
                        Export CSV
                      </Button>
                      <Button
                        onClick={fixAllPlayerIds}
                        disabled={loading || fixingId !== null || getSelectedCount() === 0}
                      >
                        {loading ? "Fixing..." : `Fix Selected (${getSelectedCount()}/${mismatches.length})`}
                      </Button>
                    </>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {filteredMismatches.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {mismatches.length === 0 ? (
                      <>
                        <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                        <p>No mismatches found. Run an audit to check for player ID issues.</p>
                      </>
                    ) : (
                      <p>No mismatches match your search criteria.</p>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Player Name</th>
                          <th className="text-left p-2">Team</th>
                          <th className="text-left p-2">Current ID</th>
                          <th className="text-left p-2">Possible Matches</th>
                          <th className="text-right p-2">Match Count</th>
                          <th className="text-right p-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredMismatches.map((mismatch) => {
                          const key = `${mismatch.playerName}-${mismatch.team}`
                          const selectedId = selectedMatches[key]

                          return (
                            <tr key={key} className="border-b hover:bg-gray-50">
                              <td className="p-2 font-medium">{mismatch.playerName}</td>
                              <td className="p-2">{mismatch.team}</td>
                              <td className="p-2">
                                {mismatch.currentPlayerId ? (
                                  mismatch.currentPlayerId
                                ) : (
                                  <span className="text-red-500">Missing</span>
                                )}
                              </td>
                              <td className="p-2">
                                {mismatch.possibleMatches && mismatch.possibleMatches.length > 0 ? (
                                  <Select
                                    value={selectedId || ""}
                                    onValueChange={(value) => handleSelectMatch(mismatch, value)}
                                  >
                                    <SelectTrigger className="w-full">
                                      <SelectValue placeholder="Select a match..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {mismatch.possibleMatches.map((match) => (
                                        <SelectItem key={match.id} value={match.id}>
                                          {match.name} ({match.confidence}%)
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  <span className="text-orange-500">No matches found</span>
                                )}
                              </td>
                              <td className="p-2 text-right">{mismatch.matchCount}</td>
                              <td className="p-2 text-right">
                                <Button
                                  size="sm"
                                  onClick={() => fixPlayerIds(mismatch, selectedId)}
                                  disabled={!selectedId || fixingId === mismatch.statId}
                                  className="bg-blue-600 hover:bg-blue-700"
                                >
                                  {fixingId === mismatch.statId ? "Fixing..." : "Fix ID"}
                                </Button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="registry">
            <Card>
              <CardHeader>
                <CardTitle>Player Registry</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">ID</th>
                        <th className="text-left p-2">Name</th>
                        <th className="text-left p-2">Team</th>
                      </tr>
                    </thead>
                    <tbody>
                      {registryPlayers
                        .filter(
                          (player) =>
                            player.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            player.team?.toLowerCase().includes(searchTerm.toLowerCase()),
                        )
                        .slice(0, 100)
                        .map((player) => (
                          <tr key={player.id} className="border-b hover:bg-gray-50">
                            <td className="p-2 font-mono">{player.id}</td>
                            <td className="p-2 font-medium">{player.fullName}</td>
                            <td className="p-2">{player.team || "—"}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                  {registryPlayers.length > 100 && (
                    <div className="text-center py-2 text-sm text-gray-500">
                      Showing first 100 results. Use search to narrow down results.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="fantasy">
            <Card>
              <CardHeader>
                <CardTitle>Fantasy Players</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">ID</th>
                        <th className="text-left p-2">Name</th>
                        <th className="text-left p-2">Team</th>
                        <th className="text-left p-2">Position</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fantasyPlayers
                        .filter(
                          (player) =>
                            player.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            player.team?.toLowerCase().includes(searchTerm.toLowerCase()),
                        )
                        .slice(0, 100)
                        .map((player) => (
                          <tr key={player.id} className="border-b hover:bg-gray-50">
                            <td className="p-2 font-mono">{player.id}</td>
                            <td className="p-2 font-medium">{player.name}</td>
                            <td className="p-2">{player.team || "—"}</td>
                            <td className="p-2">{player.position || "—"}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                  {fantasyPlayers.length > 100 && (
                    <div className="text-center py-2 text-sm text-gray-500">
                      Showing first 100 results. Use search to narrow down results.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  )
}
