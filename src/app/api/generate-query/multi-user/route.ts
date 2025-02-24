import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { RLSAnalyzer } from "@/lib/services/rls-analyzer";

export async function POST(request: Request) {
  try {
    console.log("Received request to generate multi-user tests");
    const { schema, rlsPolicies, additionalContext } = await request.json();

    // Analyze RLS policies first
    const analysis = RLSAnalyzer.analyze(rlsPolicies);

    // Create a role-specific context for the prompt
    const rolesContext = analysis.roles
      .map(role => `- ${role.name}: Has access to tables [${Array.from(role.tables).join(', ')}]`)
      .join('\n');

    const systemPrompt = `You are a database security expert specializing in multi-user testing scenarios for Supabase Row Level Security. Generate comprehensive test cases that verify access controls across different user roles. Return ONLY a JSON object with test categories and cases.`;

    const userPrompt = `
Context: Database Schema: ${schema}

RLS Policies: ${rlsPolicies}

Detected Roles and Access: ${rolesContext}

Organization-based policies: ${analysis.hasOrgPolicies ? 'Yes' : 'No'} Custom JWT claims: ${analysis.hasCustomClaims ? 'Yes' : 'No'}

Additional Context: ${additionalContext || 'No additional context provided'}

Task: Using the provided information, generate a JSON object that defines a comprehensive suite of tests for the user's database from a multi-user perspective. In these tests, you will simulate impersonating multiple authenticated users with different roles and executing queries against records owned by other users.

IMPORTANT ROLE AND ACCESS RULES:

You are simulating multiple authenticated users (e.g., standard user, admin, etc.) based on the roles defined in rolesContext.
Each user is allowed to perform operations on their own records but must be restricted when accessing or modifying records belonging to other users.
All queries must be executed under a specific user role context as provided.
For impersonation tests, when a query references a record ID, use the pattern "insert-{table_name}-{record_id}".
Focus on verifying proper role-based access control, data isolation between users, and enforcement of organization and custom claim policies (if applicable).
CORRECT TEST PATTERNS FOR MULTI-USER IMPERSONATION:

Select Queries: ✓ const { data, error } = await supabase.from("fans").select("*").eq("id", "insert-{table_name}-{record_id}"); ✓ const { data, error } = await supabase.from("creators").select("id, authId").eq("id", "insert-{table_name}-{record_id}");

Insert Queries: ✓ const { data, error } = await supabase.from("fans").insert({ authId: "user_role_auth" }); ✓ const { data, error } = await supabase.from("chat_messages").insert({ senderId: "insert-{table_name}-{record_id}", message: "Test message" });

Update/Delete Queries: ✓ const { data, error } = await supabase.from("fans") .update({ authId: "updated_user_role_auth" }) .eq("id", "insert-{table_name}-{record_id}"); ✓ const { data, error } = await supabase.from("chat_messages") .delete() .eq("id", "insert-{table_name}-{record_id}") .eq("senderId", "insert-{table_name}-{record_id}");

EXPECTED RESPONSE FORMATS:

For SELECT operations with no access: { "success": true, "data": [], "error": null, "status": 200, "statusText": "OK", "context": { "role": "user_role", "operation": "SELECT" } }

For SELECT operations with data: { "success": true, "data": [{ /* expected data shape */ }], "error": null, "status": 200, "statusText": "OK", "context": { "role": "user_role", "operation": "SELECT" } }

For blocked INSERT operations: { "success": false, "data": null, "error": { "code": "42501", "details": null, "hint": null, "message": "new row violates row-level security policy for table "table_name"" }, "status": 403, "statusText": "Forbidden", "context": { "role": "user_role", "operation": "INSERT" } }

For blocked UPDATE/DELETE operations: { "success": false, "data": null, "error": { "code": "42501", "message": "new row violates row-level security policy", "details": null, "hint": null }, "status": 403, "statusText": "Forbidden", "context": { "role": "user_role", "operation": "UPDATE/DELETE" } }

For successful operations that should be blocked (security violation): { "success": false, "data": null, "error": { "message": "Operation succeeded when it should have been blocked by RLS", "code": "SECURITY_VIOLATION", "details": "User impersonation allowed access to restricted record" }, "status": 403, "statusText": "Forbidden", "context": { "role": "user_role", "operation": "INSERT/UPDATE/DELETE" } }

TEST CATEGORIES TO GENERATE:

Role-Based Read Access

Testing proper read access for each role defined in rolesContext.
Verifying that a user can access their own data while being restricted from reading records owned by others.
Checking column-level restrictions and relationship-based data access.
Role-Based Write Access

Testing insert operations for each role on their own records.
Testing update operations for each role on their own records.
Testing delete operations for each role on their own records.
Verifying foreign key constraints and ensuring data integrity during cross-user interactions.
RLS Policy Enforcement in Multi-User Scenarios

Testing explicit deny rules when a user attempts to modify or access data belonging to another role.
Testing explicit allow rules when the correct permissions are in place.
Verifying default deny behavior and enforcing custom JWT claim-based access.
Testing organization boundaries for cross-user access restrictions (if applicable).
REQUIREMENTS:

Must generate tests for EVERY table defined in the schema.
Each table must have tests for all operations (SELECT, INSERT, UPDATE, DELETE).
Each table must have at least 5 unique test cases.
All queries must be executable with the appropriate user key based on the simulated role.
All queries must be unique and not repeat the same pattern. Continue generating unique queries until a full comprehensive test suite is created for each table.
All tests must be executed under specific user roles as defined in rolesContext.
Focus on enforcing RLS policies, cross-role restrictions, and data isolation between users.
Output must be valid JSON.
Tests must respect table relationships, foreign key constraints, and impersonation restrictions.
The JSON output must follow this structure: { "test_categories": [ { "id": "unique-string", "name": "Category Name", "description": "Category description", "tests": [ { "id": "unique-string", "name": "Test name", "description": "Test description", "query": "const { data, error } = await supabase...", "expected": { "success": boolean, "data": any, "error": object | null, "context": { "role": "role_name", "operation": "SELECT|INSERT|UPDATE|DELETE" } } } ] } ] }`;

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!
    });

    const msg = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 4000,
      temperature: 0.7,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: userPrompt
            }
          ]
        }
      ]
    });

    console.log("Anthropic API response received");
    console.log("Raw response from Anthropic:", msg);

    const completionText = msg.content?.[0]?.type === 'text' ? msg.content[0].text : "";
    console.log("Completion text:", completionText);

    if (!completionText || completionText.trim().length === 0) {
      console.log("Completion content is empty:", msg);
      throw new Error("No solution generated");
    }

    let solution;
    try {
      solution = JSON.parse(completionText);
      console.log("Parsed solution:", solution);
    } catch (error) {
      console.error("Failed to parse generated tests:", error);
      throw new Error("Failed to parse generated tests as JSON");
    }

    // Extract roles from the test cases
    const roles = new Set<string>();
    solution.test_categories.forEach(category => {
      category.tests.forEach(test => {
        if (test.expected?.context?.role) {
          roles.add(test.expected.context.role);
        }
      });
    });

    const response = {
      success: true,
      result: solution,
      analysis: {
        rolesDetected: roles.size,
        roles: Array.from(roles),
        hasOrgPolicies: analysis.hasOrgPolicies,
        hasCustomClaims: analysis.hasCustomClaims
      }
    };

    console.log("Sending response:", response);
    return NextResponse.json(response);

  } catch (error) {
    console.error("Error generating multi-user tests:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
} 