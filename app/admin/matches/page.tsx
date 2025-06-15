"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { initializeApp } from "firebase/app"
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore"
import AdminLayout from "@/components/admin/AdminLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { Loader2, Search, Plus, Edit, Trash2, RefreshCw, Upload, CheckCircle2, AlertTriangle } from "lucide-react"
import { getTeamLogoPath } from "@/lib/teamLogos"
import { getAuth } from "firebase/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

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

interface Match {
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
  createdAt?: any
  updatedAt?: any
}

const TEAMS = [
  "Airport West",
  "Aberfeldie",
  "Deer Park",
  "Essendon Doutta Stars",
  "Greenvale",
  "Keilor",
  "Maribyrnong Park",
  "Pascoe Vale",
  "Strathmore",
  "East Keilor",
]

export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([])
  const [filteredMatches, setFilteredMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSeason, setSelectedSeason] = useState<string>("2025")
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editedMatch, setEditedMatch] = useState<Partial<Match>>({})
  const [newMatch, setNewMatch] = useState<Partial<Match>>({
    season: 2025,
    round: 1,
    date: new Date().toISOString().split("T")[0],
    homeTeam: "",
    awayTeam: "",
    venue: "",
    homeScore: undefined,
    awayScore: undefined,
    hasStats: false,
  })
  const [processingAction, setProcessingAction] = useState(false)
  const [availableSeasons, setAvailableSeasons] = useState<number[]>([])
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadResults, setUploadResults] = useState<{
    total: number
    successful: number
    failed: number
    errors: string[]
  }>({ total: 0, successful: 0, failed: 0, errors: [] })
  const [isUploading, setIsUploading] = useState(false)

  const debugFirebaseConnection = async () => {
    try {
      console.log("Testing Firebase connection...")
      console.log("Firebase config:", {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? "Set" : "Missing",
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? "Set" : "Missing",
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? "Set" : "Missing",
      })

      const matchesCollection = collection(db, "matches")
      const matchesSnapshot = await getDocs(matchesCollection)
      console.log(`Found ${matchesSnapshot.docs.length} matches in Firebase`)

      matchesSnapshot.docs.forEach((doc) => {
        console.log("Match:", doc.id, doc.data())
      })
    } catch (error) {
      console.error("Firebase connection error:", error)
    }
  }

  const testFirebaseAuth = async () => {
    try {
      console.log("Testing Firebase Auth...")
      const auth = getAuth()
      console.log("Current user:", auth.currentUser)

      // Try to sign in anonymously to test connection
      if (!auth.currentUser) {
        const { signInAnonymously } = await import("firebase/auth")
        const result = await signInAnonymously(auth)
        console.log("Anonymous sign in successful:", result.user.uid)
      }
    } catch (error) {
      console.error("Firebase Auth error:", error)
    }
  }

  const checkFirestoreRules = async () => {
    try {
      console.log("Testing Firestore rules...")

      // Try to read from a test collection
      const testCollection = collection(db, "test")
      const testSnapshot = await getDocs(testCollection)
      console.log("Firestore read test successful, docs:", testSnapshot.size)

      // Try to write a test document
      const testDoc = doc(testCollection, "connection-test")
      await setDoc(testDoc, {
        timestamp: new Date().toISOString(),
        test: true,
      })
      console.log("Firestore write test successful")

      // Clean up test document
      await deleteDoc(testDoc)
      console.log("Firestore delete test successful")
    } catch (error) {
      console.error("Firestore rules error:", error)
      if (error.code === "permission-denied") {
        console.log("Permission denied - check Firestore security rules")
      }
    }
  }

  const loadMatches = async () => {
    try {
      setLoading(true)
      const matchesCollection = collection(db, "matches")
      const matchesSnapshot = await getDocs(matchesCollection)

      const matchData: Match[] = []
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
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        })
      })

      // Sort by season (desc) then round (asc)
      matchData.sort((a, b) => {
        if (a.season !== b.season) return b.season - a.season
        return a.round - b.round
      })

      setMatches(matchData)

      // Get available seasons
      const seasons = [...new Set(matchData.map((m) => m.season))].sort((a, b) => b - a)
      setAvailableSeasons(seasons)
    } catch (error) {
      console.error("Error loading matches:", error)
      toast({
        title: "Error",
        description: "Failed to load matches. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const runTests = async () => {
      await debugFirebaseConnection()
      await testFirebaseAuth()
      await checkFirestoreRules()
      await loadMatches()
    }
    runTests()
  }, [])

  // Filter matches
  useEffect(() => {
    let filtered = [...matches]

    // Filter by season
    if (selectedSeason !== "all") {
      filtered = filtered.filter((match) => match.season.toString() === selectedSeason)
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (match) =>
          match.homeTeam.toLowerCase().includes(term) ||
          match.awayTeam.toLowerCase().includes(term) ||
          match.round.toString().includes(term) ||
          (match.venue && match.venue.toLowerCase().includes(term)),
      )
    }

    setFilteredMatches(filtered)
  }, [matches, selectedSeason, searchTerm])

  const generateMatchId = (season: number, round: number, homeTeam: string, awayTeam: string) => {
    return `${season}-r${round}-${homeTeam.toLowerCase().replace(/\s+/g, "")}-vs-${awayTeam.toLowerCase().replace(/\s+/g, "")}`
  }

  const parseCSV = (csvText: string): Partial<Match>[] => {
    const lines = csvText.split("\n").filter((line) => line.trim() !== "")

    // Handle both comma and tab separated values
    const delimiter = csvText.includes("\t") ? "\t" : ","
    const headers = lines[0].split(delimiter).map((h) => h.trim().toLowerCase())

    console.log("CSV Headers found:", headers)

    // Validate headers - check for required keywords
    const requiredKeywords = ["season", "round", "date", "home", "away"]
    const missingHeaders = requiredKeywords.filter((keyword) => !headers.some((header) => header.includes(keyword)))

    if (missingHeaders.length > 0) {
      throw new Error(`Missing required columns containing: ${missingHeaders.join(", ")}`)
    }

    const matches: Partial<Match>[] = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(delimiter).map((v) => v.trim())

      if (values.length < 5) continue

      // Parse the row based on column positions
      const seasonIndex = headers.findIndex((h) => h.includes("season"))
      const roundIndex = headers.findIndex((h) => h.includes("round"))
      const dateIndex = headers.findIndex((h) => h.includes("date"))
      const homeTeamIndex = headers.findIndex((h) => h.includes("home") && h.includes("team"))
      const awayTeamIndex = headers.findIndex((h) => h.includes("away") && h.includes("team"))
      const homeScoreIndex = headers.findIndex((h) => h.includes("home") && h.includes("score"))
      const awayScoreIndex = headers.findIndex((h) => h.includes("away") && h.includes("score"))

      console.log("Column indices:", {
        season: seasonIndex,
        round: roundIndex,
        date: dateIndex,
        homeTeam: homeTeamIndex,
        awayTeam: awayTeamIndex,
        homeScore: homeScoreIndex,
        awayScore: awayScoreIndex,
      })

      const season = Number.parseInt(values[seasonIndex]) || 2025
      const round = Number.parseInt(values[roundIndex]) || 1

      // Convert dd/mm/yyyy to yyyy-mm-dd for storage
      let date = values[dateIndex] || ""
      if (date && date.includes("/")) {
        const [day, month, year] = date.split("/")
        date = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
      }

      const homeTeam = values[homeTeamIndex] || ""
      const awayTeam = values[awayTeamIndex] || ""

      // Parse scores
      let homeScore: number | undefined
      let awayScore: number | undefined

      if (homeScoreIndex >= 0 && values[homeScoreIndex]) {
        homeScore = Number.parseInt(values[homeScoreIndex])
        homeScore = isNaN(homeScore) ? undefined : homeScore
      }

      if (awayScoreIndex >= 0 && values[awayScoreIndex]) {
        awayScore = Number.parseInt(values[awayScoreIndex])
        awayScore = isNaN(awayScore) ? undefined : awayScore
      }

      matches.push({
        season,
        round,
        date,
        homeTeam,
        awayTeam,
        homeScore,
        awayScore,
        hasStats: false,
        venue: "",
      })
    }

    return matches
  }

  const handleBulkUpload = async () => {
    console.log("Upload button clicked", { uploadFile, isUploading })
    if (!uploadFile) {
      console.log("No file selected")
      toast({
        title: "Error",
        description: "Please select a CSV file to upload",
        variant: "destructive",
      })
      return
    }

    try {
      setIsUploading(true)
      setUploadProgress(0)
      setUploadResults({ total: 0, successful: 0, failed: 0, errors: [] })

      const csvText = await uploadFile.text()
      const parsedMatches = parseCSV(csvText)

      const results = {
        total: parsedMatches.length,
        successful: 0,
        failed: 0,
        errors: [] as string[],
      }

      for (let i = 0; i < parsedMatches.length; i++) {
        const match = parsedMatches[i]

        try {
          // Validate required fields
          if (!match.season || !match.round || !match.homeTeam || !match.awayTeam || !match.date) {
            throw new Error(`Row ${i + 2}: Missing required fields`)
          }

          if (match.homeTeam === match.awayTeam) {
            throw new Error(`Row ${i + 2}: Home and away teams cannot be the same`)
          }

          // Generate match ID
          const matchId = generateMatchId(match.season!, match.round!, match.homeTeam!, match.awayTeam!)

          const matchData: Match = {
            id: matchId,
            season: match.season!,
            round: match.round!,
            date: match.date!,
            homeTeam: match.homeTeam!,
            awayTeam: match.awayTeam!,
            venue: match.venue || "",
            homeScore: match.homeScore,
            awayScore: match.awayScore,
            hasStats: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          }

          const matchRef = doc(db, "matches", matchId)
          await setDoc(matchRef, matchData)

          results.successful++
        } catch (error) {
          results.failed++
          results.errors.push(`Row ${i + 2}: ${error.message}`)
        }

        // Update progress
        setUploadProgress(Math.round(((i + 1) / parsedMatches.length) * 100))
      }

      setUploadResults(results)

      // Reload matches to show new data
      await loadMatches()

      toast({
        title: "Upload Complete",
        description: `${results.successful} matches uploaded successfully, ${results.failed} failed`,
        variant: results.failed > 0 ? "destructive" : "default",
      })
    } catch (error) {
      console.error("Error uploading matches:", error)
      toast({
        title: "Upload Error",
        description: error.message || "Failed to upload matches",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleAddMatch = async () => {
    if (!newMatch.season || !newMatch.round || !newMatch.homeTeam || !newMatch.awayTeam || !newMatch.date) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    if (newMatch.homeTeam === newMatch.awayTeam) {
      toast({
        title: "Error",
        description: "Home and away teams must be different.",
        variant: "destructive",
      })
      return
    }

    try {
      setProcessingAction(true)

      const matchId = generateMatchId(newMatch.season!, newMatch.round!, newMatch.homeTeam!, newMatch.awayTeam!)

      const matchData: Match = {
        id: matchId,
        season: newMatch.season!,
        round: newMatch.round!,
        date: newMatch.date!,
        homeTeam: newMatch.homeTeam!,
        awayTeam: newMatch.awayTeam!,
        venue: newMatch.venue || "",
        homeScore: newMatch.homeScore,
        awayScore: newMatch.awayScore,
        hasStats: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      const matchRef = doc(db, "matches", matchId)
      await setDoc(matchRef, matchData)

      setMatches((prev) =>
        [...prev, matchData].sort((a, b) => {
          if (a.season !== b.season) return b.season - a.season
          return a.round - b.round
        }),
      )

      toast({
        title: "Success",
        description: `Match added: ${newMatch.homeTeam} vs ${newMatch.awayTeam}`,
      })

      setIsAddDialogOpen(false)
      setNewMatch({
        season: 2025,
        round: 1,
        date: new Date().toISOString().split("T")[0],
        homeTeam: "",
        awayTeam: "",
        venue: "",
        homeScore: undefined,
        awayScore: undefined,
        hasStats: false,
      })
    } catch (error) {
      console.error("Error adding match:", error)
      toast({
        title: "Error",
        description: "Failed to add match. Please try again.",
        variant: "destructive",
      })
    } finally {
      setProcessingAction(false)
    }
  }

  const handleEditMatch = async () => {
    if (!selectedMatch || !editedMatch) return

    try {
      setProcessingAction(true)

      const updatedMatch = {
        ...selectedMatch,
        ...editedMatch,
        updatedAt: serverTimestamp(),
      }

      const matchRef = doc(db, "matches", selectedMatch.id)
      await updateDoc(matchRef, updatedMatch)

      setMatches((prev) => prev.map((match) => (match.id === selectedMatch.id ? (updatedMatch as Match) : match)))

      toast({
        title: "Success",
        description: "Match updated successfully.",
      })

      setIsEditDialogOpen(false)
      setSelectedMatch(null)
      setEditedMatch({})
    } catch (error) {
      console.error("Error updating match:", error)
      toast({
        title: "Error",
        description: "Failed to update match. Please try again.",
        variant: "destructive",
      })
    } finally {
      setProcessingAction(false)
    }
  }

  const handleDeleteMatch = async () => {
    if (!selectedMatch) return

    try {
      setProcessingAction(true)

      const matchRef = doc(db, "matches", selectedMatch.id)
      await deleteDoc(matchRef)

      setMatches((prev) => prev.filter((match) => match.id !== selectedMatch.id))

      toast({
        title: "Success",
        description: "Match deleted successfully.",
      })

      setIsDeleteDialogOpen(false)
      setSelectedMatch(null)
    } catch (error) {
      console.error("Error deleting match:", error)
      toast({
        title: "Error",
        description: "Failed to delete match. Please try again.",
        variant: "destructive",
      })
    } finally {
      setProcessingAction(false)
    }
  }

  const handleAddStats = (match: Match) => {
    // Navigate to stats upload with match details
    const params = new URLSearchParams({
      matchId: match.id,
      season: match.season.toString(),
      round: match.round.toString(),
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      date: match.date,
      venue: match.venue || "",
    })

    window.location.href = `/admin/stats/upload?${params.toString()}`
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("en-AU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    } catch {
      return dateString
    }
  }

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const img = e.currentTarget

    // If it's already trying the placeholder, don't retry
    if (img.src.includes("placeholder")) {
      return
    }

    // Try SVG placeholder first, then PNG
    if (!img.src.includes(".svg")) {
      img.src = "/images/teams/placeholder.png"
    } else {
      img.src = "/images/teams/placeholder.png"
    }
  }

  const convertDateForInput = (dateString: string) => {
    if (!dateString) return ""
    try {
      const date = new Date(dateString)
      return date.toISOString().split("T")[0]
    } catch {
      return dateString
    }
  }

  const convertDateFromInput = (dateString: string) => {
    return dateString // Keep as yyyy-mm-dd for storage
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Match Management</h1>
            <p className="text-muted-foreground">Create and manage season fixtures and match details</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadMatches} disabled={loading}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button variant="outline" onClick={() => setIsUploadDialogOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Bulk Upload
            </Button>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Match
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search matches..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Select value={selectedSeason} onValueChange={setSelectedSeason}>
              <SelectTrigger>
                <SelectValue placeholder="Select season" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All seasons</SelectItem>
                {availableSeasons.map((season) => (
                  <SelectItem key={season} value={season.toString()}>
                    {season} Season
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2">Loading matches...</span>
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
                    <TableHead>Stats</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMatches.length > 0 ? (
                    filteredMatches.map((match) => (
                      <TableRow key={match.id}>
                        <TableCell>{match.season}</TableCell>
                        <TableCell>Round {match.round}</TableCell>
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
                            : "TBD"}
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
                              <span className="text-green-600 text-sm">Available</span>
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <AlertTriangle className="h-4 w-4 text-amber-500 mr-1" />
                              <span className="text-amber-600 text-sm">Missing</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {!match.hasStats && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleAddStats(match)}
                                className="bg-green-50 text-green-600 hover:bg-green-100"
                              >
                                <Upload className="h-4 w-4 mr-1" />
                                Add Stats
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedMatch(match)
                                setEditedMatch({
                                  season: match.season,
                                  round: match.round,
                                  date: match.date,
                                  homeTeam: match.homeTeam,
                                  awayTeam: match.awayTeam,
                                  venue: match.venue,
                                  homeScore: match.homeScore,
                                  awayScore: match.awayScore,
                                })
                                setIsEditDialogOpen(true)
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
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
                        No matches found. Click "Add Match" to create your first fixture.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>

      {/* Add Match Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Match</DialogTitle>
            <DialogDescription>Create a new fixture for the season</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Season</label>
                <Input
                  type="number"
                  value={newMatch.season || ""}
                  onChange={(e) => setNewMatch({ ...newMatch, season: Number(e.target.value) })}
                  placeholder="2025"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Round</label>
                <Input
                  type="number"
                  value={newMatch.round || ""}
                  onChange={(e) => setNewMatch({ ...newMatch, round: Number(e.target.value) })}
                  placeholder="1"
                  min="1"
                  max="22"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Date</label>
              <Input
                type="date"
                value={convertDateForInput(newMatch.date || "")}
                onChange={(e) => setNewMatch({ ...newMatch, date: convertDateFromInput(e.target.value) })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Home Team</label>
                <Select
                  value={newMatch.homeTeam}
                  onValueChange={(value) => setNewMatch({ ...newMatch, homeTeam: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select home team" />
                  </SelectTrigger>
                  <SelectContent>
                    {TEAMS.map((team) => (
                      <SelectItem key={team} value={team}>
                        {team}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Away Team</label>
                <Select
                  value={newMatch.awayTeam}
                  onValueChange={(value) => setNewMatch({ ...newMatch, awayTeam: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select away team" />
                  </SelectTrigger>
                  <SelectContent>
                    {TEAMS.map((team) => (
                      <SelectItem key={team} value={team}>
                        {team}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Venue (Optional)</label>
              <Input
                value={newMatch.venue || ""}
                onChange={(e) => setNewMatch({ ...newMatch, venue: e.target.value })}
                placeholder="Match venue"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Home Score (Optional)</label>
                <Input
                  type="number"
                  value={newMatch.homeScore || ""}
                  onChange={(e) =>
                    setNewMatch({ ...newMatch, homeScore: e.target.value ? Number(e.target.value) : undefined })
                  }
                  placeholder="0"
                  min="0"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Away Score (Optional)</label>
                <Input
                  type="number"
                  value={newMatch.awayScore || ""}
                  onChange={(e) =>
                    setNewMatch({ ...newMatch, awayScore: e.target.value ? Number(e.target.value) : undefined })
                  }
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={processingAction}>
              Cancel
            </Button>
            <Button onClick={handleAddMatch} disabled={processingAction}>
              {processingAction ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Match"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Match Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Match</DialogTitle>
            <DialogDescription>Update match details</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Season</label>
                <Input
                  type="number"
                  value={editedMatch.season || ""}
                  onChange={(e) => setEditedMatch({ ...editedMatch, season: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Round</label>
                <Input
                  type="number"
                  value={editedMatch.round || ""}
                  onChange={(e) => setEditedMatch({ ...editedMatch, round: Number(e.target.value) })}
                  min="1"
                  max="22"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Date</label>
              <Input
                type="date"
                value={convertDateForInput(editedMatch.date || "")}
                onChange={(e) => setEditedMatch({ ...editedMatch, date: convertDateFromInput(e.target.value) })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Home Team</label>
                <Select
                  value={editedMatch.homeTeam}
                  onValueChange={(value) => setEditedMatch({ ...editedMatch, homeTeam: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TEAMS.map((team) => (
                      <SelectItem key={team} value={team}>
                        {team}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Away Team</label>
                <Select
                  value={editedMatch.awayTeam}
                  onValueChange={(value) => setEditedMatch({ ...editedMatch, awayTeam: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TEAMS.map((team) => (
                      <SelectItem key={team} value={team}>
                        {team}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Venue</label>
              <Input
                value={editedMatch.venue || ""}
                onChange={(e) => setEditedMatch({ ...editedMatch, venue: e.target.value })}
                placeholder="Match venue"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Home Score</label>
                <Input
                  type="number"
                  value={editedMatch.homeScore || ""}
                  onChange={(e) =>
                    setEditedMatch({ ...editedMatch, homeScore: e.target.value ? Number(e.target.value) : undefined })
                  }
                  placeholder="0"
                  min="0"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Away Score</label>
                <Input
                  type="number"
                  value={editedMatch.awayScore || ""}
                  onChange={(e) =>
                    setEditedMatch({ ...editedMatch, awayScore: e.target.value ? Number(e.target.value) : undefined })
                  }
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={processingAction}>
              Cancel
            </Button>
            <Button onClick={handleEditMatch} disabled={processingAction}>
              {processingAction ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Match Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Match</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this match? This action cannot be undone.
              {selectedMatch?.hasStats && (
                <div className="mt-2 text-red-600 font-medium">
                  Warning: This match has statistics that will also be deleted.
                </div>
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

      {/* Bulk Upload Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Bulk Upload Matches</DialogTitle>
            <DialogDescription>
              Upload a CSV or TSV file with match data. Required columns: Season, Round, Date, home team, away team
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">CSV/TSV Format</CardTitle>
                <CardDescription>Your file should have these columns (in any order):</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm font-mono bg-gray-50 p-3 rounded">
                  Season Round Date home team Home Score away team Away Score
                  <br />
                  2025 1 15/03/2025 Airport West 85 Keilor 72
                  <br />
                  2025 1 16/03/2025 Deer Park Strathmore
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  • Home Score and Away Score columns are optional
                  <br />• Date format: DD/MM/YYYY
                  <br />• Team names must match exactly
                  <br />• Supports both comma-separated (CSV) and tab-separated (TSV) files
                </p>
              </CardContent>
            </Card>

            <div>
              <label className="text-sm font-medium">Select CSV/TSV File</label>
              <Input
                type="file"
                accept=".csv,.tsv,.txt"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null
                  console.log("File selected:", file?.name)
                  setUploadFile(file)
                }}
                disabled={isUploading}
              />
            </div>

            {isUploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Uploading matches...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} />
              </div>
            )}

            {uploadResults.total > 0 && !isUploading && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Upload Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div>Total matches processed: {uploadResults.total}</div>
                    <div className="text-green-600">Successful: {uploadResults.successful}</div>
                    <div className="text-red-600">Failed: {uploadResults.failed}</div>

                    {uploadResults.errors.length > 0 && (
                      <div className="mt-3">
                        <div className="font-medium text-red-600 mb-1">Errors:</div>
                        <div className="max-h-32 overflow-y-auto text-xs bg-red-50 p-2 rounded">
                          {uploadResults.errors.map((error, index) => (
                            <div key={index}>{error}</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsUploadDialogOpen(false)
                setUploadFile(null)
                setUploadResults({ total: 0, successful: 0, failed: 0, errors: [] })
                setUploadProgress(0)
              }}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                console.log("Upload button clicked")
                handleBulkUpload()
              }}
              disabled={!uploadFile || isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                "Upload Matches"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
