"use client";

import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle, XCircle, MinusCircle, Copy, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { saveSolution, loadTestResults } from "@/lib/actions/tests";
import { TestCase, updateTestSolution, setTestCategories } from "@/lib/testsSlice";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface ResultsClientProps {
  projectId: string;
}

// interface Solution {
//   description: string;
//   query: string;
//   schema?: string;
// }

// interface TestSolution {
//   description: string;
//   query: string;
// }

// interface APIResponse {
//   success: boolean;
//   error?: string;
//   solution?: TestSolution;
// }

export function ResultsClient({ projectId }: ResultsClientProps) {
  const router = useRouter();
  const dispatch = useDispatch();
  const [isFixing, setIsFixing] = useState(false);
  const testCategories = useSelector((state: RootState) => state.tests.categories);
  const selectedProject = useSelector((state: RootState) => 
    state.project.projects.find(p => p.id === projectId)
  );

  const totalTests = testCategories.reduce(
    (acc, category) => acc + category.tests.length,
    0
  );
  
  const passedTests = testCategories.reduce(
    (acc, category) => 
      acc + category.tests.filter(test => test.result?.status === "passed").length,
    0
  );

  const notRunTests = testCategories.reduce(
    (acc, category) => 
      acc + category.tests.filter(test => !test.result?.status).length,
    0
  );

  const failedTests = totalTests - passedTests - notRunTests;

  const [loadingSolutions, setLoadingSolutions] = useState<Record<string, boolean>>({});
  const [showRLSDialog, setShowRLSDialog] = useState(false);
  const [newRLSSchema, setNewRLSSchema] = useState('');
  const [hasCopied, setHasCopied] = useState(false);
  const [solutionDescription, setSolutionDescription] = useState('');

  useEffect(() => {
    async function loadTests() {
      if (!projectId) return;
      
      const result = await loadTestResults(projectId);
      if (result.success) {
        dispatch(setTestCategories(result.categories));
      }
    }

    loadTests();
  }, [projectId, dispatch]);

  const handleGenerateSolution = async (test: TestCase) => {
    setLoadingSolutions(prev => ({ ...prev, [test.id]: true }));
    try {
      const project = selectedProject;
      if (!project) {
        throw new Error('No project selected');
      }

      const response = await fetch('/api/generate-solution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          test,
          dbSchema: project.dbSchema,
          currentRLS: project.rlsSchema
        })
      });

      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate solution');
      }

      if (!data.solution) {
        throw new Error('No solution received from API');
      }

      // Parse the solution if it's a string
      const solutionData = typeof data.solution === 'string' 
        ? JSON.parse(data.solution) 
        : data.solution;

      // Save solution to the database
      const saveResult = await saveSolution(test.id, JSON.stringify(solutionData));
      
      if (!saveResult.success) {
        throw new Error(saveResult.error || 'Failed to save solution');
      }

      // Update Redux store
      const category = testCategories.find(cat => 
        cat.tests.some(t => t.id === test.id)
      );
      
      if (category) {
        dispatch(updateTestSolution({
          categoryId: category.id,
          testId: test.id,
          solution: solutionData
        }));
      }
      
    } catch (error) {
      console.error('Error in handleGenerateSolution:', error);
    } finally {
      setLoadingSolutions(prev => ({ ...prev, [test.id]: false }));
    }
  };

  const handleFixAllTests = async () => {
    setIsFixing(true);
    try {
      let allTests: TestCase[] = [];
      testCategories.forEach(category => {
        allTests = allTests.concat(category.tests);
      });
      const failedTests = allTests.filter(test => test.result?.status === "failed");
      const passedTests = allTests.filter(test => test.result?.status === "passed");

      if (!selectedProject) throw new Error("No project selected");

      const payload = {
        projectId: selectedProject.id,
        failedTests,
        passedTests,
        dbSchema: selectedProject.dbSchema,
        currentRLS: selectedProject.rlsSchema,
        projectDescription: selectedProject.additionalContext || ""
      };

      const response = await fetch("/api/fix-all-tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to fix tests");
      }

      // Set both schema and description
      setNewRLSSchema(data.solution);
      setSolutionDescription(data.description);
      setShowRLSDialog(true);
    } catch (error) {
      console.error("Error fixing all tests:", error);
    } finally {
      setIsFixing(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(newRLSSchema);
    setHasCopied(true);
    setTimeout(() => {
      setHasCopied(false);
    }, 2000);
  };

  return (
    <div className="container mx-auto py-8 max-w-5xl">
      <div className="flex justify-between items-center mb-4">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Schema
        </Button>
        <Button
          variant="default"
          onClick={handleFixAllTests}
          disabled={isFixing}
          className="bg-green-500 hover:bg-green-600 flex items-center"
        >
          {isFixing ? (
            <>
              <svg className="animate-spin h-5 w-5 mr-2 text-white" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeOpacity="0.25" />
                <path
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8z"
                  className="opacity-75"
                />
              </svg>
              Fixing...
            </>
          ) : (
            "Fix All Tests"
          )}
        </Button>
      </div>

      <div className="mb-8 space-y-4">
        <h1 className="text-3xl font-bold">Security Test Report</h1>
        <p className="text-muted-foreground">
          Project: {selectedProject?.name}
        </p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{totalTests}</div>
            <p className="text-muted-foreground">Total Tests</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{passedTests}</div>
            <p className="text-muted-foreground">Passed Tests</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">{failedTests}</div>
            <p className="text-muted-foreground">Failed Tests</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-gray-400">{notRunTests}</div>
            <p className="text-muted-foreground">Not Run</p>
          </CardContent>
        </Card>
      </div>

      <ScrollArea className="h-[calc(100vh-300px)]">
        <div className="space-y-6">
          {testCategories.map((category) => (
            <Card key={category.id}>
              <CardHeader>
                <CardTitle>{category.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {category.tests.map((test) => (
                    <div
                      key={test.id}
                      className="border rounded-lg p-4 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {!test.result?.status ? (
                            <MinusCircle className="h-5 w-5 text-gray-400" />
                          ) : test.result.status === "passed" ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500" />
                          )}
                          <h3 className="font-medium">{test.name}</h3>
                        </div>
                        <Badge
                          variant={
                            !test.result?.status 
                              ? "secondary"
                              : test.result.status === "passed" 
                                ? "default" 
                                : "destructive"
                          }
                        >
                          {test.result?.status || "Not Run"}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground">
                        {test.description}
                      </p>
                      
                      {test.result?.error && (
                        <div className="bg-red-50 p-3 rounded-md">
                          <pre className="text-xs text-red-600 whitespace-pre-wrap">
                            {JSON.stringify(test.result.error, null, 2)}
                          </pre>
                        </div>
                      )}

                      {test.result?.status === "failed" && (
                        <div className="mt-4">
                          {test.solution ? (
                            <div className="space-y-4">
                              <div className="bg-green-50 p-4 rounded-md">
                                <h4 className="text-sm font-medium text-green-900 mb-2">
                                  Recommended Fix:
                                </h4>
                                <div className="text-sm text-green-800 mb-4">
                                  {typeof test.solution === 'string' 
                                    ? JSON.parse(test.solution).description 
                                    : test.solution.description}
                                </div>
                                <div className="bg-green-100 p-3 rounded">
                                  <h5 className="text-sm font-medium text-green-900 mb-2">
                                    SQL Query:
                                  </h5>
                                  <pre className="text-xs text-green-800 whitespace-pre-wrap">
                                    {typeof test.solution === 'string' 
                                      ? JSON.parse(test.solution).query 
                                      : test.solution.query}
                                  </pre>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleGenerateSolution(test)}
                              disabled={loadingSolutions[test.id]}
                            >
                              {loadingSolutions[test.id] ? (
                                <>Generating Solution...</>
                              ) : (
                                <>Generate Recommended Fix</>
                              )}
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>

      <Dialog open={showRLSDialog} onOpenChange={setShowRLSDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Updated RLS Policies</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-green-50 p-4 rounded-md">
              <h4 className="text-sm font-medium text-green-900 mb-2">
                Changes Made:
              </h4>
              <p className="text-sm text-green-800 whitespace-pre-wrap">
                {solutionDescription}
              </p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-2">
                Updated RLS Policies:
              </h4>
              <Textarea
                value={newRLSSchema}
                readOnly
                className="h-[400px] font-mono text-sm"
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button
                onClick={handleCopy}
                variant="outline"
                className="gap-2"
              >
                {hasCopied ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy to Clipboard
                  </>
                )}
              </Button>
              <Button
                onClick={() => {
                  router.push(`/dashboard/schema/${projectId}`);
                }}
              >
                Go to Schema Editor
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 