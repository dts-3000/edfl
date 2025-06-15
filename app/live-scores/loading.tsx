import { RefreshCw } from "lucide-react"

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <div className="text-lg">Loading live scores...</div>
        </div>
      </div>
    </div>
  )
}
