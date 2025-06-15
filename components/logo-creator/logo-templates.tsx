"use client"

import type { LogoSettings } from "./index"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface LogoTemplatesProps {
  onApplyTemplate: (template: Partial<LogoSettings>) => void
}

export function LogoTemplates({ onApplyTemplate }: LogoTemplatesProps) {
  const edflTemplates = [
    {
      name: "Airport West Eagles",
      preview: "/images/teams/airport-west.png",
      settings: {
        teamName: "EAGLES",
        primaryColor: "#1e3a8a", // Blue
        secondaryColor: "#fbbf24", // Yellow
        accentColor: "#ffffff", // White
        fontFamily: "Bebas-Neue",
        logoStyle: "raised",
        iconName: "eagle",
        containerStyle: "badge",
      },
    },
    {
      name: "Strathmore Magpies",
      preview: "/images/teams/strathmore.png",
      settings: {
        teamName: "MAGPIES",
        primaryColor: "#000000", // Black
        secondaryColor: "#ffffff", // White
        accentColor: "#6b7280", // Gray
        fontFamily: "Anton",
        logoStyle: "shadow",
        iconName: "magpie",
        containerStyle: "emblem",
      },
    },
    {
      name: "Keilor Thunder",
      preview: "/images/teams/keilor.png",
      settings: {
        teamName: "THUNDER",
        primaryColor: "#4c1d95", // Purple
        secondaryColor: "#fbbf24", // Yellow
        accentColor: "#ffffff", // White
        fontFamily: "Russo-One",
        logoStyle: "neon",
        iconName: "lightning",
        containerStyle: "crest",
      },
    },
  ]

  const sportsTemplates = [
    {
      name: "Classic Sports",
      preview: "/placeholder.svg?height=100&width=100",
      settings: {
        teamName: "TIGERS",
        primaryColor: "#b91c1c", // Red
        secondaryColor: "#000000", // Black
        accentColor: "#ffffff", // White
        fontFamily: "Oswald",
        logoStyle: "default",
        iconName: "tiger",
        containerStyle: "badge",
      },
    },
    {
      name: "Modern Athletic",
      preview: "/placeholder.svg?height=100&width=100",
      settings: {
        teamName: "KNIGHTS",
        primaryColor: "#1e40af", // Blue
        secondaryColor: "#6b7280", // Gray
        accentColor: "#ffffff", // White
        fontFamily: "Rajdhani",
        logoStyle: "beveled",
        iconName: "knight",
        containerStyle: "modern",
      },
    },
    {
      name: "Vintage Team",
      preview: "/placeholder.svg?height=100&width=100",
      settings: {
        teamName: "PIRATES",
        primaryColor: "#7c2d12", // Brown
        secondaryColor: "#fbbf24", // Yellow
        accentColor: "#000000", // Black
        fontFamily: "Pirata-One",
        logoStyle: "layered",
        iconName: "pirate",
        containerStyle: "crest",
      },
    },
  ]

  const modernTemplates = [
    {
      name: "Tech Style",
      preview: "/placeholder.svg?height=100&width=100",
      settings: {
        teamName: "CIRCUIT",
        primaryColor: "#0f172a", // Dark blue
        secondaryColor: "#22d3ee", // Cyan
        accentColor: "#ffffff", // White
        fontFamily: "Orbitron",
        logoStyle: "neon",
        iconName: null,
        showIcon: false,
        containerStyle: "modern",
      },
    },
    {
      name: "Minimalist",
      preview: "/placeholder.svg?height=100&width=100",
      settings: {
        teamName: "APEX",
        primaryColor: "#000000", // Black
        secondaryColor: "#ffffff", // White
        accentColor: "#f43f5e", // Pink
        fontFamily: "Inter",
        logoStyle: "default",
        iconName: null,
        showIcon: false,
        containerStyle: "default",
      },
    },
    {
      name: "Futuristic",
      preview: "/placeholder.svg?height=100&width=100",
      settings: {
        teamName: "NOVA",
        primaryColor: "#6d28d9", // Purple
        secondaryColor: "#ec4899", // Pink
        accentColor: "#ffffff", // White
        fontFamily: "Rajdhani",
        logoStyle: "holographic",
        iconName: null,
        showIcon: false,
        containerStyle: "modern",
      },
    },
  ]

  const classicTemplates = [
    {
      name: "Vintage Shield",
      preview: "/placeholder.svg?height=100&width=100",
      settings: {
        teamName: "ROYALS",
        primaryColor: "#7c2d12", // Brown
        secondaryColor: "#fbbf24", // Gold
        accentColor: "#000000", // Black
        fontFamily: "MedievalSharp",
        logoStyle: "layered",
        iconName: "crown",
        containerStyle: "crest",
      },
    },
    {
      name: "Classic Badge",
      preview: "/placeholder.svg?height=100&width=100",
      settings: {
        teamName: "UNITED",
        primaryColor: "#1e3a8a", // Blue
        secondaryColor: "#b91c1c", // Red
        accentColor: "#ffffff", // White
        fontFamily: "Oswald",
        logoStyle: "raised",
        iconName: "shield",
        containerStyle: "badge",
      },
    },
    {
      name: "Retro Emblem",
      preview: "/placeholder.svg?height=100&width=100",
      settings: {
        teamName: "STARS",
        primaryColor: "#0f766e", // Teal
        secondaryColor: "#fbbf24", // Yellow
        accentColor: "#ffffff", // White
        fontFamily: "Bebas-Neue",
        logoStyle: "shadow",
        iconName: "star",
        containerStyle: "emblem",
      },
    },
  ]

  const renderTemplateGrid = (templates: any[]) => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {templates.map((template, index) => (
        <Card key={index} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 mb-2 flex items-center justify-center">
                <img
                  src={template.preview || "/placeholder.svg"}
                  alt={template.name}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
              <h3 className="text-sm font-medium mb-1">{template.name}</h3>
              <div className="flex gap-1 mb-2">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: template.settings.primaryColor }}></div>
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: template.settings.secondaryColor }}
                ></div>
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: template.settings.accentColor }}></div>
              </div>
              <Button variant="outline" size="sm" onClick={() => onApplyTemplate(template.settings)} className="w-full">
                Apply
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  return (
    <div className="space-y-4">
      <Tabs defaultValue="edfl">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="edfl">EDFL</TabsTrigger>
          <TabsTrigger value="sports">Sports</TabsTrigger>
          <TabsTrigger value="modern">Modern</TabsTrigger>
          <TabsTrigger value="classic">Classic</TabsTrigger>
        </TabsList>

        <TabsContent value="edfl" className="mt-4">
          {renderTemplateGrid(edflTemplates)}
        </TabsContent>

        <TabsContent value="sports" className="mt-4">
          {renderTemplateGrid(sportsTemplates)}
        </TabsContent>

        <TabsContent value="modern" className="mt-4">
          {renderTemplateGrid(modernTemplates)}
        </TabsContent>

        <TabsContent value="classic" className="mt-4">
          {renderTemplateGrid(classicTemplates)}
        </TabsContent>
      </Tabs>
    </div>
  )
}
