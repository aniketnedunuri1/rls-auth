import { useState } from 'react';
import { TestResultDisplay } from './TestResultDisplay';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface TestCategoryProps {
  category: any; // Type this properly based on your category structure
  onRunTest: (testId: string, query: string) => void;
  runningTests: Set<string>;
  expandedTests: string[];
  onToggleTest: (testId: string) => void;
  editedQueries: Record<string, string>;
  onQueryEdit: (testId: string, query: string) => void;
}

export function TestCategory({
  category,
  onRunTest,
  runningTests,
  expandedTests,
  onToggleTest,
  editedQueries,
  onQueryEdit
}: TestCategoryProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <Card className="p-4 mb-4">
      <div 
        className="flex items-center cursor-pointer mb-4"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        <h3 className="text-lg font-semibold ml-2">{category.name}</h3>
      </div>

      {isExpanded && (
        <div className="space-y-4">
          {category.tests.map((test: any) => (
            <Card key={test.id} className="p-4">
              <div 
                className="flex items-center cursor-pointer"
                onClick={() => onToggleTest(test.id)}
              >
                {expandedTests.includes(test.id) ? 
                  <ChevronDown className="w-4 h-4" /> : 
                  <ChevronRight className="w-4 h-4" />}
                <h4 className="font-medium ml-2">{test.name}</h4>
              </div>

              {expandedTests.includes(test.id) && (
                <div className="mt-4 space-y-4">
                  <p className="text-sm text-gray-600">{test.description}</p>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Query:</label>
                    <textarea
                      className="w-full h-32 p-2 text-sm font-mono border rounded"
                      value={editedQueries[test.id] ?? test.query}
                      onChange={(e) => onQueryEdit(test.id, e.target.value)}
                    />
                  </div>

                  <Button
                    onClick={() => onRunTest(test.id, editedQueries[test.id] ?? test.query)}
                    disabled={runningTests.has(test.id)}
                  >
                    {runningTests.has(test.id) ? 'Running...' : 'Run Test'}
                  </Button>

                  {test.result && (
                    <div className="mt-4">
                      <TestResultDisplay 
                        result={test.result}
                        testRole={test.role}
                      />
                    </div>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </Card>
  );
} 