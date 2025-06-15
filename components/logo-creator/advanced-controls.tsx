"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { LogoConfig } from "./index"

interface AdvancedControlsProps {
  config: LogoConfig
  onConfigChange: (updates: Partial<LogoConfig>) => void
}

export default function AdvancedControls({ config, onConfigChange }: AdvancedControlsProps) {
  return (
    <div className="space-y-4">
      {/* Position & Spacing */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Position & Spacing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Icon Position</Label>
            <Select
              value={config.iconPosition || "top"}
              onValueChange={(value) => onConfigChange({ iconPosition: value })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="top">Top</SelectItem>
                <SelectItem value="left">Left</SelectItem>
                <SelectItem value="right">Right</SelectItem>
                <SelectItem value="center">Center</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm font-medium">Spacing: {config.spacing || 16}px</Label>
            <Slider
              value={[config.spacing || 16]}
              onValueChange={(value) => onConfigChange({ spacing: value[0] })}
              max={50}
              min={0}
              step={2}
              className="mt-2"
            />
          </div>
        </CardContent>
      </Card>

      {/* Effects */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Effects</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Shadow Blur: {config.shadowBlur || 0}px</Label>
            <Slider
              value={[config.shadowBlur || 0]}
              onValueChange={(value) => onConfigChange({ shadowBlur: value[0] })}
              max={20}
              min={0}
              step={1}
              className="mt-2"
            />
          </div>

          <div>
            <Label className="text-sm font-medium">Border Width: {config.borderWidth || 0}px</Label>
            <Slider
              value={[config.borderWidth || 0]}
              onValueChange={(value) => onConfigChange({ borderWidth: value[0] })}
              max={10}
              min={0}
              step={1}
              className="mt-2"
            />
          </div>

          <div>
            <Label className="text-sm font-medium">Opacity: {Math.round((config.opacity || 1) * 100)}%</Label>
            <Slider
              value={[config.opacity || 1]}
              onValueChange={(value) => onConfigChange({ opacity: value[0] })}
              max={1}
              min={0.1}
              step={0.1}
              className="mt-2"
            />
          </div>
        </CardContent>
      </Card>

      {/* Toggle Options */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Show Background</Label>
            <Switch
              checked={config.showBackground !== false}
              onCheckedChange={(checked) => onConfigChange({ showBackground: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Rounded Corners</Label>
            <Switch
              checked={config.roundedCorners !== false}
              onCheckedChange={(checked) => onConfigChange({ roundedCorners: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Gradient Background</Label>
            <Switch
              checked={config.useGradient || false}
              onCheckedChange={(checked) => onConfigChange({ useGradient: checked })}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
