"use client"

import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, Github, GitBranch, Settings, AlertCircle } from "lucide-react"

function FindRepositoryContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error")

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Find Your Repository URL</h1>
          <p className="text-muted-foreground mt-2">Locate your source repository to understand deployment issues</p>
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Error Detected
            </CardTitle>
            <CardDescription className="text-red-600">{error}</CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Rest of the component content remains the same */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Method 1: Vercel Dashboard
            </CardTitle>
            <CardDescription>Find your repository URL in project settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="font-medium">Steps:</p>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Go to Vercel Dashboard</li>
                <li>Click your project name</li>
                <li>Go to Settings → General</li>
                <li>Look for "Git Repository" section</li>
              </ol>
            </div>
            <Button asChild className="w-full">
              <a href="https://vercel.com/dashboard" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Vercel Dashboard
              </a>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5" />
              Method 2: Deployment Details
            </CardTitle>
            <CardDescription>Check individual deployments for source info</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="font-medium">Steps:</p>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Go to Deployments tab</li>
                <li>Click on any deployment</li>
                <li>Look for "Source" information</li>
                <li>Note the repository URL</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>What You Might Find</CardTitle>
          <CardDescription>Different scenarios and their solutions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Badge variant="secondary" className="mt-1">
                <Github className="h-3 w-3 mr-1" />
                GitHub
              </Badge>
              <div>
                <p className="font-medium">GitHub Repository</p>
                <p className="text-sm text-muted-foreground">URL like: https://github.com/username/repository-name</p>
                <p className="text-sm text-green-600 mt-1">✅ Solution: Push changes to this repository</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Badge variant="outline" className="mt-1">
                v0
              </Badge>
              <div>
                <p className="font-medium">v0-Generated Repository</p>
                <p className="text-sm text-muted-foreground">
                  URL like: https://github.com/v0-team/v0-edflnologindemo-xyz
                </p>
                <p className="text-sm text-blue-600 mt-1">ℹ️ Solution: Use v0's deployment features</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Badge variant="destructive" className="mt-1">
                None
              </Badge>
              <div>
                <p className="font-medium">No Repository Connected</p>
                <p className="text-sm text-muted-foreground">Shows "No Git repository connected"</p>
                <p className="text-sm text-orange-600 mt-1">⚠️ Solution: Set up Git deployment</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Next Steps</CardTitle>
          <CardDescription>Once you find your repository URL</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="font-medium">If you have a GitHub repository:</p>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground ml-4">
              <li>Clone the repository locally</li>
              <li>Make your changes</li>
              <li>Commit and push to trigger deployment</li>
            </ol>

            <p className="font-medium mt-4">If you don't have a repository:</p>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground ml-4">
              <li>Use v0's "Deploy" button to create one</li>
              <li>Or manually create a GitHub repository</li>
              <li>Upload your code and connect to Vercel</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function FindRepositoryPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <FindRepositoryContent />
    </Suspense>
  )
}
