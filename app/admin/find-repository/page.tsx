"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, Search } from "lucide-react"

export default function FindRepositoryPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Find Your Repository URL</h1>
          <p className="text-muted-foreground">Locate your source repository information</p>
        </div>
      </div>

      <Alert>
        <Search className="h-4 w-4" />
        <AlertDescription>
          Your repository URL determines where Vercel looks for code changes. Let's find it!
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5" />
            Step 1: Check Vercel Dashboard
          </CardTitle>
          <CardDescription>Find your repository information in Vercel</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline">1</Badge>
                <h4 className="font-medium">Open Vercel Dashboard</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-3">Go to your Vercel dashboard and find your project</p>
              <Button asChild variant="outline" size="sm">
                <a href="https://vercel.com/dashboard" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Vercel Dashboard
                </a>
              </Button>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline">2</Badge>
                <h4 className="font-medium">Click Your Project</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Look for a project named something like "edflnologindemo" or "v0-edflnologindemo"
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline">3</Badge>
                <h4 className="font-medium">Check Project Settings</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Go to Settings → General and look for "Git Repository" section
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
