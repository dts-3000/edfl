export interface NewsArticle {
  id: string
  title: string
  content: string
  date: string // ISO string format
  category: "general" | "injury" | "update" | "alert"
  isRead?: boolean
}

// Get all news articles
export function getNewsArticles(): NewsArticle[] {
  if (typeof window === "undefined") return defaultNews

  try {
    const newsData = localStorage.getItem("fantasyNews")
    if (newsData) {
      return JSON.parse(newsData)
    }
  } catch (error) {
    console.error("Error loading news data:", error)
  }

  // Return default news if none exists
  return defaultNews
}

// Add a new news article
export function addNewsArticle(article: Omit<NewsArticle, "id" | "date">): NewsArticle {
  const newArticle: NewsArticle = {
    ...article,
    id: generateId(),
    date: new Date().toISOString(),
  }

  if (typeof window === "undefined") return newArticle

  const currentNews = getNewsArticles()
  const updatedNews = [newArticle, ...currentNews].slice(0, 50) // Keep only the latest 50 news items

  try {
    localStorage.setItem("fantasyNews", JSON.stringify(updatedNews))
  } catch (error) {
    console.error("Error saving news data:", error)
  }

  return newArticle
}

// Mark a news article as read
export function markNewsAsRead(id: string): void {
  if (typeof window === "undefined") return

  const currentNews = getNewsArticles()
  const updatedNews = currentNews.map((article) => (article.id === id ? { ...article, isRead: true } : article))

  try {
    localStorage.setItem("fantasyNews", JSON.stringify(updatedNews))
  } catch (error) {
    console.error("Error updating news data:", error)
  }
}

// Delete a news article
export function deleteNewsArticle(id: string): void {
  if (typeof window === "undefined") return

  const currentNews = getNewsArticles()
  const updatedNews = currentNews.filter((article) => article.id !== id)

  try {
    localStorage.setItem("fantasyNews", JSON.stringify(updatedNews))
  } catch (error) {
    console.error("Error deleting news data:", error)
  }
}

// Helper function to generate a unique ID
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2)
}

// Default news articles
const defaultNews: NewsArticle[] = [
  {
    id: "news-1",
    title: "Round 10 starts this weekend",
    content: "Get your teams ready for Round 10 of the EDFL season. Make sure to check player availability.",
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    category: "general",
  },
  {
    id: "news-2",
    title: "3 players on injury watch",
    content: "Smith, Johnson, and Williams are all under injury clouds heading into this weekend's matches.",
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    category: "injury",
  },
  {
    id: "news-3",
    title: "Fantasy scores updated",
    content: "All player scores have been updated following the completion of Round 9.",
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    category: "update",
  },
]
