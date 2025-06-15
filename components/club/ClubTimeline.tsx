"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trophy, Medal, FileText, Calendar, ImageIcon, ChevronDown, ChevronUp } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface Club {
  id?: string
  name: string
  current: boolean
}

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

interface ClubTimelineProps {
  club: Club
  events: TimelineEvent[]
}

export default function ClubTimeline({ club, events }: ClubTimelineProps) {
  const [filteredEvents, setFilteredEvents] = useState<TimelineEvent[]>(events)
  const [selectedDecade, setSelectedDecade] = useState<string>("all")
  const [selectedType, setSelectedType] = useState<string>("all")
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set())

  // Get unique decades from events
  const decades = [...new Set(events.map((event) => Math.floor(event.year / 10) * 10))]
    .sort((a, b) => b - a)
    .map((decade) => `${decade}s`)

  const eventTypes = [
    { value: "premiership", label: "Premierships", icon: Trophy, color: "bg-yellow-100 text-yellow-800" },
    { value: "bestfairest", label: "Best & Fairest", icon: Medal, color: "bg-purple-100 text-purple-800" },
    { value: "article", label: "Articles & News", icon: FileText, color: "bg-blue-100 text-blue-800" },
    { value: "milestone", label: "Milestones", icon: Calendar, color: "bg-green-100 text-green-800" },
  ]

  useEffect(() => {
    let filtered = events

    if (selectedDecade !== "all") {
      const decade = Number.parseInt(selectedDecade.replace("s", ""))
      filtered = filtered.filter((event) => Math.floor(event.year / 10) * 10 === decade)
    }

    if (selectedType !== "all") {
      filtered = filtered.filter((event) => event.type === selectedType)
    }

    setFilteredEvents(
      filtered.sort((a, b) => b.year - a.year || new Date(b.date).getTime() - new Date(a.date).getTime()),
    )
  }, [events, selectedDecade, selectedType])

  const toggleEventExpansion = (eventId: string) => {
    const newExpanded = new Set(expandedEvents)
    if (newExpanded.has(eventId)) {
      newExpanded.delete(eventId)
    } else {
      newExpanded.add(eventId)
    }
    setExpandedEvents(newExpanded)
  }

  const getEventIcon = (type: string) => {
    const eventType = eventTypes.find((t) => t.value === type)
    const IconComponent = eventType?.icon || Calendar
    return <IconComponent className="h-5 w-5" />
  }

  const getEventColor = (type: string) => {
    return eventTypes.find((t) => t.value === type)?.color || "bg-gray-100 text-gray-800"
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-AU", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  // Group events by year for better visual organization
  const eventsByYear = filteredEvents.reduce(
    (acc, event) => {
      if (!acc[event.year]) {
        acc[event.year] = []
      }
      acc[event.year].push(event)
      return acc
    },
    {} as Record<number, TimelineEvent[]>,
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{club.name} Timeline</h2>
          <p className="text-muted-foreground">Complete history of achievements, news, and milestones</p>
        </div>
        <div className="flex gap-4">
          <Select value={selectedDecade} onValueChange={setSelectedDecade}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Decade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              {decades.map((decade) => (
                <SelectItem key={decade} value={decade}>
                  {decade}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Event Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              {eventTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Timeline Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {eventTypes.map((type) => {
          const count = events.filter((e) => e.type === type.value).length
          return (
            <Card key={type.value}>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <type.icon className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{type.label}</p>
                    <p className="text-2xl font-bold">{count}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Timeline */}
      {filteredEvents.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Events Found</h3>
            <p className="text-muted-foreground">No events match your current filters.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(eventsByYear)
            .sort(([a], [b]) => Number.parseInt(b) - Number.parseInt(a))
            .map(([year, yearEvents]) => (
              <div key={year} className="relative">
                {/* Year Header */}
                <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-2 mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="bg-primary text-primary-foreground rounded-full px-4 py-2 font-bold text-lg">
                      {year}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {yearEvents.length} event{yearEvents.length !== 1 ? "s" : ""}
                    </div>
                  </div>
                </div>

                {/* Timeline Line */}
                <div className="relative pl-8">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border"></div>

                  {/* Events */}
                  <div className="space-y-6">
                    {yearEvents.map((event, index) => (
                      <div key={event.id} className="relative">
                        {/* Timeline Dot */}
                        <div className="absolute -left-6 top-6 w-4 h-4 rounded-full bg-background border-2 border-primary"></div>

                        {/* Event Card */}
                        <Card className="ml-4">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <Badge className={getEventColor(event.type)}>
                                    {getEventIcon(event.type)}
                                    <span className="ml-1">
                                      {eventTypes.find((t) => t.value === event.type)?.label}
                                    </span>
                                  </Badge>
                                  {event.details?.images && event.details.images.length > 0 && (
                                    <Badge variant="outline">
                                      <ImageIcon className="h-3 w-3 mr-1" />
                                      {event.details.images.length}
                                    </Badge>
                                  )}
                                </div>
                                <CardTitle className="text-lg">{event.title}</CardTitle>
                                <p className="text-sm text-muted-foreground">{formatDate(event.date)}</p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleEventExpansion(event.id)}
                                className="ml-2"
                              >
                                {expandedEvents.has(event.id) ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm mb-3">{event.description}</p>

                            {/* Expanded Details */}
                            {expandedEvents.has(event.id) && event.details && (
                              <div className="space-y-4 pt-4 border-t">
                                {/* Premiership Details */}
                                {event.type === "premiership" && (
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    {event.details.grade && (
                                      <div>
                                        <span className="font-medium">Grade:</span> {event.details.grade}
                                      </div>
                                    )}
                                    {event.details.runnerUp && (
                                      <div>
                                        <span className="font-medium">Defeated:</span> {event.details.runnerUp}
                                      </div>
                                    )}
                                    {event.details.coach && (
                                      <div>
                                        <span className="font-medium">Coach:</span> {event.details.coach}
                                      </div>
                                    )}
                                    {event.details.captain && (
                                      <div>
                                        <span className="font-medium">Captain:</span> {event.details.captain}
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Best & Fairest Details */}
                                {event.type === "bestfairest" && (
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    {event.details.player && (
                                      <div>
                                        <span className="font-medium">Player:</span> {event.details.player}
                                      </div>
                                    )}
                                    {event.details.grade && (
                                      <div>
                                        <span className="font-medium">Grade:</span> {event.details.grade}
                                      </div>
                                    )}
                                    {event.details.votes && (
                                      <div>
                                        <span className="font-medium">Votes:</span> {event.details.votes}
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Article Details */}
                                {event.type === "article" && (
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    {event.details.author && (
                                      <div>
                                        <span className="font-medium">Author:</span> {event.details.author}
                                      </div>
                                    )}
                                    {event.details.source && (
                                      <div>
                                        <span className="font-medium">Source:</span> {event.details.source}
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Images */}
                                {event.details.images && event.details.images.length > 0 && (
                                  <div>
                                    <h4 className="font-medium mb-2">Images</h4>
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                      {event.details.images.map((image, imgIndex) => (
                                        <Dialog key={imgIndex}>
                                          <DialogTrigger asChild>
                                            <div className="cursor-pointer group">
                                              <img
                                                src={image.url || "/placeholder.svg"}
                                                alt={image.caption || "Event image"}
                                                className="w-full h-20 object-cover rounded border group-hover:opacity-80 transition-opacity"
                                              />
                                              {image.caption && (
                                                <p className="text-xs text-muted-foreground mt-1 truncate">
                                                  {image.caption}
                                                </p>
                                              )}
                                            </div>
                                          </DialogTrigger>
                                          <DialogContent className="max-w-4xl">
                                            <DialogHeader>
                                              <DialogTitle>{image.caption || "Event Image"}</DialogTitle>
                                            </DialogHeader>
                                            <div className="flex justify-center">
                                              <img
                                                src={image.url || "/placeholder.svg"}
                                                alt={image.caption || "Event image"}
                                                className="max-w-full max-h-[70vh] object-contain"
                                              />
                                            </div>
                                          </DialogContent>
                                        </Dialog>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}
