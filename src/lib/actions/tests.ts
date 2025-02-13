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

    // Get existing tests to preserve IDs
    const existingTests = await prisma.test.findMany({
      where: { projectId },
      select: { id: true, name: true }
    });

    // Create a map of test names to existing IDs
    const existingTestMap = new Map(
      existingTests.map(test => [test.name, test.id])
    );

    // First, delete existing test results for this project
    await prisma.test.deleteMany({
      where: { projectId }
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

    await prisma.test.createMany({
      data: testData
    });

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

    // First check if project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });
    console.log('Project lookup result:', project);

    if (!project) {
      console.log('No project found for id:', projectId);
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

        category.tests.push({
          id: test.id,
          name: test.name,
          description: test.description,
          query: test.query || '',
          expected: test.expected as ExpectedOutcome,
          result: testResult,
          categoryId: test.categoryId,
          solution: test.solution || undefined,
          role: (test.role as 'ANONYMOUS' | 'AUTHENTICATED') || 'ANONYMOUS'
        });
      }
    });

    const finalCategories = Array.from(categoriesMap.values());
    console.log('Returning categories:', finalCategories.length);
    
    return { 
      success: true, 
      categories: finalCategories
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorStack = error instanceof Error ? error.stack : 'No stack trace available';
    
    console.error('Error in loadTestResults:', errorMessage);
    console.error('Error stack:', errorStack);
    
    return { 
      success: false, 
      error: errorMessage,
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