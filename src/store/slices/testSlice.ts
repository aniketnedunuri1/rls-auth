import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { TestCategory, TestResult, MultiUserTestResult } from '@/types/test';

interface TestState {
  categories: TestCategory[];
}

const initialState: TestState = {
  categories: []
};

export const testSlice = createSlice({
  name: 'tests',
  initialState,
  reducers: {
    setTestCategories: (state, action: PayloadAction<TestCategory[]>) => {
      state.categories = action.payload;
    },
    updateTestResult: (state, action: PayloadAction<{
      testId: string;
      result: TestResult | MultiUserTestResult;
    }>) => {
      const { testId, result } = action.payload;
      state.categories = state.categories.map(category => ({
        ...category,
        tests: category.tests.map(test => 
          test.id === testId 
            ? { ...test, result }
            : test
        )
      }));
    },
    clearTestResults: (state) => {
      state.categories = state.categories.map(category => ({
        ...category,
        tests: category.tests.map(test => ({ ...test, result: undefined }))
      }));
    }
  }
});

export const { setTestCategories, updateTestResult, clearTestResults } = testSlice.actions;
export default testSlice.reducer; 