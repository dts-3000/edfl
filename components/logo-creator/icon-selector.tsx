"use client"

import type { LogoSettings } from "./index"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface IconSelectorProps {
  settings: LogoSettings
  onUpdate: (settings: Partial<LogoSettings>) => void
}

export function IconSelector({ settings, onUpdate }: IconSelectorProps) {
  const mascots = [
    { id: "tiger", name: "Tiger" },
    { id: "rooster", name: "Rooster" },
    { id: "pirate", name: "Pirate" },
    { id: "cowboy", name: "Cowboy" },
    { id: "beaver", name: "Beaver" },
    { id: "blue_lion", name: "Blue Lion" },
    { id: "bull", name: "Bull" },
    { id: "bee", name: "Bee" },
    { id: "bandit", name: "Bandit" },
    { id: "knight", name: "Knight" },
    { id: "chips", name: "Chips" },
    { id: "burger", name: "Burger" },
    { id: "cat", name: "Cat" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Label htmlFor="show-icon">Show Icon</Label>
        <Switch
          id="show-icon"
          checked={settings.showIcon}
          onCheckedChange={(checked) => onUpdate({ showIcon: checked })}
        />
      </div>

      {settings.showIcon && (
        <div className="space-y-4">
          <Label>Select Mascot</Label>
          <TooltipProvider>
            <ToggleGroup
              type="single"
              value={settings.iconName || undefined}
              onValueChange={(value) => value && onUpdate({ iconName: value })}
              className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2"
            >
              {mascots.map((mascot) => (
                <Tooltip key={mascot.id}>
                  <TooltipTrigger asChild>
                    <ToggleGroupItem
                      value={mascot.id}
                      className="flex flex-col items-center justify-center h-20 aspect-square"
                      aria-label={mascot.name}
                    >
                      <img
                        src={`/images/mascots/${mascot.id}.png`}
                        alt={mascot.name}
                        className="w-10 h-10 object-contain mb-1"
                      />
                      <span className="text-xs">{mascot.name}</span>
                    </ToggleGroupItem>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{mascot.name} mascot</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </ToggleGroup>
          </TooltipProvider>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="show-text">Show Team Name</Label>
          <Switch
            id="show-text"
            checked={settings.showText}
            onCheckedChange={(checked) => onUpdate({ showText: checked })}
          />
        </div>

        {settings.showText && (
          <div className="space-y-2">
            <Label htmlFor="team-name">Team Name</Label>
            <Input
              id="team-name"
              value={settings.teamName}
              onChange={(e) => onUpdate({ teamName: e.target.value })}
              maxLength={20}
            />
          </div>
        )}
      </div>
    </div>
  )
}
