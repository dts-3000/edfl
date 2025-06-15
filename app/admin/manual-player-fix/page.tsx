"use client"

import { useState } from "react"
import { doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, CheckCircle } from "lucide-react"
import AdminLayout from "@/components/admin/AdminLayout"

export default function ManualPlayerFixPage() {
  const [updating, setUpdating] = useState(false)
  const [debugInfo, setDebugInfo] = useState<string>("")
  const [success, setSuccess] = useState(false)

  const fixMatthewHanson = async () => {
    setUpdating(true)
    setDebugInfo("Updating Matthew Hanson...")

    try {
      // Update Matthew Hanson's player record with the correct registryId
      const playerRef = doc(db, "players", "36")
      await updateDoc(playerRef, {
        registryId: "2z1eJR5dmXQSIirUQHDF",
        updatedAt: new Date(),
      })

      setDebugInfo("Successfully updated Matthew Hanson with registryId: 2z1eJR5dmXQSIirUQHDF")
      setSuccess(true)
    } catch (err) {
      console.error("Error updating Matthew Hanson:", err)
      setDebugInfo(`Error: ${err}`)
    } finally {
      setUpdating(false)
    }
  }

  const fixAllFuzzyMatches = async () => {
    setUpdating(true)
    setDebugInfo("Updating all fuzzy matches...")

    const fuzzyMatches = [
      { playerId: "12", registryId: "WqFzJwKjmJIF9lrydst5", name: "Samuel Paea" },
      { playerId: "2", registryId: "9RQ2gZYdU32K6HiPVsFZ", name: "Matthew Williamson" },
      { playerId: "25", registryId: "2EXDgE7S5t10MdbIPRbK", name: "Ned Gentile" },
      { playerId: "3", registryId: "18rGLtE4eYuFva9sQWGg", name: "Lachlan Riley" },
      { playerId: "34", registryId: "3MFcPyeGMx3ss13eVqZW", name: "Tyson Young" },
      { playerId: "36", registryId: "2z1eJR5dmXQSIirUQHDF", name: "Matthew Hanson" },
      { playerId: "38", registryId: "0T7C4RDL1vmbuFNFwbXE", name: "Max Rider" },
      { playerId: "4", registryId: "1Et5io75sE0fHOsCju1o", name: "Callum Moore" },
      { playerId: "41", registryId: "1AByYEtsnEbiF5wYPc0p", name: "Lachlan Di Sebastiano" },
      { playerId: "43", registryId: "6BUesTCh0AGO7VFIySmy", name: "Christian Mazza" },
      { playerId: "46", registryId: "0LD75iYxT7u6vCKOu6IZ", name: "Ben Bozinovski" },
      { playerId: "49", registryId: "A1hggXz37FvaAMT6otut", name: "Ned Hawkins" },
      { playerId: "51", registryId: "42dbpEyefRVtWF3IWoYy", name: "Corey Barbaro" },
      { playerId: "55", registryId: "1WUFFkORSSeQRDVB54RN", name: "James Paraskevopoulos" },
      { playerId: "58", registryId: "1w5VoUiXzSozwr41Dmpc", name: "Mark Galea" },
      { playerId: "60", registryId: "CNOLKmo49uZ0iSsFHAO1", name: "Josh Chatfield" },
      { playerId: "64", registryId: "7HHIfTMqOadgwP1xwz1q", name: "Zen Christofi" },
      { playerId: "65", registryId: "EwYnDVWgqm2WbEXg89EP", name: "Timothy Quick" },
      { playerId: "68", registryId: "1irOYj5Tbvojde0UqIIg", name: "Billy Cannolo" },
      { playerId: "70", registryId: "1csyOhl5Yyxrk0eZxJ1F", name: "Kier Bol" },
      { playerId: "72", registryId: "420KkQV5KP2ZZrbHYNXm", name: "Lin Jong" },
      { playerId: "79", registryId: "17FNeXivKkfzLzN3z9hc", name: "Alex Tran" },
      { playerId: "8", registryId: "0ImqgzkUfcQ3LJhd7gCg", name: "Josh Misiti" },
      { playerId: "9", registryId: "4kun17graGSULdTkJnN5", name: "Brodie Newman" },
    ]

    let successCount = 0
    let failCount = 0

    for (const match of fuzzyMatches) {
      try {
        setDebugInfo(`Updating ${match.name}...`)
        const playerRef = doc(db, "players", match.playerId)
        await updateDoc(playerRef, {
          registryId: match.registryId,
          updatedAt: new Date(),
        })
        successCount++
        setDebugInfo(`Updated ${match.name} successfully`)
      } catch (err) {
        console.error(`Error updating ${match.name}:`, err)
        failCount++
      }
    }

    setDebugInfo(`Batch update complete. Updated ${successCount} players. Failed: ${failCount}`)
    setSuccess(true)
    setUpdating(false)
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Manual Player Fix</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Fix Matthew Hanson</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              This will update Matthew Hanson (ID: 36) with the correct registryId to link his stats.
            </p>

            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="font-medium">Player:</div>
                  <div>Matthew Hanson</div>
                  <div className="font-medium">Team:</div>
                  <div>Airport West</div>
                  <div className="font-medium">Current ID:</div>
                  <div>36</div>
                  <div className="font-medium">Registry ID:</div>
                  <div>2z1eJR5dmXQSIirUQHDF</div>
                </div>
              </div>

              <Button onClick={fixMatthewHanson} disabled={updating || success}>
                {updating ? "Updating..." : success ? "Updated!" : "Fix Matthew Hanson"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fix All Fuzzy Matches</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              This will update all 24 players that have fuzzy matches with their correct registryIds.
            </p>

            <Button onClick={fixAllFuzzyMatches} disabled={updating} variant="outline">
              {updating ? "Updating All..." : "Fix All Fuzzy Matches (24 players)"}
            </Button>
          </CardContent>
        </Card>

        {/* Debug Info */}
        {debugInfo && (
          <Card className={success ? "border-green-200 bg-green-50" : "border-blue-200 bg-blue-50"}>
            <CardContent className="pt-4">
              <div className="flex items-start gap-2">
                {success ? (
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                )}
                <div className={`text-sm whitespace-pre-line ${success ? "text-green-800" : "text-blue-800"}`}>
                  {debugInfo}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  )
}
