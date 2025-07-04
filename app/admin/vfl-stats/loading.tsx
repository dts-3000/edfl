import { Loader2 } from "lucide-react"

export default function VFLStatsUploadLoading() {
  return (
    <div className="flex items-center justify-center h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      <span className="ml-2">Loading VFL Stats Upload...</span>
    </div>
  )
}
