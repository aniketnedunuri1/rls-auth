// /lib/actions/project.ts
"use server";

import { PrismaClient } from '@prisma/client';
import { getUser } from './auth';
import { redirect } from 'next/navigation';

const prisma = new PrismaClient();


  
// export async function createProjectAction(formData: FormData): Promise<void> {
// // Extract the project name from the form data
//     const projectName = formData.get("projectName") as string;
//     if (!projectName || !projectName.trim()) {
//         throw new Error("Project name is required.");
//     }

//     // Get the current user using your getUser function
//     const user = await getUser();
//     if (!user) {
//         throw new Error("User not logged in.");
//     }

//     // Create the project record in your database
//     const project = await prisma.project.create({
//         data: {
//         name: projectName,
//         userId: user.id, // use the user's ID from your auth system
//         dbSchema: "",
//         rlsSchema: "",
//         additionalContext: "",
//         },
//     });

//     redirect(`/dashboard/schema/${project.id}`);
// }
  
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

export async function fetchProjects(): Promise<{ id: string; name: string }[]> {
  const user = await getUser();
  if (!user) return [];

  return await prisma.project.findMany({
    where: { userId: user.id },
    select: { id: true, name: true },
  });
}