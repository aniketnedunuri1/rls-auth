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
  description: string;
  query: string;
  expected: ExpectedOutcome;
  result?: ExpectedOutcome;
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
  },
});

export const { setTestCategories, updateTestCaseResult, clearTestResults } = testsSlice.actions;
export default testsSlice.reducer;
