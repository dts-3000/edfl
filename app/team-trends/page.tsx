"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { initializeApp } from "firebase/app"
import { getFirestore, collection, getDocs } from "firebase/firestore"
import { getTeamLogoPath } from "@/lib/teamLogos"
import TeamTabs from "@/components/team-builder/TeamTabs"
import Navbar from "@/components/layout/Navbar"

// Initialize Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

interface MatchResult {
  id: string
  season: number
  round: number
  date: string
  homeTeam: string
  awayTeam: string
  venue?: string
  homeScore?: number
  awayScore?: number
  hasStats: boolean
  winner?: string
  margin?: number
}

// Helper function to safely display numeric values
const safeNumber = (value: number): string => {
  if (isNaN(value) || value === undefined || value === null) {
    return "0"
  }
  return value.toString()
}

// Helper function to parse date
const parseDate = (dateString: string): Date => {
  try {
    return new Date(dateString)
  } catch (e) {
    console.error("Error parsing date:", e, dateString)
    return new Date()
  }
}

// Helper function to check if a match is completed (has scores)
const isMatchCompleted = (match: MatchResult): boolean => {
  return (
    match.homeScore !== undefined &&
    match.homeScore !== null &&
    match.awayScore !== undefined &&
    match.awayScore !== null
  )
}

// Calculate winner and margin for matches
const calculateMatchResult = (match: MatchResult): MatchResult => {
  if (!isMatchCompleted(match)) {
    return { ...match, winner: undefined, margin: 0 }
  }

  const homeScore = match.homeScore!
  const awayScore = match.awayScore!

  let winner: string
  if (homeScore > awayScore) {
    winner = match.homeTeam
  } else if (awayScore > homeScore) {
    winner = match.awayTeam
  } else {
    winner = "Draw"
  }

  const margin = Math.abs(homeScore - awayScore)

  return { ...match, winner, margin }
}

// Get team results that filters out unplayed matches
const getFilteredTeamResults = (matches: MatchResult[], teamName: string): MatchResult[] => {
  if (!matches || !teamName) return []

  return matches.filter(
    (match) => (match.homeTeam === teamName || match.awayTeam === teamName) && isMatchCompleted(match),
  )
}

// Get team win/loss record that only counts completed matches
const getFilteredTeamWinLossRecord = (matches: MatchResult[], teamName: string) => {
  if (!matches || !teamName) return { wins: 0, losses: 0, draws: 0 }

  const completedMatches = matches.filter(
    (match) => (match.homeTeam === teamName || match.awayTeam === teamName) && isMatchCompleted(match),
  )

  let wins = 0
  let losses = 0
  let draws = 0

  completedMatches.forEach((match) => {
    const matchWithResult = calculateMatchResult(match)
    if (matchWithResult.winner === teamName) wins++
    else if (matchWithResult.winner === "Draw") draws++
    else losses++
  })

  return { wins, losses, draws }
}

// Get team average score
const getTeamAverageScore = (matches: MatchResult[], teamName: string): number => {
  if (!matches || !teamName) return 0

  const teamMatches = getFilteredTeamResults(matches, teamName)

  if (teamMatches.length === 0) {
    return 0
  }

  const totalScore = teamMatches.reduce((sum, match) => {
    if (match.homeTeam === teamName) {
      return sum + (match.homeScore || 0)
    } else {
      return sum + (match.awayScore || 0)
    }
  }, 0)

  const average = totalScore / teamMatches.length
  return isNaN(average) ? 0 : Math.round(average)
}

// Get team average score against
const getTeamAverageScoreAgainst = (matches: MatchResult[], teamName: string): number => {
  if (!matches || !teamName) return 0

  const teamMatches = getFilteredTeamResults(matches, teamName)

  if (teamMatches.length === 0) {
    return 0
  }

  const totalScoreAgainst = teamMatches.reduce((sum, match) => {
    if (match.homeTeam === teamName) {
      return sum + (match.awayScore || 0)
    } else {
      return sum + (match.homeScore || 0)
    }
  }, 0)

  const average = totalScoreAgainst / teamMatches.length
  return isNaN(average) ? 0 : Math.round(average)
}

