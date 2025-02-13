"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { selectProject, setProjects } from "@/lib/projectSlice";
import { createProjectAction, fetchProjects } from "@/lib/actions/project";
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
  const [projectName, setProjectName] = useState("");
  const router = useRouter();
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const newProject = await createProjectAction(new FormData(e.target as HTMLFormElement));
      if (!newProject) return;

      dispatch(selectProject(newProject)); // Set selected project
      const response = await fetchProjects();
      dispatch(setProjects({ projects: response.projects }));

      router.push(`/dashboard/schema/${newProject.id}`); // Redirect user
    } catch (error) {
      console.error("Project creation failed:", error);
      setIsLoading(false); // Only reset on error
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-background">
      <Card className="w-96 p-6 text-center">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Get started</CardTitle>
          <CardDescription className="mt-2 text-gray-600">
            Create a new project to begin.
          </CardDescription>
        </CardHeader>
        <CardContent className="mt-4">
          <form onSubmit={handleCreateProject}>
            <Input
              name="projectName"
              placeholder="Project Name"
              required
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              disabled={isLoading}
            />
            <CardFooter className="mt-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Project"
                )}
              </Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
