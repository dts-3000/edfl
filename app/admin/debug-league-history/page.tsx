"use client"

import { useState } from "react"
import { initializeApp } from "firebase/app"
import { getFirestore, collection, getDocs, addDoc, query, where } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle, Database, Plus } from "lucide-react"
import { EDFL_CLUBS } from "@/lib/edflClubs"

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

export default function DebugLeagueHistoryPage() {
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)

  const testClubData = async () => {
    setLoading(true)
    setResults([])

    try {
      const testResults = []

      // Test first 5 clubs
      const clubsToTest = EDFL_CLUBS.slice(0, 5)

      for (const club of clubsToTest) {
        try {
          // Get premierships
          const premiershipQuery = query(collection(db, "premierships"), where("team", "==", club.name))
          const premiershipSnapshot = await getDocs(premiershipQuery)

          // Get best and fairest
          const bnfQuery = query(collection(db, "bestAndFairest"), where("team", "==", club.name))
          const bnfSnapshot = await getDocs(bnfQuery)

          // Get articles
          const articlesQuery = query(
            collection(db, "clubArticles"),
            where("clubName", "==", club.name),
            where("published", "==", true),
          )
          const articlesSnapshot = await getDocs(articlesQuery)

          testResults.push({
            clubName: club.name,
            current: club.current,
            premierships: premiershipSnapshot.size,
            bestAndFairest: bnfSnapshot.size,
            articles: articlesSnapshot.size,
            errors: [],
          })
        } catch (error) {
          testResults.push({
            clubName: club.name,
            current: club.current,
            premierships: 0,
            bestAndFairest: 0,
            articles: 0,
            errors: [error.message],
          })
        }
      }

      // Test all collections
      const allPremierships = await getDocs(collection(db, "premierships"))
      const allBestAndFairest = await getDocs(collection(db, "bestAndFairest"))
      const allArticles = await getDocs(collection(db, "clubArticles"))

      testResults.push({
        type: "All Premierships",
        count: allPremierships.size,
        sample: allPremierships.docs.slice(0, 3).map((doc) => doc.data()),
      })

      testResults.push({
        type: "All Best and Fairest",
        count: allBestAndFairest.size,
        sample: allBestAndFairest.docs.slice(0, 3).map((doc) => doc.data()),
      })

      testResults.push({
        type: "All Articles",
        count: allArticles.size,
        sample: allArticles.docs.slice(0, 3).map((doc) => doc.data()),
      })

      setResults(testResults)
    } catch (error) {
      setResults([{ error: error.message }])
    } finally {
      setLoading(false)
    }
  }

  const createSampleData = async () => {
    setCreating(true)

    try {
      const currentClubs = EDFL_CLUBS.filter((club) => club.current).slice(0, 5)
      const historicalClubs = EDFL_CLUBS.filter((club) => !club.current).slice(0, 3)
      const allTestClubs = [...currentClubs, ...historicalClubs]

      let totalCreated = 0

      // Create sample premierships
      for (const club of allTestClubs) {
        const premiershipCount = Math.floor(Math.random() * 8) + 1 // 1-8 premierships

        for (let i = 0; i < premiershipCount; i++) {
          const year = 2024 - Math.floor(Math.random() * 30) // Last 30 years
          const grades = ["A Grade", "B Grade", "C Grade", "Reserves"]
          const grade = grades[Math.floor(Math.random() * grades.length)]

          const opponents = allTestClubs.filter((c) => c.name !== club.name)
          const opponent = opponents[Math.floor(Math.random() * opponents.length)]

          await addDoc(collection(db, "premierships"), {
            team: club.name,
            year: year,
            grade: grade,
            opponent: opponent.name,
            score: `${Math.floor(Math.random() * 50) + 80}.${Math.floor(Math.random() * 20)} - ${Math.floor(Math.random() * 40) + 60}.${Math.floor(Math.random() * 20)}`,
            coach: `Coach ${Math.floor(Math.random() * 100)}`,
            captain: `Captain ${Math.floor(Math.random() * 100)}`,
            venue: "Grand Final",
            createdAt: new Date(),
          })
          totalCreated++
        }
      }

      // Create sample Best & Fairest
      for (const club of allTestClubs) {
        const bnfCount = Math.floor(Math.random() * 6) + 1 // 1-6 B&F winners

        for (let i = 0; i < bnfCount; i++) {
          const year = 2024 - Math.floor(Math.random() * 25) // Last 25 years
          const grades = ["A Grade", "B Grade", "C Grade", "Reserves"]
          const grade = grades[Math.floor(Math.random() * grades.length)]

          const firstNames = [
            "John",
            "Michael",
            "David",
            "James",
            "Robert",
            "William",
            "Richard",
            "Thomas",
            "Mark",
            "Daniel",
          ]
          const lastNames = [
            "Smith",
            "Johnson",
            "Williams",
            "Brown",
            "Jones",
            "Garcia",
            "Miller",
            "Davis",
            "Rodriguez",
            "Martinez",
          ]

          const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
          const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]

          await addDoc(collection(db, "bestAndFairest"), {
            team: club.name,
            player: `${firstName} ${lastName}`,
            year: year,
            grade: grade,
            votes: Math.floor(Math.random() * 15) + 15, // 15-30 votes
            createdAt: new Date(),
          })
          totalCreated++
        }
      }

      // Create sample articles
      for (const club of allTestClubs) {
        const articleCount = Math.floor(Math.random() * 4) + 1 // 1-4 articles

        for (let i = 0; i < articleCount; i++) {
          const year = 2024 - Math.floor(Math.random() * 20) // Last 20 years

          const articleTypes = [
            "Grand Final Victory",
            "Season Review",
            "Club History",
            "Player Milestone",
            "Championship Celebration",
          ]

          const articleType = articleTypes[Math.floor(Math.random() * articleTypes.length)]

          await addDoc(collection(db, "clubArticles"), {
            clubName: club.name,
            title: `${club.name} ${articleType} ${year}`,
            content: `This is a historical article about ${club.name}'s ${articleType.toLowerCase()} in ${year}. The club had an outstanding season with many memorable moments.`,
            year: year,
            author: `Sports Reporter ${Math.floor(Math.random() * 50)}`,
            source: "EDFL Weekly",
            published: true,
            createdAt: new Date(),
          })
          totalCreated++
        }
      }

      alert(`✅ Successfully created ${totalCreated} sample records!\n\nNow go to /league-history to see the results.`)

      // Refresh the test data
      await testClubData()
    } catch (error) {
      alert(`❌ Error creating sample data: ${error.message}`)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Debug League History Data</h1>
          <p className="text-gray-600">Test and create sample data for the League History page</p>
        </div>

        <div className="space-y-6">
          {/* Action Buttons */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Button onClick={testClubData} disabled={loading} className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  {loading ? "Testing..." : "🔍 Test Club Data"}
                </Button>

                <Button
                  onClick={createSampleData}
                  disabled={creating}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  {creating ? "Creating..." : "➕ Create Sample Data"}
                </Button>
              </div>

              <div className="text-sm text-gray-600">
                <p>
                  <strong>Test Club Data:</strong> Check what data exists for clubs
                </p>
                <p>
                  <strong>Create Sample Data:</strong> Add sample premierships, Best & Fairest, and articles for testing
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          {results.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Debug Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {results.map((result, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      {result.error ? (
                        <div className="flex items-center gap-2 text-red-600">
                          <AlertCircle className="h-4 w-4" />
                          <span>Error: {result.error}</span>
                        </div>
                      ) : result.clubName ? (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold">{result.clubName}</h3>
                            <Badge variant={result.current ? "default" : "secondary"}>
                              {result.current ? "Current" : "Historical"}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="font-medium">Premierships:</span> {result.premierships}
                            </div>
                            <div>
                              <span className="font-medium">Best & Fairest:</span> {result.bestAndFairest}
                            </div>
                            <div>
                              <span className="font-medium">Articles:</span> {result.articles}
                            </div>
                          </div>
                          {result.errors.length > 0 && (
                            <div className="mt-2 text-red-600 text-sm">Errors: {result.errors.join(", ")}</div>
                          )}
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <h3 className="font-semibold">{result.type}</h3>
                            <Badge>{result.count} records</Badge>
                          </div>
                          {result.sample && result.sample.length > 0 && (
                            <div className="text-sm text-gray-600">
                              <p>Sample data:</p>
                              <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                                {JSON.stringify(result.sample[0], null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>Next Steps</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p>
                  1. <strong>Test the data</strong> to see what currently exists
                </p>
                <p>
                  2. <strong>Create sample data</strong> if no records exist
                </p>
                <p>
                  3. <strong>Visit /league-history</strong> to see the results
                </p>
                <p>
                  4. <strong>Use /admin/clubs</strong> to add real historical data
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
