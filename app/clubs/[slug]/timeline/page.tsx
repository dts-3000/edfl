"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { getClubBySlug } from "@/lib/edflClubs"
import ClubTimeline from "@/components/club/ClubTimeline"
import Navbar from "@/components/layout/Navbar"

interface TimelineEvent {
  id: string
  year: number
  date: string
  type: "premiership" | "bestfairest" | "article" | "milestone"
  title: string
  description: string
  details?: {
    grade?: string
    runnerUp?: string
    coach?: string
    captain?: string
    player?: string
    votes?: number
    author?: string
    source?: string
    images?: Array<{ url: string; caption?: string }>
  }
}

export default function ClubTimelinePage() {
  const params = useParams()
  const slug = params.slug as string
  const club = getClubBySlug(slug)

  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (club) {
      loadTimelineData()
    }
  }, [club])

  const loadTimelineData = async () => {
    // TODO: Load actual timeline data from Firebase
    // For now, using sample data
    const sampleEvents: TimelineEvent[] = [
      {
        id: "1",
        year: 2023,
        date: "2023-09-15",
        type: "premiership",
        title: "A Grade Premiership",
        description: "Won the A Grade Grand Final in a thrilling match",
        details: {
          grade: "A Grade",
          runnerUp: "Keilor",
          coach: "John Smith",
          captain: "Mike Johnson",
        },
      },
      {
        id: "2",
        year: 2023,
        date: "2023-09-20",
        type: "bestfairest",
        title: "Best & Fairest Winner",
        description: "Club champion awarded for outstanding season",
        details: {
          player: "Tom Wilson",
          grade: "A Grade",
          votes: 28,
        },
      },
      {
        id: "3",
        year: 2022,
        date: "2022-07-15",
        type: "article",
        title: "New Clubrooms Opened",
        description: "Official opening of the new state-of-the-art clubrooms facility",
        details: {
          author: "Club Secretary",
          source: "Club Newsletter",
        },
      },
    ]

    setEvents(sampleEvents)
    setLoading(false)
  }

  if (!club) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Club Not Found</h1>
            <Link href="/clubs">
              <Button>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Clubs
              </Button>
            </Link>
          </div>
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading timeline...</p>
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
          <Link href={`/clubs/${slug}`}>
            <Button variant="outline" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to {club.name}
            </Button>
          </Link>
        </div>

        {/* Timeline */}
        <ClubTimeline club={club} events={events} />
      </div>
    </div>
  )
}
