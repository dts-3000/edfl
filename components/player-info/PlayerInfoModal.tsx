"use client"

import type React from "react"

import { useRef, useEffect, useState } from "react"
import type { Player } from "@/lib/teamData"
import { getTeamLogoPath } from "@/lib/teamLogos"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface PlayerInfoModalProps {
  player: Player
  onClose: () => void
  onRemove?: (playerId: string) => void
  onMakeCaptain?: (playerId: string) => void
  isInTeam?: boolean
}

interface PlayerPerformanceData {
  totalPoints: number
  averageScore: number
  gamesPlayed: number
  lastThreeAvg: number
  lastThreeGames: number[]
}

export default function PlayerInfoModal({
  player,
  onClose,
  onRemove,
  onMakeCaptain,
  isInTeam = false,
}: PlayerInfoModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const [performanceData, setPerformanceData] = useState<PlayerPerformanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Close modal when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [onClose])

  // Close modal when pressing Escape
  useEffect(() => {
    function handleEscapeKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose()
      }
    }

    document.addEventListener("keydown", handleEscapeKey)
    return () => {
      document.removeEventListener("keydown", handleEscapeKey)
    }
  }, [onClose])

  // Load player performance data using registry ID first
  useEffect(() => {
    async function loadPlayerPerformanceData() {
      if (!player) {
        setLoading(false)
        return
      }

      try {
        const statsRef = collection(db, "playerStats")
        let snapshot

        // Priority 1: Use registryId if available
        if (player.registryId) {
          console.log(`Loading stats for ${player.name} using registry ID: ${player.registryId}`)
          const q = query(
            statsRef,
            where("playerId", "==", player.registryId),
            where("quarter", "in", ["Total", "All", "total", "all"]),
          )
          snapshot = await getDocs(q)
        }

        // Priority 2: Use Firebase ID if no registry ID
        else if (player.id) {
          console.log(`Loading stats for ${player.name} using Firebase ID: ${player.id}`)
          let q = query(
            statsRef,
            where("playerId", "==", player.id),
            where("quarter", "in", ["Total", "All", "total", "all"]),
          )
          snapshot = await getDocs(q)

          // If no results and it's a numeric ID, try as number
          if (snapshot.empty && !isNaN(Number(player.id))) {
            q = query(
              statsRef,
              where("playerId", "==", Number(player.id)),
              where("quarter", "in", ["Total", "All", "total", "all"]),
            )
            snapshot = await getDocs(q)
          }
        }

        // Priority 3: Fallback to name/team search
        if (!snapshot || snapshot.empty) {
          console.log(`Fallback: Loading stats for ${player.name} using name/team search`)
          const nameQuery = query(
            statsRef,
            where("playerName", "==", player.name),
            where("team", "==", player.team),
            where("quarter", "in", ["Total", "All", "total", "all"]),
          )
          snapshot = await getDocs(nameQuery)
        }

        if (!snapshot || snapshot.empty) {
          console.log(`No stats found for ${player.name}`)
          setPerformanceData(null)
          setLoading(false)
          return
        }

        console.log(`Found ${snapshot.docs.length} stat records for ${player.name}`)

        // Process the data (rest of the function remains the same)
        const games: { fantasyPoints: number; matchId: string; round: number }[] = []
        snapshot.docs.forEach((doc: any) => {
          const data = doc.data()
          if (typeof data.fantasyPoints === "number") {
            games.push({
              fantasyPoints: data.fantasyPoints,
              matchId: data.matchId || "",
              round: data.round || 0,
            })
          }
        })

        // Sort games by round (descending)
        games.sort((a, b) => b.round - a.round)

        // Calculate stats
        const totalPoints = games.reduce((sum, game) => sum + game.fantasyPoints, 0)
        const gamesPlayed = games.length
        const averageScore = gamesPlayed > 0 ? Math.round((totalPoints / gamesPlayed) * 10) / 10 : 0

        // Calculate last three games average
        const lastThree = games.slice(0, 3)
        const lastThreeTotal = lastThree.reduce((sum, game) => sum + game.fantasyPoints, 0)
        const lastThreeAvg = lastThree.length > 0 ? Math.round((lastThreeTotal / lastThree.length) * 10) / 10 : 0
        const lastThreeGames = lastThree.map((game) => game.fantasyPoints)

        setPerformanceData({
          totalPoints,
          averageScore,
          gamesPlayed,
          lastThreeAvg,
          lastThreeGames,
        })
      } catch (error) {
        console.error("Error loading player performance data:", error)
        setError("Failed to load performance data")
      } finally {
        setLoading(false)
      }
    }

    setLoading(true)
    setError(null)
    loadPlayerPerformanceData()
  }, [player])

  // Handle missing team logo gracefully
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.onerror = null
    e.currentTarget.src = "/images/teams/placeholder.png"
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div ref={modalRef} className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
          aria-label="Close"
        >
          ×
        </button>

        <div className="p-4">
          <div className="flex items-center mb-4">
            <div className="h-12 w-12 mr-3">
              <img
                src={getTeamLogoPath(player.team) || "/placeholder.svg"}
                alt={player.team}
                width={48}
                height={48}
                className="h-12 w-12 object-contain"
                onError={handleImageError}
              />
            </div>
            <h2 className="text-xl font-bold">{player.name}</h2>
          </div>

          <div className="space-y-2 mb-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="text-gray-600">Team:</div>
              <div className="font-medium">{player.team}</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="text-gray-600">Position:</div>
              <div className="font-medium">{player.position}</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="text-gray-600">Price:</div>
              <div className="font-medium">${player.price.toLocaleString()}</div>
            </div>

            {loading ? (
              <div className="text-center py-2 text-gray-500">Loading performance data...</div>
            ) : error ? (
              <div className="text-center py-2 text-red-500">{error}</div>
            ) : performanceData ? (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-gray-600">Total Points:</div>
                  <div className="font-medium">{performanceData.totalPoints}</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-gray-600">Average Score:</div>
                  <div className="font-medium">{performanceData.averageScore}</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-gray-600">Games Played:</div>
                  <div className="font-medium">{performanceData.gamesPlayed}</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-gray-600">Last 3 Avg:</div>
                  <div className="font-medium">{performanceData.lastThreeAvg}</div>
                </div>
                {performanceData.lastThreeGames.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-gray-600">Last 3 Games:</div>
                    <div className="font-medium">
                      {performanceData.lastThreeGames.map((score, i) => (
                        <span key={i} className="mr-2">
                          {score}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <div className="text-gray-600">Performance:</div>
                <div className="font-medium text-gray-500">No game data available</div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div className="text-gray-600">Status:</div>
              <div className="font-medium">{player.status || "Active"}</div>
            </div>
          </div>

          {isInTeam && (
            <div className="flex space-x-2">
              {onRemove && (
                <button
                  onClick={() => onRemove(player.id)}
                  className="flex-1 py-2 px-4 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Remove
                </button>
              )}
              {onMakeCaptain && (
                <button
                  onClick={() => onMakeCaptain(player.id)}
                  className="flex-1 py-2 px-4 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                >
                  Make Captain
                </button>
              )}
            </div>
          )}

          {!isInTeam && (
            <div className="text-sm text-gray-500 mt-2">
              This player is not in your team. You can add them from the Available Players list.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
