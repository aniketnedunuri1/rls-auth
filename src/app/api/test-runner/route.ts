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
- You are STRICTLY an anonymous authenticated user (via signInAnonymously)
- You have NO access to any existing records
- All queries must be strictly acting as an anonymous user
- Only attempt operations that a real anonymous user could perform
- Focus on testing RLS policies and access restrictions
- For insert operations, use only required fields with actual values
- For select operations, use only public field filtering
- Never use or reference UUIDs or specific record IDs

CORRECT TEST PATTERNS:
1. Select Queries:
   ✓ const { data, error } = await supabase.from("table").select("*");
   ✓ const { data, error } = await supabase.from("table").select("message");
   ❌ NO .eq() filters that reference IDs or non-existent columns

2. Insert Queries:
   ✓ const { data, error } = await supabase.from("table").insert({ message: "Test message" });
   ✓ const { data, error } = await supabase.from("table").insert({ message: "Anonymous message" });

3. Update/Delete Queries:
   ✓ const { data, error } = await supabase.from("table").update({ field: "value" }).eq("public_field", true);
   ✓ const { data, error } = await supabase.from("table").delete().eq("public_field", true);
   // Must include WHERE clause

SCHEMA-SPECIFIC RULES:
- Only use columns that exist in the provided schema
- Do not assume existence of columns like 'is_public'
- Focus on basic CRUD operations without filters
- For chat_messages table, only use the 'message' column in tests

INCORRECT PATTERNS (NEVER USE):
❌ Any UUID references
❌ Specific record IDs
❌ SQL injection attempts
❌ References to existing records

EXPECTED RESPONSE FORMATS:

1. For SELECT operations:
   When access is blocked or no data available:
   {
     "data": [],
     "error": null
   }
   OR
   {
     "data": null,
     "error": null
   }
   (Both responses are equivalent for empty/blocked results)

2. For INSERT operations:
   When allowed:
   {
     "data": null,
     "error": null
   }
   
   When blocked by RLS:
   {
     "data": null,
     "error": {
       "code": "42501",
       "message": "new row violates row-level security policy",
       "details": null,
       "hint": null
     }
   }

3. For UPDATE/DELETE operations without WHERE clause:
   {
     "data": null,
     "error": {
       "code": "21000",
       "message": "UPDATE/DELETE requires a WHERE clause",
       "details": null,
       "hint": null
     }
   }

4. For UPDATE/DELETE operations with WHERE clause:
   When blocked by RLS:
   {
     "data": null,
     "error": {
       "code": "42501",
       "message": "new row violates row-level security policy",
       "details": null,
       "hint": null
     }
   }
   
   When no rows affected:
   {
     "data": null,
     "error": null
   }

TEST CATEGORIES TO GENERATE:
1. Anonymous Read Access
   - Testing public data visibility
   - Testing restricted data access
   - Testing column-level restrictions

2. Anonymous Write Access
   - Testing insert permissions
   - Testing update restrictions
   - Testing delete restrictions

3. RLS Policy Enforcement
   - Testing explicit deny rules
   - Testing explicit allow rules
   - Testing default deny behavior

REQUIREMENTS:
1. Each test category must include at least 5 unique test cases
2. All queries must be executable with only anon key
3. No placeholder values or UUIDs
4. All tests must be from anonymous user perspective
5. Focus on RLS policy enforcement
6. Output must be valid JSON
7. Include complete test cases
8. Test names should clearly describe the security aspect being tested

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
            "data": null,
            "error": null
          }
        }
      ]
    }
  ]
}`;
}

export async function POST(req: Request): Promise<Response> {
  try {
    const { schema, rlsPolicies, additionalContext } = await req.json();

    if (!schema || !rlsPolicies) {
      return new Response(
        JSON.stringify({ error: "Schema or RLS policies are missing" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const prompt = generateLLMPrompt(schema, rlsPolicies, additionalContext || "", testSuites);

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
