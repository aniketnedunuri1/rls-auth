// src/pages/SchemaPage.tsx
"use client";

import { useCallback, useState, useEffect, useMemo } from "react";
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
import { Info, ChevronDown, ChevronUp, Play, Loader2, FileText } from "lucide-react";
import ReactFlow, { Controls, Background, useNodesState, useEdgesState } from "reactflow";
import "reactflow/dist/style.css";
import { useDispatch, useSelector } from "react-redux";
import { setSchema, setRLSPolicies, setAdditionalContext, setSupabaseUrl, setSupabaseAnonKey } from "@/lib/projectSlice";
import { setTestCategories, updateTestCaseResult, updateTestQuery } from "@/lib/testsSlice";
import type { RootState } from "@/lib/store";
import Image from "next/image";
import RoleSelector from "@/components/role-selector";
import { updateProjectAction } from "@/lib/actions/project";
import { useRouter } from "next/navigation";
import { loadTestResults, saveTestResults } from "@/lib/actions/tests";

interface TestExpectedOutcome {
  data: unknown;
  error: unknown;
  status?: number;
  statusText?: string;
}

// interface TestCase {
//   id: string
//   name: string
//   description: string
//   query?: string
//   expected?: TestExpectedOutcome
//   role: 'ANONYMOUS' | 'AUTHENTICATED'
// }

// interface TestCategory {
//   id: string
//   name: string
//   description: string
//   tests: TestCase[]
// }

interface DatabaseProvider {
  id: string
  name: string
  logo: string
}

interface TestResult {
    status: 'passed' | 'failed';
    data: unknown;
    error: unknown;
    response: unknown;
}

const databaseProviders: DatabaseProvider[] = [
  { id: "supabase", name: "Supabase", logo: "/logos/supabase.svg" },
  { id: "firebase", name: "Firebase", logo: "/logos/firebase.svg" },
  { id: "aws", name: "AWS", logo: "/logos/aws.png" },
  { id: "azure", name: "Azure", logo: "/placeholder.svg?height=24&width=24" },
]

