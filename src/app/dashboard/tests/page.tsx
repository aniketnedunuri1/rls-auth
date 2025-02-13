"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { CheckCircle, XCircle, AlertTriangle, Loader2 } from "lucide-react"
import { useSelector } from "react-redux"
import type { RootState } from "@/lib/store"

type TestStatus = "passed" | "failed" | "warning"

interface TestResult {
  testName: string
  status: TestStatus
  message: string
}

interface TestSuiteResult {
  testSuite: string
  results: TestResult[]
}

export default function TestsPage() {
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState<TestSuiteResult[]>([])
  const [error, setError] = useState<string | null>(null)
  const { schema, rlsPolicies } = useSelector((state: RootState) => state.schema)

  const runTests = async () => {
    setIsRunning(true)
    setResults([])
    setError(null)

    try {
      const response = await fetch("/api/generate-tests/authenticated", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          schema,
          rlsPolicies,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to run tests")
      }

      setResults(data.results)
    } catch (error) {
      console.error("Error running tests:", error)
      setError(error instanceof Error ? error.message : "An unknown error occurred")
      setResults([])
    } finally {
      setIsRunning(false)
    }
  }

  const getStatusIcon = (status: TestStatus) => {
    switch (status) {
      case "passed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
    }
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Security Tests</h1>
        <Button onClick={runTests} disabled={isRunning}>
          {isRunning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Run All Tests
        </Button>
      </div>

      {error && (
        <Card className="bg-red-500/10">
          <CardContent className="p-4">
            <p className="text-red-500 font-semibold">Error: {error}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Test Results</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px] rounded-md border bg-muted p-4">
            {results.length > 0 ? (
              results.map((suiteResult, suiteIndex) => (
                <div key={suiteIndex} className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">{suiteResult.testSuite}</h3>
                  <div className="space-y-2">
                    {suiteResult.results.map((result, index) => (
                      <div
                        key={index}
                        className={`flex items-start gap-2 p-2 rounded ${
                          result.status === "failed"
                            ? "bg-red-500/10"
                            : result.status === "warning"
                              ? "bg-yellow-500/10"
                              : "bg-green-500/10"
                        }`}
                      >
                        {getStatusIcon(result.status)}
                        <div>
                          <div className="font-medium">{result.testName}</div>
                          <div className="text-sm text-muted-foreground">{result.message}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-muted-foreground">
                {isRunning ? "Running tests..." : "Click 'Run All Tests' to start the security analysis"}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}

