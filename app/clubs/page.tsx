import { Button } from "@/components/ui/button"
import { Calendar } from "lucide-react"
import Link from "next/link"

export default function ClubsPage() {
  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">EDFL Clubs</h1>
          <p className="text-gray-600">Explore current and historical clubs of the Essendon District Football League</p>
        </div>
        <Link href="/league-history">
          <Button variant="outline">
            <Calendar className="mr-2 h-4 w-4" />
            League History
          </Button>
        </Link>
      </div>
      {/* Clubs content will go here */}
    </div>
  )
}
