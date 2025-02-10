// src/lib/testsSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
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
  categoryId: string;
  description: string;
  query: string;
  expected: ExpectedOutcome;
  result?: ExpectedOutcome;
  solution?: string;
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

interface TestResult {
  status: 'passed' | 'failed';
  error?: any;
  data?: any;
  statusText?: string;
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
      state.categories = action.payload;
    },
    updateTestCaseResult: (state, action: PayloadAction<UpdateTestCaseResultPayload>) => {
      const { categoryId, testCaseId, result } = action.payload;
      const category = state.categories.find((cat) => cat.id === categoryId);
      if (category) {
        const testCase = category.tests.find((test) => test.id === testCaseId);
        if (testCase) {
          testCase.result = {
            ...result,
            status: result.status === 'passed' ? 'passed' : 'failed'
          } as ExpectedOutcome & { status: "pending" | "passed" | "failed" | "error" };
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
  },
});

export const { 
  setTestCategories, 
  updateTestCaseResult, 
  clearTestResults,
  updateTestSolution
} = testsSlice.actions;
export default testsSlice.reducer;
