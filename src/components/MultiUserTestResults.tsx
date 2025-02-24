import { MultiUserTestResult, RoleAnalysis } from '@/types/test';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface MultiUserTestResultsProps {
  result: MultiUserTestResult;
}

export function MultiUserTestResults({ result }: MultiUserTestResultsProps) {
  const renderRoleResult = (role: string, roleResult: any) => {
    const isSuccess = roleResult.success && !roleResult.error;
    const statusColor = isSuccess ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';

    return (
      <Card key={role} className="p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold">{role}</h4>
          <Badge variant={isSuccess ? "success" : "destructive"}>
            {isSuccess ? 'Success' : 'Failed'}
          </Badge>
        </div>

        <div className="space-y-2">
          <div className="text-sm">
            <span className="font-medium">Operation: </span>
            {roleResult.context.operation}
          </div>

          {roleResult.error && (
            <div className="text-sm text-red-600">
              <span className="font-medium">Error: </span>
              {roleResult.error.message || JSON.stringify(roleResult.error)}
            </div>
          )}

          {roleResult.data && (
            <div className="text-sm">
              <span className="font-medium">Data: </span>
              <pre className="mt-1 p-2 bg-gray-50 rounded-md overflow-x-auto">
                {JSON.stringify(roleResult.data, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </Card>
    );
  };

  const renderRoleAnalysis = (roles: RoleAnalysis[]) => (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-3">Role Analysis</h3>
      <div className="space-y-2">
        {roles.map((role) => (
          <div key={role.name} className="p-2 bg-gray-50 rounded-md">
            <div className="font-medium">{role.name}</div>
            <div className="text-sm text-gray-600">
              Tables: {Array.from(role.tables).join(', ')}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {result.analysis && renderRoleAnalysis(result.analysis.roles)}
      
      <div>
        <h3 className="text-lg font-semibold mb-3">Test Results by Role</h3>
        <ScrollArea className="h-[500px] pr-4">
          {Object.entries(result.roleResults).map(([role, roleResult]) => 
            renderRoleResult(role, roleResult)
          )}
        </ScrollArea>
      </div>

      <div className="mt-4 p-4 bg-gray-50 rounded-md">
        <h4 className="font-semibold mb-2">Security Analysis</h4>
        <div className="space-y-1 text-sm">
          <p>Organization Policies: {result.analysis.hasOrgPolicies ? '✓' : '✗'}</p>
          <p>Custom Claims: {result.analysis.hasCustomClaims ? '✓' : '✗'}</p>
          <p>Roles Tested: {Object.keys(result.roleResults).length}</p>
        </div>
      </div>
    </div>
  );
} 