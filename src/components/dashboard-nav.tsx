"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Database, Play, FileText } from "lucide-react";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import ProjectSelector from "./project-selector";

export default function DashboardNav() {
  const selectedProject = useSelector((state: RootState) => state.project.selectedProject);

  return (
    <nav className="space-y-2 p-4">
      <ProjectSelector /> {/* Displays project selection */}

      <Link href="/dashboard">
        <Button variant="ghost" className="w-full justify-start">
          <LayoutDashboard className="mr-2 h-4 w-4" />
          Dashboard
        </Button>
      </Link>

      <Link href={selectedProject ? `/dashboard/schema/${selectedProject.id}` : "/dashboard/no-project"}>
        <Button variant="ghost" className="w-full justify-start">
          <Database className="mr-2 h-4 w-4" />
          Schema
        </Button>
      </Link>

      <Link href={selectedProject ? `/dashboard/tests/${selectedProject.id}` : "/dashboard/no-project"}>
        <Button variant="ghost" className="w-full justify-start">
          <Play className="mr-2 h-4 w-4" />
          Tests
        </Button>
      </Link>

      <Link href={selectedProject ? `/dashboard/results/${selectedProject.id}` : "/dashboard/no-project"}>
        <Button variant="ghost" className="w-full justify-start">
          <FileText className="mr-2 h-4 w-4" />
          Results
        </Button>
      </Link>
    </nav>
  );
}
