"use server";

import { getUser } from './auth';
import { TestCategory, TestCase, ExpectedOutcome } from '@/lib/testsSlice';
import { prisma } from '../prisma';
import { Prisma, Test } from '@prisma/client';

interface SaveTestResultsParams {
  projectId: string;
  categories: TestCategory[];
}

export async function saveTestResults({ projectId, categories }: SaveTestResultsParams) {
  try {
    const user = await getUser();
    if (!user) throw new Error("User not authenticated");

    // First, delete existing test results for this project
    await prisma.test.deleteMany({
      where: { projectId }
    });

    // Then create new test entries with category information
    const testData = categories.flatMap(category => 
      category.tests.map(test => ({
        projectId,
        categoryId: category.id,
        categoryName: category.name,
        name: test.name,
        description: test.description,
        query: test.query || '',
        expected: test.expected ? (test.expected as any) : Prisma.JsonNull,
        result: test.result ? (test.result as any) : Prisma.JsonNull,
        role: 'ANONYMOUS' as const,
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
          description: test.description,
          query: test.query || '',
          expected: test.expected as ExpectedOutcome,
          result: test.result as ExpectedOutcome
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