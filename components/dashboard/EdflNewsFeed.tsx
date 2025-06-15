"use client"

import { useState, useEffect } from "react"
import { ExternalLink } from "lucide-react"

interface EdflNewsItem {
  id: string
  title: string
  date: string
  imageUrl: string
  link: string
  category?: string
}

export default function EdflNewsFeed() {
  const [news, setNews] = useState<EdflNewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  useEffect(() => {
    const fetchNews = () => {
      try {
        // In a real implementation, this would fetch from an API
        // For now, we'll use mock data that resembles the EDFL website
        const mockEdflNews: EdflNewsItem[] = [
          {
            id: "1",
            title: "EDFL Gameday Central - May 27, 2025",
            date: "2025-05-27",
            imageUrl: "/images/edfl-gameday.png",
            link: "https://essendondfl.com.au/news/edfl-gameday-central-may-27-2025/",
            category: "gameday",
          },
          {
            id: "2",
            title: "EDFL Teams - May 26-27, 2025",
            date: "2025-05-26",
            imageUrl: "/images/edfl-teams.png",
            link: "https://essendondfl.com.au/news/edfl-teams-may-26-27-2025/",
            category: "teams",
          },
          {
            id: "3",
            title: "EDFL Women's Weekend Outlook - May 26-27, 2025",
            date: "2025-05-26",
            imageUrl: "/images/edfl-womens.png",
            link: "https://essendondfl.com.au/news/edfl-womens-weekend-outlook-may-26-27-2025/",
            category: "womens",
          },
          {
            id: "4",
            title: "Round 7 Preview - Premier Division",
            date: "2025-05-25",
            imageUrl: "/images/edfl-preview.png",
            link: "https://essendondfl.com.au/news/round-7-preview-premier-division/",
            category: "preview",
          },
          {
            id: "5",
            title: "Player of the Week - Round 6",
            date: "2025-05-24",
            imageUrl: "/images/edfl-potw.png",
            link: "https://essendondfl.com.au/news/player-of-the-week-round-6/",
            category: "awards",
          },
        ]

        // Simulate API fetch with updated dates
        setTimeout(() => {
          setNews(mockEdflNews)
          setLoading(false)
          setError(null)
          setLastUpdated(new Date())
        }, 500)
      } catch (err) {
        console.error("Error fetching news:", err)
        setError("Failed to load news")
        setLoading(false)
      }
    }

    // Initial fetch
    fetchNews()

    // Set up automatic refresh twice a day (every 12 hours)
    const refreshInterval = setInterval(fetchNews, 12 * 60 * 60 * 1000) // 12 hours in milliseconds

    // Cleanup interval on component unmount
    return () => clearInterval(refreshInterval)
  }, [])

  // Get category color
  const getCategoryColor = (category?: string) => {
    if (!category || typeof category !== "string") return "border-gray-500"

    switch (category.toLowerCase()) {
      case "gameday":
        return "border-red-500"
      case "teams":
        return "border-blue-500"
      case "womens":
        return "border-purple-500"
      case "preview":
        return "border-green-500"
      case "awards":
        return "border-yellow-500"
      default:
        return "border-gray-500"
    }
  }

  if (error) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">EDFL News</h2>
        <p className="text-red-500">Error loading EDFL news: {error}</p>
      </div>
    )
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold">EDFL News</h2>
          <p className="text-xs text-gray-500">
            Last updated:{" "}
            {lastUpdated.toLocaleTimeString("en-AU", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        <a
          href="https://essendondfl.com.au/news/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
        >
          View All <ExternalLink className="ml-1 h-3 w-3" />
        </a>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {news
            .filter((item) => item && item.id && item.title)
            .map((item) => (
              <a
                key={item.id}
                href={item.link || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className={`block border-l-4 ${getCategoryColor(item.category)} pl-4 py-2 hover:bg-gray-50 transition-colors`}
              >
                <p className="text-sm font-medium line-clamp-2">{item.title || "Untitled"}</p>
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-gray-500">
                    {item.date
                      ? new Date(item.date).toLocaleDateString("en-AU", { day: "numeric", month: "short" })
                      : "Unknown date"}
                  </p>
                  <span className="text-xs text-blue-600">Read More</span>
                </div>
              </a>
            ))}
        </div>
      )}
    </div>
  )
}
