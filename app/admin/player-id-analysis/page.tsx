"use client"

import { useState, useEffect } from "react"
import { collection, getDocs, query, where } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AlertCircle, RefreshCw, Download } from "lucide-react"
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

interface StatRecord {
  id: string
  playerName: string
  team: string
  playerId: string
  fantasyPoints: number
  round: number
}

interface AnalysisResult {
  player: Player
  exactMatches: StatRecord[]
  fuzzyMatches: StatRecord[]
  noMatches: boolean
}

export default function PlayerIdAnalysisPage() {
  const [loading, setLoading] = useState(false)
  const [players, setPlayers] = useState<Player[]>([])
  const [analysis, setAnalysis] = useState<AnalysisResult[]>([])
  const [debugInfo, setDebugInfo] = useState<string>("")
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    setDebugInfo("Loading players and stats...")

    try {
      // Load players with numeric IDs
      const playersRef = collection(db, "players")
      const playersSnapshot = await getDocs(playersRef)

      const allPlayers = playersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Player[]

      const numericIdPlayers = allPlayers.filter((player) => {
        return !isNaN(Number(player.id)) || /^\d+$/.test(player.id)
      })

      setPlayers(numericIdPlayers)
      setDebugInfo(`Loaded ${numericIdPlayers.length} players with numeric IDs`)

      // Analyze each player
      await analyzeAllPlayers(numericIdPlayers)
    } catch (err) {
      console.error("Error loading data:", err)
      setDebugInfo(`Error: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  const analyzeAllPlayers = async (players: Player[]) => {
    setDebugInfo("Analyzing player matches...")

    // Load all stats records
    const statsRef = collection(db, "playerStats")
    const totalStatsQuery = query(statsRef, where("quarter", "in", ["Total", "All", "total", "all"]))
    const statsSnapshot = await getDocs(totalStatsQuery)

    const allStats = statsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as StatRecord[]

    setDebugInfo(`Loaded ${allStats.length} total stats records`)

    const results: AnalysisResult[] = []

    for (const player of players) {
      // Find exact matches by name and team
      const exactMatches = allStats.filter((stat) => stat.playerName === player.name && stat.team === player.team)

      // Find fuzzy matches (name similarity)
      const fuzzyMatches = allStats.filter((stat) => {
        if (exactMatches.some((exact) => exact.id === stat.id)) return false // Skip exact matches

        const playerNameLower = player.name.toLowerCase()
        const statNameLower = stat.playerName?.toLowerCase() || ""

        // Check if names are similar
        return (
          stat.team === player.team &&
          (playerNameLower.includes(statNameLower) ||
            statNameLower.includes(playerNameLower) ||
            calculateSimilarity(playerNameLower, statNameLower) > 0.7)
        )
      })

      results.push({
        player,
        exactMatches,
        fuzzyMatches,
        noMatches: exactMatches.length === 0 && fuzzyMatches.length === 0,
      })
    }

    setAnalysis(results)
    setDebugInfo(`Analysis complete. Found ${results.filter((r) => r.exactMatches.length > 0).length} exact matches`)
  }

  const calculateSimilarity = (str1: string, str2: string): number => {
    const longer = str1.length > str2.length ? str1 : str2
    const shorter = str1.length > str2.length ? str2 : str1

    if (longer.length === 0) return 1.0

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

  const exportAnalysis = () => {
    const csvContent = [
      "Player Name,Team,Player ID,Exact Matches,Fuzzy Matches,Status,Sample Stat Player Name,Sample Stat Player ID",
      ...analysis.map((result) => {
        const exactCount = result.exactMatches.length
        const fuzzyCount = result.fuzzyMatches.length
        const status = exactCount > 0 ? "Exact Match" : fuzzyCount > 0 ? "Fuzzy Match" : "No Match"
        const sampleStat = result.exactMatches[0] || result.fuzzyMatches[0]
        const sampleStatName = sampleStat?.playerName || ""
        const sampleStatId = sampleStat?.playerId || ""

        return `"${result.player.name}","${result.player.team}","${result.player.id}",${exactCount},${fuzzyCount},"${status}","${sampleStatName}","${sampleStatId}"`
      }),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `player-id-analysis-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const filteredAnalysis = analysis.filter((result) =>
    searchTerm
      ? result.player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.player.team.toLowerCase().includes(searchTerm.toLowerCase())
      : true,
  )

  const exactMatchCount = analysis.filter((r) => r.exactMatches.length > 0).length
  const fuzzyMatchCount = analysis.filter((r) => r.fuzzyMatches.length > 0 && r.exactMatches.length === 0).length
  const noMatchCount = analysis.filter((r) => r.noMatches).length

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Player ID Analysis</h1>
          <div className="flex gap-2">
            <Button onClick={loadData} disabled={loading}>
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reload
                </>
              )}
            </Button>
            <Button onClick={exportAnalysis} disabled={analysis.length === 0} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-green-600">{exactMatchCount}</div>
              <div className="text-sm text-gray-600">Exact Matches</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-yellow-600">{fuzzyMatchCount}</div>
              <div className="text-sm text-gray-600">Fuzzy Matches</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-red-600">{noMatchCount}</div>
              <div className="text-sm text-gray-600">No Matches</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{analysis.length}</div>
              <div className="text-sm text-gray-600">Total Players</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Player Match Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Search by player name or team..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mb-4"
            />

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Player</th>
                    <th className="text-left p-2">Team</th>
                    <th className="text-left p-2">ID</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Matches</th>
                    <th className="text-left p-2">Sample Match</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAnalysis.map((result) => {
                    const status =
                      result.exactMatches.length > 0
                        ? "Exact Match"
                        : result.fuzzyMatches.length > 0
                          ? "Fuzzy Match"
                          : "No Match"
                    const statusColor =
                      status === "Exact Match"
                        ? "text-green-600"
                        : status === "Fuzzy Match"
                          ? "text-yellow-600"
                          : "text-red-600"
                    const sampleMatch = result.exactMatches[0] || result.fuzzyMatches[0]

                    return (
                      <tr key={result.player.id} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-medium">{result.player.name}</td>
                        <td className="p-2">{result.player.team}</td>
                        <td className="p-2 font-mono">{result.player.id}</td>
                        <td className={`p-2 font-medium ${statusColor}`}>{status}</td>
                        <td className="p-2">
                          {result.exactMatches.length > 0 && (
                            <span className="text-green-600">Exact: {result.exactMatches.length}</span>
                          )}
                          {result.fuzzyMatches.length > 0 && (
                            <span className="text-yellow-600 ml-2">Fuzzy: {result.fuzzyMatches.length}</span>
                          )}
                        </td>
                        <td className="p-2 text-xs">
                          {sampleMatch && (
                            <div>
                              <div>{sampleMatch.playerName}</div>
                              <div className="text-gray-500">{sampleMatch.playerId}</div>
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
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
      </div>
    </AdminLayout>
  )
}
