"use client"

import { useState, useEffect } from "react"
import { Suspense } from "react"
import { collection, onSnapshot, query, orderBy, limit, where } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Player } from "@/lib/teamData"

// Import components directly to avoid dynamic import issues
import Navbar from "@/components/layout/Navbar"
import TeamTabs from "@/components/team-builder/TeamTabs"
import TeamOval from "@/components/team/TeamOval"
import RecentNews from "@/components/dashboard/RecentNews"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock } from "lucide-react"

// Interface for live match data
interface LiveMatch {
  id: string
  homeTeam: string
  awayTeam: string
  homeGoals: number
  homeBehinds: number
  awayGoals: number
  awayBehinds: number
  round: number
  status: "scheduled" | "live" | "finished"
  timing: {
    currentQuarter: number
    quarterTime: number
    quarterStatus: "not-started" | "active" | "paused" | "finished"
  }
}

function DashboardContent() {
  const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([])
  const [captain, setCaptain] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [liveMatches, setLiveMatches] = useState<LiveMatch[]>([])

  useEffect(() => {
    try {
      // Load saved team data
      const savedTeam = localStorage.getItem("fantasyTeam")
      if (savedTeam) {
        const teamData = JSON.parse(savedTeam)
        if (teamData?.players) {
          setSelectedPlayers(teamData.players)
        }
        if (teamData?.captain) {
          setCaptain(teamData.captain)
        }
      }
    } catch (error) {
      console.warn("Error loading team data:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch live matches
  useEffect(() => {
    const q = query(
      collection(db, "liveMatches"),
      where("status", "in", ["live", "scheduled"]),
      orderBy("round", "desc"),
      limit(3),
    )

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const matchesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as LiveMatch[]
        setLiveMatches(matchesData)
      },
      (error) => {
        console.error("Firebase error:", error)
      },
    )

    return () => unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const totalSalary = selectedPlayers.reduce((sum, player) => sum + (player.price || 0), 0)
  const averagePrice = selectedPlayers.length > 0 ? totalSalary / selectedPlayers.length : 0

  const positionCounts = {
    DEF: selectedPlayers.filter((p) => p.position === "DEF").length,
    MID: selectedPlayers.filter((p) => p.position === "MID").length,
    RUC: selectedPlayers.filter((p) => p.position === "RUC").length,
    FWD: selectedPlayers.filter((p) => p.position === "FWD").length,
  }

  // Helper function to calculate points
  const calculatePoints = (goals: number, behinds: number) => {
    return goals * 6 + behinds
  }

  // Helper function to format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  // Helper function to get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "live":
        return "bg-red-500 animate-pulse"
      case "finished":
        return "bg-gray-500"
      default:
        return "bg-blue-500"
    }
  }

  // Helper function to get status text
  const getStatusText = (status: string) => {
    switch (status) {
      case "live":
        return "LIVE"
      case "finished":
        return "FINAL"
      default:
        return "SCHEDULED"
    }
  }

  return (
    <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Team Summary */}
      <div className="lg:col-span-1">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Team Summary</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Team Value</h3>
              <p className="text-2xl font-bold">${totalSalary.toLocaleString()}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Average Player Price</h3>
              <p className="text-xl font-semibold">${Math.round(averagePrice).toLocaleString()}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Position Breakdown</h3>
              <div className="grid grid-cols-4 gap-2 mt-2">
                <div className="bg-blue-50 p-2 rounded text-center">
                  <p className="text-xs text-gray-500">DEF</p>
                  <p className="text-lg font-bold text-blue-700">{positionCounts.DEF}/6</p>
                </div>
                <div className="bg-yellow-50 p-2 rounded text-center">
                  <p className="text-xs text-gray-500">MID</p>
                  <p className="text-lg font-bold text-yellow-700">{positionCounts.MID}/5</p>
                </div>
                <div className="bg-purple-50 p-2 rounded text-center">
                  <p className="text-xs text-gray-500">RUC</p>
                  <p className="text-lg font-bold text-purple-700">{positionCounts.RUC}/1</p>
                </div>
                <div className="bg-red-50 p-2 rounded text-center">
                  <p className="text-xs text-gray-500">FWD</p>
                  <p className="text-lg font-bold text-red-700">{positionCounts.FWD}/6</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Latest News Card */}
        <div className="mt-6">
          <RecentNews />
        </div>

        {/* Live Scores Card */}
        <div className="mt-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Live Scores</CardTitle>
            </CardHeader>
            <CardContent>
              {liveMatches.length === 0 ? (
                <div className="text-center py-4 text-gray-500">No live matches at the moment</div>
              ) : (
                <div className="space-y-4">
                  {liveMatches.map((match) => {
                    const homePoints = calculatePoints(match.homeGoals || 0, match.homeBehinds || 0)
                    const awayPoints = calculatePoints(match.awayGoals || 0, match.awayBehinds || 0)

                    return (
                      <div key={match.id} className="border rounded-md p-3">
                        <div className="flex justify-between items-center mb-2">
                          <div className="text-sm font-medium">Round {match.round}</div>
                          <Badge className={getStatusColor(match.status)}>{getStatusText(match.status)}</Badge>
                        </div>

                        <div className="grid grid-cols-3 gap-2 items-center">
                          {/* Home Team */}
                          <div className="text-center">
                            <div className="text-sm font-medium mb-1">{match.homeTeam}</div>
                            <div className="text-lg font-bold text-blue-600">{homePoints}</div>
                            <div className="text-xs text-gray-600">
                              {match.homeGoals || 0}.{match.homeBehinds || 0}
                            </div>
                          </div>

                          {/* VS */}
                          <div className="text-center">
                            <div className="text-xs text-gray-400">VS</div>
                            {match.status === "live" && match.timing && (
                              <div className="mt-1 flex items-center justify-center text-xs text-green-600">
                                <Clock className="h-3 w-3 mr-1" />
                                <span>
                                  Q{match.timing.currentQuarter} {formatTime(match.timing.quarterTime)}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Away Team */}
                          <div className="text-center">
                            <div className="text-sm font-medium mb-1">{match.awayTeam}</div>
                            <div className="text-lg font-bold text-red-600">{awayPoints}</div>
                            <div className="text-xs text-gray-600">
                              {match.awayGoals || 0}.{match.awayBehinds || 0}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  <div className="text-center mt-2">
                    <a href="/live-scores" className="text-xs text-blue-600 hover:underline">
                      View all matches
                    </a>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Team Visualization */}
      <div className="lg:col-span-2">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Team Visualization</h2>
          {selectedPlayers.length > 0 ? (
            <div className="pointer-events-none">
              <TeamOval
                selectedPlayers={selectedPlayers}
                captain={captain}
                onSetCaptain={() => {}} // No-op function
                onRemovePlayer={() => {}} // No-op function
              />
              <p className="text-center text-sm text-gray-500 mt-4">Visit Team Builder to make changes to your team</p>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <p>No players selected yet.</p>
              <p className="text-sm mt-2">Go to Team Builder to add players to your team.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>
        <TeamTabs activeTab="dashboard" />
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          }
        >
          <DashboardContent />
        </Suspense>
      </div>
    </div>
  )
}
