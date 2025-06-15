"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Trash2, Plus, FileText, Calendar, Upload, ImageIcon, X } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "sonner"
import { getClubRecords, addClubRecord, deleteClubRecord } from "@/lib/firebase/actions"
import { uploadImage, deleteImage } from "@/lib/firebase/storage"

interface Club {
  id: string
  name: string
  current: boolean
}

interface Premiership {
  id?: string
  year: number
  grade: string
  runnerUp?: string
  coach?: string
  captain?: string
  notes?: string
}

interface BestAndFairest {
  id?: string
  year: number
  playerName: string
  grade: string
  votes?: number
  notes?: string
}

interface ArticleImage {
  id: string
  url: string
  filename: string
  caption?: string
  uploadedAt: string
}

interface ClubArticle {
  id?: string
  year: number
  title: string
  content: string
  type: "article" | "news" | "cutting" | "comment"
  date: string
  author?: string
  source?: string
  tags?: string[]
  images?: ArticleImage[]
}

interface ClubRecordsFormProps {
  club: Club
  onSave: () => void
  onCancel: () => void
}

export default function ClubRecordsForm({ club, onSave, onCancel }: ClubRecordsFormProps) {
  const [premierships, setPremierships] = useState<Premiership[]>([])
  const [bestAndFairest, setBestAndFairest] = useState<BestAndFairest[]>([])
  const [articles, setArticles] = useState<ClubArticle[]>([])
  const [loading, setLoading] = useState(true)

  const [newPremiership, setNewPremiership] = useState<Premiership>({
    year: new Date().getFullYear(),
    grade: "A Grade",
  })

  const [newBestAndFairest, setNewBestAndFairest] = useState<BestAndFairest>({
    year: new Date().getFullYear(),
    playerName: "",
    grade: "A Grade",
  })

  const [newArticle, setNewArticle] = useState<ClubArticle>({
    year: new Date().getFullYear(),
    title: "",
    content: "",
    type: "article",
    date: new Date().toISOString().split("T")[0],
    images: [],
  })

  const [isArticleDialogOpen, setIsArticleDialogOpen] = useState(false)
  const [selectedYear, setSelectedYear] = useState<number | "all">("all")
  const [uploadingImages, setUploadingImages] = useState<boolean>(false)

  const grades = ["A Grade", "B Grade", "C Grade", "D Grade", "A Reserve", "B Reserve", "Under 19s", "Under 17s"]
  const articleTypes = [
    { value: "article", label: "Article", color: "bg-blue-100 text-blue-800" },
    { value: "news", label: "News", color: "bg-green-100 text-green-800" },
    { value: "cutting", label: "News Cutting", color: "bg-yellow-100 text-yellow-800" },
    { value: "comment", label: "Comment", color: "bg-purple-100 text-purple-800" },
  ]

  // Load existing records
  useEffect(() => {
    loadRecords()
  }, [club.id])

  const loadRecords = async () => {
    try {
      setLoading(true)
      console.log("Loading records for club:", club.id)
      const records = await getClubRecords(club.id)
      console.log("Loaded records:", records)

      // Separate records by type
      const prems = records
        .filter((r) => r.type === "premiership")
        .map((r) => ({
          id: r.id,
          year: r.year,
          grade: r.grade || "A Grade",
          runnerUp: r.description,
          coach: r.coach,
          captain: r.captain,
        }))

      const bfs = records
        .filter((r) => r.type === "best-and-fairest")
        .map((r) => ({
          id: r.id,
          year: r.year,
          playerName: r.player || "",
          grade: r.grade || "A Grade",
          votes: r.votes,
        }))

      const arts = records
        .filter((r) => r.type === "article")
        .map((r) => ({
          id: r.id,
          year: r.year,
          title: r.title,
          content: r.description || "",
          type: "article" as const,
          date: new Date().toISOString().split("T")[0],
          author: r.author,
          source: r.source,
          images:
            r.images?.map((img, index) => ({
              id: `${r.id}-${index}`,
              url: img,
              filename: img,
              caption: "",
              uploadedAt: new Date().toISOString(),
            })) || [],
        }))

      setPremierships(prems)
      setBestAndFairest(bfs)
      setArticles(arts)
      console.log("Records loaded successfully:", { prems: prems.length, bfs: bfs.length, arts: arts.length })
    } catch (error) {
      console.error("Error loading records:", error)
      toast.error("Failed to load club records")
    } finally {
      setLoading(false)
    }
  }

  const addPremiership = async () => {
    console.log("=== ADDING PREMIERSHIP ===")
    console.log("New premiership data:", newPremiership)
    console.log("Club ID:", club.id)

    if (!newPremiership.year || !newPremiership.grade) {
      console.error("Missing required fields:", { year: newPremiership.year, grade: newPremiership.grade })
      toast.error("Please fill in Year and Grade")
      return
    }

    try {
      const recordData = {
        type: "premiership" as const,
        year: newPremiership.year,
        title: `${newPremiership.grade} Premiership`,
        description: newPremiership.runnerUp || "",
        grade: newPremiership.grade,
        coach: newPremiership.coach || "",
        captain: newPremiership.captain || "",
      }

      console.log("Record data to save:", recordData)

      const id = await addClubRecord(club.id, recordData)
      console.log("✅ Premiership saved with ID:", id)

      const newPrem = { ...newPremiership, id }
      setPremierships([...premierships, newPrem].sort((a, b) => b.year - a.year))
      setNewPremiership({ year: new Date().getFullYear(), grade: "A Grade" })
      toast.success("Premiership added successfully")
    } catch (error) {
      console.error("❌ Error adding premiership:", error)
      toast.error(`Failed to add premiership: ${error.message}`)
    }
  }

  const addBestAndFairest = async () => {
    console.log("=== ADDING BEST & FAIREST ===")
    console.log("New Best & Fairest data:", newBestAndFairest)
    console.log("Club ID:", club.id)

    if (!newBestAndFairest.year || !newBestAndFairest.playerName || !newBestAndFairest.grade) {
      console.error("Missing required fields:", {
        year: newBestAndFairest.year,
        playerName: newBestAndFairest.playerName,
        grade: newBestAndFairest.grade,
      })
      toast.error("Please fill in Year, Player Name, and Grade")
      return
    }

    try {
      const recordData = {
        type: "best-and-fairest" as const,
        year: newBestAndFairest.year,
        title: `${newBestAndFairest.grade} Best & Fairest`,
        player: newBestAndFairest.playerName,
        grade: newBestAndFairest.grade,
        votes: newBestAndFairest.votes || 0,
      }

      console.log("Record data to save:", recordData)

      const id = await addClubRecord(club.id, recordData)
      console.log("✅ Best & Fairest saved with ID:", id)

      const newBF = { ...newBestAndFairest, id }
      setBestAndFairest([...bestAndFairest, newBF].sort((a, b) => b.year - a.year))
      setNewBestAndFairest({ year: new Date().getFullYear(), playerName: "", grade: "A Grade" })
      toast.success("Best & Fairest added successfully")
    } catch (error) {
      console.error("❌ Error adding Best & Fairest:", error)
      toast.error(`Failed to add Best & Fairest: ${error.message}`)
    }
  }

  const handleImageUpload = async (files: FileList | null) => {
    if (!files) return

    setUploadingImages(true)
    const uploadedImages: ArticleImage[] = []

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        if (!file.type.startsWith("image/")) continue

        const result = await uploadImage(file, `club-articles/${club.name}`)

        const imageData: ArticleImage = {
          id: `${Date.now()}-${i}`,
          url: result.url,
          filename: result.filename,
          caption: "",
          uploadedAt: new Date().toISOString(),
        }

        uploadedImages.push(imageData)
      }

      setNewArticle({
        ...newArticle,
        images: [...(newArticle.images || []), ...uploadedImages],
      })

      toast.success(`${uploadedImages.length} image(s) uploaded successfully`)
    } catch (error) {
      console.error("Error uploading images:", error)
      toast.error("Failed to upload images")
    } finally {
      setUploadingImages(false)
    }
  }

  const removeImage = async (imageId: string) => {
    const image = newArticle.images?.find((img) => img.id === imageId)
    if (!image) return

    try {
      await deleteImage(image.filename)
      setNewArticle({
        ...newArticle,
        images: newArticle.images?.filter((img) => img.id !== imageId) || [],
      })
      toast.success("Image removed successfully")
    } catch (error) {
      console.error("Error deleting image:", error)
      setNewArticle({
        ...newArticle,
        images: newArticle.images?.filter((img) => img.id !== imageId) || [],
      })
    }
  }

  const addArticle = async () => {
    console.log("=== ADDING ARTICLE ===")
    console.log("New article data:", newArticle)
    console.log("Club ID:", club.id)

    if (!newArticle.year || !newArticle.title || !newArticle.content) {
      console.error("Missing required fields:", {
        year: newArticle.year,
        title: newArticle.title,
        content: newArticle.content,
      })
      toast.error("Please fill in all required fields (Year, Title, Content)")
      return
    }

    try {
      const recordData = {
        type: "article" as const,
        year: newArticle.year,
        title: newArticle.title,
        description: newArticle.content,
        author: newArticle.author || "",
        source: newArticle.source || "",
        images: newArticle.images?.map((img) => img.url) || [],
      }

      console.log("Record data to save:", recordData)

      const id = await addClubRecord(club.id, recordData)
      console.log("✅ Article saved with ID:", id)

      const article: ClubArticle = { ...newArticle, id }
      setArticles(
        [...articles, article].sort(
          (a, b) => b.year - a.year || new Date(b.date).getTime() - new Date(a.date).getTime(),
        ),
      )

      // Reset form
      setNewArticle({
        year: new Date().getFullYear(),
        title: "",
        content: "",
        type: "article",
        date: new Date().toISOString().split("T")[0],
        images: [],
      })
      setIsArticleDialogOpen(false)
      toast.success("Article added successfully")
    } catch (error) {
      console.error("❌ Error adding article:", error)
      toast.error(`Failed to add article: ${error.message}`)
    }
  }

  const removePremiership = async (index: number) => {
    const prem = premierships[index]
    if (prem.id) {
      try {
        await deleteClubRecord(club.id, prem.id)
        setPremierships(premierships.filter((_, i) => i !== index))
        toast.success("Premiership deleted successfully")
      } catch (error) {
        console.error("Error deleting premiership:", error)
        toast.error("Failed to delete premiership")
      }
    }
  }

  const removeBestAndFairest = async (index: number) => {
    const bf = bestAndFairest[index]
    if (bf.id) {
      try {
        await deleteClubRecord(club.id, bf.id)
        setBestAndFairest(bestAndFairest.filter((_, i) => i !== index))
        toast.success("Best & Fairest deleted successfully")
      } catch (error) {
        console.error("Error deleting best & fairest:", error)
        toast.error("Failed to delete Best & Fairest")
      }
    }
  }

  const removeArticle = async (id: string) => {
    if (confirm("Are you sure you want to delete this article and all its images?")) {
      try {
        await deleteClubRecord(club.id, id)
        setArticles(articles.filter((article) => article.id !== id))
        toast.success("Article deleted successfully")
      } catch (error) {
        console.error("Error deleting article:", error)
        toast.error("Failed to delete article")
      }
    }
  }

  // Get unique years from articles for filtering
  const articleYears = [...new Set(articles.map((article) => article.year))].sort((a, b) => b - a)

  // Filter articles by selected year
  const filteredArticles =
    selectedYear === "all" ? articles : articles.filter((article) => article.year === selectedYear)

  // Group articles by year
  const articlesByYear = filteredArticles.reduce(
    (acc, article) => {
      if (!acc[article.year]) {
        acc[article.year] = []
      }
      acc[article.year].push(article)
      return acc
    },
    {} as Record<number, ClubArticle[]>,
  )

  const getTypeColor = (type: string) => {
    return articleTypes.find((t) => t.value === type)?.color || "bg-gray-100 text-gray-800"
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading club records...</div>
      </div>
    )
  }

  const debugClubData = () => {
    console.log("=== CLUB DEBUG INFO ===")
    console.log("Club object:", club)
    console.log("Club ID:", club.id)
    console.log("Club name:", club.name)
    console.log("Current premierships:", premierships)
    console.log("Current Best & Fairest:", bestAndFairest)
    console.log("Current articles:", articles)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Club Records - {club.name}</h2>
        <div className="text-sm text-muted-foreground">
          {premierships.length} Premierships • {bestAndFairest.length} Best & Fairest • {articles.length} Articles
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <Button onClick={debugClubData} variant="outline" size="sm">
          🐛 Debug Club Data
        </Button>
      </div>

      <Tabs defaultValue="premierships" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="premierships">Premierships ({premierships.length})</TabsTrigger>
          <TabsTrigger value="bestfairest">Best & Fairest ({bestAndFairest.length})</TabsTrigger>
          <TabsTrigger value="articles">Articles & News ({articles.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="premierships" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add Premiership</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="prem-year">Year *</Label>
                  <Input
                    id="prem-year"
                    type="number"
                    value={newPremiership.year}
                    onChange={(e) => setNewPremiership({ ...newPremiership, year: Number.parseInt(e.target.value) })}
                    min="1930"
                    max={new Date().getFullYear()}
                  />
                </div>
                <div>
                  <Label htmlFor="prem-grade">Grade *</Label>
                  <Select
                    value={newPremiership.grade}
                    onValueChange={(value) => setNewPremiership({ ...newPremiership, grade: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {grades.map((grade) => (
                        <SelectItem key={grade} value={grade}>
                          {grade}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="prem-runner-up">Runner Up</Label>
                  <Input
                    id="prem-runner-up"
                    value={newPremiership.runnerUp || ""}
                    onChange={(e) => setNewPremiership({ ...newPremiership, runnerUp: e.target.value })}
                    placeholder="Defeated team"
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={addPremiership} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <Label htmlFor="prem-coach">Coach</Label>
                  <Input
                    id="prem-coach"
                    value={newPremiership.coach || ""}
                    onChange={(e) => setNewPremiership({ ...newPremiership, coach: e.target.value })}
                    placeholder="Premiership coach"
                  />
                </div>
                <div>
                  <Label htmlFor="prem-captain">Captain</Label>
                  <Input
                    id="prem-captain"
                    value={newPremiership.captain || ""}
                    onChange={(e) => setNewPremiership({ ...newPremiership, captain: e.target.value })}
                    placeholder="Team captain"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Premiership History</CardTitle>
            </CardHeader>
            <CardContent>
              {premierships.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No premierships recorded</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Year</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Runner Up</TableHead>
                      <TableHead>Coach</TableHead>
                      <TableHead>Captain</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {premierships.map((prem, index) => (
                      <TableRow key={prem.id || index}>
                        <TableCell className="font-medium">{prem.year}</TableCell>
                        <TableCell>{prem.grade}</TableCell>
                        <TableCell>{prem.runnerUp || "-"}</TableCell>
                        <TableCell>{prem.coach || "-"}</TableCell>
                        <TableCell>{prem.captain || "-"}</TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm" onClick={() => removePremiership(index)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bestfairest" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add Best & Fairest Winner</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="bf-year">Year *</Label>
                  <Input
                    id="bf-year"
                    type="number"
                    value={newBestAndFairest.year}
                    onChange={(e) =>
                      setNewBestAndFairest({ ...newBestAndFairest, year: Number.parseInt(e.target.value) })
                    }
                    min="1930"
                    max={new Date().getFullYear()}
                  />
                </div>
                <div>
                  <Label htmlFor="bf-player">Player Name *</Label>
                  <Input
                    id="bf-player"
                    value={newBestAndFairest.playerName}
                    onChange={(e) => setNewBestAndFairest({ ...newBestAndFairest, playerName: e.target.value })}
                    placeholder="Player name"
                  />
                </div>
                <div>
                  <Label htmlFor="bf-grade">Grade *</Label>
                  <Select
                    value={newBestAndFairest.grade}
                    onValueChange={(value) => setNewBestAndFairest({ ...newBestAndFairest, grade: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {grades.map((grade) => (
                        <SelectItem key={grade} value={grade}>
                          {grade}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button onClick={addBestAndFairest} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <Label htmlFor="bf-votes">Votes</Label>
                  <Input
                    id="bf-votes"
                    type="number"
                    value={newBestAndFairest.votes || ""}
                    onChange={(e) =>
                      setNewBestAndFairest({
                        ...newBestAndFairest,
                        votes: Number.parseInt(e.target.value) || undefined,
                      })
                    }
                    placeholder="Vote count"
                  />
                </div>
                <div>
                  <Label htmlFor="bf-notes">Notes</Label>
                  <Input
                    id="bf-notes"
                    value={newBestAndFairest.notes || ""}
                    onChange={(e) => setNewBestAndFairest({ ...newBestAndFairest, notes: e.target.value })}
                    placeholder="Additional notes"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Best & Fairest History</CardTitle>
            </CardHeader>
            <CardContent>
              {bestAndFairest.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No Best & Fairest winners recorded</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Year</TableHead>
                      <TableHead>Player</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Votes</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bestAndFairest.map((bf, index) => (
                      <TableRow key={bf.id || index}>
                        <TableCell className="font-medium">{bf.year}</TableCell>
                        <TableCell>{bf.playerName}</TableCell>
                        <TableCell>{bf.grade}</TableCell>
                        <TableCell>{bf.votes || "-"}</TableCell>
                        <TableCell>{bf.notes || "-"}</TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm" onClick={() => removeBestAndFairest(index)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="articles" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex gap-4 items-center">
              <div>
                <Label htmlFor="year-filter">Filter by Year</Label>
                <Select
                  value={selectedYear.toString()}
                  onValueChange={(value) => setSelectedYear(value === "all" ? "all" : Number.parseInt(value))}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Years</SelectItem>
                    {articleYears.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Dialog open={isArticleDialogOpen} onOpenChange={setIsArticleDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Article
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Article</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor="article-year">Year *</Label>
                      <Input
                        id="article-year"
                        type="number"
                        value={newArticle.year}
                        onChange={(e) => setNewArticle({ ...newArticle, year: Number.parseInt(e.target.value) })}
                        min="1930"
                        max={new Date().getFullYear()}
                      />
                    </div>
                    <div>
                      <Label htmlFor="article-type">Type *</Label>
                      <Select
                        value={newArticle.type}
                        onValueChange={(value: any) => setNewArticle({ ...newArticle, type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {articleTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="article-date">Date</Label>
                      <Input
                        id="article-date"
                        type="date"
                        value={newArticle.date}
                        onChange={(e) => setNewArticle({ ...newArticle, date: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="article-author">Author</Label>
                      <Input
                        id="article-author"
                        value={newArticle.author || ""}
                        onChange={(e) => setNewArticle({ ...newArticle, author: e.target.value })}
                        placeholder="Author name"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="article-title">Title *</Label>
                      <Input
                        id="article-title"
                        value={newArticle.title}
                        onChange={(e) => setNewArticle({ ...newArticle, title: e.target.value })}
                        placeholder="Article title"
                      />
                    </div>
                    <div>
                      <Label htmlFor="article-source">Source</Label>
                      <Input
                        id="article-source"
                        value={newArticle.source || ""}
                        onChange={(e) => setNewArticle({ ...newArticle, source: e.target.value })}
                        placeholder="e.g., Herald Sun, Local Paper"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="article-content">Content *</Label>
                    <Textarea
                      id="article-content"
                      value={newArticle.content}
                      onChange={(e) => setNewArticle({ ...newArticle, content: e.target.value })}
                      placeholder="Article content, news cutting text, or comments..."
                      rows={6}
                    />
                  </div>

                  {/* Image Upload Section */}
                  <div className="space-y-4">
                    <div className="border-t pt-4">
                      <Label className="text-base font-semibold">Images & Photos</Label>
                      <p className="text-sm text-muted-foreground mb-4">
                        Upload photos, news cuttings, or other images related to this article.
                      </p>

                      <div className="flex items-center gap-4 mb-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            const input = document.createElement("input")
                            input.type = "file"
                            input.accept = "image/*"
                            input.multiple = true
                            input.onchange = (e) => {
                              const files = (e.target as HTMLInputElement).files
                              handleImageUpload(files)
                            }
                            input.click()
                          }}
                          disabled={uploadingImages}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          {uploadingImages ? "Uploading..." : "Upload Images"}
                        </Button>
                      </div>

                      {/* Display uploaded images */}
                      {newArticle.images && newArticle.images.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {newArticle.images.map((image) => (
                            <div key={image.id} className="relative group">
                              <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                                <img
                                  src={image.url || "/placeholder.svg"}
                                  alt={image.caption || "Article image"}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => removeImage(image.id)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                              {image.caption && (
                                <p className="text-xs text-muted-foreground mt-1 truncate">{image.caption}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button variant="outline" onClick={() => setIsArticleDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={addArticle}>Add Article</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {articles.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Articles Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start building this club's story by adding articles, news cuttings, and comments.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {Object.entries(articlesByYear)
                .sort(([a], [b]) => Number.parseInt(b) - Number.parseInt(a))
                .map(([year, articles]) => (
                  <Card key={year}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        {year} ({articles.length} {articles.length === 1 ? "item" : "items"})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {articles.map((article) => (
                          <div key={article.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-semibold">{article.title}</h4>
                                  <Badge className={getTypeColor(article.type)}>
                                    {articleTypes.find((t) => t.value === article.type)?.label}
                                  </Badge>
                                  {article.images && article.images.length > 0 && (
                                    <Badge variant="outline" className="text-xs">
                                      <ImageIcon className="h-3 w-3 mr-1" />
                                      {article.images.length} image{article.images.length !== 1 ? "s" : ""}
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-sm text-muted-foreground mb-2">
                                  {new Date(article.date).toLocaleDateString()}
                                  {article.author && ` • By ${article.author}`}
                                  {article.source && ` • ${article.source}`}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => removeArticle(article.id!)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-3 mb-3">{article.content}</p>

                            {/* Display article images */}
                            {article.images && article.images.length > 0 && (
                              <div className="flex gap-2 overflow-x-auto pb-2">
                                {article.images.map((image) => (
                                  <div key={image.id} className="flex-shrink-0">
                                    <img
                                      src={image.url || "/placeholder.svg"}
                                      alt={image.caption || "Article image"}
                                      className="h-20 w-20 object-cover rounded border"
                                    />
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={onSave}>Close</Button>
      </div>
    </div>
  )
}
