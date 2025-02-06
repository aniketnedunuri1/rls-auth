"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Info, ChevronDown, ChevronUp, Play, CheckCircle, AlertTriangle, XCircle, Loader2 } from "lucide-react"
import ReactFlow, { Controls, Background, useNodesState, useEdgesState } from "reactflow"
import "reactflow/dist/style.css
import { useDispatch, useSelector } from "react-redux"
import { setSchema, setRLSPolicies, setAdditionalContext, setSupabaseConfig } from "@/lib/schemaSlice"
import type { RootState } from "@/lib/store"
import Image from "next/image"


interface ExpectedOutcome {
  data?: any;
  status?: number;
  statusText?: string;
  error?: any;
}

interface TestCase {
  id: string
  name: string
  description: string
  query?: string
  expected?: ExpectedOutcome
}

interface TestCategory {
  id: string
  name: string
  description: string
  tests: TestCase[]
}

interface DatabaseProvider {
  id: string
  name: string
  logo: string
}

const databaseProviders: DatabaseProvider[] = [
  { id: "supabase", name: "Supabase", logo: "/placeholder.svg?height=24&width=24" },
  { id: "firebase", name: "Firebase", logo: "/placeholder.svg?height=24&width=24" },
  { id: "aws", name: "AWS", logo: "/placeholder.svg?height=24&width=24" },
  { id: "azure", name: "Azure", logo: "/placeholder.svg?height=24&width=24" },
]

// Mock test data

