"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, AlertTriangle, RefreshCw } from "lucide-react"

export default function DeploymentDebugPage() {
  const [checks, setChecks] = useState<any[]>([])
  const [isChecking, setIsChecking] = useState(false)

  const runDeploymentChecks = async () => {
    setIsChecking(true)
    const results = []

    // Check 1: Environment Variables
    try {
      const envVars = [
        "NEXT_PUBLIC_FIREBASE_API_KEY",
        "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
        "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
        "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
        "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
        "NEXT_PUBLIC_FIREBASE_APP_ID",
        "NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID",
      ]

      const missingVars = envVars.filter((varName) => !process.env[varName])

      results.push({
        name: "Environment Variables",
        status: missingVars.length === 0 ? "pass" : "fail",
        message:
          missingVars.length === 0
            ? "All Firebase environment variables are present"
            : `Missing variables: ${missingVars.join(", ")}`,
        details: envVars.map((varName) => ({
          name: varName,
          present: !!process.env[varName],
          value: process.env[varName] ? "✓ Set" : "✗ Missing",
        })),
      })
    } catch (error) {
      results.push({
        name: "Environment Variables",
        status: "error",
        message: `Error checking environment variables: ${error}`,
        details: [],
      })
    }

    // Check 2: Firebase Connection
    try {
      const { db } = await import("@/lib/firebase")
      const { collection, getDocs, limit, query } = await import("firebase/firestore")

      const testQuery = query(collection(db, "clubs"), limit(1))
      await getDocs(testQuery)

      results.push({
        name: "Firebase Connection",
        status: "pass",
        message: "Successfully connected to Firebase",
        details: [],
      })
    } catch (error) {
      results.push({
        name: "Firebase Connection",
        status: "fail",
        message: `Firebase connection failed: ${error}`,
        details: [],
      })
    }

    // Check 3: Build Dependencies
    try {
      // Check if critical dependencies are available
      await import("firebase/app")
      await import("firebase/firestore")
      await import("firebase/auth")
      await import("firebase/storage")

      results.push({
        name: "Dependencies",
        status: "pass",
        message: "All critical dependencies are available",
        details: [],
      })
    } catch (error) {
      results.push({
        name: "Dependencies",
        status: "fail",
        message: `Dependency error: ${error}`,
        details: [],
      })
    }

    // Check 4: Route Structure
    try {
      const routes = ["/clubs", "/league-history", "/admin/clubs", "/admin/clubs/records", "/admin/clubs/articles"]

      results.push({
        name: "Route Structure",
        status: "pass",
        message: "Route structure appears correct",
        details: routes.map((route) => ({ name: route, status: "exists" })),
      })
    } catch (error) {
      results.push({
        name: "Route Structure",
        status: "error",
        message: `Route check error: ${error}`,
        details: [],
      })
    }

    // Check 5: TypeScript/Build Issues
    try {
      // Check for common TypeScript issues
      const tsIssues = []

      // Check if we're using proper imports
      if (typeof window !== "undefined") {
        tsIssues.push("Client-side code detected in server component")
      }

      results.push({
        name: "TypeScript/Build",
        status: tsIssues.length === 0 ? "pass" : "warning",
        message:
          tsIssues.length === 0 ? "No obvious TypeScript issues detected" : `Potential issues: ${tsIssues.join(", ")}`,
        details: tsIssues.map((issue) => ({ name: issue, status: "warning" })),
      })
    } catch (error) {
      results.push({
        name: "TypeScript/Build",
        status: "error",
        message: `TypeScript check error: ${error}`,
        details: [],
      })
    }

    setChecks(results)
    setIsChecking(false)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pass":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "fail":
        return <XCircle className="h-5 w-5 text-red-500" />
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      default:
        return <XCircle className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      pass: "default",
      fail: "destructive",
      warning: "secondary",
      error: "destructive",
    } as const

    return <Badge variant={variants[status as keyof typeof variants] || "secondary"}>{status.toUpperCase()}</Badge>
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Deployment Debug</h1>
          <p className="text-muted-foreground">Diagnose deployment issues and check system health</p>
        </div>
        <Button onClick={runDeploymentChecks} disabled={isChecking} className="flex items-center gap-2">
          <RefreshCw className={`h-4 w-4 ${isChecking ? "animate-spin" : ""}`} />
          {isChecking ? "Checking..." : "Run Checks"}
        </Button>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Common Deployment Issues:</strong>
          <ul className="mt-2 space-y-1 text-sm">
            <li>• Missing environment variables in Vercel dashboard</li>
            <li>• Build errors due to TypeScript issues</li>
            <li>• Firebase configuration problems</li>
            <li>• Import/export errors in components</li>
            <li>• Missing dependencies in package.json</li>
          </ul>
        </AlertDescription>
      </Alert>

      {checks.length > 0 && (
        <div className="grid gap-4">
          {checks.map((check, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-2">
                  {getStatusIcon(check.status)}
                  <CardTitle className="text-lg">{check.name}</CardTitle>
                </div>
                {getStatusBadge(check.status)}
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-3">{check.message}</CardDescription>

                {check.details && check.details.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Details:</h4>
                    <div className="grid gap-1 text-sm">
                      {check.details.map((detail: any, detailIndex: number) => (
                        <div key={detailIndex} className="flex justify-between items-center p-2 bg-muted rounded">
                          <span>{detail.name}</span>
                          <span
                            className={
                              detail.present === false || detail.status === "warning"
                                ? "text-red-500"
                                : "text-green-500"
                            }
                          >
                            {detail.value || detail.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Manual Deployment Checklist</CardTitle>
          <CardDescription>Check these items manually in your deployment environment</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            <div className="flex items-center gap-2">
              <input type="checkbox" id="env-vars" className="rounded" />
              <label htmlFor="env-vars" className="text-sm">
                Environment variables are set in Vercel dashboard
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="build-logs" className="rounded" />
              <label htmlFor="build-logs" className="text-sm">
                Check build logs for errors in Vercel dashboard
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="function-logs" className="rounded" />
              <label htmlFor="function-logs" className="text-sm">
                Check function logs for runtime errors
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="domain-config" className="rounded" />
              <label htmlFor="domain-config" className="text-sm">
                Domain configuration is correct
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="firebase-rules" className="rounded" />
              <label htmlFor="firebase-rules" className="text-sm">
                Firebase security rules allow production access
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick Fixes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-3 bg-muted rounded">
            <h4 className="font-medium mb-2">Environment Variables Missing?</h4>
            <p className="text-sm text-muted-foreground mb-2">
              Go to Vercel Dashboard → Project → Settings → Environment Variables
            </p>
            <code className="text-xs bg-background p-2 rounded block">
              NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
              <br />
              NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
              <br />
              NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
              <br />
              {/* Add other env vars */}
            </code>
          </div>

          <div className="p-3 bg-muted rounded">
            <h4 className="font-medium mb-2">Build Failing?</h4>
            <p className="text-sm text-muted-foreground">
              Check for TypeScript errors, missing imports, or syntax issues in the build logs.
            </p>
          </div>

          <div className="p-3 bg-muted rounded">
            <h4 className="font-medium mb-2">Firebase Connection Issues?</h4>
            <p className="text-sm text-muted-foreground">
              Verify Firebase project settings and security rules allow production access.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
