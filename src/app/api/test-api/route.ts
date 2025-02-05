// app/api/test-supabase/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Mark the route as dynamic if needed.
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    // For example, expect the public URL and anon key to be passed as query params:
    const { searchParams } = new URL(req.url);
    const publicUrl = searchParams.get("publicUrl");
    const anonKey = searchParams.get("anonKey");

    if (!publicUrl || !anonKey) {
      return NextResponse.json({ message: "Missing publicUrl or anonKey" }, { status: 400 });
    }

    // Create a Supabase client using the provided parameters.
    const supabase = createClient(publicUrl, anonKey);

    // Run a simple query to test connectivity.
    // For example, list all rows from a public table (replace "your_public_table" with an actual table name)
    const { data, error } = await supabase
      .from("user-information")
      .select("*")
      .limit(1);

    if (error) {
      return NextResponse.json({ message: "Query failed", error }, { status: 500 });
    }

    return NextResponse.json({ message: "Query succeeded", data }, { status: 200 });
  } catch (err) {
    console.error("Error in test-supabase route:", err);
    return NextResponse.json({ message: "Server error", err }, { status: 500 });
  }
}
