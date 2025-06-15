"use client"

import type { LogoSettings } from "./index"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

interface ColorPickerProps {
  settings: LogoSettings
  onUpdate: (settings: Partial<LogoSettings>) => void
}

export function ColorPicker({ settings, onUpdate }: ColorPickerProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="primary-color">Primary Color</Label>
          <div className="flex gap-2">
            <div className="w-8 h-8 rounded border" style={{ backgroundColor: settings.primaryColor }}></div>
            <Input
              id="primary-color"
              type="text"
              value={settings.primaryColor}
              onChange={(e) => onUpdate({ primaryColor: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="secondary-color">Secondary Color</Label>
          <div className="flex gap-2">
            <div className="w-8 h-8 rounded border" style={{ backgroundColor: settings.secondaryColor }}></div>
            <Input
              id="secondary-color"
              type="text"
              value={settings.secondaryColor}
              onChange={(e) => onUpdate({ secondaryColor: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="accent-color">Accent Color</Label>
          <div className="flex gap-2">
            <div className="w-8 h-8 rounded border" style={{ backgroundColor: settings.accentColor }}></div>
            <Input
              id="accent-color"
              type="text"
              value={settings.accentColor}
              onChange={(e) => onUpdate({ accentColor: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="background-color">Background Color</Label>
          <div className="flex gap-2">
            <div className="w-8 h-8 rounded border" style={{ backgroundColor: settings.backgroundColor }}></div>
            <Input
              id="background-color"
              type="text"
              value={settings.backgroundColor}
              onChange={(e) => onUpdate({ backgroundColor: e.target.value })}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
