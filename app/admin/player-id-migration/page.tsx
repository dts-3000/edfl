"use client"

import { useState, useEffect } from "react"
import { collection, getDocs, query, where, doc, writeBatch } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { AlertCircle, Upload, RefreshCw } from "lucide-react"
import AdminLayout from "@/components/admin/AdminLayout"

interface MigrationMapping {
  playerName: string
  team: string
  playerId: string
}

export default function PlayerIdMigrationPage() {
  const [loading, setLoading] = useState(false)
  const [mappingText, setMappingText] = useState("")
  const [parsedMappings, setParsedMappings] = useState<MigrationMapping[]>([])
  const [debugInfo, setDebugInfo] = useState<string>("")
  const [migrationStatus, setMigrationStatus] = useState<Record<string, string>>({})

  // Parse the mapping text when it changes
  useEffect(() => {
    try {
      if (!mappingText.trim()) {
        setParsedMappings([])
        return
      }

      const lines = mappingText.trim().split("\n")
      const mappings: MigrationMapping[] = []

      for (const line of lines) {
        const parts = line.split(",").map((part) => part.trim())
        if (parts.length >= 3) {
          mappings.push({
            playerName: parts[0],
            team: parts[1],
            playerId: parts[2],
          })
        }
      }

      setParsedMappings(mappings)
      setDebugInfo(`Parsed ${mappings.length} player ID mappings`)
    } catch (err) {
      console.error("Error parsing mappings:", err)
      setDebugInfo(`Error parsing mappings: ${err}`)
      setParsedMappings([])
    }
  }, [mappingText])

  const runMigration = async () => {
    if (parsedMappings.length === 0) {
      setDebugInfo("No valid mappings to process")
      return
    }

    setLoading(true)
    setDebugInfo("Starting player ID migration...")
    setMigrationStatus({})

    try {
      const statsRef = collection(db, "playerStats")
      const batch = writeBatch(db)
      let batchCount = 0
      let totalUpdated = 0
      const newStatus: Record<string, string> = {}

      for (const mapping of parsedMappings) {
        setDebugInfo((prev) => `${prev}\nProcessing ${mapping.playerName} (${mapping.team})...`)

        // Find all stats for this player+team
        const q = query(statsRef, where("playerName", "==", mapping.playerName), where("team", "==", mapping.team))

        const snapshot = await getDocs(q)

        if (snapshot.empty) {
          newStatus[`${mapping.playerName}-${mapping.team}`] = "No records found"
          continue
        }

        let recordCount = 0

        // Update each record
        for (const docRef of snapshot.docs) {
          batch.update(doc(db, "playerStats", docRef.id), {
            playerId: mapping.playerId,
          })

          recordCount++
          batchCount++

          // Commit batch every 500 updates to avoid hitting limits
          if (batchCount >= 500) {
            await batch.commit()
            totalUpdated += batchCount
            batchCount = 0
          }
        }

        newStatus[`${mapping.playerName}-${mapping.team}`] = `Updated ${recordCount} records`
      }

      // Commit any remaining updates
      if (batchCount > 0) {
        await batch.commit()
        totalUpdated += batchCount
      }

      setMigrationStatus(newStatus)
      setDebugInfo((prev) => `${prev}\nMigration complete. Updated ${totalUpdated} records.`)
    } catch (err) {
      console.error("Error running migration:", err)
      setDebugInfo((prev) => `${prev}\nError: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Player ID Migration Tool</h1>
          <Button onClick={runMigration} disabled={loading || parsedMappings.length === 0}>
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Running Migration...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Run Migration
              </>
            )}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Player ID Mappings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Enter player ID mappings in the format: <code>PlayerName,Team,PlayerID</code> (one per line)
            </p>
            <Textarea
              placeholder="John Smith,Airport West,abc123
Mike Johnson,East Keilor,def456
Tom Wilson,Greenvale,ghi789"
              value={mappingText}
              onChange={(e) => setMappingText(e.target.value)}
              rows={10}
              className="font-mono"
            />

            <div className="mt-4">
              <p className="text-sm font-medium">{parsedMappings.length} valid mappings found</p>
            </div>
          </CardContent>
        </Card>

        {/* Debug Info */}
        {debugInfo && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800 whitespace-pre-line">{debugInfo}</div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Migration Results */}
        {Object.keys(migrationStatus).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Migration Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Player Name</th>
                      <th className="text-left p-2">Team</th>
                      <th className="text-left p-2">Player ID</th>
                      <th className="text-left p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedMappings.map((mapping) => (
                      <tr key={`${mapping.playerName}-${mapping.team}`} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-medium">{mapping.playerName}</td>
                        <td className="p-2">{mapping.team}</td>
                        <td className="p-2 font-mono">{mapping.playerId}</td>
                        <td className="p-2">{migrationStatus[`${mapping.playerName}-${mapping.team}`] || "Pending"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  )
}
