import { TestResult, MultiUserTestResult } from '@/types/test';
import { MultiUserTestResults } from './MultiUserTestResults';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface TestResultDisplayProps {
  result: TestResult | MultiUserTestResult;
  testRole: string;
}

export function TestResultDisplay({ result, testRole }: TestResultDisplayProps) {
  const isMultiUserResult = testRole === 'MULTI_USER' && 'roleResults' in result;

  if (isMultiUserResult) {
    return <MultiUserTestResults result={result as MultiUserTestResult} />;
  }

  // Single user result display
  const isSuccess = result.success && !result.error;
  
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-semibold">Test Result</h4>
        <Badge variant={isSuccess ? "success" : "destructive"}>
          {isSuccess ? 'Success' : 'Failed'}
        </Badge>
      </div>

      <div className="space-y-2">
        {result.error && (
          <div className="text-sm text-red-600">
            <span className="font-medium">Error: </span>
            {result.error.message || JSON.stringify(result.error)}
          </div>
        )}

        {result.data && (
          <div className="text-sm">
            <span className="font-medium">Data: </span>
            <pre className="mt-1 p-2 bg-gray-50 rounded-md overflow-x-auto">
              {JSON.stringify(result.data, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </Card>
  );
} 