export default function SchemaPage() {
  const dispatch = useDispatch()
  const testCategories = useSelector((state: RootState) => state.tests.categories);
  const selectedProject = useSelector((state: RootState) => state.project.selectedProject);
  const [nodes, onNodesChange] = useNodesState([])
  const [edges, onEdgesChange] = useEdgesState([])
  const [expandedTests, setExpandedTests] = useState<string[]>([])
  const [runningTests, setRunningTests] = useState<Set<string>>(new Set());
  const [runningSuites, setRunningSuites] = useState<Set<string>>(new Set());
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeProvider, setActiveProvider] = useState<string | null>(null)
  const [selectedRole, setSelectedRole] = useState<'ANONYMOUS' | 'AUTHENTICATED'>('ANONYMOUS');
  const router = useRouter()
  const [editedQueries, setEditedQueries] = useState<Record<string, string>>({});

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

  const debouncedUpdateConfig = useCallback(
    debounce(async (projectId: string, supabaseUrl: string | undefined, supabaseAnonKey: string | undefined) => {
      try {
        const result = await updateProjectAction({
          projectId,
          dbSchema: selectedProject?.dbSchema || '',
          rlsSchema: selectedProject?.rlsSchema || '',
          additionalContext: selectedProject?.additionalContext || '',
          supabaseUrl,
          supabaseAnonKey,
        });

        if (!result.success) {
          console.error("Failed to update project:", result.error);
        }
      } catch (error) {
        console.error("Error updating project:", error);
      }
    }, 1000),
    [selectedProject]
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
        console.log('Generating tests for role:', selectedRole);
        const endpoint = selectedRole === 'ANONYMOUS' 
            ? "/api/generate-query/anon"
            : "/api/generate-query/authenticated-anon";

        const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                schema: selectedProject.dbSchema,
                rlsPolicies: selectedProject.rlsSchema,
                additionalContext: selectedProject.additionalContext
            }),
        });

        if (!response.ok) {
            throw new Error(`Request failed`);
        }

        const data = await response.json();
        console.log('Received test data:', data.result?.test_categories);
        
        // Ensure each test has required properties
        const categoriesWithRole = data.result?.test_categories.map((category: any) => ({
            ...category,
            tests: category.tests.map((test: any) => ({
                ...test,
                id: test.id || crypto.randomUUID(), // Ensure each test has an ID
                role: selectedRole,
                categoryId: category.id,
                query: test.query || '',
                expected: test.expected || null
            }))
        }));

        console.log('Saving categories:', categoriesWithRole);

        // Save new tests to database first
        const saveResult = await saveTestResults({
            projectId: selectedProject.id,
            categories: categoriesWithRole
        });

        if (!saveResult.success) {
            console.error('Failed to save tests:', saveResult.error);
            return;
        }

        // After successful save, load all tests from database
        const loadResult = await loadTestResults(selectedProject.id);
        if (loadResult.success) {
            dispatch(setTestCategories(loadResult.categories));
        }

    } catch (error) {
        console.error("Error generating tests:", error);
    } finally {
        setIsGenerating(false);
    }
  };

  const compareResults = (expected: TestExpectedOutcome | undefined, actual: any, query: string): boolean => {
    if (!expected) {
        return false;
    }

    console.log('Comparing results:', { expected, actual, query });

    // Reject invalid tests
    if (
        query.includes('uuid') || 
        query.includes('some-') || 
        query.includes('-id') ||
        query.includes('non-matching') ||
        query.includes('is_public')
    ) {
        console.log('Invalid test detected:', {
            reason: 'Contains invalid references or non-existent columns',
            query
        });
        return false;
    }

    const isSelectQuery = query.includes('.select(');
    const isInsertQuery = query.includes('.insert(');
    const isUpdateQuery = query.includes('.update(');
    const isDeleteQuery = query.includes('.delete(');

    // For SELECT queries
    if (isSelectQuery) {
        // When access is blocked or no data is available
        if (Array.isArray(expected.data) && expected.data.length === 0) {
            return (
                // Accept both empty array and null for data
                (actual.error === null && Array.isArray(actual.data) && actual.data.length === 0) ||
                (actual.error === null && actual.data === null)
            );
        }
    }

    // For UPDATE/DELETE queries
    if (isUpdateQuery || isDeleteQuery) {
        // Check if the query has a WHERE clause
        const hasWhereClause = query.includes('.eq(') || 
                              query.includes('.match(') || 
                              query.includes('.filter(') ||
                              query.includes('.where(');
        
        if (!hasWhereClause) {
            // Should expect a "missing WHERE clause" error
            return actual.error?.code === "21000" ||  // Missing WHERE clause
                   actual.error?.message?.includes("requires a WHERE clause");
        }

        // If we expect an RLS error
        if (expected.error?.code === "42501") {
            return (
                actual.error?.code === "42501" || // RLS violation
                actual.error?.code === "21000" || // Missing WHERE clause
                (actual.error === null && actual.data === null) // No rows affected
            );
        }
    }

    // For INSERT queries
    if (isInsertQuery) {
        if (expected.error?.code === "42501") {
            return (
                actual.error?.code === "42501" || // Explicit RLS violation
                (actual.error === null && actual.data === null) // Implicit denial
            );
        }

    }

    // Default comparison for other cases
    if (expected.error) {
        return actual.error?.code === expected.error?.code;
    }

    return !actual.error && 
           (actual.data === null || 
            (Array.isArray(actual.data) && actual.data.length === 0));
  };

  const runTest = async (testId: string, userQuery: string | undefined) => {
    if (!selectedProject?.id || !userQuery) {
        console.log('Missing required data:', { projectId: selectedProject?.id, userQuery });
        return;
    }

    if (!selectedProject.supabaseUrl || !selectedProject.supabaseAnonKey) {
        console.log('Missing Supabase configuration');
        return;
    }
  
    // Set loading state
    setRunningTests(prev => new Set(prev).add(testId));

    try {
        const queryToRun = editedQueries[testId] ?? userQuery;
        
        // Use role-specific endpoint
        const endpoint = selectedRole === 'ANONYMOUS'
            ? "/api/run-test/anon"
            : "/api/run-test/authenticated-anon";

        console.log('Sending request to:', endpoint, {
            query: queryToRun,
            url: selectedProject.supabaseUrl,
            hasAnonKey: !!selectedProject.supabaseAnonKey
        });

        const response = await fetch(endpoint, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "Pragma": "no-cache"
            },
            cache: 'no-store',
            body: JSON.stringify({
                query: queryToRun,
                url: selectedProject.supabaseUrl,
                anonKey: selectedProject.supabaseAnonKey
            }),
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }
  
        const result = await response.json();
        console.log('Test result:', result);

        const categoryId = testCategories.find((category) =>
            category.tests.some((test) => test.id === testId)
        )?.id;

        if (categoryId) {
            const test = testCategories
                .find(cat => cat.id === categoryId)
                ?.tests.find(t => t.id === testId);

            if (test) {
                const passed = compareResults(test.expected as TestExpectedOutcome, result, queryToRun);
                
                const testResult: TestResult = {
                    status: passed ? "passed" : "failed",
                    data: result.data,
                    error: result.error,
                    response: result
                };

                // Update Redux
                dispatch(updateTestCaseResult({
                    categoryId,
                    testCaseId: testId,
                    result: testResult
                }));

                // Save the entire test state to database
                await saveTestResults({
                    projectId: selectedProject.id,
                    categories: testCategories.map(cat => ({
                        ...cat,
                        tests: cat.tests.map(t => 
                            t.id === testId 
                                ? { ...t, result: testResult }
                                : t
                        )
                    }))
                });
            }
        }
    } catch (error) {
        console.error("Error running test:", error);
    } finally {
        // Clear loading state
        setRunningTests(prev => {
            const next = new Set(prev);
            next.delete(testId);
            return next;
        });
    }
  };

  const runTestSuite = async (categoryId: string) => {
    const category = testCategories.find(cat => cat.id === categoryId);
    if (!category) return;

    // Set loading state for the suite
    setRunningSuites(prev => new Set(prev).add(categoryId));

    try {
        for (const test of category.tests) {
            if (test.query) {
                await runTest(test.id, test.query);
            }
        }
    } finally {
        // Clear loading state
        setRunningSuites(prev => {
            const next = new Set(prev);
            next.delete(categoryId);
            return next;
        });
    }
  };

  const handleQueryEdit = useCallback(
    async (categoryId: string, testId: string, newQuery: string) => {
      if (!selectedProject?.id) return;

      try {
        // Update Redux state
        dispatch(updateTestQuery({
          categoryId,
          testId,
          query: newQuery
        }));

        // Update local state
        setEditedQueries(prev => ({
          ...prev,
          [testId]: newQuery
        }));

        // Save to database - make sure we're using the updated categories
        const updatedCategories = testCategories.map(category => ({
          ...category,
          tests: category.tests.map(test => 
            test.id === testId 
              ? { ...test, query: newQuery }
              : test
          )
        }));

        const result = await saveTestResults({
          projectId: selectedProject.id,
          categories: updatedCategories
        });

        if (!result.success) {
          console.error("Failed to save test query:", result.error);
          // Optionally revert changes if save failed
        }
      } catch (error) {
        console.error("Error saving test query:", error);
      }
    },
    [dispatch, selectedProject, testCategories]
  );

  useEffect(() => {
    async function loadSavedTests() {
        if (!selectedProject?.id) {
            // Clear tests when no project is selected
            dispatch(setTestCategories([]));
            return;
        }
        
        const result = await loadTestResults(selectedProject.id);
        
        if (result.success) {
            // Ensure we're setting an empty array if no categories
            dispatch(setTestCategories(result.categories || []));
        } else {
            // Clear tests on error
            dispatch(setTestCategories([]));
            console.error('Failed to load test results:', result.error);
        }
    }
    
    loadSavedTests();
  }, [selectedProject?.id, dispatch]);

  // Initialize editedQueries when tests are loaded
  useEffect(() => {
    if (testCategories.length > 0) {
      const initialQueries: Record<string, string> = {};
      testCategories.forEach(category => {
        category.tests.forEach(test => {
          if (test.query) {
            initialQueries[test.id] = test.query;
          }
        });
      });
      setEditedQueries(initialQueries);
    }
  }, [testCategories]);

  // Filter tests based on selected role
  const filteredTestCategories = useMemo(() => {
    return testCategories.map(category => ({
      ...category,
      tests: category.tests.filter(test => 
        test.role === selectedRole
      )
    })).filter(category => category.tests.length > 0);
  }, [testCategories, selectedRole]);

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
                    {provider.id === 'supabase' && (
                      <div className="grid gap-1">
                        <Label htmlFor="supabase-url">Project URL</Label>
                        <Input
                          id="supabase-url"
                          placeholder="Supabase project URL"
                          value={selectedProject?.supabaseUrl || ""}
                          onChange={(e) => {
                            if (!selectedProject?.id) return;
                            dispatch(setSupabaseUrl({
                              projectId: selectedProject.id,
                              value: e.target.value
                            }));
                            debouncedUpdateConfig(
                              selectedProject.id,
                              e.target.value,
                              selectedProject.supabaseAnonKey || ""
                            );
                          }}
                        />
                      </div>
                    )}
                    {provider.id === 'supabase' && (
                      <div className="grid gap-1">
                        <Label htmlFor="supabase-key">Anon Key</Label>
                        <Input
                          id="supabase-key"
                          type="password"
                          placeholder="Supabase anon key"
                          value={selectedProject?.supabaseAnonKey || ""}
                          onChange={(e) => {
                            if (!selectedProject?.id) return;
                            dispatch(setSupabaseAnonKey({
                              projectId: selectedProject.id,
                              value: e.target.value
                            }));
                            debouncedUpdateConfig(
                              selectedProject.id,
                              selectedProject.supabaseUrl || "",
                              e.target.value
                            );
                          }}
                        />
                      </div>
                    )}
                  </div>
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
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <h2 className="text-lg font-semibold">Security Tests</h2>
                  <RoleSelector role={selectedRole} setRole={setSelectedRole} />
                </div>
                <div className="flex gap-2">
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
                      "Generate Tests"
                    )}
                  </Button>
                  <Button
                    onClick={() => router.push(`/dashboard/results/${selectedProject?.id}`)}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    View Report
                  </Button>
                </div>
              </div>

              <ScrollArea className="h-[calc(100vh-200px)]">
                <div className="space-y-4 pr-4">
                  {filteredTestCategories.map((category) => (
                    <Card key={category.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-semibold">{category.name}</h3>
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                selectedRole === 'ANONYMOUS' 
                                  ? 'bg-gray-100 text-gray-700' 
                                  : 'bg-blue-100 text-blue-700'
                              }`}>
                                {selectedRole === 'ANONYMOUS' ? 'Anon' : 'Auth'}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">{category.description}</p>
                          </div>
                          <Button 
                            size="sm" 
                            onClick={() => runTestSuite(category.id)}
                            disabled={runningSuites.has(category.id)}
                          >
                            {runningSuites.has(category.id) ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Running Suite...
                                </>
                            ) : (
                                <>
                                    <Play className="h-4 w-4 mr-2" />
                                    Run Suite
                                </>
                            )}
                          </Button>
                        </div>

                        <div className="space-y-2">
                          {category.tests.map((test) => (
                            <Collapsible
                              key={test.id}
                              open={expandedTests.includes(test.id)}
                              onOpenChange={() => toggleTest(test.id)}
                              className={`${
                                  test.result 
                                      ? test.result.status === 'passed'
                                          ? 'border-2 border-green-500'
                                          : 'border-2 border-red-500'
                                      : 'border border-gray-200'
                              } rounded-md mb-2`}
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
                                    <Label className="text-xs font-semibold">Query</Label>
                                    <Textarea
                                      value={editedQueries[test.id] ?? test.query}
                                      onChange={(e) => {
                                        const newQuery = e.target.value;
                                        // Update local state
                                        setEditedQueries(prev => ({
                                          ...prev,
                                          [test.id]: newQuery
                                        }));
                                        // Update Redux state immediately
                                        dispatch(updateTestQuery({
                                          categoryId: category.id,
                                          testId: test.id,
                                          query: newQuery
                                        }));
                                      }}
                                      onBlur={async () => {
                                        const editedQuery = editedQueries[test.id];
                                        if (editedQuery && editedQuery !== test.query) {
                                          await handleQueryEdit(category.id, test.id, editedQuery);
                                        }
                                      }}
                                      className="mt-1 font-mono text-xs"
                                      placeholder="Edit query..."
                                    />
                                  </div>
                                )}

                                {test.expected && (
                                  <div className="bg-muted p-2 rounded-md">
                                    <Label className="text-xs font-semibold">Expected Result</Label>
                                    <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
                                      {JSON.stringify(test.expected, null, 2)}
                                    </pre>
                                  </div>
                                )}

                                {test.result && (
                                  <div className="mt-2 space-y-2">
                                    <div className={`text-sm font-medium ${
                                      test.result.status === 'passed' ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                      Status: {test.result.status}
                                    </div>
                                    <div className="bg-muted p-2 rounded-md">
                                      <Label className="text-xs font-semibold">Actual Result</Label>
                                      {test.result.response && (
                                        <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
                                          {JSON.stringify(test.result.response, null, 2)}
                                        </pre>
                                      )}
                                      {test.result.error && (
                                        <pre className="text-xs text-red-600 overflow-x-auto whitespace-pre-wrap">
                                          {JSON.stringify(test.result.error, null, 2)}
                                        </pre>
                                      )}
                                    </div>
                                  </div>
                                )}

                                <Button 
                                  size="sm" 
                                  onClick={async () => {
                                    const currentQuery = editedQueries[test.id] ?? test.query;
                                    await runTest(test.id, currentQuery);
                                  }}
                                  disabled={runningTests.has(test.id)}
                                >
                                  {runningTests.has(test.id) ? (
                                    <>
                                      <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                                      Running...
                                    </>
                                  ) : (
                                    <>
                                      <Play className="h-3 w-4 mr-2" />
                                      Run Test
                                    </>
                                  )}
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

