"use client"

import { useState } from "react"
import AdminLayout from "@/components/admin/AdminLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { Loader2, Database, UserPlus, RefreshCw, Bug } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { fetchPlayerData } from "@/lib/playerData"
import { getAllPlayers, createPlayer } from "@/lib/playerRegistry"
import { getMatches, getPlayerStatsForMatch, updatePlayerStatsWithIds } from "@/lib/playerStats"

export default function PlayerMigrationPage() {
  const [migrationStatus, setMigrationStatus] = useState({
    running: false,
    step: "",
    progress: 0,
    totalPlayers: 0,
    processedPlayers: 0,
    newPlayers: 0,
    playersWithIds: 0,
    errors: 0,
    debugInfo: [] as string[],
  })
  const [results, setResults] = useState<{
    success: boolean
    message: string
    details?: string
  } | null>(null)

  const addDebugInfo = (info: string) => {
    console.log(info)
    setMigrationStatus((prev) => ({
      ...prev,
      debugInfo: [...prev.debugInfo, info],
    }))
  }

  const runMigration = async () => {
    try {
      setMigrationStatus({
        running: true,
        step: "Starting migration...",
        progress: 5,
        totalPlayers: 0,
        processedPlayers: 0,
        newPlayers: 0,
        playersWithIds: 0,
        errors: 0,
        debugInfo: [],
      })
      setResults(null)

      addDebugInfo("Migration started")

      // Step 1: Get all existing players from the registry
      addDebugInfo("Loading existing players from registry...")
      setMigrationStatus((prev) => ({
        ...prev,
        step: "Loading existing players from registry",
        progress: 10,
      }))

      const existingPlayers = await getAllPlayers()
      const existingPlayerNames = new Set(existingPlayers.map((p) => p.fullName.toLowerCase()))

      addDebugInfo(`Found ${existingPlayers.length} existing players in registry`)

      // Step 2: Get all fantasy players
      addDebugInfo("Loading fantasy players...")
      setMigrationStatus((prev) => ({
        ...prev,
        step: "Loading fantasy players",
        progress: 20,
      }))

      let fantasyPlayers: any[] = []
      try {
        fantasyPlayers = await fetchPlayerData()
        addDebugInfo(`Found ${fantasyPlayers.length} fantasy players`)
      } catch (error) {
        addDebugInfo(`Error loading fantasy players: ${error}`)
        console.error("Error loading fantasy players:", error)
      }

      // Step 3: Get all players from match statistics
      addDebugInfo("Loading match statistics players...")
      setMigrationStatus((prev) => ({
        ...prev,
        step: "Loading match statistics players",
        progress: 30,
      }))

      const matches = await getMatches()
      addDebugInfo(`Found ${matches.length} matches`)

      const statsPlayers = new Set<string>()
      const playerTeams: Record<string, string> = {}

      // Process each match to extract players
      for (const match of matches) {
        if (match.hasStats) {
          try {
            const matchStats = await getPlayerStatsForMatch(match.id)
            addDebugInfo(`Match ${match.id}: ${matchStats.length} stats records`)

            // Only process "All" quarter stats to avoid duplicates
            const allQuarterStats = matchStats.filter((stat) => stat.quarter === "All")
            addDebugInfo(`Match ${match.id}: ${allQuarterStats.length} 'All' quarter stats`)

            allQuarterStats.forEach((stat) => {
              const cleanName = stat.playerName.trim()
              if (cleanName) {
                statsPlayers.add(cleanName.toLowerCase())
                playerTeams[cleanName.toLowerCase()] = stat.team
              }
            })
          } catch (error) {
            addDebugInfo(`Error loading stats for match ${match.id}: ${error}`)
          }
        }
      }

      addDebugInfo(`Found ${statsPlayers.size} unique players from match statistics`)

      // Combine all unique players
      const fantasyPlayerNames = fantasyPlayers.map((p) => p.name?.toLowerCase()).filter(Boolean)
      const allPlayerNames = new Set([...Array.from(statsPlayers), ...fantasyPlayerNames])

      addDebugInfo(`Total unique players to process: ${allPlayerNames.size}`)

      setMigrationStatus((prev) => ({
        ...prev,
        step: "Creating player registry entries",
        progress: 40,
        totalPlayers: allPlayerNames.size,
      }))

      // Step 4: Create registry entries for players that don't exist
      let newPlayers = 0
      let errors = 0
      let processed = 0

      for (const playerName of allPlayerNames) {
        try {
          processed++

          // Skip if player already exists in registry
          if (existingPlayerNames.has(playerName)) {
            addDebugInfo(`Player already exists: ${playerName}`)
            setMigrationStatus((prev) => ({
              ...prev,
              processedPlayers: processed,
              playersWithIds: prev.playersWithIds + 1,
              progress: 40 + Math.floor((processed / allPlayerNames.size) * 50),
            }))
            continue
          }

          // Parse name into first and last name
          const nameParts = playerName.split(" ").filter(Boolean)
          if (nameParts.length === 0) {
            addDebugInfo(`Skipping empty name: ${playerName}`)
            continue
          }

          const firstName = nameParts[0]
          const lastName = nameParts.slice(1).join(" ") || ""

          // Get team from stats if available
          const team = playerTeams[playerName] || ""

          addDebugInfo(`Creating player: ${firstName} ${lastName} (${team})`)

          // Create new player in registry
          const playerId = await createPlayer({
            firstName,
            lastName,
            fullName: playerName,
            aliases: [playerName],
            currentTeam: team,
            position: "",
            isActive: true,
          })

          addDebugInfo(`Created player with ID: ${playerId}`)
          newPlayers++

          setMigrationStatus((prev) => ({
            ...prev,
            processedPlayers: processed,
            newPlayers,
            progress: 40 + Math.floor((processed / allPlayerNames.size) * 50),
          }))
        } catch (error) {
          console.error(`Error creating player ${playerName}:`, error)
          addDebugInfo(`Error creating player ${playerName}: ${error}`)
          errors++

          setMigrationStatus((prev) => ({
            ...prev,
            processedPlayers: processed,
            errors,
            progress: 40 + Math.floor((processed / allPlayerNames.size) * 50),
          }))
        }
      }

      setMigrationStatus((prev) => ({
        ...prev,
        step: "Updating match statistics with player IDs",
        progress: 90,
      }))

      // Step 5: Update match statistics with player IDs
      let updatedMatches = 0
      try {
        updatedMatches = await updatePlayerStatsWithIds()
        addDebugInfo(`Updated ${updatedMatches} matches with player IDs`)
      } catch (error) {
        addDebugInfo(`Error updating match statistics: ${error}`)
      }

      setMigrationStatus((prev) => ({
        ...prev,
        step: "Migration complete",
        progress: 100,
        running: false,
      }))

      const finalResults = {
        success: true,
        message: "Player migration completed successfully",
        details: `
          • ${processed} players processed
          • ${newPlayers} new players added to registry
          • ${existingPlayerNames.size} players already had IDs
          • ${updatedMatches} matches updated with player IDs
          • ${errors} errors encountered
        `,
      }

      setResults(finalResults)

      toast({
        title: "Migration Complete",
        description: `Successfully migrated ${newPlayers} players to the registry.`,
      })
    } catch (error) {
      console.error("Migration error:", error)
      addDebugInfo(`Migration failed: ${error}`)

      setMigrationStatus((prev) => ({
        ...prev,
        running: false,
      }))

      setResults({
        success: false,
        message: "Migration failed",
        details: error instanceof Error ? error.message : "Unknown error occurred",
      })

      toast({
        title: "Migration Failed",
        description: "An error occurred during migration. Check the debug info for details.",
        variant: "destructive",
      })
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Player ID Migration</h1>
            <p className="text-muted-foreground">
              Migrate existing players to the player registry and update match statistics with player IDs
            </p>
          </div>
          <Button variant="outline" onClick={() => window.open("/admin/players/debug", "_blank")}>
            <Bug className="mr-2 h-4 w-4" />
            Debug System
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Player Migration Utility</CardTitle>
            <CardDescription>
              This utility will scan all existing player data and ensure each player has a unique ID in the registry.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <h3 className="text-blue-800 font-medium mb-2">What This Will Do</h3>
              <ul className="list-disc pl-5 space-y-1 text-blue-700">
                <li>Scan all fantasy players and match statistics for player names</li>
                <li>Create registry entries for players that don't have IDs</li>
                <li>Update match statistics with player IDs</li>
                <li>Ensure all players have a unique ID for cross-system tracking</li>
              </ul>
            </div>

            {migrationStatus.running && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{migrationStatus.step}</span>
                  <span>
                    {migrationStatus.processedPlayers} / {migrationStatus.totalPlayers || "?"}
                  </span>
                </div>
                <Progress value={migrationStatus.progress} className="h-2" />
                <div className="grid grid-cols-2 gap-2 mt-4">
                  <div className="bg-green-50 p-3 rounded-md">
                    <div className="text-green-800 font-medium">New Players</div>
                    <div className="text-2xl font-bold text-green-700">{migrationStatus.newPlayers}</div>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-md">
                    <div className="text-blue-800 font-medium">Players with IDs</div>
                    <div className="text-2xl font-bold text-blue-700">{migrationStatus.playersWithIds}</div>
                  </div>
                </div>
              </div>
            )}

            {migrationStatus.debugInfo.length > 0 && (
              <details className="mt-4">
                <summary className="cursor-pointer font-medium">Debug Information</summary>
                <div className="mt-2 bg-gray-100 p-3 rounded-md max-h-64 overflow-y-auto">
                  {migrationStatus.debugInfo.map((info, index) => (
                    <div key={index} className="text-sm text-gray-700">
                      {info}
                    </div>
                  ))}
                </div>
              </details>
            )}

            {results && (
              <Alert variant={results.success ? "default" : "destructive"}>
                <Database className="h-4 w-4" />
                <AlertTitle>{results.message}</AlertTitle>
                <AlertDescription>
                  <pre className="mt-2 whitespace-pre-wrap text-sm">{results.details}</pre>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={runMigration} disabled={migrationStatus.running} className="w-full" size="lg">
              {migrationStatus.running ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running Migration...
                </>
              ) : results && results.success ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Run Migration Again
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Start Player Migration
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </AdminLayout>
  )
}
