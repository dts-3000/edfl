"use client"

import { useState } from "react"
import type { LogoSettings } from "./index"
import { Button } from "@/components/ui/button"
import { Download, Share2, Save } from "lucide-react"
import { toast } from "sonner"

interface ExportOptionsProps {
  settings: LogoSettings
}

export function ExportOptions({ settings }: ExportOptionsProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleDownload = () => {
    setIsExporting(true)

    // Simulate export process
    setTimeout(() => {
      toast.success("Logo downloaded successfully!", {
        description: "Your logo has been downloaded as a PNG file.",
        duration: 5000,
      })
      setIsExporting(false)
    }, 1500)
  }

  const handleSave = () => {
    toast.success("Logo saved to your account!", {
      description: "Your logo has been saved to your team profile.",
      duration: 5000,
    })
  }

  const handleShare = () => {
    toast.success("Share link copied to clipboard!", {
      description: "Now you can paste the link to share your logo design.",
      duration: 5000,
    })
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Export Options</h3>

      <div className="grid grid-cols-3 gap-2">
        <Button
          onClick={handleDownload}
          disabled={isExporting}
          className="flex flex-col items-center justify-center h-20 py-2"
        >
          <Download className="h-6 w-6 mb-1" />
          <span className="text-xs">{isExporting ? "Exporting..." : "Download PNG"}</span>
        </Button>

        <Button onClick={handleSave} variant="outline" className="flex flex-col items-center justify-center h-20 py-2">
          <Save className="h-6 w-6 mb-1" />
          <span className="text-xs">Save to Team</span>
        </Button>

        <Button onClick={handleShare} variant="outline" className="flex flex-col items-center justify-center h-20 py-2">
          <Share2 className="h-6 w-6 mb-1" />
          <span className="text-xs">Share Design</span>
        </Button>
      </div>
    </div>
  )
}
