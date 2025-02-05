// src/pages/SchemaPage.tsx
"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
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
import { setSchema, setRLSPolicies, setAdditionalContext, setSupabaseConfig } from "@/lib/schemaSlice";
import { setTestCategories, updateTestCaseResult } from "@/lib/testsSlice";
import type { RootState } from "@/lib/store";
import Image from "next/image";

export default function SchemaPage() {
  const dispatch = useDispatch();
  const { schema, rlsPolicies, additionalContext, supabaseConfig } = useSelector(
    (state: RootState) => state.schema
  );
  const testsState = useSelector((state: RootState) => state.tests);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [expandedTests, setExpandedTests] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeProvider, setActiveProvider] = useState<string | null>(null);
  const [providerConfigs, setProviderConfigs] = useState<Record<string, { url: string; key: string }>>({
    supabase: { url: supabaseConfig.url, key: supabaseConfig.anonKey },
    firebase: { url: "", key: "" },
    aws: { url: "", key: "" },
    azure: { url: "", key: "" },
  });

  const testCategories = testsState.categories;

  const toggleTest = (testId: string) => {
    setExpandedTests((prev) =>
      prev.includes(testId) ? prev.filter((id) => id !== testId) : [...prev, testId]
    );
  };

  const generateTests = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/test-runner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schema,
          rlsPolicies,
          additionalContext,
        }),
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const data = await response.json();
      if (data.result && data.result.test_categories) {
        dispatch(setTestCategories(data.result.test_categories));
      }
    } catch (error) {
      console.error("Error calling /api/test-runner:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const runTest = async (categoryId: string, testId: string, query: string) => {
    try {
      const response = await fetch("/api/run-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          supabaseConfig, // { url, anonKey }
        }),
      });

      const result = await response.json();
      let status: "passed" | "failed" | "error" = "failed";
      if (result.status === 200 || result.status === 201) {
        status = "passed";
      }
      dispatch(
        updateTestCaseResult({
          categoryId,
          testCaseId: testId,
          result: { ...result, status },
        })
      );
    } catch (error) {
      console.error("Error running test:", error);
      dispatch(
        updateTestCaseResult({
          categoryId,
          testCaseId: testId,
          result: { status: "error", error: error instanceof Error ? error.message : "Unknown error" },
        })
      );
    }
  };

  const runTestSuite = async (categoryId: string, tests: any[]) => {
    for (const test of tests) {
      await runTest(categoryId, test.id, test.query);
    }
  };

  const handleProviderChange = (providerId: string) => {
    setActiveProvider(providerId);
  };

  const handleConfigChange = (providerId: string, field: "url" | "key", value: string) => {
    setProviderConfigs((prev) => ({
      ...prev,
      [providerId]: {
        ...prev[providerId],
        [field]: value,
      },
    }));
  };

  const fetchProviderSchema = (providerId: string) => {
    const config = providerConfigs[providerId];
    console.log(`Fetching schema for ${providerId} with config:`, config);
    // Fetch schema/rls if needed.
  };

  const handleConfigSave = (providerId: string) => {
    if (providerId === "supabase") {
      dispatch(
        setSupabaseConfig({
          url: providerConfigs.supabase.url,
          anonKey: providerConfigs.supabase.key,
        })
      );
    }
    console.log(`Saving config for ${providerId}:`, providerConfigs[providerId]);
  };

  return (
    <div className="h-screen flex">
      {/* Left Panel: Provider Config and Inputs */}
      <div className="w-1/2 p-4 overflow-y-auto border-r">
        <div className="mb-6 flex flex-wrap gap-2">
          {["supabase", "firebase", "aws", "azure"].map((provider) => (
            <Popover key={provider}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={`h-9 px-4 py-2 rounded-full flex items-center gap-2 transition-colors ${
                    activeProvider === provider ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  }`}
                  onClick={() => handleProviderChange(provider)}
                >
                  <Image
                    src={`/${provider}.svg`}
                    alt={provider}
                    width={16}
                    height={16}
                    className="rounded-full"
                  />
                  <span className="text-sm font-medium">{provider.charAt(0).toUpperCase() + provider.slice(1)}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium leading-none">Connect to {provider.charAt(0).toUpperCase() + provider.slice(1)}</h4>
                    <p className="text-sm text-muted-foreground">Enter your credentials to connect</p>
                  </div>
                  <div className="grid gap-2">
                    <div className="grid gap-1">
                      <Label htmlFor={`${provider}-url`}>Project URL</Label>
                      <Input
                        id={`${provider}-url`}
                        placeholder={`${provider} project URL`}
                        value={providerConfigs[provider]?.url || ""}
                        onChange={(e) =>
                          handleConfigChange(provider, "url", e.target.value)
                        }
                      />
                    </div>
                    <div className="grid gap-1">
                      <Label htmlFor={`${provider}-key`}>Anon Key</Label>
                      <Input
                        id={`${provider}-key`}
                        type="password"
                        placeholder={`${provider} anon key`}
                        value={providerConfigs[provider]?.key || ""}
                        onChange={(e) =>
                          handleConfigChange(provider, "key", e.target.value)
                        }
                      />
                    </div>
                  </div>
                  <Button onClick={() => handleConfigSave(provider)} className="w-full">
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
            <Label htmlFor="additional-context">Additional Context</Label>
            <Textarea
              id="additional-context"
              value={additionalContext}
              onChange={(e) => dispatch(setAdditionalContext(e.target.value))}
              placeholder="Additional context..."
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
                          <Button size="sm" onClick={() => runTestSuite(category.id, category.tests)}>
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
                                    <pre className="whitespace-pre-wrap">{JSON.stringify(test.expected, null, 2)}</pre>
                                  </div>
                                )}
                                <Button size="sm" onClick={() => runTest(category.id, test.id, test.query)}>
                                  <Play className="h-3 w-3 mr-2" />
                                  Run Test
                                </Button>
                                {test.result && (
                                  <div className="mt-2 text-xs">
                                    <pre>{JSON.stringify(test.result, null, 2)}</pre>
                                  </div>
                                )}
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
  );
}
