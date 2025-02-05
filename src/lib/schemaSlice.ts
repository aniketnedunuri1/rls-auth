import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

interface SchemaState {
  schema: string
  rlsPolicies: string
  additionalContext: string
  supabaseConfig: {
    url: string
    anonKey: string
  }
}

const initialState: SchemaState = {
  schema: "",
  rlsPolicies: "",
  additionalContext: "",
  supabaseConfig: {
    url: "",
    anonKey: "",
  },
}

export const schemaSlice = createSlice({
  name: "schema",
  initialState,
  reducers: {
    setSchema: (state, action: PayloadAction<string>) => {
      state.schema = action.payload
    },
    setRLSPolicies: (state, action: PayloadAction<string>) => {
      state.rlsPolicies = action.payload
    },
    setAdditionalContext: (state, action: PayloadAction<string>) => {
      state.additionalContext = action.payload
    },
    setSupabaseConfig: (state, action: PayloadAction<{ url: string; anonKey: string }>) => {
      state.supabaseConfig = action.payload
    },
  },
})

export const { setSchema, setRLSPolicies, setAdditionalContext, setSupabaseConfig } = schemaSlice.actions

export default schemaSlice.reducer

