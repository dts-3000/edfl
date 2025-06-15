"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Download, Github, ExternalLink, AlertTriangle, CheckCircle } from "lucide-react"

export default function SetupDeploymentPage() {
  const [currentStep, setCurrentStep] = useState(1)

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Setup Deployment Pipeline</h1>
          <p className="text-muted-foreground">Get your v0 project deploying to Vercel</p>
        </div>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>No Git Repository:</strong> You're working in v0 without Git. To deploy changes, you need to set up a
          proper deployment pipeline.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="v0-method" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="v0-method">v0 Method (Easiest)</TabsTrigger>
          <TabsTrigger value="github-method">GitHub Method</TabsTrigger>
          <TabsTrigger value="manual-method">Manual Method</TabsTrigger>
        </TabsList>

        <TabsContent value="v0-method" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Use v0's Built-in Deployment
              </CardTitle>
              <CardDescription>The easiest way - let v0 handle everything</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription>
                  <strong>Recommended:</strong> This is the simplest method and handles all the Git/deployment setup
                  automatically.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline">Step 1</Badge>
                    <h4 className="font-medium">Use v0's Deploy Button</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    In the v0 interface, look for the "Deploy" button (usually in the top-right corner of the code
                    block)
                  </p>
                  <div className="bg-muted p-3 rounded">
                    <p className="text-sm">
                      <strong>Location:</strong> When viewing your code project, look for a "Deploy to Vercel" or
                      "Deploy" button
                    </p>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline">Step 2</Badge>
                    <h4 className="font-medium">Connect to Vercel</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    v0 will automatically create a GitHub repository and connect it to Vercel
                  </p>
                  <div className="bg-muted p-3 rounded">
                    <p className="text-sm">This creates a proper Git repository that Vercel can watch for changes</p>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline">Step 3</Badge>
                    <h4 className="font-medium">Future Updates</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    After initial deployment, use v0's "Update Deployment" feature for changes
                  </p>
                  <div className="bg-muted p-3 rounded">
                    <p className="text-sm">v0 will push changes to the Git repository automatically</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="github-method" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Github className="h-5 w-5" />
                Manual GitHub Setup
              </CardTitle>
              <CardDescription>Set up your own Git repository</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline">Step 1</Badge>
                    <h4 className="font-medium">Download Code from v0</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Use v0's "Download Code" button to get all your files
                  </p>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Look for Download Button in v0
                  </Button>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline">Step 2</Badge>
                    <h4 className="font-medium">Create GitHub Repository</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">Create a new repository on GitHub</p>
                  <Button asChild variant="outline" size="sm">
                    <a href="https://github.com/new" target="_blank" rel="noopener noreferrer">
                      <Github className="h-4 w-4 mr-2" />
                      Create New Repository
                    </a>
                  </Button>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline">Step 3</Badge>
                    <h4 className="font-medium">Upload Code</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Upload your downloaded v0 code to the GitHub repository
                  </p>
                  <div className="bg-muted p-3 rounded text-sm">
                    <p>You can drag and drop files directly into GitHub's web interface</p>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline">Step 4</Badge>
                    <h4 className="font-medium">Connect to Vercel</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">Import your GitHub repository into Vercel</p>
                  <Button asChild variant="outline" size="sm">
                    <a href="https://vercel.com/new" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Import to Vercel
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manual-method" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Manual Deployment Process</CardTitle>
              <CardDescription>For each change you want to deploy</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Not Recommended:</strong> This method requires manual work for every change.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Process for Each Change:</h4>
                  <ol className="text-sm space-y-2">
                    <li>1. Download updated code from v0</li>
                    <li>2. Upload to your GitHub repository</li>
                    <li>3. Vercel automatically deploys the changes</li>
                  </ol>
                </div>

                <div className="p-4 bg-muted rounded">
                  <p className="text-sm">
                    <strong>Why this is tedious:</strong> You'll need to manually download and upload code every time
                    you make changes in v0.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Current Situation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">Your app is working in v0</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">You have a Vercel deployment</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm">No Git repository connected</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm">Changes not automatically deploying</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Alert>
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription>
          <strong>Recommended Next Step:</strong> Look for v0's "Deploy" button in your code project. This is the
          easiest way to set up automatic deployments.
        </AlertDescription>
      </Alert>
    </div>
  )
}
