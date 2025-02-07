"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NoProjectPage() {
  return (
    <div className="flex flex-col items-center justify-center h-screen text-gray-600">
      <h2 className="text-2xl font-semibold mb-4">No project selected</h2>
      <p className="mb-6">Please create or select a project to access this page.</p>
      <Link href="/dashboard">
        <Button variant="default">Go to Dashboard</Button>
      </Link>
    </div>
  );
}
