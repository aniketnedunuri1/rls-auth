// /lib/actions/auth.ts
"use server";

import { createServerSupabaseClient } from "../supabase-server-client";
import { redirect } from "next/navigation";
import { prisma } from '../prisma';

export async function getUser() {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    
    if (user) {
      // Ensure user exists in Prisma database
      try {
        const existingUser = await prisma.user.upsert({
          where: { id: user.id },
          update: {}, // no updates needed
          create: {
            id: user.id,
            email: user.email || '',
          },
        });
      } catch (error) {
        console.error("Error syncing user to database:", error);
      }
    }
    
    return user;
}

/**
 * Server Action to log a user in.
 * Expects a FormData with fields "email" and "password".
 */
export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    return { error: "Username or password incorrect" };
  }

  try {
    await prisma.user.upsert({
      where: { id: data.user.id },
      update: {}, // no updates needed
      create: {
        id: data.user.id,
        email: data.user.email || email,
      },
    });
  } catch (error) {
    console.error("Error syncing user to database:", error);
    return { error: "Failed to create user record" };
  }

  // Return success instead of redirecting
  return { success: true };
}

/**
 * Server Action to register a new user.
 * Expects a FormData with fields "email" and "password".
 */
export async function registerAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.signUp({ 
    email, 
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/callback`
    }
  });

  if (error) {
    throw new Error(error.message);
  }

  // If we have a user but no session, it means email confirmation is required
  if (data.user && !data.session) {
    return { emailSent: true };
  }

  const user = data.user;
  if (user) {
    try {
      await prisma.user.upsert({
        where: { id: user.id },
        update: {}, 
        create: {
          id: user.id,
          email: user.email || email,
        },
      });
    } catch (error) {
      console.error("Error creating user in database:", error);
      throw new Error("Failed to create user record");
    }
  }

  // Only redirect if we have a session (no email confirmation required)
  if (data.session) {
    redirect("/dashboard");
  }

  return { emailSent: true };
}

export async function logoutAction() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  // Return success instead of redirecting
  return { success: true };
}

export async function getSession() {
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session
}
