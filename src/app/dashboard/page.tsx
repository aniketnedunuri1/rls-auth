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
import { Loader2, Database, Shield, PlayCircle, FileCheck } from "lucide-react";

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

      dispatch(selectProject(newProject));
      const response = await fetchProjects();
      dispatch(setProjects({ projects: response.projects }));

      router.push(`/dashboard/schema/${newProject.id}`);
    } catch (error) {
      console.error("Project creation failed:", error);
      setIsLoading(false);
    }
  };

  const steps = [
    {
      icon: <Database className="w-8 h-8 text-blue-500" />,
      title: "Define Your Schema",
      description: "Start by inputting your database schema. This forms the foundation of your security testing."
    },
    {
      icon: <Shield className="w-8 h-8 text-green-500" />,
      title: "Add RLS Policies",
      description: "Specify your Row Level Security policies to define access control rules."
    },
    {
      icon: <PlayCircle className="w-8 h-8 text-purple-500" />,
      title: "Generate & Run Tests",
      description: "Automatically generate security tests and run them against your schema."
    },
    {
      icon: <FileCheck className="w-8 h-8 text-orange-500" />,
      title: "Review Results",
      description: "We will generate you a new RLS policy that is secure and compliant with your schema."
    }
  ];

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold tracking-tight mb-4">
            <span className="bg-gradient-to-r from-purple-400 to-pink-500 text-transparent bg-clip-text">clamp</span>
          </h1>
          <p className="text-lg text-gray-400">
            Automated RLS policy testing and validation
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Steps Section */}
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold mb-6 tracking-tight">How It Works</h2>
            <div className="space-y-6">
              {steps.map((step, index) => (
                <Card key={index} className="border border-white/10 bg-[#0f0f0f] rounded-md">
                  <CardContent className="flex items-start gap-4 p-5">
                    <div className="shrink-0">
                      <div className="w-10 h-10 rounded-md bg-purple-600/10 flex items-center justify-center">
                        {step.icon}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-base mb-1">
                        {index + 1}. {step.title}
                      </h3>
                      <p className="text-gray-400 text-sm">
                        {step.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Create Project Card */}
          <div className="flex items-center justify-center h-full">
            <Card className="w-full max-w-md p-5 border border-white/10 bg-[#0f0f0f] rounded-md">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-xl font-bold">Get started</CardTitle>
                <CardDescription className="mt-2 text-gray-400">
                  Create a new project to begin securing your database.
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-4 px-0">
                <form onSubmit={handleCreateProject}>
                  <Input
                    name="projectName"
                    placeholder="Project Name"
                    required
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    disabled={isLoading}
                    className="bg-[#0a0a0a] border-white/10 focus:border-purple-500/50 rounded-md"
                  />
                  <CardFooter className="mt-4 px-0">
                    <Button 
                      type="submit" 
                      disabled={isLoading}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-md"
                    >
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
        </div>
      </div>
    </div>
  );
}
