// src/app/api/run-test/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function POST(req: Request): Promise<Response> {
  console.log('API route hit: /api/run-test');
  
  try {
    const body = await req.json();
    console.log('Request body:', {
      hasQuery: !!body.query,
      hasUrl: !!body.url,
      hasAnonKey: !!body.anonKey
    });

    const { query, url, anonKey } = body;
    
    if (!url || !anonKey || !query) {
      console.log('Missing parameters:', { url: !url, anonKey: !anonKey, query: !query });
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    console.log('Creating Supabase client...');
    const supabaseAnon = createClient(url, anonKey);

    console.log('Signing in anonymously...');
    const { data: anonSignInData, error: anonSignInError } = await supabaseAnon.auth.signInAnonymously();
    
    if (anonSignInError || !anonSignInData?.session?.access_token) {
      console.error('Anonymous sign in failed:', anonSignInError);
      return NextResponse.json(
        { error: anonSignInError?.message || "Could not sign in anonymously" },
        { status: 400 }
      );
    }

    console.log('Creating authenticated client...');
    const supabaseAuth = createClient(url, anonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${anonSignInData.session.access_token}`,
        },
      },
    });

    console.log('Executing query:', query);
    const func = new Function("supabase", `return (async () => { ${query} })();`);
    const result = await func(supabaseAuth);

    console.log('Query result:', result);
    const safeResult = JSON.parse(JSON.stringify(result));
    return NextResponse.json(safeResult, { status: 200 });
    
  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
