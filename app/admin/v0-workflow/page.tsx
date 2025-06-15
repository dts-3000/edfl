"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Zap, Rocket, Code, Settings, RefreshCw, CheckCircle, AlertCircle, ExternalLink } from "lucide-react"

export default function V0WorkflowPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">v0 Development Workflow</h1>
          <p className="text-muted-foreground mt-2">Complete guide to developing and deploying in v0</p>
        </div>
        <Badge variant="secondary" className="flex items-center gap-2">
          <Zap className="h-4 w-4" />
          v0 Native
        </Badge>
      </div>

      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertDescription>
          Great choice! v0 provides a complete development and deployment environment. No need for local Git setup or
          external tools.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="development" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="development">Development</TabsTrigger>
          <TabsTrigger value="deployment">Deployment</TabsTrigger>
          <TabsTrigger value="updates">Updates</TabsTrigger>
          <TabsTrigger value="troubleshooting">Troubleshooting</TabsTrigger>
        </TabsList>

        <TabsContent value="development" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                Development in v0
              </CardTitle>
              <CardDescription>How to effectively develop your club management system</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Badge variant="outline">1</Badge>
                    Make Changes in Chat
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Continue requesting features and fixes in this chat. All changes are automatically applied to your
                    project.
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Badge variant="outline">2</Badge>
                    Test in Preview
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Use the preview panel to test your changes immediately. No need to run local servers.
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Badge variant="outline">3</Badge>
                    Iterate Quickly
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Request modifications, bug fixes, or new features. Changes appear instantly in your project.
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Badge variant="outline">4</Badge>
                    No Setup Required
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    No need for Node.js, npm, Git, or local development environment. Everything works in the browser.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deployment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Rocket className="h-5 w-5" />
                Deployment in v0
              </CardTitle>
              <CardDescription>How v0 handles deployment to Vercel</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Automatic Deployment
                  </h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    v0 automatically creates and manages a Git repository for you. When you're ready to deploy, v0
                    handles everything.
                  </p>
                  <div className="bg-muted p-3 rounded text-sm">
                    <p className="font-medium">Look for the "Deploy" button in v0's interface</p>
                    <p className="text-muted-foreground">Usually located in the top-right corner of your project</p>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Settings className="h-4 w-4 text-blue-600" />
                    Deployment Process
                  </h4>
                  <ol className="text-sm space-y-1 text-muted-foreground">
                    <li>1. Click "Deploy" in v0</li>
                    <li>2. v0 creates/updates your Git repository</li>
                    <li>3. Connects to Vercel automatically</li>
                    <li>4. Builds and deploys your app</li>
                    <li>5. Provides you with a live URL</li>
                  </ol>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <ExternalLink className="h-4 w-4 text-purple-600" />
                    Environment Variables
                  </h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Your Firebase environment variables are automatically configured:
                  </p>
                  <div className="bg-muted p-2 rounded text-xs font-mono">
                    <p>NEXT_PUBLIC_FIREBASE_API_KEY</p>
                    <p>NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN</p>
                    <p>NEXT_PUBLIC_FIREBASE_PROJECT_ID</p>
                    <p>... and others</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="updates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Updating Your Deployed App
              </CardTitle>
              <CardDescription>How to push changes to your live site</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Method 1: Redeploy from v0</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    After making changes in this chat, use v0's deploy feature again.
                  </p>
                  <div className="bg-blue-50 p-3 rounded text-sm">
                    <p className="font-medium text-blue-800">Recommended Approach:</p>
                    <p className="text-blue-700">Make changes → Test in preview → Click Deploy</p>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Method 2: Vercel Dashboard</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    If v0 has already created your repository, you can redeploy from Vercel.
                  </p>
                  <ol className="text-sm space-y-1 text-muted-foreground">
                    <li>1. Go to Vercel Dashboard</li>
                    <li>2. Find your project</li>
                    <li>3. Go to Deployments</li>
                    <li>4. Click "Redeploy" on latest deployment</li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="troubleshooting" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Common Issues & Solutions
              </CardTitle>
              <CardDescription>Troubleshooting deployment problems in v0</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2 text-red-600">Build Errors</h4>
                  <p className="text-sm text-muted-foreground mb-2">Missing dependencies or TypeScript errors</p>
                  <div className="bg-red-50 p-3 rounded text-sm">
                    <p className="font-medium text-red-800">Solution:</p>
                    <p className="text-red-700">Ask me to fix the specific error message you see</p>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2 text-yellow-600">Changes Not Appearing</h4>
                  <p className="text-sm text-muted-foreground mb-2">Your live site doesn't show recent changes</p>
                  <div className="bg-yellow-50 p-3 rounded text-sm">
                    <p className="font-medium text-yellow-800">Solution:</p>
                    <p className="text-yellow-700">Use v0's Deploy button again, or redeploy from Vercel</p>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2 text-blue-600">Firebase Connection Issues</h4>
                  <p className="text-sm text-muted-foreground mb-2">Data not loading or authentication problems</p>
                  <div className="bg-blue-50 p-3 rounded text-sm">
                    <p className="font-medium text-blue-800">Solution:</p>
                    <p className="text-blue-700">Check Firebase console and verify environment variables</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Your Current Workflow</CardTitle>
          <CardDescription>Recommended approach for your club management system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Badge variant="outline">1</Badge>
              <p className="text-sm">Continue developing features in this chat</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline">2</Badge>
              <p className="text-sm">Test changes in v0's preview panel</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline">3</Badge>
              <p className="text-sm">When ready, use v0's Deploy button</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline">4</Badge>
              <p className="text-sm">Monitor deployment in Vercel dashboard</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline">5</Badge>
              <p className="text-sm">Repeat the cycle for new features</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
