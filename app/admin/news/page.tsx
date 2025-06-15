"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { getNewsArticles, addNewsArticle, deleteNewsArticle, type NewsArticle } from "@/lib/newsData"
import AdminLayout from "@/components/admin/AdminLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { Loader2, Plus, Trash2, Edit, Check } from "lucide-react"

export default function NewsAdminPage() {
  const [news, setNews] = useState<NewsArticle[]>([])
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [category, setCategory] = useState<"general" | "injury" | "update" | "alert">("general")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editContent, setEditContent] = useState("")
  const [editCategory, setEditCategory] = useState<"general" | "injury" | "update" | "alert">("general")

  useEffect(() => {
    // Load news articles
    const newsArticles = getNewsArticles()
    setNews(newsArticles)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Add new article
      const newArticle = addNewsArticle({
        title,
        content,
        category,
      })

      // Update state
      setNews([newArticle, ...news])

      // Reset form
      setTitle("")
      setContent("")
      setCategory("general")

      toast({
        title: "Success",
        description: "News article published successfully.",
      })
    } catch (error) {
      console.error("Error adding news article:", error)
      toast({
        title: "Error",
        description: "Failed to add news article. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this news article?")) {
      deleteNewsArticle(id)
      setNews(news.filter((article) => article.id !== id))

      toast({
        title: "Success",
        description: "News article deleted successfully.",
      })
    }
  }

  const startEditing = (article: NewsArticle) => {
    setEditingId(article.id)
    setEditTitle(article.title)
    setEditContent(article.content)
    setEditCategory(article.category as "general" | "injury" | "update" | "alert")
  }

  const saveEdit = (id: string) => {
    // In a real implementation, this would update the article in your database
    const updatedNews = news.map((article) =>
      article.id === id ? { ...article, title: editTitle, content: editContent, category: editCategory } : article,
    )

    setNews(updatedNews)
    setEditingId(null)

    toast({
      title: "Success",
      description: "News article updated successfully.",
    })
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">News Management</h1>
          <p className="text-muted-foreground">Create and manage news articles for EDFL Fantasy</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Add News Form */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Add News Article</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Article title"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="content">Content</Label>
                    <Textarea
                      id="content"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Article content"
                      rows={4}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select value={category} onValueChange={(value) => setCategory(value as any)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="injury">Injury</SelectItem>
                        <SelectItem value="update">Update</SelectItem>
                        <SelectItem value="alert">Alert</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Publishing...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Publish Article
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* News List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>News Articles</CardTitle>
              </CardHeader>
              <CardContent>
                {news.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No news articles available.</p>
                ) : (
                  <div className="space-y-4">
                    {news.map((article) => (
                      <div key={article.id} className="border border-gray-200 rounded-lg p-4">
                        {editingId === article.id ? (
                          <div className="space-y-3">
                            <Input
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              className="font-medium text-lg"
                            />
                            <Textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} rows={3} />
                            <div className="flex justify-between items-center">
                              <Select value={editCategory} onValueChange={(value) => setEditCategory(value as any)}>
                                <SelectTrigger className="w-[180px]">
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="general">General</SelectItem>
                                  <SelectItem value="injury">Injury</SelectItem>
                                  <SelectItem value="update">Update</SelectItem>
                                  <SelectItem value="alert">Alert</SelectItem>
                                </SelectContent>
                              </Select>
                              <div className="space-x-2">
                                <Button size="sm" onClick={() => saveEdit(article.id)}>
                                  <Check className="h-4 w-4 mr-1" />
                                  Save
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex justify-between items-start">
                              <h3 className="text-lg font-semibold">{article.title}</h3>
                              <div className="flex space-x-2">
                                <Button size="sm" variant="outline" onClick={() => startEditing(article)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => handleDelete(article.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{article.content}</p>
                            <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                              <span>
                                Category: <span className="font-medium">{article.category}</span>
                              </span>
                              <span>{formatDate(article.date)}</span>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
