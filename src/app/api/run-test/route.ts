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

    // 1) Create an initial Supabase client with the anon key
    const supabaseAnon = createClient(url, anonKey);

    // 2) Sign in anonymously to get a "real" user session
    const { data: anonSignInData, error: anonSignInError } = await supabaseAnon.auth.signInAnonymously();
    if (anonSignInError || !anonSignInData?.session?.access_token) {
      return NextResponse.json(
        { error: anonSignInError?.message || "Could not sign in anonymously" },
        { status: 400 }
      );
    }

    // 3) Create a second client, injecting the anonymous user's token in the Authorization header
    const supabaseAuth = createClient(url, anonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${anonSignInData.session.access_token}`,
        },
      },
    });

    // 4) Evaluate the user’s query string using the newly authenticated client
    // WARNING: Using the Function constructor can be dangerous; ensure you trust the generated code.
    const func = new Function("supabase", `return (async () => { ${query} })();`);
    const result = await func(supabaseAuth);

    // 5) Return the result as valid JSON
    const safeResult = JSON.parse(JSON.stringify(result));
    return NextResponse.json(safeResult, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
