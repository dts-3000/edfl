"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertTriangle, GitBranch, Terminal, RefreshCw, ExternalLink } from "lucide-react"

export default function DeploymentPipelineFixPage() {
  const [activeStep, setActiveStep] = useState(1)

  const steps = [
    {
      id: 1,
      title: "Check Git Status",
      description: "Verify your changes are committed and pushed",
      commands: ["git status", "git log --oneline -3", "git remote -v"],
    },
    {
      id: 2,
      title: "Force Push Changes",
      description: "Ensure your changes reach the repository",
      commands: ["git add .", "git commit -m 'Force deployment update'", "git push origin main --force-with-lease"],
    },
    {
      id: 3,
      title: "Trigger Vercel Deployment",
      description: "Force Vercel to deploy your changes",
      commands: [
        "# Option 1: Empty commit",
        "git commit --allow-empty -m 'Trigger deployment'",
        "git push origin main",
        "",
        "# Option 2: Use Vercel CLI",
        "npx vercel --prod",
      ],
    },
  ]

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Fix Deployment Pipeline</h1>
          <p className="text-muted-foreground">Get your changes deploying again</p>
        </div>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Deployment Issue:</strong> Your app is live but new changes aren't being deployed. This usually means
          there's a disconnect between your local changes and what Vercel is seeing.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="diagnosis" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="diagnosis">Diagnosis</TabsTrigger>
          <TabsTrigger value="git-fix">Git Fix</TabsTrigger>
          <TabsTrigger value="vercel-fix">Vercel Fix</TabsTrigger>
          <TabsTrigger value="nuclear">Nuclear Option</TabsTrigger>
        </TabsList>

        <TabsContent value="diagnosis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Terminal className="h-5 w-5" />
                Deployment Diagnosis
              </CardTitle>
              <CardDescription>Let's figure out where the deployment pipeline is broken</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                {steps.map((step) => (
                  <div key={step.id} className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <Button
                        variant={activeStep === step.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => setActiveStep(step.id)}
                      >
                        Step {step.id}
                      </Button>
                      <div>
                        <h4 className="font-medium">{step.title}</h4>
                        <p className="text-sm text-muted-foreground">{step.description}</p>
                      </div>
                    </div>

                    {activeStep === step.id && (
                      <div className="mt-3 p-3 bg-muted rounded">
                        <p className="text-sm font-medium mb-2">Run these commands:</p>
                        <div className="bg-background p-3 rounded font-mono text-sm space-y-1">
                          {step.commands.map((cmd, idx) => (
                            <div key={idx} className={cmd.startsWith("#") ? "text-muted-foreground" : ""}>
                              {cmd}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="git-fix" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="h-5 w-5" />
                Git Repository Fix
              </CardTitle>
              <CardDescription>Ensure your changes are properly committed and pushed</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Most Common Issue:</strong> Changes are made in v0 but not pushed to your actual Git
                  repository
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="p-4 bg-muted rounded">
                  <h4 className="font-medium mb-2">1. Check Current Status</h4>
                  <div className="bg-background p-3 rounded font-mono text-sm">
                    git status
                    <br />
                    git branch
                    <br />
                    git remote -v
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    This shows what changes exist and which repository you're connected to
                  </p>
                </div>

                <div className="p-4 bg-muted rounded">
                  <h4 className="font-medium mb-2">2. Commit All Changes</h4>
                  <div className="bg-background p-3 rounded font-mono text-sm">
                    git add .<br />
                    git commit -m "Update club management and navigation"
                    <br />
                    git push origin main
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    This ensures all your changes are saved and pushed
                  </p>
                </div>

                <div className="p-4 bg-muted rounded">
                  <h4 className="font-medium mb-2">3. Verify on GitHub</h4>
                  <p className="text-sm text-muted-foreground">
                    Go to your GitHub repository and verify your latest commit appears there with your changes
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vercel-fix" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Vercel Deployment Fix
              </CardTitle>
              <CardDescription>Force Vercel to recognize and deploy your changes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded">
                  <h4 className="font-medium mb-2">Method 1: Manual Redeploy</h4>
                  <ol className="text-sm space-y-1">
                    <li>1. Go to Vercel Dashboard → Your Project</li>
                    <li>2. Click "Deployments" tab</li>
                    <li>3. Find latest deployment → Click three dots (⋯)</li>
                    <li>4. Click "Redeploy"</li>
                  </ol>
                  <Button asChild variant="outline" size="sm" className="mt-2">
                    <a href="https://vercel.com/dashboard" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open Vercel Dashboard
                    </a>
                  </Button>
                </div>

                <div className="p-4 bg-muted rounded">
                  <h4 className="font-medium mb-2">Method 2: Force New Deployment</h4>
                  <div className="bg-background p-3 rounded font-mono text-sm">
                    git commit --allow-empty -m "Force deployment"
                    <br />
                    git push origin main
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    This creates an empty commit that triggers a new deployment
                  </p>
                </div>

                <div className="p-4 bg-muted rounded">
                  <h4 className="font-medium mb-2">Method 3: Vercel CLI</h4>
                  <div className="bg-background p-3 rounded font-mono text-sm">
                    npm install -g vercel
                    <br />
                    vercel --prod
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">Deploy directly from your local machine</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="nuclear" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Nuclear Option: Fresh Start
              </CardTitle>
              <CardDescription>If nothing else works, start fresh (use as last resort)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Warning:</strong> Only use this if all other methods fail. This will create a new deployment.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="p-4 bg-muted rounded">
                  <h4 className="font-medium mb-2">Option 1: New Vercel Project</h4>
                  <ol className="text-sm space-y-1">
                    <li>1. Download your latest code from v0</li>
                    <li>2. Create a new GitHub repository</li>
                    <li>3. Push code to new repository</li>
                    <li>4. Create new Vercel project from new repository</li>
                    <li>5. Set up environment variables</li>
                  </ol>
                </div>

                <div className="p-4 bg-muted rounded">
                  <h4 className="font-medium mb-2">Option 2: Disconnect & Reconnect</h4>
                  <ol className="text-sm space-y-1">
                    <li>1. Vercel Dashboard → Project Settings → Git</li>
                    <li>2. Disconnect from Git repository</li>
                    <li>3. Reconnect to the same repository</li>
                    <li>4. Trigger new deployment</li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Quick Test</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            After trying any of the above methods, test if deployments are working by making a small change:
          </p>
          <div className="bg-muted p-3 rounded font-mono text-sm">
            # Make a small change to any file, then:
            <br />
            git add .<br />
            git commit -m "Test deployment fix"
            <br />
            git push origin main
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Check Vercel dashboard to see if a new deployment is triggered
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
