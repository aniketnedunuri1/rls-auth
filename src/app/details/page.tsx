// // pages/details/index.tsx
// "use client";

// import { useState } from "react";
// import { useRouter } from "next/navigation";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import {
//   Card,
//   CardContent,
//   CardHeader,
//   CardTitle,
//   CardFooter,
// } from "@/components/ui/card";
// import Link from "next/link";

// interface ProjectDetails {
//   projectUrl: string;
//   projectId: string;
// }

// interface DbDetails {
//   host: string;
//   port: string;
//   database: string;
//   username: string;
//   password: string;
// }

// interface ApiKeys {
//   anonKey: string;
//   serviceRoleKey: string;
// }

// export default function ConnectSupabase() {
//   const router = useRouter();
//   const [step, setStep] = useState(1);
//   const [projectDetails, setProjectDetails] = useState<ProjectDetails>({
//     projectUrl: "",
//     projectId: "",
//   });
//   const [dbDetails, setDbDetails] = useState<DbDetails>({
//     host: "",
//     port: "5432",
//     database: "",
//     username: "",
//     password: "",
//   });
//   const [apiKeys, setApiKeys] = useState<ApiKeys>({
//     anonKey: "",
//     serviceRoleKey: "",
//   });
//   const [schema, setSchema] = useState("public");
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [error, setError] = useState("");

//   const handleNext = () => setStep((prev) => prev + 1);
//   const handleBack = () => setStep((prev) => prev - 1);

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setIsSubmitting(true);
//     setError("");

//     const payload = {
//       projectDetails,
//       dbDetails,
//       apiKeys,
//       schema,
//     };

//     try {
//       const res = await fetch("/api/save-supabase-details", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(payload),
//       });
//       if (!res.ok) {
//         throw new Error("Failed to save details");
//       }
//       // On success, redirect to the dashboard.
//       router.push("/dashboard");
//     } catch (err: any) {
//       setError(err.message);
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   return (
//     <div className="container mx-auto p-6">
//       <Card className="max-w-2xl mx-auto">
//         <CardHeader className="flex justify-between items-center">
//           <CardTitle>Connect Your Supabase Project</CardTitle>
//           {/* "X" Button to exit and redirect to the dashboard */}
//           <button
//             onClick={() => router.push("/dashboard")}
//             className="text-xl font-bold hover:text-red-600"
//             aria-label="Close"
//           >
//             &times;
//           </button>
//         </CardHeader>
//         <CardContent>
//           <form onSubmit={handleSubmit} className="space-y-6">
//             {step === 1 && (
//               <div>
//                 <h2 className="text-xl font-semibold mb-2">Step 1: Project Details</h2>
//                 <label className="block mb-2">
//                   Supabase Project URL:
//                   <Input
//                     type="text"
//                     className="mt-1"
//                     value={projectDetails.projectUrl}
//                     onChange={(e) =>
//                       setProjectDetails({ ...projectDetails, projectUrl: e.target.value })
//                     }
//                     required
//                   />
//                 </label>
//                 <label className="block mb-2">
//                   Supabase Project ID (optional):
//                   <Input
//                     type="text"
//                     className="mt-1"
//                     value={projectDetails.projectId}
//                     onChange={(e) =>
//                       setProjectDetails({ ...projectDetails, projectId: e.target.value })
//                     }
//                   />
//                 </label>
//               </div>
//             )}
//             {step === 2 && (
//               <div>
//                 <h2 className="text-xl font-semibold mb-2">Step 2: Database Connection Details</h2>
//                 <label className="block mb-2">
//                   Host:
//                   <Input
//                     type="text"
//                     className="mt-1"
//                     value={dbDetails.host}
//                     onChange={(e) =>
//                       setDbDetails({ ...dbDetails, host: e.target.value })
//                     }
//                     required
//                   />
//                 </label>
//                 <label className="block mb-2">
//                   Port:
//                   <Input
//                     type="number"
//                     className="mt-1"
//                     value={dbDetails.port}
//                     onChange={(e) =>
//                       setDbDetails({ ...dbDetails, port: e.target.value })
//                     }
//                     required
//                   />
//                 </label>
//                 <label className="block mb-2">
//                   Database Name:
//                   <Input
//                     type="text"
//                     className="mt-1"
//                     value={dbDetails.database}
//                     onChange={(e) =>
//                       setDbDetails({ ...dbDetails, database: e.target.value })
//                     }
//                     required
//                   />
//                 </label>
//                 <label className="block mb-2">
//                   Username:
//                   <Input
//                     type="text"
//                     className="mt-1"
//                     value={dbDetails.username}
//                     onChange={(e) =>
//                       setDbDetails({ ...dbDetails, username: e.target.value })
//                     }
//                     required
//                   />
//                 </label>
//                 <label className="block mb-2">
//                   Password:
//                   <Input
//                     type="password"
//                     className="mt-1"
//                     value={dbDetails.password}
//                     onChange={(e) =>
//                       setDbDetails({ ...dbDetails, password: e.target.value })
//                     }
//                     required
//                   />
//                 </label>
//               </div>
//             )}
//             {step === 3 && (
//               <div>
//                 <h2 className="text-xl font-semibold mb-2">Step 3: API Keys</h2>
//                 <label className="block mb-2">
//                   Supabase Anon/Public API Key:
//                   <Input
//                     type="text"
//                     className="mt-1"
//                     value={apiKeys.anonKey}
//                     onChange={(e) =>
//                       setApiKeys({ ...apiKeys, anonKey: e.target.value })
//                     }
//                     required
//                   />
//                 </label>
//                 <label className="block mb-2">
//                   Supabase Service Role Key:
//                   <Input
//                     type="text"
//                     className="mt-1"
//                     value={apiKeys.serviceRoleKey}
//                     onChange={(e) =>
//                       setApiKeys({ ...apiKeys, serviceRoleKey: e.target.value })
//                     }
//                     required
//                   />
//                 </label>
//               </div>
//             )}
//             {step === 4 && (
//               <div>
//                 <h2 className="text-xl font-semibold mb-2">Step 4: Additional Options</h2>
//                 <label className="block mb-2">
//                   Schema Name (default is "public"):
//                   <Input
//                     type="text"
//                     className="mt-1"
//                     value={schema}
//                     onChange={(e) => setSchema(e.target.value)}
//                   />
//                 </label>
//               </div>
//             )}
//             <div className="flex justify-between mt-4">
//               {step > 1 && (
//                 <Button variant="outline" type="button" onClick={handleBack}>
//                   Back
//                 </Button>
//               )}
//               {step < 4 && (
//                 <Button type="button" onClick={handleNext}>
//                   Next
//                 </Button>
//               )}
//               {step === 4 && (
//                 <Button type="submit" disabled={isSubmitting}>
//                   {isSubmitting ? "Submitting..." : "Submit"}
//                 </Button>
//               )}
//             </div>
//             {error && <p className="text-red-600 mt-2">{error}</p>}
//           </form>
//         </CardContent>
//       </Card>
//     </div>
//   );
// }
