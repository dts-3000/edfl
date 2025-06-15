"use client"

import type { LogoSettings } from "./index"
import { Label } from "@/components/ui/label"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Sparkles,
  ArrowUp,
  Cloud,
  Layers,
  Hexagon,
  Glasses,
  Gem,
  Palette,
  Shield,
  Circle,
  HexagonIcon,
  Square,
} from "lucide-react"

interface StyleSelectorProps {
  settings: LogoSettings
  onUpdate: (settings: Partial<LogoSettings>) => void
}

export function StyleSelector({ settings, onUpdate }: StyleSelectorProps) {
  const logoStyles = [
    { id: "default", name: "Default", icon: <Square className="h-4 w-4" /> },
    { id: "neon", name: "Neon", icon: <Sparkles className="h-4 w-4" /> },
    { id: "raised", name: "Raised", icon: <ArrowUp className="h-4 w-4" /> },
    { id: "shadow", name: "Shadow", icon: <Cloud className="h-4 w-4" /> },
    { id: "layered", name: "Layered", icon: <Layers className="h-4 w-4" /> },
    { id: "beveled", name: "Beveled", icon: <Hexagon className="h-4 w-4" /> },
    { id: "glass", name: "Glass", icon: <Glasses className="h-4 w-4" /> },
    { id: "metallic", name: "Metallic", icon: <Gem className="h-4 w-4" /> },
    { id: "holographic", name: "Holographic", icon: <Palette className="h-4 w-4" /> },
  ]

  const containerStyles = [
    { id: "default", name: "Default", icon: <Square className="h-4 w-4" /> },
    { id: "badge", name: "Badge", icon: <Square className="h-4 w-4 rounded-md" /> },
    { id: "emblem", name: "Emblem", icon: <Circle className="h-4 w-4" /> },
    { id: "crest", name: "Crest", icon: <Shield className="h-4 w-4" /> },
    { id: "modern", name: "Modern", icon: <HexagonIcon className="h-4 w-4" /> },
  ]

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Label>Text Style</Label>
        <TooltipProvider>
          <ToggleGroup
            type="single"
            value={settings.logoStyle}
            onValueChange={(value) => value && onUpdate({ logoStyle: value })}
            className="flex flex-wrap justify-start"
          >
            {logoStyles.map((style) => (
              <Tooltip key={style.id}>
                <TooltipTrigger asChild>
                  <ToggleGroupItem value={style.id} aria-label={style.name}>
                    {style.icon}
                    <span className="ml-2">{style.name}</span>
                  </ToggleGroupItem>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{style.name} style</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </ToggleGroup>
        </TooltipProvider>
      </div>

      <div className="space-y-4">
        <Label>Container Style</Label>
        <TooltipProvider>
          <ToggleGroup
            type="single"
            value={settings.containerStyle}
            onValueChange={(value) => value && onUpdate({ containerStyle: value })}
            className="flex flex-wrap justify-start"
          >
            {containerStyles.map((style) => (
              <Tooltip key={style.id}>
                <TooltipTrigger asChild>
                  <ToggleGroupItem value={style.id} aria-label={style.name}>
                    {style.icon}
                    <span className="ml-2">{style.name}</span>
                  </ToggleGroupItem>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{style.name} container</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </ToggleGroup>
        </TooltipProvider>
      </div>
    </div>
  )
}
