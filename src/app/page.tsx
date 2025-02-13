// /app/page.tsx
import { createServerSupabaseClient } from "@/lib/supabase-server-client";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function HomePage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center space-y-8">
        {/* Logo */}
        <h1 className="text-7xl font-bold tracking-tighter">
          <span className="text-white">clamp</span>
          <span className="text-orange-500">.</span>
        </h1>

        {/* Tagline */}
        <p className="text-gray-400 text-xl max-w-md mx-auto">
          Automated RLS policy testing and validation
        </p>

        {/* CTA Buttons */}
        <div className="flex gap-4 justify-center mt-12">
          <Link 
            href="/register" 
            className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-lg font-medium transition-colors"
          >
            Get Started
          </Link>
          <Link 
            href="/login" 
            className="border border-gray-700 hover:border-orange-500 text-gray-300 hover:text-orange-500 px-8 py-3 rounded-lg font-medium transition-colors"
          >
            Log In
          </Link>
        </div>
      </div>
    </div>
  );
}
