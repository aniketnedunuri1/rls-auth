"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, CheckCircle, XCircle, ChevronDown, ChevronUp } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

interface TestDetail {
  query: string
  result: string
  timestamp: string
}

interface TestResult {
  name: string
  status: "passed" | "warning" | "failed"
  description: string
  details: TestDetail[]
}

export default function ResultsPage() {
  const [expandedTests, setExpandedTests] = useState<string[]>([])

  const toggleDetails = (testName: string) => {
    setExpandedTests((prev) =>
      prev.includes(testName) ? prev.filter((name) => name !== testName) : [...prev, testName],
    )
  }

  const testResults: TestResult[] = [
    {
      name: "User Authentication",
      status: "passed",
      description: "All user authentication policies are correctly implemented.",
      details: [
        {
          query: `
SELECT *
FROM users
WHERE organization_id = 1;
-- Testing if users can access data from other organizations`,
          result: "Access denied: RLS policy prevents cross-organization access",
          timestamp: "2024-01-31 20:45:12",
        },
        {
          query: `
UPDATE users
SET is_admin = true
WHERE id = 1;
-- Testing if non-admin users can elevate privileges`,
          result: "Access denied: RLS policy prevents privilege escalation",
          timestamp: "2024-01-31 20:45:13",
        },
      ],
    },
    {
      name: "Data Access Control",
      status: "warning",
      description: "Potential vulnerability in 'posts' table access control.",
      details: [
        {
          query: `
SELECT *
FROM posts
WHERE is_public = true;
-- Testing public posts access`,
          result: "Warning: Public posts are accessible without authentication",
          timestamp: "2024-01-31 20:45:14",
        },
        {
          query: `
SELECT *
FROM posts p
JOIN users u ON u.id = p.user_id
WHERE u.organization_id = 1;
-- Testing organization data isolation`,
          result: "Warning: Complex joins might bypass RLS policies",
          timestamp: "2024-01-31 20:45:15",
        },
      ],
    },
    {
      name: "Input Validation",
      status: "failed",
      description: "SQL injection vulnerability detected in search function.",
      details: [
        {
          query: `
SELECT * 
FROM users 
WHERE email LIKE '%' || $1 || '%';
-- Testing SQL injection prevention`,
          result: "Failed: Potential SQL injection vulnerability detected",
          timestamp: "2024-01-31 20:45:16",
        },
        {
          query: `
SELECT * 
FROM users 
WHERE id = $1::integer;
-- Testing type casting and input sanitization`,
          result: "Failed: Missing input validation for numeric fields",
          timestamp: "2024-01-31 20:45:17",
        },
      ],
    },
  ]

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Test Results</h1>
      <p className="text-muted-foreground">Review the results of your automated RLS and schema tests</p>
      <div className="space-y-4">
        {testResults.map((result, index) => (
          <Card key={index}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{result.name}</CardTitle>
                <Badge
                  variant={
                    result.status === "passed" ? "default" : result.status === "warning" ? "secondary" : "destructive"
                  }
                >
                  {result.status === "passed" && <CheckCircle className="mr-1 h-4 w-4" />}
                  {result.status === "warning" && <AlertTriangle className="mr-1 h-4 w-4" />}
                  {result.status === "failed" && <XCircle className="mr-1 h-4 w-4" />}
                  {result.status}
                </Badge>
              </div>
              <CardDescription>{result.description}</CardDescription>
            </CardHeader>
            {expandedTests.includes(result.name) && (
              <CardContent>
                <ScrollArea className="h-[300px] rounded-md border">
                  <div className="space-y-4 p-4">
                    {result.details.map((detail, detailIndex) => (
                      <div key={detailIndex} className="space-y-2">
                        <div className="font-mono text-sm bg-muted p-3 rounded-md overflow-x-auto">
                          <div className="text-xs text-muted-foreground mb-2">Query:</div>
                          <pre className="text-primary">{detail.query}</pre>
                        </div>
                        <div
                          className={`font-mono text-sm p-3 rounded-md ${
                            result.status === "passed"
                              ? "bg-green-500/10 text-green-500"
                              : result.status === "warning"
                                ? "bg-yellow-500/10 text-yellow-500"
                                : "bg-red-500/10 text-red-500"
                          }`}
                        >
                          <div className="text-xs opacity-70 mb-2">Result:</div>
                          {detail.result}
                        </div>
                        <div className="text-xs text-muted-foreground">Timestamp: {detail.timestamp}</div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            )}
            <CardFooter>
              <Button variant="outline" onClick={() => toggleDetails(result.name)} className="w-full">
                {expandedTests.includes(result.name) ? (
                  <>
                    <ChevronUp className="mr-2 h-4 w-4" />
                    Hide Details
                  </>
                ) : (
                  <>
                    <ChevronDown className="mr-2 h-4 w-4" />
                    View Details
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      <Button>Generate Full Report</Button>
    </div>
  )
}

