"use client"

import { useState, useEffect } from "react"
import { getNewsArticles, type NewsArticle, markNewsAsRead } from "@/lib/newsData"

export default function RecentNews() {
  const [news, setNews] = useState<NewsArticle[]>([])

  useEffect(() => {
    // Load news articles
    if (typeof window !== "undefined") {
      const newsArticles = getNewsArticles()
      setNews(newsArticles)
    }
  }, [])

  const handleReadMore = (id: string) => {
    markNewsAsRead(id)
    setNews((prev) => prev.map((article) => (article.id === id ? { ...article, isRead: true } : article)))
  }

  // Format relative time (e.g., "2 days ago")
  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return "just now"
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`

    return date.toLocaleDateString()
  }

  // Get border color based on category
  const getCategoryColor = (category: string) => {
    switch (category) {
      case "injury":
        return "border-yellow-500"
      case "update":
        return "border-green-500"
      case "alert":
        return "border-red-500"
      default:
        return "border-blue-500"
    }
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-bold mb-4">Recent News</h2>
      {news.length === 0 ? (
        <p className="text-gray-500">No recent news available.</p>
      ) : (
        <div className="space-y-4">
          {news.slice(0, 5).map((article) => (
            <div
              key={article.id}
              className={`border-l-4 ${getCategoryColor(article.category)} pl-4 py-2 ${article.isRead ? "opacity-60" : ""}`}
            >
              <p className="text-sm font-medium">{article.title}</p>
              <div className="flex justify-between items-center mt-1">
                <p className="text-xs text-gray-500">{getRelativeTime(article.date)}</p>
                <button
                  onClick={() => handleReadMore(article.id)}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  {article.isRead ? "Read" : "Mark as read"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
