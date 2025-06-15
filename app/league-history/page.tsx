"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { initializeApp } from "firebase/app"
import { getFirestore, collection, getDocs, query, where } from "firebase/firestore"
import Navbar from "@/components/layout/Navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trophy, Medal, Calendar, Search, Users, MapPin, ExternalLink, AlertCircle, RefreshCw } from "lucide-react"
import { getTeamLogoPath } from "@/lib/teamLogos"
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

interface ClubStats {
  name: string
  current: boolean
  premierships: number
  bestAndFairest: number
  articles: number
  lastPremiership?: number
  firstPremiership?: number
  slug: string
}

export default function LeagueHistoryPage() {
  const [clubStats, setClubStats] = useState<ClubStats[]>([])
  const [filteredClubs, setFilteredClubs] = useState<ClubStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortBy, setSortBy] = useState("name")

  useEffect(() => {
    loadClubStats()
  }, [])

  useEffect(() => {
    filterAndSortClubs()
  }, [clubStats, searchTerm, statusFilter, sortBy])

  const loadClubStats = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log("Loading club stats...")

      const stats: ClubStats[] = []

      // Load stats for each club
      for (const club of EDFL_CLUBS) {
        console.log(`Loading data for ${club.name}...`)

        try {
          // Get club document
          const clubQuery = query(collection(db, "clubs"), where("name", "==", club.name))
          const clubSnapshot = await getDocs(clubQuery)

          let premierships = 0
          let bestAndFairest = 0
          let articles = 0
          const premiershipYears: number[] = []

          if (!clubSnapshot.empty) {
            const clubDoc = clubSnapshot.docs[0]
            const clubId = clubDoc.id

            // Get records from subcollection
            const recordsQuery = collection(db, `clubs/${clubId}/records`)
            const recordsSnapshot = await getDocs(recordsQuery)

            recordsSnapshot.docs.forEach((doc) => {
              const record = doc.data()
              if (record.type === "premiership") {
                premierships++
                if (record.year) {
                  premiershipYears.push(record.year)
                }
              } else if (record.type === "best-and-fairest") {
                bestAndFairest++
              } else if (record.type === "article") {
                articles++
              }
            })
          }

          stats.push({
            name: club.name,
            current: club.current,
            premierships,
            bestAndFairest,
            articles,
            lastPremiership: premiershipYears.length > 0 ? Math.max(...premiershipYears) : undefined,
            firstPremiership: premiershipYears.length > 0 ? Math.min(...premiershipYears) : undefined,
            slug: club.name
              .toLowerCase()
              .replace(/\s+/g, "-")
              .replace(/[^a-z0-9-]/g, ""),
          })
        } catch (clubError) {
          console.error(`Error loading data for ${club.name}:`, clubError)
          // Still add the club with zero stats
          stats.push({
            name: club.name,
            current: club.current,
            premierships: 0,
            bestAndFairest: 0,
            articles: 0,
            slug: club.name
              .toLowerCase()
              .replace(/\s+/g, "-")
              .replace(/[^a-z0-9-]/g, ""),
          })
        }
      }

      console.log("Final stats:", stats)
      setClubStats(stats)
    } catch (error) {
      console.error("Error loading club stats:", error)
      setError(`Error loading data: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortClubs = () => {
    const filtered = clubStats.filter((club) => {
      const matchesSearch = club.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "current" && club.current) ||
        (statusFilter === "historical" && !club.current)

      return matchesSearch && matchesStatus
    })

    // Sort clubs
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "premierships":
          if (b.premierships !== a.premierships) {
            return b.premierships - a.premierships
          }
          return a.name.localeCompare(b.name)
        case "name":
          return a.name.localeCompare(b.name)
        case "recent":
          if ((b.lastPremiership || 0) !== (a.lastPremiership || 0)) {
            return (b.lastPremiership || 0) - (a.lastPremiership || 0)
          }
          return a.name.localeCompare(b.name)
        case "bestAndFairest":
          if (b.bestAndFairest !== a.bestAndFairest) {
            return b.bestAndFairest - a.bestAndFairest
          }
          return a.name.localeCompare(b.name)
        default:
          return a.name.localeCompare(b.name)
      }
    })

    setFilteredClubs(filtered)
  }

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.onerror = null
    e.currentTarget.src = "/images/teams/placeholder.png"
  }

  const getTotalStats = () => {
    return {
      totalClubs: clubStats.length,
      currentClubs: clubStats.filter((c) => c.current).length,
      historicalClubs: clubStats.filter((c) => !c.current).length,
      totalPremierships: clubStats.reduce((sum, c) => sum + c.premierships, 0),
      totalBestAndFairest: clubStats.reduce((sum, c) => sum + c.bestAndFairest, 0),
      totalArticles: clubStats.reduce((sum, c) => sum + c.articles, 0),
    }
  }

  const stats = getTotalStats()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading league history...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Error Loading Data</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <div className="space-x-4">
                <Button onClick={loadClubStats}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
                <Link href="/admin/clubs">
                  <Button variant="outline">Manage Clubs</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">EDFL League History</h1>
              <p className="text-gray-600">
                Explore the rich history of all Essendon District Football League clubs, past and present.
              </p>
            </div>
            <Button onClick={loadClubStats} variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Data
            </Button>
          </div>

          {/* League Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <Card>
              <CardContent className="text-center py-4">
                <div className="text-2xl font-bold text-primary">{stats.totalClubs}</div>
                <div className="text-sm text-muted-foreground">Total Clubs</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="text-center py-4">
                <div className="text-2xl font-bold text-green-600">{stats.currentClubs}</div>
                <div className="text-sm text-muted-foreground">Current</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="text-center py-4">
                <div className="text-2xl font-bold text-gray-600">{stats.historicalClubs}</div>
                <div className="text-sm text-muted-foreground">Historical</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="text-center py-4">
                <div className="text-2xl font-bold text-yellow-600">{stats.totalPremierships}</div>
                <div className="text-sm text-muted-foreground">Premierships</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="text-center py-4">
                <div className="text-2xl font-bold text-purple-600">{stats.totalBestAndFairest}</div>
                <div className="text-sm text-muted-foreground">Best & Fairest</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="text-center py-4">
                <div className="text-2xl font-bold text-blue-600">{stats.totalArticles}</div>
                <div className="text-sm text-muted-foreground">Articles</div>
              </CardContent>
            </Card>
          </div>

          {/* Show message if no data */}
          {stats.totalPremierships === 0 && stats.totalBestAndFairest === 0 && stats.totalArticles === 0 && (
            <Card className="mb-6">
              <CardContent className="text-center py-8">
                <AlertCircle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                <h3 className="text-lg font-medium mb-2">No Historical Data Found</h3>
                <p className="text-gray-600 mb-4">
                  It looks like there's no historical data in the database yet. You can add some data to get started.
                </p>
                <Link href="/admin/clubs">
                  <Button>Add Club Data</Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search clubs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clubs</SelectItem>
                <SelectItem value="current">Current Clubs</SelectItem>
                <SelectItem value="historical">Historical Clubs</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Club Name</SelectItem>
                <SelectItem value="premierships">Most Premierships</SelectItem>
                <SelectItem value="recent">Most Recent Success</SelectItem>
                <SelectItem value="bestAndFairest">Best & Fairest</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Clubs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredClubs.map((club) => (
            <Card key={club.name} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <img
                    src={getTeamLogoPath(club.name) || "/placeholder.svg"}
                    alt={club.name}
                    width={40}
                    height={40}
                    className="h-10 w-10 object-contain"
                    onError={handleImageError}
                  />
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">{club.name}</CardTitle>
                    <Badge variant={club.current ? "default" : "secondary"} className="text-xs">
                      {club.current ? "Current" : "Historical"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="flex items-center justify-center">
                        <Trophy className="h-4 w-4 text-yellow-600 mr-1" />
                        <span className="font-bold">{club.premierships}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">Premierships</div>
                    </div>
                    <div>
                      <div className="flex items-center justify-center">
                        <Medal className="h-4 w-4 text-purple-600 mr-1" />
                        <span className="font-bold">{club.bestAndFairest}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">Best & Fairest</div>
                    </div>
                    <div>
                      <div className="flex items-center justify-center">
                        <Calendar className="h-4 w-4 text-blue-600 mr-1" />
                        <span className="font-bold">{club.articles}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">Articles</div>
                    </div>
                  </div>

                  {/* Last Premiership */}
                  {club.lastPremiership && (
                    <div className="text-center py-2 bg-yellow-50 rounded">
                      <div className="text-sm font-medium">Last Premiership</div>
                      <div className="text-lg font-bold text-yellow-700">{club.lastPremiership}</div>
                    </div>
                  )}

                  {/* Premiership Era */}
                  {club.firstPremiership && club.lastPremiership && club.firstPremiership !== club.lastPremiership && (
                    <div className="text-center text-xs text-muted-foreground">
                      Era: {club.firstPremiership} - {club.lastPremiership}
                    </div>
                  )}

                  {/* View Club Button */}
                  <Link href={`/clubs/${club.slug}`}>
                    <Button className="w-full" variant="outline">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View Club History
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* No Results */}
        {filteredClubs.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No clubs found</h3>
            <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-12 text-center">
          <Card>
            <CardContent className="py-8">
              <h3 className="text-lg font-medium mb-2">About EDFL History</h3>
              <p className="text-muted-foreground mb-4">
                The Essendon District Football League has a rich history spanning decades, with clubs coming and going,
                creating a tapestry of community football excellence.
              </p>
              <div className="flex justify-center space-x-4">
                <Link href="/clubs">
                  <Button variant="outline">
                    <Users className="mr-2 h-4 w-4" />
                    Browse All Clubs
                  </Button>
                </Link>
                <Link href="/admin/clubs">
                  <Button>
                    <MapPin className="mr-2 h-4 w-4" />
                    Manage Club Data
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
