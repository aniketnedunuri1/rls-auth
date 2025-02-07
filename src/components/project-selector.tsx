"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import { selectProject, setProjects } from "@/lib/projectSlice";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { fetchProjects } from "@/lib/actions/project"; // ✅ Import direct fetch
import { useRouter } from "next/navigation";


export default function ProjectSelector() {
  const dispatch = useDispatch();
  const projects = useSelector((state: RootState) => state.project.projects);
  const selectedProject = useSelector((state: RootState) => state.project.selectedProject);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const router = useRouter(); 

  // ✅ Fetch projects directly from actions instead of an API call
  useEffect(() => {
    async function loadProjects() {
      try {
        const data = await fetchProjects();
        dispatch(setProjects(data));
        
        // Automatically select the first project if none is selected
        if (data.length > 0 && !selectedProject) {
          dispatch(selectProject(data[0]));
        }
      } catch (error) {
        console.error("Error fetching projects:", error);
      }
    }
    loadProjects();
  }, [dispatch]);
  

  const handleSelectProject = (project: { id: string; name: string }) => {
    dispatch(selectProject(project)); // Set selected project in Redux
    setDropdownOpen(false);
    router.push(`/dashboard/schema/${project.id}`);
  };

  return (
    <div className="relative">
      <Button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center justify-between w-full bg-card px-4 py-2 border rounded-md"
      >
        {selectedProject ? selectedProject.name : "Select a Project"}
        <ChevronDown className="w-4 h-4 ml-2" />
      </Button>

      {dropdownOpen && (
        <div className="absolute left-0 w-full mt-2 bg-background border rounded-md shadow-lg z-50">
          <ul className="max-h-60 overflow-auto">
            {projects.length > 0 ? (
              projects.map((project) => (
                <li
                  key={project.id}
                  onClick={() => handleSelectProject(project)}
                  className={`px-4 py-2 cursor-pointer ${
                    selectedProject?.id === project.id ? "bg-muted" : "hover:bg-accent"
                  }`}
                >
                  {project.name}
                </li>
              ))
            ) : (
              <li className="px-4 py-2 text-gray-500">No projects available</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
