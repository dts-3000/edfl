"use client"

import type React from "react"

import { useState, useEffect } from "react"
import AdminLayout from "@/components/admin/AdminLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Calendar, Upload, Download, Edit, Trash2, Plus, Trophy, Users, MapPin, Clock, Search } from "lucide-react"
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface HistoricalMatch {
  id?: string
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
  createdAt?: Date
  updatedAt?: Date
}

interface Season {
  year: number
  matches: HistoricalMatch[]
  totalMatches: number
  teams: string[]
  rounds: string[]
}

export default function HistoricalSeasonsPage() {
  const [seasons, setSeasons] = useState<Season[]>([])
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null)
  const [matches, setMatches] = useState<HistoricalMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [editingMatch, setEditingMatch] = useState<HistoricalMatch | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
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

          return {
            year,
            matches,
            totalMatches: matches.length,
            teams,
            rounds,
          }
        })
        .sort((a, b) => b.year - a.year)

      setSeasons(seasonsData)

      if (seasonsData.length > 0 && !selectedSeason) {
        setSelectedSeason(seasonsData[0].year)
      }
    } catch (error) {
      console.error("Error loading seasons:", error)
      toast.error("Failed to load historical seasons")
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
      toast.error("Failed to load matches")
    }
  }

  const handleCSVUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const text = await file.text()
      const lines = text.split("\n").filter((line) => line.trim())
      const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""))

      const matches: Omit<HistoricalMatch, "id">[] = []

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map((v) => v.trim().replace(/"/g, ""))
        if (values.length < headers.length) continue

        const match: Omit<HistoricalMatch, "id"> = {
          season: Number.parseInt(file.name.match(/(\d{4})/)?.[1] || "1930"),
          date: values[0] || "",
          round: values[1] || "",
          team1: values[2] || "",
          team1Score: values[3] || "",
          points1: Number.parseInt(values[4]) || 0,
          team2: values[5] || "",
          team2Score: values[6] || "",
          points2: Number.parseInt(values[7]) || 0,
          ground: values[8] || "",
          time: values[9] || "",
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        matches.push(match)
      }

      // Save to Firebase
      for (const match of matches) {
        await addDoc(collection(db, "historicalMatches"), match)
      }

      toast.success(`Uploaded ${matches.length} matches successfully!`)
      loadSeasons()
    } catch (error) {
      console.error("Error uploading CSV:", error)
      toast.error("Failed to upload CSV file")
    } finally {
      setUploading(false)
      event.target.value = ""
    }
  }

  const handleLoad1930Data = async () => {
    setUploading(true)
    try {
      const response = await fetch(
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/1930-cltbAO8r26ln034q4SMd7t2rSWKGfE.csv",
      )
      const text = await response.text()
      const lines = text.split("\n").filter((line) => line.trim())

      const matches: Omit<HistoricalMatch, "id">[] = []

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map((v) => v.trim().replace(/"/g, ""))
        if (values.length < 9) continue

        const match: Omit<HistoricalMatch, "id"> = {
          season: 1930,
          date: values[0] || "",
          round: values[1] || "",
          team1: values[2] || "",
          team1Score: values[3] || "",
          points1: Number.parseInt(values[4]) || 0,
          team2: values[5] || "",
          team2Score: values[6] || "",
          points2: Number.parseInt(values[7]) || 0,
          ground: values[8] || "",
          time: values[9] || "",
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        matches.push(match)
      }

      // Save to Firebase
      for (const match of matches) {
        await addDoc(collection(db, "historicalMatches"), match)
      }

      toast.success(`Loaded ${matches.length} matches from 1930 season!`)
      loadSeasons()
      setSelectedSeason(1930)
    } catch (error) {
      console.error("Error loading 1930 data:", error)
      toast.error("Failed to load 1930 data")
    } finally {
      setUploading(false)
    }
  }

  const handleSaveMatch = async (matchData: Omit<HistoricalMatch, "id">) => {
    try {
      if (editingMatch?.id) {
        // Update existing match
        await updateDoc(doc(db, "historicalMatches", editingMatch.id), {
          ...matchData,
          updatedAt: new Date(),
        })
        toast.success("Match updated successfully!")
      } else {
        // Add new match
        await addDoc(collection(db, "historicalMatches"), {
          ...matchData,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        toast.success("Match added successfully!")
      }

      setIsDialogOpen(false)
      setEditingMatch(null)
      loadSeasons()
      if (selectedSeason) {
        loadMatches(selectedSeason)
      }
    } catch (error) {
      console.error("Error saving match:", error)
      toast.error("Failed to save match")
    }
  }

  const handleDeleteMatch = async (matchId: string) => {
    if (!confirm("Are you sure you want to delete this match?")) return

    try {
      await deleteDoc(doc(db, "historicalMatches", matchId))
      toast.success("Match deleted successfully!")
      loadSeasons()
      if (selectedSeason) {
        loadMatches(selectedSeason)
      }
    } catch (error) {
      console.error("Error deleting match:", error)
      toast.error("Failed to delete match")
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
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Historical Seasons</h1>
            <p className="text-muted-foreground">Manage historical match data and seasons</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleLoad1930Data} disabled={uploading}>
              <Download className="mr-2 h-4 w-4" />
              Load 1930 Data
            </Button>
            <Button variant="outline" asChild>
              <label>
                <Upload className="mr-2 h-4 w-4" />
                Upload CSV
                <input type="file" accept=".csv" onChange={handleCSVUpload} className="hidden" disabled={uploading} />
              </label>
            </Button>
          </div>
        </div>

        {/* Season Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="text-center py-4">
              <div className="text-2xl font-bold text-primary">{seasons.length}</div>
              <div className="text-sm text-muted-foreground">Total Seasons</div>
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
              <div className="text-sm text-muted-foreground">Earliest Season</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="text-center py-4">
              <div className="text-2xl font-bold text-purple-600">
                {seasons.length > 0 ? Math.max(...seasons.map((s) => s.year)) : 0}
              </div>
              <div className="text-sm text-muted-foreground">Latest Season</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="seasons">
          <TabsList>
            <TabsTrigger value="seasons">Seasons</TabsTrigger>
            <TabsTrigger value="matches">Matches</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="seasons" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Available Seasons</CardTitle>
                <CardDescription>Select a season to view and edit matches</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {seasons.map((season) => (
                    <Card
                      key={season.year}
                      className={`cursor-pointer transition-colors ${
                        selectedSeason === season.year ? "ring-2 ring-primary" : "hover:bg-muted/50"
                      }`}
                      onClick={() => setSelectedSeason(season.year)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-lg font-semibold">{season.year}</h3>
                          <Badge variant="secondary">{season.totalMatches} matches</Badge>
                        </div>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div className="flex items-center">
                            <Users className="mr-2 h-3 w-3" />
                            {season.teams.length} teams
                          </div>
                          <div className="flex items-center">
                            <Trophy className="mr-2 h-3 w-3" />
                            {season.rounds.length} rounds
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="matches" className="space-y-4">
            {selectedSeason && currentSeason && (
              <>
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle>{selectedSeason} Season Matches</CardTitle>
                        <CardDescription>{currentSeason.totalMatches} matches recorded</CardDescription>
                      </div>
                      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                          <Button onClick={() => setEditingMatch(null)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Match
                          </Button>
                        </DialogTrigger>
                        <MatchDialog
                          match={editingMatch}
                          season={selectedSeason}
                          onSave={handleSaveMatch}
                          onClose={() => {
                            setIsDialogOpen(false)
                            setEditingMatch(null)
                          }}
                        />
                      </Dialog>
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
                            <TableHead>Score</TableHead>
                            <TableHead>Ground</TableHead>
                            <TableHead>Actions</TableHead>
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
                                  <div
                                    className={`font-medium ${match.points1 > match.points2 ? "text-green-600" : ""}`}
                                  >
                                    {match.team1Score} ({match.points1})
                                  </div>
                                  <div
                                    className={`font-medium ${match.points2 > match.points1 ? "text-green-600" : ""}`}
                                  >
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
                              <TableCell>
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setEditingMatch(match)
                                      setIsDialogOpen(true)
                                    }}
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => match.id && handleDeleteMatch(match.id)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Season Analytics</CardTitle>
                <CardDescription>Statistical overview of historical data</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">Analytics dashboard coming soon...</div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  )
}

interface MatchDialogProps {
  match: HistoricalMatch | null
  season: number
  onSave: (match: Omit<HistoricalMatch, "id">) => void
  onClose: () => void
}

function MatchDialog({ match, season, onSave, onClose }: MatchDialogProps) {
  const [formData, setFormData] = useState<Omit<HistoricalMatch, "id">>({
    season,
    date: match?.date || "",
    round: match?.round || "",
    team1: match?.team1 || "",
    team1Score: match?.team1Score || "",
    points1: match?.points1 || 0,
    team2: match?.team2 || "",
    team2Score: match?.team2Score || "",
    points2: match?.points2 || 0,
    ground: match?.ground || "",
    time: match?.time || "",
    notes: match?.notes || "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>{match ? "Edit Match" : "Add New Match"}</DialogTitle>
        <DialogDescription>
          {match ? "Update match details" : `Add a new match for the ${season} season`}
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              placeholder="20/09/1930"
              required
            />
          </div>
          <div>
            <Label htmlFor="round">Round</Label>
            <Input
              id="round"
              value={formData.round}
              onChange={(e) => setFormData({ ...formData, round: e.target.value })}
              placeholder="Final"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="team1">Team 1</Label>
            <Input
              id="team1"
              value={formData.team1}
              onChange={(e) => setFormData({ ...formData, team1: e.target.value })}
              placeholder="St Johns"
              required
            />
          </div>
          <div>
            <Label htmlFor="team2">Team 2</Label>
            <Input
              id="team2"
              value={formData.team2}
              onChange={(e) => setFormData({ ...formData, team2: e.target.value })}
              placeholder="Kensington Methodist"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div>
            <Label htmlFor="team1Score">Team 1 Score</Label>
            <Input
              id="team1Score"
              value={formData.team1Score}
              onChange={(e) => setFormData({ ...formData, team1Score: e.target.value })}
              placeholder="15.14"
              required
            />
          </div>
          <div>
            <Label htmlFor="points1">Points 1</Label>
            <Input
              id="points1"
              type="number"
              value={formData.points1}
              onChange={(e) => setFormData({ ...formData, points1: Number.parseInt(e.target.value) || 0 })}
              placeholder="104"
              required
            />
          </div>
          <div>
            <Label htmlFor="team2Score">Team 2 Score</Label>
            <Input
              id="team2Score"
              value={formData.team2Score}
              onChange={(e) => setFormData({ ...formData, team2Score: e.target.value })}
              placeholder="6.8"
              required
            />
          </div>
          <div>
            <Label htmlFor="points2">Points 2</Label>
            <Input
              id="points2"
              type="number"
              value={formData.points2}
              onChange={(e) => setFormData({ ...formData, points2: Number.parseInt(e.target.value) || 0 })}
              placeholder="44"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="ground">Ground</Label>
            <Input
              id="ground"
              value={formData.ground}
              onChange={(e) => setFormData({ ...formData, ground: e.target.value })}
              placeholder="Holmes Rd Reserve"
              required
            />
          </div>
          <div>
            <Label htmlFor="time">Time</Label>
            <Input
              id="time"
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              placeholder="3pm"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Additional notes about the match..."
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">{match ? "Update Match" : "Add Match"}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}
