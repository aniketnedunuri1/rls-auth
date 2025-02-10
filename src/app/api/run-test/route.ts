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

    // Create an "anon" client
    const supabaseAnon = createClient(url, anonKey);

    // Sign in anonymously
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

    // Use the returned Access Token to create an AUTH'd client
    const supabaseAuth = createClient(url, anonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${anonSignInData.session.access_token}`,
        },
      },
    });

    console.log("Executing user snippet:", query);

    // Build and execute the dynamic function
    const func = new Function(
      "supabase",
      `
      return (async () => {
        try {
          ${query}
        } catch (error) {
          return { 
            data: null, 
            error: error.message || "Execution error" 
          };
        }
      })();
      `
    );

    // Execute the function and handle the result
    const result = await func(supabaseAuth);
    
    // Ensure we have a valid result object
    const safeResult = {
      data: result?.data ?? null,
      error: result?.error ?? null
    };

    return NextResponse.json(safeResult, { status: 200 });
  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        data: null
      },
      { status: 500 }
    );
  }
}
