"use client"

import { useState, useEffect } from "react"
import Navbar from "@/components/layout/Navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Trophy, Users, MapPin, Clock, Search, BarChart3, Target } from "lucide-react"
import { collection, getDocs, query, where, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface HistoricalMatch {
  id: string
  season: number
  date: string
  round: string
  team1: string
  team1Score: string
  points1: number
  team2: string
  team2Score: string
  points2: number
  ground: string
  time?: string
  notes?: string
}

interface Season {
  year: number
  matches: HistoricalMatch[]
  totalMatches: number
  teams: string[]
  rounds: string[]
  topScorer: { team: string; points: number }
  averageScore: number
}

export default function HistoricalSeasonsPublicPage() {
  const [seasons, setSeasons] = useState<Season[]>([])
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null)
  const [matches, setMatches] = useState<HistoricalMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [roundFilter, setRoundFilter] = useState("all")
  const [teamFilter, setTeamFilter] = useState("all")

  useEffect(() => {
    loadSeasons()
  }, [])

  useEffect(() => {
    if (selectedSeason) {
      loadMatches(selectedSeason)
    }
  }, [selectedSeason])

  const loadSeasons = async () => {
    try {
      setLoading(true)
      const matchesQuery = query(collection(db, "historicalMatches"), orderBy("season", "desc"))
      const snapshot = await getDocs(matchesQuery)

      const allMatches = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as HistoricalMatch[]

      // Group matches by season
      const seasonMap = new Map<number, HistoricalMatch[]>()
      allMatches.forEach((match) => {
        if (!seasonMap.has(match.season)) {
          seasonMap.set(match.season, [])
        }
        seasonMap.get(match.season)!.push(match)
      })

      const seasonsData: Season[] = Array.from(seasonMap.entries())
        .map(([year, matches]) => {
          const teams = [...new Set([...matches.map((m) => m.team1), ...matches.map((m) => m.team2)])].sort()
          const rounds = [...new Set(matches.map((m) => m.round))].sort()

          // Calculate top scorer
          const teamScores = new Map<string, number>()
          matches.forEach((match) => {
            teamScores.set(match.team1, (teamScores.get(match.team1) || 0) + match.points1)
            teamScores.set(match.team2, (teamScores.get(match.team2) || 0) + match.points2)
          })

          const topScorer = Array.from(teamScores.entries()).sort((a, b) => b[1] - a[1])[0] || ["", 0]

          const averageScore =
            matches.length > 0 ? matches.reduce((sum, m) => sum + m.points1 + m.points2, 0) / (matches.length * 2) : 0

          return {
            year,
            matches,
            totalMatches: matches.length,
            teams,
            rounds,
            topScorer: { team: topScorer[0], points: topScorer[1] },
            averageScore: Math.round(averageScore),
          }
        })
        .sort((a, b) => b.year - a.year)

      setSeasons(seasonsData)

      if (seasonsData.length > 0 && !selectedSeason) {
        setSelectedSeason(seasonsData[0].year)
      }
    } catch (error) {
      console.error("Error loading seasons:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadMatches = async (season: number) => {
    try {
      const matchesQuery = query(
        collection(db, "historicalMatches"),
        where("season", "==", season),
        orderBy("date", "asc"),
      )
      const snapshot = await getDocs(matchesQuery)

      const matchesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as HistoricalMatch[]

      setMatches(matchesData)
    } catch (error) {
      console.error("Error loading matches:", error)
    }
  }

  const filteredMatches = matches.filter((match) => {
    const matchesSearch =
      searchTerm === "" ||
      match.team1.toLowerCase().includes(searchTerm.toLowerCase()) ||
      match.team2.toLowerCase().includes(searchTerm.toLowerCase()) ||
      match.ground.toLowerCase().includes(searchTerm.toLowerCase()) ||
      match.round.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesRound = roundFilter === "all" || match.round === roundFilter
    const matchesTeam = teamFilter === "all" || match.team1 === teamFilter || match.team2 === teamFilter

    return matchesSearch && matchesRound && matchesTeam
  })

  const currentSeason = seasons.find((s) => s.year === selectedSeason)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading historical seasons...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Historical Seasons</h1>
              <p className="text-gray-600">
                Explore the rich history of EDFL seasons and match results from years past.
              </p>
            </div>
          </div>

          {/* Season Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="text-center py-4">
                <div className="text-2xl font-bold text-primary">{seasons.length}</div>
                <div className="text-sm text-muted-foreground">Seasons</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="text-center py-4">
                <div className="text-2xl font-bold text-green-600">
                  {seasons.reduce((sum, s) => sum + s.totalMatches, 0)}
                </div>
                <div className="text-sm text-muted-foreground">Total Matches</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="text-center py-4">
                <div className="text-2xl font-bold text-blue-600">
                  {seasons.length > 0 ? Math.min(...seasons.map((s) => s.year)) : 0}
                </div>
                <div className="text-sm text-muted-foreground">Earliest</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="text-center py-4">
                <div className="text-2xl font-bold text-purple-600">
                  {seasons.length > 0 ? Math.max(...seasons.map((s) => s.year)) : 0}
                </div>
                <div className="text-sm text-muted-foreground">Latest</div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Tabs defaultValue="seasons">
          <TabsList>
            <TabsTrigger value="seasons">Seasons Overview</TabsTrigger>
            <TabsTrigger value="matches">Match Results</TabsTrigger>
          </TabsList>

          <TabsContent value="seasons" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {seasons.map((season) => (
                <Card
                  key={season.year}
                  className={`cursor-pointer transition-colors hover:shadow-lg ${
                    selectedSeason === season.year ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => setSelectedSeason(season.year)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-2xl">{season.year}</CardTitle>
                      <Badge variant="secondary">{season.totalMatches} matches</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{season.teams.length} teams</span>
                        </div>
                        <div className="flex items-center">
                          <Trophy className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{season.rounds.length} rounds</span>
                        </div>
                      </div>

                      {season.topScorer.team && (
                        <div className="bg-yellow-50 p-3 rounded-lg">
                          <div className="flex items-center">
                            <Target className="mr-2 h-4 w-4 text-yellow-600" />
                            <div>
                              <div className="text-sm font-medium">Top Scorer</div>
                              <div className="text-xs text-muted-foreground">
                                {season.topScorer.team} - {season.topScorer.points} points
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center">
                        <BarChart3 className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Avg: {season.averageScore} points</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="matches" className="space-y-4">
            {selectedSeason && currentSeason && (
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>{selectedSeason} Season Results</CardTitle>
                      <CardDescription>{currentSeason.totalMatches} matches played</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {seasons.map((season) => (
                        <Button
                          key={season.year}
                          variant={selectedSeason === season.year ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedSeason(season.year)}
                        >
                          {season.year}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Filters */}
                  <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search teams, grounds, rounds..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select value={roundFilter} onValueChange={setRoundFilter}>
                      <SelectTrigger className="w-full sm:w-48">
                        <SelectValue placeholder="Filter by round" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Rounds</SelectItem>
                        {currentSeason.rounds.map((round) => (
                          <SelectItem key={round} value={round}>
                            {round}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={teamFilter} onValueChange={setTeamFilter}>
                      <SelectTrigger className="w-full sm:w-48">
                        <SelectValue placeholder="Filter by team" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Teams</SelectItem>
                        {currentSeason.teams.map((team) => (
                          <SelectItem key={team} value={team}>
                            {team}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Matches Table */}
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Round</TableHead>
                          <TableHead>Match</TableHead>
                          <TableHead>Result</TableHead>
                          <TableHead>Ground</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredMatches.map((match) => (
                          <TableRow key={match.id}>
                            <TableCell>
                              <div className="flex items-center">
                                <Calendar className="mr-2 h-3 w-3 text-muted-foreground" />
                                {match.date}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{match.round}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="font-medium">
                                  {match.team1} vs {match.team2}
                                </div>
                                {match.time && (
                                  <div className="flex items-center text-sm text-muted-foreground">
                                    <Clock className="mr-1 h-3 w-3" />
                                    {match.time}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className={`font-medium ${match.points1 > match.points2 ? "text-green-600" : ""}`}>
                                  {match.team1Score} ({match.points1})
                                </div>
                                <div className={`font-medium ${match.points2 > match.points1 ? "text-green-600" : ""}`}>
                                  {match.team2Score} ({match.points2})
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <MapPin className="mr-2 h-3 w-3 text-muted-foreground" />
                                {match.ground}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {filteredMatches.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No matches found matching your criteria.
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
