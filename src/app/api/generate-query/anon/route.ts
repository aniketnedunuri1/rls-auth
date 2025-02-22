import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

// The test suite names we want to cover in one shot:
const testSuites = [
  "authentication-privilege-tests",
  "rls-security",
  "sql-injection",
  "row-based-access",
  "fuzzing",
  "performance-load",
];

function buildSuiteInstruction(suites: string[]): string {
  return suites.map((suite) => `- ${suite}`).join("\n");
}

// Add type for the content block
interface ContentBlock {
  type: string;
  text?: string;
}

/**
 * Modified prompt for strictly anonymous users.
 */
function generateLLMPrompt(
  schema: string,
  rls: string,
  additionalContext: string,
  testSuites: string[]
): string {
  const suiteList = testSuites.map((suite) => `- ${suite}`).join("\n");

  return `
Context:
Database Schema:
${schema}

RLS Policies:
${rls}

User Description:
${additionalContext}

Test Suite:
${suiteList}

Task:
Using the provided information, generate a JSON object that defines a comprehensive suite of tests for the user's database from an anonymous user's perspective.

IMPORTANT ROLE AND ACCESS RULES:
- You are STRICTLY an anonymous user.
- You have NO access to any existing records.
- All queries must be strictly acting as an anonymous user.
- Only attempt operations that a real anonymous user could perform.
- Focus on testing RLS policies and access restrictions.
- For insert operations, use only required fields with actual values.
- For select operations, use only required fields with actual values.
- If a query you generate references a record ID, ensure to name it "insert-{table_name}-{record_id}".
- Ensure your testing suite is comprehensive and covers all aspects of RLS policies and all tables provided in the schema.

CORRECT TEST PATTERNS FOR ANON:

1. Select Queries:
   ✓ const { data, error } = await supabase.from("fans").select("*");
   ✓ const { data, error } = await supabase.from("creators").select("id, authId").eq("id", "insert-{table_name}-{record_id}");

2. Insert Queries:
   ✓ const { data, error } = await supabase.from("fans").insert({ authId: "anon_auth" });
   ✓ const { data, error } = await supabase.from("chat_messages").insert({ 
       senderId: "insert-{table_name}-{record_id}",
       message: "Test message" 
     });

3. Update/Delete Queries:
   ✓ const { data, error } = await supabase.from("fans")
       .update({ authId: "new_anon_auth" })
       .eq("id", "insert-{table_name}-{record_id}");
   
   ✓ const { data, error } = await supabase.from("chat_messages")
       .delete()
       .eq("id", "insert-{table_name}-{record_id}")
       .eq("senderId", "insert-{table_name}-{record_id}");

SCHEMA-SPECIFIC RULES:
- Only use columns that exist in the provided schema.
- Do not assume existence of columns; if a column is not in the schema, do not use it in your queries.
- Focus on basic CRUD operations without filters.

EXPECTED RESPONSE FORMATS:

1. For SELECT operations with no access:
{
  "success": true,
  "data": [],
  "error": null,
  "status": 200,
  "statusText": "OK",
  "context": {
    "userRole": "anon",
    "operation": "SELECT"
  }
}

2. For SELECT operations with data:
{
  "success": true,
  "data": [{ /* expected data shape */ }],
  "error": null,
  "status": 200,
  "statusText": "OK",
  "context": {
    "userRole": "anon",
    "operation": "SELECT"
  }
}

3. For blocked INSERT operations:
{
  "success": false,
  "data": null,
  "error": {
    "code": "42501",
    "details": null,
    "hint": null,
    "message": "new row violates row-level security policy for table \"table_name\""
  },
  "status": 403,
  "statusText": "Forbidden",
  "context": {
    "userRole": "anon",
    "operation": "INSERT"
  }
}

4. For blocked UPDATE/DELETE operations:
{
  "success": false,
  "data": null,
  "error": {
    "code": "42501",
    "message": "new row violates row-level security policy",
    "details": null,
    "hint": null
  },
  "status": 403,
  "statusText": "Forbidden",
  "context": {
    "userRole": "anon",
    "operation": "UPDATE/DELETE"
  }
}

5. For successful operations that should be blocked (security violation):
{
  "success": false,
  "data": null,
  "error": {
    "message": "Operation succeeded when it should have been blocked by RLS",
    "code": "SECURITY_VIOLATION",
    "details": "Anonymous user was able to perform restricted operation"
  },
  "status": 403,
  "statusText": "Forbidden",
  "context": {
    "userRole": "anon",
    "operation": "INSERT/UPDATE/DELETE"
  }
}

Note: The 'timestamp' field in context will be ignored for comparison purposes.

TEST CATEGORIES TO GENERATE:
1. Table-Level Read Access
   - Testing anonymous read access for each table in schema
   - Testing restricted data access
   - Testing column-level restrictions
   - Testing relationship-based access

2. Table-Level Write Access
   - Testing anonymous insert for each table
   - Testing anonymous update for each table
   - Testing anonymous delete for each table
   - Testing foreign key constraints

3. RLS Policy Enforcement
   - Testing explicit deny rules for each table
   - Testing explicit allow rules for each table
   - Testing default deny behavior
   - Testing relationship-based policies

REQUIREMENTS:
1. Must generate tests for EVERY table defined in the schema.
2. Each table must have tests for all operations (SELECT, INSERT, UPDATE, DELETE).
3. Each table must have at least 5 unique test cases.
4. All queries must be executable with only the anon key.
5. All queries must be unique and not repeat the same pattern, and they must be a full comprehensive test of the RLS policies and schema. Continue to generate unique queries until you have enough unique tests for each table.
6. All tests must be from an anonymous user perspective.
7. Focus on RLS policy enforcement.
8. Output must be valid JSON.
9. Tests must respect table relationships and foreign key constraints.

The JSON output must follow this structure:
{
  "test_categories": [
    {
      "id": "unique-string",
      "name": "Category Name",
      "description": "Category description",
      "tests": [
        {
          "id": "unique-string",
          "name": "Test name",
          "description": "Test description",
          "query": "const { data, error } = await supabase...",
          "expected": {
            // (FOLLOW EXPECTED RESPONSE FORMAT AS STATED ABOVE)
          }
        }
      ]
    }
  ]
}`;
}

