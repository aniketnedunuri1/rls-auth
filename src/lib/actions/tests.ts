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

    console.log('Saving categories to database:', categories);

    for (const category of categories) {
      console.log(`Processing category ${category.name} with ${category.tests.length} tests`);
      
      for (const test of category.tests) {
        console.log(`Saving test: ${test.name}, role: ${test.role}, id: ${test.id}`);
        
        try {
          // Ensure role is never undefined and is a valid TestRole
          const role = test.role === 'AUTHENTICATED' ? 'AUTHENTICATED' : 'ANONYMOUS';

          // Convert expected and result to proper JSON format
          const expected = test.expected 
            ? JSON.parse(JSON.stringify(test.expected))
            : Prisma.JsonNull;
          
          const result = test.result 
            ? JSON.parse(JSON.stringify(test.result))
            : Prisma.JsonNull;

          const testData = {
            id: test.id,
            projectId,
            categoryId: category.id,
            categoryName: category.name,
            name: test.name,
            description: test.description,
            query: test.query || '',
            expected,
            result,
            role,
            solution: test.solution 
              ? JSON.parse(JSON.stringify(test.solution))
              : Prisma.JsonNull
          } as const; // Use const assertion to preserve literal types

          await prisma.test.upsert({
            where: { id: test.id },
            create: testData,
            update: testData,
          });
        } catch (testError) {
          console.error(`Error saving test ${test.name}:`, testError);
          throw testError;
        }
      }
    }

    // Verify the save
    const savedTests = await prisma.test.findMany({
      where: { projectId },
      select: { name: true, role: true, id: true }
    });
    console.log('Tests after save:', savedTests);

    return { success: true };
  } catch (error) {
    console.error('Error saving test results:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
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

    // Get all tests for this project, ordered by categoryName and name
    const tests = await prisma.test.findMany({
      where: { projectId },
      orderBy: [
        { categoryName: 'asc' },
        { name: 'asc' }
      ]
    });

    if (!tests || tests.length === 0) {
      console.log('No tests found for project:', projectId);
      return {
        success: true,
        categories: []
      };
    }

    // Group tests by category while maintaining order
    const categoriesMap = new Map<string, TestCategory>();
    const categoryOrder: string[] = [];
    
    tests.forEach((test: any) => {
      const categoryId = test.categoryId;
      
      if (!categoriesMap.has(categoryId)) {
        categoriesMap.set(categoryId, {
          id: categoryId,
          name: test.categoryName,
          description: `Test suite for ${test.categoryName}`,
          tests: []
        });
        categoryOrder.push(categoryId);
      }
      
      const category = categoriesMap.get(categoryId);
      if (category) {
        let testResult: TestResult | undefined;
        if (test.result) {
          try {
            // Ensure we parse the result if it's a string
            const resultData = typeof test.result === 'string' 
              ? JSON.parse(test.result) 
              : test.result;
            
            if (isTestResult(resultData)) {
              testResult = resultData;
            }
          } catch (e) {
            console.error('Error parsing test result:', e);
          }
        }

        const role = test.role === 'AUTHENTICATED' ? 'AUTHENTICATED' : 'ANONYMOUS';

        category.tests.push({
          id: test.id,
          name: test.name,
          description: test.description,
          query: test.query || '',
          expected: test.expected as ExpectedOutcome,
          result: testResult,
          categoryId: test.categoryId,
          solution: test.solution,
          role: role
        });
      }
    });

    // Use the categoryOrder to maintain consistent order
    const finalCategories = categoryOrder.map(id => categoriesMap.get(id)!);
    
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
        solution: solution,
        result: {
          status: 'failed',
          data: null,
          error: null,
          response: null
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