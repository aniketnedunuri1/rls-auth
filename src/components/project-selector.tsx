import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import { selectProject, setProjects } from "@/lib/projectSlice";
import { Button } from "@/components/ui/button";
import { ChevronDown, Check } from "lucide-react";
import { fetchProjects, updateSelectedProject } from "@/lib/actions/project";
import { useRouter } from "next/navigation";

export default function ProjectSelector() {
  const dispatch = useDispatch();
  const projects = useSelector((state: RootState) => state.project.projects);
  const selectedProject = useSelector((state: RootState) => state.project.selectedProject);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function loadProjects() {
      try {
        const response = await fetchProjects();
        dispatch(setProjects({ projects: response.projects }));
  
        // ✅ Only update selectedProject if it's null (prevents unwanted resets)
        if (!selectedProject && response.selectedProjectId) {
          const foundProject = response.projects.find((p) => p.id === response.selectedProjectId);
          if (foundProject) {
            dispatch(selectProject(foundProject));
          }
        }
      } catch (error) {
        console.error("Error fetching projects:", error);
      }
    }
    loadProjects();
  }, [dispatch, selectedProject]); 

  const handleSelectProject = async (project: { id: string; name: string }) => {
    dispatch(selectProject(project));
    setDropdownOpen(false);
    router.push(`/dashboard/schema/${project.id}`);
    await updateSelectedProject(project.id);
  };

  const handleNewProject = () => {
    setDropdownOpen(false);
    router.push('/dashboard'); // Redirect to dashboard for new project creation
  };

  return (
    <div className="relative w-48"> {/* Reduced width */}
      <Button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center justify-between w-full bg-[#1E1E1E] text-white px-2 py-1 text-sm border border-[#333] rounded-md shadow-md"
      >
        {selectedProject ? selectedProject.name : "Select a Project"}
        <ChevronDown className="w-3 h-3 ml-2" /> {/* Smaller icon */}
      </Button>

      {dropdownOpen && (
        <div className="absolute left-0 w-full mt-1 bg-[#1E1E1E] border border-[#333] rounded-md shadow-lg z-50 text-sm">
          {/* Project List (No Search) */}
          <ul className="max-h-48 overflow-auto">
            {projects.length > 0 ? (
              projects.map((project) => (
                <li
                  key={project.id}
                  onClick={() => handleSelectProject(project)}
                  className={`flex justify-between px-3 py-1 cursor-pointer text-white hover:bg-[#333] ${
                    selectedProject?.id === project.id ? "bg-[#333]" : ""
                  }`}
                >
                  {project.name}
                  {selectedProject?.id === project.id && <Check className="w-3 h-3 text-gray-400" />} {/* Smaller checkmark */}
                </li>
              ))
            ) : (
              <li className="px-3 py-1 text-gray-500 text-xs">No projects available</li>
            )}
          </ul>

          {/* New Project Button */}
          <button 
            onClick={handleNewProject}
            className="w-full text-left px-3 py-1 text-xs text-[#aaa] hover:bg-[#292929]"
          >
            + New project
          </button>
        </div>
      )}
    </div>
  );
}
