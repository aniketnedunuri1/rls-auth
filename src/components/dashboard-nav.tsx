// components/DashboardNav.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Database, Play, FileText, Cloud } from "lucide-react";
import ConnectSupabaseForm from "@/components/ConnectSupabaseForm";

export default function DashboardNav() {
  const [showModal, setShowModal] = useState(false);

  const openModal = () => setShowModal(true);
  const closeModal = () => setShowModal(false);

  return (
    <>
      <nav className="flex flex-col h-full space-y-2 p-4">
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
        <div className="mt-auto pt-4">
          <Button variant="ghost" className="w-full justify-start" onClick={openModal}>
            <Cloud className="mr-2 h-4 w-4" />
            Connect Supabase Project
          </Button>
        </div>
      </nav>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80">
          <div className="bg-black rounded shadow-lg w-full max-w-3xl p-6 relative text-white">
            {/* Close Button */}
            <button
              onClick={closeModal}
              className="absolute top-2 right-2 text-xl font-bold hover:text-red-600"
              aria-label="Close modal"
            >
              &times;
            </button>
            <ConnectSupabaseForm onClose={closeModal} />
          </div>
        </div>
      )}
    </>
  );
}
