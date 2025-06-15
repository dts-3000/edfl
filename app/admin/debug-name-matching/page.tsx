"use client"

import { useState, useEffect } from "react"
import AdminLayout from "@/components/admin/AdminLayout"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, Search } from "lucide-react"
import { getAllPlayers, generatePlayerIdMapping } from "@/lib/playerRegistry"

interface NameComparison {
  csvName: string
  registryName?: string
  playerId?: string
  status: "exact" | "fuzzy" | "missing"
  similarity?: number
}

export default function DebugNameMatchingPage() {
  const [csvNames, setCsvNames] = useState("")
  const [registryPlayers, setRegistryPlayers] = useState<any[]>([])
  const [playerMapping, setPlayerMapping] = useState<Record<string, string>>({})
  const [comparisons, setComparisons] = useState<NameComparison[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadRegistryData()
  }, [])

  const loadRegistryData = async () => {
    try {
      const players = await getAllPlayers()
      const mapping = await generatePlayerIdMapping()
      setRegistryPlayers(players)
      setPlayerMapping(mapping)
      console.log("Registry players:", players.length)
      console.log("Player mapping keys:", Object.keys(mapping).length)
    } catch (error) {
      console.error("Error loading registry data:", error)
    }
  }

  // Simple string similarity function
  const similarity = (s1: string, s2: string): number => {
    const longer = s1.length > s2.length ? s1 : s2
    const shorter = s1.length > s2.length ? s2 : s1
    const editDistance = levenshteinDistance(longer, shorter)
    return (longer.length - editDistance) / longer.length
  }

  const levenshteinDistance = (str1: string, str2: string): number => {
    const matrix = []
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i]
    }
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j
    }
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
        }
      }
    }
    return matrix[str2.length][str1.length]
  }

  const analyzeNames = () => {
    setLoading(true)

    const names = csvNames
      .split("\n")
      .map((name) => name.trim())
      .filter((name) => name.length > 0)

    const results: NameComparison[] = []

    names.forEach((csvName) => {
      const cleanCsvName = csvName.toLowerCase().trim()

      // Check for exact match in mapping
      if (playerMapping[cleanCsvName]) {
        const player = registryPlayers.find((p) => p.id === playerMapping[cleanCsvName])
        results.push({
          csvName,
          registryName: player?.playerName,
          playerId: player?.id,
          status: "exact",
        })
        return
      }

      // Look for fuzzy matches
      let bestMatch: any = null
      let bestSimilarity = 0

      registryPlayers.forEach((player) => {
        const sim = similarity(cleanCsvName, player.playerName.toLowerCase())
        if (sim > bestSimilarity && sim > 0.8) {
          bestSimilarity = sim
          bestMatch = player
        }
      })

      if (bestMatch) {
        results.push({
          csvName,
          registryName: bestMatch.playerName,
          playerId: bestMatch.id,
          status: "fuzzy",
          similarity: bestSimilarity,
        })
      } else {
        results.push({
          csvName,
          status: "missing",
        })
      }
    })

    setComparisons(results)
    setLoading(false)
  }

  const generateFixedNames = () => {
    const fixedNames = comparisons
      .filter((c) => c.status === "exact" || c.status === "fuzzy")
      .map((c) => c.registryName)
      .join("\n")

    navigator.clipboard.writeText(fixedNames)
    alert("Fixed names copied to clipboard!")
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Debug Name Matching</h1>
          <p className="text-muted-foreground">Compare CSV player names with registry names to find mismatches</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="csv-names">Player Names from CSV (one per line)</Label>
              <Textarea
                id="csv-names"
                value={csvNames}
                onChange={(e) => setCsvNames(e.target.value)}
                placeholder="Brendan Godden&#10;Thai Macumber&#10;Tyson Young&#10;..."
                className="h-64"
              />
            </div>

            <Button onClick={analyzeNames} disabled={loading || !csvNames.trim()}>
              <Search className="mr-2 h-4 w-4" />
              {loading ? "Analyzing..." : "Analyze Names"}
            </Button>
          </div>

          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <h3 className="text-blue-800 font-medium mb-2">Registry Stats</h3>
              <div className="text-sm space-y-1">
                <div>Players in Registry: {registryPlayers.length}</div>
                <div>Mapping Entries: {Object.keys(playerMapping).length}</div>
              </div>
            </div>

            {comparisons.length > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">Analysis Results</h3>
                  <Button size="sm" onClick={generateFixedNames}>
                    Copy Fixed Names
                  </Button>
                </div>

                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="bg-green-50 p-2 rounded text-center">
                    <div className="font-medium text-green-800">
                      {comparisons.filter((c) => c.status === "exact").length}
                    </div>
                    <div className="text-green-600">Exact Matches</div>
                  </div>
                  <div className="bg-yellow-50 p-2 rounded text-center">
                    <div className="font-medium text-yellow-800">
                      {comparisons.filter((c) => c.status === "fuzzy").length}
                    </div>
                    <div className="text-yellow-600">Fuzzy Matches</div>
                  </div>
                  <div className="bg-red-50 p-2 rounded text-center">
                    <div className="font-medium text-red-800">
                      {comparisons.filter((c) => c.status === "missing").length}
                    </div>
                    <div className="text-red-600">Missing</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {comparisons.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Name Comparison Results</h2>

            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>CSV Name</TableHead>
                    <TableHead>Registry Name</TableHead>
                    <TableHead>Player ID</TableHead>
                    <TableHead>Similarity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {comparisons.map((comparison, index) => (
                    <TableRow
                      key={index}
                      className={
                        comparison.status === "exact"
                          ? "bg-green-50"
                          : comparison.status === "fuzzy"
                            ? "bg-yellow-50"
                            : "bg-red-50"
                      }
                    >
                      <TableCell>
                        {comparison.status === "exact" && (
                          <div className="flex items-center text-green-600">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Exact
                          </div>
                        )}
                        {comparison.status === "fuzzy" && (
                          <div className="flex items-center text-yellow-600">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Fuzzy
                          </div>
                        )}
                        {comparison.status === "missing" && (
                          <div className="flex items-center text-red-600">
                            <XCircle className="h-4 w-4 mr-1" />
                            Missing
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-sm">{comparison.csvName}</TableCell>
                      <TableCell className="font-mono text-sm">{comparison.registryName || "-"}</TableCell>
                      <TableCell className="font-mono text-xs">{comparison.playerId || "-"}</TableCell>
                      <TableCell>
                        {comparison.similarity ? `${(comparison.similarity * 100).toFixed(1)}%` : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {comparisons.some((c) => c.status === "fuzzy" || c.status === "missing") && (
              <Alert>
                <AlertDescription>
                  <strong>Next Steps:</strong>
                  <br />
                  1. For fuzzy matches: Check if the registry name is correct
                  <br />
                  2. For missing players: Add them to the registry or fix the CSV names
                  <br />
                  3. Use "Copy Fixed Names" to get the correct names for your CSV
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
