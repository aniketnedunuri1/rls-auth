// src/app/api/run-test/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function POST(req: Request): Promise<Response> {
  console.log("API route hit: /api/run-test");

  try {
    const body = await req.json();
    const { query, url, anonKey } = body;

    // Basic validation
    if (!url || !anonKey || !query) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    // 1. Create an "anon" client
    const supabaseAnon = createClient(url, anonKey);

    // 2. Sign in anonymously (Supabase 2.0 supports this out of the box)
    const { data: anonSignInData, error: anonSignInError } = await supabaseAnon.auth.signInAnonymously();
    if (anonSignInError || !anonSignInData?.session?.access_token) {
      console.error("Anonymous sign in failed:", anonSignInError);
      return NextResponse.json(
        {
          error: anonSignInError?.message ?? "Could not sign in anonymously",
        },
        { status: 400 }
      );
    }

    // 3. Use the returned Access Token to create an AUTH'd client
    const supabaseAuth = createClient(url, anonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${anonSignInData.session.access_token}`,
        },
      },
    });

    console.log("Executing user snippet:", query);

    // 4. Build a dynamic function from the user-supplied snippet.
    //    We assume `query` is a valid snippet that includes its own:
    //      const { data, error } = await supabase.from('...')...
    //      return { data, error };
    const func = new Function(
      "supabase",
      `
        return (async () => {
          ${query}
        })();
      `
    );

    // 5. Run the snippet
    const result = await func(supabaseAuth);

    // 6. Return the result
    const safeResult = JSON.parse(JSON.stringify(result));
    return NextResponse.json(safeResult, { status: 200 });
  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
