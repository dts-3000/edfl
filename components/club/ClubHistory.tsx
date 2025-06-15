"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Trophy, Medal, Calendar, Users, MapPin, Clock } from "lucide-react"
import Link from "next/link"

interface Club {
  id?: string
  name: string
  current: boolean
  founded?: number
  location?: string
  colors?: string[]
  nickname?: string
}

interface ClubRecord {
  id: string
  type: "premiership" | "best-and-fairest" | "article" | "milestone"
  year: number
  title: string
  description?: string
  grade?: string
  player?: string
  coach?: string
  captain?: string
  votes?: number
  author?: string
  source?: string
  images?: string[]
}

interface ClubHistoryProps {
  club: Club
  records: ClubRecord[]
}

export default function ClubHistory({ club, records }: ClubHistoryProps) {
  // Separate records by type
  const premierships = records.filter((r) => r.type === "premiership").sort((a, b) => b.year - a.year)
  const bestAndFairest = records.filter((r) => r.type === "best-and-fairest").sort((a, b) => b.year - a.year)
  const articles = records.filter((r) => r.type === "article").sort((a, b) => b.year - a.year)
  const milestones = records.filter((r) => r.type === "milestone").sort((a, b) => b.year - a.year)

  // Get key statistics
  const totalPremierships = premierships.length
  const firstPremiership = premierships.length > 0 ? Math.min(...premierships.map((p) => p.year)) : null
  const lastPremiership = premierships.length > 0 ? Math.max(...premierships.map((p) => p.year)) : null
  const totalBestAndFairest = bestAndFairest.length

  // Get recent highlights (last 10 years)
  const currentYear = new Date().getFullYear()
  const recentRecords = records
    .filter((r) => r.year >= currentYear - 10)
    .sort((a, b) => b.year - a.year)
    .slice(0, 5)

  // Get founding era info
  const foundingDecade = club.founded ? Math.floor(club.founded / 10) * 10 : null

  return (
    <div className="space-y-6">
      {/* Club Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Club Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{totalPremierships}</div>
              <div className="text-sm text-muted-foreground">Premierships</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{totalBestAndFairest}</div>
              <div className="text-sm text-muted-foreground">Best & Fairest</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{articles.length}</div>
              <div className="text-sm text-muted-foreground">Historical Articles</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{club.founded || "Est."}</div>
              <div className="text-sm text-muted-foreground">
                {foundingDecade ? `${foundingDecade}s Era` : "Founded"}
              </div>
            </div>
          </div>

          {/* Club Details */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Badge variant={club.current ? "default" : "secondary"}>
                {club.current ? "Current Club" : "Historical Club"}
              </Badge>
            </div>
            {club.location && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {club.location}
              </div>
            )}
            {club.nickname && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />"{club.nickname}"
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Highlights */}
      {recentRecords.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Highlights (Last 10 Years)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentRecords.map((record) => (
                <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {record.type === "premiership" && <Trophy className="h-4 w-4 text-yellow-600" />}
                    {record.type === "best-and-fairest" && <Medal className="h-4 w-4 text-purple-600" />}
                    {record.type === "article" && <Calendar className="h-4 w-4 text-blue-600" />}
                    <div>
                      <div className="font-medium">{record.title}</div>
                      {record.description && <div className="text-sm text-muted-foreground">{record.description}</div>}
                    </div>
                  </div>
                  <Badge variant="outline">{record.year}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Championship History */}
      {premierships.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-600" />
              Championship History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 text-sm text-muted-foreground">
              {firstPremiership && lastPremiership && (
                <span>
                  Premiership era: {firstPremiership} - {lastPremiership}
                  {firstPremiership !== lastPremiership && (
                    <span> ({lastPremiership - firstPremiership + 1} year span)</span>
                  )}
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {premierships.slice(0, 6).map((prem) => (
                <div key={prem.id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-lg">{prem.year}</span>
                    <Badge className="bg-yellow-100 text-yellow-800">{prem.grade}</Badge>
                  </div>
                  {prem.description && <div className="text-sm text-muted-foreground">vs {prem.description}</div>}
                  {prem.coach && <div className="text-xs text-muted-foreground">Coach: {prem.coach}</div>}
                </div>
              ))}
            </div>
            {premierships.length > 6 && (
              <div className="mt-4 text-center">
                <Link href={`/clubs/${club.name.toLowerCase().replace(/\s+/g, "-")}/timeline`}>
                  <Button variant="outline">View All {premierships.length} Premierships</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Club Legends */}
      {bestAndFairest.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Medal className="h-5 w-5 text-purple-600" />
              Club Legends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {bestAndFairest.slice(0, 6).map((bf) => (
                <div key={bf.id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-lg">{bf.year}</span>
                    <Badge className="bg-purple-100 text-purple-800">{bf.grade}</Badge>
                  </div>
                  <div className="font-medium">{bf.player}</div>
                  {bf.votes && <div className="text-xs text-muted-foreground">{bf.votes} votes</div>}
                </div>
              ))}
            </div>
            {bestAndFairest.length > 6 && (
              <div className="mt-4 text-center">
                <Link href={`/clubs/${club.name.toLowerCase().replace(/\s+/g, "-")}/timeline`}>
                  <Button variant="outline">View All {bestAndFairest.length} Best & Fairest Winners</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Historical Articles */}
      {articles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Historical Articles & News
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {articles.slice(0, 3).map((article) => (
                <div key={article.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold">{article.title}</h4>
                    <Badge variant="outline">{article.year}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{article.description}</p>
                  <div className="text-xs text-muted-foreground">
                    {article.author && `By ${article.author}`}
                    {article.source && ` • ${article.source}`}
                  </div>
                </div>
              ))}
            </div>
            {articles.length > 3 && (
              <div className="mt-4 text-center">
                <Link href={`/clubs/${club.name.toLowerCase().replace(/\s+/g, "-")}/timeline`}>
                  <Button variant="outline">View All {articles.length} Historical Articles</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Call to Action */}
      <Card>
        <CardContent className="text-center py-8">
          <h3 className="text-lg font-medium mb-2">Explore {club.name}'s Complete History</h3>
          <p className="text-muted-foreground mb-4">
            View the complete timeline of achievements, articles, and milestones
          </p>
          <Link href={`/clubs/${club.name.toLowerCase().replace(/\s+/g, "-")}/timeline`}>
            <Button>
              <Calendar className="mr-2 h-4 w-4" />
              View Complete Timeline
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