const mockTestCategories: TestCategory[] = [
  {
    "id": "rls-testing",
    "name": "RLS Testing",
    "description": "Tests that verify row-level security (RLS) policies are correctly enforced.",
    "tests": [
      {
        "id": "rls-1",
        "name": "Document Access by Owner",
        "description": "Ensures that users can only access documents they own or if they are admins.",
        "query": "SELECT * FROM documents WHERE owner_id = current_setting('app.current_user_id')::int;",
        "expected": {
          "data": [],
          "status": 200,
          "statusText": "OK"
        }
      },
      {
        "id": "rls-2",
        "name": "Cross-User Document Access Attempt",
        "description": "Attempts to access another user's documents without admin privileges.",
        "query": "SELECT * FROM documents WHERE owner_id != current_setting('app.current_user_id')::int;",
        "expected": {
          "data": [],
          "status": 200,
          "statusText": "OK"
        }
      },
      {
        "id": "rls-3",
        "name": "Restricted Update on Other Users' Documents",
        "description": "Attempts to update a document owned by another user.",
        "query": "UPDATE documents SET title = 'Hacked Title' WHERE owner_id != current_setting('app.current_user_id')::int;",
        "expected": {
          "error": {
            "code": "42501",
            "message": "permission denied for relation documents"
          },
          "status": 403,
          "statusText": "Forbidden"
        }
      },
      {
        "id": "rls-4",
        "name": "Comment Access via Document Ownership",
        "description": "Verifies that users can only access comments linked to documents they own or have admin access to.",
        "query": "SELECT * FROM comments WHERE document_id IN (SELECT id FROM documents WHERE owner_id = current_setting('app.current_user_id')::int);",
        "expected": {
          "data": [],
          "status": 200,
          "statusText": "OK"
        }
      },
      {
        "id": "rls-5",
        "name": "Prevent Unauthorized Comment Updates",
        "description": "Ensures that users cannot update comments posted by others.",
        "query": "UPDATE comments SET comment = 'Hacked Comment' WHERE user_id != current_setting('app.current_user_id')::int;",
        "expected": {
          "error": {
            "code": "42501",
            "message": "permission denied for relation comments"
          },
          "status": 403,
          "statusText": "Forbidden"
        }
      },
      {
        "id": "rls-6",
        "name": "Prevent Access to Inactive Users",
        "description": "Verifies that inactive users cannot access any documents.",
        "query": "SELECT * FROM documents WHERE owner_id = current_setting('app.current_user_id')::int AND (SELECT is_active FROM users WHERE id = current_setting('app.current_user_id')::int) = FALSE;",
        "expected": {
          "data": [],
          "status": 200,
          "statusText": "OK"
        }
      },
      {
        "id": "rls-7",
        "name": "Insert Comment as Another User",
        "description": "Attempts to insert a comment while impersonating another user.",
        "query": "INSERT INTO comments (document_id, user_id, comment) VALUES (1, 2, 'Malicious Comment');",
        "expected": {
          "error": {
            "code": "23514",
            "message": "new row violates row-level security policy for table \"comments\""
          },
          "status": 403,
          "statusText": "Forbidden"
        }
      },
      {
        "id": "rls-8",
        "name": "Document Ownership Modification Attempt",
        "description": "Attempts to change the ownership of a document to another user.",
        "query": "UPDATE documents SET owner_id = 2 WHERE id = 1;",
        "expected": {
          "error": {
            "code": "42501",
            "message": "permission denied for relation documents"
          },
          "status": 403,
          "statusText": "Forbidden"
        }
      },
      {
        "id": "rls-9",
        "name": "Access Other Users' Emails",
        "description": "Attempts to select emails from the users table without admin privileges.",
        "query": "SELECT email FROM users;",
        "expected": {
          "error": {
            "code": "42501",
            "message": "permission denied for relation users"
          },
          "status": 403,
          "statusText": "Forbidden"
        }
      },
      {
        "id": "rls-10",
        "name": "Insert Document for Another User",
        "description": "Attempts to insert a document with another user's owner_id.",
        "query": "INSERT INTO documents (owner_id, title, content) VALUES (2, 'Malicious Document', 'Hacked Content');",
        "expected": {
          "error": {
            "code": "23514",
            "message": "new row violates row-level security policy for table \"documents\""
          },
          "status": 403,
          "statusText": "Forbidden"
        }
      }
    ]
  },
  {
    "id": "auth-testing",
    "name": "Authentication Testing",
    "description": "Tests to ensure that unauthorized access or actions are blocked.",
    "tests": [
      {
        "id": "auth-1",
        "name": "Access Without Authentication",
        "description": "Tries to access a protected table without being authenticated.",
        "query": "SELECT * FROM documents;",
        "expected": {
          "error": {
            "code": "42501",
            "message": "permission denied for relation documents"
          },
          "status": 403,
          "statusText": "Forbidden"
        }
      },
      {
        "id": "auth-2",
        "name": "Prevent Unauthorized User Creation",
        "description": "Attempts to create a user without admin privileges.",
        "query": "INSERT INTO users (username, role, email, is_active) VALUES ('hacker', 'admin', 'hacker@example.com', TRUE);",
        "expected": {
          "error": {
            "code": "42501",
            "message": "permission denied for relation users"
          },
          "status": 403,
          "statusText": "Forbidden"
        }
      },
      {
        "id": "auth-3",
        "name": "Prevent Role Modification",
        "description": "Attempts to change their own role to 'admin'.",
        "query": "UPDATE users SET role = 'admin' WHERE id = current_setting('app.current_user_id')::int;",
        "expected": {
          "error": {
            "code": "42501",
            "message": "permission denied for relation users"
          },
          "status": 403,
          "statusText": "Forbidden"
        }
      },
      {
        "id": "auth-4",
        "name": "Insert Document as Anonymous User",
        "description": "Attempts to insert a document without being authenticated.",
        "query": "INSERT INTO documents (owner_id, title, content) VALUES (1, 'Anonymous Document', 'Test Content');",
        "expected": {
          "error": {
            "code": "42501",
            "message": "permission denied for relation documents"
          },
          "status": 403,
          "statusText": "Forbidden"
        }
      },
      {
        "id": "auth-5",
        "name": "Access Other Users' Roles",
        "description": "Attempts to select roles from the users table without admin privileges.",
        "query": "SELECT role FROM users;",
        "expected": {
          "error": {
            "code": "42501",
            "message": "permission denied for relation users"
          },
          "status": 403,
          "statusText": "Forbidden"
        }
      }
    ]
  }
]

