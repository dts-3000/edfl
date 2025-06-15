"use client"

import type React from "react"

import { useState, useEffect } from "react"
import TeamTabs from "@/components/team-builder/TeamTabs"
import {
  fetchVFLData,
  type VFLPlayerStat,
  getUniqueVFLClubs,
  getUniqueEDFLClubs,
  getUniquePlayers,
  getPlayerStats,
  getClubStats,
  calculateAverages,
  getTopPerformers,
  getVFLRounds,
  getPlayerForm,
  getPlayerPosition,
  getFantasyRecommendation,
} from "@/lib/vflData"
import { getTeamLogoPath } from "@/lib/teamLogos"
import { SparklineStats } from "@/components/player-stats/SparklineStats"

export default function VFLStatsPage() {
  const [vflData, setVflData] = useState<VFLPlayerStat[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [vflClubs, setVflClubs] = useState<string[]>([])
  const [edflClubs, setEdflClubs] = useState<string[]>([])
  const [players, setPlayers] = useState<string[]>([])
  const [topPerformers, setTopPerformers] = useState<any[]>([])
  const [vflRounds, setVflRounds] = useState<number[]>([])

  // Initialize with empty strings to default to "All" options
  const [selectedVFLClub, setSelectedVFLClub] = useState<string>("")
  const [selectedEDFLClub, setSelectedEDFLClub] = useState<string>("")
  const [selectedPlayer, setSelectedPlayer] = useState<string>("")
  const [filteredStats, setFilteredStats] = useState<VFLPlayerStat[]>([])
  const [playerForm, setPlayerForm] = useState<any[]>([])
  const [viewMode, setViewMode] = useState<"players" | "clubs" | "leaderboard" | "recommendations">("leaderboard")
  const [dataVersion, setDataVersion] = useState<string>("VFL_Upload7")

  const [leaderboardFilters, setLeaderboardFilters] = useState({
    edflClub: "",
    vflClub: "",
    limit: 50,
    sortBy: "totalPoints" as "totalPoints" | "avgPoints" | "lastThreeAvg",
  })

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        const data = await fetchVFLData()

        if (data.length === 0) {
          setError("No data found. Please check the CSV format and try again.")
          setLoading(false)
          return
        }

        setVflData(data)

        const vflClubsList = getUniqueVFLClubs(data)
        const edflClubsList = getUniqueEDFLClubs(data)
        const playersList = getUniquePlayers(data)
        const topPlayersList = getTopPerformers(data, 50) // Increase from 15 to 50
        const roundsList = getVFLRounds(data)

        setVflClubs(vflClubsList)
        setEdflClubs(edflClubsList)
        setPlayers(playersList)
        setTopPerformers(topPlayersList)
        setVflRounds(roundsList)

        // Only set the player to the first one, leave club filters as empty strings
        if (playersList.length > 0) setSelectedPlayer(playersList[0])

        setFilteredStats(data)
        setDataVersion("VFL_Round9")
      } catch (err) {
        setError("Failed to load VFL data. Please try again later.")
        console.error("Error loading VFL data:", err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  useEffect(() => {
    if (vflData.length === 0) return

    let filtered = [...vflData]

    if (viewMode === "players") {
      if (selectedPlayer) {
        filtered = getPlayerStats(filtered, selectedPlayer)
        setPlayerForm(getPlayerForm(filtered))
      }
    } else if (viewMode === "clubs") {
      if (selectedVFLClub) {
        filtered = getClubStats(filtered, selectedVFLClub, true)
      }

      if (selectedEDFLClub) {
        filtered = getClubStats(filtered, selectedEDFLClub, false)
      }
    }

    setFilteredStats(filtered)
  }, [vflData, selectedVFLClub, selectedEDFLClub, selectedPlayer, viewMode])

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.onerror = null
    e.currentTarget.src = "/images/teams/placeholder.png"
  }

  const handlePlayerSelect = (player: string) => {
    setSelectedPlayer(player)
    setViewMode("players")
  }

  const getTrendIcon = (trend: string) => {
    if (trend === "up") return "↑"
    if (trend === "down") return "↓"
    return "→"
  }

  const getTrendColor = (trend: string) => {
    if (trend === "up") return "text-green-600"
    if (trend === "down") return "text-red-600"
    return "text-gray-600"
  }

  const getRecommendationColor = (score: number) => {
    if (score >= 80) return "bg-green-100 text-green-800"
    if (score >= 60) return "bg-blue-100 text-blue-800"
    if (score >= 40) return "bg-yellow-100 text-yellow-800"
    return "bg-gray-100 text-gray-800"
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">VFL Stats</h1>
        <TeamTabs activeTab="vfl-stats" />
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">VFL Stats</h1>
        <TeamTabs activeTab="vfl-stats" />
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
        </div>
      </div>
    )
  }

  // Calculate fantasy recommendations
  const recommendations = topPerformers
    .map((player) => {
      const playerStats = getPlayerStats(vflData, player.player)
      const position = getPlayerPosition(playerStats)
      const recommendationScore = getFantasyRecommendation(player)

      return {
        ...player,
        position,
        recommendationScore,
      }
    })
    .sort((a, b) => b.recommendationScore - a.recommendationScore)

  // Format player form data for sparkline
  const sparklineData = playerForm.map((form) => ({
    value: form.points,
    label: `R${form.round}`,
  }))

  // Filter and sort leaderboard based on current filters
  const filteredLeaderboard = topPerformers
    .filter((player) => {
      if (leaderboardFilters.edflClub && player.edflClub !== leaderboardFilters.edflClub) return false
      if (leaderboardFilters.vflClub && player.vflClub !== leaderboardFilters.vflClub) return false
      return true
    })
    .sort((a, b) => {
      switch (leaderboardFilters.sortBy) {
        case "totalPoints":
          return b.totalPoints - a.totalPoints
        case "avgPoints":
          return Number.parseFloat(b.avgPoints) - Number.parseFloat(a.avgPoints)
        case "lastThreeAvg":
          return Number.parseFloat(b.lastThreeAvg) - Number.parseFloat(a.lastThreeAvg)
        default:
          return b.totalPoints - a.totalPoints
      }
    })
    .slice(0, leaderboardFilters.limit)

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">VFL Stats</h1>
      <TeamTabs activeTab="vfl-stats" />

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <div className="flex flex-col md:flex-row md:items-center mb-6 space-y-4 md:space-y-0 md:space-x-4">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setViewMode("leaderboard")}
                className={`px-4 py-2 rounded-md ${
                  viewMode === "leaderboard" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Leaderboard
              </button>
              <button
                onClick={() => setViewMode("recommendations")}
                className={`px-4 py-2 rounded-md ${
                  viewMode === "recommendations"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Fantasy Picks
              </button>
              <button
                onClick={() => setViewMode("players")}
                className={`px-4 py-2 rounded-md ${
                  viewMode === "players" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Player View
              </button>
              <button
                onClick={() => {
                  setViewMode("clubs")
                  // Reset club filters to empty when switching to club view
                  setSelectedVFLClub("")
                  setSelectedEDFLClub("")
                }}
                className={`px-4 py-2 rounded-md ${
                  viewMode === "clubs" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Club View
              </button>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            Data version: {dataVersion} • {vflData.length} records • Last updated: {new Date().toLocaleDateString()}
          </div>
        </div>

        {viewMode === "players" ? (
          <div className="flex-grow mb-6">
            <select
              value={selectedPlayer}
              onChange={(e) => setSelectedPlayer(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              {players.map((player) => (
                <option key={player} value={player}>
                  {player}
                </option>
              ))}
            </select>
          </div>
        ) : viewMode === "clubs" ? (
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 flex-grow mb-6">
            <select
              value={selectedVFLClub}
              onChange={(e) => setSelectedVFLClub(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="">All VFL Clubs</option>
              {vflClubs.map((club) => (
                <option key={club} value={club}>
                  {club}
                </option>
              ))}
            </select>

            <select
              value={selectedEDFLClub}
              onChange={(e) => setSelectedEDFLClub(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="">All EDFL Clubs</option>
              {edflClubs.map((club) => (
                <option key={club} value={club}>
                  {club}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {viewMode === "recommendations" && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Fantasy Recommendations</h2>
            <p className="text-gray-600 mb-4">
              Players are ranked based on form, consistency, and recent performance. Higher scores indicate better
              fantasy prospects.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {recommendations.slice(0, 6).map((player, index) => (
                <div key={index} className="border rounded-lg overflow-hidden shadow-sm">
                  <div className="bg-gray-50 p-3 border-b flex justify-between items-center">
                    <div className="flex items-center">
                      <img
                        src={getTeamLogoPath(player.edflClub) || "/images/teams/placeholder.png"}
                        alt={player.edflClub}
                        className="h-8 w-8 mr-2"
                        onError={handleImageError}
                      />
                      <span className="font-medium">{player.player}</span>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getRecommendationColor(player.recommendationScore)}`}
                    >
                      {player.recommendationScore}/100
                    </span>
                  </div>
                  <div className="p-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">Position:</span>
                        <span className="ml-1 font-medium">{player.position}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">EDFL:</span>
                        <span className="ml-1">{player.edflClub}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">VFL:</span>
                        <span className="ml-1">{player.vflClub}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Games:</span>
                        <span className="ml-1">{player.gamesPlayed}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Avg:</span>
                        <span className="ml-1 font-medium">{player.avgPoints}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">L3 Avg:</span>
                        <span className={`ml-1 ${getTrendColor(player.trend)}`}>
                          {player.lastThreeAvg} {getTrendIcon(player.trend)}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3">
                      <button
                        onClick={() => handlePlayerSelect(player.player)}
                        className="w-full px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 text-sm"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="py-2 px-3 text-left">Rank</th>
                    <th className="py-2 px-3 text-left">Player</th>
                    <th className="py-2 px-3 text-left">Position</th>
                    <th className="py-2 px-3 text-left">EDFL Club</th>
                    <th className="py-2 px-3 text-left">VFL Club</th>
                    <th className="py-2 px-3 text-center">Games</th>
                    <th className="py-2 px-3 text-center">Avg FP</th>
                    <th className="py-2 px-3 text-center">Last 3 Avg</th>
                    <th className="py-2 px-3 text-center">Trend</th>
                    <th className="py-2 px-3 text-center">Score</th>
                    <th className="py-2 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recommendations.map((player, index) => (
                    <tr key={index} className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                      <td className="py-2 px-3 font-semibold">{index + 1}</td>
                      <td className="py-2 px-3">{player.player}</td>
                      <td className="py-2 px-3">{player.position}</td>
                      <td className="py-2 px-3">
                        <div className="flex items-center">
                          <img
                            src={getTeamLogoPath(player.edflClub) || "/images/teams/placeholder.png"}
                            alt={player.edflClub}
                            className="h-6 w-6 mr-2"
                            onError={handleImageError}
                          />
                          {player.edflClub}
                        </div>
                      </td>
                      <td className="py-2 px-3">{player.vflClub}</td>
                      <td className="py-2 px-3 text-center">{player.gamesPlayed}</td>
                      <td className="py-2 px-3 text-center">{player.avgPoints}</td>
                      <td className="py-2 px-3 text-center">{player.lastThreeAvg}</td>
                      <td className={`py-2 px-3 text-center ${getTrendColor(player.trend)}`}>
                        {getTrendIcon(player.trend)}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getRecommendationColor(player.recommendationScore)}`}
                        >
                          {player.recommendationScore}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <button
                          onClick={() => handlePlayerSelect(player.player)}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {viewMode === "leaderboard" && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Top Performers</h2>
              <div className="text-sm text-gray-600">
                Showing {filteredLeaderboard.length} of {topPerformers.length} players
              </div>
            </div>

            {/* Leaderboard Filters */}
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                  <select
                    value={leaderboardFilters.sortBy}
                    onChange={(e) =>
                      setLeaderboardFilters({
                        ...leaderboardFilters,
                        sortBy: e.target.value as "totalPoints" | "avgPoints" | "lastThreeAvg",
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="totalPoints">Total FP</option>
                    <option value="avgPoints">Avg FP</option>
                    <option value="lastThreeAvg">Last 3 Avg</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">EDFL Club</label>
                  <select
                    value={leaderboardFilters.edflClub}
                    onChange={(e) => setLeaderboardFilters({ ...leaderboardFilters, edflClub: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="">All EDFL Clubs</option>
                    {edflClubs.map((club) => (
                      <option key={club} value={club}>
                        {club}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">VFL Club</label>
                  <select
                    value={leaderboardFilters.vflClub}
                    onChange={(e) => setLeaderboardFilters({ ...leaderboardFilters, vflClub: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="">All VFL Clubs</option>
                    {vflClubs.map((club) => (
                      <option key={club} value={club}>
                        {club}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Show</label>
                  <select
                    value={leaderboardFilters.limit}
                    onChange={(e) => setLeaderboardFilters({ ...leaderboardFilters, limit: Number(e.target.value) })}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value={25}>Top 25</option>
                    <option value={50}>Top 50</option>
                    <option value={100}>Top 100</option>
                    <option value={999}>Show All</option>
                  </select>
                </div>
              </div>

              <div className="mt-3">
                <button
                  onClick={() => setLeaderboardFilters({ edflClub: "", vflClub: "", limit: 50, sortBy: "totalPoints" })}
                  className="text-blue-500 text-sm hover:text-blue-700"
                >
                  Reset Filters
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="py-2 px-3 text-left">Rank</th>
                    <th className="py-2 px-3 text-left">Player</th>
                    <th className="py-2 px-3 text-left">EDFL Club</th>
                    <th className="py-2 px-3 text-left">VFL Club</th>
                    <th className="py-2 px-3 text-center">Games</th>
                    <th className="py-2 px-3 text-center">Total FP</th>
                    <th className="py-2 px-3 text-center">Avg FP</th>
                    <th className="py-2 px-3 text-center">Last 3 Avg</th>
                    <th className="py-2 px-3 text-center">Trend</th>
                    <th className="py-2 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeaderboard.map((player, index) => (
                    <tr key={index} className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                      <td className="py-2 px-3 font-semibold">{index + 1}</td>
                      <td className="py-2 px-3">{player.player}</td>
                      <td className="py-2 px-3">
                        <div className="flex items-center">
                          <img
                            src={getTeamLogoPath(player.edflClub) || "/images/teams/placeholder.png"}
                            alt={player.edflClub}
                            className="h-6 w-6 mr-2"
                            onError={handleImageError}
                          />
                          {player.edflClub}
                        </div>
                      </td>
                      <td className="py-2 px-3">{player.vflClub}</td>
                      <td className="py-2 px-3 text-center">{player.gamesPlayed}</td>
                      <td className="py-2 px-3 text-center font-medium">{player.totalPoints}</td>
                      <td className="py-2 px-3 text-center">{player.avgPoints}</td>
                      <td className="py-2 px-3 text-center">{player.lastThreeAvg}</td>
                      <td className={`py-2 px-3 text-center ${getTrendColor(player.trend)}`}>
                        {getTrendIcon(player.trend)}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <button
                          onClick={() => handlePlayerSelect(player.player)}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {viewMode === "players" && selectedPlayer && (
          <div className="mb-6">
            <div className="flex items-center mb-4">
              <h2 className="text-xl font-semibold">{selectedPlayer}</h2>
              <div className="ml-4 flex items-center">
                <span className="text-sm text-gray-600 mr-2">EDFL Club:</span>
                <div className="flex items-center">
                  {filteredStats.length > 0 && (
                    <>
                      <img
                        src={getTeamLogoPath(filteredStats[0].EDFLClub) || "/images/teams/placeholder.png"}
                        alt={filteredStats[0].EDFLClub}
                        className="h-8 w-8 mr-1"
                        onError={handleImageError}
                      />
                      <span>{filteredStats[0].EDFLClub}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="ml-4 flex items-center">
                <span className="text-sm text-gray-600 mr-2">VFL Club:</span>
                <span>{filteredStats.length > 0 ? filteredStats[0].VFLClub : ""}</span>
              </div>
              {filteredStats.length > 0 && (
                <div className="ml-4 flex items-center">
                  <span className="text-sm text-gray-600 mr-2">Position:</span>
                  <span className="font-medium">{getPlayerPosition(filteredStats)}</span>
                </div>
              )}
            </div>

            {filteredStats.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium mb-3">Season Averages</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(calculateAverages(filteredStats)).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-gray-600">{key.replace("avg", "")}:</span>
                        <span className="font-medium">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* SparklineStats component */}
                <SparklineStats data={sparklineData} title="Performance Trend" lineColor="#3b82f6" height={60} />
              </div>
            )}
          </div>
        )}

        {viewMode !== "leaderboard" && viewMode !== "recommendations" && (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-2 px-3 text-left">Date</th>
                  <th className="py-2 px-3 text-left">Round</th>
                  <th className="py-2 px-3 text-left">Player</th>
                  <th className="py-2 px-3 text-left">EDFL Club</th>
                  <th className="py-2 px-3 text-left">VFL Club</th>
                  <th className="py-2 px-3 text-center">G</th>
                  <th className="py-2 px-3 text-center">B</th>
                  <th className="py-2 px-3 text-center">K</th>
                  <th className="py-2 px-3 text-center">H</th>
                  <th className="py-2 px-3 text-center">M</th>
                  <th className="py-2 px-3 text-center">T</th>
                  <th className="py-2 px-3 text-center">HO</th>
                  <th className="py-2 px-3 text-center">FP</th>
                </tr>
              </thead>
              <tbody>
                {filteredStats.length > 0 ? (
                  filteredStats.map((stat, index) => (
                    <tr key={index} className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                      <td className="py-2 px-3">{stat.Date}</td>
                      <td className="py-2 px-3">{stat.VFLRound}</td>
                      <td className="py-2 px-3">{stat.Player}</td>
                      <td className="py-2 px-3">
                        <div className="flex items-center">
                          <img
                            src={getTeamLogoPath(stat.EDFLClub) || "/images/teams/placeholder.png"}
                            alt={stat.EDFLClub}
                            className="h-6 w-6 mr-2"
                            onError={handleImageError}
                          />
                          {stat.EDFLClub}
                        </div>
                      </td>
                      <td className="py-2 px-3">{stat.VFLClub}</td>
                      <td className="py-2 px-3 text-center">{stat.G}</td>
                      <td className="py-2 px-3 text-center">{stat.B}</td>
                      <td className="py-2 px-3 text-center">{stat.K}</td>
                      <td className="py-2 px-3 text-center">{stat.H}</td>
                      <td className="py-2 px-3 text-center">{stat.M}</td>
                      <td className="py-2 px-3 text-center">{stat.T}</td>
                      <td className="py-2 px-3 text-center">{stat.HO}</td>
                      <td className="py-2 px-3 text-center font-medium">{stat.TotalFP}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={13} className="py-4 text-center text-gray-500">
                      No data available for the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
