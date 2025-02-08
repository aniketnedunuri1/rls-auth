// src/pages/SchemaPage.tsx
"use client";

import { useCallback, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { debounce } from "lodash"
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Info, ChevronDown, ChevronUp, Play, Loader2 } from "lucide-react";
import ReactFlow, { Controls, Background, useNodesState, useEdgesState } from "reactflow";
import "reactflow/dist/style.css";
import { useDispatch, useSelector } from "react-redux";
import { setSupabaseConfig } from "@/lib/schemaSlice";
import { setSchema, setRLSPolicies, setAdditionalContext } from "@/lib/projectSlice";
import { setTestCategories, updateTestCaseResult } from "@/lib/testsSlice";
import type { RootState } from "@/lib/store";
import Image from "next/image";
import RoleSelector from "@/components/role-selector";
import { updateProjectAction } from "@/lib/actions/project";

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
  { id: "supabase", name: "Supabase", logo: "/logos/supabase.svg" },
  { id: "firebase", name: "Firebase", logo: "/logos/firebase.svg" },
  { id: "aws", name: "AWS", logo: "/logos/aws.png" },
  { id: "azure", name: "Azure", logo: "/placeholder.svg?height=24&width=24" },
]

export default function SchemaPage() {
  const dispatch = useDispatch()
  const selectedProject = useSelector((state: RootState) => state.project.selectedProject);
  const { schema, rlsPolicies, additionalContext, supabaseConfig } = useSelector((state: RootState) => state.schema)
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [expandedTests, setExpandedTests] = useState<string[]>([])
  const [testCategories, setTestCategories] = useState<TestCategory[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [activeProvider, setActiveProvider] = useState<string | null>(null)
  const [selectedRole, setSelectedRole] = useState("anon")
  const [providerConfigs, setProviderConfigs] = useState<Record<string, { url: string; key: string }>>({
    supabase: { url: supabaseConfig.url, key: supabaseConfig.anonKey },
    firebase: { url: "", key: "" },
    aws: { url: "", key: "" },
    azure: { url: "", key: "" },
  })

  const debouncedUpdate = useCallback(
    debounce(async (projectId: string, dbSchema: string, rlsSchema: string, additionalContext: string) => {
      try {
        const result = await updateProjectAction({
          projectId,
          dbSchema,
          rlsSchema,
          additionalContext
        });
        
        if (!result.success) {
          console.error("Failed to update project:", result.error);
        }
      } catch (error) {
        console.error("Error updating project:", error);
      }
    }, 1000),
    []
  );

  const handleSchemaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!selectedProject?.id) return;
    
    const value = e.target.value;
    // Update Redux
    dispatch(setSchema({ projectId: selectedProject.id, value }));
    // Update Database
    debouncedUpdate(
      selectedProject.id,
      value,
      selectedProject.rlsSchema || "",
      selectedProject.additionalContext || ""
    );
  };

  const handleRLSChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!selectedProject?.id) return;
    
    const value = e.target.value;
    dispatch(setRLSPolicies({ projectId: selectedProject.id, value }));
    debouncedUpdate(
      selectedProject.id,
      selectedProject.dbSchema || "",
      value,
      selectedProject.additionalContext || ""
    );
  };

  const handleContextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!selectedProject?.id) return;
    
    const value = e.target.value;
    dispatch(setAdditionalContext({ projectId: selectedProject.id, value }));
    debouncedUpdate(
      selectedProject.id,
      selectedProject.dbSchema || "",
      selectedProject.rlsSchema || "",
      value
    );
  };
  
  const toggleTest = (testId: string) => {
    setExpandedTests((prev) => (prev.includes(testId) ? prev.filter((id) => id !== testId) : [...prev, testId]))
  }

  const generateTests = async () => {
    if (!selectedProject) return;
    
    setIsGenerating(true);
    try {
      const response = await fetch("/api/test-runner", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          schema: selectedProject.dbSchema,
          rlsPolicies: selectedProject.rlsSchema,
          additionalContext: selectedProject.additionalContext
        }),
      });
  
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }
  
      const data = await response.json();
      if (data.result && data.result.test_categories) {
        setTestCategories(data.result.test_categories);
      }
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
                    src={provider.logo}
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
              value={selectedProject?.dbSchema || ""}
              onChange={handleSchemaChange}
              placeholder="CREATE TABLE users (...);"
              className="mt-1 h-[200px] font-mono"
            />
          </div>
          <div>
            <Label htmlFor="rls">RLS Policies</Label>
            <Textarea
              id="rls"
              value={selectedProject?.rlsSchema || ""}
              onChange={handleRLSChange}
              placeholder="CREATE POLICY..."
              className="mt-1 h-[200px] font-mono"
            />
          </div>
          <div>
            <Label htmlFor="rls">Additional Context</Label>
            <Textarea
              id="additional-context"
              value={selectedProject?.additionalContext || ""}
              onChange={handleContextChange}
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
              {/* <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Security Tests</h2>
                <RoleSelector role={selectedRole} setRole={setSelectedRole} />
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
              </div> */}
              <div className="flex justify-between items-center">
    <div className="flex items-center space-x-4">
      <h2 className="text-lg font-semibold">Security Tests</h2>
      <RoleSelector role={selectedRole} setRole={setSelectedRole} />
    </div>
    <Button
      onClick={generateTests}
      disabled={isGenerating}
      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-md"
    >
      {isGenerating ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          Generate Tests 
        </>
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
