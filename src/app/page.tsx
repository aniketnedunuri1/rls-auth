// /app/page.tsx
import { createServerSupabaseClient } from "@/lib/supabase-server-client";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default async function HomePage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="flex justify-between items-center p-6">
        <div className="flex items-center">
          <span className="text-2xl font-bold">clamp</span>
          <span className="text-orange-500 text-2xl font-bold">.</span>
        </div>
        <div className="flex gap-6">
          <Link href="/home" className="text-gray-300 hover:text-white">Home</Link>
          <Link href="/support" className="text-gray-300 hover:text-white">Support</Link>
          <Link href="/privacy" className="text-gray-300 hover:text-white">Privacy</Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 pt-20">
        <div className="text-center space-y-6 mb-16">
          {/* Main Heading */}
          <h1 className="text-6xl font-bold leading-tight">
            You&apos;ve been thinking about security
            <br />
            <span className="text-orange-500">backwards</span>
          </h1>

          {/* Subheading */}
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            It&apos;s not just about writing policies, but also how accurately they protect your data. Test and validate your RLS policies with clampdb.
          </p>

          {/* CTA Button */}
          <div className="mt-12">
            <Link
              href="/login"
              className="bg-black hover:bg-gray-900 text-white border-2 border-white px-8 py-3 rounded-full font-medium transition-all hover:shadow-lg inline-block"
            >
              Start Now
            </Link>
          </div>
        </div>

        {/* App Screenshot */}
        <div className="relative max-w-2xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden shadow-2xl border-8 border-gray-900">
            <Image
              src="/beta.png" // Make sure to add your screenshot to the public folder
              alt="RLS Policy Testing Interface"
              width={800}
              height={600}
              className="w-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
