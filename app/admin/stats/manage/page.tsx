"use client"

import type React from "react"

import { useState, useEffect } from "react"
import AdminLayout from "@/components/admin/AdminLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import {
  Loader2,
  Search,
  Trash2,
  RefreshCw,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Bug,
  Eye,
  PlusCircle,
} from "lucide-react"
import { getMatches, deleteMatchAndStats, type MatchData, getPlayerStatsForMatch } from "@/lib/playerStats"
import { getTeamLogoPath } from "@/lib/teamLogos"

export default function ManageStatsPage() {
  const [matches, setMatches] = useState<MatchData[]>([])
  const [filteredMatches, setFilteredMatches] = useState<MatchData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSeason, setSelectedSeason] = useState<string>("all")
  const [selectedRound, setSelectedRound] = useState<string>("all")
  const [selectedMatch, setSelectedMatch] = useState<MatchData | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [processingAction, setProcessingAction] = useState(false)
  const [availableSeasons, setAvailableSeasons] = useState<string[]>([])
  const [availableRounds, setAvailableRounds] = useState<string[]>([])
  const [debugInfo, setDebugInfo] = useState<string>("")
  const [showDebug, setShowDebug] = useState(false)
  const [viewStatsDialogOpen, setViewStatsDialogOpen] = useState(false)
  const [selectedMatchStats, setSelectedMatchStats] = useState<any[]>([])
  const [loadingStats, setLoadingStats] = useState(false)

  const loadMatches = async () => {
    try {
      setLoading(true)
      setDebugInfo("Starting to load matches...")

      console.log("Calling getMatches()...")
      const matchData = await getMatches()
      console.log("getMatches() returned:", matchData)

      // Filter out matches with missing required fields
      const validMatches = matchData.filter((match) => match.homeTeam && match.awayTeam && match.season && match.round)

      setDebugInfo(`Found ${matchData.length} matches in database, ${validMatches.length} are valid`)

      // Sort by season and round
      validMatches.sort((a, b) => {
        if (a.season !== b.season) {
          // Convert both to strings for comparison
          const seasonA = a.season.toString()
          const seasonB = b.season.toString()
          return seasonB.localeCompare(seasonA) // Newest season first
        }

        // Convert both to strings for comparison
        const roundA = a.round.toString()
        const roundB = b.round.toString()

        // Try numeric comparison first
        const numA = Number.parseInt(roundA)
        const numB = Number.parseInt(roundB)

        if (!isNaN(numA) && !isNaN(numB)) {
          return numB - numA // Newest round first
        }

        // Fall back to string comparison
        return roundB.localeCompare(roundA)
      })

      setMatches(validMatches)
      setFilteredMatches(validMatches)

      // Extract available seasons
      const seasons = [...new Set(validMatches.map((match) => match.season.toString()))].sort(
        (a, b) => Number.parseInt(b) - Number.parseInt(a),
      )
      setAvailableSeasons(seasons)

      // Extract available rounds for all seasons
      const rounds = [...new Set(validMatches.map((match) => match.round.toString()))].sort((a, b) => {
        const numA = Number.parseInt(a)
        const numB = Number.parseInt(b)
        if (!isNaN(numA) && !isNaN(numB)) {
          return numA - numB
        }
        return a.localeCompare(b)
      })
      setAvailableRounds(rounds)

      setDebugInfo((prev) => prev + `\nSeasons found: ${seasons.join(", ")}\nRounds found: ${rounds.join(", ")}`)
    } catch (error) {
      console.error("Error loading match data:", error)
      setDebugInfo(`Error loading matches: ${error}`)
      toast({
        title: "Error",
        description: "Failed to load match data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMatches()
  }, [])

  // Filter matches when search term or filters change
  useEffect(() => {
    let filtered = [...matches]

    // Apply season filter
    if (selectedSeason !== "all") {
      filtered = filtered.filter((match) => match.season.toString() === selectedSeason)
    }

    // Apply round filter
    if (selectedRound !== "all") {
      filtered = filtered.filter((match) => match.round.toString() === selectedRound)
    }

    // Apply search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (match) =>
          match.homeTeam.toLowerCase().includes(term) ||
          match.awayTeam.toLowerCase().includes(term) ||
          match.id.toLowerCase().includes(term) ||
          (match.venue && match.venue.toLowerCase().includes(term)),
      )
    }

    setFilteredMatches(filtered)
  }, [searchTerm, selectedSeason, selectedRound, matches])

  const handleDeleteMatch = async () => {
    if (!selectedMatch) return

    try {
      setProcessingAction(true)

      // Delete match and its stats
      await deleteMatchAndStats(selectedMatch.id)

      // Update local state
      const updatedMatches = matches.filter((match) => match.id !== selectedMatch.id)
      setMatches(updatedMatches)

      // Apply filters to updated matches
      let filtered = [...updatedMatches]
      if (selectedSeason !== "all") {
        filtered = filtered.filter((match) => match.season.toString() === selectedSeason)
      }
      if (selectedRound !== "all") {
        filtered = filtered.filter((match) => match.round.toString() === selectedRound)
      }
      if (searchTerm) {
        const term = searchTerm.toLowerCase()
        filtered = filtered.filter(
          (match) =>
            match.homeTeam.toLowerCase().includes(term) ||
            match.awayTeam.toLowerCase().includes(term) ||
            match.id.toLowerCase().includes(term) ||
            (match.venue && match.venue.toLowerCase().includes(term)),
        )
      }
      setFilteredMatches(filtered)

      toast({
        title: "Success",
        description: `Match ${selectedMatch.homeTeam} vs ${selectedMatch.awayTeam} (Round ${selectedMatch.round}, ${selectedMatch.season}) has been deleted.`,
      })
    } catch (error) {
      console.error("Error deleting match:", error)
      toast({
        title: "Error",
        description: "Failed to delete match. Please try again.",
        variant: "destructive",
      })
    } finally {
      setProcessingAction(false)
      setIsDeleteDialogOpen(false)
      setSelectedMatch(null)
    }
  }

  // Format date from YYYY-MM-DD to DD/MM/YYYY or handle DD/MM/YYYY
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A"

    try {
      // Check if already in DD/MM/YYYY format
      if (dateString.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
        return dateString
      }

      // Convert from YYYY-MM-DD to DD/MM/YYYY
      const [year, month, day] = dateString.split("-")
      return `${day}/${month}/${year}`
    } catch (error) {
      return dateString
    }
  }

  const handleViewStats = async (match: MatchData) => {
    try {
      setSelectedMatch(match)
      setLoadingStats(true)
      setViewStatsDialogOpen(true)

      const stats = await getPlayerStatsForMatch(match.id)
      setSelectedMatchStats(stats)

      if (stats.length === 0) {
        setDebugInfo((prev) => prev + `\nNo stats found for match ${match.id}`)
      } else {
        setDebugInfo((prev) => prev + `\nFound ${stats.length} stats for match ${match.id}`)
      }
    } catch (error) {
      console.error("Error loading match stats:", error)
      toast({
        title: "Error",
        description: "Failed to load match statistics. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoadingStats(false)
    }
  }

  const handleAddStats = (match: MatchData) => {
    // Create URL with match parameters
    const url = `/admin/stats/upload?season=${match.season}&round=${match.round}&homeTeam=${encodeURIComponent(
      match.homeTeam,
    )}&awayTeam=${encodeURIComponent(match.awayTeam)}&date=${encodeURIComponent(
      match.date,
    )}&venue=${encodeURIComponent(match.venue || "")}&matchId=${encodeURIComponent(match.id)}`

    window.location.href = url
  }

  // Handle missing team logo gracefully
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.onerror = null
    e.currentTarget.src = "/images/teams/placeholder.png"
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Manage Match Statistics</h1>
            <p className="text-muted-foreground">View, filter, and delete match statistics</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowDebug(!showDebug)}>
              <Bug className="mr-2 h-4 w-4" />
              {showDebug ? "Hide" : "Show"} Debug
            </Button>
            <Button variant="outline" onClick={loadMatches} disabled={loading}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Data
            </Button>
            <Button onClick={() => (window.location.href = "/admin/stats/upload")}>
              <FileText className="mr-2 h-4 w-4" />
              Upload New Stats
            </Button>
          </div>
        </div>

        {showDebug && (
          <div className="bg-gray-100 p-4 rounded-md">
            <h3 className="font-semibold mb-2">Debug Information</h3>
            <pre className="text-sm whitespace-pre-wrap">{debugInfo}</pre>
            <div className="mt-2">
              <p>
                <strong>Total matches in state:</strong> {matches.length}
              </p>
              <p>
                <strong>Filtered matches:</strong> {filteredMatches.length}
              </p>
              <p>
                <strong>Available seasons:</strong> {availableSeasons.join(", ") || "None"}
              </p>
              <p>
                <strong>Available rounds:</strong> {availableRounds.join(", ") || "None"}
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="search" className="mb-2 block">
              Search
            </Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                id="search"
                placeholder="Search by team or venue..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="season-select" className="mb-2 block">
              Season
            </Label>
            <Select value={selectedSeason} onValueChange={setSelectedSeason}>
              <SelectTrigger id="season-select">
                <SelectValue placeholder="All seasons" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All seasons</SelectItem>
                {availableSeasons.map((season) => (
                  <SelectItem key={season} value={season}>
                    {season}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="round-select" className="mb-2 block">
              Round
            </Label>
            <Select value={selectedRound} onValueChange={setSelectedRound}>
              <SelectTrigger id="round-select">
                <SelectValue placeholder="All rounds" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All rounds</SelectItem>
                {availableRounds.map((round) => (
                  <SelectItem key={round} value={round}>
                    Round {round}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2">Loading match data...</span>
          </div>
        ) : (
          <div className="rounded-md border overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Season</TableHead>
                    <TableHead>Round</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Home Team</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Away Team</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMatches.length > 0 ? (
                    filteredMatches.map((match) => (
                      <TableRow key={match.id}>
                        <TableCell>{match.season.toString()}</TableCell>
                        <TableCell>Round {match.round.toString()}</TableCell>
                        <TableCell>{formatDate(match.date)}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <div className="h-8 w-8 mr-2">
                              <img
                                src={getTeamLogoPath(match.homeTeam) || "/placeholder.svg"}
                                alt={match.homeTeam}
                                width={32}
                                height={32}
                                className="h-8 w-8 object-contain"
                                onError={handleImageError}
                              />
                            </div>
                            {match.homeTeam}
                          </div>
                        </TableCell>
                        <TableCell>
                          {match.homeScore !== undefined && match.awayScore !== undefined
                            ? `${match.homeScore} - ${match.awayScore}`
                            : "N/A"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <div className="h-8 w-8 mr-2">
                              <img
                                src={getTeamLogoPath(match.awayTeam) || "/placeholder.svg"}
                                alt={match.awayTeam}
                                width={32}
                                height={32}
                                className="h-8 w-8 object-contain"
                                onError={handleImageError}
                              />
                            </div>
                            {match.awayTeam}
                          </div>
                        </TableCell>
                        <TableCell>
                          {match.hasStats ? (
                            <div className="flex items-center">
                              <CheckCircle2 className="h-4 w-4 text-green-500 mr-1" />
                              <span className="text-green-600 text-sm">Stats Available</span>
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <AlertTriangle className="h-4 w-4 text-amber-500 mr-1" />
                              <span className="text-amber-600 text-sm">No Stats</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {match.hasStats ? (
                              <Button variant="outline" size="sm" onClick={() => handleViewStats(match)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleAddStats(match)}
                                className="bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700 border-green-200"
                              >
                                <PlusCircle className="h-4 w-4" />
                                <span className="ml-1 hidden sm:inline">Add Stats</span>
                              </Button>
                            )}
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                setSelectedMatch(match)
                                setIsDeleteDialogOpen(true)
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                        {matches.length === 0 ? "No matches found in database" : "No matches match your filters"}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>

      {/* Delete Match Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Match</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedMatch?.homeTeam} vs {selectedMatch?.awayTeam} (Round{" "}
              {selectedMatch?.round}, {selectedMatch?.season})?
              {selectedMatch?.hasStats && (
                <div className="mt-2 text-red-600">This will also delete all player statistics for this match.</div>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={processingAction}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteMatch} disabled={processingAction}>
              {processingAction ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Match"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Stats Dialog */}
      <Dialog open={viewStatsDialogOpen} onOpenChange={setViewStatsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Match Statistics: {selectedMatch?.homeTeam} vs {selectedMatch?.awayTeam}
            </DialogTitle>
            <DialogDescription>
              Round {selectedMatch?.round}, Season {selectedMatch?.season}
            </DialogDescription>
          </DialogHeader>

          {loadingStats ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2">Loading statistics...</span>
            </div>
          ) : selectedMatchStats.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Team</TableHead>
                    <TableHead>Player</TableHead>
                    <TableHead>Number</TableHead>
                    <TableHead>Kicks</TableHead>
                    <TableHead>Handballs</TableHead>
                    <TableHead>Marks</TableHead>
                    <TableHead>Tackles</TableHead>
                    <TableHead>Goals</TableHead>
                    <TableHead>Behinds</TableHead>
                    <TableHead>Fantasy</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedMatchStats.map((stat, index) => (
                    <TableRow key={index}>
                      <TableCell>{stat.team}</TableCell>
                      <TableCell>{stat.playerName}</TableCell>
                      <TableCell>{stat.playerNumber}</TableCell>
                      <TableCell>{stat.kicks}</TableCell>
                      <TableCell>{stat.handballs}</TableCell>
                      <TableCell>{stat.marks}</TableCell>
                      <TableCell>{stat.tackles}</TableCell>
                      <TableCell>{stat.goals}</TableCell>
                      <TableCell>{stat.behinds}</TableCell>
                      <TableCell>{stat.fantasyPoints}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
              <p className="text-lg font-medium">No statistics found for this match</p>
              <p className="text-gray-500 mt-2">
                This match is marked as having statistics, but no data was found in the database.
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setViewStatsDialogOpen(false)
                  handleAddStats(selectedMatch!)
                }}
              >
                <FileText className="mr-2 h-4 w-4" />
                Upload Statistics
              </Button>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewStatsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
