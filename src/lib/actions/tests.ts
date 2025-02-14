"use server";

import { getUser } from './auth';
import { TestCategory, TestCase, ExpectedOutcome, TestResult } from '@/lib/testsSlice';
import { prisma } from '../prisma';
import { Prisma } from '@prisma/client';

interface SaveTestResultsParams {
  projectId: string;
  categories: TestCategory[];
}

export async function saveTestResults({ projectId, categories }: SaveTestResultsParams) {
  try {
    const user = await getUser();
    if (!user) throw new Error("User not authenticated");

    // Get existing tests to preserve IDs and tests from other role
    const existingTests = await prisma.test.findMany({
      where: { projectId },
    });

    // Create a map of test names to existing IDs
    const existingTestMap = new Map(
      existingTests.map(test => [test.name, test.id])
    );

    // Get the role from the first test in categories (they should all be the same role)
    const currentRole = categories[0]?.tests[0]?.role;
    if (!currentRole) {
      throw new Error("No role specified in tests");
    }

    console.log('Saving tests for role:', currentRole);

    // Delete only the tests for the current role, preserving other role's tests
    await prisma.test.deleteMany({
      where: { 
        projectId,
        role: currentRole
      }
    });

    // Then create new test entries with category information
    const testData = categories.flatMap(category => 
      category.tests.map(test => ({
        id: existingTestMap.get(test.name) || test.id,
        projectId,
        categoryId: category.id,
        categoryName: category.name,
        name: test.name,
        description: test.description,
        query: test.query || '',
        expected: test.expected ? (test.expected as any) : Prisma.JsonNull,
        result: test.result ? JSON.parse(JSON.stringify(test.result)) : Prisma.JsonNull,
        role: test.role || 'ANONYMOUS',
        solution: test.solution || null
      }))
    );

    console.log('Saving tests with data:', testData.map(t => ({ 
      name: t.name, 
      role: t.role 
    })));

    await prisma.test.createMany({
      data: testData
    });

    // Verify the save
    const savedTests = await prisma.test.findMany({
      where: { projectId },
      select: { name: true, role: true }
    });
    console.log('Tests after save:', savedTests);

    return { success: true };
  } catch (error) {
    console.error('Error saving test results:', error);
    return { success: false, error: (error as Error).message };
  }
}

// Add type guard to check if a value is a TestResult
function isTestResult(value: any): value is TestResult {
  return (
    value &&
    typeof value === 'object' &&
    'status' in value &&
    'data' in value &&
    'error' in value &&
    'response' in value &&
    (value.status === 'passed' || value.status === 'failed')
  );
}

export async function loadTestResults(projectId: string) {
  console.log('loadTestResults called with projectId:', projectId);
  
  try {
    if (!projectId) {
      console.log('No projectId provided, returning empty categories');
      return {
        success: true,
        categories: []
      };
    }

    // Get all tests for this project
    const tests = await prisma.test.findMany({
      where: { projectId }
    });
    console.log('Found tests:', tests?.length || 0);
    console.log('Test roles:', tests.map(t => ({ name: t.name, role: t.role })));

    if (!tests || tests.length === 0) {
      console.log('No tests found for project:', projectId);
      return {
        success: true,
        categories: []
      };
    }

    // Group tests by category
    const categoriesMap = new Map<string, TestCategory>();
    
    tests.forEach((test: any) => {
      const categoryId = test.categoryId;
      const categoryName = test.categoryName;
      
      if (!categoriesMap.has(categoryId)) {
        categoriesMap.set(categoryId, {
          id: categoryId,
          name: categoryName,
          description: `Test suite for ${categoryName}`,
          tests: []
        });
      }
      
      const category = categoriesMap.get(categoryId);
      if (category) {
        // Convert the result safely
        let testResult: TestResult | undefined;
        if (test.result && isTestResult(test.result)) {
          testResult = test.result;
        }

        // Ensure role is properly typed and defaulted
        const role = test.role === 'AUTHENTICATED' ? 'AUTHENTICATED' : 'ANONYMOUS';
        console.log(`Processing test ${test.name} with role: ${role}`);

        category.tests.push({
          id: test.id,
          name: test.name,
          description: test.description,
          query: test.query || '',
          expected: test.expected as ExpectedOutcome,
          result: testResult,
          categoryId: test.categoryId,
          solution: test.solution || undefined,
          role: role  // Use the properly typed role
        });
      }
    });

    const finalCategories = Array.from(categoriesMap.values());
    console.log('Returning categories:', finalCategories.length);
    console.log('Category tests with roles:', finalCategories.map(cat => ({
      category: cat.name,
      tests: cat.tests.map(t => ({ name: t.name, role: t.role }))
    })));
    
    return { 
      success: true, 
      categories: finalCategories
    };
  } catch (error) {
    console.error('Error in loadTestResults:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      categories: [] 
    };
  }
}

export async function generateAndSaveSolution(test: TestCase, projectId: string) {
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { dbSchema: true, rlsSchema: true }
    });

    if (!project) throw new Error("Project not found");

    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/generate-solution`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        test,
        dbSchema: project.dbSchema,
        currentRLS: project.rlsSchema
      })
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to generate solution');
    }

    // Save the solution to the database
    await prisma.test.update({
      where: { id: test.id },
      data: { solution: data.solution }
    });

    return data.solution;
  } catch (error) {
    console.error('Error generating solution:', error);
    return null;
  }
}

export async function saveSolution(testId: string, solution: string) {
  try {
    const updatedTest = await prisma.test.update({
      where: {
        id: testId,
      },
      data: {
        result: {
          solution: solution  // Store solution within the result JSON field
        }
      },
    });
    return { success: true, test: updatedTest };
  } catch (error) {
    console.error('Error in saveSolution:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to save solution' 
    };
  }
} 