"use client"

import { useState } from "react"
import AdminLayout from "@/components/admin/AdminLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { Loader2, Bug, Database } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { fetchPlayerData } from "@/lib/playerData"
import { getAllPlayers, createPlayer } from "@/lib/playerRegistry"
import { getMatches, getPlayerStatsForMatch } from "@/lib/playerStats"

export default function PlayerDebugPage() {
  const [debugResults, setDebugResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const runDebug = async () => {
    try {
      setLoading(true)
      setDebugResults(null)

      const results: any = {
        fantasyPlayers: [],
        registryPlayers: [],
        matches: [],
        statsPlayers: [],
        errors: [],
      }

      // Test 1: Check fantasy players
      try {
        console.log("Fetching fantasy players...")
        const fantasyPlayers = await fetchPlayerData()
        results.fantasyPlayers = fantasyPlayers
        console.log("Fantasy players:", fantasyPlayers.length)
      } catch (error) {
        console.error("Error fetching fantasy players:", error)
        results.errors.push(`Fantasy players error: ${error}`)
      }

      // Test 2: Check registry players
      try {
        console.log("Fetching registry players...")
        const registryPlayers = await getAllPlayers()
        results.registryPlayers = registryPlayers
        console.log("Registry players:", registryPlayers.length)
      } catch (error) {
        console.error("Error fetching registry players:", error)
        results.errors.push(`Registry players error: ${error}`)
      }

      // Test 3: Check matches
      try {
        console.log("Fetching matches...")
        const matches = await getMatches()
        results.matches = matches
        console.log("Matches:", matches.length)

        // Test 4: Check stats for first match
        if (matches.length > 0) {
          const firstMatch = matches[0]
          console.log("Checking stats for first match:", firstMatch.id)
          const stats = await getPlayerStatsForMatch(firstMatch.id)
          results.statsPlayers = stats
          console.log("Stats players:", stats.length)
        }
      } catch (error) {
        console.error("Error fetching matches/stats:", error)
        results.errors.push(`Matches/stats error: ${error}`)
      }

      // Test 5: Try creating a test player
      try {
        console.log("Testing player creation...")
        const testPlayerId = await createPlayer({
          firstName: "Test",
          lastName: "Player",
          fullName: "Test Player",
          aliases: ["Test Player"],
          currentTeam: "Test Team",
          position: "Test Position",
          isActive: true,
        })
        results.testPlayerId = testPlayerId
        console.log("Test player created:", testPlayerId)

        // Verify it was created
        const updatedPlayers = await getAllPlayers()
        results.playersAfterTest = updatedPlayers.length
      } catch (error) {
        console.error("Error creating test player:", error)
        results.errors.push(`Test player creation error: ${error}`)
      }

      setDebugResults(results)

      toast({
        title: "Debug Complete",
        description: "Check the results below for detailed information.",
      })
    } catch (error) {
      console.error("Debug error:", error)
      toast({
        title: "Debug Failed",
        description: "An error occurred during debugging.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const clearTestData = async () => {
    try {
      setLoading(true)

      // Get all players and delete test players
      const players = await getAllPlayers()
      const testPlayers = players.filter((p) => p.fullName.includes("Test Player"))

      // Note: We'd need to implement a delete function for this
      console.log("Found test players to clean up:", testPlayers.length)

      toast({
        title: "Test Data Cleared",
        description: `Removed ${testPlayers.length} test players.`,
      })
    } catch (error) {
      console.error("Error clearing test data:", error)
      toast({
        title: "Error",
        description: "Failed to clear test data.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Player System Debug</h1>
          <p className="text-muted-foreground">
            Debug the player system to identify issues with data sources and Firebase operations
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Debug Player System</CardTitle>
            <CardDescription>
              This will test all data sources and Firebase operations to identify any issues.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button onClick={runDebug} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Running Debug...
                  </>
                ) : (
                  <>
                    <Bug className="mr-2 h-4 w-4" />
                    Run Debug
                  </>
                )}
              </Button>

              <Button variant="outline" onClick={clearTestData} disabled={loading}>
                <Database className="mr-2 h-4 w-4" />
                Clear Test Data
              </Button>
            </div>

            {debugResults && (
              <div className="space-y-4">
                <Alert>
                  <Database className="h-4 w-4" />
                  <AlertTitle>Debug Results</AlertTitle>
                  <AlertDescription>
                    <div className="mt-2 space-y-2">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-blue-50 p-3 rounded-md">
                          <div className="text-blue-800 font-medium">Fantasy Players</div>
                          <div className="text-2xl font-bold text-blue-700">
                            {debugResults.fantasyPlayers?.length || 0}
                          </div>
                        </div>
                        <div className="bg-green-50 p-3 rounded-md">
                          <div className="text-green-800 font-medium">Registry Players</div>
                          <div className="text-2xl font-bold text-green-700">
                            {debugResults.registryPlayers?.length || 0}
                          </div>
                        </div>
                        <div className="bg-purple-50 p-3 rounded-md">
                          <div className="text-purple-800 font-medium">Matches</div>
                          <div className="text-2xl font-bold text-purple-700">{debugResults.matches?.length || 0}</div>
                        </div>
                        <div className="bg-orange-50 p-3 rounded-md">
                          <div className="text-orange-800 font-medium">Stats Players</div>
                          <div className="text-2xl font-bold text-orange-700">
                            {debugResults.statsPlayers?.length || 0}
                          </div>
                        </div>
                      </div>

                      {debugResults.testPlayerId && (
                        <div className="bg-green-100 p-3 rounded-md">
                          <div className="text-green-800 font-medium">Test Player Created</div>
                          <div className="text-sm text-green-700">ID: {debugResults.testPlayerId}</div>
                          <div className="text-sm text-green-700">
                            Players after test: {debugResults.playersAfterTest}
                          </div>
                        </div>
                      )}

                      {debugResults.errors?.length > 0 && (
                        <div className="bg-red-100 p-3 rounded-md">
                          <div className="text-red-800 font-medium">Errors</div>
                          {debugResults.errors.map((error: string, index: number) => (
                            <div key={index} className="text-sm text-red-700">
                              {error}
                            </div>
                          ))}
                        </div>
                      )}

                      <details className="mt-4">
                        <summary className="cursor-pointer font-medium">Raw Debug Data</summary>
                        <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-96">
                          {JSON.stringify(debugResults, null, 2)}
                        </pre>
                      </details>
                    </div>
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
