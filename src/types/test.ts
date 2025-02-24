// Existing types
export type TestRole = 'ANONYMOUS' | 'AUTHENTICATED' | 'MULTI_USER';

export interface TestContext {
  role: string;
  operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';
  userId?: string;
}

export interface TestResult {
  success: boolean;
  data: any;
  error: any | null;
  context: TestContext;
}

export interface Test {
  id: string;
  name: string;
  description: string;
  query: string;
  role: TestRole;
  expected: TestResult;
  result?: TestResult;
  categoryId: string;
  categoryName: string;
}

// New types for multi-user testing
export interface RoleAnalysis {
  name: string;
  tables: string[];
  conditions: string[];
}

export interface RLSAnalysis {
  roles: RoleAnalysis[];
  hasOrgPolicies: boolean;
  hasCustomClaims: boolean;
  tableAccess: Map<string, Set<string>>;
}

export interface MultiUserTestResult extends TestResult {
  roleResults: {
    [role: string]: TestResult;
  };
  analysis: RLSAnalysis;
} 