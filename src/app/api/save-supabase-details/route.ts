// app/api/save-supabase-details/route.ts
import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    // Extract the connection details from the request body.
    const { connectionString, password } = await req.json();

    // Create a Supabase client for this route using the request cookies.
    const supabaseServer = createRouteHandlerClient({ cookies });

    // Retrieve the current session to obtain the authenticated user's ID.
    const {
      data: { session },
      error: sessionError,
    } = await supabaseServer.auth.getSession();

    if (sessionError || !session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const user_id = session.user.id;

    // Update the "user-information" table with the connection details.
    const { data, error } = await supabaseServer
      .from("user-information")
      .update({
        pg_url: connectionString,
        pg_password: password,
      })
      .eq("id", user_id);

    if (error) {
      console.error("Error saving connection details:", error);
      return NextResponse.json(
        { message: "Failed to save details", error },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Details saved successfully", data },
      { status: 200 }
    );
  } catch (err) {
    console.error("Server error:", err);
    return NextResponse.json(
      { message: "Server error", err },
      { status: 500 }
    );
  }
}
