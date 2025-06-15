// Club types
export interface Club {
  id: string
  name: string
  slug: string
  location: string
  description: string
  founded?: number
  colors?: string[]
  homeGround?: string
  website?: string
  logoUrl?: string
  createdAt?: Date
  updatedAt?: Date
}

// Club records types
export interface Premiership {
  id: string
  year: number
  grade: string
  coach?: string
  captain?: string
  opponent?: string
  score?: string
  venue?: string
  notes?: string
}

export interface BestAndFairest {
  id: string
  year: number
  player: string
  votes: number
  grade: string
  notes?: string
}

export interface Article {
  id: string
  year: number
  title: string
  content?: string
  author?: string
  source?: string
  date?: string
  images?: ArticleImage[]
  tags?: string[]
}

export interface ArticleImage {
  id: string
  url: string
  caption?: string
  filename: string
}

// Timeline event types
export interface TimelineEvent {
  id: string
  year: number
  type: "premiership" | "bestAndFairest" | "article" | "milestone"
  title: string
  description?: string
  data: Premiership | BestAndFairest | Article | any
}
