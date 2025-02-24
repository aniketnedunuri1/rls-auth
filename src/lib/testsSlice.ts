// src/lib/testsSlice.ts
import { createSlice, PayloadAction, createAction } from "@reduxjs/toolkit";
import { saveTestResults, loadTestResults } from '@/lib/actions/tests';

export interface ExpectedOutcome {
  data?: any;
  status?: "pending" | "passed" | "failed" | "error";
  statusText?: string;
  error?: any;
}

export interface TestCase {
  id: string;
  name: string;
  description: string;
  query?: string;
  expected?: ExpectedOutcome;
  categoryId: string;
  result?: TestResult;
  solution?: {
    description: string;
    query: string;
  } | string;  // Can be either an object or a stringified JSON
  role?: 'ANONYMOUS' | 'AUTHENTICATED';
}

export interface TestCategory {
  id: string;
  name: string;
  description: string;
  tests: TestCase[];
}

interface TestsState {
  categories: TestCategory[];
}

export interface TestResult {
  status: 'passed' | 'failed';
  data: any;
  error: any;
  response: any;
}

interface UpdateTestCaseResultPayload {
  categoryId: string;
  testCaseId: string;
  result: TestResult;
}

interface UpdateTestSolutionPayload {
  categoryId: string;
  testId: string;
  solution: string;
}

const initialState: TestsState = {
  categories: [],
};

export const testsSlice = createSlice({
  name: "tests",
  initialState,
  reducers: {
    setTestCategories: (state, action: PayloadAction<TestCategory[]>) => {
      state.categories = action.payload.map(category => ({
        ...category,
        tests: category.tests.map(test => ({
          ...test,
          role: test.role || test.expected?.context?.role || 'ANONYMOUS'
        }))
      }));
      console.log('Updated state categories:', state.categories);
    },
    updateTestCaseResult: (state, action: PayloadAction<UpdateTestCaseResultPayload>) => {
      const { categoryId, testCaseId, result } = action.payload;
      const category = state.categories.find((cat) => cat.id === categoryId);
      if (category) {
        const testCase = category.tests.find((test) => test.id === testCaseId);
        if (testCase) {
          testCase.result = result;
        }
      }
    },
    clearTestResults: (state) => {
      state.categories = [];
    },
    updateTestSolution: (state, action: PayloadAction<UpdateTestSolutionPayload>) => {
      const { categoryId, testId, solution } = action.payload;
      const category = state.categories.find((cat) => cat.id === categoryId);
      if (category) {
        const test = category.tests.find((test) => test.id === testId);
        if (test) {
          test.solution = solution;
        }
      }
    },
    updateTestQuery: (
      state,
      action: PayloadAction<{
        categoryId: string;
        testId: string;
        query: string;
      }>
    ) => {
      const { categoryId, testId, query } = action.payload;
      const category = state.categories.find(c => c.id === categoryId);
      if (category) {
        const test = category.tests.find(t => t.id === testId);
        if (test) {
          test.query = query;
        }
      }
    },
  },
});

export const { 
  setTestCategories, 
  updateTestCaseResult, 
  clearTestResults,
  updateTestSolution,
  updateTestQuery,
} = testsSlice.actions;

export default testsSlice.reducer;
