"use client"

import type { LogoSettings } from "./index"
import { Label } from "@/components/ui/label"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface FontSelectorProps {
  settings: LogoSettings
  onUpdate: (settings: Partial<LogoSettings>) => void
}

export function FontSelector({ settings, onUpdate }: FontSelectorProps) {
  const fonts = [
    { id: "Inter", name: "Inter", description: "Clean, modern sans-serif" },
    { id: "Roboto", name: "Roboto", description: "Google's signature font" },
    { id: "Oswald", name: "Oswald", description: "Bold, condensed sans-serif" },
    { id: "Bebas-Neue", name: "Bebas Neue", description: "Tall, narrow capitals" },
    { id: "Anton", name: "Anton", description: "Extra bold display font" },
    { id: "Rajdhani", name: "Rajdhani", description: "Futuristic tech font" },
    { id: "Orbitron", name: "Orbitron", description: "Sci-fi geometric font" },
    { id: "Bangers", name: "Bangers", description: "Comic book style" },
    { id: "Creepster", name: "Creepster", description: "Horror style font" },
    { id: "Pirata-One", name: "Pirata One", description: "Pirate themed font" },
    { id: "MedievalSharp", name: "Medieval", description: "Medieval style" },
    { id: "Russo-One", name: "Russo One", description: "Strong geometric font" },
  ]

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Label>Font Family</Label>
        <TooltipProvider>
          <ToggleGroup
            type="single"
            value={settings.fontFamily}
            onValueChange={(value) => value && onUpdate({ fontFamily: value })}
            className="flex flex-col space-y-2"
          >
            {fonts.map((font) => (
              <Tooltip key={font.id}>
                <TooltipTrigger asChild>
                  <ToggleGroupItem
                    value={font.id}
                    className={`justify-between h-12 w-full font-${font.id.toLowerCase()}`}
                    aria-label={font.name}
                  >
                    <span>{font.name}</span>
                    <span className="text-sm text-muted-foreground">EDFL</span>
                  </ToggleGroupItem>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{font.description}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </ToggleGroup>
        </TooltipProvider>
      </div>
    </div>
  )
}
