// components/ConnectSupabaseForm.tsx
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
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";
import type React from "react";

interface ConnectSupabaseFormProps {
  onClose: () => void;
}

export default function ConnectSupabaseForm({ onClose }: ConnectSupabaseFormProps) {
  const router = useRouter();
  const [connectionString, setConnectionString] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/save-supabase-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          connectionString,
          password,
        }),
      });

      if (!res.ok) throw new Error("Failed to save connection details");

      onClose();
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-lg bg-white">
      <CardHeader>
        <CardTitle className="text-gray-900">Connect to your project</CardTitle>
        <CardDescription className="text-gray-500">
          Get the connection details from your Supabase project settings.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <Alert className="bg-gray-50 border border-gray-200">
            <InfoIcon className="h-4 w-4 text-gray-500" />
            <AlertDescription className="text-gray-600">
              To find your connection details:
              <ol className="ml-4 mt-2 list-decimal space-y-1">
                <li>Go to your Supabase project dashboard</li>
                <li>Click on Project Settings</li>
                <li>Navigate to Database</li>
                <li>Find the Connection String section</li>
                <li>Copy the Direct Connection string</li>
              </ol>
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="connectionString" className="text-gray-700">
              Direct Connection String
            </Label>
            <Input
              id="connectionString"
              value={connectionString}
              onChange={(e) => setConnectionString(e.target.value)}
              placeholder="postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres"
              className="border-gray-200 text-gray-900 placeholder-gray-400"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-gray-700">
              Database Password
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your database password"
              className="border-gray-200 text-gray-900 placeholder-gray-400"
              required
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}
        </CardContent>
        <CardFooter>
          <Button
            type="submit"
            className="w-full bg-gray-900 text-white hover:bg-gray-800"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Connecting..." : "Connect"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
