"use client"

import { useState } from "react"
import AdminLayout from "@/components/admin/AdminLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { collection, getDocs, doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

export default function FixRemainingPlayersPage() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [debugInfo, setDebugInfo] = useState<string[]>([])

  const addDebug = (message: string) => {
    setDebugInfo((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  // Function to calculate similarity between two strings
  const similarity = (s1: string, s2: string): number => {
    const longer = s1.length > s2.length ? s1 : s2
    const shorter = s1.length > s2.length ? s2 : s1
    const editDistance = levenshteinDistance(longer, shorter)
    return (longer.length - editDistance) / longer.length
  }

  const levenshteinDistance = (str1: string, str2: string): number => {
    const matrix = []
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i]
    }
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j
    }
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
        }
      }
    }
    return matrix[str2.length][str1.length]
  }

  const findRemainingPlayers = async () => {
    setLoading(true)
    setResults(null)
    setDebugInfo([])

    try {
      addDebug("Finding remaining players with numeric IDs...")

      // Get players with numeric IDs (excluding Matthew Hanson who is fixed)
      const playersRef = collection(db, "players")
      const playersSnapshot = await getDocs(playersRef)
      const numericIdPlayers = playersSnapshot.docs
        .filter((doc) => /^\d+$/.test(doc.id) && doc.id !== "36") // Exclude Matthew Hanson
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter((player) => !player.registryId) // Only unfixed players

      addDebug(`Found ${numericIdPlayers.length} unfixed players with numeric IDs`)

      // Get all player stats
      const statsRef = collection(db, "playerStats")
      const statsSnapshot = await getDocs(statsRef)
      addDebug(`Loaded ${statsSnapshot.docs.length} stats records`)

      const playerAnalysis = []

      for (const player of numericIdPlayers) {
        const playerName = player.name || ""
        const playerTeam = player.team || ""

        addDebug(`Analyzing: ${playerName} (${playerTeam}) - ID: ${player.id}`)

        if (!playerName) {
          playerAnalysis.push({
            player,
            status: "no-name",
            matches: [],
          })
          continue
        }

        // Find potential matches using fuzzy matching
        const potentialMatches = []

        statsSnapshot.docs.forEach((doc) => {
          const data = doc.data()
          const statsPlayerName = data.playerName || ""
          const statsTeam = data.team || ""

          if (!statsPlayerName) return

          // Calculate name similarity
          const nameSimilarity = similarity(playerName.toLowerCase(), statsPlayerName.toLowerCase())

          // Check team match (exact or similar)
          const teamMatch =
            playerTeam.toLowerCase() === statsTeam.toLowerCase() ||
            playerTeam.toLowerCase().includes(statsTeam.toLowerCase()) ||
            statsTeam.toLowerCase().includes(playerTeam.toLowerCase())

          // Consider it a match if name similarity is high and team matches
          if (nameSimilarity >= 0.7 && teamMatch) {
            potentialMatches.push({
              statsId: doc.id,
              statsPlayerName,
              statsTeam,
              playerId: data.playerId,
              nameSimilarity: Math.round(nameSimilarity * 100),
              quarter: data.quarter,
              fantasyPoints: data.fantasyPoints,
            })
          }
        })

        // Group by playerId to get unique players
        const uniqueMatches = []
        const seenPlayerIds = new Set()

        potentialMatches.forEach((match) => {
          if (!seenPlayerIds.has(match.playerId)) {
            seenPlayerIds.add(match.playerId)
            // Count how many records this playerId has
            const recordCount = potentialMatches.filter((m) => m.playerId === match.playerId).length
            uniqueMatches.push({
              ...match,
              recordCount,
            })
          }
        })

        // Sort by similarity score
        uniqueMatches.sort((a, b) => b.nameSimilarity - a.nameSimilarity)

        playerAnalysis.push({
          player,
          status: uniqueMatches.length > 0 ? "potential-matches" : "no-matches",
          matches: uniqueMatches.slice(0, 5), // Top 5 matches
        })

        if (uniqueMatches.length > 0) {
          addDebug(`- Found ${uniqueMatches.length} potential matches for ${playerName}`)
        } else {
          addDebug(`- No matches found for ${playerName}`)
        }
      }

      addDebug("Analysis completed!")

      setResults({
        total: numericIdPlayers.length,
        withMatches: playerAnalysis.filter((p) => p.status === "potential-matches").length,
        withoutMatches: playerAnalysis.filter((p) => p.status === "no-matches").length,
        analysis: playerAnalysis,
      })
    } catch (err) {
      addDebug(`Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const linkPlayer = async (playerId: string, registryId: string, playerName: string) => {
    try {
      addDebug(`Linking ${playerName} (ID: ${playerId}) to registryId: ${registryId}`)
      await updateDoc(doc(db, "players", playerId), {
        registryId: registryId,
      })
      addDebug(`✓ Successfully linked ${playerName}!`)

      // Refresh the analysis
      findRemainingPlayers()
    } catch (err) {
      addDebug(`✗ Failed to link ${playerName}: ${err.message}`)
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Fix Remaining Players</h1>
          <p className="text-gray-600 mt-2">Find and link the remaining 30 players with numeric IDs</p>
        </div>

        <div className="flex gap-4">
          <Button onClick={findRemainingPlayers} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
            {loading ? "Analyzing..." : "Analyze Remaining Players"}
          </Button>
        </div>

        {/* Debug Info */}
        {debugInfo.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Analysis Log</CardTitle>
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

        {/* Results Summary */}
        {results && (
          <Card>
            <CardHeader>
              <CardTitle>Analysis Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded p-4 text-center">
                  <div className="text-2xl font-bold">{results.total}</div>
                  <div className="text-sm text-gray-600">Total Unfixed</div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{results.withMatches}</div>
                  <div className="text-sm text-gray-600">With Potential Matches</div>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-600">{results.withoutMatches}</div>
                  <div className="text-sm text-gray-600">No Matches Found</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Player Analysis */}
        {results && (
          <div className="space-y-4">
            {results.analysis.map((analysis, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {analysis.player.name} ({analysis.player.team}) - ID: {analysis.player.id}
                  </CardTitle>
                  <CardDescription>
                    Status:{" "}
                    {analysis.status === "potential-matches"
                      ? `${analysis.matches.length} potential matches`
                      : "No matches found"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {analysis.matches.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-300">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="border border-gray-300 px-4 py-2 text-left">Stats Player Name</th>
                            <th className="border border-gray-300 px-4 py-2 text-left">Team</th>
                            <th className="border border-gray-300 px-4 py-2 text-left">Similarity</th>
                            <th className="border border-gray-300 px-4 py-2 text-left">Records</th>
                            <th className="border border-gray-300 px-4 py-2 text-left">Player ID</th>
                            <th className="border border-gray-300 px-4 py-2 text-left">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analysis.matches.map((match, matchIndex) => (
                            <tr key={matchIndex}>
                              <td className="border border-gray-300 px-4 py-2">{match.statsPlayerName}</td>
                              <td className="border border-gray-300 px-4 py-2">{match.statsTeam}</td>
                              <td className="border border-gray-300 px-4 py-2">
                                <span
                                  className={
                                    match.nameSimilarity >= 90
                                      ? "text-green-600 font-bold"
                                      : match.nameSimilarity >= 80
                                        ? "text-yellow-600"
                                        : "text-red-600"
                                  }
                                >
                                  {match.nameSimilarity}%
                                </span>
                              </td>
                              <td className="border border-gray-300 px-4 py-2">{match.recordCount}</td>
                              <td className="border border-gray-300 px-4 py-2 font-mono text-xs">{match.playerId}</td>
                              <td className="border border-gray-300 px-4 py-2">
                                <Button
                                  size="sm"
                                  onClick={() => linkPlayer(analysis.player.id, match.playerId, analysis.player.name)}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  Link This
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-gray-500 italic">
                      No stats records found for this player. They may be new, inactive, or have no game data yet.
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
