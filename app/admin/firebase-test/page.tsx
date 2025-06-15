"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  addClub,
  checkClubExists,
  getClubs,
  addClubRecord,
  deleteClubRecord,
  testFirebaseConnection,
} from "@/lib/firebase/actions"

export default function FirebaseTestPage() {
  const [status, setStatus] = useState<string>("Ready to test Firebase")
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState<string>("")
  const [currentOperation, setCurrentOperation] = useState<string>("")

  const testConnection = async () => {
    setCurrentOperation("connection")
    setLoading(true)
    setStatus("Testing Firebase connection...")
    setProgress("")

    try {
      await testFirebaseConnection()
      setStatus("✅ Firebase connection test passed!")
      setProgress("All Firebase operations working correctly")
    } catch (error: any) {
      setStatus(`❌ Firebase connection test failed: ${error.message}`)
      setProgress("Check browser console for detailed error information")
      console.error("Connection test error:", error)
    } finally {
      setLoading(false)
    }
  }

  const testRecordSaving = async () => {
    setCurrentOperation("records")
    setLoading(true)
    setStatus("Testing club record saving...")
    setProgress("")

    try {
      // Get clubs first
      setProgress("Getting clubs...")
      const clubs = await getClubs()

      if (clubs.length === 0) {
        throw new Error("No clubs found. Please create clubs first.")
      }

      const testClub = clubs[0]
      setProgress(`Testing with club: ${testClub.name}`)

      // Test adding a premiership
      setProgress("Adding test premiership...")
      const premiershipData = {
        type: "premiership" as const,
        year: 2024,
        title: "Test Premiership",
        grade: "A Grade",
        coach: "Test Coach",
        captain: "Test Captain",
      }

      const premiershipId = await addClubRecord(testClub.id!, premiershipData)
      setProgress(`✅ Premiership added with ID: ${premiershipId}`)

      // Test adding a Best & Fairest
      setProgress("Adding test Best & Fairest...")
      const bestFairestData = {
        type: "best-and-fairest" as const,
        year: 2024,
        title: "Test Best & Fairest",
        player: "Test Player",
        votes: 25,
        grade: "A Grade",
      }

      const bestFairestId = await addClubRecord(testClub.id!, bestFairestData)
      setProgress(`✅ Best & Fairest added with ID: ${bestFairestId}`)

      // Test adding an article
      setProgress("Adding test article...")
      const articleData = {
        type: "article" as const,
        year: 2024,
        title: "Test Article",
        description: "This is a test article to verify saving functionality",
        author: "Test Author",
        source: "Test Source",
      }

      const articleId = await addClubRecord(testClub.id!, articleData)
      setProgress(`✅ Article added with ID: ${articleId}`)

      // Clean up test records
      setProgress("Cleaning up test records...")
      await deleteClubRecord(testClub.id!, premiershipId)
      await deleteClubRecord(testClub.id!, bestFairestId)
      await deleteClubRecord(testClub.id!, articleId)

      setStatus("🎉 All record saving tests passed!")
      setProgress("Premierships, Best & Fairest, and Articles can all be saved successfully")
    } catch (error: any) {
      setStatus(`❌ Record saving test failed: ${error.message}`)
      setProgress("Check browser console for detailed error information")
      console.error("Record saving test error:", error)
    } finally {
      setLoading(false)
    }
  }

  const createAllHistoricalClubs = async () => {
    setCurrentOperation("historical")
    setLoading(true)
    setStatus("Creating all historical EDFL clubs...")
    setProgress("")

    try {
      // All historical clubs (no longer active)
      const historicalClubs = [
        { name: "6th Melb. Scouts", current: false, founded: "1935", colors: "Brown and Gold", homeGround: "Various" },
        {
          name: "Aberfeldie Park",
          current: false,
          founded: "1920",
          colors: "Red and White",
          homeGround: "Aberfeldie Park",
        },
        {
          name: "All Nations Youth Club",
          current: false,
          founded: "1945",
          colors: "Multi-colored",
          homeGround: "Various",
        },
        {
          name: "Ascot Imperials",
          current: false,
          founded: "1932",
          colors: "Purple and Gold",
          homeGround: "Ascot Vale",
        },
        {
          name: "Ascot Presbyterians",
          current: false,
          founded: "1930",
          colors: "Blue and White",
          homeGround: "Ascot Vale",
        },
        { name: "Ascot Rovers", current: false, founded: "1928", colors: "Red and Black", homeGround: "Ascot Vale" },
        {
          name: "Ascot Rovers/Maribyrnong",
          current: false,
          founded: "1940",
          colors: "Red and Black",
          homeGround: "Ascot Vale",
        },
        { name: "Ascot United", current: false, founded: "1935", colors: "Blue and Red", homeGround: "Ascot Vale" },
        { name: "Ascot Vale", current: false, founded: "1925", colors: "Blue and Gold", homeGround: "Ascot Vale Park" },
        {
          name: "Ascot Vale Methodists",
          current: false,
          founded: "1930",
          colors: "Navy and White",
          homeGround: "Ascot Vale",
        },
        {
          name: "Ascot Vale Wanderers",
          current: false,
          founded: "1933",
          colors: "Green and Gold",
          homeGround: "Ascot Vale",
        },
        { name: "Ascot Vale West", current: false, founded: "1938", colors: "Red and White", homeGround: "Ascot Vale" },
        {
          name: "Ascot Youth Centre",
          current: false,
          founded: "1950",
          colors: "Blue and Yellow",
          homeGround: "Ascot Vale",
        },
        {
          name: "Australian National Airways",
          current: false,
          founded: "1945",
          colors: "Blue and White",
          homeGround: "Essendon Airport",
        },
        { name: "Batman", current: false, founded: "1955", colors: "Black and Yellow", homeGround: "Batman Park" },
        {
          name: "Broadmeadows",
          current: false,
          founded: "1960",
          colors: "Green and Gold",
          homeGround: "Broadmeadows Reserve",
        },
        { name: "Brunswick City", current: false, founded: "1935", colors: "Blue and White", homeGround: "Brunswick" },
        { name: "Brunswick Colts", current: false, founded: "1940", colors: "Navy and Gold", homeGround: "Brunswick" },
        {
          name: "Brunswick Presbyterians",
          current: false,
          founded: "1932",
          colors: "Blue and White",
          homeGround: "Brunswick",
        },
        {
          name: "Brunswick Sons of Soldiers",
          current: false,
          founded: "1920",
          colors: "Khaki and Blue",
          homeGround: "Brunswick",
        },
        { name: "Brunswick United", current: false, founded: "1945", colors: "Red and Blue", homeGround: "Brunswick" },
        { name: "Catholic Boys Club", current: false, founded: "1935", colors: "Blue and Gold", homeGround: "Various" },
        { name: "Coburg Amateurs", current: false, founded: "1925", colors: "Blue and White", homeGround: "Coburg" },
        { name: "Coburg Districts", current: false, founded: "1930", colors: "Green and Gold", homeGround: "Coburg" },
        { name: "Coburg Rovers", current: false, founded: "1928", colors: "Red and Black", homeGround: "Coburg" },
        {
          name: "Coburg Sons of Soldiers",
          current: false,
          founded: "1920",
          colors: "Khaki and Blue",
          homeGround: "Coburg",
        },
        { name: "Coburg Stars", current: false, founded: "1935", colors: "Blue and Gold", homeGround: "Coburg" },
        { name: "Coburgians", current: false, founded: "1940", colors: "Navy and White", homeGround: "Coburg" },
        { name: "Corpus Christi", current: false, founded: "1950", colors: "Blue and White", homeGround: "Various" },
        {
          name: "Craigieburn",
          current: false,
          founded: "1975",
          colors: "Green and Gold",
          homeGround: "Craigieburn Reserve",
        },
        { name: "Don Rovers", current: false, founded: "1945", colors: "Red and White", homeGround: "Various" },
        {
          name: "Doutta Stars",
          current: false,
          founded: "1954",
          colors: "Red and Black",
          homeGround: "Doutta Galla Reserve",
        },
        {
          name: "East Brunswick",
          current: false,
          founded: "1930",
          colors: "Blue and Gold",
          homeGround: "East Brunswick",
        },
        { name: "East Coburg", current: false, founded: "1935", colors: "Green and White", homeGround: "East Coburg" },
        {
          name: "East Essendon",
          current: false,
          founded: "1925",
          colors: "Red and Black",
          homeGround: "East Essendon",
        },
        { name: "Essendon All Blacks", current: false, founded: "1940", colors: "Black", homeGround: "Essendon" },
        { name: "Essendon Baptist", current: false, founded: "1935", colors: "Blue and White", homeGround: "Essendon" },
        {
          name: "Essendon Baptist St.Johns",
          current: false,
          founded: "1945",
          colors: "Blue and White",
          homeGround: "Essendon",
        },
        {
          name: "Essendon Bombers",
          current: false,
          founded: "1930",
          colors: "Red and Black",
          homeGround: "Windy Hill",
        },
        {
          name: "Essendon Church of Christ",
          current: false,
          founded: "1940",
          colors: "Blue and Gold",
          homeGround: "Essendon",
        },
        {
          name: "Essendon Grammar Old Boys",
          current: false,
          founded: "1925",
          colors: "Navy and Gold",
          homeGround: "Essendon Grammar",
        },
        {
          name: "Essendon High School Old Boys",
          current: false,
          founded: "1930",
          colors: "Blue and White",
          homeGround: "Essendon High",
        },
        {
          name: "Essendon Imperials",
          current: false,
          founded: "1935",
          colors: "Purple and Gold",
          homeGround: "Essendon",
        },
        {
          name: "Essendon Returned Soldiers",
          current: false,
          founded: "1920",
          colors: "Khaki and Blue",
          homeGround: "Essendon",
        },
        {
          name: "Essendon Sons of Soldiers",
          current: false,
          founded: "1920",
          colors: "Khaki and Blue",
          homeGround: "Essendon",
        },
        { name: "Essendon Stars", current: false, founded: "1940", colors: "Red and Gold", homeGround: "Essendon" },
        {
          name: "Essendon Swimmers Old",
          current: false,
          founded: "1935",
          colors: "Blue and White",
          homeGround: "Essendon",
        },
        {
          name: "Essendon Tullamarine",
          current: false,
          founded: "1960",
          colors: "Red and Black",
          homeGround: "Tullamarine",
        },
        { name: "Essendon United", current: false, founded: "1945", colors: "Red and Blue", homeGround: "Essendon" },
        {
          name: "Essendon Youth Centre",
          current: false,
          founded: "1950",
          colors: "Red and White",
          homeGround: "Essendon",
        },
        {
          name: "Fairbairn Rovers",
          current: false,
          founded: "1940",
          colors: "Green and Gold",
          homeGround: "Fairbairn Park",
        },
        {
          name: "Fairbairn Socials",
          current: false,
          founded: "1945",
          colors: "Blue and White",
          homeGround: "Fairbairn Park",
        },
        { name: "Fawkner Districts", current: false, founded: "1955", colors: "Red and Black", homeGround: "Fawkner" },
        {
          name: "Flemington/Kensington",
          current: false,
          founded: "1935",
          colors: "Blue and Gold",
          homeGround: "Flemington",
        },
        {
          name: "Footscray Technical College",
          current: false,
          founded: "1940",
          colors: "Navy and White",
          homeGround: "Footscray",
        },
        { name: "Ford Company", current: false, founded: "1950", colors: "Blue and White", homeGround: "Broadmeadows" },
        {
          name: "Gladstone Park",
          current: false,
          founded: "1970",
          colors: "Green and Gold",
          homeGround: "Gladstone Park Reserve",
        },
        { name: "Glenbervie", current: false, founded: "1945", colors: "Red and White", homeGround: "Glenbervie" },
        {
          name: "Hadfield",
          current: false,
          founded: "1960",
          colors: "Blue and Yellow",
          homeGround: "Hadfield Reserve",
        },
        { name: "Jacana", current: false, founded: "1965", colors: "Green and White", homeGround: "Jacana Reserve" },
        { name: "Keilor Park", current: false, founded: "1955", colors: "Purple and White", homeGround: "Keilor Park" },
        { name: "Keilor Regal Sports", current: false, founded: "1950", colors: "Blue and Gold", homeGround: "Keilor" },
        {
          name: "Kensington Methodists",
          current: false,
          founded: "1930",
          colors: "Blue and White",
          homeGround: "Kensington",
        },
        { name: "Knox Presbyterians", current: false, founded: "1935", colors: "Navy and Gold", homeGround: "Various" },
        { name: "La Mascotte", current: false, founded: "1940", colors: "Red and Blue", homeGround: "Various" },
        {
          name: "Lincoln Rovers",
          current: false,
          founded: "1935",
          colors: "Green and Gold",
          homeGround: "Lincoln Park",
        },
        {
          name: "Lincoln Stars",
          current: false,
          founded: "1940",
          colors: "Blue and White",
          homeGround: "Lincoln Park",
        },
        {
          name: "Lincoln Tigers",
          current: false,
          founded: "1945",
          colors: "Yellow and Black",
          homeGround: "Lincoln Park",
        },
        { name: "Maribyrnong", current: false, founded: "1930", colors: "Maroon and Gold", homeGround: "Maribyrnong" },
        {
          name: "Maribyrnong-Ascot United",
          current: false,
          founded: "1950",
          colors: "Blue and Red",
          homeGround: "Maribyrnong",
        },
        {
          name: "Maribyrnong Regal Sport",
          current: false,
          founded: "1945",
          colors: "Blue and Gold",
          homeGround: "Maribyrnong",
        },
        {
          name: "Maribyrnong Youth Club",
          current: false,
          founded: "1955",
          colors: "Red and White",
          homeGround: "Maribyrnong",
        },
        { name: "Marrows", current: false, founded: "1940", colors: "Green and White", homeGround: "Various" },
        {
          name: "Meadows Heights",
          current: false,
          founded: "1975",
          colors: "Blue and Yellow",
          homeGround: "Meadow Heights Reserve",
        },
        { name: "Monash Rovers", current: false, founded: "1960", colors: "Navy and Gold", homeGround: "Various" },
        { name: "Moonee Imps", current: false, founded: "1935", colors: "Purple and Gold", homeGround: "Moonee Ponds" },
        {
          name: "Moonee Ponds",
          current: false,
          founded: "1930",
          colors: "Blue and Gold",
          homeGround: "Moonee Ponds Reserve",
        },
        {
          name: "Moonee Ponds YCW",
          current: false,
          founded: "1945",
          colors: "Blue and White",
          homeGround: "Moonee Ponds",
        },
        {
          name: "Moonee Valley",
          current: false,
          founded: "1950",
          colors: "Green and Gold",
          homeGround: "Moonee Valley",
        },
        {
          name: "Moonee Valley Juniors",
          current: false,
          founded: "1955",
          colors: "Red and Blue",
          homeGround: "Moonee Valley",
        },
        {
          name: "North Coburg Saints",
          current: false,
          founded: "1960",
          colors: "Red and White",
          homeGround: "North Coburg",
        },
        {
          name: "North Essendon Methodists",
          current: false,
          founded: "1935",
          colors: "Blue and White",
          homeGround: "North Essendon",
        },
        {
          name: "Northcote Excelsior",
          current: false,
          founded: "1940",
          colors: "Green and Gold",
          homeGround: "Northcote",
        },
        { name: "Northern Juniors", current: false, founded: "1955", colors: "Blue and Yellow", homeGround: "Various" },
        { name: "Northern Rovers", current: false, founded: "1950", colors: "Red and Black", homeGround: "Various" },
        {
          name: "Oak Park",
          current: false,
          founded: "1965",
          colors: "Green and White",
          homeGround: "Oak Park Reserve",
        },
        { name: "Parkville", current: false, founded: "1935", colors: "Blue and Gold", homeGround: "Parkville" },
        { name: "Raeburn", current: false, founded: "1940", colors: "Red and White", homeGround: "Various" },
        { name: "Regal Sports", current: false, founded: "1945", colors: "Blue and Gold", homeGround: "Various" },
        { name: "Riverside Stars", current: false, founded: "1950", colors: "Blue and White", homeGround: "Various" },
        {
          name: "Roxburgh Park",
          current: false,
          founded: "1980",
          colors: "Green and Gold",
          homeGround: "Roxburgh Park Reserve",
        },
        { name: "Royal Park", current: false, founded: "1935", colors: "Purple and Gold", homeGround: "Royal Park" },
        {
          name: "South Kensington",
          current: false,
          founded: "1930",
          colors: "Blue and White",
          homeGround: "South Kensington",
        },
        { name: "St. Andrews", current: false, founded: "1940", colors: "Blue and White", homeGround: "Various" },
        { name: "St. Bernards", current: false, founded: "1935", colors: "Red and Blue", homeGround: "Various" },
        {
          name: "St. Bernards Juniors",
          current: false,
          founded: "1945",
          colors: "Red and Blue",
          homeGround: "Various",
        },
        { name: "St. Christophers", current: false, founded: "1940", colors: "Blue and Gold", homeGround: "Various" },
        { name: "St. Davids", current: false, founded: "1935", colors: "Navy and White", homeGround: "Various" },
        { name: "St. Francis", current: false, founded: "1940", colors: "Brown and Gold", homeGround: "Various" },
        { name: "St. Johns", current: false, founded: "1935", colors: "Blue and White", homeGround: "Various" },
        { name: "St. Monicas CYMS", current: false, founded: "1945", colors: "Blue and Gold", homeGround: "Various" },
        { name: "St. Olivers", current: false, founded: "1940", colors: "Green and White", homeGround: "Various" },
        { name: "St. Patricks", current: false, founded: "1935", colors: "Green and Gold", homeGround: "Various" },
        { name: "St. Pauls", current: false, founded: "1940", colors: "Blue and White", homeGround: "Various" },
        {
          name: "Strathmore Stars",
          current: false,
          founded: "1945",
          colors: "Blue and Gold",
          homeGround: "Strathmore",
        },
        {
          name: "Sydenham Hillside",
          current: false,
          founded: "1985",
          colors: "Green and Gold",
          homeGround: "Sydenham Reserve",
        },
        {
          name: "Taylors Lakes",
          current: false,
          founded: "1980",
          colors: "Blue and White",
          homeGround: "Taylors Lakes Reserve",
        },
        {
          name: "Tullamarine",
          current: false,
          founded: "1960",
          colors: "Red and Black",
          homeGround: "Tullamarine Reserve",
        },
        {
          name: "Tullamarine/Airport West",
          current: false,
          founded: "1965",
          colors: "Blue and Gold",
          homeGround: "Airport West",
        },
        {
          name: "Tullamarine Ascot Presbyterians",
          current: false,
          founded: "1955",
          colors: "Blue and White",
          homeGround: "Tullamarine",
        },
        { name: "Vespa", current: false, founded: "1950", colors: "Blue and Yellow", homeGround: "Various" },
        {
          name: "West Brunswick",
          current: false,
          founded: "1935",
          colors: "Blue and Gold",
          homeGround: "West Brunswick",
        },
        {
          name: "West Brunswick Laurels",
          current: false,
          founded: "1940",
          colors: "Green and Gold",
          homeGround: "West Brunswick",
        },
        {
          name: "West Coburg Amateurs",
          current: false,
          founded: "1955",
          colors: "Blue and White",
          homeGround: "West Coburg",
        },
        {
          name: "West Coburg Juniors",
          current: false,
          founded: "1960",
          colors: "Blue and Yellow",
          homeGround: "West Coburg",
        },
        {
          name: "West Coburg Seniors",
          current: false,
          founded: "1958",
          colors: "Blue and Gold",
          homeGround: "West Coburg",
        },
        {
          name: "West Essendon",
          current: false,
          founded: "1930",
          colors: "Red and Black",
          homeGround: "West Essendon",
        },
        {
          name: "West Essendon Youth Center",
          current: false,
          founded: "1955",
          colors: "Red and White",
          homeGround: "West Essendon",
        },
        { name: "West Moreland", current: false, founded: "1945", colors: "Green and White", homeGround: "Various" },
        {
          name: "Westmeadows",
          current: false,
          founded: "1970",
          colors: "Blue and Gold",
          homeGround: "Westmeadows Reserve",
        },
        {
          name: "Woodlands",
          current: false,
          founded: "1965",
          colors: "Green and Gold",
          homeGround: "Woodlands Reserve",
        },
      ]

      let addedCount = 0
      let skippedCount = 0

      for (let i = 0; i < historicalClubs.length; i++) {
        const clubData = historicalClubs[i]
        setProgress(`Processing ${i + 1}/${historicalClubs.length}: ${clubData.name}`)

        const slug = clubData.name
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-")
          .trim()

        // Check if club already exists
        const exists = await checkClubExists(slug)

        if (!exists) {
          const club = {
            name: clubData.name,
            slug: slug,
            location: clubData.name.includes("St.") ? "Various" : clubData.name.split(" ")[0],
            description: `${clubData.name} was a historical club that competed in the EDFL.`,
            founded: clubData.founded || "Unknown",
            colors: clubData.colors || "Unknown",
            homeGround: clubData.homeGround || "Unknown",
            current: clubData.current,
            status: "Historical",
          }

          await addClub(club)
          addedCount++
          console.log(`✅ Added ${clubData.name}`)
        } else {
          skippedCount++
          console.log(`⏭️ Skipped ${clubData.name} (already exists)`)
        }

        // Small delay to prevent overwhelming Firebase
        await new Promise((resolve) => setTimeout(resolve, 100))
      }

      setStatus(`🎉 Complete! Added ${addedCount} historical clubs, skipped ${skippedCount} existing clubs.`)
      setProgress(`Total: ${addedCount + skippedCount} historical clubs processed`)
    } catch (error: any) {
      setStatus(`❌ Error creating clubs: ${error.message}`)
      console.error("Error:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Firebase Testing & Club Management</h1>

      {/* Firebase Connection Tests */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-800">🔧 Firebase Connection Test</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">Test basic Firebase connectivity and permissions.</p>
            <Button
              onClick={testConnection}
              disabled={loading && currentOperation === "connection"}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {loading && currentOperation === "connection" ? "Testing..." : "🔍 Test Firebase Connection"}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="text-green-800">📝 Record Saving Test</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">Test adding premierships, Best & Fairest, and articles.</p>
            <Button
              onClick={testRecordSaving}
              disabled={loading && currentOperation === "records"}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {loading && currentOperation === "records" ? "Testing..." : "✅ Test Record Saving"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Historical Clubs Import */}
      <Card className="mb-4 border-orange-200">
        <CardHeader>
          <CardTitle className="text-orange-800">🏛️ Historical Clubs Import</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Button
              onClick={createAllHistoricalClubs}
              disabled={loading && currentOperation === "historical"}
              size="lg"
              className="w-full bg-orange-600 hover:bg-orange-700"
            >
              {loading && currentOperation === "historical"
                ? "Creating 116+ Historical Clubs..."
                : "🏛️ Create All Historical EDFL Clubs (116+)"}
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm mb-4">
            <div>• Church Teams (20+)</div>
            <div>• Company Teams (5+)</div>
            <div>• School Teams (10+)</div>
            <div>• Youth Clubs (15+)</div>
            <div>• Merged Clubs (8+)</div>
            <div>• Military Teams (12+)</div>
            <div>• Suburb Teams (30+)</div>
            <div>• Social Clubs (16+)</div>
          </div>
          <p className="text-xs text-gray-600">Total: 116+ historical clubs from 1920-2005</p>
        </CardContent>
      </Card>

      {/* Status Display */}
      <Card>
        <CardHeader>
          <CardTitle>Test Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <div>
                <strong>Status:</strong> {status}
              </div>
              {progress && (
                <div>
                  <strong>Progress:</strong> {progress}
                </div>
              )}
            </div>

            <div className="text-xs text-gray-500">
              <strong>Instructions:</strong>
              <br />
              1. First run "Test Firebase Connection" to verify basic connectivity
              <br />
              2. Then run "Test Record Saving" to verify club records can be saved
              <br />
              3. Check browser console (F12) for detailed error messages
              <br />
              4. If tests pass, your club management system should work properly
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
