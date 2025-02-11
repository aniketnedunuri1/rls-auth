"use server";

import { getUser } from './auth';
import { TestCategory, TestCase, ExpectedOutcome } from '@/lib/testsSlice';
import { prisma } from '../prisma';
import { Prisma, Test } from '@prisma/client';

interface SaveTestResultsParams {
  projectId: string;
  categories: TestCategory[];
}

interface TestWithSolution extends TestCase {
  solution?: string;
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
        id: existingTestMap.get(test.name) || test.id, // Use existing ID if available
        projectId,
        categoryId: category.id,
        categoryName: category.name,
        name: test.name,
        description: test.description,
        query: test.query || '',
        expected: test.expected ? (test.expected as any) : Prisma.JsonNull,
        result: test.result ? (test.result as any) : Prisma.JsonNull,
        role: 'ANONYMOUS' as const,
        solution: test.solution // Preserve any existing solutions
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

export async function loadTestResults(projectId: string) {
  try {
    const user = await getUser();
    if (!user) throw new Error("User not authenticated");

    // We create a new type that ensures TypeScript knows our Test has category fields
    type TestWithCategory = Test & {
      categoryId: string;
      categoryName: string;
    };

    // Then we can use type assertion to tell TypeScript that our query results
    // will include these category fields
    const tests = await prisma.test.findMany({
      where: { projectId }
    }) as TestWithCategory[];

    // Group tests by category
    const categoriesMap = new Map<string, TestCategory>();
    
    tests.forEach(test => {
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
        category.tests.push({
          id: test.id,
          name: test.name,
          categoryId: test.categoryId,
          description: test.description,
          query: test.query || '',
          expected: test.expected as ExpectedOutcome,
          result: test.result as ExpectedOutcome,
          solution: test.solution || undefined
        });
      }
    });

    return { 
      success: true, 
      categories: Array.from(categoriesMap.values())
    };
  } catch (error) {
    console.error('Error loading test results:', error);
    return { success: false, error: (error as Error).message };
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
  'use server';
  
  console.log('saveSolution called with testId:', testId);
  try {
    if (!testId || !solution) {
      throw new Error('Missing required parameters');
    }

    // Log all tests in the database
    const allTests = await prisma.test.findMany({
      select: { id: true, name: true }
    });
    console.log('All tests in database:', allTests);

    // Check if the test exists
    const existingTest = await prisma.test.findUnique({
      where: { id: testId }
    });
    
    console.log('Found test?', existingTest ? 'Yes' : 'No');
    if (existingTest) {
      console.log('Existing test details:', existingTest);
    }

    if (!existingTest) {
      throw new Error(`Test with ID ${testId} not found in database`);
    }

    console.log('Attempting to update test:', testId);
    const result = await prisma.test.update({
      where: { id: testId },
      data: { solution }
    });

    console.log('Successfully updated test:', result);
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error in saveSolution:', errorMessage);
    return { success: false, error: errorMessage };
  }
} 