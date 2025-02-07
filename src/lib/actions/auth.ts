// /lib/actions/auth.ts
"use server";

import { createServerSupabaseClient } from "../supabase-server-client";
import { redirect } from "next/navigation";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getUser() {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  }

/**
 * Server Action to log a user in.
 * Expects a FormData with fields "email" and "password".
 */
export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  // Create a secure Supabase client that manages cookies.
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    // Optionally handle errors (e.g., show a message, log it, etc.)
    return { error: "Username or password incorrect" };
  }

  // On success, redirect the user.
  redirect("/dashboard");
}

/**
 * Server Action to register a new user.
 * Expects a FormData with fields "email" and "password".
 */
export async function registerAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    throw new Error(error.message);
  }

  // You could sync with your database or send a confirmation email here.
  const user = data.user;
  if (user) {
    // Check if the user already exists in your users table
    const existingUser = await prisma.user.findUnique({
      where: { id: user.id },
    });
    if (!existingUser) {
      await prisma.user.create({
        data: {
          id: user.id,         // use the same ID as in Supabase auth
          email: user.email || email,
          // add other default fields if necessary
        },
      });
    }
  }

  redirect("/dashboard");
}
