"use client";

import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";

interface ResultsClientProps {
  projectId: string;
}

export function ResultsClient({ projectId }: ResultsClientProps) {
  const router = useRouter();
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

      <div className="grid grid-cols-3 gap-4 mb-8">
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
            <div className="text-2xl font-bold text-red-600">
              {totalTests - passedTests}
            </div>
            <p className="text-muted-foreground">Failed Tests</p>
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
                          {test.result?.status === "passed" ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500" />
                          )}
                          <h3 className="font-medium">{test.name}</h3>
                        </div>
                        <Badge
                          variant={test.result?.status === "passed" ? "default" : "destructive"}
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