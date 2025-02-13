import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function POST(req: Request): Promise<Response> {
  try {
    const { url, anonKey, query } = await req.json();
    console.log("Received query:", query);

    // Create a client and sign in anonymously
    const supabase = createClient(url, anonKey);
    const { data: authData, error: authError } = await supabase.auth.signInAnonymously();
    if (authError) {
      return NextResponse.json({
        success: false,
        error: authError.message,
        status: 400,
        statusText: "Authentication Failed",
        context: "Anonymous sign-in failed"
      }, { status: 400 });
    }

    // If query doesn't include return statement, add it
    let modifiedQuery = query;
    if (!query.includes('return')) {
      const match = query.match(/const\s*{\s*data\s*,\s*error\s*}\s*=\s*await/);
      if (match) {
        modifiedQuery = `
          ${query}
          return { data, error };
        `;
      }
    }

    // Execute the query
    const wrappedQuery = `
      return (async () => {
        let result = await (async () => {
          ${modifiedQuery}
        })();
        
        // For insert operations, if there's no error, it means the insert succeeded
        if (${query.includes('.insert(')} && !result.error) {
          return {
            data: null,
            error: {
              message: "Insert succeeded when it should have been blocked by RLS",
              code: "SECURITY_VIOLATION",
              details: "Anonymous user was able to insert data"
            }
          };
        }
        return result;
      })();
    `;

    console.log("Wrapped query:", wrappedQuery);

    const func = new Function(
      "supabase",
      wrappedQuery
    );

    const result = await func(supabase);
    console.log("Query result:", result);

    // Ensure result is an object with expected properties
    const response = {
      success: !result?.error,
      data: result?.data ?? null,
      error: result?.error ?? null,
      status: result?.error ? 403 : 200,
      statusText: result?.error ? "Forbidden" : (result?.data ? "OK" : "No Content"),
      context: {
        userRole: "anon",
        operation: query.includes('select') ? 'SELECT' : 
                  query.includes('insert') ? 'INSERT' : 
                  query.includes('update') ? 'UPDATE' : 
                  query.includes('delete') ? 'DELETE' : 'UNKNOWN',
        timestamp: new Date().toISOString()
      }
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      status: 500,
      statusText: "Internal Server Error",
      context: {
        userRole: "anon",
        error: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      }
    }, { status: 500 });
  }
}