export default function SchemaPage() {
  const dispatch = useDispatch()
  const { schema, rlsPolicies, additionalContext, supabaseConfig } = useSelector((state: RootState) => state.schema)
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [expandedTests, setExpandedTests] = useState<string[]>([])
  const [testCategories, setTestCategories] = useState<TestCategory[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [activeProvider, setActiveProvider] = useState<string | null>(null)
  const [providerConfigs, setProviderConfigs] = useState<Record<string, { url: string; key: string }>>({
    supabase: { url: supabaseConfig.url, key: supabaseConfig.anonKey },
    firebase: { url: "", key: "" },
    aws: { url: "", key: "" },
    azure: { url: "", key: "" },
  })

  const toggleTest = (testId: string) => {
    setExpandedTests((prev) => (prev.includes(testId) ? prev.filter((id) => id !== testId) : [...prev, testId]))
  }

  const generateTests = async () => {
    setIsGenerating(true);

    try {
      const response = await fetch("/api/test-runner", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // include any user input you need:
          schema,
          rlsPolicies,
          additionalContext,
        }),
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      // The serverless route returns { results: [ { testSuite, results }, ... ] }
      const data = await response.json();
      console.log("dataaaa", data)

      /*
        data.results is an array of:
        [
          {
            testSuite: "authentication-privilege-tests" | "rls-security" | ...,
            results: {
              "test_categories": [
                {
                  "id": "some-cat-id",
                  "name": "Some Category",
                  "description": "...",
                  "tests": [
                    { "id": "...", "name": "...", "description": "...", "query": "...", "expected": {...} },
                    ...
                  ]
                },
                ...
              ]
            }
          },
          { ... }
        ]
      */

      // We can merge all test_categories from each testSuite into one array:
      const allCategories: TestCategory[] = [];

      if (data.result && data.result.test_categories) {
        allCategories.push(...data.result.test_categories);
      }

      setTestCategories(allCategories);

    } catch (error) {
      console.error("Error calling /api/test-runner:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  // const getStatusIcon = (status: TestCase["status"]) => {
  //   switch (status) {
  //     case "passed":
  //       return <CheckCircle className="h-4 w-4 text-green-500" />
  //     case "failed":
  //       return <XCircle className="h-4 w-4 text-red-500" />
  //     case "warning":
  //       return <AlertTriangle className="h-4 w-4 text-yellow-500" />
  //     default:
  //       return null
  //   }
  // }

  const runTest = async (testId: string) => {
    // Simulate running a single test
    setTestCategories((prev) =>
      prev.map((category) => ({
        ...category,
        tests: category.tests.map((test) =>
          test.id === testId ? { ...test, status: Math.random() > 0.5 ? "passed" : "failed" } : test,
        ),
      })),
    )
  }

  const runTestSuite = async (categoryId: string) => {
    // Simulate running all tests in a category
    setTestCategories((prev) =>
      prev.map((category) =>
        category.id === categoryId
          ? {
            ...category,
            tests: category.tests.map((test) => ({
              ...test,
              status: Math.random() > 0.5 ? "passed" : "failed",
            })),
          }
          : category,
      ),
    )
  }

  const handleProviderChange = (providerId: string) => {
    setActiveProvider(providerId)
  }

  const handleConfigChange = (providerId: string, field: "url" | "key", value: string) => {
    setProviderConfigs((prev) => ({
      ...prev,
      [providerId]: {
        ...prev[providerId],
        [field]: value,
      },
    }))
  }

  const fetchProviderSchema = (providerId: string) => {
    const config = providerConfigs[providerId]
    console.log(`Fetching schema for ${providerId} with config:`, config)
    // Here you would typically fetch the schema and RLS policies from the selected provider
  }

  const handleConfigSave = (providerId: string) => {
    if (providerId === "supabase") {
      dispatch(
        setSupabaseConfig({
          url: providerConfigs.supabase.url,
          anonKey: providerConfigs.supabase.key,
        }),
      )
    }
    console.log(`Saving config for ${providerId}:`, providerConfigs[providerId])
  }

  return (
    <div className="h-screen flex">
      {/* Left Panel: SQL & RLS Input */}
      <div className="w-1/2 p-4 overflow-y-auto border-r">
        <div className="mb-6 flex flex-wrap gap-2">
          {databaseProviders.map((provider) => (
            <Popover key={provider.id}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={`h-9 px-4 py-2 rounded-full flex items-center gap-2 transition-colors ${activeProvider === provider.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                    }`}
                  onClick={() => setActiveProvider(provider.id)}
                >
                  <Image
                    src={provider.logo || "/placeholder.svg"}
                    alt={provider.name}
                    width={16}
                    height={16}
                    className="rounded-full"
                  />
                  <span className="text-sm font-medium">{provider.name}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium leading-none">Connect to {provider.name}</h4>
                    <p className="text-sm text-muted-foreground">Enter your credentials to connect</p>
                  </div>
                  <div className="grid gap-2">
                    <div className="grid gap-1">
                      <Label htmlFor={`${provider.id}-url`}>Project URL</Label>
                      <Input
                        id={`${provider.id}-url`}
                        placeholder={`${provider.name} project URL`}
                        value={providerConfigs[provider.id]?.url || ""}
                        onChange={(e) =>
                          setProviderConfigs((prev) => ({
                            ...prev,
                            [provider.id]: { ...prev[provider.id], url: e.target.value },
                          }))
                        }
                      />
                    </div>
                    <div className="grid gap-1">
                      <Label htmlFor={`${provider.id}-key`}>Anon Key</Label>
                      <Input
                        id={`${provider.id}-key`}
                        type="password"
                        placeholder={`${provider.name} anon key`}
                        value={providerConfigs[provider.id]?.key || ""}
                        onChange={(e) =>
                          setProviderConfigs((prev) => ({
                            ...prev,
                            [provider.id]: { ...prev[provider.id], key: e.target.value },
                          }))
                        }
                      />
                    </div>
                  </div>
                  <Button onClick={() => handleConfigSave(provider.id)} className="w-full">
                    Save
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          ))}
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="schema">Database Schema</Label>
            <Textarea
              id="schema"
              value={schema}
              onChange={(e) => dispatch(setSchema(e.target.value))}
              placeholder="CREATE TABLE users (...);"
              className="mt-1 h-[200px] font-mono"
            />
          </div>
          <div>
            <Label htmlFor="rls">RLS Policies</Label>
            <Textarea
              id="rls"
              value={rlsPolicies}
              onChange={(e) => dispatch(setRLSPolicies(e.target.value))}
              placeholder="CREATE POLICY..."
              className="mt-1 h-[200px] font-mono"
            />
          </div>
          <div>
            <Label htmlFor="rls">Additional Context</Label>
            <Textarea
              id="additional-context"
              value={additionalContext}
              onChange={(e) => dispatch(setAdditionalContext(e.target.value))}
              placeholder="ADDITIONAL CONTEXT..."
              className="mt-1 h-[200px] font-mono"
            />
          </div>
        </div>
      </div>

      {/* Right Panel: Tests & Visualization */}
      <div className="w-1/2 p-4">
        <Tabs defaultValue="tests" className="h-full flex flex-col">
          <TabsList>
            <TabsTrigger value="tests">Tests</TabsTrigger>
            <TabsTrigger value="visualize">Visualize</TabsTrigger>
          </TabsList>

          <TabsContent value="tests" className="flex-1">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Security Tests</h2>
                <Button onClick={generateTests} disabled={isGenerating}>
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    "Generate Tests"
                  )}
                </Button>
              </div>

              <ScrollArea className="h-[calc(100vh-200px)]">
                <div className="space-y-4 pr-4">
                  {testCategories.map((category) => (
                    <Card key={category.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold">{category.name}</h3>
                            <p className="text-sm text-muted-foreground">{category.description}</p>
                          </div>
                          <Button size="sm" onClick={() => runTestSuite(category.id)}>
                            <Play className="h-4 w-4 mr-2" />
                            Run Suite
                          </Button>
                        </div>

                        <div className="space-y-2">
                          {category.tests.map((test) => (
                            <Collapsible
                              key={test.id}
                              open={expandedTests.includes(test.id)}
                              onOpenChange={() => toggleTest(test.id)}
                            >
                              <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted rounded-md">
                                <div className="flex items-center gap-2">
                                  {/* {getStatusIcon(test.status)} */}
                                  <span>{test.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Info className="h-4 w-4 text-muted-foreground" />
                                  {expandedTests.includes(test.id) ? (
                                    <ChevronUp className="h-4 w-4" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4" />
                                  )}
                                </div>
                              </CollapsibleTrigger>
                              <CollapsibleContent className="p-2 mt-2 space-y-2">
                                <p className="text-sm text-muted-foreground">{test.description}</p>
                                {test.query && (
                                  <div className="bg-muted p-2 rounded-md">
                                    <pre className="text-xs overflow-x-auto whitespace-pre-wrap">{test.query}</pre>
                                  </div>
                                )}
                                {test.expected && (
                                  <div className="text-xs text-muted-foreground mt-2">
                                    {/* <span className="font-medium">Expected Result:</span> {test.expected} */}
                                  </div>
                                )}
                                <Button size="sm" onClick={() => runTest(test.id)}>
                                  <Play className="h-3 w-3 mr-2" />
                                  Run Test
                                </Button>
                              </CollapsibleContent>
                            </Collapsible>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="visualize" className="flex-1">
            <div className="h-full border rounded-md">
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                fitView
              >
                <Background />
                <Controls />
              </ReactFlow>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}