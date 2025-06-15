"use client"

import AdminLayout from "@/components/admin/AdminLayout"
import { useEffect, useState } from "react"
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  arrayUnion,
  arrayRemove,
  deleteDoc,
  addDoc,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Clock,
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Plus,
  Minus,
  Trash2,
  AlertTriangle,
  Coffee,
  Clock3,
  ChevronDown,
  ChevronUp,
  Upload,
  X,
} from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { PlayerRegistry } from "@/lib/playerRegistry"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Team Data
const TEAMS = [
  "Aberfeldie",
  "Airport West",
  "Avondale Heights",
  "Deer Park",
  "East Keilor",
  "Essendon Doutta Stars",
  "Glenroy",
  "Greenvale",
  "Keilor",
  "Maribyrnong Park",
  "Pascoe Vale",
  "Strathmore",
]

interface QuarterScore {
  goals: number
  behinds: number
  points: number
}

interface Commentary {
  id: string
  text: string
  timestamp: Date | any
  type: "injury" | "substitution" | "incident" | "milestone" | "weather" | "general"
  isPreGame?: boolean
}

interface Player {
  number: number
  name: string
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
  venue?: string
  weather?: string
  commentary?: Commentary[]
  lineup?: {
    home: Player[]
    away: Player[]
  }
}

// Timer Hook with auto-sync
function useTimer(initialTime = 0, matchId?: string) {
  const [time, setTime] = useState(initialTime)
  const [isRunning, setIsRunning] = useState(false)

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null

    if (isRunning) {
      intervalId = setInterval(() => {
        setTime((prevTime) => {
          const newTime = prevTime + 1
          if (matchId) {
            syncToFirebase(matchId, newTime)
          }
          return newTime
        })
      }, 1000)
    }

    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [isRunning, matchId])

  const syncToFirebase = async (matchId: string, time: number) => {
    try {
      const matchRef = doc(db, "liveMatches", matchId)
      await updateDoc(matchRef, {
        "timing.quarterTime": time,
        updatedAt: new Date(),
      })
    } catch (err) {
      console.error("Error syncing timer:", err)
    }
  }

  const start = () => setIsRunning(true)
  const pause = () => setIsRunning(false)
  const reset = () => {
    setTime(0)
    setIsRunning(false)
  }
  const advance = (seconds: number) => setTime((prev) => prev + seconds)

  return { time, isRunning, start, pause, reset, advance, setTime }
}

