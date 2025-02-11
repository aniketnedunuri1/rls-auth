import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    // Wait for both request body and params
    const [{ rlsSchema }, projectId] = await Promise.all([
      request.json(),
      params.projectId
    ]);

    console.log("Updating RLS schema for project:", projectId);
    console.log("New RLS schema:", rlsSchema);

    // Update the project's RLS schema
    const updatedProject = await prisma.project.update({
      where: {
        id: projectId
      },
      data: {
        rlsSchema: rlsSchema
      },
      select: {
        id: true,
        rlsSchema: true
      }
    });

    console.log("Project updated:", updatedProject);

    if (!updatedProject) {
      throw new Error("Failed to update project RLS schema");
    }

    if (updatedProject.rlsSchema !== rlsSchema) {
      throw new Error("RLS schema update verification failed");
    }

    return NextResponse.json({
      success: true,
      message: "RLS schema updated successfully",
      schema: updatedProject.rlsSchema // Return the updated schema for verification
    });

  } catch (error) {
    console.error('Error updating RLS schema:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update RLS schema' 
      },
      { status: 500 }
    );
  }
} 