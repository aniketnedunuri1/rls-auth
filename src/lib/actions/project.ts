// /lib/actions/project.ts
"use server";

import { getUser } from './auth';
import { redirect } from 'next/navigation';
import { prisma } from '../prisma';  // Import the singleton instance

export async function createProjectAction(formData: FormData): Promise<{ id: string; name: string } | null> {
    const projectName = formData.get("projectName") as string;
    if (!projectName || !projectName.trim()) {
        throw new Error("Project name is required.");
    }

    const user = await getUser();
    if (!user) {
        throw new Error("User not logged in.");
    }

    const project = await prisma.project.create({
        data: {
            name: projectName,
            userId: user.id,
            dbSchema: "",
            rlsSchema: "",
            additionalContext: "",
            supabaseUrl: "",
            supabaseAnonKey: "",
        },
    });

    return { id: project.id, name: project.name }; // Return created project
}


interface UpdateProjectData {
  projectId: string;
  dbSchema: string;
  rlsSchema: string;
  additionalContext: string;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
}

export async function updateProjectAction(
  data: UpdateProjectData
): Promise<{ success: boolean; error?: string }> {
  try {
    // First check if the project exists
    const existingProject = await prisma.project.findUnique({
      where: { id: data.projectId },
    });

    if (!existingProject) {
      return { 
        success: false, 
        error: `Project with ID ${data.projectId} not found` 
      };
    }

    // Also check if the user has access to this project
    const user = await getUser();
    if (!user) {
      return { 
        success: false, 
        error: "User not authenticated" 
      };
    }

    if (existingProject.userId !== user.id) {
      return { 
        success: false, 
        error: "User does not have permission to update this project" 
      };
    }

    // If all checks pass, update the project
    await prisma.project.update({
      where: { id: data.projectId },
      data: {
        dbSchema: data.dbSchema,
        rlsSchema: data.rlsSchema,
        additionalContext: data.additionalContext,
        supabaseUrl: data.supabaseUrl,
        supabaseAnonKey: data.supabaseAnonKey,
      },
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error updating project:", error);
    return { 
      success: false, 
      error: error.message || "Failed to update project" 
    };
  }
}

// export async function fetchProjects() {
//   const user = await getUser();
//   if (!user) return [];

//   return await prisma.project.findMany({
//     where: { userId: user.id },
//     select: { 
//       id: true, 
//       name: true,
//       dbSchema: true,
//       rlsSchema: true,
//       additionalContext: true
//     },
//   });

  
// }
export async function fetchProjects(): Promise<{
  projects: { id: string; name: string; dbSchema: string; rlsSchema: string; additionalContext?: string | null, supabaseUrl?: string | null, supabaseAnonKey?: string | null }[];
  selectedProjectId: string | null;
}> {
  const user = await getUser();
  if (!user) return { projects: [], selectedProjectId: null }; // ✅ Ensure consistent return structure

  const projects = await prisma.project.findMany({
    where: { userId: user.id },
    select: { 
      id: true, 
      name: true,
      dbSchema: true,
      rlsSchema: true,
      additionalContext: true, // Prisma returns `string | null`
      supabaseUrl: true,
      supabaseAnonKey: true,
    },
  });

  // Fetch the selected project ID from the database
  const userData = await prisma.user.findUnique({
    where: { id: user.id },
    select: { selectedProjectId: true },
  });

  return { 
    projects: projects, 
    selectedProjectId: userData?.selectedProjectId ?? null
  };
}


export async function updateSelectedProject(projectId: string) {
  const user = await getUser();
  if (!user) {
    throw new Error("User not logged in.");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { selectedProjectId: projectId },
  });
}