export async function POST(request: Request): Promise<Response> {
  try {
    // Extract the necessary parameters from the request.
    console.log("Received request to generate tests");
    const { schema, rlsPolicies, additionalContext } = await request.json();
    // Build the prompt using the helper function.
    const prompt = generateLLMPrompt(
      schema,
      rlsPolicies,
      additionalContext || "",
      testSuites
    );

    // System instructions remain identical.
    const systemPrompt =
      "You are a malicious database penetration tester. Follow the instructions exactly to generate a strict JSON object. Do not output any extra text.";

    // Anthropic requires a "\n\nHuman:" turn after the optional system prompt.
    const userContent = "\n\nHuman:" + prompt;

    // Initialize the Anthropic client with your API key.
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
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
              text: userContent,
            },
          ],
        },
      ],
    });

    console.log("Anthropic API response:", msg);

    // Extract the completion text with type checking
    const completionText = msg.content?.[0]?.type === 'text' ? msg.content[0].text : "";
    if (!completionText || completionText.trim().length === 0) {
      console.log("Completion content is empty:", msg);
      throw new Error("No solution generated");
    }

    let solution;
    try {
      solution = JSON.parse(completionText);
      if (!solution.test_categories) {
        throw new Error("Invalid solution format");
      }
    } catch (e) {
      console.error("Error parsing solution:", e, "Content:", completionText);
      throw new Error("Failed to generate valid solution");
    }

    return NextResponse.json({
      success: true,
      result: solution,
    });
  } catch (error) {
    console.error("Error generating tests:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate tests",
      },
      { status: 500 }
    );
  }
} 