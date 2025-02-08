// import { useEffect, useState } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { RootState } from "@/lib/store";
// import { selectProject, setProjects } from "@/lib/projectSlice";
// import { Button } from "@/components/ui/button";
// import { ChevronDown } from "lucide-react";
// import { fetchProjects, updateSelectedProject } from "@/lib/actions/project"; 
// import { useRouter } from "next/navigation";

// export default function ProjectSelector() {
//   const dispatch = useDispatch();
//   const projects = useSelector((state: RootState) => state.project.projects);
//   const selectedProject = useSelector((state: RootState) => state.project.selectedProject);
//   const [dropdownOpen, setDropdownOpen] = useState(false);
//   const router = useRouter(); 

//   useEffect(() => {
//     async function loadProjects() {
//       try {
//         const { projects, selectedProjectId } = await fetchProjects();
//         dispatch(setProjects(projects));
  
//         // ✅ Ensure selectedProjectId is properly handled
//         if (selectedProjectId) {
//           const foundProject = projects.find((p) => p.id === selectedProjectId);
//           if (foundProject) {
//             dispatch(selectProject(foundProject));
//           }
//         }
//       } catch (error) {
//         console.error("Error fetching projects:", error);
//       }
//     }
//     loadProjects();
//   }, [dispatch]);

//   const handleSelectProject = async (project: { id: string; name: string }) => {
//     dispatch(selectProject(project)); // Set in Redux
//     setDropdownOpen(false);
//     router.push(`/dashboard/schema/${project.id}`);

//     // ✅ Save the selected project in the database
//     await updateSelectedProject(project.id);
//   };

//   return (
//     <div className="relative">
//       <Button
//         onClick={() => setDropdownOpen(!dropdownOpen)}
//         className="flex items-center justify-between w-full bg-card px-4 py-2 border rounded-md"
//       >
//         {selectedProject ? selectedProject.name : "Select a Project"}
//         <ChevronDown className="w-4 h-4 ml-2" />
//       </Button>

//       {dropdownOpen && (
//         <div className="absolute left-0 w-full mt-2 bg-background border rounded-md shadow-lg z-50">
//           <ul className="max-h-60 overflow-auto">
//             {projects.length > 0 ? (
//               projects.map((project) => (
//                 <li
//                   key={project.id}
//                   onClick={() => handleSelectProject(project)}
//                   className={`px-4 py-2 cursor-pointer ${
//                     selectedProject?.id === project.id ? "bg-muted" : "hover:bg-accent"
//                   }`}
//                 >
//                   {project.name}
//                 </li>
//               ))
//             ) : (
//               <li className="px-4 py-2 text-gray-500">No projects available</li>
//             )}
//           </ul>
//         </div>
//       )}
//     </div>
//   );
// }

// import { useEffect, useState } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { RootState } from "@/lib/store";
// import { selectProject, setProjects } from "@/lib/projectSlice";
// import { Button } from "@/components/ui/button";
// import { ChevronDown, Check } from "lucide-react";
// import { fetchProjects, updateSelectedProject } from "@/lib/actions/project";
// import { useRouter } from "next/navigation";

// export default function ProjectSelector() {
//   const dispatch = useDispatch();
//   const projects = useSelector((state: RootState) => state.project.projects);
//   const selectedProject = useSelector((state: RootState) => state.project.selectedProject);
//   const [dropdownOpen, setDropdownOpen] = useState(false);
//   const [searchTerm, setSearchTerm] = useState("");
//   const router = useRouter();

//   useEffect(() => {
//     async function loadProjects() {
//       try {
//         const { projects, selectedProjectId } = await fetchProjects();
//         dispatch(setProjects(projects));

//         if (selectedProjectId) {
//           const foundProject = projects.find((p) => p.id === selectedProjectId);
//           if (foundProject) {
//             dispatch(selectProject(foundProject));
//           }
//         }
//       } catch (error) {
//         console.error("Error fetching projects:", error);
//       }
//     }
//     loadProjects();
//   }, [dispatch]);

//   const handleSelectProject = async (project: { id: string; name: string }) => {
//     dispatch(selectProject(project));
//     setDropdownOpen(false);
//     router.push(`/dashboard/schema/${project.id}`);
//     await updateSelectedProject(project.id);
//   };

//   const filteredProjects = projects.filter((project) =>
//     project.name.toLowerCase().includes(searchTerm.toLowerCase())
//   );

//   return (
//     <div className="relative w-48"> {/* Reduced width */}
//       <Button
//         onClick={() => setDropdownOpen(!dropdownOpen)}
//         className="flex items-center justify-between w-full bg-[#1E1E1E] text-white px-2 py-1 text-sm border border-[#333] rounded-md shadow-md"
//       >
//         {selectedProject ? selectedProject.name : "Find project..."}
//         <ChevronDown className="w-3 h-3 ml-2" /> {/* Smaller icon */}
//       </Button>

//       {dropdownOpen && (
//         <div className="absolute left-0 w-full mt-1 bg-[#1E1E1E] border border-[#333] rounded-md shadow-lg z-50 text-sm">
//           {/* Search Bar */}
//           <input
//             type="text"
//             placeholder="Find project..."
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             className="w-full px-3 py-1 bg-[#292929] text-white text-xs outline-none border-b border-[#333]"
//           />

//           {/* Project List */}
//           <ul className="max-h-48 overflow-auto">
//             {filteredProjects.length > 0 ? (
//               filteredProjects.map((project) => (
//                 <li
//                   key={project.id}
//                   onClick={() => handleSelectProject(project)}
//                   className={`flex justify-between px-3 py-1 cursor-pointer text-white hover:bg-[#333] ${
//                     selectedProject?.id === project.id ? "bg-[#333]" : ""
//                   }`}
//                 >
//                   {project.name}
//                   {selectedProject?.id === project.id && <Check className="w-3 h-3 text-gray-400" />} {/* Smaller checkmark */}
//                 </li>
//               ))
//             ) : (
//               <li className="px-3 py-1 text-gray-500 text-xs">No projects found</li>
//             )}
//           </ul>

//           {/* New Project Button */}
//           <button className="w-full text-left px-3 py-1 text-xs text-[#aaa] hover:bg-[#292929]">
//             + New project
//           </button>
//         </div>
//       )}
//     </div>
//   );
// }

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
        const { projects, selectedProjectId } = await fetchProjects();
        dispatch(setProjects(projects));
  
        // ✅ Only update selectedProject if it's null (prevents unwanted resets)
        if (!selectedProject && selectedProjectId) {
          const foundProject = projects.find((p) => p.id === selectedProjectId);
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
          <button className="w-full text-left px-3 py-1 text-xs text-[#aaa] hover:bg-[#292929]">
            + New project
          </button>
        </div>
      )}
    </div>
  );
}
