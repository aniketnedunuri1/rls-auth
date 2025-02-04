// app/api/save-supabase-details/route.ts
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { projectDetails, dbDetails, apiKeys, schema } = await req.json();
    // In a real implementation, extract the user ID from the authenticated session.
    const user_id = req.headers.get("x-user-id") || "unknown";

    const { data, error } = await supabase
      .from("user_supabase_details")
      .insert([
        {
          user_id,
          project_url: projectDetails.projectUrl,
          project_id: projectDetails.projectId,
          host: dbDetails.host,
          port: dbDetails.port,
          database: dbDetails.database,
          username: dbDetails.username,
          password: dbDetails.password,
          anon_key: apiKeys.anonKey,
          service_role_key: apiKeys.serviceRoleKey,
          schema,
        },
      ]);

    if (error) {
      console.error("Error saving details:", error);
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
    return NextResponse.json(
      { message: "Server error", err },
      { status: 500 }
    );
  }
}
