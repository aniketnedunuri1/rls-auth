"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NoProjectPage() {
  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-48px)] text-gray-400">
      <h2 className="text-2xl font-semibold mb-4 tracking-tight">No project selected</h2>
      <p className="mb-6 text-sm">Please create or select a project to access this page.</p>
      <Link href="/dashboard">
        <Button className="bg-purple-600 hover:bg-purple-700 text-white rounded-md">Go to Dashboard</Button>
      </Link>
    </div>
  );
}
