// "use client"

// import Link from "next/link"
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
// import { Button } from "@/components/ui/button"

// export default function DashboardPage() {
//   return (
//     <div className="min-h-screen bg-neutral-900 text-white">
//       <div className="p-8 max-w-6xl mx-auto">
//         {/* Hero / Welcome Section */}
//         <div className="mb-12">
//           <h1 className="text-3xl font-bold mb-2">Order Tracker / RLS Testing SaaS</h1>
//           <p className="text-neutral-400">
//             Your project has been deployed on its own instance, with its own API all set up and ready to use.
//           </p>
//         </div>

//         {/* Get Started / Database Section */}
//         <div className="space-y-4 mb-12">
//           <h2 className="text-xl font-semibold">Get started by building out your database</h2>
//           <p className="text-neutral-400">
//             Start building your app by creating tables and inserting data.
//             Our table editor makes Postgres as easy as a spreadsheet,
//             or you can write raw SQL in our editor if you need something more.
//           </p>

//           <div className="flex flex-wrap gap-4">
//             <Link href="/dashboard/schema">
//               <Button variant="outline">Table Editor</Button>
//             </Link>
//             <Link href="/dashboard/schema">
//               <Button variant="outline">SQL Editor</Button>
//             </Link>
//             <Link href="/dashboard/schema">
//               <Button variant="outline">About Database</Button>
//             </Link>
//           </div>
//         </div>

//         {/* Cards / Other Products Section */}
//         <div className="space-y-4">
//           <h2 className="text-xl font-semibold">Explore our other products</h2>
//           <p className="text-neutral-400">
//             We provide all the backend features you need to build a product:
//             Authentication, Storage, Edge Functions, Realtime, and more.
//           </p>

//           <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mt-4">
//             {/* Authentication Card */}
//             <Card className="bg-neutral-800 hover:bg-neutral-700 transition-colors">
//               <CardHeader>
//                 <CardTitle className="text-white">Authentication</CardTitle>
//                 <CardDescription className="text-neutral-400">
//                   Manage user accounts & roles
//                 </CardDescription>
//               </CardHeader>
//               <CardContent>
//                 <Link href="/auth/explore">
//                   <Button variant="outline" className="w-full">
//                     Explore Auth
//                   </Button>
//                 </Link>
//               </CardContent>
//             </Card>

//             {/* Storage Card */}
//             <Card className="bg-neutral-800 hover:bg-neutral-700 transition-colors">
//               <CardHeader>
//                 <CardTitle className="text-white">Storage</CardTitle>
//                 <CardDescription className="text-neutral-400">
//                   Host & serve any file type
//                 </CardDescription>
//               </CardHeader>
//               <CardContent>
//                 <Link href="/storage/about">
//                   <Button variant="outline" className="w-full">
//                     About Storage
//                   </Button>
//                 </Link>
//               </CardContent>
//             </Card>

//             {/* Edge Functions Card */}
//             <Card className="bg-neutral-800 hover:bg-neutral-700 transition-colors">
//               <CardHeader>
//                 <CardTitle className="text-white">Edge Functions</CardTitle>
//                 <CardDescription className="text-neutral-400">
//                   Write custom serverless code
//                 </CardDescription>
//               </CardHeader>
//               <CardContent>
//                 <Link href="/functions/explore">
//                   <Button variant="outline" className="w-full">
//                     Explore Functions
//                   </Button>
//                 </Link>
//               </CardContent>
//             </Card>

//             {/* Realtime Card */}
//             <Card className="bg-neutral-800 hover:bg-neutral-700 transition-colors">
//               <CardHeader>
//                 <CardTitle className="text-white">Realtime</CardTitle>
//                 <CardDescription className="text-neutral-400">
//                   Listen to DB changes via websockets
//                 </CardDescription>
//               </CardHeader>
//               <CardContent>
//                 <Link href="/realtime/about">
//                   <Button variant="outline" className="w-full">
//                     About Realtime
//                   </Button>
//                 </Link>
//               </CardContent>
//             </Card>
//           </div>
//         </div>

//         {/* Possibly more sections or a footer... */}
//       </div>
//     </div>
//   )
// }

// /app/dashboard/page.tsx

// /app/dashboard/page.tsx
"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createProjectAction } from "@/lib/actions/project";

export default function DashboardPage() {
  return (
    <div className="flex items-center justify-center h-screen bg-background">
      <Card className="w-96 p-6 text-center">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Get started</CardTitle>
          <CardDescription className="mt-2 text-gray-600">
            Create a new project to begin.
          </CardDescription>
        </CardHeader>
        <CardContent className="mt-4">
          {/* The form submits directly to the server action */}
          <form action={createProjectAction}>
            <Input name="projectName" placeholder="Project Name" required />
            <CardFooter className="mt-4">
              <Button type="submit">Create Project</Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
