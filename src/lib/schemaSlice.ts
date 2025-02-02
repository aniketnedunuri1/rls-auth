import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

interface SchemaState {
  schema: string
  rlsPolicies: string
}

const initialState: SchemaState = {
  schema: "",
  rlsPolicies: "",
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
  },
})

export const { setSchema, setRLSPolicies } = schemaSlice.actions

export default schemaSlice.reducer

