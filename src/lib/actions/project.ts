// /lib/actions/project.ts
"use server";

import { PrismaClient } from '@prisma/client';
import { getUser } from './auth';
import { redirect } from 'next/navigation';

const prisma = new PrismaClient();

  
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
        },
    });

    return { id: project.id, name: project.name }; // Return created project
}


interface UpdateProjectData {
  projectId: string;
  dbSchema: string;
  rlsSchema: string;
  additionalContext: string;
}

export async function updateProjectAction(
  data: UpdateProjectData
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.project.update({
      where: { id: data.projectId },
      data: {
        dbSchema: data.dbSchema,
        rlsSchema: data.rlsSchema,
        additionalContext: data.additionalContext,
      },
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
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
  projects: { id: string; name: string; dbSchema: string; rlsSchema: string; additionalContext?: string }[];
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
    },
  });

  // ✅ Convert `null` to `undefined`
  const formattedProjects = projects.map((project) => ({
    ...project,
    additionalContext: project.additionalContext ?? undefined, // Convert null -> undefined
  }));

  // Fetch the selected project ID from the database
  const userData = await prisma.user.findUnique({
    where: { id: user.id },
    select: { selectedProjectId: true },
  });

  return { 
    projects: formattedProjects, 
    selectedProjectId: userData?.selectedProjectId ?? null // ✅ Ensure selectedProjectId is defined
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