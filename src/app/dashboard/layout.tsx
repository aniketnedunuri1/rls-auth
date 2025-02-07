// import { Button } from "@/components/ui/button"
// import Link from "next/link"
// import { LayoutDashboard, Database, Play, FileText } from "lucide-react"
// // import { ProjectSwitcher } from "@/components/project-switcher"
// import type React from "react" // Import React

// export default function DashboardLayout({
//   children,
// }: {
//   children: React.ReactNode
// }) {
//   return (
//     <div className="flex h-screen bg-background">
//       <aside className="w-64 bg-card border-r">
//         {/* <div className="p-4 border-b">
//           <ProjectSwitcher />
//         </div> */}
//         <nav className="space-y-2 p-4">
//           <Link href="/dashboard">
//             <Button variant="ghost" className="w-full justify-start">
//               <LayoutDashboard className="mr-2 h-4 w-4" />
//               Dashboard
//             </Button>
//           </Link>
//           <Link href="/dashboard/schema">
//             <Button variant="ghost" className="w-full justify-start">
//               <Database className="mr-2 h-4 w-4" />
//               Schema
//             </Button>
//           </Link>
//           <Link href="/dashboard/tests">
//             <Button variant="ghost" className="w-full justify-start">
//               <Play className="mr-2 h-4 w-4" />
//               Tests
//             </Button>
//           </Link>
//           <Link href="/dashboard/results">
//             <Button variant="ghost" className="w-full justify-start">
//               <FileText className="mr-2 h-4 w-4" />
//               Results
//             </Button>
//           </Link>
//         </nav>
//       </aside>
//       <main className="flex-1 overflow-y-auto">{children}</main>
//     </div>
//   )
// }

import DashboardNav from "@/components/dashboard-nav"; 
import { setProjects } from "@/lib/projectSlice";
import { fetchProjects } from "@/lib/actions/project";
import { store } from "@/lib/store";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const projects = await fetchProjects(); // Fetch projects on the server side

  // Dispatch projects to Redux store on the server side
  store.dispatch(setProjects(projects));
  
  return (
    <div className="flex h-screen bg-background">
      <aside className="w-64 bg-card border-r">
        <DashboardNav /> 
      </aside>
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}