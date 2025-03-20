import DashboardNav from "@/components/dashboard-nav"; 
import { setProjects } from "@/lib/projectSlice";
import { fetchProjects } from "@/lib/actions/project";
import { store } from "@/lib/store";
import { getSession } from '@/lib/actions/auth'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  
  if (!session) {
    redirect('/login')
  }

  // Fetch projects and set up dashboard state
  const projects = await fetchProjects();
  store.dispatch(setProjects(projects));
  
  return (
    <div className="flex h-screen bg-[#0a0a0a] text-white">
      <aside className="w-64 bg-[#0f0f0f] border-r border-white/5">
        <DashboardNav /> 
      </aside>
      <main className="flex-1 overflow-y-auto p-6">
        {/* Pass session to children if needed */}
        {children}
      </main>
    </div>
  );
}