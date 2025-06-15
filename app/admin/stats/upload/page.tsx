"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import AdminLayout from "@/components/admin/AdminLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Upload, FileUp, Info, ArrowLeft, CheckCircle, XCircle } from "lucide-react"
import { initializeApp } from "firebase/app"
import { getFirestore, collection, doc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore"
import { generatePlayerIdMapping } from "@/lib/playerRegistry"

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

interface PlayerStat {
  id?: string
  season: number
  round: number
  team: string
  playerNumber: string
  playerName: string
  playerId?: string
  quarter: string
  kicks: number
  handballs: number
  marks: number
  tackles: number
  hitOuts: number
  goals: number
  behinds: number
  fantasyPoints: number
  matchId: string
}

interface ValidationResult {
  isValid: boolean
  mappedPlayers: string[]
  unmappedPlayers: string[]
  totalStats: number
  validStats: number
}

export default function StatsUploadPage() {
  const searchParams = useSearchParams()
  const [file, setFile] = useState<File | null>(null)
  const [csvData, setCsvData] = useState<string>("")
  const [previewData, setPreviewData] = useState<PlayerStat[]>([])
  const [uploading, setUploading] = useState(false)
  const [activeTab, setActiveTab] = useState("file-upload")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [playerMapping, setPlayerMapping] = useState<Record<string, string>>({})
  const [mappingLoaded, setMappingLoaded] = useState(false)
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)

  // Match details from URL params
  const [matchDetails, setMatchDetails] = useState({
    matchId: "",
    season: 2025,
    round: 1,
    homeTeam: "",
    awayTeam: "",
    date: "",
    venue: "",
  })

  // Load match details from URL parameters
  useEffect(() => {
    const matchId = searchParams.get("matchId")
    const season = searchParams.get("season")
    const round = searchParams.get("round")
    const homeTeam = searchParams.get("homeTeam")
    const awayTeam = searchParams.get("awayTeam")
    const date = searchParams.get("date")
    const venue = searchParams.get("venue")

    if (matchId && season && round && homeTeam && awayTeam) {
      setMatchDetails({
        matchId: decodeURIComponent(matchId),
        season: Number(season),
        round: Number(round),
        homeTeam: decodeURIComponent(homeTeam),
        awayTeam: decodeURIComponent(awayTeam),
        date: date ? decodeURIComponent(date) : "",
        venue: venue ? decodeURIComponent(venue) : "",
      })
    }
  }, [searchParams])

  const loadPlayerMapping = async () => {
    try {
      const mapping = await generatePlayerIdMapping()
      setPlayerMapping(mapping)
      setMappingLoaded(true)
      console.log("Player mapping loaded:", Object.keys(mapping).length, "players")
    } catch (error) {
      console.error("Error loading player mapping:", error)
    }
  }

  useEffect(() => {
    loadPlayerMapping()
  }, [])

  const validatePlayerMapping = (stats: PlayerStat[]): ValidationResult => {
    const mappedPlayers = new Set<string>()
    const unmappedPlayers = new Set<string>()
    let validStats = 0

    stats.forEach((stat) => {
      const playerId = playerMapping[stat.playerName.toLowerCase()]
      if (playerId) {
        mappedPlayers.add(stat.playerName)
        validStats++
      } else {
        unmappedPlayers.add(stat.playerName)
      }
    })

    return {
      isValid: unmappedPlayers.size === 0,
      mappedPlayers: Array.from(mappedPlayers),
      unmappedPlayers: Array.from(unmappedPlayers),
      totalStats: stats.length,
      validStats,
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      const reader = new FileReader()
      reader.onload = (event) => {
        const csvText = event.target?.result as string
        setCsvData(csvText)
        const parsedData = parseStatsCsv(csvText)
        setPreviewData(parsedData.slice(0, 10))

        // Validate player mapping
        if (mappingLoaded) {
          const validation = validatePlayerMapping(parsedData)
          setValidationResult(validation)
        }
      }
      reader.readAsText(selectedFile)
    }
  }

  const handleCsvContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value
    setCsvData(text)
    const parsedData = parseStatsCsv(text)
    setPreviewData(parsedData.slice(0, 10))

    // Validate player mapping
    if (mappingLoaded) {
      const validation = validatePlayerMapping(parsedData)
      setValidationResult(validation)
    }
  }

  const parseStatsCsv = (csvText: string): PlayerStat[] => {
    const lines = csvText.split("\n").filter((line) => line.trim() !== "")
    if (lines.length === 0) return []

    const headers = lines[0]
      .toLowerCase()
      .split(",")
      .map((h) => h.trim())

    // Find column indices
    const teamIndex = headers.findIndex((h) => h === "team")
    const playerNumberIndex = headers.findIndex((h) => h === "player number" || h === "number")
    const playerNameIndex = headers.findIndex((h) => h === "player name" || h === "playername" || h === "name")
    const quarterIndex = headers.findIndex((h) => h === "quarter")
    const kicksIndex = headers.findIndex((h) => h === "kicks")
    const handballsIndex = headers.findIndex((h) => h === "handballs")
    const marksIndex = headers.findIndex((h) => h === "marks")
    const tacklesIndex = headers.findIndex((h) => h === "tackles")
    const hitOutsIndex = headers.findIndex((h) => h === "hit outs" || h === "hitouts")
    const goalsIndex = headers.findIndex((h) => h === "goals")
    const behindsIndex = headers.findIndex((h) => h === "behinds")
    const fantasyPointsIndex = headers.findIndex((h) => h === "fantasy points" || h === "fp" || h === "fantasypoints")

    const stats: PlayerStat[] = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim())

      if (values.length < Math.max(teamIndex, playerNameIndex, quarterIndex) + 1) {
        console.warn(`Skipping invalid line: ${lines[i]}`)
        continue
      }

      const cleanPlayerName = values[playerNameIndex]
        .replace(/[^\w\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim()

      // Get player ID from registry mapping
      const playerId = playerMapping[cleanPlayerName.toLowerCase()]

      let quarterValue = values[quarterIndex]
      if (quarterValue.toLowerCase() === "all") {
        quarterValue = "All"
      }

      const stat: PlayerStat = {
        season: matchDetails.season,
        round: matchDetails.round,
        team: values[teamIndex],
        playerNumber: values[playerNumberIndex] || "",
        playerName: cleanPlayerName,
        playerId: playerId, // Use the mapped player ID
        quarter: quarterValue,
        kicks: Number.parseInt(values[kicksIndex]) || 0,
        handballs: Number.parseInt(values[handballsIndex]) || 0,
        marks: Number.parseInt(values[marksIndex]) || 0,
        tackles: Number.parseInt(values[tacklesIndex]) || 0,
        hitOuts: Number.parseInt(values[hitOutsIndex]) || 0,
        goals: Number.parseInt(values[goalsIndex]) || 0,
        behinds: Number.parseInt(values[behindsIndex]) || 0,
        fantasyPoints: Number.parseInt(values[fantasyPointsIndex]) || 0,
        matchId: matchDetails.matchId,
      }

      stats.push(stat)
    }

    return stats
  }

  const handleUpload = async () => {
    if (!csvData || !matchDetails.matchId) {
      toast({
        title: "Missing Information",
        description: "Please upload a CSV file and ensure match details are loaded.",
        variant: "destructive",
      })
      return
    }

    if (!mappingLoaded) {
      toast({
        title: "Player Mapping Not Ready",
        description: "Please wait for player mapping to load.",
        variant: "destructive",
      })
      return
    }

    if (!validationResult?.isValid) {
      toast({
        title: "Validation Failed",
        description: "Please fix the unmapped players before uploading.",
        variant: "destructive",
      })
      return
    }

    try {
      setUploading(true)

      const parsedStats = parseStatsCsv(csvData)
      if (parsedStats.length === 0) {
        toast({
          title: "No Data",
          description: "No valid player statistics found in the CSV file.",
          variant: "destructive",
        })
        return
      }

      // Initialize Firebase
      const app = initializeApp(firebaseConfig)
      const db = getFirestore(app)

      // Save player stats
      const statsCollection = collection(db, "playerStats")
      let savedStats = 0

      for (const stat of parsedStats) {
        const statDocRef = doc(statsCollection)
        await setDoc(statDocRef, {
          ...stat,
          id: statDocRef.id,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
        savedStats++
      }

      // Update match to mark it as having stats
      const matchRef = doc(db, "matches", matchDetails.matchId)
      await updateDoc(matchRef, {
        hasStats: true,
        updatedAt: serverTimestamp(),
      })

      toast({
        title: "Upload Successful",
        description: `Successfully uploaded ${savedStats} player statistics for ${matchDetails.homeTeam} vs ${matchDetails.awayTeam}`,
      })

      // Reset form
      setCsvData("")
      setPreviewData([])
      setFile(null)
      setValidationResult(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }

      // Redirect back to matches page
      setTimeout(() => {
        window.location.href = "/admin/matches"
      }, 2000)
    } catch (error: any) {
      console.error("Error uploading stats:", error)
      toast({
        title: "Upload Failed",
        description: `Failed to upload statistics: ${error.message}`,
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const generateTemplate = () => {
    if (!matchDetails.homeTeam || !matchDetails.awayTeam) {
      toast({
        title: "Missing Information",
        description: "Match details are required to generate a template.",
        variant: "destructive",
      })
      return
    }

    const headers = "playerName,team,quarter,kicks,handballs,marks,tackles,hitOuts,goals,behinds,fantasyPoints"

    const homeTeamRows = [
      `Player 1,${matchDetails.homeTeam},1,5,3,2,1,0,0,0,8`,
      `Player 1,${matchDetails.homeTeam},2,3,4,1,2,0,1,0,12`,
      `Player 1,${matchDetails.homeTeam},3,2,2,1,1,0,0,1,7`,
      `Player 1,${matchDetails.homeTeam},4,4,1,3,0,0,0,0,8`,
      `Player 1,${matchDetails.homeTeam},All,14,10,7,4,0,1,1,35`,
    ]

    const awayTeamRows = [
      `Player 2,${matchDetails.awayTeam},1,3,2,1,2,0,0,0,6`,
      `Player 2,${matchDetails.awayTeam},2,4,3,2,1,0,1,0,11`,
      `Player 2,${matchDetails.awayTeam},3,2,1,0,3,0,0,0,6`,
      `Player 2,${matchDetails.awayTeam},4,1,4,1,1,0,0,1,8`,
      `Player 2,${matchDetails.awayTeam},All,10,10,4,7,0,1,1,31`,
    ]

    const template = [headers, ...homeTeamRows, ...awayTeamRows].join("\n")
    setCsvData(template)
    setActiveTab("manual-entry")

    const parsedData = parseStatsCsv(template)
    setPreviewData(parsedData.slice(0, 10))
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Upload Match Statistics</h1>
            <p className="text-muted-foreground">
              Upload player statistics for {matchDetails.homeTeam} vs {matchDetails.awayTeam}
            </p>
          </div>
          <Button variant="outline" onClick={() => (window.location.href = "/admin/matches")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Matches
          </Button>
        </div>

        {/* Match Details Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <h3 className="text-blue-800 font-medium mb-2">Match Details</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium">Season:</span> {matchDetails.season}
            </div>
            <div>
              <span className="font-medium">Round:</span> {matchDetails.round}
            </div>
            <div>
              <span className="font-medium">Home:</span> {matchDetails.homeTeam}
            </div>
            <div>
              <span className="font-medium">Away:</span> {matchDetails.awayTeam}
            </div>
          </div>
          <div className="mt-2 text-xs text-blue-600">
            <span className="font-medium">Match ID:</span> {matchDetails.matchId}
          </div>
        </div>

        {/* Player Mapping Status */}
        {mappingLoaded && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              <span className="text-green-800 font-medium">
                Player Registry Loaded ({Object.keys(playerMapping).length} players mapped)
              </span>
            </div>
          </div>
        )}

        {/* Validation Results */}
        {validationResult && (
          <div className="space-y-4">
            {validationResult.isValid ? (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>✅ All Players Mapped Successfully!</strong>
                  <br />
                  {validationResult.validStats} stats ready for upload.
                  <br />
                  Mapped players: {validationResult.mappedPlayers.join(", ")}
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="border-red-200 bg-red-50">
                <XCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <strong>❌ Missing Players Found!</strong>
                  <br />
                  {validationResult.unmappedPlayers.length} players not found in registry:
                  <br />
                  <strong>{validationResult.unmappedPlayers.join(", ")}</strong>
                  <br />
                  <br />
                  Please add these players to the Player Registry first, then refresh this page.
                  <br />
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => window.open("/admin/players/registry", "_blank")}
                  >
                    Open Player Registry
                  </Button>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <div className="space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="file-upload">File Upload</TabsTrigger>
              <TabsTrigger value="manual-entry">Manual Entry</TabsTrigger>
            </TabsList>
            <TabsContent value="file-upload" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="file">Statistics File (CSV)</Label>
                <Input ref={fileInputRef} id="file" type="file" accept=".csv" onChange={handleFileChange} />
              </div>
            </TabsContent>
            <TabsContent value="manual-entry" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="csv-content">CSV Content</Label>
                <Textarea
                  id="csv-content"
                  value={csvData}
                  onChange={handleCsvContentChange}
                  className="font-mono text-sm h-64"
                  placeholder="Enter CSV content here..."
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex gap-2">
            <Button onClick={generateTemplate} variant="outline" className="flex-1">
              <FileUp className="mr-2 h-4 w-4" />
              Generate CSV Template
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!csvData || !matchDetails.matchId || uploading || !validationResult?.isValid}
              className="flex-1"
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Statistics
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Preview Table */}
        {previewData.length > 0 && (
          <div className="mt-4">
            <h2 className="text-lg font-semibold mb-2">Data Preview</h2>
            <div className="rounded-md border overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Player</TableHead>
                      <TableHead>Team</TableHead>
                      <TableHead>Quarter</TableHead>
                      <TableHead>Kicks</TableHead>
                      <TableHead>Handballs</TableHead>
                      <TableHead>Marks</TableHead>
                      <TableHead>Tackles</TableHead>
                      <TableHead>Goals</TableHead>
                      <TableHead>Behinds</TableHead>
                      <TableHead>Fantasy</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewData.map((stat, index) => {
                      const hasPlayerId = playerMapping[stat.playerName.toLowerCase()]
                      return (
                        <TableRow key={index} className={hasPlayerId ? "" : "bg-red-50"}>
                          <TableCell className="font-medium">
                            <div className="flex items-center">
                              {hasPlayerId ? (
                                <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-600 mr-2" />
                              )}
                              {stat.playerName}
                            </div>
                          </TableCell>
                          <TableCell>{stat.team}</TableCell>
                          <TableCell>{stat.quarter}</TableCell>
                          <TableCell>{stat.kicks}</TableCell>
                          <TableCell>{stat.handballs}</TableCell>
                          <TableCell>{stat.marks}</TableCell>
                          <TableCell>{stat.tackles}</TableCell>
                          <TableCell>{stat.goals}</TableCell>
                          <TableCell>{stat.behinds}</TableCell>
                          <TableCell>{stat.fantasyPoints}</TableCell>
                          <TableCell>
                            {hasPlayerId ? (
                              <span className="text-green-600 text-sm">✅ Mapped</span>
                            ) : (
                              <span className="text-red-600 text-sm">❌ Missing</span>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}

        {/* CSV Format Guide */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <h3 className="text-blue-800 font-medium mb-2 flex items-center">
            <Info className="h-5 w-5 mr-2" />
            Required CSV Format
          </h3>
          <p className="mb-2">Your CSV file must include these columns:</p>
          <div className="text-sm font-mono bg-white p-2 rounded border">
            playerName,team,quarter,kicks,handballs,marks,tackles,hitOuts,goals,behinds,fantasyPoints
          </div>
          <div className="mt-2 text-sm text-blue-700">
            <p>• Each player should have 5 rows: quarters 1-4 and "All" for totals</p>
            <p>• Player names must match exactly with Player Registry</p>
            <p>• Quarter values: 1, 2, 3, 4, or "All"</p>
            <p>• System will validate all players before allowing upload</p>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
