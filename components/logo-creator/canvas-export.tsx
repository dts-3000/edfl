"use client"

import { useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { LogoConfig } from "./index"

interface CanvasExportProps {
  config: LogoConfig
}

export default function CanvasExport({ config }: CanvasExportProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { toast } = useToast()

  const drawLogo = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    canvas.width = 400
    canvas.height = 400

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw background
    if (config.backgroundColor) {
      ctx.fillStyle = config.backgroundColor
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }

    // Draw text
    if (config.text) {
      ctx.fillStyle = config.textColor || "#000000"
      ctx.font = `${config.fontSize || 24}px ${config.fontFamily || "Arial"}`
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"

      // Apply text effects based on style
      if (config.style === "shadow") {
        ctx.shadowColor = "rgba(0,0,0,0.5)"
        ctx.shadowBlur = 4
        ctx.shadowOffsetX = 2
        ctx.shadowOffsetY = 2
      } else if (config.style === "outline") {
        ctx.strokeStyle = config.textColor || "#000000"
        ctx.lineWidth = 2
        ctx.strokeText(config.text, canvas.width / 2, canvas.height / 2)
      }

      ctx.fillText(config.text, canvas.width / 2, canvas.height / 2)
    }
  }

  useEffect(() => {
    drawLogo()
  }, [config])

  const downloadLogo = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Create download link
    const link = document.createElement("a")
    link.download = `${config.text || "logo"}.png`
    link.href = canvas.toDataURL()
    link.click()

    toast({
      title: "Logo Downloaded",
      description: "Your logo has been saved as a PNG file!",
    })
  }

  return (
    <div className="space-y-4">
      <div className="text-sm font-medium">Preview & Export</div>

      <canvas
        ref={canvasRef}
        className="border rounded-lg max-w-full h-auto"
        style={{ maxWidth: "200px", maxHeight: "200px" }}
      />

      <Button onClick={downloadLogo} className="w-full">
        <Download className="w-4 h-4 mr-2" />
        Download PNG
      </Button>
    </div>
  )
}
