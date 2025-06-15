"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertTriangle, Settings, ExternalLink, CheckCircle, Copy } from "lucide-react"

export default function VercelConfigFixPage() {
  const [copiedEnvVar, setCopiedEnvVar] = useState<string | null>(null)

  const envVars = [
    "NEXT_PUBLIC_FIREBASE_API_KEY",
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
    "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
    "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
    "NEXT_PUBLIC_FIREBASE_APP_ID",
    "NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID",
  ]

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedEnvVar(text)
    setTimeout(() => setCopiedEnvVar(null), 2000)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Vercel Configuration Fix</h1>
          <p className="text-muted-foreground">Resolve deployment configuration conflicts</p>
        </div>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Configuration Mismatch:</strong> Your current project settings differ from the production deployment.
          This usually happens when environment variables or build settings change.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="quick-fix" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="quick-fix">Quick Fix</TabsTrigger>
          <TabsTrigger value="env-vars">Environment Variables</TabsTrigger>
          <TabsTrigger value="build-settings">Build Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="quick-fix" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Quick Resolution Steps
              </CardTitle>
              <CardDescription>Follow these steps in order to fix the configuration mismatch</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                      1
                    </span>
                    <h4 className="font-medium">Open Vercel Dashboard</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Go to your project in the Vercel dashboard and navigate to the Deployments tab.
                  </p>
                  <Button asChild variant="outline" size="sm">
                    <a href="https://vercel.com/dashboard" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open Vercel Dashboard
                    </a>
                  </Button>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                      2
                    </span>
                    <h4 className="font-medium">Force Redeploy</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Find your latest deployment and click the "Redeploy" button. This will use your current project
                    settings.
                  </p>
                  <div className="bg-muted p-3 rounded text-sm">
                    <strong>Important:</strong> Make sure to select "Use existing Build Cache" when redeploying.
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                      3
                    </span>
                    <h4 className="font-medium">Alternative: Trigger New Deployment</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    If redeploying doesn't work, make a small change and push to trigger a fresh deployment:
                  </p>
                  <div className="bg-muted p-3 rounded text-sm font-mono">
                    git commit --allow-empty -m "Force deployment"
                    <br />
                    git push origin main
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="env-vars" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Environment Variables Check
              </CardTitle>
              <CardDescription>Verify all required environment variables are set correctly</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Go to your Vercel project → Settings → Environment Variables and verify these are all set:
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                {envVars.map((envVar) => (
                  <div key={envVar} className="flex items-center justify-between p-3 border rounded">
                    <code className="text-sm font-mono">{envVar}</code>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(envVar)}>
                      {copiedEnvVar === envVar ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-muted rounded">
                <h4 className="font-medium mb-2">Environment Variable Values</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Make sure each variable has the correct value from your Firebase project:
                </p>
                <ul className="text-sm space-y-1">
                  <li>
                    • All variables should be set for <strong>Production</strong>, <strong>Preview</strong>, and{" "}
                    <strong>Development</strong>
                  </li>
                  <li>• Values should match your Firebase project configuration</li>
                  <li>• No trailing spaces or quotes around the values</li>
                </ul>
              </div>

              <Button asChild variant="outline">
                <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Get Values from Firebase Console
                </a>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="build-settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Build & Output Settings</CardTitle>
              <CardDescription>Verify your build configuration matches Next.js requirements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="p-4 border rounded">
                  <h4 className="font-medium mb-2">Framework Preset</h4>
                  <p className="text-sm text-muted-foreground mb-2">Should be set to:</p>
                  <Badge variant="secondary">Next.js</Badge>
                </div>

                <div className="p-4 border rounded">
                  <h4 className="font-medium mb-2">Build Command</h4>
                  <p className="text-sm text-muted-foreground mb-2">Should be:</p>
                  <code className="bg-muted px-2 py-1 rounded text-sm">npm run build</code>
                </div>

                <div className="p-4 border rounded">
                  <h4 className="font-medium mb-2">Output Directory</h4>
                  <p className="text-sm text-muted-foreground mb-2">Should be:</p>
                  <code className="bg-muted px-2 py-1 rounded text-sm">.next</code>
                </div>

                <div className="p-4 border rounded">
                  <h4 className="font-medium mb-2">Install Command</h4>
                  <p className="text-sm text-muted-foreground mb-2">Should be:</p>
                  <code className="bg-muted px-2 py-1 rounded text-sm">npm install</code>
                </div>
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  If any of these settings are different, update them in Vercel → Project Settings → General
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Still Having Issues?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">If the configuration mismatch persists, you may need to:</p>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>• Delete and recreate the Vercel project</li>
            <li>• Check for any custom vercel.json configuration files</li>
            <li>• Contact Vercel support if the issue persists</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
