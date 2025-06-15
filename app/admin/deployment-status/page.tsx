"use client"

import { useState, useEffect } from "react"
import AdminLayout from "@/components/admin/AdminLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertTriangle, CheckCircle, XCircle, RefreshCw, ExternalLink, Clock, Globe } from "lucide-react"

export default function DeploymentStatusPage() {
  const [currentUrl, setCurrentUrl] = useState("")
  const [buildInfo, setBuildInfo] = useState<any>(null)

  useEffect(() => {
    setCurrentUrl(window.location.origin)

    // Try to detect build info
    const buildTime = document.querySelector('meta[name="build-time"]')?.getAttribute("content")
    const buildId = document.querySelector('meta[name="build-id"]')?.getAttribute("content")

    setBuildInfo({
      buildTime: buildTime || "Unknown",
      buildId: buildId || "Unknown",
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    })
  }, [])

  const checkDeploymentStatus = () => {
    window.location.reload()
  }

  const deploymentIssues = [
    {
      issue: "Changes not appearing",
      likely: "Git repository not connected or changes not pushed",
      solution: "Check if you're using v0's Deploy button or manual Git setup",
    },
    {
      issue: "Old version still showing",
      likely: "Browser cache or CDN cache",
      solution: "Hard refresh (Ctrl+F5) or clear browser cache",
    },
    {
      issue: "404 on new pages",
      likely: "Build failed or routes not generated",
      solution: "Check Vercel build logs for errors",
    },
    {
      issue: "Menu not updated",
      likely: "Layout component not rebuilt",
      solution: "Force new deployment or check component imports",
    },
  ]

  const quickChecks = [
    {
      name: "Current URL",
      value: currentUrl,
      status: currentUrl.includes("v0-") ? "warning" : "success",
      note: currentUrl.includes("v0-") ? "Using v0 preview URL" : "Using production URL",
    },
    {
      name: "Page exists",
      value: "Testing...",
      status: "info",
      note: "Check if this admin page loads",
    },
    {
      name: "Menu component",
      value: "Check navigation",
      status: "info",
      note: "Look for Historical Seasons in menu",
    },
  ]

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Deployment Status</h1>
            <p className="text-muted-foreground">Check if your changes are deployed correctly</p>
          </div>
          <Button onClick={checkDeploymentStatus}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Status
          </Button>
        </div>

        {/* Current Status */}
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Deployment Issue Detected</AlertTitle>
          <AlertDescription>
            Your changes are not appearing on the production site. This page loading confirms the admin system works,
            but new pages and menu updates are missing.
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="diagnosis">
          <TabsList>
            <TabsTrigger value="diagnosis">Diagnosis</TabsTrigger>
            <TabsTrigger value="solutions">Solutions</TabsTrigger>
            <TabsTrigger value="verification">Verification</TabsTrigger>
          </TabsList>

          <TabsContent value="diagnosis" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Quick Status Checks</CardTitle>
                <CardDescription>Basic information about your current deployment</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {quickChecks.map((check, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{check.name}</div>
                        <div className="text-sm text-muted-foreground">{check.note}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            check.status === "success"
                              ? "default"
                              : check.status === "warning"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {check.value}
                        </Badge>
                        {check.status === "success" && <CheckCircle className="h-4 w-4 text-green-500" />}
                        {check.status === "warning" && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                        {check.status === "info" && <Clock className="h-4 w-4 text-blue-500" />}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Common Deployment Issues</CardTitle>
                <CardDescription>Likely causes and their solutions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {deploymentIssues.map((item, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-medium text-red-900">{item.issue}</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            <strong>Likely cause:</strong> {item.likely}
                          </p>
                          <p className="text-sm text-green-700 mt-2">
                            <strong>Solution:</strong> {item.solution}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="solutions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Step-by-Step Solutions</CardTitle>
                <CardDescription>Try these solutions in order</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold text-lg mb-3 flex items-center">
                      <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3">
                        1
                      </span>
                      Check Your Deployment Method
                    </h3>
                    <div className="ml-9 space-y-2">
                      <p className="text-sm">Are you using v0's built-in deployment or manual Git setup?</p>
                      <div className="bg-gray-50 p-3 rounded">
                        <p className="text-sm">
                          <strong>v0 Method:</strong> Look for "Deploy" button in v0 interface
                        </p>
                        <p className="text-sm">
                          <strong>Manual Method:</strong> Check if Git repository is connected to Vercel
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold text-lg mb-3 flex items-center">
                      <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3">
                        2
                      </span>
                      Force New Deployment
                    </h3>
                    <div className="ml-9 space-y-2">
                      <p className="text-sm">Try these methods to force a new deployment:</p>
                      <ul className="text-sm space-y-1 list-disc list-inside">
                        <li>Use v0's Deploy button if available</li>
                        <li>Go to Vercel Dashboard → Deployments → Redeploy</li>
                        <li>Make a small change and redeploy</li>
                      </ul>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold text-lg mb-3 flex items-center">
                      <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3">
                        3
                      </span>
                      Clear Cache
                    </h3>
                    <div className="ml-9 space-y-2">
                      <p className="text-sm">Clear browser and CDN cache:</p>
                      <ul className="text-sm space-y-1 list-disc list-inside">
                        <li>Hard refresh: Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)</li>
                        <li>Clear browser cache completely</li>
                        <li>Try incognito/private browsing mode</li>
                      </ul>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold text-lg mb-3 flex items-center">
                      <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3">
                        4
                      </span>
                      Check Build Logs
                    </h3>
                    <div className="ml-9 space-y-2">
                      <p className="text-sm">Look for build errors:</p>
                      <ul className="text-sm space-y-1 list-disc list-inside">
                        <li>Go to Vercel Dashboard → Your Project → Deployments</li>
                        <li>Click on latest deployment</li>
                        <li>Check "Build Logs" for any errors</li>
                        <li>Look for failed imports or missing files</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="verification" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Verify Your Deployment</CardTitle>
                <CardDescription>Test these to confirm your changes are live</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium mb-2">Test New Pages</h4>
                      <div className="space-y-2">
                        <Button variant="outline" size="sm" asChild className="w-full">
                          <a href="/historical-seasons" target="_blank" rel="noreferrer">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Test Historical Seasons
                          </a>
                        </Button>
                        <Button variant="outline" size="sm" asChild className="w-full">
                          <a href="/admin/historical-seasons" target="_blank" rel="noreferrer">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Test Admin Historical
                          </a>
                        </Button>
                      </div>
                    </div>

                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium mb-2">Check Menu</h4>
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          Look for "Historical Seasons" in the top navigation menu
                        </p>
                        <Button variant="outline" size="sm" asChild className="w-full">
                          <a href="/" target="_blank" rel="noreferrer">
                            <Globe className="mr-2 h-4 w-4" />
                            Check Homepage Menu
                          </a>
                        </Button>
                      </div>
                    </div>
                  </div>

                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertTitle>Success Indicators</AlertTitle>
                    <AlertDescription>
                      If the test links above work and you see "Historical Seasons" in the menu, your deployment is
                      successful!
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Quick Links */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Links</CardTitle>
            <CardDescription>External resources to help with deployment</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline" asChild>
                <a href="https://vercel.com/dashboard" target="_blank" rel="noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Vercel Dashboard
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a href="https://v0.dev" target="_blank" rel="noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  v0 Interface
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a
                  href="https://nextjs.org/docs/app/building-your-application/deploying"
                  target="_blank"
                  rel="noreferrer"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Next.js Deploy Docs
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
