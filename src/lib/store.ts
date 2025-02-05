// src/lib/store.ts
import { configureStore } from "@reduxjs/toolkit";
import schemaReducer from "./schemaSlice";
import testsReducer from "./testsSlice"; // Ensure this is imported

export const store = configureStore({
  reducer: {
    schema: schemaReducer,
    tests: testsReducer, // Register the tests slice under key 'tests'
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
