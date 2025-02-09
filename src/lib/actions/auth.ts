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

  // Create a secure Supabase client that manages cookies.
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    // Optionally handle errors (e.g., show a message, log it, etc.)
    return { error: "Username or password incorrect" };
  }

  // Use upsert instead of create to handle race conditions
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
    // You might want to handle this error differently
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

  const user = data.user;
  if (user) {
    try {
      await prisma.user.upsert({
        where: { id: user.id },
        update: {}, // no updates needed
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

  redirect("/dashboard");
}
