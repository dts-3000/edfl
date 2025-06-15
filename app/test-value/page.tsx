"use client"

import type React from "react"

import { useState, useEffect, useMemo } from "react"
import { Loader2, TrendingUp, TrendingDown, Minus } from "lucide-react"
import Navbar from "@/components/layout/Navbar"
import { getTeamLogoPath } from "@/lib/teamLogos"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface PlayerValueData {
  id: string
  name: string
  team: string
  position: string
  price: number
  gamesPlayed: number
  averageScore: number
  recentMarketValue: number
  priceChange: number
  newPrice: number
  valueRating: "good" | "fair" | "poor"
  active: boolean
}

export default function TestValuePage() {
  const [loading, setLoading] = useState(true)
  const [players, setPlayers] = useState<PlayerValueData[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [positionFilter, setPositionFilter] = useState("All")
  const [teamFilter, setTeamFilter] = useState("All")
  const [valueFilter, setValueFilter] = useState("All")
  const [sortBy, setSortBy] = useState("priceChange")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null)
  const [playerWeeklyData, setPlayerWeeklyData] = useState<any[]>([])
  const [debugInfo, setDebugInfo] = useState<string[]>([])

  useEffect(() => {
    loadValueData()
  }, [])

  async function loadValueData() {
    try {
      setLoading(true)
      const debug: string[] = []

      // Import Firebase functions
      const { collection, getDocs } = await import("firebase/firestore")
      const { db } = await import("@/lib/firebase")

      debug.push("Starting data load...")

      // Fetch all players from registry
      const playersSnapshot = await getDocs(collection(db, "playerRegistry"))
      const allPlayers = playersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))

      debug.push(`Loaded ${allPlayers.length} players from registry`)

      // Fetch all player stats
      const statsSnapshot = await getDocs(collection(db, "playerStats"))
      const allStats = statsSnapshot.docs.map((doc) => doc.data())

      debug.push(`Loaded ${allStats.length} player stats`)

      // Debug: Check for Round 3 Airport West and Aberfeldie data
      const round3Stats = allStats.filter((stat) => stat.round === "3" || stat.round === 3)
      debug.push(`Found ${round3Stats.length} Round 3 stats`)

      const airportWestR3 = round3Stats.filter(
        (stat) => stat.team?.toLowerCase().includes("airport") || stat.team?.toLowerCase().includes("west"),
      )
      debug.push(`Found ${airportWestR3.length} Airport West Round 3 stats`)

      const aberfeldieR3 = round3Stats.filter((stat) => stat.team?.toLowerCase().includes("aberfeldie"))
      debug.push(`Found ${aberfeldieR3.length} Aberfeldie Round 3 stats`)

      // Debug: Show unique team names in Round 3
      const round3Teams = [...new Set(round3Stats.map((stat) => stat.team))].sort()
      debug.push(`Round 3 teams: ${round3Teams.join(", ")}`)

      // Debug: Show unique rounds
      const allRounds = [...new Set(allStats.map((stat) => stat.round))].sort()
      debug.push(`All rounds: ${allRounds.join(", ")}`)

      const valueData: PlayerValueData[] = []
      const MAGIC_NUMBER = 5000

      // Process each player
      for (const player of allPlayers) {
        // Skip inactive players
        if (player.active === false) continue

        // Get player stats (match by name and team)
        const playerStats = allStats.filter((stat) => {
          const nameMatch =
            stat.playerName?.toLowerCase() === player.playerName?.toLowerCase() ||
            stat.playerName?.toLowerCase() === player.fullName?.toLowerCase()
          const teamMatch = stat.team?.toLowerCase() === player.currentTeam?.toLowerCase()

          // Only include "Total" or "All" quarter records
          const isTotal = ["Total", "All", "total", "all"].includes(stat.quarter)

          return nameMatch && teamMatch && isTotal
        })

        // Only include players with 3+ games
        if (playerStats.length < 3) continue

        // Sort stats by season and round to get chronological order
        const sortedStats = playerStats.sort((a, b) => {
          const seasonA = Number.parseInt(a.season) || 0
          const seasonB = Number.parseInt(b.season) || 0
          if (seasonA !== seasonB) return seasonA - seasonB

          const roundA = Number.parseInt(a.round) || 0
          const roundB = Number.parseInt(b.round) || 0
          return roundA - roundB
        })

        // Calculate rolling 3-game average (last 3 games)
        const lastThreeStats = sortedStats.slice(-3)
        const totalPoints = lastThreeStats.reduce((sum, stat) => sum + (stat.fantasyPoints || 0), 0)
        const averageScore = Math.round((totalPoints / 3) * 10) / 10

        // Calculate Recent Market Value = Magic Number × Last 3 games average
        const recentMarketValue = Math.round(MAGIC_NUMBER * averageScore)

        // Calculate New Price = (0.75 × Old Price) + (0.25 × Recent Market Value)
        const newPrice = Math.round(0.75 * player.price + 0.25 * recentMarketValue)

        // Calculate price change
        const priceChange = newPrice - player.price

        // Determine value rating based on price change magnitude
        let valueRating: "good" | "fair" | "poor"
        if (priceChange > 50000) {
          valueRating = "good" // Rising significantly
        } else if (priceChange < -50000) {
          valueRating = "poor" // Falling significantly
        } else {
          valueRating = "fair" // Stable
        }

        valueData.push({
          id: player.id,
          name: player.playerName || player.fullName || "",
          team: player.currentTeam || "",
          position: player.position || "",
          price: player.price || 0,
          gamesPlayed: sortedStats.length,
          averageScore,
          recentMarketValue,
          priceChange,
          newPrice,
          valueRating,
          active: player.active !== false,
        })
      }

      debug.push(`Processed ${valueData.length} players with 3+ games`)
      setDebugInfo(debug)
      setPlayers(valueData)
    } catch (error) {
      console.error("Error loading value data:", error)
      setDebugInfo((prev) => [...prev, `Error: ${error}`])
    } finally {
      setLoading(false)
    }
  }

  async function loadPlayerWeeklyData(playerId: string) {
    try {
      // Import Firebase functions
      const { collection, getDocs } = await import("firebase/firestore")
      const { db } = await import("@/lib/firebase")

      // Get player details
      const player = players.find((p) => p.id === playerId)
      if (!player) return

      // Fetch all player stats for this player
      const statsSnapshot = await getDocs(collection(db, "playerStats"))
      const allStats = statsSnapshot.docs.map((doc) => doc.data())

      // Get player stats (match by name and team)
      const playerStats = allStats.filter((stat) => {
        const nameMatch = stat.playerName?.toLowerCase() === player.name?.toLowerCase()
        const teamMatch = stat.team?.toLowerCase() === player.team?.toLowerCase()
        const isTotal = ["Total", "All", "total", "all"].includes(stat.quarter)
        return nameMatch && teamMatch && isTotal
      })

      // Sort stats by season and round
      const sortedStats = playerStats.sort((a, b) => {
        const seasonA = Number.parseInt(a.season) || 0
        const seasonB = Number.parseInt(b.season) || 0
        if (seasonA !== seasonB) return seasonA - seasonB
        const roundA = Number.parseInt(a.round) || 0
        const roundB = Number.parseInt(b.round) || 0
        return roundA - roundB
      })

      const MAGIC_NUMBER = 5000

      // Calculate rolling data for each week
      const weeklyData = sortedStats.map((stat, index) => {
        // Calculate rolling 3-game average up to this point
        let rollingAvg = 0
        let gamesForAvg = 0
        let recentMarketValue = 0
        let currentPrice = player.price // Start with original price
        let newPrice = player.price
        let priceChange = 0

        if (index === 0) {
          // First game - use just this game
          rollingAvg = stat.fantasyPoints || 0
          gamesForAvg = 1
          recentMarketValue = Math.round(MAGIC_NUMBER * rollingAvg)
          // No price change for first game
        } else if (index === 1) {
          // Second game - use average of first 2 games
          const prev = sortedStats[index - 1]
          rollingAvg = ((prev.fantasyPoints || 0) + (stat.fantasyPoints || 0)) / 2
          gamesForAvg = 2
          recentMarketValue = Math.round(MAGIC_NUMBER * rollingAvg)
          // No price change for second game
        } else {
          // Third game onwards - use rolling 3-game average and apply price changes
          const last3 = sortedStats.slice(Math.max(0, index - 2), index + 1)
          const total = last3.reduce((sum, s) => sum + (s.fantasyPoints || 0), 0)
          rollingAvg = total / last3.length
          gamesForAvg = 3

          // Calculate current price by applying all previous price changes
          currentPrice = player.price
          for (let i = 2; i < index; i++) {
            const prevLast3 = sortedStats.slice(Math.max(0, i - 2), i + 1)
            const prevTotal = prevLast3.reduce((sum, s) => sum + (s.fantasyPoints || 0), 0)
            const prevRollingAvg = prevTotal / prevLast3.length
            const prevRecentMarketValue = MAGIC_NUMBER * prevRollingAvg
            const prevNewPrice = Math.round(0.75 * currentPrice + 0.25 * prevRecentMarketValue)
            currentPrice = prevNewPrice
          }

          recentMarketValue = Math.round(MAGIC_NUMBER * rollingAvg)
          newPrice = Math.round(0.75 * currentPrice + 0.25 * recentMarketValue)
          priceChange = newPrice - currentPrice
        }

        return {
          round: stat.round,
          season: stat.season,
          fantasyPoints: stat.fantasyPoints || 0,
          rollingAvg: Math.round(rollingAvg * 10) / 10,
          gamesForAvg,
          currentPrice: Math.round(currentPrice),
          recentMarketValue,
          priceChange,
          newPrice: Math.round(newPrice),
          difference: Math.round((newPrice - currentPrice) * 10) / 10,
        }
      })

      setPlayerWeeklyData(weeklyData)
    } catch (error) {
      console.error("Error loading player weekly data:", error)
    }
  }

  // Filter and sort players
  const filteredAndSortedPlayers = useMemo(() => {
    const filtered = players.filter((player) => {
      const matchesSearch =
        player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        player.team.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesPosition = positionFilter === "All" || player.position === positionFilter
      const matchesTeam = teamFilter === "All" || player.team === teamFilter
      const matchesValue = valueFilter === "All" || player.valueRating === valueFilter

      return matchesSearch && matchesPosition && matchesTeam && matchesValue
    })

    // Sort players
    filtered.sort((a, b) => {
      let aValue = a[sortBy as keyof PlayerValueData]
      let bValue = b[sortBy as keyof PlayerValueData]

      if (typeof aValue === "string") {
        aValue = aValue.toLowerCase()
        bValue = (bValue as string).toLowerCase()
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1
      return 0
    })

    return filtered
  }, [players, searchTerm, positionFilter, teamFilter, valueFilter, sortBy, sortOrder])

  // Get unique teams and positions for filters
  const teams = Array.from(new Set(players.map((p) => p.team))).sort()
  const positions = Array.from(new Set(players.map((p) => p.position))).sort()

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.onerror = null
    e.currentTarget.src = "/images/teams/placeholder.png"
  }

  const getValueIcon = (rating: string) => {
    switch (rating) {
      case "good":
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case "poor":
        return <TrendingDown className="h-4 w-4 text-red-600" />
      default:
        return <Minus className="h-4 w-4 text-gray-600" />
    }
  }

  const getValueColor = (rating: string) => {
    switch (rating) {
      case "good":
        return "text-green-600 bg-green-50"
      case "poor":
        return "text-red-600 bg-red-50"
      default:
        return "text-gray-600 bg-gray-50"
    }
  }

  const getPriceChangeColor = (change: number) => {
    if (change > 0) return "text-green-600"
    if (change < 0) return "text-red-600"
    return "text-gray-600"
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">New Pricing Model Test</h1>
            <p className="text-gray-600 mt-2">
              Players with 3+ games • Magic Number (MN) = $5,000 • Recent Market Value = MN × Last 3 games average • New
              Price = (0.75 × Old Price) + (0.25 × Recent Market Value) • Weighted pricing for stability
            </p>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2 mb-4">Loading value analysis...</span>

              {/* Debug Information */}
              {debugInfo.length > 0 && (
                <div className="bg-white rounded-lg shadow p-4 max-w-2xl w-full">
                  <h3 className="font-semibold mb-2">Debug Information:</h3>
                  <div className="text-sm space-y-1 max-h-40 overflow-y-auto">
                    {debugInfo.map((info, index) => (
                      <div key={index} className="text-gray-600">
                        {info}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>
              {/* Debug Information when loaded */}
              {debugInfo.length > 0 && (
                <div className="bg-white rounded-lg shadow p-4 mb-6">
                  <details>
                    <summary className="font-semibold cursor-pointer">Debug Information (Click to expand)</summary>
                    <div className="text-sm space-y-1 mt-2 max-h-40 overflow-y-auto">
                      {debugInfo.map((info, index) => (
                        <div key={index} className="text-gray-600">
                          {info}
                        </div>
                      ))}
                    </div>
                  </details>
                </div>
              )}

              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="text-sm text-gray-600">Total Players</div>
                  <div className="text-2xl font-bold text-gray-900">{players.length}</div>
                </div>
                <div className="bg-green-50 rounded-lg shadow p-4">
                  <div className="text-sm text-green-600">Rising (&gt;$50k)</div>
                  <div className="text-2xl font-bold text-green-700">
                    {players.filter((p) => p.valueRating === "good").length}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg shadow p-4">
                  <div className="text-sm text-gray-600">Stable</div>
                  <div className="text-2xl font-bold text-gray-700">
                    {players.filter((p) => p.valueRating === "fair").length}
                  </div>
                </div>
                <div className="bg-red-50 rounded-lg shadow p-4">
                  <div className="text-sm text-red-600">Falling (&lt;-$50k)</div>
                  <div className="text-2xl font-bold text-red-700">
                    {players.filter((p) => p.valueRating === "poor").length}
                  </div>
                </div>
              </div>

              {/* Player Detail Modal/Card */}
              {selectedPlayer && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="p-6">
                      <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold text-gray-900">
                          {players.find((p) => p.id === selectedPlayer)?.name} - Weekly Breakdown
                        </h2>
                        <Button onClick={() => setSelectedPlayer(null)} variant="outline" size="sm">
                          Close
                        </Button>
                      </div>

                      {playerWeeklyData.length > 0 ? (
                        <div className="space-y-4">
                          {playerWeeklyData.map((week, index) => (
                            <Card key={`${week.season}-${week.round}`} className="border-l-4 border-l-blue-500">
                              <CardHeader className="pb-3">
                                <CardTitle className="text-lg flex items-center justify-between">
                                  <span>
                                    Round {week.round} - Season {week.season}
                                  </span>
                                  <Badge
                                    variant={
                                      week.priceChange > 0
                                        ? "default"
                                        : week.priceChange < 0
                                          ? "destructive"
                                          : "secondary"
                                    }
                                  >
                                    {week.priceChange > 0 ? "+" : ""}${week.priceChange.toLocaleString()} Price Change
                                  </Badge>
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                  <div>
                                    <div className="text-sm text-gray-600">Fantasy Points</div>
                                    <div className="text-xl font-bold text-gray-900">{week.fantasyPoints}</div>
                                  </div>
                                  <div>
                                    <div className="text-sm text-gray-600">Rolling Avg ({week.gamesForAvg} games)</div>
                                    <div className="text-xl font-bold text-blue-600">{week.rollingAvg}</div>
                                  </div>
                                  <div>
                                    <div className="text-sm text-gray-600">Recent Market Value</div>
                                    <div className="text-xl font-bold text-purple-600">
                                      ${week.recentMarketValue.toLocaleString()}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-sm text-gray-600">Price Change</div>
                                    <div className={`text-xl font-bold ${getPriceChangeColor(week.priceChange)}`}>
                                      {week.priceChange > 0 ? "+" : ""}${week.priceChange.toLocaleString()}
                                    </div>
                                  </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-gray-200">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <div className="text-sm text-gray-600">Current Price</div>
                                      <div className="text-lg font-medium text-gray-900">
                                        ${week.currentPrice.toLocaleString()}
                                      </div>
                                    </div>
                                    <div>
                                      <div className="text-sm text-gray-600">New Price</div>
                                      <div className="text-lg font-medium text-gray-900">
                                        ${week.newPrice.toLocaleString()}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">Loading weekly data...</div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Filters */}
              <div className="bg-white rounded-lg shadow p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                  <div>
                    <input
                      type="text"
                      placeholder="Search players..."
                      className="w-full p-2 border border-gray-300 rounded-md text-sm"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <div>
                    <select
                      className="w-full p-2 border border-gray-300 rounded-md text-sm"
                      value={positionFilter}
                      onChange={(e) => setPositionFilter(e.target.value)}
                    >
                      <option value="All">All Positions</option>
                      {positions.map((pos) => (
                        <option key={pos} value={pos}>
                          {pos}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <select
                      className="w-full p-2 border border-gray-300 rounded-md text-sm"
                      value={teamFilter}
                      onChange={(e) => setTeamFilter(e.target.value)}
                    >
                      <option value="All">All Teams</option>
                      {teams.map((team) => (
                        <option key={team} value={team}>
                          {team}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <select
                      className="w-full p-2 border border-gray-300 rounded-md text-sm"
                      value={valueFilter}
                      onChange={(e) => setValueFilter(e.target.value)}
                    >
                      <option value="All">All Trends</option>
                      <option value="good">Rising</option>
                      <option value="fair">Stable</option>
                      <option value="poor">Falling</option>
                    </select>
                  </div>

                  <div>
                    <select
                      className="w-full p-2 border border-gray-300 rounded-md text-sm"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                    >
                      <option value="priceChange">Price Change</option>
                      <option value="averageScore">Average Score</option>
                      <option value="recentMarketValue">Market Value</option>
                      <option value="price">Current Price</option>
                      <option value="newPrice">New Price</option>
                      <option value="name">Name</option>
                      <option value="gamesPlayed">Games Played</option>
                    </select>
                  </div>

                  <div>
                    <button
                      onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                      className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
                    >
                      {sortOrder === "asc" ? "↑ Ascending" : "↓ Descending"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Players Table */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Player
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Team
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Position
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Current Price
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Games
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          3-Game Avg
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Market Value
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Price Change
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          New Price
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Details
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredAndSortedPlayers.map((player) => (
                        <tr key={player.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-xs font-medium text-gray-900">{player.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-6 w-6 mr-2">
                                <img
                                  src={getTeamLogoPath(player.team) || "/placeholder.svg"}
                                  alt={player.team}
                                  width={24}
                                  height={24}
                                  className="h-6 w-6 object-contain"
                                  onError={handleImageError}
                                />
                              </div>
                              <div className="text-xs text-gray-900">{player.team}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-xs text-gray-900">{player.position}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-xs text-gray-900">${player.price.toLocaleString()}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-xs text-gray-900">{player.gamesPlayed}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-xs text-gray-900">{player.averageScore}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-xs text-purple-600 font-medium">
                              ${player.recentMarketValue.toLocaleString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`text-xs font-medium ${getPriceChangeColor(player.priceChange)}`}>
                              {player.priceChange > 0 ? "+" : ""}${player.priceChange.toLocaleString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-xs text-gray-900 font-medium">${player.newPrice.toLocaleString()}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedPlayer(player.id)
                                loadPlayerWeeklyData(player.id)
                              }}
                            >
                              View
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
