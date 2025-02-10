import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// Make this match the Prisma schema exactly
export interface Project {
  id: string;
  name: string;
  dbSchema?: string | null;
  rlsSchema?: string | null;
  additionalContext?: string | null;
  supabaseUrl?: string | null;
  supabaseAnonKey?: string | null;
}

interface ProjectState {
  projects: Project[];
  selectedProject: Project | null;
}

const initialState: ProjectState = {
  projects: [],
  selectedProject: null,
};

const projectSlice = createSlice({
  name: "project",
  initialState,
  reducers: {
    setProjects: (state, action: PayloadAction<{ projects: Project[] }>) => {
      // Add safety check for undefined projects
      state.projects = action.payload.projects || [];
      if (state.projects?.length > 0 && !state.selectedProject) {
        state.selectedProject = state.projects[0];
      }
    },
    selectProject: (state, action: PayloadAction<Project>) => {
      state.selectedProject = action.payload;
    },
    setSchema: (state, action: PayloadAction<{ projectId: string; value: string }>) => {
      if (state.selectedProject && state.selectedProject.id === action.payload.projectId) {
        state.selectedProject.dbSchema = action.payload.value;
      }
    },
    setRLSPolicies: (state, action: PayloadAction<{ projectId: string; value: string }>) => {
      if (state.selectedProject && state.selectedProject.id === action.payload.projectId) {
        state.selectedProject.rlsSchema = action.payload.value;
      }
    },
    setAdditionalContext: (state, action: PayloadAction<{ projectId: string; value: string }>) => {
      if (state.selectedProject && state.selectedProject.id === action.payload.projectId) {
        state.selectedProject.additionalContext = action.payload.value;
      }
    },
    setSupabaseUrl: (state, action: PayloadAction<{ projectId: string; value: string }>) => {
      if (state.selectedProject && state.selectedProject.id === action.payload.projectId) {
        state.selectedProject.supabaseUrl = action.payload.value;
      }
    },
    setSupabaseAnonKey: (state, action: PayloadAction<{ projectId: string; value: string }>) => {
      if (state.selectedProject && state.selectedProject.id === action.payload.projectId) {
        state.selectedProject.supabaseAnonKey = action.payload.value;
      }
    },
  },
});

export const {
  setProjects,
  selectProject,
  setSchema,
  setRLSPolicies,
  setSupabaseUrl,
  setSupabaseAnonKey,
  setAdditionalContext,
} = projectSlice.actions;

export default projectSlice.reducer;
