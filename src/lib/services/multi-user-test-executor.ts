import { createClient } from '@supabase/supabase-js';
import { RLSAnalyzer } from './rls-analyzer';
import { v4 as uuidv4 } from 'uuid';

type TestUserContext = {
  email: string;
  role: string;
  userId: string;
};

type TestResult = {
  success: boolean;
  data: any;
  error: any;
  context: {
    role: string;
    operation: string;
    userId: string;
  };
};

export class MultiUserTestExecutor {
  private supabase;
  private testUsers: TestUserContext[] = [];

  constructor(url: string, serviceRoleKey: string) {
    this.supabase = createClient(url, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  async createTestUser(role: string): Promise<TestUserContext> {
    const email = `test_${role.toLowerCase()}_${uuidv4()}@test.com`;
    const password = 'Test123!@#';

    const { data: userData, error } = await this.supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role }
    });

    if (error) throw new Error(`Failed to create test user: ${error.message}`);

    return {
      email,
      role,
      userId: userData.user.id
    };
  }

  async executeTest(query: string, userContext: TestUserContext): Promise<TestResult> {
    // Create a new Supabase client for this user's context
    const userClient = createClient(
      this.supabase.supabaseUrl,
      this.supabase.supabaseKey
    );

    // Sign in as the test user
    const { error: signInError } = await userClient.auth.signInWithPassword({
      email: userContext.email,
      password: 'Test123!@#'
    });

    if (signInError) {
      throw new Error(`Failed to sign in as test user: ${signInError.message}`);
    }

    try {
      // Execute the query in the user's context
      const wrappedQuery = `
        return (async () => {
          ${query}
        })();
      `;

      const func = new Function('supabase', wrappedQuery);
      const result = await func(userClient);

      return {
        ...result,
        context: {
          role: userContext.role,
          operation: query.includes('select') ? 'SELECT' 
            : query.includes('insert') ? 'INSERT'
            : query.includes('update') ? 'UPDATE'
            : 'DELETE',
          userId: userContext.userId
        }
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        context: {
          role: userContext.role,
          operation: 'UNKNOWN',
          userId: userContext.userId
        }
      };
    }
  }

  async runMultiUserTest(rlsPolicies: string, query: string): Promise<TestResult[]> {
    const analysis = RLSAnalyzer.analyze(rlsPolicies);
    const results: TestResult[] = [];

    // Create test users for each detected role
    for (const role of analysis.roles) {
      const testUser = await this.createTestUser(role.name);
      this.testUsers.push(testUser);

      // Execute test as this user
      const result = await this.executeTest(query, testUser);
      results.push(result);
    }

    return results;
  }
} 