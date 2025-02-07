// src/app/api/update-project/route.ts
import { NextResponse } from "next/server";
import { updateProjectAction } from "@/lib/actions/project";

export async function POST(req: Request): Promise<Response> {
  try {
    // Parse the incoming JSON body.
    const data = await req.json();
    const { projectId, dbSchema, rlsSchema, additionalContext } = data;

    // Validate required parameters.
    if (!projectId || !dbSchema || !rlsSchema) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Call your server-side updateProjectAction.
    const result = await updateProjectAction({ projectId, dbSchema, rlsSchema, additionalContext });

    if (result.success) {
      return NextResponse.json({ success: true }, { status: 200 });
    } else {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