// Get team form that only counts completed matches
const getFilteredTeamForm = (matches: MatchResult[], teamName: string, limit = 5): string[] => {
  if (!matches || !teamName) return []

  const completedMatches = matches.filter(
    (match) => (match.homeTeam === teamName || match.awayTeam === teamName) && isMatchCompleted(match),
  )

  // Sort by date (newest first)
  const sortedMatches = [...completedMatches].sort((a, b) => {
    const dateA = parseDate(a.date)
    const dateB = parseDate(b.date)
    return dateB.getTime() - dateA.getTime()
  })

  const form: string[] = []

  for (let i = 0; i < Math.min(sortedMatches.length, limit); i++) {
    const match = sortedMatches[i]
    const matchWithResult = calculateMatchResult(match)
    if (matchWithResult.winner === teamName) form.push("W")
    else if (matchWithResult.winner === "Draw") form.push("D")
    else form.push("L")
  }

  return form
}

// Get head to head
const getHeadToHead = (
  matches: MatchResult[],
  team1: string,
  team2: string,
): { team1Wins: number; team2Wins: number; draws: number } => {
  if (!matches || !team1 || !team2) return { team1Wins: 0, team2Wins: 0, draws: 0 }

  const h2hMatches = matches.filter(
    (match) =>
      ((match.homeTeam === team1 && match.awayTeam === team2) ||
        (match.homeTeam === team2 && match.awayTeam === team1)) &&
      isMatchCompleted(match),
  )

  let team1Wins = 0
  let team2Wins = 0
  let draws = 0

  h2hMatches.forEach((match) => {
    const matchWithResult = calculateMatchResult(match)
    if (matchWithResult.winner === team1) {
      team1Wins++
    } else if (matchWithResult.winner === team2) {
      team2Wins++
    } else {
      draws++
    }
  })

  return { team1Wins, team2Wins, draws }
}

// Get head to head matches
const getHeadToHeadMatches = (matches: MatchResult[], team1: string, team2: string, limit = 6): MatchResult[] => {
  if (!matches || !team1 || !team2) return []

  const h2hMatches = matches.filter(
    (match) =>
      ((match.homeTeam === team1 && match.awayTeam === team2) ||
        (match.homeTeam === team2 && match.awayTeam === team1)) &&
      isMatchCompleted(match),
  )

  // Sort by date (newest first)
  const sortedMatches = [...h2hMatches].sort((a, b) => {
    const dateA = parseDate(a.date)
    const dateB = parseDate(b.date)
    return dateB.getTime() - dateA.getTime()
  })

  return sortedMatches.slice(0, limit)
}

