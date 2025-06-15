"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { initializeApp } from "firebase/app"
import { getFirestore, collection, getDocs } from "firebase/firestore"
import { getTeamLogoPath } from "@/lib/teamLogos"
import AdminLayout from "@/components/admin/AdminLayout"

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
}

interface TeamGameCount {
  team: string
  totalGames: number
  homeGames: number
  awayGames: number
  bySeasonCount: Record<number, { total: number; home: number; away: number }>
}

interface DuplicateMatch {
  matches: MatchResult[]
  key: string
}

export default function MatchAuditPage() {
  const [matches, setMatches] = useState<MatchResult[]>([])
  const [teams, setTeams] = useState<string[]>([])
  const [seasons, setSeasons] = useState<number[]>([])
  const [teamGameCounts, setTeamGameCounts] = useState<TeamGameCount[]>([])
  const [duplicateMatches, setDuplicateMatches] = useState<DuplicateMatch[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [selectedSeason, setSelectedSeason] = useState<number | "All">("All")

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
          })
        })

        setMatches(matchData)

        // Extract unique team names
        const uniqueTeams = Array.from(
          new Set([...matchData.map((match) => match.homeTeam), ...matchData.map((match) => match.awayTeam)]),
        ).sort()

        // Extract unique seasons
        const uniqueSeasons = Array.from(new Set(matchData.map((match) => match.season))).sort((a, b) => b - a)

        setTeams(uniqueTeams)
        setSeasons(uniqueSeasons)

        // Analyze the data
        analyzeMatchData(matchData, uniqueTeams, uniqueSeasons)
      } catch (error) {
        console.error("Error loading match data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadMatchData()
  }, [])

  // Analyze match data for inconsistencies
  const analyzeMatchData = (matchData: MatchResult[], teamsList: string[], seasonsList: number[]) => {
    // Count games per team
    const teamCounts: Record<string, TeamGameCount> = {}

    // Initialize team counts
    teamsList.forEach((team) => {
      teamCounts[team] = {
        team,
        totalGames: 0,
        homeGames: 0,
        awayGames: 0,
        bySeasonCount: {},
      }

      // Initialize season counts for each team
      seasonsList.forEach((season) => {
        teamCounts[team].bySeasonCount[season] = {
          total: 0,
          home: 0,
          away: 0,
        }
      })
    })

    // Count games
    matchData.forEach((match) => {
      const { homeTeam, awayTeam, season } = match

      // Home team
      if (teamCounts[homeTeam]) {
        teamCounts[homeTeam].totalGames++
        teamCounts[homeTeam].homeGames++

        if (teamCounts[homeTeam].bySeasonCount[season]) {
          teamCounts[homeTeam].bySeasonCount[season].total++
          teamCounts[homeTeam].bySeasonCount[season].home++
        }
      }

      // Away team
      if (teamCounts[awayTeam]) {
        teamCounts[awayTeam].totalGames++
        teamCounts[awayTeam].awayGames++

        if (teamCounts[awayTeam].bySeasonCount[season]) {
          teamCounts[awayTeam].bySeasonCount[season].total++
          teamCounts[awayTeam].bySeasonCount[season].away++
        }
      }
    })

    // Convert to array and sort by total games
    const teamGameCountsArray = Object.values(teamCounts).sort((a, b) => b.totalGames - a.totalGames)
    setTeamGameCounts(teamGameCountsArray)

    // Find duplicate matches
    const matchMap: Record<string, MatchResult[]> = {}

    matchData.forEach((match) => {
      // Create a key that identifies a unique match (same teams, same round, same season)
      const teams = [match.homeTeam, match.awayTeam].sort().join("-")
      const key = `${teams}-R${match.round}-S${match.season}`

      if (!matchMap[key]) {
        matchMap[key] = []
      }

      matchMap[key].push(match)
    })

    // Filter to only keep duplicates
    const duplicates = Object.entries(matchMap)
      .filter(([_, matches]) => matches.length > 1)
      .map(([key, matches]) => ({ key, matches }))

    setDuplicateMatches(duplicates)
  }

  // Filter data by selected season
  const filteredTeamGameCounts =
    selectedSeason === "All"
      ? teamGameCounts
      : teamGameCounts
          .map((team) => ({
            ...team,
            totalGames: team.bySeasonCount[selectedSeason as number]?.total || 0,
            homeGames: team.bySeasonCount[selectedSeason as number]?.home || 0,
            awayGames: team.bySeasonCount[selectedSeason as number]?.away || 0,
          }))
          .sort((a, b) => b.totalGames - a.totalGames)

  const filteredDuplicateMatches =
    selectedSeason === "All"
      ? duplicateMatches
      : duplicateMatches.filter((dup) => dup.matches.some((match) => match.season === selectedSeason))

  // Handle missing team logo gracefully
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.onerror = null
    e.currentTarget.src = "/images/teams/placeholder.png"
  }

  // Calculate expected games per team per season
  const calculateExpectedGames = (teamCount: number): number => {
    // In a standard league format, each team plays against every other team twice (home and away)
    return (teamCount - 1) * 2
  }

  // Get teams active in a specific season
  const getActiveTeamsInSeason = (season: number): string[] => {
    const activeTeams = new Set<string>()

    matches.forEach((match) => {
      if (match.season === season) {
        activeTeams.add(match.homeTeam)
        activeTeams.add(match.awayTeam)
      }
    })

    return Array.from(activeTeams).sort()
  }

  // Get expected games for selected season
  const getExpectedGamesForSeason = (season: number | "All"): number => {
    if (season === "All") return 0

    const activeTeams = getActiveTeamsInSeason(season)
    return calculateExpectedGames(activeTeams.length)
  }

  const expectedGames = getExpectedGamesForSeason(selectedSeason)

  return (
    <AdminLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Match Database Audit</h1>

        <div className="mb-6">
          <label htmlFor="season-select" className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Season
          </label>
          <select
            id="season-select"
            className="mt-1 block w-64 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
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

        {loading ? (
          <div className="text-center py-12">
            <div className="spinner"></div>
            <p className="mt-4 text-gray-500">Analyzing match data...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">Team Game Counts</h2>

              {selectedSeason !== "All" && expectedGames > 0 && (
                <div className="mb-4 p-3 bg-blue-50 rounded-md">
                  <p className="text-sm text-blue-800">
                    <span className="font-semibold">Expected games per team:</span> {expectedGames}
                    <span className="text-xs ml-2">
                      (based on {getActiveTeamsInSeason(selectedSeason as number).length} active teams)
                    </span>
                  </p>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Team
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Total Games
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Home
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Away
                      </th>
                      {selectedSeason !== "All" && (
                        <th
                          scope="col"
                          className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Status
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredTeamGameCounts.map((teamCount) => (
                      <tr key={teamCount.team} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-8 w-8 mr-3 flex-shrink-0">
                              <img
                                src={getTeamLogoPath(teamCount.team) || "/placeholder.svg"}
                                alt={teamCount.team}
                                width={32}
                                height={32}
                                className="h-8 w-8 object-contain"
                                onError={handleImageError}
                              />
                            </div>
                            <div className="text-sm font-medium text-gray-900">{teamCount.team}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="text-sm text-gray-900 font-medium">{teamCount.totalGames}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="text-sm text-gray-900">{teamCount.homeGames}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="text-sm text-gray-900">{teamCount.awayGames}</div>
                        </td>
                        {selectedSeason !== "All" && expectedGames > 0 && (
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            {teamCount.totalGames === expectedGames ? (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                Correct
                              </span>
                            ) : teamCount.totalGames > expectedGames ? (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                {teamCount.totalGames - expectedGames} extra
                              </span>
                            ) : (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                {expectedGames - teamCount.totalGames} missing
                              </span>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Home/Away Balance Check */}
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-3">Home/Away Balance Issues</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <ul className="space-y-2">
                    {filteredTeamGameCounts
                      .filter((team) => Math.abs(team.homeGames - team.awayGames) > 1)
                      .map((team) => (
                        <li key={team.team} className="text-sm">
                          <span className="font-medium">{team.team}:</span> {team.homeGames} home, {team.awayGames} away
                          <span className="ml-2 text-orange-600 font-medium">
                            ({team.homeGames > team.awayGames ? "+" : ""}
                            {team.homeGames - team.awayGames} home game balance)
                          </span>
                        </li>
                      ))}
                    {filteredTeamGameCounts.filter((team) => Math.abs(team.homeGames - team.awayGames) > 1).length ===
                      0 && <li className="text-sm text-gray-500">No significant home/away imbalances found</li>}
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">Potential Duplicate Matches</h2>

              {filteredDuplicateMatches.length > 0 ? (
                <div className="space-y-4">
                  {filteredDuplicateMatches.map((dup, index) => (
                    <div key={index} className="bg-red-50 p-4 rounded-lg">
                      <h3 className="text-md font-medium text-red-800 mb-2">Duplicate: {dup.key}</h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-red-100">
                            <tr>
                              <th
                                scope="col"
                                className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider"
                              >
                                ID
                              </th>
                              <th
                                scope="col"
                                className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider"
                              >
                                Season
                              </th>
                              <th
                                scope="col"
                                className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider"
                              >
                                Round
                              </th>
                              <th
                                scope="col"
                                className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider"
                              >
                                Date
                              </th>
                              <th
                                scope="col"
                                className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider"
                              >
                                Home Team
                              </th>
                              <th
                                scope="col"
                                className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider"
                              >
                                Away Team
                              </th>
                              <th
                                scope="col"
                                className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider"
                              >
                                Score
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {dup.matches.map((match) => (
                              <tr key={match.id} className="hover:bg-red-50">
                                <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-500">
                                  {match.id.substring(0, 8)}...
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap text-xs">{match.season}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-xs">{match.round}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-xs">{match.date}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-xs">{match.homeTeam}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-xs">{match.awayTeam}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-xs">
                                  {match.homeScore !== undefined && match.awayScore !== undefined
                                    ? `${match.homeScore} - ${match.awayScore}`
                                    : "No score"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-green-800">No duplicate matches found!</p>
                </div>
              )}

              {/* Missing Games Analysis */}
              {selectedSeason !== "All" && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-3">Missing Games Analysis</h3>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    {(() => {
                      const activeTeams = getActiveTeamsInSeason(selectedSeason as number)
                      const teamsWithMissingGames = filteredTeamGameCounts.filter(
                        (team) => team.totalGames < expectedGames,
                      )

                      if (teamsWithMissingGames.length === 0) {
                        return <p className="text-green-600">All teams have the expected number of games.</p>
                      }

                      return (
                        <div>
                          <p className="mb-2 text-sm">
                            <span className="font-medium">Teams with missing games:</span>
                          </p>
                          <ul className="list-disc pl-5 space-y-1">
                            {teamsWithMissingGames.map((team) => (
                              <li key={team.team} className="text-sm">
                                <span className="font-medium">{team.team}:</span> {expectedGames - team.totalGames}{" "}
                                games missing
                              </li>
                            ))}
                          </ul>
                        </div>
                      )
                    })()}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
