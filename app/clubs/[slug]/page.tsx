"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { initializeApp } from "firebase/app"
import { getFirestore, collection, query, where, getDocs, orderBy } from "firebase/firestore"
import Navbar from "@/components/layout/Navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getClubBySlug } from "@/lib/edflClubs"
import { getTeamLogoPath } from "@/lib/teamLogos"
import { Trophy, Medal, ArrowLeft, Calendar } from "lucide-react"
import ClubHistory from "@/components/club/ClubHistory"

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

interface ClubPremiershipRecord {
  id: string
  year: number
  grade: string
  runnerUp?: string
  coach?: string
  captain?: string
  notes?: string
}

interface ClubBestAndFairestRecord {
  id: string
  year: number
  player: string
  grade: string
  votes?: number
  notes?: string
}

interface ClubArticle {
  id: string
  title: string
  content: string
  date: string
  author?: string
  category: "news" | "history" | "achievement" | "general"
  published: boolean
  year: number
  source?: string
}

export default function ClubPage() {
  const params = useParams()
  const slug = params.slug as string
  const club = getClubBySlug(slug)

  const [premierships, setPremierships] = useState<ClubPremiershipRecord[]>([])
  const [bestAndFairest, setBestAndFairest] = useState<ClubBestAndFairestRecord[]>([])
  const [articles, setArticles] = useState<ClubArticle[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (club) {
      loadClubData()
    }
  }, [club])

  const loadClubData = async () => {
    if (!club) return

    try {
      setLoading(true)

      // Load premierships
      const premiershipQuery = query(
        collection(db, "premierships"),
        where("team", "==", club.name),
        orderBy("year", "desc"),
      )
      const premiershipSnapshot = await getDocs(premiershipQuery)
      const premiershipData: ClubPremiershipRecord[] = []
      premiershipSnapshot.forEach((doc) => {
        const data = doc.data()
        premiershipData.push({
          id: doc.id,
          year: data.year,
          grade: data.grade,
          runnerUp: data.runnerUp,
          coach: data.coach,
          captain: data.captain,
          notes: data.notes,
        })
      })
      setPremierships(premiershipData)

      // Load best and fairest
      const bnfQuery = query(collection(db, "bestAndFairest"), where("team", "==", club.name), orderBy("year", "desc"))
      const bnfSnapshot = await getDocs(bnfQuery)
      const bnfData: ClubBestAndFairestRecord[] = []
      bnfSnapshot.forEach((doc) => {
        const data = doc.data()
        bnfData.push({
          id: doc.id,
          year: data.year,
          player: data.player,
          grade: data.grade,
          votes: data.votes,
          notes: data.notes,
        })
      })
      setBestAndFairest(bnfData)

      // Load articles
      const articlesQuery = query(
        collection(db, "clubArticles"),
        where("clubName", "==", club.name),
        where("published", "==", true),
        orderBy("year", "desc"),
      )
      const articlesSnapshot = await getDocs(articlesQuery)
      const articlesData: ClubArticle[] = []
      articlesSnapshot.forEach((doc) => {
        const data = doc.data()
        const date = new Date(data.date)
        articlesData.push({
          id: doc.id,
          title: data.title,
          content: data.content,
          date: data.date,
          author: data.author,
          category: data.category,
          published: data.published,
          year: date.getFullYear(),
          source: data.source,
        })
      })
      setArticles(articlesData)
    } catch (error) {
      console.error("Error loading club data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.onerror = null
    e.currentTarget.src = "/images/teams/placeholder.png"
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-AU", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "news":
        return "bg-blue-100 text-blue-800"
      case "history":
        return "bg-purple-100 text-purple-800"
      case "achievement":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (!club) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="text-center py-12">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Club Not Found</h1>
              <p className="text-gray-600 mb-6">The club you're looking for doesn't exist.</p>
              <Link href="/clubs">
                <Button>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Clubs
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading club information...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex gap-2 mb-4">
            <Link href="/clubs">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Clubs
              </Button>
            </Link>
            <Link href="/league-history">
              <Button variant="outline">
                <Calendar className="mr-2 h-4 w-4" />
                League History
              </Button>
            </Link>
          </div>

          <div className="flex items-center space-x-6">
            <img
              src={getTeamLogoPath(club.name) || "/placeholder.svg"}
              alt={club.name}
              width={80}
              height={80}
              className="h-20 w-20 object-contain"
              onError={handleImageError}
            />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{club.name}</h1>
              <div className="flex items-center space-x-3 mt-2">
                <Badge variant={club.current ? "default" : "secondary"}>
                  {club.current ? "Current Club" : "Historical Club"}
                </Badge>
                {premierships.length > 0 && (
                  <Badge className="bg-yellow-100 text-yellow-800">
                    <Trophy className="mr-1 h-3 w-3" />
                    {premierships.length} Premiership{premierships.length !== 1 ? "s" : ""}
                  </Badge>
                )}
                {bestAndFairest.length > 0 && (
                  <Badge className="bg-purple-100 text-purple-800">
                    <Medal className="mr-1 h-3 w-3" />
                    {bestAndFairest.length} Best & Fairest
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <ClubHistory
              club={club}
              records={[
                ...premierships.map((p) => ({
                  id: p.id || "",
                  type: "premiership" as const,
                  year: p.year,
                  title: `${p.grade} Premiership`,
                  description: p.runnerUp,
                  grade: p.grade,
                  coach: p.coach,
                  captain: p.captain,
                })),
                ...bestAndFairest.map((bf) => ({
                  id: bf.id || "",
                  type: "best-and-fairest" as const,
                  year: bf.year,
                  title: `${bf.grade} Best & Fairest`,
                  player: bf.player,
                  grade: bf.grade,
                  votes: bf.votes,
                })),
                ...articles.map((a) => ({
                  id: a.id || "",
                  type: "article" as const,
                  year: a.year,
                  title: a.title,
                  description: a.content,
                  author: a.author,
                  source: a.source,
                })),
              ].sort((a, b) => b.year - a.year)}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Premierships */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Trophy className="mr-2 h-5 w-5 text-yellow-600" />
                  Premierships ({premierships.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {premierships.length > 0 ? (
                  <div className="space-y-3">
                    {premierships.map((premiership) => (
                      <div key={premiership.id} className="border-l-4 border-yellow-500 pl-3 py-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-lg">{premiership.year}</span>
                          <Badge className="bg-yellow-100 text-yellow-800">{premiership.grade}</Badge>
                        </div>
                        {premiership.runnerUp && (
                          <p className="text-sm text-gray-600">Defeated: {premiership.runnerUp}</p>
                        )}
                        {premiership.coach && <p className="text-xs text-gray-500">Coach: {premiership.coach}</p>}
                        {premiership.captain && <p className="text-xs text-gray-500">Captain: {premiership.captain}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Trophy className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No premierships recorded</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Best & Fairest */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Medal className="mr-2 h-5 w-5 text-purple-600" />
                  Best & Fairest ({bestAndFairest.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {bestAndFairest.length > 0 ? (
                  <div className="space-y-3">
                    {bestAndFairest.map((award) => (
                      <div key={award.id} className="border-l-4 border-purple-500 pl-3 py-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-lg">{award.year}</span>
                          <Badge className="bg-purple-100 text-purple-800">{award.grade}</Badge>
                        </div>
                        <p className="font-medium">{award.player}</p>
                        {award.votes && <p className="text-xs text-gray-500">{award.votes} votes</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Medal className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No best & fairest awards recorded</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Status:</span>
                    <Badge variant={club.current ? "default" : "secondary"}>
                      {club.current ? "Active" : "Historical"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Premierships:</span>
                    <span className="font-medium">{premierships.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Best & Fairest:</span>
                    <span className="font-medium">{bestAndFairest.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Articles:</span>
                    <span className="font-medium">{articles.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
