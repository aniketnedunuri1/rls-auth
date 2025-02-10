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
Using the provided information, generate a JSON object that defines a comprehensive suite of tests for the user's database. 

IMPORTANT ROLE AND ACCESS RULES:
- You are STRICTLY an anonymous authenticated user (via signInAnonymously)
- You have NO access to any UUIDs or existing records. No queries should reference UUIDs or existing records. All queries must be strictly acting as an anonymous user.
- NEVER use placeholder UUIDs or IDs like 'non_existing_id' or 'some-uuid' or 'fake-uuid' or 'placeholder-uuid'. If a query requires a UUID, you must regenerate the query without it, or you must generate a new query that does not have a UUID.
- Only attempt operations that a real anonymous user could perform, with no access to any UUIDs or existing records.
- Do not assume you can reference specific records or users
- All queries must work without modification or placeholder values
- Focus on testing RLS policies and access restrictions from an anonymous context
- For insert/update operations, use actual values that don't require existing records
- For select operations, use filtering based on public fields only

Examples of CORRECT queries:
1. Select all public records:
   const { data, error } = await supabase.from("posts").select("*").eq("is_public", true);

2. Insert with generated values:
   const { data, error } = await supabase.from("messages").insert({ content: "Test message" });

3. Update based on public fields:
   const { data, error } = await supabase.from("comments").update({ status: "edited" }).eq("is_public", true);

Examples of INCORRECT queries (DO NOT USE):
❌ .eq('user_id', 'some-uuid')
❌ .match({ id: "non_existing_id" })
❌ .eq('creator_id', 'placeholder-uuid')

The JSON object you generate must have a property "test_categories" (an array). Each test category must include:
  - "id": A unique identifier string for the test category.
  - "name": The name of the test category.
  - "description": A brief description of what this category tests.
  - "tests": An array of test case objects.

Each test case object must have these properties:
  - "id": A unique identifier string for the test case.
  - "name": The name of the test.
  - "description": A detailed explanation of what the test verifies.
  - "query": A Supabase TypeScript code snippet that executes a malicious or unauthorized attempt from your single user context. Include:
       return { data, error };
    at the end to return a JSON result.
  - "expected": A JSON object representing the anticipated response from Supabase (select, insert, update, error, etc.) 
    following the formats:
For expected responses, use EXACTLY these formats:

For a successful SELECT query:
{
  "data": [],
  "error": null
}

For an empty SELECT query:
{
  "data": null,
  "error": null
}

For a successful INSERT/UPDATE:
{
  "data": [],
  "error": null
}

For an RLS policy violation:
{
  "data": null,
  "error": {
    "code": "42501",
    "message": "new row violates row-level security policy",
    "details": null,
    "hint": null
  }
}

For a SQL injection attempt:
{
  "data": null,
  "error": null
}

For a constraint violation:
{
  "data": null,
  "error": {
    "code": "23502",
    "message": "null value in column violates not-null constraint",
    "details": null,
    "hint": null
  }
}


Requirements:
1. Generate at least three test categories (for example, "RLS Testing", "SQL Injection Testing", and "Privileges Testing") and anyother categories you see fit after analyzing the schema and RLS policies.
2. Each test category must include at least 5 unique test cases.
3. All queries must be executable with only the public URL and anon key, as this single anonymous user.
4. The "query" property in each test must be in valid Supabase TypeScript format, including the return statement.
5. The "expected" property must exactly match one of the response JSON examples. 
6. Output MUST be strictly valid JSON. No extra keys, commentary, or markdown.
7. Do not truncate the output; produce all test cases.
8. You are acting as a single anonymous user. Do not simulate multiple distinct users or roles.
9. Do not write any queries that have placeholder values. All queries must be ready to run with 0 input or changes required.
10. Never output arrays as [...]. Use [] if the array should have data, and use null if there should not be data,
11. Do not use placeholder UUIDs or IDs like 'non_existing_id' or 'some-uuid' or 'fake-uuid' or 'placeholder-uuid'. If you do, you must regenerate the query.

Generate the JSON output strictly following these instructions.`;
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
