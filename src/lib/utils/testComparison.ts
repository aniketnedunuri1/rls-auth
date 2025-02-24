import { TestResult, MultiUserTestResult } from '@/types/test';

export function compareTestResults(actual: TestResult | MultiUserTestResult, expected: TestResult) {
  // Handle multi-user test results
  if ('roleResults' in actual) {
    // For multi-user tests, we check if each role's result matches expectations
    const multiUserResult = actual as MultiUserTestResult;
    return Object.entries(multiUserResult.roleResults).every(([role, roleResult]) => {
      // Check if the role's result matches the expected behavior
      if (expected.context?.role === role) {
        return compareBasicResult(roleResult, expected);
      }
      // For other roles, verify access is properly restricted
      return verifyAccessRestriction(roleResult, expected);
    });
  }

  // Handle single-user test results
  return compareBasicResult(actual, expected);
}

function compareBasicResult(actual: TestResult, expected: TestResult): boolean {
  if (expected.success) {
    return actual.success && !actual.error;
  }

  if (expected.error) {
    return actual.error?.code === expected.error?.code;
  }

  return !actual.error && 
         (actual.data === null || 
          (Array.isArray(actual.data) && actual.data.length === 0));
}

function verifyAccessRestriction(actual: TestResult, expected: TestResult): boolean {
  // If the test expects success for one role, other roles should fail
  if (expected.success) {
    return !actual.success || !!actual.error;
  }
  return true;
} 