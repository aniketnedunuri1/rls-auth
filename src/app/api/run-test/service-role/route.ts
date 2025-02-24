import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { query, url, serviceRoleKey, userRole } = await request.json();

    if (!query || !url || !serviceRoleKey) {
      return NextResponse.json(
        { success: false, error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Create Supabase client with service role key
    const supabase = createClient(url, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Create test user based on role
    const testEmail = `test_${userRole.toLowerCase()}_${Date.now()}@example.com`;
    const testPassword = 'testPassword123';

    // Create user with admin client
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true
    });

    if (userError) {
      throw new Error(`Failed to create test user: ${userError.message}`);
    }

    // Execute test query and return results
    const result = await supabase.from('your_table').select('*');

    // Clean up test user
    await supabase.auth.admin.deleteUser(userData.user.id);

    return NextResponse.json({ success: true, result });

  } catch (error) {
    console.error("Error in service-role test:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
} 