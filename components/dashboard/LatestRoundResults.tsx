"use client"

import type React from "react"
import { useMemo } from "react"
import type { MatchResult } from "@/lib/matchData"
import { getTeamLogoPath } from "@/lib/teamLogos"

interface LatestRoundResultsProps {
  matches: MatchResult[]
}

export default function LatestRoundResults({ matches }: LatestRoundResultsProps) {
  // Safely handle all data operations
  const safeMatches = useMemo(() => {
    if (!matches || !Array.isArray(matches)) return []

    return matches.filter((match) => {
      return (
        match &&
        typeof match === "object" &&
        match.homeTeam &&
        typeof match.homeTeam === "string" &&
        match.awayTeam &&
        typeof match.awayTeam === "string" &&
        match.date &&
        typeof match.date === "string" &&
        typeof match.season === "number" &&
        typeof match.round === "number"
      )
    })
  }, [matches])

  // Helper function to parse Australian date format (DD/MM/YYYY)
  const parseAustralianDate = (dateString: string): Date => {
    try {
      if (!dateString || typeof dateString !== "string") {
        return new Date(0)
      }
      const parts = dateString.split("/")
      if (parts.length !== 3) return new Date(0)

      const [day, month, year] = parts.map(Number)
      if (!day || !month || !year || isNaN(day) || isNaN(month) || isNaN(year)) {
        return new Date(0)
      }
      return new Date(year, month - 1, day)
    } catch (error) {
      console.error("Error parsing date:", dateString, error)
      return new Date(0)
    }
  }

  // Get the most recent round
  const latestRound = useMemo(() => {
    if (safeMatches.length === 0) return null

    try {
      // Get the most recent season
      const seasons = [...new Set(safeMatches.map((match) => match.season))].sort((a, b) => b - a)
      const currentSeason = seasons[0] || 2025

      // Filter matches for current season
      const currentSeasonMatches = safeMatches.filter((match) => match.season === currentSeason)
      if (currentSeasonMatches.length === 0) return null

      // Filter completed matches
      const completedMatches = currentSeasonMatches.filter(
        (match) => (match.homeScore && match.homeScore > 0) || (match.awayScore && match.awayScore > 0),
      )

      if (completedMatches.length === 0) {
        // Find next upcoming match
        const today = new Date()
        const upcomingMatches = currentSeasonMatches
          .filter((match) => {
            const matchDate = parseAustralianDate(match.date)
            return matchDate >= today
          })
          .sort((a, b) => {
            const dateA = parseAustralianDate(a.date)
            const dateB = parseAustralianDate(b.date)
            return dateA.getTime() - dateB.getTime()
          })

        return upcomingMatches.length > 0 ? upcomingMatches[0].round : null
      }

      // Sort completed matches by date
      const sortedMatches = [...completedMatches].sort((a, b) => {
        const dateA = parseAustralianDate(a.date)
        const dateB = parseAustralianDate(b.date)
        return dateB.getTime() - dateA.getTime()
      })

      return sortedMatches[0]?.round || null
    } catch (error) {
      console.error("Error calculating latest round:", error)
      return null
    }
  }, [safeMatches])

  // Filter matches for latest round
  const latestRoundMatches = useMemo(() => {
    if (!latestRound || safeMatches.length === 0) return []

    try {
      const seasons = [...new Set(safeMatches.map((match) => match.season))].sort((a, b) => b - a)
      const currentSeason = seasons[0] || 2025

      return safeMatches.filter((match) => match.season === currentSeason && match.round === latestRound)
    } catch (error) {
      console.error("Error filtering latest round matches:", error)
      return []
    }
  }, [safeMatches, latestRound])

  // Handle missing team logo gracefully
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.onerror = null
    e.currentTarget.src = "/images/teams/placeholder.png"
  }

  if (!latestRound || latestRoundMatches.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-4">
        <h2 className="text-sm font-bold mb-2">Latest Round Results</h2>
        <p className="text-xs text-gray-500">No recent match results available.</p>
      </div>
    )
  }

  return (
    <div className="bg-white shadow rounded-lg p-4">
      <h2 className="text-sm font-bold mb-1">Latest Round Results</h2>
      <p className="text-xs text-gray-500 mb-2">
        Round {latestRound} - {latestRoundMatches[0]?.season || "Unknown"}
      </p>

      <div className="space-y-2">
        {latestRoundMatches.map((match, index) => {
          // Extra safety check for each match
          if (!match || !match.homeTeam || !match.awayTeam) return null

          const homeTeam = String(match.homeTeam || "Unknown")
          const awayTeam = String(match.awayTeam || "Unknown")
          const homeScore = Number(match.homeScore || 0)
          const awayScore = Number(match.awayScore || 0)
          const winner = match.winner ? String(match.winner) : null

          return (
            <div key={`${match.id || `match-${index}`}`} className="flex items-center p-2 bg-gray-50 rounded-lg">
              <div className="flex items-center flex-1">
                <img
                  src={getTeamLogoPath(homeTeam) || "/placeholder.svg"}
                  alt={homeTeam}
                  className="h-6 w-6 object-contain"
                  onError={handleImageError}
                />
                <span className={`ml-1 text-xs ${winner === homeTeam ? "font-bold" : ""}`}>{homeTeam}</span>
              </div>

              <div className="flex items-center justify-center w-16 tabular-nums">
                <div className="grid grid-cols-3 gap-1 items-center justify-items-center">
                  <span className="text-xs font-medium text-center">{homeScore}</span>
                  <span className="text-xs text-gray-500 text-center">-</span>
                  <span className="text-xs font-medium text-center">{awayScore}</span>
                </div>
              </div>

              <div className="flex items-center justify-end flex-1">
                <span className={`mr-1 text-xs ${winner === awayTeam ? "font-bold" : ""}`}>{awayTeam}</span>
                <img
                  src={getTeamLogoPath(awayTeam) || "/placeholder.svg"}
                  alt={awayTeam}
                  className="h-6 w-6 object-contain"
                  onError={handleImageError}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
