"use client"

import { useState, useEffect, useRef } from "react"
import { collection, onSnapshot, query, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RefreshCw, Clock, Volume2, VolumeX, Target, Info } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useMediaQuery } from "@/hooks/use-media-query"

// Add console.log to debug
console.log("Live scores page loading...")

interface QuarterScore {
  goals: number
  behinds: number
  points: number
}

interface Commentary {
  id: string
  text: string
  timestamp: Date | any // Allow for Firestore timestamp
  type: "injury" | "substitution" | "incident" | "milestone" | "weather" | "general"
  isPreGame?: boolean
}

interface Player {
  name: string
  number: number
}

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
  goalscorers: {
    home: string[]
    away: string[]
  }
  stats: {
    home: {
      clearance: number
      inside50: number
      spoil: number
      smother: number
      shepard: number
      tackles: number
      onePercenters: number
    }
    away: {
      clearance: number
      inside50: number
      spoil: number
      smother: number
      shepard: number
      tackles: number
      onePercenters: number
    }
  }
  quarterScores?: {
    home: QuarterScore[]
    away: QuarterScore[]
  }
  timing: {
    currentQuarter: number
    quarterTime: number
    quarterStatus:
      | "not-started"
      | "active"
      | "paused"
      | "quarter-break"
      | "half-time"
      | "three-quarter-break"
      | "finished"
  }
  createdAt: any
  updatedAt: any
  venue?: string
  weather?: string
  commentary?: Commentary[]
  lineup?: {
    home: Player[]
    away: Player[]
  }
}

