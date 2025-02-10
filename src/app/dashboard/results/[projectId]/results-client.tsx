"use client";

import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle, XCircle, MinusCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { saveSolution } from "@/lib/actions/tests";
import { TestCase, updateTestSolution } from "@/lib/testsSlice";

interface ResultsClientProps {
  projectId: string;
}

export function ResultsClient({ projectId }: ResultsClientProps) {
  const router = useRouter();
  const dispatch = useDispatch();
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

  const handleGenerateSolution = async (test: TestCase) => {
    setLoadingSolutions(prev => ({ ...prev, [test.id]: true }));
    try {
      const project = selectedProject;
      if (!project) {
        throw new Error('No project selected');
      }

      // Log the full test object and its ID
      console.log('Test object:', {
        id: test.id,
        name: test.name,
        categoryId: test.categoryId,
        fullTest: test
      });

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
      console.log('API response:', data);
      
      if (!data.success || !data.solution) {
        throw new Error(data.error || 'Failed to generate solution');
      }

      // Log before saving
      console.log('About to save solution. Test ID:', test.id);
      const saveResult = await saveSolution(test.id, data.solution);
      console.log('Save result:', saveResult);

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
          solution: data.solution
        }));
      }
      
    } catch (error) {
      console.error('Error in handleGenerateSolution:', error);
    } finally {
      setLoadingSolutions(prev => ({ ...prev, [test.id]: false }));
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-5xl">
      <div className="mb-8 space-y-4">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Schema
        </Button>
        
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
                            <div className="bg-green-50 p-3 rounded-md">
                              <h4 className="text-sm font-medium text-green-900 mb-2">
                                Recommended Fix:
                              </h4>
                              <pre className="text-xs text-green-800 whitespace-pre-wrap">
                                {test.solution}
                              </pre>
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
    </div>
  );
} 