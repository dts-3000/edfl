"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getClubs, addClubRecord } from "@/lib/firebase/actions"
import { toast } from "sonner"

export default function DebugHistoricalPage() {
  const [clubs, setClubs] = useState<any[]>([])
  const [currentClubs, setCurrentClubs] = useState<any[]>([])
  const [historicalClubs, setHistoricalClubs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadClubs()
  }, [])

  const loadClubs = async () => {
    try {
      const clubsData = await getClubs()
      setClubs(clubsData)

      const current = clubsData.filter((club) => club.current === true)
      const historical = clubsData.filter((club) => club.current === false)

      setCurrentClubs(current)
      setHistoricalClubs(historical)

      console.log("=== CLUB ANALYSIS ===")
      console.log("Total clubs:", clubsData.length)
      console.log("Current clubs:", current.length)
      console.log("Historical clubs:", historical.length)
      console.log(
        "Current clubs:",
        current.map((c) => ({ name: c.name, id: c.id, current: c.current })),
      )
      console.log(
        "Historical clubs:",
        historical.map((c) => ({ name: c.name, id: c.id, current: c.current })),
      )
    } catch (error) {
      console.error("Error loading clubs:", error)
    }
  }

  const testClub = async (club: any, type: "current" | "historical") => {
    setLoading(true)
    try {
      console.log(`=== TESTING ${type.toUpperCase()} CLUB ===`)
      console.log("Club:", club)

      const recordData = {
        type: "premiership" as const,
        year: 2024,
        title: `Test ${type} Premiership`,
        grade: "A Grade",
        description: "Test record for debugging",
      }

      console.log("Record data:", recordData)

      const id = await addClubRecord(club.id, recordData)
      console.log(`✅ ${type} club record added with ID:`, id)
      toast.success(`${type} club record added: ${id}`)
    } catch (error) {
      console.error(`❌ ${type} club error:`, error)
      toast.error(`${type} club failed: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Debug Historical vs Current Clubs</h1>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Club Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">{clubs.length}</div>
                <div className="text-sm text-muted-foreground">Total Clubs</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{currentClubs.length}</div>
                <div className="text-sm text-muted-foreground">Current Clubs</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{historicalClubs.length}</div>
                <div className="text-sm text-muted-foreground">Historical Clubs</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-green-600">Current Clubs (Working)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {currentClubs.map((club) => (
                  <div key={club.id} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <div className="font-medium">{club.name}</div>
                      <div className="text-xs text-muted-foreground">{club.id}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="default">Current</Badge>
                      <Button size="sm" onClick={() => testClub(club, "current")} disabled={loading}>
                        Test
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-blue-600">Historical Clubs (Not Working)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {historicalClubs.map((club) => (
                  <div key={club.id} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <div className="font-medium">{club.name}</div>
                      <div className="text-xs text-muted-foreground">{club.id}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Historical</Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => testClub(club, "historical")}
                        disabled={loading}
                      >
                        Test
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Debugging Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p>
                <strong>1.</strong> Test a current club (should work) ✅
              </p>
              <p>
                <strong>2.</strong> Test a historical club (should fail) ❌
              </p>
              <p>
                <strong>3.</strong> Check console for detailed error messages
              </p>
              <p>
                <strong>4.</strong> Look for permission-denied errors
              </p>
              <p>
                <strong>5.</strong> Check if historical clubs have different document structure
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
