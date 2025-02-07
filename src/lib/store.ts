// src/lib/store.ts
import { configureStore } from "@reduxjs/toolkit";
import schemaReducer from "./schemaSlice";
import testsReducer from "./testsSlice"; 
import projectReducer from "./projectSlice"; 

export const store = configureStore({
  reducer: {
    schema: schemaReducer,
    tests: testsReducer,
    project: projectReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
