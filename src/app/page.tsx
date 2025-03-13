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
      <nav className="flex flex-col md:flex-row justify-between items-center py-6 md:py-8 px-4 md:px-6 max-w-7xl mx-auto gap-4 md:gap-0">
        <div className="flex items-center">
          <span className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 text-transparent bg-clip-text">clamp</span>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8 w-full md:w-auto">
          <div className="hidden md:flex gap-8">
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
          <div className="flex items-center gap-4 w-full md:w-auto justify-center">
            <Link href="/login" className="text-gray-200 hover:text-white">
              Log in
            </Link>
            <Link
              href="/register"
              className="w-full md:w-auto bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-2.5 rounded-full font-medium transition-all duration-200 transform hover:scale-105 text-center"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-12 md:pt-20 pb-24 md:pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-16 items-center">
          <div className="space-y-6 md:space-y-8 text-center lg:text-left">
            {/* Feature announcement button */}
            <Link href="/features" className="inline-flex items-center px-4 md:px-6 py-2 md:py-3 rounded-full bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-purple-500/30 text-gray-200 hover:text-white transition-all duration-200 transform hover:scale-105 hover:border-purple-500/50 group text-sm md:text-base">
              <span>Introducing authenticated role testing</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            
            {/* Main Heading */}
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold leading-tight text-white">
              Test your RLS
              <br />
              before hackers do
            </h1>

            {/* Subheading */}
            <p className="text-lg md:text-xl lg:text-2xl text-gray-300 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Automatically generate and run attack vectors against your database's Row Level Security policies to find vulnerabilities before they're exploited.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-center lg:justify-start">
              <Link
                href="/register"
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-4 rounded-full font-medium transition-all duration-200 transform hover:scale-105 text-center text-lg shadow-lg shadow-purple-500/25"
              >
                Test Your Policies
              </Link>
              <Link
                href="#how-it-works"
                className="border-2 border-purple-500/30 hover:border-purple-500/50 text-gray-200 hover:text-white px-8 py-4 rounded-full font-medium transition-all duration-200 transform hover:scale-105 text-center text-lg"
              >
                How It Works
              </Link>
            </div>
          </div>
          
          {/* 3D Visual Element */}
          <div className="relative mt-8 lg:mt-0">
            <div className="w-full aspect-video relative rounded-2xl overflow-hidden border border-purple-500/20 shadow-2xl shadow-purple-500/10 transform hover:scale-[1.02] transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-tr from-purple-900/20 to-transparent pointer-events-none z-10"></div>
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
      <div id="how-it-works" className="py-16 md:py-32 border-t border-gray-800 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 md:px-6 text-center">
          <div className="mb-12 md:mb-16 max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 md:mb-6 text-white">
              Secure your data <span className="text-purple-500">today</span>
            </h2>
            <p className="text-base md:text-xl text-gray-400">
              Our platform automatically generates attack vectors to test your database's Row Level Security policies, helping you identify and fix vulnerabilities before they can be exploited.
            </p>
          </div>

          {/* Process Steps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-12 md:mb-16">
            {[1, 2, 3].map((step, index) => (
              <div key={index} className="relative group h-full">
                <div className="relative bg-transparent rounded-xl p-8 text-left border border-white/20 animate-border-travel h-full flex flex-col">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center mb-6 text-xl font-bold">{step}</div>
                  <h3 className="text-xl font-semibold mb-4 text-white">
                    {step === 1 ? "Input Your Policies" : 
                     step === 2 ? "Generate Attack Vectors" : 
                     "Get Actionable Results"}
                  </h3>
                  <p className="text-gray-400 flex-grow">
                    {step === 1 ? "Provide your database schema, RLS policies, and additional context about your application's security requirements." : 
                     step === 2 ? "We automatically create test queries that simulate how malicious users might try to bypass your security rules that you can test directly against your database." : 
                     "Review failed tests and generate new RLS policies to secure your database."}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Code Example */}
          <div className="relative bg-[#0c1221] border border-[#1e293b] rounded-xl overflow-hidden max-w-4xl mx-auto animate-border-travel">
            <div className="flex items-center px-3 md:px-4 py-2 md:py-3 border-b border-[#1e293b] bg-[#0f172a] overflow-x-auto">
              <div className="flex space-x-2">
                <div className="w-3 h-3 rounded-full bg-[#64748b]"></div>
                <div className="w-3 h-3 rounded-full bg-[#64748b]"></div>
                <div className="w-3 h-3 rounded-full bg-[#64748b]"></div>
              </div>
              <div className="ml-4 flex space-x-4">
                <span className="text-xs text-[#94a3b8] px-2 py-1 rounded bg-[#1e293b]">RLS Policy Improvement</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-[#1e293b]">
              {/* Original Policy */}
              <div className="p-6 text-left overflow-x-auto">
                <div className="mb-4 flex items-center">
                  <div className="w-6 h-6 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center mr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-medium text-white">Vulnerable Policy</h3>
                </div>
                <pre className="text-xs text-[#94a3b8] bg-[#0f172a] p-4 rounded-lg">
                  <code>{`-- Original RLS policy
CREATE POLICY "Users can only access their own data"
ON "public"."profiles"
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Vulnerability
-- This policy doesn't account for role-based access
-- and can be bypassed by users with admin roles`}</code>
                </pre>
              </div>
              
              {/* Improved Policy */}
              <div className="p-6 text-left overflow-x-auto bg-[#0a1020]">
                <div className="mb-4 flex items-center">
                  <div className="w-6 h-6 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-medium text-white">Clamp-Improved Policy</h3>
                </div>
                <pre className="text-xs text-[#94a3b8] bg-[#0f172a] p-4 rounded-lg">
                  <code>{`-- Clamp-recommended fix
CREATE POLICY "Users can only access their own data"
ON "public"."profiles"
FOR ALL
USING (auth.uid() = user_id AND NOT EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_id = profiles.user_id AND role = 'admin'
))
WITH CHECK (auth.uid() = user_id);

-- Security improvement
-- This policy prevents the role-based bypass
-- by explicitly checking for admin roles`}</code>
                </pre>
              </div>
            </div>
            
            {/* Attack Vector */}
            <div className="border-t border-[#1e293b] p-6 bg-[#0a1020]">
              <div className="mb-3 flex items-center">
                <div className="w-6 h-6 rounded-full bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center mr-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-sm font-medium text-white">Detected Attack Vector</h3>
              </div>
              <pre className="text-xs text-[#94a3b8] bg-[#0f172a] p-4 rounded-lg">
                <code>{`-- Clamp-generated test query that would bypass the original policy
SELECT * FROM profiles 
WHERE user_id IN (
  SELECT user_id FROM user_roles 
  WHERE role = 'admin'
);`}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 md:py-32 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="mb-12 md:mb-16 max-w-3xl">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 md:mb-6 text-white">
              Complete security testing
            </h2>
            <p className="text-base md:text-xl text-gray-400">
              Our platform offers comprehensive testing for both anonymous and authenticated user scenarios, helping you identify vulnerabilities that traditional testing might miss.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {/* Anonymous Testing Card */}
            <div className="relative bg-transparent rounded-xl p-8 text-left border border-white/20 animate-border-travel">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-semibold text-white">Anonymous Role Testing</h3>
              </div>
              <p className="text-gray-400 mb-6">
                Test how your database responds to unauthenticated users. Identify if public data is properly protected and if sensitive information is accessible.
              </p>
              <div className="bg-[#0a1020]/50 rounded-lg p-4 overflow-x-auto">
                <div className="flex items-center text-sm text-green-500 mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Public data accessible</span>
                </div>
                <div className="flex items-center text-sm text-red-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>Private user data protected</span>
                </div>
              </div>
            </div>

            {/* Authenticated Testing Card */}
            <div className="relative bg-transparent rounded-xl p-8 text-left border border-white/20 animate-border-travel">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-semibold text-white">Authenticated Role Testing</h3>
              </div>
              <p className="text-gray-400 mb-6">
                Simulate authenticated users attempting to access data they shouldn't have permission to view, modify, or delete. Test multi-tenant data isolation.
              </p>
              <div className="bg-[#0a1020]/50 rounded-lg p-4">
                <div className="flex items-center text-sm text-red-500 mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>User A cannot access User B's data</span>
                </div>
                <div className="flex items-center text-sm text-yellow-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>Potential vulnerability in join tables</span>
                </div>
              </div>
            </div>
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
      <div className="py-16 md:py-32 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 md:px-6 text-center">
          <div className="mb-12 md:mb-16 max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 md:mb-6 text-white">
              Pricing
            </h2>
            <p className="text-base md:text-xl text-gray-400">
              Start securing your database for free. Upgrade to Pro for advanced security features and authenticated role testing.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {/* Free Plan */}
            <div className="relative bg-[#0a1020] rounded-2xl p-8 text-left border border-white/10">
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
                  <svg className="h-5 w-5 text-green-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Generate anonymous role tests
                </li>
                <li className="flex items-center text-gray-300">
                  <svg className="h-5 w-5 text-green-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                className="block w-full py-3 px-6 text-center rounded-full border-2 border-purple-500/30 hover:border-purple-500/50 text-white font-medium transition-all duration-200 hover:scale-105"
              >
                Get Started
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="relative bg-gradient-to-b from-purple-900/50 to-[#0a1020] rounded-2xl p-8 text-left border-2 border-purple-500/30">
              <div className="absolute top-0 right-0 mt-4 mr-4">
                <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm py-1 px-3 rounded-full">
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
                  <svg className="h-5 w-5 text-green-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Generate anonymous role tests
                </li>
                <li className="flex items-center text-gray-300">
                  <svg className="h-5 w-5 text-green-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Run anonymous role tests
                </li>
                <li className="flex items-center text-gray-300">
                  <svg className="h-5 w-5 text-green-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Generate authenticated role tests
                </li>
                <li className="flex items-center text-gray-300">
                  <svg className="h-5 w-5 text-green-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Run authenticated role tests
                </li>
                <li className="flex items-center text-gray-300">
                  <svg className="h-5 w-5 text-green-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Advanced security features
                </li>
              </ul>
              <Link
                href="/register"
                className="block w-full py-3 px-6 text-center rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium transition-all duration-200 hover:scale-105 shadow-lg shadow-purple-500/25"
              >
                Get Started
              </Link>
            </div>
          </div>

          <div className="mt-12 md:mt-16 max-w-3xl mx-auto text-center">
            <p className="text-sm md:text-base text-gray-400">
              All plans include unlimited RLS policy testing and generated fixes.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 md:py-32 border-t border-gray-800">
        <div className="max-w-3xl mx-auto px-4 md:px-6 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 md:mb-6 text-white">
            Secure your database today
          </h2>
          <p className="text-base md:text-xl text-gray-400 mb-8 md:mb-10">
            Don't wait for a breach to discover your RLS vulnerabilities.
            <br />
            Start testing your policies now, free for anonymous role testing.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-4 rounded-full font-medium transition-all duration-200 transform hover:scale-105 text-center text-lg shadow-lg shadow-purple-500/25"
            >
              Start Clamp for Free
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-16">
          {/* <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
            <div className="col-span-2 lg:col-span-1">
              <div className="flex items-center mb-6">
                <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 text-transparent bg-clip-text">clamp</span>
              </div>
              <p className="text-gray-400 mb-6">
                Secure your database with confidence using our RLS policy testing platform.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Product</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-400 hover:text-white">Features</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Resources</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-400 hover:text-white">Documentation</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Guides</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">API Reference</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Blog</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Company</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-400 hover:text-white">About</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Careers</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Contact</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Partners</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Legal</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-400 hover:text-white">Privacy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Terms</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Cookie Policy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Licenses</a></li>
              </ul>
            </div>
          </div> */}
          <div className="mt-12 pt-8 border-t border-gray-800 text-center">
            <p className="text-gray-400 text-sm">
              &copy; {new Date().getFullYear()} Clamp, Inc. All rights reserved.
            </p>
          </div>

      </footer>
    </div>
  );
}
