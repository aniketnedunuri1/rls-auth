import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

function generateLLMPrompt(
  schema: string,
  rls: string,
  additionalContext: string,
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

Task:
Using the provided information, generate a JSON object that defines a comprehensive suite of tests for the user's database from an anonymous user's perspective.

IMPORTANT ROLE AND ACCESS RULES:
- You are STRICTLY an anonymous authenticated user (via signInAnonymously)
- You have NO access to any existing records
- All queries must be strictly acting as an anonymous user
- Only attempt operations that a real anonymous user could perform
- Focus on testing RLS policies and access restrictions
- For insert operations, use only required fields with actual values
- For select operations, use only required fields with actual values
- If a query you generate references a record ID, ensure to name it "insert-{table_name}-{record_id}"
- Ensure your testing suite is comprehensive and covers all aspects of RLS policies and all tables provided in the schema

CORRECT TEST PATTERNS FOR ANON AUTH:

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
- Only use columns that exist in the provided schema
- Do not assume existence of columns, if a column is not in the schema, do not use it in your queries
- Focus on basic CRUD operations without filters


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
1. Must generate tests for EVERY table defined in the schema
2. Each table must have tests for all operations (SELECT, INSERT, UPDATE, DELETE)
3. Each table must have at least 5 unique test cases
4. All queries must be executable with only anon key
5. All queries must be unique and not repeat the same pattern, and they must be a full comprehensive test of the RLS policies and schema. Continue to generate unique queries until you have enough unique tests for each table.
6. All tests must be from anonymous user perspective
7. Focus on RLS policy enforcement
8. Output must be valid JSON
9. Tests must respect table relationships and foreign key constraints

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
            (FOLLOW EXPECTED RESPONSE FORMAT AS STATED ABOVE)
          }
        }
      ]
    }
  ]
}`;
}

export async function POST(req: Request): Promise<Response> {
  console.log("intest");
  try {
    const { schema, rlsPolicies, additionalContext } = await req.json();
    console.log("SCHEMA", schema);
    console.log("RLS POLICIES", rlsPolicies);
    console.log("ADDITIONAL CONTEXT", additionalContext); 

    if (!schema || !rlsPolicies) {
      return new Response(
        JSON.stringify({ error: "Schema or RLS policies are missing" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const prompt = generateLLMPrompt(schema, rlsPolicies, additionalContext);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini-2024-07-18",
      messages: [
        {
          role: "system",
          content: "You are a malicious database penetration tester. Follow the instructions exactly to generate a strict JSON object. Do not output any extra text.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 4000,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No content received from OpenAI");
    }

    const escapedContent = content.replace(/(?<!\\)\\'/g, "\\\\'");

    let result;
    try {
      result = JSON.parse(escapedContent);
    } catch (parseError) {
      console.error("Error parsing OpenAI response:", parseError);
      console.error("Response content:", escapedContent);
      throw new Error("Invalid response format from OpenAI");
    }

    return new Response(JSON.stringify({ result }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in test runner:", error);
    return new Response(
      JSON.stringify({
        error: "Error processing request",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
