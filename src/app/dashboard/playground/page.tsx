"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function PlaygroundPage() {
  const [query, setQuery] = useState("")
  const [result, setResult] = useState("")

  const runTest = () => {
    // Simulating test run
    setResult(
      "Running tests...\n\nAnalyzing schema and RLS policies...\n\nSimulating attacks...\n\nGenerating report...",
    )
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold tracking-tight">Database Playground</h1>
      <Card className="border border-white/10 bg-[#0f0f0f] rounded-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl">Query Editor</CardTitle>
          <CardDescription className="text-gray-400 text-sm">Write your SQL queries here to test against your schema</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="SELECT * FROM users;"
            className="min-h-[200px] bg-[#0a0a0a] border-white/10 focus:border-purple-500/50 rounded-md font-mono text-sm"
          />
        </CardContent>
        <CardFooter>
          <Button 
            onClick={() => setResult("Query executed successfully.")}
            className="bg-purple-600 hover:bg-purple-700 text-white rounded-md"
          >
            Run Query
          </Button>
        </CardFooter>
      </Card>
      <Card className="border border-white/10 bg-[#0f0f0f] rounded-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl">Test Results</CardTitle>
          <CardDescription className="text-gray-400 text-sm">View the results of your queries and tests here</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea 
            value={result} 
            readOnly 
            className="min-h-[200px] bg-[#0a0a0a] border-white/10 rounded-md font-mono text-sm" 
          />
        </CardContent>
        <CardFooter>
          <Button 
            onClick={runTest}
            className="bg-purple-600 hover:bg-purple-700 text-white rounded-md"
          >
            Run Automated Tests
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