export default function LiveScores() {
  const [matches, setMatches] = useState<LiveMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(false)
  const [previousMatches, setPreviousMatches] = useState<LiveMatch[]>([])
  const isMobile = useMediaQuery("(max-width: 640px)")

  // Audio refs for different sounds
  const goalSoundRef = useRef<HTMLAudioElement | null>(null)
  const statusChangeSoundRef = useRef<HTMLAudioElement | null>(null)

  console.log("Matches state:", matches)

  // Initialize audio elements
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Try to create audio elements, but handle failures gracefully
      try {
        goalSoundRef.current = new Audio("/sounds/goal.mp3")
        goalSoundRef.current.volume = 0.5
        goalSoundRef.current.addEventListener("error", () => {
          console.log("Goal sound file not found, will use Web Audio API fallback")
          goalSoundRef.current = null
        })
      } catch (error) {
        console.log("Could not create goal audio element:", error)
      }

      try {
        statusChangeSoundRef.current = new Audio("/sounds/AFL_Siren.mp3")
        statusChangeSoundRef.current.volume = 0.3
        statusChangeSoundRef.current.addEventListener("error", () => {
          console.log("Siren sound file not found, will use Web Audio API fallback")
          statusChangeSoundRef.current = null
        })
      } catch (error) {
        console.log("Could not create status audio element:", error)
      }
    }
  }, [])

  // Play sound function with improved fallbacks
  const playSound = (type: "goal" | "status") => {
    if (!soundEnabled) return

    try {
      if (type === "goal") {
        if (goalSoundRef.current) {
          goalSoundRef.current.currentTime = 0
          goalSoundRef.current.play().catch(() => {
            // Fallback to Web Audio API
            createBeepSound(800, 0.3, 0.2) // Higher pitch for goals
          })
        } else {
          // Use Web Audio API fallback
          createBeepSound(800, 0.3, 0.2)
        }
      } else if (type === "status") {
        if (statusChangeSoundRef.current) {
          statusChangeSoundRef.current.currentTime = 0
          statusChangeSoundRef.current.play().catch(() => {
            // Fallback to Web Audio API
            createBeepSound(400, 0.2, 0.1) // Lower pitch for status changes
          })
        } else {
          // Use Web Audio API fallback
          createBeepSound(400, 0.2, 0.1)
        }
      }
    } catch (error) {
      console.log("Audio playback error:", error)
    }
  }

  // Helper function to create beep sounds using Web Audio API
  const createBeepSound = (frequency: number, volume: number, duration: number) => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.value = frequency
      oscillator.type = "sine"
      gainNode.gain.value = volume

      oscillator.start()
      oscillator.stop(audioContext.currentTime + duration)
    } catch (error) {
      console.log("Web Audio API not supported:", error)
    }
  }

  // Check for changes and play sounds
  useEffect(() => {
    if (previousMatches.length === 0) {
      setPreviousMatches(matches)
      return
    }

    matches.forEach((currentMatch) => {
      const previousMatch = previousMatches.find((m) => m.id === currentMatch.id)
      if (!previousMatch) return

      // Check for goal changes
      const currentHomeGoals = currentMatch.homeGoals || 0
      const currentAwayGoals = currentMatch.awayGoals || 0
      const previousHomeGoals = previousMatch.homeGoals || 0
      const previousAwayGoals = previousMatch.homeGoals || 0

      if (currentHomeGoals > previousHomeGoals || currentAwayGoals > previousAwayGoals) {
        playSound("goal")
      }

      // Check for status changes
      if (currentMatch.status !== previousMatch.status) {
        playSound("status")
      }

      // Check for quarter status changes
      if (currentMatch.timing?.quarterStatus !== previousMatch.timing?.quarterStatus) {
        playSound("status")
      }
    })

    setPreviousMatches(matches)
  }, [matches, previousMatches, soundEnabled])

  useEffect(() => {
    console.log("Setting up Firebase listener...")
    const q = query(collection(db, "liveMatches"), orderBy("round", "desc"))
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        console.log("Firebase snapshot received:", snapshot.docs.length, "documents")
        const matchesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as LiveMatch[]
        console.log("Processed matches data:", matchesData)
        setMatches(matchesData)
        setLoading(false)
        setLastUpdate(new Date())
      },
      (error) => {
        console.error("Firebase error:", error)
        setLoading(false)
      },
    )

    return () => unsubscribe()
  }, [])

  // Rest of the helper functions remain the same...
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

  const getQuarterStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "LIVE"
      case "paused":
        return "PAUSED"
      case "quarter-break":
        return "QTR TIME"
      case "half-time":
        return "HALF TIME"
      case "three-quarter-break":
        return "3QTR TIME"
      case "finished":
        return "FINISHED"
      default:
        return "SCHEDULED"
    }
  }

  const getQuarterStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500 animate-pulse"
      case "paused":
        return "bg-yellow-500"
      case "quarter-break":
      case "three-quarter-break":
        return "bg-blue-500"
      case "half-time":
        return "bg-orange-500"
      case "finished":
        return "bg-gray-500"
      default:
        return "bg-blue-500"
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const calculatePoints = (goals: number, behinds: number) => {
    return goals * 6 + behinds
  }

  const calculateAccuracy = (goals: number, behinds: number) => {
    const total = goals + behinds
    if (total === 0) return 0
    return Math.round((goals / total) * 100)
  }

  const getLeadingGoalscorer = (goalscorers: string[]) => {
    if (!goalscorers || goalscorers.length === 0) return null

    const counts = goalscorers.reduce(
      (acc, scorer) => {
        acc[scorer] = (acc[scorer] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const leader = Object.entries(counts).reduce((a, b) => (a[1] > b[1] ? a : b))
    return { name: leader[0], goals: leader[1] }
  }

  const getMargin = (homePoints: number, awayPoints: number) => {
    const margin = homePoints - awayPoints
    if (margin === 0) return "Tied"
    return `${Math.abs(margin)} pts`
  }

  const getWinningTeam = (homePoints: number, awayPoints: number, homeTeam: string, awayTeam: string) => {
    if (homePoints > awayPoints) return homeTeam
    if (awayPoints > homePoints) return awayTeam
    return "Tied"
  }

  const getCommentaryTypeColor = (type: Commentary["type"]) => {
    switch (type) {
      case "injury":
        return "bg-red-100 text-red-800"
      case "substitution":
        return "bg-blue-100 text-blue-800"
      case "incident":
        return "bg-yellow-100 text-yellow-800"
      case "milestone":
        return "bg-green-100 text-green-800"
      case "weather":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-purple-100 text-purple-800"
    }
  }

  const getCommentaryTypeIcon = (type: Commentary["type"]) => {
    switch (type) {
      case "injury":
        return "🚑"
      case "substitution":
        return "🔄"
      case "incident":
        return "⚠️"
      case "milestone":
        return "🎯"
      case "weather":
        return "🌧️"
      default:
        return "📝"
    }
  }

  const toggleSound = () => {
    setSoundEnabled(!soundEnabled)

    // Play a test sound when enabling
    if (!soundEnabled) {
      createBeepSound(600, 0.1, 0.1)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
            <div className="text-lg">Loading live scores...</div>
          </div>
        </div>
      </div>
    )
  }

  console.log("Rendering with matches:", matches.length)

  return (
    <TooltipProvider>
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <div className="space-y-4 sm:space-y-6">
          {/* Header with Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h1 className="text-2xl sm:text-3xl font-bold">Live Scores</h1>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 w-full sm:w-auto">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant={autoRefresh ? "default" : "outline"}
                  onClick={() => setAutoRefresh(!autoRefresh)}
                >
                  <RefreshCw className={`h-4 w-4 mr-1 ${autoRefresh ? "animate-spin" : ""}`} />
                  {!isMobile && "Auto Refresh"}
                </Button>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="sm" variant={soundEnabled ? "default" : "outline"} onClick={toggleSound}>
                      {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{soundEnabled ? "Mute" : "Enable"} sound notifications for goals and game events</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="text-xs sm:text-sm text-gray-500">
                Updated: {lastUpdate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          </div>

          {/* Debug info */}
          <div className="bg-yellow-50 p-2 rounded text-xs sm:text-sm">
            Debug: Found {matches.length} matches. Loading: {loading.toString()}. Sound: {soundEnabled ? "ON" : "OFF"}
          </div>

          {matches.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-gray-500">No matches scheduled at this time.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:gap-6">
              {matches.map((match) => {
                const homePoints = calculatePoints(match.homeGoals || 0, match.homeBehinds || 0)
                const awayPoints = calculatePoints(match.awayGoals || 0, match.awayBehinds || 0)
                const homeAccuracy = calculateAccuracy(match.homeGoals || 0, match.homeBehinds || 0)
                const awayAccuracy = calculateAccuracy(match.awayGoals || 0, match.awayBehinds || 0)
                const homeLeader = getLeadingGoalscorer(match.goalscorers?.home || [])
                const awayLeader = getLeadingGoalscorer(match.goalscorers?.away || [])

                return (
                  <Card key={match.id} className="overflow-hidden">
                    <CardHeader className="pb-2 sm:pb-4">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <CardTitle className="text-lg sm:text-xl">Round {match.round}</CardTitle>
                          {match.venue && <span className="text-xs sm:text-sm text-gray-500">@ {match.venue}</span>}
                        </div>
                        <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                          <Badge className={getStatusColor(match.status)}>{getStatusText(match.status)}</Badge>
                          {match.timing && (
                            <>
                              <Badge className="bg-blue-500 text-white">
                                <Clock className="h-3 w-3 mr-1" />Q{match.timing.currentQuarter}{" "}
                                {formatTime(match.timing.quarterTime)}
                              </Badge>
                              {match.timing.quarterStatus && match.timing.quarterStatus !== "not-started" && (
                                <Badge className={getQuarterStatusColor(match.timing.quarterStatus)}>
                                  {getQuarterStatusText(match.timing.quarterStatus)}
                                </Badge>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4 sm:space-y-6 p-3 sm:p-6">
                      {/* Main Score Display */}
                      <div className="grid grid-cols-3 gap-2 sm:gap-4 items-center">
                        {/* Home Team */}
                        <div className="text-center">
                          <div className="font-bold text-base sm:text-xl mb-1 sm:mb-2 truncate">{match.homeTeam}</div>
                          <div className="text-2xl sm:text-4xl font-bold text-blue-600 mb-0 sm:mb-1">{homePoints}</div>
                          <div className="text-sm sm:text-lg font-semibold text-gray-600">
                            {match.homeGoals || 0}.{match.homeBehinds || 0}
                          </div>
                          <div className="text-xs sm:text-sm text-gray-500">{homeAccuracy}% accuracy</div>
                        </div>

                        {/* VS & Match Info */}
                        <div className="text-center space-y-1 sm:space-y-2">
                          <div className="text-gray-400 font-medium text-base sm:text-lg">VS</div>
                          {match.timing && match.timing.quarterStatus === "active" && (
                            <div className="text-xs sm:text-sm text-green-600 font-medium">
                              Quarter {match.timing.currentQuarter} Active
                            </div>
                          )}
                          {match.timing && match.timing.quarterStatus === "quarter-break" && (
                            <div className="text-xs sm:text-sm text-blue-600 font-medium">Quarter Time Break</div>
                          )}
                          {match.timing && match.timing.quarterStatus === "half-time" && (
                            <div className="text-xs sm:text-sm text-orange-600 font-medium">Half Time Break</div>
                          )}
                          {match.timing && match.timing.quarterStatus === "three-quarter-break" && (
                            <div className="text-xs sm:text-sm text-purple-600 font-medium">
                              Three Quarter Time Break
                            </div>
                          )}
                          {match.timing && match.timing.quarterStatus === "paused" && (
                            <div className="text-xs sm:text-sm text-yellow-600 font-medium">Game Paused</div>
                          )}
                        </div>

                        {/* Away Team */}
                        <div className="text-center">
                          <div className="font-bold text-base sm:text-xl mb-1 sm:mb-2 truncate">{match.awayTeam}</div>
                          <div className="text-2xl sm:text-4xl font-bold text-red-600 mb-0 sm:mb-1">{awayPoints}</div>
                          <div className="text-sm sm:text-lg font-semibold text-gray-600">
                            {match.awayGoals || 0}.{match.awayBehinds || 0}
                          </div>
                          <div className="text-xs sm:text-sm text-gray-500">{awayAccuracy}% accuracy</div>
                        </div>
                      </div>

                      {/* Enhanced Goalscorers - Moved back to 2nd position */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        {/* Home Goalscorers */}
                        <div>
                          <div className="text-xs sm:text-sm font-medium text-blue-600 mb-1 sm:mb-2 flex items-center justify-between">
                            <span>{match.homeTeam} Goalscorers</span>
                            {homeLeader && (
                              <span className="text-xs bg-blue-100 px-1 sm:px-2 py-0.5 sm:py-1 rounded">
                                {homeLeader.name} ({homeLeader.goals})
                              </span>
                            )}
                          </div>
                          <div className="space-y-1 max-h-24 sm:max-h-32 overflow-y-auto">
                            {match.goalscorers?.home && match.goalscorers.home.length > 0 ? (
                              match.goalscorers.home.map((scorer, idx) => (
                                <div
                                  key={idx}
                                  className="text-xs sm:text-sm py-1 px-2 bg-blue-50 rounded flex items-center gap-1 sm:gap-2"
                                >
                                  <Target className="h-3 w-3" />
                                  <span className="truncate">{scorer}</span>
                                </div>
                              ))
                            ) : (
                              <div className="text-xs sm:text-sm text-gray-400 italic">No goals yet</div>
                            )}
                          </div>
                        </div>

                        {/* Away Goalscorers */}
                        <div>
                          <div className="text-xs sm:text-sm font-medium text-red-600 mb-1 sm:mb-2 flex items-center justify-between">
                            <span>{match.awayTeam} Goalscorers</span>
                            {awayLeader && (
                              <span className="text-xs bg-red-100 px-1 sm:px-2 py-0.5 sm:py-1 rounded">
                                {awayLeader.name} ({awayLeader.goals})
                              </span>
                            )}
                          </div>
                          <div className="space-y-1 max-h-24 sm:max-h-32 overflow-y-auto">
                            {match.goalscorers?.away && match.goalscorers.away.length > 0 ? (
                              match.goalscorers.away.map((scorer, idx) => (
                                <div
                                  key={idx}
                                  className="text-xs sm:text-sm py-1 px-2 bg-red-50 rounded flex items-center gap-1 sm:gap-2"
                                >
                                  <Target className="h-3 w-3" />
                                  <span className="truncate">{scorer}</span>
                                </div>
                              ))
                            ) : (
                              <div className="text-xs sm:text-sm text-gray-400 italic">No goals yet</div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Match Statistics */}
                      <div className="border-t pt-3 sm:pt-4">
                        <h4 className="font-semibold mb-2 sm:mb-3 text-sm sm:text-base">Match Statistics</h4>

                        {/* Stats: Clearance, Inside 50, Tackles, and 1%'ers */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6 mb-3 sm:mb-4">
                          {/* Clearance */}
                          <div>
                            <div className="flex justify-between text-xs sm:text-sm mb-1">
                              <span className="font-medium flex items-center">
                                Clearances
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="ml-1 inline-flex">
                                      <Info className="h-3 w-3 text-gray-500" />
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="max-w-xs">
                                      When a player clears the ball from a stoppage or congested area
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </span>
                              <span>
                                {match.stats?.home?.clearance || 0} - {match.stats?.away?.clearance || 0}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3 relative">
                              <div
                                className="bg-blue-500 h-2 sm:h-3 rounded-l-full absolute left-0"
                                style={{
                                  width: `${((match.stats?.home?.clearance || 0) / Math.max((match.stats?.home?.clearance || 0) + (match.stats?.away?.clearance || 0), 1)) * 50}%`,
                                }}
                              ></div>
                              <div
                                className="bg-red-500 h-2 sm:h-3 rounded-r-full absolute right-0"
                                style={{
                                  width: `${((match.stats?.away?.clearance || 0) / Math.max((match.stats?.home?.clearance || 0) + (match.stats?.away?.clearance || 0), 1)) * 50}%`,
                                }}
                              ></div>
                            </div>
                          </div>

                          {/* Inside 50 */}
                          <div>
                            <div className="flex justify-between text-xs sm:text-sm mb-1">
                              <span className="font-medium flex items-center">
                                Inside 50s
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="ml-1 inline-flex">
                                      <Info className="h-3 w-3 text-gray-500" />
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="max-w-xs">
                                      When a team moves the ball inside their attacking 50-meter arc
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </span>
                              <span>
                                {match.stats?.home?.inside50 || 0} - {match.stats?.away?.inside50 || 0}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3 relative">
                              <div
                                className="bg-blue-500 h-2 sm:h-3 rounded-l-full absolute left-0"
                                style={{
                                  width: `${((match.stats?.home?.inside50 || 0) / Math.max((match.stats?.home?.inside50 || 0) + (match.stats?.away?.inside50 || 0), 1)) * 50}%`,
                                }}
                              ></div>
                              <div
                                className="bg-red-500 h-2 sm:h-3 rounded-r-full absolute right-0"
                                style={{
                                  width: `${((match.stats?.away?.inside50 || 0) / Math.max((match.stats?.home?.inside50 || 0) + (match.stats?.away?.inside50 || 0), 1)) * 50}%`,
                                }}
                              ></div>
                            </div>
                          </div>

                          {/* Tackles */}
                          <div>
                            <div className="flex justify-between text-xs sm:text-sm mb-1">
                              <span className="font-medium flex items-center">
                                Tackles
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="ml-1 inline-flex">
                                      <Info className="h-3 w-3 text-gray-500" />
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="max-w-xs">
                                      When a player physically impedes an opponent who has possession of the ball
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </span>
                              <span>
                                {match.stats?.home?.tackles || 0} - {match.stats?.away?.tackles || 0}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3 relative">
                              <div
                                className="bg-blue-500 h-2 sm:h-3 rounded-l-full absolute left-0"
                                style={{
                                  width: `${((match.stats?.home?.tackles || 0) / Math.max((match.stats?.home?.tackles || 0) + (match.stats?.away?.tackles || 0), 1)) * 50}%`,
                                }}
                              ></div>
                              <div
                                className="bg-red-500 h-2 sm:h-3 rounded-r-full absolute right-0"
                                style={{
                                  width: `${((match.stats?.away?.tackles || 0) / Math.max((match.stats?.home?.tackles || 0) + (match.stats?.away?.tackles || 0), 1)) * 50}%`,
                                }}
                              ></div>
                            </div>
                          </div>

                          {/* 1%'ers */}
                          <div>
                            <div className="flex justify-between text-xs sm:text-sm mb-1">
                              <span className="font-medium flex items-center">
                                1%'ers
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="ml-1 inline-flex">
                                      <Info className="h-3 w-3 text-gray-500" />
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="max-w-xs">
                                      One percenters are small defensive acts that can make a big difference - spoils,
                                      smothers, shepherds, etc.
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </span>
                              <span>
                                {match.stats?.home?.onePercenters || 0} - {match.stats?.away?.onePercenters || 0}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3 relative">
                              <div
                                className="bg-blue-500 h-2 sm:h-3 rounded-l-full absolute left-0"
                                style={{
                                  width: `${((match.stats?.home?.onePercenters || 0) / Math.max((match.stats?.home?.onePercenters || 0) + (match.stats?.away?.onePercenters || 0), 1)) * 50}%`,
                                }}
                              ></div>
                              <div
                                className="bg-red-500 h-2 sm:h-3 rounded-r-full absolute right-0"
                                style={{
                                  width: `${((match.stats?.away?.onePercenters || 0) / Math.max((match.stats?.home?.onePercenters || 0) + (match.stats?.away?.onePercenters || 0), 1)) * 50}%`,
                                }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Match Commentary */}
                      {match.commentary && match.commentary.length > 0 && (
                        <div className="border-t pt-3 sm:pt-4">
                          <h4 className="font-semibold mb-2 sm:mb-3 text-sm sm:text-base">Match Commentary</h4>
                          <div className="space-y-2 max-h-36 sm:max-h-48 overflow-y-auto">
                            {match.commentary.slice(0, isMobile ? 3 : 5).map((comment) => (
                              <div key={comment.id} className="bg-gray-50 p-2 sm:p-3 rounded">
                                <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-1">
                                  <span
                                    className={`text-xs px-1 sm:px-2 py-0.5 sm:py-1 rounded ${getCommentaryTypeColor(comment.type)}`}
                                  >
                                    {getCommentaryTypeIcon(comment.type)}{" "}
                                    {isMobile ? comment.type.substring(0, 3).toUpperCase() : comment.type.toUpperCase()}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {comment.isPreGame
                                      ? "PRE-GAME"
                                      : comment.timestamp?.toDate
                                        ? comment.timestamp
                                            .toDate()
                                            .toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                                        : new Date(comment.timestamp).toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          })}
                                  </span>
                                </div>
                                <p className="text-xs sm:text-sm">{comment.text}</p>
                              </div>
                            ))}
                            {match.commentary.length > (isMobile ? 3 : 5) && (
                              <div className="text-center text-xs text-gray-500 py-1 sm:py-2">
                                ... and {match.commentary.length - (isMobile ? 3 : 5)} more entries
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Team Lineups - Moved to last position and showing ALL players */}
                      {(match.lineup?.home?.length > 0 || match.lineup?.away?.length > 0) && (
                        <div className="border-t pt-3 sm:pt-4">
                          <h4 className="font-semibold mb-2 sm:mb-3 text-sm sm:text-base">Team Lineups</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            {/* Home Team Lineup - Show ALL players */}
                            <div>
                              <div className="text-xs sm:text-sm font-medium text-blue-600 mb-1 sm:mb-2">
                                {match.homeTeam} Lineup
                              </div>
                              {match.lineup?.home && match.lineup.home.length > 0 ? (
                                <div className="space-y-1 max-h-64 overflow-y-auto">
                                  {match.lineup.home.map((player) => (
                                    <div
                                      key={player.number}
                                      className="text-xs sm:text-sm py-1 px-2 bg-blue-50 rounded flex items-center gap-1 sm:gap-2"
                                    >
                                      <span className="font-mono text-xs bg-blue-200 px-1 rounded">
                                        {player.number}
                                      </span>
                                      <span className="truncate">{player.name}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-xs sm:text-sm text-gray-400 italic">Lineup not available</div>
                              )}
                            </div>

                            {/* Away Team Lineup - Show ALL players */}
                            <div>
                              <div className="text-xs sm:text-sm font-medium text-red-600 mb-1 sm:mb-2">
                                {match.awayTeam} Lineup
                              </div>
                              {match.lineup?.away && match.lineup.away.length > 0 ? (
                                <div className="space-y-1 max-h-64 overflow-y-auto">
                                  {match.lineup.away.map((player) => (
                                    <div
                                      key={player.number}
                                      className="text-xs sm:text-sm py-1 px-2 bg-red-50 rounded flex items-center gap-1 sm:gap-2"
                                    >
                                      <span className="font-mono text-xs bg-red-200 px-1 rounded">{player.number}</span>
                                      <span className="truncate">{player.name}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-xs sm:text-sm text-gray-400 italic">Lineup not available</div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}
