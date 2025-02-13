// src/app/api/run-test/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Global cache for the anonymous session
let cachedAnonSession: any = null;

export const dynamic = "force-dynamic";

export async function POST(req: Request): Promise<Response> {
  try {
    const { url, anonKey, query } = await req.json();
    console.log("Received query:", query);

    let supabase;
    if (!cachedAnonSession) {
      // Create client normally and sign in anonymously
      supabase = createClient(url, anonKey);
      const { data: authData, error: authError } = await supabase.auth.signInAnonymously();
      if (authError) {
        return NextResponse.json(
          {
            success: false,
            error: authError.message,
            status: 400,
            statusText: "Authentication Failed",
            context: "Anonymous sign-in failed",
          },
          { status: 400 }
        );
      }
      cachedAnonSession = authData.session;
      console.log("Cached new anonymous session");
    } else {
      // Reinitialize the client with the cached token in the global headers
      supabase = createClient(url, anonKey, {
        global: {
          headers: {
            Authorization: `Bearer ${cachedAnonSession.access_token}`,
          },
        },
      });
      console.log("Using cached anonymous session");
    }

    // If query doesn't include a return statement, add it
    let modifiedQuery = query;
    if (!query.includes("return")) {
      const match = query.match(/const\s*{\s*data\s*,\s*error\s*}\s*=\s*await/);
      if (match) {
        modifiedQuery = `
          ${query}
          return { data, error };
        `;
      }
    }

    const wrappedQuery = `
      return (async () => {
        let result = await (async () => {
          ${modifiedQuery}
        })();
        
        // For insert operations, if there's no error, we assume it succeeded and flag it as a security violation
        if (${query.includes(".insert(")} && !result.error) {
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

    const func = new Function("supabase", wrappedQuery);
    const result = await func(supabase);
    console.log("Query result:", result);

    return NextResponse.json({
      success: !result?.error,
      data: result?.data ?? null,
      error: result?.error ?? null,
      status: result?.error ? 403 : 200,
      statusText: result?.error ? "Forbidden" : (result?.data ? "OK" : "No Content"),
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        status: 500,
        statusText: "Internal Server Error",
      },
      { status: 500 }
    );
  }
}
