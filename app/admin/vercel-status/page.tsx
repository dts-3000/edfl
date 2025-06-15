"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, ExternalLink, Globe, Server, Zap } from "lucide-react"

export default function VercelStatusPage() {
  const [statusChecks, setStatusChecks] = useState<any[]>([])
  const [isChecking, setIsChecking] = useState(false)
  const [lastChecked, setLastChecked] = useState<Date | null>(null)

  const runStatusChecks = async () => {
    setIsChecking(true)
    const results = []

    // Check 1: Basic connectivity
    try {
      const start = Date.now()
      const response = await fetch(window.location.origin + "/api/health", {
        method: "GET",
        cache: "no-cache",
      })
      const end = Date.now()

      results.push({
        name: "App Connectivity",
        status: response.ok ? "pass" : "fail",
        message: response.ok
          ? `App is reachable (${end - start}ms response time)`
          : `App unreachable (Status: ${response.status})`,
        responseTime: end - start,
        icon: Globe,
      })
    } catch (error) {
      results.push({
        name: "App Connectivity",
        status: "fail",
        message: `Connection failed: ${error}`,
        responseTime: null,
        icon: Globe,
      })
    }

    // Check 2: Edge Functions
    try {
      const start = Date.now()
      const response = await fetch("/api/vfl-data", {
        method: "GET",
        cache: "no-cache",
      })
      const end = Date.now()

      results.push({
        name: "Edge Functions",
        status: response.ok ? "pass" : "fail",
        message: response.ok
          ? `Edge functions working (${end - start}ms)`
          : `Edge functions failing (Status: ${response.status})`,
        responseTime: end - start,
        icon: Zap,
      })
    } catch (error) {
      results.push({
        name: "Edge Functions",
        status: "fail",
        message: `Edge function error: ${error}`,
        responseTime: null,
        icon: Zap,
      })
    }

    // Check 3: Static Assets
    try {
      const start = Date.now()
      const response = await fetch("/images/edfl-fantasy-logo.png", {
        method: "HEAD",
        cache: "no-cache",
      })
      const end = Date.now()

      results.push({
        name: "Static Assets",
        status: response.ok ? "pass" : "fail",
        message: response.ok
          ? `Static assets loading (${end - start}ms)`
          : `Static assets failing (Status: ${response.status})`,
        responseTime: end - start,
        icon: Server,
      })
    } catch (error) {
      results.push({
        name: "Static Assets",
        status: "fail",
        message: `Static asset error: ${error}`,
        responseTime: null,
        icon: Server,
      })
    }

    // Check 4: Database connectivity (Firebase)
    try {
      const start = Date.now()
      const { db } = await import("@/lib/firebase")
      const { collection, getDocs, limit, query } = await import("firebase/firestore")

      const testQuery = query(collection(db, "clubs"), limit(1))
      await getDocs(testQuery)
      const end = Date.now()

      results.push({
        name: "Database Connection",
        status: "pass",
        message: `Firebase connected (${end - start}ms)`,
        responseTime: end - start,
        icon: Server,
      })
    } catch (error) {
      results.push({
        name: "Database Connection",
        status: "fail",
        message: `Firebase connection failed: ${error}`,
        responseTime: null,
        icon: Server,
      })
    }

    setStatusChecks(results)
    setLastChecked(new Date())
    setIsChecking(false)
  }

  useEffect(() => {
    runStatusChecks()
  }, [])

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
    } as const

    return <Badge variant={variants[status as keyof typeof variants] || "secondary"}>{status.toUpperCase()}</Badge>
  }

  const overallStatus =
    statusChecks.length > 0
      ? statusChecks.every((check) => check.status === "pass")
        ? "pass"
        : statusChecks.some((check) => check.status === "fail")
          ? "fail"
          : "warning"
      : "unknown"

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Vercel Status Check</h1>
          <p className="text-muted-foreground">Check if deployment issues are related to Vercel services</p>
          {lastChecked && (
            <p className="text-sm text-muted-foreground mt-1">Last checked: {lastChecked.toLocaleTimeString()}</p>
          )}
        </div>
        <Button onClick={runStatusChecks} disabled={isChecking} className="flex items-center gap-2">
          <RefreshCw className={`h-4 w-4 ${isChecking ? "animate-spin" : ""}`} />
          {isChecking ? "Checking..." : "Refresh Status"}
        </Button>
      </div>

      {/* Overall Status */}
      <Card
        className={`border-2 ${
          overallStatus === "pass"
            ? "border-green-200 bg-green-50"
            : overallStatus === "fail"
              ? "border-red-200 bg-red-50"
              : "border-yellow-200 bg-yellow-50"
        }`}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-2">
            {getStatusIcon(overallStatus)}
            <CardTitle className="text-xl">Overall Status</CardTitle>
          </div>
          {getStatusBadge(overallStatus)}
        </CardHeader>
        <CardContent>
          <CardDescription className="text-base">
            {overallStatus === "pass" && "All systems operational"}
            {overallStatus === "fail" && "Some systems are experiencing issues"}
            {overallStatus === "warning" && "Some systems have warnings"}
            {overallStatus === "unknown" && "Status unknown - run checks"}
          </CardDescription>
        </CardContent>
      </Card>

      {/* Individual Checks */}
      {statusChecks.length > 0 && (
        <div className="grid gap-4">
          {statusChecks.map((check, index) => {
            const IconComponent = check.icon
            return (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex items-center gap-2">
                    <IconComponent className="h-5 w-5 text-muted-foreground" />
                    {getStatusIcon(check.status)}
                    <CardTitle className="text-lg">{check.name}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    {check.responseTime && <Badge variant="outline">{check.responseTime}ms</Badge>}
                    {getStatusBadge(check.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>{check.message}</CardDescription>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* External Status Links */}
      <Card>
        <CardHeader>
          <CardTitle>External Status Checks</CardTitle>
          <CardDescription>Check these external sources for Vercel status updates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3">
            <a
              href="https://www.vercel-status.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4" />
                <span className="font-medium">Vercel Status Page</span>
              </div>
              <ExternalLink className="h-4 w-4" />
            </a>

            <a
              href="https://twitter.com/vercel"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                <span className="font-medium">@vercel on Twitter/X</span>
              </div>
              <ExternalLink className="h-4 w-4" />
            </a>

            <a
              href="https://vercel.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                <span className="font-medium">Your Vercel Dashboard</span>
              </div>
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Troubleshooting Tips */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>If you're experiencing deployment issues:</strong>
          <ul className="mt-2 space-y-1 text-sm">
            <li>• Check the Vercel Status Page for ongoing incidents</li>
            <li>• Review your deployment logs in the Vercel dashboard</li>
            <li>• Try redeploying your project</li>
            <li>• Check if your domain configuration is correct</li>
            <li>• Verify environment variables are properly set</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  )
}
