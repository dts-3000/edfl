"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle, AlertTriangle, ExternalLink, GitBranch, Settings, Terminal } from "lucide-react"

export default function DeploymentTroubleshootPage() {
  const [activeTab, setActiveTab] = useState("checklist")

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Deployment Troubleshooting</h1>
          <p className="text-muted-foreground">Step-by-step guide to fix deployment issues</p>
        </div>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Changes not deploying?</strong> This usually means there's a disconnect between your local changes and
          what's actually being deployed to Vercel.
        </AlertDescription>
      </Alert>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="checklist">Quick Checklist</TabsTrigger>
          <TabsTrigger value="git">Git Issues</TabsTrigger>
          <TabsTrigger value="vercel">Vercel Settings</TabsTrigger>
          <TabsTrigger value="build">Build Problems</TabsTrigger>
        </TabsList>

        <TabsContent value="checklist" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Deployment Checklist
              </CardTitle>
              <CardDescription>Check these items in order</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 border rounded">
                  <input type="checkbox" className="mt-1" />
                  <div>
                    <h4 className="font-medium">1. Are you using v0's "Download Code" feature?</h4>
                    <p className="text-sm text-muted-foreground">
                      If yes, you need to download the updated code and push it to your repository manually.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 border rounded">
                  <input type="checkbox" className="mt-1" />
                  <div>
                    <h4 className="font-medium">2. Are your changes committed to Git?</h4>
                    <p className="text-sm text-muted-foreground">
                      Run: <code className="bg-muted px-1 rounded">git status</code> to check uncommitted changes
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 border rounded">
                  <input type="checkbox" className="mt-1" />
                  <div>
                    <h4 className="font-medium">3. Are your changes pushed to the correct branch?</h4>
                    <p className="text-sm text-muted-foreground">
                      Check which branch Vercel is deploying from (usually main or master)
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 border rounded">
                  <input type="checkbox" className="mt-1" />
                  <div>
                    <h4 className="font-medium">4. Is Vercel connected to the right repository?</h4>
                    <p className="text-sm text-muted-foreground">
                      Check your Vercel dashboard to ensure it's connected to your GitHub repo
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 border rounded">
                  <input type="checkbox" className="mt-1" />
                  <div>
                    <h4 className="font-medium">5. Are deployments triggering automatically?</h4>
                    <p className="text-sm text-muted-foreground">
                      Check if auto-deployments are enabled in Vercel settings
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 border rounded">
                  <input type="checkbox" className="mt-1" />
                  <div>
                    <h4 className="font-medium">6. Are there any build errors?</h4>
                    <p className="text-sm text-muted-foreground">Check the deployment logs in your Vercel dashboard</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="git" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="h-5 w-5" />
                Git & Repository Issues
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded">
                  <h4 className="font-medium mb-2">Step 1: Check Git Status</h4>
                  <code className="block bg-background p-2 rounded text-sm">
                    git status
                    <br />
                    git log --oneline -5
                  </code>
                  <p className="text-sm text-muted-foreground mt-2">
                    This shows uncommitted changes and recent commits
                  </p>
                </div>

                <div className="p-4 bg-muted rounded">
                  <h4 className="font-medium mb-2">Step 2: Commit and Push Changes</h4>
                  <code className="block bg-background p-2 rounded text-sm">
                    git add .
                    <br />
                    git commit -m "Fix club management and top menu"
                    <br />
                    git push origin main
                  </code>
                  <p className="text-sm text-muted-foreground mt-2">
                    Replace 'main' with your default branch if different
                  </p>
                </div>

                <div className="p-4 bg-muted rounded">
                  <h4 className="font-medium mb-2">Step 3: Check Remote Repository</h4>
                  <p className="text-sm text-muted-foreground mb-2">Go to your GitHub repository and verify:</p>
                  <ul className="text-sm space-y-1">
                    <li>• Your latest commit appears in the repository</li>
                    <li>• The files show your recent changes</li>
                    <li>• You're on the correct branch</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vercel" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Vercel Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded">
                  <h4 className="font-medium mb-2">Check Vercel Dashboard</h4>
                  <div className="space-y-2 text-sm">
                    <p>
                      1. Go to{" "}
                      <a
                        href="https://vercel.com/dashboard"
                        target="_blank"
                        className="text-blue-600 hover:underline"
                        rel="noreferrer"
                      >
                        Vercel Dashboard
                      </a>
                    </p>
                    <p>2. Find your project</p>
                    <p>3. Check the "Deployments" tab</p>
                    <p>4. Look for recent deployment attempts</p>
                  </div>
                </div>

                <div className="p-4 bg-muted rounded">
                  <h4 className="font-medium mb-2">Verify Git Integration</h4>
                  <div className="space-y-2 text-sm">
                    <p>1. Go to Project Settings → Git</p>
                    <p>2. Verify the connected repository is correct</p>
                    <p>3. Check the production branch (usually 'main')</p>
                    <p>4. Ensure auto-deployments are enabled</p>
                  </div>
                </div>

                <div className="p-4 bg-muted rounded">
                  <h4 className="font-medium mb-2">Manual Deployment</h4>
                  <div className="space-y-2 text-sm">
                    <p>1. Go to your project in Vercel</p>
                    <p>2. Click "Deployments" tab</p>
                    <p>3. Click "Redeploy" on the latest deployment</p>
                    <p>
                      4. Or use Vercel CLI: <code className="bg-background px-1 rounded">vercel --prod</code>
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="build" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Terminal className="h-5 w-5" />
                Build & Environment Issues
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded">
                  <h4 className="font-medium mb-2">Test Local Build</h4>
                  <code className="block bg-background p-2 rounded text-sm">
                    npm run build
                    <br />
                    npm run start
                  </code>
                  <p className="text-sm text-muted-foreground mt-2">
                    This tests if your app builds successfully locally
                  </p>
                </div>

                <div className="p-4 bg-muted rounded">
                  <h4 className="font-medium mb-2">Check Environment Variables</h4>
                  <div className="space-y-2 text-sm">
                    <p>In Vercel Dashboard → Project → Settings → Environment Variables:</p>
                    <ul className="space-y-1 mt-2">
                      <li>• NEXT_PUBLIC_FIREBASE_API_KEY</li>
                      <li>• NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN</li>
                      <li>• NEXT_PUBLIC_FIREBASE_PROJECT_ID</li>
                      <li>• NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET</li>
                      <li>• NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID</li>
                      <li>• NEXT_PUBLIC_FIREBASE_APP_ID</li>
                      <li>• NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID</li>
                    </ul>
                  </div>
                </div>

                <div className="p-4 bg-muted rounded">
                  <h4 className="font-medium mb-2">Common Build Errors</h4>
                  <div className="space-y-2 text-sm">
                    <p>
                      <strong>TypeScript errors:</strong> Check for type mismatches
                    </p>
                    <p>
                      <strong>Import errors:</strong> Verify all imports are correct
                    </p>
                    <p>
                      <strong>Missing dependencies:</strong> Check package.json
                    </p>
                    <p>
                      <strong>Environment variables:</strong> Missing or incorrect values
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          <a
            href="https://vercel.com/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted transition-colors"
          >
            <div className="flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              <span className="font-medium">Open Vercel Dashboard</span>
            </div>
            <Badge variant="outline">External</Badge>
          </a>

          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted transition-colors"
          >
            <div className="flex items-center gap-2">
              <GitBranch className="h-4 w-4" />
              <span className="font-medium">Check GitHub Repository</span>
            </div>
            <Badge variant="outline">External</Badge>
          </a>
        </CardContent>
      </Card>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Still having issues?</strong> The most common cause is that changes aren't actually pushed to the
          repository that Vercel is watching. Double-check your Git workflow!
        </AlertDescription>
      </Alert>
    </div>
  )
}
