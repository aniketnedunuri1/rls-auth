// src/app/api/run-test/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function POST(req: Request): Promise<Response> {
  try {
    const { query, supabaseConfig } = await req.json();
    const { url, anonKey } = supabaseConfig;
    if (!url || !anonKey || !query) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }
    const supabase = createClient(url, anonKey);
    // Evaluate the query string in a safe async function.
    // WARNING: Using the Function constructor can be dangerous; ensure you trust the generated code.
    const func = new Function("supabase", `return (async () => { ${query} })();`);
    const result = await func(supabase);
    console.log(query)
    // Convert the result to a JSON-serializable object.
    const safeResult = JSON.parse(JSON.stringify(result));
    return NextResponse.json(safeResult, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
