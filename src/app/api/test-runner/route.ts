import OpenAI from "openai";

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

// REVISED PROMPT
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
You are a single ANONYMOUS user who only has access to the database via the public URL and anon key. You do not have access to any rows of the database,  DO NOT generate any queries with mock uuid's. Do not write queries that have logic like this: .eq('creatorId', 'non_existing_creator_uuid') as we do not have access to any uuid's. 
You have the "authenticated" role (due to signInAnonymously) but you do NOT have any other roles or admin privileges. 
You must act as a malicious actor whose goal is to infiltrate or manipulate the database from this single user session. 
Do not assume you can impersonate other roles or reference multiple authenticated sessions. 
All malicious attempts should be from the perspective of this single user with the anon key.

Every test query must be written in Supabase TypeScript format, and must include a return statement with a JSON-serializable object. 
For example:
  
  const { data, error } = await supabase.from("table_name").select("*").limit(1);
  return { data, error };

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

For a SELECT query:
{
  "data": [
    { "id": 1, "name": "Harry" },
    { "id": 2, "name": "Frodo" },
    { "id": 3, "name": "Katniss" }
  ],
  "status": 200,
  "statusText": "OK"
}

For a response with a count:
{
  "count": 3,
  "status": 200,
  "statusText": "OK"
}

For an INSERT query:
{
  "data": [
    { "id": 1, "name": "Mordor" }
  ],
  "status": 201,
  "statusText": "Created"
}

For an error response:
{
  "error": {
    "code": "23505",
    "details": "Key (id)=(1) already exists.",
    "hint": null,
    "message": "duplicate key value violates unique constraint \\"countries_pkey\\""
  },
  "status": 409,
  "statusText": "Conflict"
}

For an UPDATE query:
{
  "data": [
    { "id": 1, "name": "piano" }
  ],
  "status": 200,
  "statusText": "OK"
}

For an UPSERT query:
{
  "data": [
    { "id": 1, "name": "piano" },
    { "id": 2, "name": "harp" }
  ],
  "status": 201,
  "statusText": "Created"
}

Requirements:
1. Generate at least three test categories (for example, "RLS Testing", "SQL Injection Testing", and "Privileges Testing").
2. Each test category must include at least 5 unique test cases.
3. All queries must be executable with only the public URL and anon key, as this single user.
4. The "query" property in each test must be in valid Supabase TypeScript format, including the return statement.
5. The "expected" property must exactly match one of the response JSON examples. 
6. Output MUST be strictly valid JSON. No extra keys, commentary, or markdown.
7. Do not truncate the output; produce all test cases.
8. You are acting as a single anonymous user. Do not simulate multiple distinct users or roles; your infiltration attempts come solely from this one session.
9. Do not write any queries that have placeholder values such as placeholder uuid's. All queries must be ready to run with 0 input or changes required by a human. Your code must be 100% ready to be run with 0 assistance, and 0 truncation/replacement needed. 

Generate the JSON output strictly following these instructions.
`;
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

    // Build a single prompt referencing all test suite topics
    const prompt = generateLLMPrompt(schema, rlsPolicies, additionalContext || "", testSuites);

    // Single call to OpenAI
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

    // Preprocess the content to handle escape issues
    const escapedContent = content.replace(/(?<!\\)\\'/g, "\\\\'");

    let result;
    try {
      result = JSON.parse(escapedContent);
    } catch (parseError) {
      console.error("Error parsing OpenAI response:", parseError);
      console.error("Response content:", escapedContent);
      throw new Error("Invalid response format from OpenAI");
    }

    // Return the single big result
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
