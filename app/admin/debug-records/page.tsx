"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { getClubs, addClubRecord } from "@/lib/firebase/actions"
import { toast } from "sonner"

export default function DebugRecordsPage() {
  const [clubs, setClubs] = useState<any[]>([])
  const [selectedClub, setSelectedClub] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadClubs()
  }, [])

  const loadClubs = async () => {
    try {
      const clubsData = await getClubs()
      setClubs(clubsData)
      if (clubsData.length > 0) {
        setSelectedClub(clubsData[0])
      }
    } catch (error) {
      console.error("Error loading clubs:", error)
    }
  }

  const testAddPremiership = async () => {
    if (!selectedClub) {
      toast.error("No club selected")
      return
    }

    setLoading(true)
    try {
      console.log("=== TESTING PREMIERSHIP ADD ===")
      console.log("Selected club:", selectedClub)

      const recordData = {
        type: "premiership" as const,
        year: 2024,
        title: "Test Premiership",
        grade: "A Grade",
        description: "Test Runner Up",
        coach: "Test Coach",
        captain: "Test Captain",
      }

      console.log("Record data:", recordData)

      const id = await addClubRecord(selectedClub.id, recordData)
      console.log("✅ Premiership added with ID:", id)
      toast.success(`Premiership added with ID: ${id}`)
    } catch (error) {
      console.error("❌ Error:", error)
      toast.error(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const testAddBestFairest = async () => {
    if (!selectedClub) {
      toast.error("No club selected")
      return
    }

    setLoading(true)
    try {
      console.log("=== TESTING BEST & FAIREST ADD ===")
      console.log("Selected club:", selectedClub)

      const recordData = {
        type: "best-and-fairest" as const,
        year: 2024,
        title: "Test Best & Fairest",
        player: "Test Player",
        grade: "A Grade",
        votes: 25,
      }

      console.log("Record data:", recordData)

      const id = await addClubRecord(selectedClub.id, recordData)
      console.log("✅ Best & Fairest added with ID:", id)
      toast.success(`Best & Fairest added with ID: ${id}`)
    } catch (error) {
      console.error("❌ Error:", error)
      toast.error(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const testAddArticle = async () => {
    if (!selectedClub) {
      toast.error("No club selected")
      return
    }

    setLoading(true)
    try {
      console.log("=== TESTING ARTICLE ADD ===")
      console.log("Selected club:", selectedClub)

      const recordData = {
        type: "article" as const,
        year: 2024,
        title: "Test Article",
        description: "This is a test article to verify the saving functionality works correctly.",
        author: "Test Author",
        source: "Test Source",
      }

      console.log("Record data:", recordData)

      const id = await addClubRecord(selectedClub.id, recordData)
      console.log("✅ Article added with ID:", id)
      toast.success(`Article added with ID: ${id}`)
    } catch (error) {
      console.error("❌ Error:", error)
      toast.error(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Debug Club Records</h1>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Club Selection</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>Available Clubs ({clubs.length})</Label>
                <select
                  className="w-full p-2 border rounded"
                  value={selectedClub?.id || ""}
                  onChange={(e) => {
                    const club = clubs.find((c) => c.id === e.target.value)
                    setSelectedClub(club)
                  }}
                >
                  <option value="">Select a club...</option>
                  {clubs.map((club) => (
                    <option key={club.id} value={club.id}>
                      {club.name} ({club.current ? "Current" : "Historical"})
                    </option>
                  ))}
                </select>
              </div>

              {selectedClub && (
                <div className="p-4 bg-gray-50 rounded">
                  <h3 className="font-semibold">Selected Club:</h3>
                  <p>
                    <strong>Name:</strong> {selectedClub.name}
                  </p>
                  <p>
                    <strong>ID:</strong> {selectedClub.id}
                  </p>
                  <p>
                    <strong>Status:</strong> {selectedClub.current ? "Current" : "Historical"}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Test Premiership</CardTitle>
            </CardHeader>
            <CardContent>
              <Button onClick={testAddPremiership} disabled={loading || !selectedClub} className="w-full">
                {loading ? "Adding..." : "Add Test Premiership"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Test Best & Fairest</CardTitle>
            </CardHeader>
            <CardContent>
              <Button onClick={testAddBestFairest} disabled={loading || !selectedClub} className="w-full">
                {loading ? "Adding..." : "Add Test Best & Fairest"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Test Article</CardTitle>
            </CardHeader>
            <CardContent>
              <Button onClick={testAddArticle} disabled={loading || !selectedClub} className="w-full">
                {loading ? "Adding..." : "Add Test Article"}
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-2">
              <p>1. Select a club from the dropdown above</p>
              <p>2. Click any of the test buttons to add records</p>
              <p>3. Check the browser console (F12) for detailed logs</p>
              <p>4. Check Firebase console to see if records are saved</p>
              <p>5. If this works, the issue is in the ClubRecordsForm component</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
