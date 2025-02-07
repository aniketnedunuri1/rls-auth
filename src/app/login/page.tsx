// // /app/login/page.tsx
// import { loginAction } from "@/lib/actions/auth";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
// import Link from "next/link";

// export default function LoginPage() {
//   return (
//     <div className="flex items-center justify-center min-h-screen bg-background">
//       <Card className="w-[350px]">
//         <CardHeader>
//           <CardTitle>Login</CardTitle>
//           <CardDescription>Enter your credentials to access your account</CardDescription>
//         </CardHeader>
//         <CardContent>
//           <form action={loginAction}>
//             <div className="grid w-full items-center gap-4">
//               <div className="flex flex-col space-y-1.5">
//                 <Input name="email" id="email" placeholder="Email" type="email" />
//               </div>
//               <div className="flex flex-col space-y-1.5">
//                 <Input name="password" id="password" placeholder="Password" type="password" />
//               </div>
//               <Button type="submit">Login</Button>
//             </div>
//           </form>
//         </CardContent>
//         <CardFooter className="flex justify-between">
//           <Button variant="outline" asChild>
//             <Link href="/register">Register</Link>
//           </Button>
//         </CardFooter>
//       </Card>
//     </div>
//   );
// }

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { loginAction } from "@/lib/actions/auth";

export default function LoginPage() {
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(""); // Clear previous errors

    const formData = new FormData(e.currentTarget);

    try {
      // Call the server action directly
      const result = await loginAction(formData);
      
      // If the action returns an error, display it.
      if (result && result.error) {
        setError(result.error);
        return;
      }
      
      // If loginAction redirects via next/navigation.redirect,
      // this line may not be reached. Otherwise, navigate programmatically:
      router.push("/dashboard");
    } catch (err: any) {
      // If the loginAction throws an error, update the error state.
      setError("Username or password incorrect.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>Enter your credentials to access your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Input
                  name="email"
                  id="email"
                  placeholder="Email"
                  type="email"
                  required
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Input
                  name="password"
                  id="password"
                  placeholder="Password"
                  type="password"
                  required
                />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <Button type="submit">Login</Button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" asChild>
            <Link href="/register">Register</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
