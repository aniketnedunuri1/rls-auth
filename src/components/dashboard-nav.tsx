"use client"

import { useState } from "react"
import ConnectSupabaseForm from "@/components/ConnectSupabaseForm"
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Database, Play, FileText, Cloud } from "lucide-react";


export default function DashboardNav() {
  const [showModal, setShowModal] = useState(false)

  const openModal = () => setShowModal(true)
  const closeModal = () => setShowModal(false)

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 relative">
            {/* Close Button */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              aria-label="Close modal"
            >
              ×
            </button>
            <ConnectSupabaseForm onClose={closeModal} />
          </div>
        </div>
      )}
    </>
  )
}

