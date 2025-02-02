"use client";  // ✅ This makes it a Client Component

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Database, Play, FileText } from "lucide-react";

export default function DashboardNav() {
  return (
    <nav className="space-y-2 p-4">
      <Link href="/dashboard">
        <Button variant="ghost" className="w-full justify-start">
          <LayoutDashboard className="mr-2 h-4 w-4" />
          Dashboard
        </Button>
      </Link>
      <Link href="/dashboard/schema">
        <Button variant="ghost" className="w-full justify-start">
          <Database className="mr-2 h-4 w-4" />
          Schema
        </Button>
      </Link>
      <Link href="/dashboard/tests">
        <Button variant="ghost" className="w-full justify-start">
          <Play className="mr-2 h-4 w-4" />
          Tests
        </Button>
      </Link>
      <Link href="/dashboard/results">
        <Button variant="ghost" className="w-full justify-start">
          <FileText className="mr-2 h-4 w-4" />
          Results
        </Button>
      </Link>
    </nav>
  );
}
