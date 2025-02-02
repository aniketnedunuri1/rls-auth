"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function DashboardPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Welcome to RLS Testing SaaS</h1>
      <p className="text-muted-foreground">Automate your RLS and database schema testing with ease.</p>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Database Schema</CardTitle>
            <CardDescription>Input or connect your database schema</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/schema">
              <Button className="w-full">Manage Schema</Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>RLS Policies</CardTitle>
            <CardDescription>Review and edit your RLS policies</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/schema">
              <Button className="w-full">Manage RLS</Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Run Tests</CardTitle>
            <CardDescription>Start automated testing of your database</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/playground">
              <Button className="w-full">Go to Playground</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

