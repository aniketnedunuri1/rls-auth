import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { TestRole, Test, RLSAnalysis } from '@/types/test';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';

interface TestExecutorProps {
  test: Test;
  onResult: (result: any) => void;
}

export function TestExecutor({ test, onResult }: TestExecutorProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [analysis, setAnalysis] = useState<RLSAnalysis | null>(null);
  const selectedProject = useSelector((state: RootState) => state.project.selectedProject);

  const runTest = async () => {
    if (!selectedProject?.supabaseUrl || !selectedProject?.supabaseAnonKey) {
      console.error('Missing Supabase configuration');
      return;
    }

    setIsRunning(true);

    try {
      let endpoint = '/api/run-test/anon';
      let payload: any = {
        query: test.query,
        url: selectedProject.supabaseUrl,
        anonKey: selectedProject.supabaseAnonKey
      };

      if (test.role === 'MULTI_USER') {
        endpoint = '/api/run-test/multi-user';
        payload = {
          ...payload,
          serviceRoleKey: selectedProject.serviceRoleKey,
          rlsPolicies: selectedProject.rlsSchema
        };
      } else if (test.role === 'AUTHENTICATED') {
        endpoint = '/api/run-test/authenticated-anon';
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const result = await response.json();

      if (test.role === 'MULTI_USER') {
        setAnalysis(result.analysis);
      }

      onResult(result);
    } catch (error) {
      console.error('Test execution error:', error);
      onResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button 
        onClick={runTest} 
        disabled={isRunning}
        variant={isRunning ? "outline" : "default"}
      >
        {isRunning ? 'Running...' : 'Run Test'}
      </Button>

      {analysis && (
        <div className="mt-4 p-4 bg-secondary rounded-md">
          <h4 className="font-semibold">RLS Analysis</h4>
          <div className="mt-2 space-y-2">
            <p>Roles Detected: {analysis.roles.length}</p>
            <p>Organization Policies: {analysis.hasOrgPolicies ? 'Yes' : 'No'}</p>
            <p>Custom Claims: {analysis.hasCustomClaims ? 'Yes' : 'No'}</p>
          </div>
        </div>
      )}
    </div>
  );
} 