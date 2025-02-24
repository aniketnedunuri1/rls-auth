import { createClient } from '@supabase/supabase-js';

export async function cleanupTestUsers(
  supabaseUrl: string,
  serviceRoleKey: string,
  testUserIds: string[]
) {
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    // Delete test users in batches
    const batchSize = 10;
    for (let i = 0; i < testUserIds.length; i += batchSize) {
      const batch = testUserIds.slice(i, i + batchSize);
      await Promise.all(
        batch.map(userId =>
          supabase.auth.admin.deleteUser(userId)
            .catch(error => console.error(`Failed to delete test user ${userId}:`, error))
        )
      );
    }

    return { success: true };
  } catch (error) {
    console.error('Error cleaning up test users:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
} 