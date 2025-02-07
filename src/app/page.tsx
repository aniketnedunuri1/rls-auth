// /app/page.tsx
import { createServerSupabaseClient } from "@/lib/supabase-server-client";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <h1 className="text-3xl font-bold mb-4">Welcome to Our App</h1>
      <p className="mb-8">
        Please <a href="/login" className="text-blue-500 underline">Login</a> or <a href="/register" className="text-blue-500 underline">Register</a> to continue.
      </p>
    </div>
  );
}