export default function TeamTrendsPage() {
  const [matches, setMatches] = useState<MatchResult[]>([])
  const [selectedTeam, setSelectedTeam] = useState<string>("")
  const [comparisonTeam, setComparisonTeam] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(true)
  const [teams, setTeams] = useState<string[]>([])
  const [selectedSeason, setSelectedSeason] = useState<number | "All">(2025)
  const [seasons, setSeasons] = useState<number[]>([])

  useEffect(() => {
    async function loadMatchData() {
      setLoading(true)
      try {
        // Load matches from Firebase
        const matchesCollection = collection(db, "matches")
        const matchesSnapshot = await getDocs(matchesCollection)

        const matchData: MatchResult[] = []
        matchesSnapshot.forEach((doc) => {
          const data = doc.data()
          matchData.push({
            id: doc.id,
            season: Number(data.season) || 2025,
            round: Number(data.round) || 1,
            date: data.date || "",
            homeTeam: data.homeTeam || "",
            awayTeam: data.awayTeam || "",
            venue: data.venue || "",
            homeScore: data.homeScore,
            awayScore: data.awayScore,
            hasStats: Boolean(data.hasStats),
            awayScore: data.awayScore,
            hasStats: Boolean(data.hasStats),
          })
        })

        // Calculate results for each match
        const matchesWithResults = matchData.map(calculateMatchResult)

        setMatches(matchesWithResults)

        // Extract unique team names
        const uniqueTeams = Array.from(
          new Set([...matchData.map((match) => match.homeTeam), ...matchData.map((match) => match.awayTeam)]),
        ).sort()

        // Extract unique seasons
        const uniqueSeasons = Array.from(new Set(matchData.map((match) => match.season))).sort((a, b) => b - a)

        setTeams(uniqueTeams)
        setSeasons(uniqueSeasons)

        if (uniqueTeams.length > 0) {
          setSelectedTeam(uniqueTeams[0])
          setComparisonTeam(uniqueTeams.length > 1 ? uniqueTeams[1] : uniqueTeams[0])
        }
      } catch (error) {
        console.error("Error loading match data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadMatchData()
  }, [])

  // Filter matches by season if needed
  const filteredMatches =
    selectedSeason === "All" ? matches : matches.filter((match) => match.season === selectedSeason)

  // Get only completed matches for the selected team
  const completedTeamMatches = filteredMatches.filter(
    (match) => (match.homeTeam === selectedTeam || match.awayTeam === selectedTeam) && isMatchCompleted(match),
  )

  // Safely get team results (only completed matches)
  const teamResults = getFilteredTeamResults(filteredMatches, selectedTeam)

  // Safely get win/loss record (only completed matches)
  const winLossRecord = getFilteredTeamWinLossRecord(filteredMatches, selectedTeam)

  // Safely get average scores (only completed matches)
  const averageScore = selectedTeam ? getTeamAverageScore(completedTeamMatches, selectedTeam) : 0
  const averageScoreAgainst = selectedTeam ? getTeamAverageScoreAgainst(completedTeamMatches, selectedTeam) : 0

  // Safely get form (only completed matches)
  const form = getFilteredTeamForm(filteredMatches, selectedTeam, 5)

  // Safely get head to head (only completed matches)
  const headToHead =
    selectedTeam && comparisonTeam
      ? getHeadToHead(
          filteredMatches.filter((match) => isMatchCompleted(match)),
          selectedTeam,
          comparisonTeam,
        )
      : { team1Wins: 0, team2Wins: 0, draws: 0 }

  // Get head to head matches
  const headToHeadMatches =
    selectedTeam && comparisonTeam
      ? getHeadToHeadMatches(matches, selectedTeam, comparisonTeam, 6) // Use all matches, not just filtered by season
      : []

  // Get upcoming matches for a team
  const getUpcomingMatches = (matches: MatchResult[], teamName: string, limit = 5): MatchResult[] => {
    if (!matches || !teamName) return []

    const seasonMatches =
      selectedSeason === "All" ? matches : matches.filter((match) => match.season === selectedSeason)

    return seasonMatches
      .filter((match) => {
        return (match.homeTeam === teamName || match.awayTeam === teamName) && !isMatchCompleted(match)
      })
      .sort((a, b) => {
        const dateA = parseDate(a.date)
        const dateB = parseDate(b.date)
        return dateA.getTime() - dateB.getTime()
      })
      .slice(0, limit)
  }

  // Get recent matches (only completed matches)
  const getRecentMatches = (matches: MatchResult[], teamName: string, limit = 10): MatchResult[] => {
    if (!matches || !teamName) return []

    const teamMatches = matches.filter(
      (match) => (match.homeTeam === teamName || match.awayTeam === teamName) && isMatchCompleted(match),
    )

    return teamMatches
      .sort((a, b) => {
        const dateA = parseDate(a.date)
        const dateB = parseDate(b.date)
        return dateB.getTime() - dateA.getTime()
      })
      .slice(0, limit)
  }

  const recentMatches = getRecentMatches(filteredMatches, selectedTeam)

  // Calculate offensive and defensive strengths
  const calculateStrengths = () => {
    if (!selectedTeam || completedTeamMatches.length === 0) {
      return {
        offensive: { rating: 0, description: "No data available" },
        defensive: { rating: 0, description: "No data available" },
      }
    }

    // Calculate average scores for all teams (only completed matches)
    const allTeamScores: Record<string, { totalScore: number; games: number }> = {}

    filteredMatches
      .filter((match) => isMatchCompleted(match))
      .forEach((match) => {
        if (!allTeamScores[match.homeTeam]) {
          allTeamScores[match.homeTeam] = { totalScore: 0, games: 0 }
        }
        if (!allTeamScores[match.awayTeam]) {
          allTeamScores[match.awayTeam] = { totalScore: 0, games: 0 }
        }

        allTeamScores[match.homeTeam].totalScore += match.homeScore!
        allTeamScores[match.homeTeam].games += 1

        allTeamScores[match.awayTeam].totalScore += match.awayScore!
        allTeamScores[match.awayTeam].games += 1
      })

    // Calculate league average
    let totalLeagueScore = 0
    let totalLeagueGames = 0

    Object.values(allTeamScores).forEach((team) => {
      totalLeagueScore += team.totalScore
      totalLeagueGames += team.games
    })

    const leagueAverage = totalLeagueGames > 0 ? totalLeagueScore / totalLeagueGames : 0

    // Calculate team's offensive and defensive ratings
    const teamAvgScore = averageScore
    const teamAvgAgainst = averageScoreAgainst

    const offensiveRating = leagueAverage > 0 ? (teamAvgScore / leagueAverage) * 100 : 0
    const defensiveRating = leagueAverage > 0 ? (1 - teamAvgAgainst / leagueAverage) * 100 + 50 : 0

    // Generate descriptions
    let offensiveDescription = "Average offense"
    if (offensiveRating > 120) offensiveDescription = "Elite offense"
    else if (offensiveRating > 110) offensiveDescription = "Strong offense"
    else if (offensiveRating < 90) offensiveDescription = "Weak offense"
    else if (offensiveRating < 80) offensiveDescription = "Poor offense"

    let defensiveDescription = "Average defense"
    if (defensiveRating > 70) defensiveDescription = "Elite defense"
    else if (defensiveRating > 60) defensiveDescription = "Strong defense"
    else if (defensiveRating < 40) defensiveDescription = "Weak defense"
    else if (defensiveRating < 30) defensiveDescription = "Poor defense"

    return {
      offensive: {
        rating: Math.round(offensiveRating),
        description: offensiveDescription,
      },
      defensive: {
        rating: Math.round(defensiveRating),
        description: defensiveDescription,
      },
    }
  }

  const strengths = calculateStrengths()
  const upcomingMatches = selectedTeam ? getUpcomingMatches(matches, selectedTeam) : []

  // Calculate season-by-season performance
  const calculateSeasonPerformance = () => {
    if (!selectedTeam) return []

    const seasonPerformance = seasons.map((season) => {
      const seasonMatches = matches.filter((match) => match.season === season)

      // Only count completed matches
      const completedMatches = seasonMatches.filter(
        (match) => (match.homeTeam === selectedTeam || match.awayTeam === selectedTeam) && isMatchCompleted(match),
      )

      const record = getFilteredTeamWinLossRecord(seasonMatches, selectedTeam)

      // Calculate average scores only from completed matches
      const avgScore =
        completedMatches.length > 0
          ? completedMatches.reduce((total, match) => {
              if (match.homeTeam === selectedTeam) return total + (match.homeScore || 0)
              return total + (match.awayScore || 0)
            }, 0) / completedMatches.length
          : 0

      const avgAgainst =
        completedMatches.length > 0
          ? completedMatches.reduce((total, match) => {
              if (match.homeTeam === selectedTeam) return total + (match.awayScore || 0)
              return total + (match.homeScore || 0)
            }, 0) / completedMatches.length
          : 0

      return {
        season,
        matches: completedMatches.length,
        wins: record.wins,
        losses: record.losses,
        draws: record.draws,
        winPercentage: completedMatches.length > 0 ? Math.round((record.wins / completedMatches.length) * 100) : 0,
        avgScore: Math.round(avgScore * 10) / 10,
        avgAgainst: Math.round(avgAgainst * 10) / 10,
      }
    })

    return seasonPerformance
  }

  const seasonPerformance = calculateSeasonPerformance()

  // Handle missing team logo gracefully
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.onerror = null
    e.currentTarget.src = "/images/teams/placeholder.png"
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Team Performance Analysis</h1>

        <TeamTabs activeTab="team-trends" />

        <div className="mt-6 grid grid-cols-1 gap-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="spinner"></div>
              <p className="mt-4 text-gray-500">Loading team data...</p>
            </div>
          ) : (
            <>
              <div className="bg-white shadow rounded-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label htmlFor="team-select" className="block text-sm font-medium text-gray-700 mb-2">
                      Select Team
                    </label>
                    <select
                      id="team-select"
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                      value={selectedTeam}
                      onChange={(e) => setSelectedTeam(e.target.value)}
                    >
                      {teams.map((team) => (
                        <option key={team} value={team}>
                          {team}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="season-select" className="block text-sm font-medium text-gray-700 mb-2">
                      Season
                    </label>
                    <select
                      id="season-select"
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                      value={selectedSeason}
                      onChange={(e) => setSelectedSeason(e.target.value === "All" ? "All" : Number(e.target.value))}
                    >
                      <option value="All">All Seasons</option>
                      {seasons.map((season) => (
                        <option key={season} value={season}>
                          {season}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {selectedTeam && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center mb-4">
                          <div className="h-16 w-16 mr-4">
                            <img
                              src={getTeamLogoPath(selectedTeam) || "/placeholder.svg"}
                              alt={selectedTeam}
                              width={64}
                              height={64}
                              className="h-16 w-16 object-contain"
                              onError={handleImageError}
                            />
                          </div>
                          <h2 className="text-xl font-bold">{selectedTeam}</h2>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mb-4">
                          <div className="bg-green-100 p-3 rounded-lg text-center">
                            <p className="text-sm text-gray-500">Wins</p>
                            <p className="text-2xl font-bold text-green-700">{safeNumber(winLossRecord.wins)}</p>
                          </div>
                          <div className="bg-red-100 p-3 rounded-lg text-center">
                            <p className="text-sm text-gray-500">Losses</p>
                            <p className="text-2xl font-bold text-red-700">{safeNumber(winLossRecord.losses)}</p>
                          </div>
                          <div className="bg-gray-100 p-3 rounded-lg text-center">
                            <p className="text-sm text-gray-500">Draws</p>
                            <p className="text-2xl font-bold text-gray-700">{safeNumber(winLossRecord.draws)}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="bg-blue-50 p-3 rounded-lg">
                            <p className="text-sm text-gray-500">Avg Score For</p>
                            <p className="text-2xl font-bold text-blue-700">{averageScore.toFixed(1)}</p>
                          </div>
                          <div className="bg-orange-50 p-3 rounded-lg">
                            <p className="text-sm text-gray-500">Avg Score Against</p>
                            <p className="text-2xl font-bold text-orange-700">{averageScoreAgainst.toFixed(1)}</p>
                          </div>
                        </div>

                        <div className="mb-4">
                          <p className="text-sm text-gray-500 mb-2">Recent Form</p>
                          <div className="flex space-x-2">
                            {form.length > 0 ? (
                              form.map((result, index) => (
                                <div
                                  key={index}
                                  className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-white ${
                                    result === "W" ? "bg-green-500" : result === "L" ? "bg-red-500" : "bg-gray-500"
                                  }`}
                                >
                                  {result}
                                </div>
                              ))
                            ) : (
                              <p className="text-gray-500">No completed matches</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Team Strengths */}
                      <div className="bg-gray-50 rounded-lg p-4 mt-4">
                        <h3 className="text-lg font-medium mb-3">Team Strengths</h3>

                        <div className="mb-4">
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium">Offensive Rating</span>
                            <span className="text-sm font-medium">{strengths.offensive.rating}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                              className={`h-2.5 rounded-full ${
                                strengths.offensive.rating > 110
                                  ? "bg-green-600"
                                  : strengths.offensive.rating > 90
                                    ? "bg-yellow-500"
                                    : "bg-red-600"
                              }`}
                              style={{
                                width: `${(Math.min(Math.max(strengths.offensive.rating, 0), 150) * 100) / 150}%`,
                              }}
                            ></div>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{strengths.offensive.description}</p>
                        </div>

                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium">Defensive Rating</span>
                            <span className="text-sm font-medium">{strengths.defensive.rating}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                              className={`h-2.5 rounded-full ${
                                strengths.defensive.rating > 60
                                  ? "bg-green-600"
                                  : strengths.defensive.rating > 40
                                    ? "bg-yellow-500"
                                    : "bg-red-600"
                              }`}
                              style={{ width: `${Math.min(Math.max(strengths.defensive.rating, 0), 100)}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{strengths.defensive.description}</p>
                        </div>
                      </div>

                      {/* Live Ladder */}
                      <div className="bg-gray-50 rounded-lg p-4 mt-4">
                        <h3 className="text-lg font-medium mb-3">All-Time Ladder</h3>

                        {(() => {
                          // Calculate ladder for all teams using ALL matches (not filtered by season)
                          const ladderData = teams.map((team) => {
                            const record = getFilteredTeamWinLossRecord(matches, team) // Use all matches, not filteredMatches
                            const totalGames = record.wins + record.losses + record.draws
                            const points = record.wins * 4 + record.draws * 2 // 4 points for win, 2 for draw
                            const avgFor = getTeamAverageScore(
                              matches.filter(
                                (m) => (m.homeTeam === team || m.awayTeam === team) && isMatchCompleted(m),
                              ),
                              team,
                            )
                            const avgAgainst = getTeamAverageScoreAgainst(
                              matches.filter(
                                (m) => (m.homeTeam === team || m.awayTeam === team) && isMatchCompleted(m),
                              ),
                              team,
                            )
                            const percentage = avgAgainst > 0 ? (avgFor / avgAgainst) * 100 : 0

                            return {
                              team,
                              wins: record.wins,
                              losses: record.losses,
                              draws: record.draws,
                              totalGames,
                              points,
                              avgFor,
                              avgAgainst,
                              percentage: percentage.toFixed(0), // Round to whole number
                            }
                          })

                          // Sort by points (descending), then by percentage (descending), then by wins (descending)
                          const sortedLadder = ladderData.sort((a, b) => {
                            if (b.points !== a.points) return b.points - a.points
                            if (b.percentage !== a.percentage)
                              return Number.parseFloat(b.percentage) - Number.parseFloat(a.percentage)
                            return b.wins - a.wins
                          })

                          return (
                            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                              <table className="w-full">
                                <thead className="bg-gray-100">
                                  <tr>
                                    <th className="px-1 py-1 text-left text-[10px] font-medium text-gray-500 uppercase">
                                      #
                                    </th>
                                    <th className="px-2 py-1 text-left text-[10px] font-medium text-gray-500 uppercase">
                                      Team
                                    </th>
                                    <th className="px-1 py-1 text-center text-[10px] font-medium text-gray-500 uppercase">
                                      P
                                    </th>
                                    <th className="px-1 py-1 text-center text-[10px] font-medium text-gray-500 uppercase">
                                      W
                                    </th>
                                    <th className="px-1 py-1 text-center text-[10px] font-medium text-gray-500 uppercase">
                                      L
                                    </th>
                                    <th className="px-1 py-1 text-center text-[10px] font-medium text-gray-500 uppercase">
                                      D
                                    </th>
                                    <th className="px-1 py-1 text-center text-[10px] font-medium text-gray-500 uppercase">
                                      Pts
                                    </th>
                                    <th className="px-1 py-1 text-center text-[10px] font-medium text-gray-500 uppercase">
                                      %
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                  {sortedLadder.map((teamData, index) => (
                                    <tr
                                      key={teamData.team}
                                      className={`hover:bg-gray-50 ${teamData.team === selectedTeam ? "bg-blue-50 border-l-2 border-blue-500" : ""}`}
                                    >
                                      <td className="px-1 py-1 text-[10px] font-medium text-gray-900">{index + 1}</td>
                                      <td className="px-2 py-1">
                                        <div className="flex items-center">
                                          <div className="h-4 w-4 mr-1 flex-shrink-0">
                                            <img
                                              src={getTeamLogoPath(teamData.team) || "/placeholder.svg"}
                                              alt={teamData.team}
                                              width={16}
                                              height={16}
                                              className="h-4 w-4 object-contain"
                                              onError={handleImageError}
                                            />
                                          </div>
                                          <span
                                            className={`text-[10px] truncate max-w-16 ${teamData.team === selectedTeam ? "font-bold text-blue-700" : "text-gray-900"}`}
                                          >
                                            {teamData.team.length > 8
                                              ? teamData.team.substring(0, 8) + "..."
                                              : teamData.team}
                                          </span>
                                        </div>
                                      </td>
                                      <td className="px-1 py-1 text-[10px] text-center text-gray-500">
                                        {teamData.totalGames}
                                      </td>
                                      <td className="px-1 py-1 text-[10px] text-center font-medium text-green-600">
                                        {teamData.wins}
                                      </td>
                                      <td className="px-1 py-1 text-[10px] text-center font-medium text-red-600">
                                        {teamData.losses}
                                      </td>
                                      <td className="px-1 py-1 text-[10px] text-center font-medium text-gray-600">
                                        {teamData.draws}
                                      </td>
                                      <td className="px-1 py-1 text-[10px] text-center font-bold text-blue-600">
                                        {teamData.points}
                                      </td>
                                      <td className="px-1 py-1 text-[10px] text-center text-gray-500">
                                        {teamData.percentage}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>

                              <div className="px-2 py-1 bg-gray-50 border-t">
                                <p className="text-[9px] text-gray-500">
                                  All-time records • Win=4pts, Draw=2pts • %=(For÷Against)×100
                                </p>
                              </div>
                            </div>
                          )
                        })()}
                      </div>
                    </div>

                    <div className="lg:col-span-2">
                      <div className="bg-gray-50 rounded-lg p-4 h-full">
                        <h3 className="text-lg font-medium mb-4">Season-by-Season Performance</h3>

                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-100">
                              <tr>
                                <th
                                  scope="col"
                                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                  Season
                                </th>
                                <th
                                  scope="col"
                                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                  W-L-D
                                </th>
                                <th
                                  scope="col"
                                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                  Win %
                                </th>
                                <th
                                  scope="col"
                                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                  Avg For
                                </th>
                                <th
                                  scope="col"
                                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                  Avg Against
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {seasonPerformance.map((season) => (
                                <tr key={season.season}>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {season.season}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                    {season.wins}-{season.losses}-{season.draws}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                    {season.winPercentage}%
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                    {season.avgScore}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                    {season.avgAgainst}
                                  </td>
                                </tr>
                              ))}
                              {seasonPerformance.length === 0 && (
                                <tr>
                                  <td colSpan={5} className="px-4 py-3 text-center text-sm text-gray-500">
                                    No season data available
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>

                        <h3 className="text-lg font-medium mt-6 mb-4">Recent Matches</h3>
                        <div className="space-y-3">
                          {recentMatches.length > 0 ? (
                            recentMatches.map((match, index) => {
                              const matchWithResult = calculateMatchResult(match)
                              return (
                                <div key={index} className="bg-white p-2 rounded-lg shadow-sm">
                                  <div className="text-[10px] text-gray-500 mb-1">
                                    {new Date(match.date).toLocaleDateString("en-AU")} - Round {match.round}
                                  </div>
                                  <div className="grid grid-cols-7 items-center">
                                    <div className="col-span-3 flex items-center">
                                      <div className="h-8 w-8 mr-2 flex-shrink-0">
                                        <img
                                          src={getTeamLogoPath(match.homeTeam) || "/placeholder.svg"}
                                          alt={match.homeTeam}
                                          width={32}
                                          height={32}
                                          className="h-8 w-8 object-contain"
                                          onError={handleImageError}
                                        />
                                      </div>
                                      <span
                                        className={`text-xs truncate ${matchWithResult.winner === match.homeTeam ? "font-bold" : ""}`}
                                      >
                                        {match.homeTeam}
                                      </span>
                                    </div>

                                    <div className="col-span-1 text-center">
                                      <span className="inline-flex items-center justify-center font-bold text-xs">
                                        <span className="w-6 text-right">{safeNumber(match.homeScore || 0)}</span>
                                        <span className="mx-1">-</span>
                                        <span className="w-6 text-left">{safeNumber(match.awayScore || 0)}</span>
                                      </span>
                                    </div>

                                    <div className="col-span-3 flex items-center justify-end">
                                      <span
                                        className={`text-xs truncate text-right ${matchWithResult.winner === match.awayTeam ? "font-bold" : ""}`}
                                      >
                                        {match.awayTeam}
                                      </span>
                                      <div className="h-8 w-8 ml-2 flex-shrink-0">
                                        <img
                                          src={getTeamLogoPath(match.awayTeam) || "/placeholder.svg"}
                                          alt={match.awayTeam}
                                          width={32}
                                          height={32}
                                          className="h-8 w-8 object-contain"
                                          onError={handleImageError}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )
                            })
                          ) : (
                            <p className="text-gray-500">No completed matches found</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white shadow rounded-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label htmlFor="team1-select" className="block text-sm font-medium text-gray-700 mb-2">
                      Team 1
                    </label>
                    <select
                      id="team1-select"
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                      value={selectedTeam}
                      onChange={(e) => setSelectedTeam(e.target.value)}
                    >
                      {teams.map((team) => (
                        <option key={team} value={team}>
                          {team}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="team2-select" className="block text-sm font-medium text-gray-700 mb-2">
                      Team 2
                    </label>
                    <select
                      id="team2-select"
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                      value={comparisonTeam}
                      onChange={(e) => setComparisonTeam(e.target.value)}
                    >
                      {teams.map((team) => (
                        <option key={team} value={team}>
                          {team}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {selectedTeam && comparisonTeam && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <h3 className="text-lg font-medium text-center mb-4">Last 6 Meetings</h3>

                      {headToHeadMatches.length > 0 ? (
                        <div className="space-y-3">
                          {headToHeadMatches.map((match, index) => {
                            const matchWithResult = calculateMatchResult(match)
                            const isTeam1Home = match.homeTeam === selectedTeam
                            const team1Score = isTeam1Home ? match.homeScore : match.awayScore
                            const team2Score = isTeam1Home ? match.awayScore : match.homeScore
                            const team1Win = matchWithResult.winner === selectedTeam
                            const team2Win = matchWithResult.winner === comparisonTeam
                            const isDraw = matchWithResult.winner === "Draw"

                            return (
                              <div
                                key={index}
                                className={`p-3 rounded-lg ${
                                  team1Win
                                    ? "bg-blue-50 border-l-4 border-blue-500"
                                    : team2Win
                                      ? "bg-red-50 border-l-4 border-red-500"
                                      : "bg-gray-50 border-l-4 border-gray-400"
                                }`}
                              >
                                <div className="text-xs text-gray-500 mb-1">
                                  {new Date(match.date).toLocaleDateString("en-AU")} • Season {match.season} • Round{" "}
                                  {match.round}
                                  {match.venue && ` • ${match.venue}`}
                                </div>

                                <div className="grid grid-cols-7 items-center">
                                  <div className="col-span-3 flex items-center">
                                    <div className="h-8 w-8 mr-2 flex-shrink-0">
                                      <img
                                        src={getTeamLogoPath(selectedTeam) || "/placeholder.svg"}
                                        alt={selectedTeam}
                                        width={32}
                                        height={32}
                                        className="h-8 w-8 object-contain"
                                        onError={handleImageError}
                                      />
                                    </div>
                                    <span
                                      className={`text-sm truncate ${team1Win ? "font-bold" : ""} ${isTeam1Home ? "text-blue-600" : ""}`}
                                    >
                                      {selectedTeam}
                                      {isTeam1Home && <span className="text-xs ml-1">(H)</span>}
                                    </span>
                                  </div>

                                  <div className="col-span-1 text-center">
                                    <span className="inline-flex items-center justify-center font-bold text-sm">
                                      <span className="w-6 text-right">{safeNumber(team1Score || 0)}</span>
                                      <span className="mx-1">-</span>
                                      <span className="w-6 text-left">{safeNumber(team2Score || 0)}</span>
                                    </span>
                                  </div>

                                  <div className="col-span-3 flex items-center justify-end">
                                    <span
                                      className={`text-sm truncate text-right ${team2Win ? "font-bold" : ""} ${!isTeam1Home ? "text-blue-600" : ""}`}
                                    >
                                      {comparisonTeam}
                                      {!isTeam1Home && <span className="text-xs ml-1">(H)</span>}
                                    </span>
                                    <div className="h-8 w-8 ml-2 flex-shrink-0">
                                      <img
                                        src={getTeamLogoPath(comparisonTeam) || "/placeholder.svg"}
                                        alt={comparisonTeam}
                                        width={32}
                                        height={32}
                                        className="h-8 w-8 object-contain"
                                        onError={handleImageError}
                                      />
                                    </div>
                                  </div>
                                </div>

                                <div className="text-xs text-gray-500 mt-1 text-center">
                                  {team1Win
                                    ? `${selectedTeam} won by ${matchWithResult.margin}`
                                    : team2Win
                                      ? `${comparisonTeam} won by ${matchWithResult.margin}`
                                      : "Match drawn"}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-6 text-gray-500">
                          <p>No head-to-head matches found between these teams.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
