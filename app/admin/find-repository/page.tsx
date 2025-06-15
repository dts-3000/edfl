"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, Github, AlertTriangle, Search } from "lucide-react"

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

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline">4</Badge>
                <h4 className="font-medium">Find Repository URL</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-3">You'll see something like:</p>
              <div className="bg-muted p-3 rounded text-sm font-mono">
                <p>https://github.com/username/repository-name</p>
                <p className="text-muted-foreground mt-1">or</p>
                <p>https://github.com/v0-team/v0-edflnologindemo-xyz</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>What You Might Find</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="p-3 border rounded">
              <div className="flex items-center gap-2 mb-2">
                <Github className="h-4 w-4" />
                <strong className="text-sm">GitHub Repository</strong>
              </div>
              <p className="text-sm text-muted-foreground">
                If you see a GitHub URL, that's your source repository. Changes need to be pushed there.
              </p>
            </div>

            <div className="p-3 border rounded">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <strong className="text-sm">No Repository Connected</strong>
              </div>
              <p className="text-sm text-muted-foreground">
                If you see "No Git repository connected" or similar, that explains why changes aren't deploying.
              </p>
            </div>

            <div className="p-3 border rounded">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary">v0</Badge>
                <strong className="text-sm">v0-Generated Repository</strong>
              </div>
              <p className="text-sm text-muted-foreground">
                If you see a repository starting with "v0-", it was created by v0's deployment system.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Alternative: Check Deployment Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">In Vercel Dashboard:</h4>
              <ol className="text-sm space-y-1">
                <li>1. Go to Deployments tab</li>
                <li>2. Click on any deployment</li>
                <li>3. Look for "Source" or "Repository" information</li>
                <li>4. The URL will be shown there</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Common Scenarios:</strong>
          <ul className="mt-2 space-y-1 text-sm">
            <li>
              • <strong>No repository:</strong> You need to set up Git deployment
            </li>
            <li>
              • <strong>v0 repository:</strong> Use v0's update deployment feature
            </li>
            <li>
              • <strong>Your GitHub:</strong> Push changes to that repository
            </li>
          </ul>
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Quick Commands to Check</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-3 bg-muted rounded">
              <p className="text-sm font-medium mb-1">If you have the repository locally:</p>
              <code className="text-sm">git remote -v</code>
            </div>
            <div className="p-3 bg-muted rounded">
              <p className="text-sm font-medium mb-1">To check current branch:</p>
              <code className="text-sm">git branch</code>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
