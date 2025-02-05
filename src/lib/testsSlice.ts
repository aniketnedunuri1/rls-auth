// src/lib/testsSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface ExpectedOutcome {
  data?: any;
  status?: number;
  statusText?: string;
  error?: any;
}

export interface TestCase {
  id: string;
  name: string;
  description: string;
  query: string;
  expected: ExpectedOutcome;
  result?: ExpectedOutcome & { status: "pending" | "passed" | "failed" | "error" };
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

const initialState: TestsState = {
  categories: [],
};

const testsSlice = createSlice({
  name: "tests",
  initialState,
  reducers: {
    setTestCategories(state, action: PayloadAction<TestCategory[]>) {
      state.categories = action.payload;
    },
    updateTestCaseResult(
      state,
      action: PayloadAction<{
        categoryId: string;
        testCaseId: string;
        result: ExpectedOutcome & { status: "passed" | "failed" | "error" };
      }>
    ) {
      const { categoryId, testCaseId, result } = action.payload;
      const category = state.categories.find((cat) => cat.id === categoryId);
      if (category) {
        const testCase = category.tests.find((test) => test.id === testCaseId);
        if (testCase) {
          testCase.result = result;
        }
      }
    },
  },
});

export const { setTestCategories, updateTestCaseResult } = testsSlice.actions;
export default testsSlice.reducer;