export default function LiveScoresAdmin() {
  const [matches, setMatches] = useState<LiveMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newGoalscorer, setNewGoalscorer] = useState<{ [key: string]: { home: string; away: string } }>({})
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [matchToDelete, setMatchToDelete] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newMatch, setNewMatch] = useState({
    homeTeam: "",
    awayTeam: "",
    round: 1,
    venue: "",
  })
  const [players, setPlayers] = useState<PlayerRegistry[]>([])
  const [playersByTeam, setPlayersByTeam] = useState<{ [team: string]: PlayerRegistry[] }>({})
  const [lineupInput, setLineupInput] = useState<{ [key: string]: { home: string; away: string } }>({})
  const [lineupCollapsed, setLineupCollapsed] = useState<{ [key: string]: { home: boolean; away: boolean } }>({})

  const [activeMatchId, setActiveMatchId] = useState<string | null>(null)
  const timer = useTimer(0, activeMatchId || undefined)

  const [newCommentary, setNewCommentary] = useState<{ [key: string]: { text: string; type: Commentary["type"] } }>({})

  // Sync timer with active match when matches change
  useEffect(() => {
    if (activeMatchId && matches.length > 0) {
      const activeMatch = matches.find((m) => m.id === activeMatchId)
      if (activeMatch && timer.time !== (activeMatch.timing?.quarterTime || 0)) {
        timer.setTime(activeMatch.timing?.quarterTime || 0)
      }
    }
  }, [matches, activeMatchId])

  // Fetch players from registry
  useEffect(() => {
    try {
      console.log("Fetching players from registry...")
      const playersRef = collection(db, "playerRegistry")
      const q = query(playersRef, orderBy("playerName", "asc"))

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const playersData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as PlayerRegistry[]

          console.log(`Loaded ${playersData.length} players from registry`)
          setPlayers(playersData)

          const byTeam: { [team: string]: PlayerRegistry[] } = {}
          playersData.forEach((player) => {
            if (player.currentTeam) {
              if (!byTeam[player.currentTeam]) {
                byTeam[player.currentTeam] = []
              }
              byTeam[player.currentTeam].push(player)
            }
          })

          setPlayersByTeam(byTeam)
          console.log("Players grouped by team:", Object.keys(byTeam))
        },
        (err) => {
          console.error("Error fetching players:", err)
          setError(`Error loading players: ${err.message}`)
        },
      )

      return () => unsubscribe()
    } catch (err: any) {
      console.error("Error setting up player registry listener:", err)
      setError(`Failed to load players: ${err.message}`)
    }
  }, [])

  // Fetch matches
  useEffect(() => {
    try {
      console.log("Setting up Firebase listener for liveMatches...")
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
        },
        (err) => {
          console.error("Firebase error:", err)
          setError(`Error loading matches: ${err.message}`)
          setLoading(false)
        },
      )

      return () => unsubscribe()
    } catch (err: any) {
      console.error("Setup error:", err)
      setError(`Failed to set up data connection: ${err.message}`)
      setLoading(false)
    }
  }, [])

  const updateMatch = async (matchId: string, updates: Partial<LiveMatch>) => {
    try {
      const matchRef = doc(db, "liveMatches", matchId)
      await updateDoc(matchRef, {
        ...updates,
        updatedAt: new Date(),
      })
    } catch (err: any) {
      console.error("Error updating match:", err)
      setError(`Failed to update match: ${err.message}`)
    }
  }

  const handleScoreChange = async (
    matchId: string,
    team: "home" | "away",
    type: "goals" | "behinds",
    increment: boolean,
  ) => {
    const match = matches.find((m) => m.id === matchId)
    if (!match) return

    const currentValue =
      team === "home"
        ? type === "goals"
          ? match.homeGoals || 0
          : match.homeBehinds || 0
        : type === "goals"
          ? match.awayGoals || 0
          : match.awayBehinds || 0

    const newValue = Math.max(0, currentValue + (increment ? 1 : -1))

    const updates: any = {}
    if (team === "home") {
      updates[type === "goals" ? "homeGoals" : "homeBehinds"] = newValue
    } else {
      updates[type === "goals" ? "awayGoals" : "awayBehinds"] = newValue
    }
    await updateMatch(matchId, updates)
  }

  const handleStatusChange = async (matchId: string, status: "scheduled" | "live" | "finished") => {
    await updateMatch(matchId, { status })
  }

  const handleQuarterChange = async (matchId: string, quarter: number) => {
    const match = matches.find((m) => m.id === matchId)
    if (match) {
      if (activeMatchId === matchId) {
        timer.reset()
      }
      const newTiming = {
        ...match.timing,
        currentQuarter: quarter,
        quarterTime: 0,
      }
      await updateMatch(matchId, { timing: newTiming })
    }
  }

  const handleStatsChange = async (
    matchId: string,
    team: "home" | "away",
    statType: "clearance" | "inside50" | "tackles" | "onePercenters",
    increment: boolean,
  ) => {
    const match = matches.find((m) => m.id === matchId)
    if (!match) return

    const currentValue = match.stats?.[team]?.[statType] || 0
    const newValue = Math.max(0, currentValue + (increment ? 1 : -1))

    const updates: any = {
      [`stats.${team}.${statType}`]: newValue,
    }
    await updateMatch(matchId, updates)
  }

  const addGoalscorer = async (matchId: string, team: "home" | "away", player: string) => {
    if (!player.trim()) return

    const matchRef = doc(db, "liveMatches", matchId)
    await updateDoc(matchRef, {
      [`goalscorers.${team}`]: arrayUnion(player.trim()),
      updatedAt: new Date(),
    })

    setNewGoalscorer((prev) => ({
      ...prev,
      [matchId]: { ...prev[matchId], [team]: "" },
    }))
  }

  const removeGoalscorer = async (matchId: string, team: "home" | "away", player: string) => {
    const matchRef = doc(db, "liveMatches", matchId)
    await updateDoc(matchRef, {
      [`goalscorers.${team}`]: arrayRemove(player),
      updatedAt: new Date(),
    })
  }

  const openDeleteDialog = (matchId: string) => {
    setMatchToDelete(matchId)
    setDeleteDialogOpen(true)
  }

  const deleteMatch = async () => {
    if (!matchToDelete) return

    try {
      await deleteDoc(doc(db, "liveMatches", matchToDelete))
      console.log(`Match ${matchToDelete} deleted successfully`)
    } catch (err: any) {
      console.error("Error deleting match:", err)
      setError(`Failed to delete match: ${err.message}`)
    } finally {
      setDeleteDialogOpen(false)
      setMatchToDelete(null)
    }
  }

  const createMatch = async () => {
    if (!newMatch.homeTeam || !newMatch.awayTeam) {
      setError("Please select both teams")
      return
    }

    if (newMatch.homeTeam === newMatch.awayTeam) {
      setError("Home and away teams must be different")
      return
    }

    try {
      await addDoc(collection(db, "liveMatches"), {
        homeTeam: newMatch.homeTeam,
        awayTeam: newMatch.awayTeam,
        round: newMatch.round,
        venue: newMatch.venue.trim() || "TBD",
        homeGoals: 0,
        homeBehinds: 0,
        awayGoals: 0,
        awayBehinds: 0,
        status: "scheduled",
        goalscorers: {
          home: [],
          away: [],
        },
        stats: {
          home: { clearance: 0, inside50: 0, spoil: 0, smother: 0, shepard: 0, tackles: 0, onePercenters: 0 },
          away: { clearance: 0, inside50: 0, spoil: 0, smother: 0, shepard: 0, tackles: 0, onePercenters: 0 },
        },
        timing: {
          currentQuarter: 1,
          quarterTime: 0,
          quarterStatus: "not-started",
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      setNewMatch({
        homeTeam: "",
        awayTeam: "",
        round: 1,
        venue: "",
      })
      setShowAddForm(false)
      console.log("Match created successfully")
    } catch (err: any) {
      console.error("Error creating match:", err)
      setError(`Failed to create match: ${err.message}`)
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

  const getAvailableTeams = (excludeTeam?: string) => {
    return TEAMS.filter((team) => team !== excludeTeam)
  }

  const getPlayersForTeam = (teamName: string) => {
    const teamVariations: { [key: string]: string[] } = {
      "Maribyrnong Park": ["Marby", "Maribyrnong", "Maribyrnong Park"],
      "Essendon Doutta Stars": ["EDS", "Essendon Doutta Stars", "Essendon Doutta Star"],
      "Airport West": ["Airport West", "Airport West FC"],
      "Avondale Heights": ["Avondale Heights", "Avondale Heights FC"],
      "Deer Park": ["Deer Park", "Deer Park FC"],
      "East Keilor": ["East Keilor", "East Keilor FC"],
      Glenroy: ["Glenroy", "Glenroy FC"],
      Greenvale: ["Greenvale", "Greenvale FC"],
      Keilor: ["Keilor", "Keilor FC"],
      "Pascoe Vale": ["Pascoe Vale", "Pascoe Vale FC"],
      Strathmore: ["Strathmore", "Strathmore FC"],
      Aberfeldie: ["Aberfeldie", "Aberfeldie FC"],
    }

    const variations = teamVariations[teamName] || [teamName]

    let teamPlayers: PlayerRegistry[] = []
    variations.forEach((variation) => {
      const playersForVariation = Object.keys(playersByTeam).find(
        (key) => key.toLowerCase() === variation.toLowerCase(),
      )
      if (playersForVariation) {
        teamPlayers = [...teamPlayers, ...playersByTeam[playersForVariation]]
      }
    })

    return teamPlayers
  }

  const syncTimerToFirebase = async (matchId: string, time: number) => {
    try {
      const matchRef = doc(db, "liveMatches", matchId)
      await updateDoc(matchRef, {
        "timing.quarterTime": time,
        updatedAt: new Date(),
      })
    } catch (err) {
      console.error("Error syncing timer:", err)
    }
  }

  const handleQuarterStatusChange = async (
    matchId: string,
    status: "active" | "quarter-break" | "half-time" | "three-quarter-break" | "paused",
  ) => {
    const match = matches.find((m) => m.id === matchId)
    if (match) {
      const newTiming = {
        ...match.timing,
        quarterStatus: status,
      }
      await updateMatch(matchId, { timing: newTiming })

      // Play siren for quarter breaks
      if (
        status === "quarter-break" ||
        status === "half-time" ||
        status === "three-quarter-break" ||
        status === "finished"
      ) {
        try {
          const siren = new Audio("/sounds/AFL_Siren.mp3")
          siren.volume = 0.5
          siren.play().catch((err) => console.error("Error playing siren:", err))
        } catch (error) {
          console.error("Could not play siren:", error)
        }
      }
    }
  }

  const addCommentary = async (matchId: string, text: string, type: Commentary["type"]) => {
    if (!text.trim()) return

    const match = matches.find((m) => m.id === matchId)
    const isPreGame = match?.status === "scheduled"

    const newEntry: Commentary = {
      id: Date.now().toString(),
      text: text.trim(),
      timestamp: new Date(),
      type,
      isPreGame,
    }

    if (match) {
      const updatedCommentary = [newEntry, ...(match.commentary || [])]
      await updateMatch(matchId, { commentary: updatedCommentary })
    }

    setNewCommentary((prev) => ({
      ...prev,
      [matchId]: { text: "", type: "general" },
    }))
  }

  const removeCommentary = async (matchId: string, commentaryId: string) => {
    const match = matches.find((m) => m.id === matchId)
    if (match && match.commentary) {
      const updatedCommentary = match.commentary.filter((c) => c.id !== commentaryId)
      await updateMatch(matchId, { commentary: updatedCommentary })
    }
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

  const parseLineup = (text: string): Player[] => {
    if (!text.trim()) return []

    return text
      .split("\n")
      .map((line) => {
        const match = line.trim().match(/^(\d+)[\s\t]+(.+)$/)
        if (match) {
          return {
            number: Number.parseInt(match[1], 10),
            name: match[2].trim(),
          }
        }
        return null
      })
      .filter((player): player is Player => player !== null)
      .sort((a, b) => a.number - b.number)
  }

  const updateLineup = async (matchId: string, team: "home" | "away") => {
    const match = matches.find((m) => m.id === matchId)
    if (!match) return

    const lineupText = lineupInput[match.id]?.[team]
    if (!lineupText) return

    const players = parseLineup(lineupText)

    const currentLineup = match.lineup || { home: [], away: [] }
    const updatedLineup = {
      ...currentLineup,
      [team]: players,
    }

    await updateMatch(matchId, { lineup: updatedLineup })

    setLineupInput((prev) => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        [team]: "",
      },
    }))
  }

  const removePlayerFromLineup = async (matchId: string, team: "home" | "away", playerNumber: number) => {
    const match = matches.find((m) => m.id === matchId)
    if (!match || !match.lineup) return

    const updatedPlayers = match.lineup[team].filter((p) => p.number !== playerNumber)

    const updatedLineup = {
      ...match.lineup,
      [team]: updatedPlayers,
    }

    await updateMatch(matchId, { lineup: updatedLineup })
  }

  const toggleLineupCollapse = (matchId: string, team: "home" | "away") => {
    setLineupCollapsed((prev) => ({
      ...prev,
      [matchId]: {
        ...(prev[matchId] || { home: true, away: true }),
        [team]: !(prev[matchId]?.[team] ?? true),
      },
    }))
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-semibold">Live Scores Management</h1>
          <Button onClick={() => setShowAddForm(!showAddForm)}>
            <Plus className="h-4 w-4 mr-1" />
            Add New Match
          </Button>
        </div>

        {showAddForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Add New Match</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="homeTeam">Home Team</Label>
                  <Select
                    value={newMatch.homeTeam}
                    onValueChange={(value) => setNewMatch((prev) => ({ ...prev, homeTeam: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select home team" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableTeams(newMatch.awayTeam).map((team) => (
                        <SelectItem key={team} value={team}>
                          {team}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="awayTeam">Away Team</Label>
                  <Select
                    value={newMatch.awayTeam}
                    onValueChange={(value) => setNewMatch((prev) => ({ ...prev, awayTeam: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select away team" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableTeams(newMatch.homeTeam).map((team) => (
                        <SelectItem key={team} value={team}>
                          {team}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="round">Round</Label>
                  <Input
                    id="round"
                    type="number"
                    min="1"
                    value={newMatch.round}
                    onChange={(e) => setNewMatch((prev) => ({ ...prev, round: Number.parseInt(e.target.value) || 1 }))}
                  />
                </div>
                <div>
                  <Label htmlFor="venue">Venue (Optional)</Label>
                  <Input
                    id="venue"
                    placeholder="Enter venue name"
                    value={newMatch.venue}
                    onChange={(e) => setNewMatch((prev) => ({ ...prev, venue: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button onClick={createMatch}>Create Match</Button>
                <Button variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
            <Button variant="outline" size="sm" className="ml-2" onClick={() => setError(null)}>
              Dismiss
            </Button>
          </div>
        )}

        {matches.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gray-500">No live matches found.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {matches.map((match) => {
              const homePoints = calculatePoints(match.homeGoals || 0, match.homeBehinds || 0)
              const awayPoints = calculatePoints(match.awayGoals || 0, match.awayBehinds || 0)
              const homePlayers = getPlayersForTeam(match.homeTeam)
              const awayPlayers = getPlayersForTeam(match.awayTeam)
              const isHomeLineupCollapsed = lineupCollapsed[match.id]?.home ?? true
              const isAwayLineupCollapsed = lineupCollapsed[match.id]?.away ?? true

              return (
                <Card key={match.id}>
                  <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                      <span>
                        {match.homeTeam} vs {match.awayTeam} - Round {match.round}
                      </span>
                      <div className="flex items-center gap-2">
                        <Badge variant={match.status === "live" ? "destructive" : "secondary"}>
                          {match.status.toUpperCase()}
                        </Badge>
                        <Badge variant="outline">
                          <Clock className="h-3 w-3 mr-1" />Q{match.timing?.currentQuarter || 1}{" "}
                          {activeMatchId === match.id
                            ? formatTime(timer.time)
                            : formatTime(match.timing?.quarterTime || 0)}
                          {match.timing?.quarterStatus && match.timing.quarterStatus !== "active" && (
                            <span className="ml-1 text-xs">
                              (
                              {match.timing.quarterStatus === "quarter-break"
                                ? "QT"
                                : match.timing.quarterStatus === "half-time"
                                  ? "HT"
                                  : match.timing.quarterStatus === "three-quarter-break"
                                    ? "3QT"
                                    : match.timing.quarterStatus.toUpperCase()}
                              )
                            </span>
                          )}
                        </Badge>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Timer Controls */}
                    <Card className="bg-gray-50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Match Timer</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center mb-4">
                          <div className="text-4xl font-mono font-bold">
                            {activeMatchId === match.id
                              ? formatTime(timer.time)
                              : formatTime(match.timing?.quarterTime || 0)}
                          </div>
                        </div>
                        <div className="flex justify-center gap-2 mb-4">
                          <Button
                            onClick={() => {
                              setActiveMatchId(match.id)
                              timer.start()
                            }}
                            disabled={activeMatchId === match.id && timer.isRunning}
                            variant={activeMatchId === match.id && timer.isRunning ? "secondary" : "default"}
                          >
                            <Play className="h-4 w-4 mr-1" />
                            Start
                          </Button>
                          <Button
                            onClick={() => timer.pause()}
                            disabled={activeMatchId !== match.id || !timer.isRunning}
                            variant="secondary"
                          >
                            <Pause className="h-4 w-4 mr-1" />
                            Pause
                          </Button>
                          <Button
                            onClick={() => {
                              timer.reset()
                              if (activeMatchId === match.id) {
                                syncTimerToFirebase(match.id, 0)
                              }
                            }}
                            variant="outline"
                          >
                            <RotateCcw className="h-4 w-4 mr-1" />
                            Reset
                          </Button>
                          <Button
                            onClick={() => timer.advance(60)}
                            disabled={activeMatchId !== match.id}
                            variant="outline"
                          >
                            <FastForward className="h-4 w-4 mr-1" />
                            +1 Min
                          </Button>
                        </div>
                        <div className="text-center text-sm text-gray-600">Timer auto-syncs to live scores</div>
                      </CardContent>
                    </Card>

                    {/* Match Controls */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium mb-2 block">Match Status</Label>
                        <div className="flex gap-2">
                          <Button
                            variant={match.status === "scheduled" ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleStatusChange(match.id, "scheduled")}
                          >
                            Scheduled
                          </Button>
                          <Button
                            variant={match.status === "live" ? "destructive" : "outline"}
                            size="sm"
                            onClick={() => handleStatusChange(match.id, "live")}
                          >
                            Live
                          </Button>
                          <Button
                            variant={match.status === "finished" ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleStatusChange(match.id, "finished")}
                          >
                            Finished
                          </Button>
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium mb-2 block">Current Quarter</Label>
                        <div className="flex items-center gap-1 mb-2">
                          <Button
                            variant={match.timing?.currentQuarter === 1 ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleQuarterChange(match.id, 1)}
                          >
                            Q1
                          </Button>
                          <Clock3 className="h-3 w-3 text-gray-400" title="Quarter Time" />
                          <Button
                            variant={match.timing?.currentQuarter === 2 ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleQuarterChange(match.id, 2)}
                          >
                            Q2
                          </Button>
                          <Coffee className="h-4 w-4 text-orange-500" title="Half Time" />
                          <Button
                            variant={match.timing?.currentQuarter === 3 ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleQuarterChange(match.id, 3)}
                          >
                            Q3
                          </Button>
                          <Clock3 className="h-3 w-3 text-gray-400" title="Three Quarter Time" />
                          <Button
                            variant={match.timing?.currentQuarter === 4 ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleQuarterChange(match.id, 4)}
                          >
                            Q4
                          </Button>
                        </div>

                        <Label className="text-sm font-medium mb-2 block">Quarter Status</Label>
                        <div className="grid grid-cols-3 gap-1">
                          <Button
                            variant={match.timing?.quarterStatus === "active" ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleQuarterStatusChange(match.id, "active")}
                            className="bg-green-600 hover:bg-green-700 text-white text-xs"
                          >
                            Active
                          </Button>
                          <Button
                            variant={match.timing?.quarterStatus === "paused" ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleQuarterStatusChange(match.id, "paused")}
                            className="bg-yellow-600 hover:bg-yellow-700 text-white text-xs"
                          >
                            Paused
                          </Button>
                          <Button
                            variant={match.timing?.quarterStatus === "quarter-break" ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleQuarterStatusChange(match.id, "quarter-break")}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
                          >
                            Qtr Break
                          </Button>
                          <Button
                            variant={match.timing?.quarterStatus === "half-time" ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleQuarterStatusChange(match.id, "half-time")}
                            className="bg-orange-600 hover:bg-orange-700 text-white text-xs"
                          >
                            Half Time
                          </Button>
                          <Button
                            variant={match.timing?.quarterStatus === "three-quarter-break" ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleQuarterStatusChange(match.id, "three-quarter-break")}
                            className="bg-purple-600 hover:bg-purple-700 text-white text-xs"
                          >
                            3Qtr Break
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Stats Controls */}
                    <div className="border-t pt-6">
                      <h4 className="font-semibold text-lg mb-4 text-center">Match Statistics</h4>
                      <TooltipProvider>
                        <div className="grid grid-cols-2 gap-6">
                          {/* Home Team Stats */}
                          <div className="space-y-4">
                            <h5 className="font-medium text-blue-600 text-center">{match.homeTeam} Stats</h5>

                            {/* Stats in 2x2 Grid */}
                            <div className="grid grid-cols-2 gap-3">
                              {/* Clearances */}
                              <div className="space-y-2">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Label className="text-sm font-medium text-center block cursor-help">
                                      Clearances: {match.stats?.home?.clearance || 0}
                                    </Label>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Successful disposals from a contest or defensive situation</p>
                                  </TooltipContent>
                                </Tooltip>
                                <div className="flex gap-1 justify-center">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleStatsChange(match.id, "home", "clearance", false)}
                                  >
                                    <Minus className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => handleStatsChange(match.id, "home", "clearance", true)}
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>

                              {/* Inside 50s */}
                              <div className="space-y-2">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Label className="text-sm font-medium text-center block cursor-help">
                                      Inside 50s: {match.stats?.home?.inside50 || 0}
                                    </Label>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Number of times the ball entered the forward 50-meter zone</p>
                                  </TooltipContent>
                                </Tooltip>
                                <div className="flex gap-1 justify-center">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleStatsChange(match.id, "home", "inside50", false)}
                                  >
                                    <Minus className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => handleStatsChange(match.id, "home", "inside50", true)}
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>

                              {/* Tackles */}
                              <div className="space-y-2">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Label className="text-sm font-medium text-center block cursor-help">
                                      Tackles: {match.stats?.home?.tackles || 0}
                                    </Label>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Physical contact made to stop an opponent with the ball</p>
                                  </TooltipContent>
                                </Tooltip>
                                <div className="flex gap-1 justify-center">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleStatsChange(match.id, "home", "tackles", false)}
                                  >
                                    <Minus className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => handleStatsChange(match.id, "home", "tackles", true)}
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>

                              {/* One Percenters */}
                              <div className="space-y-2">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Label className="text-sm font-medium text-center block cursor-help">
                                      1%'ers: {match.stats?.home?.onePercenters || 0}
                                    </Label>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Defensive acts like spoils, smothers, and shepherds</p>
                                  </TooltipContent>
                                </Tooltip>
                                <div className="flex gap-1 justify-center">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleStatsChange(match.id, "home", "onePercenters", false)}
                                  >
                                    <Minus className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => handleStatsChange(match.id, "home", "onePercenters", true)}
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Away Team Stats */}
                          <div className="space-y-4">
                            <h5 className="font-medium text-red-600 text-center">{match.awayTeam} Stats</h5>

                            {/* Stats in 2x2 Grid */}
                            <div className="grid grid-cols-2 gap-3">
                              {/* Clearances */}
                              <div className="space-y-2">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Label className="text-sm font-medium text-center block cursor-help">
                                      Clearances: {match.stats?.away?.clearance || 0}
                                    </Label>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Successful disposals from a contest or defensive situation</p>
                                  </TooltipContent>
                                </Tooltip>
                                <div className="flex gap-1 justify-center">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleStatsChange(match.id, "away", "clearance", false)}
                                  >
                                    <Minus className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => handleStatsChange(match.id, "away", "clearance", true)}
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>

                              {/* Inside 50s */}
                              <div className="space-y-2">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Label className="text-sm font-medium text-center block cursor-help">
                                      Inside 50s: {match.stats?.away?.inside50 || 0}
                                    </Label>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Number of times the ball entered the forward 50-meter zone</p>
                                  </TooltipContent>
                                </Tooltip>
                                <div className="flex gap-1 justify-center">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleStatsChange(match.id, "away", "inside50", false)}
                                  >
                                    <Minus className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => handleStatsChange(match.id, "away", "inside50", true)}
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>

                              {/* Tackles */}
                              <div className="space-y-2">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Label className="text-sm font-medium text-center block cursor-help">
                                      Tackles: {match.stats?.away?.tackles || 0}
                                    </Label>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Physical contact made to stop an opponent with the ball</p>
                                  </TooltipContent>
                                </Tooltip>
                                <div className="flex gap-1 justify-center">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleStatsChange(match.id, "away", "tackles", false)}
                                  >
                                    <Minus className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => handleStatsChange(match.id, "away", "tackles", true)}
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>

                              {/* One Percenters */}
                              <div className="space-y-2">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Label className="text-sm font-medium text-center block cursor-help">
                                      1%'ers: {match.stats?.away?.onePercenters || 0}
                                    </Label>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Defensive acts like spoils, smothers, and shepherds</p>
                                  </TooltipContent>
                                </Tooltip>
                                <div className="flex gap-1 justify-center">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleStatsChange(match.id, "away", "onePercenters", false)}
                                  >
                                    <Minus className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => handleStatsChange(match.id, "away", "onePercenters", true)}
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </TooltipProvider>
                    </div>

                    {/* Team Lineups */}
                    <div className="border-t pt-6">
                      <h4 className="font-semibold text-lg mb-4 text-center">Team Lineups</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Home Team Lineup */}
                        <div>
                          <Collapsible>
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="font-medium text-blue-600">{match.homeTeam} Lineup</h5>
                              <CollapsibleTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleLineupCollapse(match.id, "home")}
                                >
                                  {isHomeLineupCollapsed ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronUp className="h-4 w-4" />
                                  )}
                                </Button>
                              </CollapsibleTrigger>
                            </div>

                            <CollapsibleContent>
                              {match.lineup?.home && match.lineup.home.length > 0 ? (
                                <div className="border rounded-md overflow-hidden">
                                  <table className="w-full text-sm">
                                    <thead className="bg-gray-50">
                                      <tr>
                                        <th className="px-4 py-2 text-left w-16">#</th>
                                        <th className="px-4 py-2 text-left">Player</th>
                                        <th className="px-4 py-2 w-16"></th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {match.lineup.home.map((player) => (
                                        <tr key={player.number} className="border-t">
                                          <td className="px-4 py-2">{player.number}</td>
                                          <td className="px-4 py-2">{player.name}</td>
                                          <td className="px-4 py-2">
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => removePlayerFromLineup(match.id, "home", player.number)}
                                            >
                                              <X className="h-4 w-4 text-red-500" />
                                            </Button>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <div className="text-sm text-gray-500 italic mb-4">No lineup set</div>
                              )}

                              <div className="mt-4">
                                <Label htmlFor={`home-lineup-${match.id}`} className="text-sm font-medium mb-1 block">
                                  Add/Update Lineup
                                </Label>
                                <div className="text-xs text-gray-500 mb-2">
                                  Enter one player per line in format: "5 Lachlan Riley"
                                </div>
                                <Textarea
                                  id={`home-lineup-${match.id}`}
                                  placeholder="Enter lineup (number and name)"
                                  rows={5}
                                  value={lineupInput[match.id]?.home || ""}
                                  onChange={(e) =>
                                    setLineupInput((prev) => ({
                                      ...prev,
                                      [match.id]: { ...prev[match.id], home: e.target.value },
                                    }))
                                  }
                                  className="font-mono text-sm"
                                />
                                <div className="flex justify-end mt-2">
                                  <Button
                                    size="sm"
                                    onClick={() => updateLineup(match.id, "home")}
                                    disabled={!lineupInput[match.id]?.home}
                                  >
                                    <Upload className="h-4 w-4 mr-1" />
                                    Update Lineup
                                  </Button>
                                </div>
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        </div>

                        {/* Away Team Lineup */}
                        <div>
                          <Collapsible>
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="font-medium text-red-600">{match.awayTeam} Lineup</h5>
                              <CollapsibleTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleLineupCollapse(match.id, "away")}
                                >
                                  {isAwayLineupCollapsed ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronUp className="h-4 w-4" />
                                  )}
                                </Button>
                              </CollapsibleTrigger>
                            </div>

                            <CollapsibleContent>
                              {match.lineup?.away && match.lineup.away.length > 0 ? (
                                <div className="border rounded-md overflow-hidden">
                                  <table className="w-full text-sm">
                                    <thead className="bg-gray-50">
                                      <tr>
                                        <th className="px-4 py-2 text-left w-16">#</th>
                                        <th className="px-4 py-2 text-left">Player</th>
                                        <th className="px-4 py-2 w-16"></th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {match.lineup.away.map((player) => (
                                        <tr key={player.number} className="border-t">
                                          <td className="px-4 py-2">{player.number}</td>
                                          <td className="px-4 py-2">{player.name}</td>
                                          <td className="px-4 py-2">
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => removePlayerFromLineup(match.id, "away", player.number)}
                                            >
                                              <X className="h-4 w-4 text-red-500" />
                                            </Button>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <div className="text-sm text-gray-500 italic mb-4">No lineup set</div>
                              )}

                              <div className="mt-4">
                                <Label htmlFor={`away-lineup-${match.id}`} className="text-sm font-medium mb-1 block">
                                  Add/Update Lineup
                                </Label>
                                <div className="text-xs text-gray-500 mb-2">
                                  Enter one player per line in format: "5 Lachlan Riley"
                                </div>
                                <Textarea
                                  id={`away-lineup-${match.id}`}
                                  placeholder="Enter lineup (number and name)"
                                  rows={5}
                                  value={lineupInput[match.id]?.away || ""}
                                  onChange={(e) =>
                                    setLineupInput((prev) => ({
                                      ...prev,
                                      [match.id]: { ...prev[match.id], away: e.target.value },
                                    }))
                                  }
                                  className="font-mono text-sm"
                                />
                                <div className="flex justify-end mt-2">
                                  <Button
                                    size="sm"
                                    onClick={() => updateLineup(match.id, "away")}
                                    disabled={!lineupInput[match.id]?.away}
                                  >
                                    <Upload className="h-4 w-4 mr-1" />
                                    Update Lineup
                                  </Button>
                                </div>
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        </div>
                      </div>
                    </div>

                    {/* Score Controls */}
                    <div className="grid grid-cols-2 gap-6">
                      {/* Home Team */}
                      <div className="space-y-4">
                        <h3 className="font-semibold text-lg text-blue-600">{match.homeTeam}</h3>
                        <div className="text-center">
                          <div className="text-3xl font-bold">{homePoints}</div>
                          <div className="text-lg">
                            {match.homeGoals || 0}.{match.homeBehinds || 0}
                          </div>
                        </div>

                        {/* Combined Scoring Controls */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-center block">Scoring</Label>
                          <div className="flex gap-2 justify-center">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleScoreChange(match.id, "home", "goals", false)}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <Button size="sm" onClick={() => handleScoreChange(match.id, "home", "goals", true)}>
                              <Plus className="h-4 w-4" />
                              Goal
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleScoreChange(match.id, "home", "behinds", false)}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleScoreChange(match.id, "home", "behinds", true)}
                            >
                              <Plus className="h-4 w-4" />
                              Behind
                            </Button>
                          </div>
                        </div>

                        {/* Goalscorers */}
                        <div>
                          <Label className="text-sm font-medium">Add Goalscorer</Label>
                          <div className="flex gap-2 mt-1">
                            <Select
                              value={newGoalscorer[match.id]?.home || ""}
                              onValueChange={(value) =>
                                setNewGoalscorer((prev) => ({
                                  ...prev,
                                  [match.id]: { ...prev[match.id], home: value },
                                }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select player" />
                              </SelectTrigger>
                              <SelectContent>
                                {homePlayers.length > 0 ? (
                                  homePlayers.map((player) => (
                                    <SelectItem key={player.id} value={player.playerName}>
                                      {player.playerName} {player.position ? `(${player.position})` : ""}
                                    </SelectItem>
                                  ))
                                ) : (
                                  <SelectItem value="no-players" disabled>
                                    No players found for {match.homeTeam}
                                  </SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                            <Button
                              size="sm"
                              onClick={() => addGoalscorer(match.id, "home", newGoalscorer[match.id]?.home || "")}
                              disabled={!newGoalscorer[match.id]?.home}
                            >
                              Add
                            </Button>
                          </div>
                          <div className="mt-2 space-y-1">
                            {match.goalscorers?.home?.map((scorer, idx) => (
                              <div
                                key={idx}
                                className="flex justify-between items-center bg-blue-50 p-2 rounded text-sm"
                              >
                                <span>{scorer}</span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => removeGoalscorer(match.id, "home", scorer)}
                                >
                                  Remove
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Away Team */}
                      <div className="space-y-4">
                        <h3 className="font-semibold text-lg text-red-600">{match.awayTeam}</h3>
                        <div className="text-center">
                          <div className="text-3xl font-bold">{awayPoints}</div>
                          <div className="text-lg">
                            {match.awayGoals || 0}.{match.awayBehinds || 0}
                          </div>
                        </div>

                        {/* Combined Scoring Controls */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-center block">Scoring</Label>
                          <div className="flex gap-2 justify-center">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleScoreChange(match.id, "away", "goals", false)}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <Button size="sm" onClick={() => handleScoreChange(match.id, "away", "goals", true)}>
                              <Plus className="h-4 w-4" />
                              Goal
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleScoreChange(match.id, "away", "behinds", false)}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleScoreChange(match.id, "away", "behinds", true)}
                            >
                              <Plus className="h-4 w-4" />
                              Behind
                            </Button>
                          </div>
                        </div>

                        {/* Goalscorers */}
                        <div>
                          <Label className="text-sm font-medium">Add Goalscorer</Label>
                          <div className="flex gap-2 mt-1">
                            <Select
                              value={newGoalscorer[match.id]?.away || ""}
                              onValueChange={(value) =>
                                setNewGoalscorer((prev) => ({
                                  ...prev,
                                  [match.id]: { ...prev[match.id], away: value },
                                }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select player" />
                              </SelectTrigger>
                              <SelectContent>
                                {awayPlayers.length > 0 ? (
                                  awayPlayers.map((player) => (
                                    <SelectItem key={player.id} value={player.playerName}>
                                      {player.playerName} {player.position ? `(${player.position})` : ""}
                                    </SelectItem>
                                  ))
                                ) : (
                                  <SelectItem value="no-players" disabled>
                                    No players found for {match.awayTeam}
                                  </SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                            <Button
                              size="sm"
                              onClick={() => addGoalscorer(match.id, "away", newGoalscorer[match.id]?.away || "")}
                              disabled={!newGoalscorer[match.id]?.away}
                            >
                              Add
                            </Button>
                          </div>
                          <div className="mt-2 space-y-1">
                            {match.goalscorers?.away?.map((scorer, idx) => (
                              <div
                                key={idx}
                                className="flex justify-between items-center bg-red-50 p-2 rounded text-sm"
                              >
                                <span>{scorer}</span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => removeGoalscorer(match.id, "away", scorer)}
                                >
                                  Remove
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Commentary Section */}
                    <div className="border-t pt-6">
                      <h4 className="font-semibold text-lg mb-4 text-center">Match Commentary</h4>

                      {/* Add Commentary Form */}
                      <div className="bg-gray-50 p-4 rounded-lg mb-4">
                        <Label className="text-sm font-medium mb-2 block">Add Commentary</Label>
                        <div className="flex gap-2 mb-2">
                          <Select
                            value={newCommentary[match.id]?.type || "general"}
                            onValueChange={(value) =>
                              setNewCommentary((prev) => ({
                                ...prev,
                                [match.id]: { ...prev[match.id], type: value as Commentary["type"] },
                              }))
                            }
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue placeholder="Type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="general">📝 General</SelectItem>
                              <SelectItem value="injury">🚑 Injury</SelectItem>
                              <SelectItem value="substitution">🔄 Substitution</SelectItem>
                              <SelectItem value="incident">⚠️ Incident</SelectItem>
                              <SelectItem value="milestone">🎯 Milestone</SelectItem>
                              <SelectItem value="weather">🌧️ Weather</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            placeholder="Enter commentary..."
                            value={newCommentary[match.id]?.text || ""}
                            onChange={(e) =>
                              setNewCommentary((prev) => ({
                                ...prev,
                                [match.id]: { ...prev[match.id], text: e.target.value },
                              }))
                            }
                            onKeyPress={(e) => {
                              if (e.key === "Enter") {
                                addCommentary(
                                  match.id,
                                  newCommentary[match.id]?.text || "",
                                  newCommentary[match.id]?.type || "general",
                                )
                              }
                            }}
                          />
                          <Button
                            onClick={() =>
                              addCommentary(
                                match.id,
                                newCommentary[match.id]?.text || "",
                                newCommentary[match.id]?.type || "general",
                              )
                            }
                            disabled={!newCommentary[match.id]?.text?.trim()}
                          >
                            Add
                          </Button>
                        </div>
                      </div>

                      {/* Commentary List */}
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {match.commentary && match.commentary.length > 0 ? (
                          match.commentary.map((comment) => (
                            <div
                              key={comment.id}
                              className="flex justify-between items-start bg-white p-3 rounded border"
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`text-xs px-2 py-1 rounded ${getCommentaryTypeColor(comment.type)}`}>
                                    {getCommentaryTypeIcon(comment.type)} {comment.type.toUpperCase()}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {comment.isPreGame
                                      ? "PRE-GAME"
                                      : comment.timestamp?.toDate
                                        ? comment.timestamp.toDate().toLocaleTimeString()
                                        : new Date(comment.timestamp).toLocaleTimeString()}
                                  </span>
                                </div>
                                <p className="text-sm">{comment.text}</p>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeCommentary(match.id, comment.id)}
                                className="ml-2"
                              >
                                Remove
                              </Button>
                            </div>
                          ))
                        ) : (
                          <div className="text-center text-gray-500 text-sm py-4">No commentary yet</div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end border-t pt-4">
                    <Button variant="destructive" size="sm" onClick={() => openDeleteDialog(match.id)}>
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete Match
                    </Button>
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
                Confirm Match Deletion
              </AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this match? This action cannot be undone and will permanently remove the
                match from the live scores.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={deleteMatch} className="bg-red-600 hover:bg-red-700">
                Delete Match
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  )
}
