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
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Navigation */}
      <nav className="flex flex-row justify-between items-center py-4 px-4 md:px-6 max-w-7xl mx-auto border-b border-white/5 bg-[#0a0a0a]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center">
          <span className="text-2xl md:text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 text-transparent bg-clip-text tracking-tight">clamp</span>
        </div>
        <div className="flex flex-row items-center gap-4 md:gap-8">
          <div className="flex gap-6 md:gap-8">
            {/* <div className="relative group">
              <span className="text-gray-200 hover:text-white cursor-pointer">Features</span>
              <span className="ml-1 text-gray-400">▾</span>
            </div>
            <div className="relative group">
              <span className="text-gray-200 hover:text-white cursor-pointer">Company</span>
              <span className="ml-1 text-gray-400">▾</span>
            </div>
            <div className="relative group">
              <span className="text-gray-200 hover:text-white cursor-pointer">Resources</span>
              <span className="ml-1 text-gray-400">▾</span>
            </div>
            <div className="relative group">
              <span className="text-gray-200 hover:text-white cursor-pointer">Docs</span>
              <span className="ml-1 text-gray-400">▾</span>
            </div> */}
            {/* <Link href="/pricing" className="text-gray-200 hover:text-white">
              Pricing
            </Link> */}
          </div>
          <div className="flex items-center gap-3 md:gap-4">
            <Link href="/login" className="text-gray-400 hover:text-white text-sm font-medium transition-colors">
              Log in
            </Link>
            <Link
              href="/register"
              className="w-auto bg-white text-black px-4 md:px-5 py-1.5 md:py-2 rounded-md font-medium transition-all duration-200 hover:bg-gray-100 text-center text-sm"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-24 md:pt-32 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-16 items-center">
          <div className="space-y-6 md:space-y-8 text-center lg:text-left max-w-2xl mx-auto lg:mx-0">
            {/* Feature announcement button */}
            <Link href="/features" className="inline-flex items-center px-3 py-1.5 rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-300 hover:text-purple-200 transition-all duration-200 group text-xs font-medium">
              <span>Introducing authenticated role testing</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 ml-1.5 transform group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            
            {/* Main Heading */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-white tracking-tight">
              Test your RLS<br />before hackers do
            </h1>

            {/* Subheading */}
            <p className="text-lg md:text-xl text-gray-400 max-w-xl mx-auto lg:mx-0 leading-relaxed mb-2">
              Automatically generate and run attack vectors against your database's Row Level Security policies to find vulnerabilities before they're exploited.
            </p>
            <p className="text-base md:text-lg text-gray-400 max-w-xl mx-auto lg:mx-0 mb-4">
              <span className="text-purple-400">✓</span> Works with Supabase
              <span className="mx-3">•</span>
              <span className="text-purple-400">✓</span> No code changes required
              <span className="mx-3">•</span>
              <span className="text-purple-400">✓</span> Actionable results
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center lg:justify-start">
              <Link
                href="/register"
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-md font-medium transition-colors duration-200 text-center text-base"
              >
                Test Your Policies
              </Link>
              <Link
                href="#how-it-works"
                className="border border-white/10 hover:border-white/20 text-gray-300 hover:text-white px-6 py-3 rounded-md font-medium transition-colors duration-200 text-center text-base"
              >
                How It Works
              </Link>
            </div>
          </div>
          
          {/* 3D Visual Element */}
          <div className="relative mt-8 lg:mt-0">
            <div className="w-full aspect-video relative rounded-md overflow-hidden border border-white/10 group">
              <iframe
                src="https://www.youtube.com/embed/PL4UlcXufAo?autoplay=1&mute=1&loop=1&playlist=PL4UlcXufAo&controls=1"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
                title="Clamp Demo Video"
              ></iframe>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div id="how-it-works" className="py-20 md:py-32 border-t border-white/5 bg-gradient-to-b from-[#0a0a0a] to-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center mb-16 md:mb-20">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">How It Works</h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">Clamp makes it easy to test your database's Row Level Security policies and fix vulnerabilities.</p>
          </div>
          
          {/* Process Steps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 max-w-5xl mx-auto">
            {[1, 2, 3].map((step, index) => (
              <div key={index} className="relative h-full">
                <div className="relative bg-[#0f0f0f] rounded-lg p-6 text-left border border-white/10 h-full flex flex-col">
                  <div className="w-10 h-10 rounded-md bg-purple-600 flex items-center justify-center mb-5 text-lg font-bold">
                    {step}
                    {index < 2 && (
                      <div className="absolute left-full top-1/2 w-8 h-px bg-white/10 hidden md:block"></div>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold mb-3">
                    {step === 1 ? "Input Your Policies" : 
                     step === 2 ? "Generate Attack Vectors" : 
                     "Get Actionable Results"}
                  </h3>
                  <p className="text-gray-400 flex-grow text-sm">
                    {step === 1 ? "Provide your database schema, RLS policies, and additional context about your application's security requirements." : 
                     step === 2 ? "We automatically create test queries that simulate how malicious users might try to bypass your security rules that you can test directly against your database." : 
                     "Review failed tests and generate new RLS policies to secure your database."}
                  </p>
                  <div className="mt-4 pt-4 border-t border-white/5 flex items-center text-xs text-gray-500">
                    <span className="text-purple-400 mr-1.5">
                      {step === 1 ? "~2 min" : step === 2 ? "~30 sec" : "Immediate"}
                    </span>
                    {step === 1 ? "setup time" : step === 2 ? "generation time" : "results"}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Code Example */}
          <div className="relative bg-[#0f0f0f] border border-white/10 rounded-lg overflow-hidden max-w-4xl mx-auto">
            <div className="flex items-center px-4 py-3 border-b border-white/10 bg-[#0f0f0f]">
              <div className="flex space-x-2">
                <div className="w-3 h-3 rounded-full bg-[#ff5f57]"></div>
                <div className="w-3 h-3 rounded-full bg-[#febc2e]"></div>
                <div className="w-3 h-3 rounded-full bg-[#28c840]"></div>
              </div>
              <div className="ml-4 flex space-x-4">
                <span className="text-xs text-gray-400 px-2 py-1 rounded bg-black/30">RLS Policy Improvement</span>
              </div>
            </div>
            
            <div className="p-4 text-sm font-mono text-gray-300 overflow-auto max-h-96 bg-[#0a0a0a]">
              <pre>
                <code>
{`-- Before: Vulnerable RLS policy
CREATE POLICY "Users can only see their own data" 
ON "public"."profiles" 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- After: Fixed RLS policy with proper type casting
CREATE POLICY "Users can only see their own data" 
ON "public"."profiles" 
FOR SELECT 
TO authenticated 
USING (auth.uid()::text = user_id::text);`}
                </code>
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 md:py-32 border-t border-white/5 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center mb-16 md:mb-20">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">Key Features</h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">Everything you need to secure your database's Row Level Security policies.</p>
          </div>
          
          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Feature cards */}
            {/* (Feature cards 1-6 with similar styling changes) */}
          </div>
        </div>
      </div>

      {/* Policy Editor Section */}
      <div className="py-16 md:py-32 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 md:px-6 text-center">
          <div className="mb-12 md:mb-16 max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 md:mb-6 text-white">
              Fix vulnerabilities
            </h2>
            <p className="text-base md:text-xl text-gray-400">
              Our platform not only identifies security issues but also suggests improved RLS policies to fix the vulnerabilities, complete with explanations of why they work.
            </p>
          </div>

          {/* Editor Preview */}
          <div className="relative bg-transparent border border-white/20 rounded-xl overflow-hidden max-w-4xl mx-auto animate-border-travel">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-3 md:p-4 border-b border-white/10 bg-[#0a1020]/50 gap-3 md:gap-0">
              <div className="flex items-center">
                <button className="px-3 py-1 text-sm text-gray-400 bg-[#0a1020] rounded-md mr-2">
                  Test Results
                </button>
                <span className="text-gray-400">Vulnerability Report</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">3 issues found</span>
                <button className="px-3 py-1 text-sm bg-[#0a1020] text-gray-300 rounded-md">
                  Export
                </button>
                <button className="px-3 py-1 text-sm bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-md">
                  Fix All
                </button>
              </div>
            </div>
            <div className="p-3 md:p-6 text-left overflow-x-auto">
              <div className="grid grid-cols-1 gap-4">
                <div className="bg-[#0a1020]/50 rounded-lg p-4">
                  <div className="flex items-center mb-4">
                    <div className="w-6 h-6 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center mr-2">
                      <span className="text-red-500 text-xs">!</span>
                    </div>
                    <div className="text-red-400 font-medium text-white">Critical: Data Leakage in User Profiles</div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="text-sm text-gray-500 mb-1">Current Policy</div>
                    <div className="text-gray-300 bg-[#0f172a]/70 p-2 rounded mb-2">
                      <code>CREATE POLICY "Users can view profiles" ON profiles FOR SELECT USING (true);</code>
                    </div>
                    <div className="text-sm text-gray-400">
                      This policy allows anyone to view all user profiles, including private information.
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="text-sm text-gray-500 mb-1">Recommended Fix</div>
                    <div className="text-green-300 bg-[#0f172a]/70 p-2 rounded mb-2">
                      <code>CREATE POLICY "Users can view profiles" ON profiles FOR SELECT USING (auth.uid() = user_id OR is_public = true);</code>
                    </div>
                    <div className="text-sm text-gray-400">
                      This policy ensures users can only view their own profiles or profiles marked as public.
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <button className="px-3 py-1 text-sm bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-md">
                      Apply Fix
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="py-20 md:py-32 border-t border-white/5 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-4 md:px-6 text-center">
          <div className="mb-16 md:mb-20 max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
              Pricing
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">
              Start securing your database for free. Upgrade to Pro for advanced security features and authenticated role testing.
            </p>
          </div>
          
          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <div className="relative bg-[#0f0f0f] rounded-lg p-6 text-left border border-white/10">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">Free</h3>
                <p className="text-gray-400">Perfect for getting started</p>
              </div>
              <div className="mb-8">
                <div className="flex items-baseline">
                  <span className="text-5xl font-bold text-white">$0</span>
                  <span className="text-gray-400 ml-2">/month</span>
                </div>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center text-gray-300">
                  <svg className="h-5 w-5 text-purple-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Generate anonymous role tests
                </li>
                <li className="flex items-center text-gray-300">
                  <svg className="h-5 w-5 text-purple-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Run anonymous role tests
                </li>
                <li className="flex items-center text-gray-400">
                  <svg className="h-5 w-5 text-gray-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span className="line-through">Authenticated role tests</span>
                </li>
                <li className="flex items-center text-gray-400">
                  <svg className="h-5 w-5 text-gray-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span className="line-through">Advanced security features</span>
                </li>
              </ul>
              <Link
                href="/login"
                className="block w-full py-2.5 px-4 text-center rounded-md border border-white/10 hover:border-white/20 text-white font-medium transition-colors duration-200"
              >
                Get Started
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="relative bg-[#0f0f0f] rounded-lg p-6 text-left border border-purple-500/20">
              <div className="absolute top-0 right-0 mt-4 mr-4">
                <span className="bg-purple-600 text-white text-xs py-1 px-2.5 rounded-md">
                  Popular
                </span>
              </div>
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">Pro</h3>
                <p className="text-gray-400">For those who need more security</p>
              </div>
              <div className="mb-8">
                <div className="flex items-baseline">
                  <span className="text-5xl font-bold text-white">$15</span>
                  <span className="text-gray-400 ml-2">/month</span>
                </div>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center text-gray-300">
                  <svg className="h-5 w-5 text-purple-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Generate anonymous role tests
                </li>
                <li className="flex items-center text-gray-300">
                  <svg className="h-5 w-5 text-purple-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Run anonymous role tests
                </li>
                <li className="flex items-center text-gray-300">
                  <svg className="h-5 w-5 text-purple-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Generate authenticated role tests
                </li>
                <li className="flex items-center text-gray-300">
                  <svg className="h-5 w-5 text-purple-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Run authenticated role tests
                </li>
                <li className="flex items-center text-gray-300">
                  <svg className="h-5 w-5 text-purple-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Advanced security features
                </li>
              </ul>
              <Link
                href="/register"
                className="block w-full py-2.5 px-4 text-center rounded-md bg-purple-600 hover:bg-purple-700 text-white font-medium transition-colors duration-200"
              >
                Get Started
              </Link>
            </div>
          </div>

          <div className="mt-12 md:mt-16 max-w-3xl mx-auto text-center">
            <p className="text-sm text-gray-500">
              All plans include unlimited RLS policy testing and generated fixes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
