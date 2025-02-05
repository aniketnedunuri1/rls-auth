// import OpenAI from "openai";

// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });

// // The test suite names can be used to further specialize the prompt.
// const testSuites = [
//   "authentication-privilege-tests",
//   "rls-security",
//   "sql-injection",
//   "row-based-access",
//   "fuzzing",
//   "performance-load",
// ];

// /**
//  * Generates a prompt for the LLM that instructs it to create a full suite of test cases.
//  * The query property must be a Supabase TypeScript code snippet and the expected property
//  * must be a JSON object matching typical Supabase API responses.
//  *
//  * @param schema - The database schema as a string.
//  * @param rls - The RLS policies as a string.
//  * @param additionalContext - A user-supplied description outlining what should be tested.
//  * @param testSuite - The name of the test suite (used to further specialize the prompt).
//  * @returns A string containing the prompt to send to the LLM.
//  */
// function generateLLMPrompt(
//   schema: string,
//   rls: string,
//   additionalContext: string,
//   testSuite: string
// ): string {
//   return `
// Context:
// Database Schema:
// ${schema}

// RLS Policies:
// ${rls}

// User Description:
// ${additionalContext}

// Test Suite: ${testSuite}

// Task:
// Using the provided information, generate a JSON object that defines a comprehensive suite of tests for the user's database. You must act as a malicious actor whose goal is to infiltrate the database by finding every possible vulnerability in the schema and RLS policies. The generated tests will later be executed via a Supabase client that uses only the public URL and anon key. Therefore, the queries you generate must be written in Supabase TypeScript format.

// The JSON object must have a property "test_categories" (an array). Each test category must include:
//   - "id": A unique identifier string for the test category.
//   - "name": The name of the test category.
//   - "description": A brief description of what this category tests.
//   - "tests": An array of test case objects.

// Each test case object must have these properties:
//   - "id": A unique identifier string for the test case.
//   - "name": The name of the test.
//   - "description": A detailed explanation of what the test verifies.
//   - "query": A Supabase TypeScript code snippet that executes a query using the Supabase client. For example:
  
//     const { data, error } = await supabase.from("table_name").select("*").limit(1);
  
//   The query must be designed to test the database for vulnerabilities (e.g. bypassing RLS policies, SQL injection, privilege escalation, etc.) and must be executable using only the public URL and anon key.
  
//   - "expected": A JSON object representing the expected output from Supabase when executing the query. The expected output must follow one of these formats:

// For a SELECT query:
// {
//   "data": [
//     { "id": 1, "name": "Harry" },
//     { "id": 2, "name": "Frodo" },
//     { "id": 3, "name": "Katniss" }
//   ],
//   "status": 200,
//   "statusText": "OK"
// }

// For a response with a count:
// {
//   "count": 3,
//   "status": 200,
//   "statusText": "OK"
// }

// For an INSERT query:
// {
//   "data": [
//     { "id": 1, "name": "Mordor" }
//   ],
//   "status": 201,
//   "statusText": "Created"
// }

// For an error response:
// {
//   "error": {
//     "code": "23505",
//     "details": "Key (id)=(1) already exists.",
//     "hint": null,
//     "message": "duplicate key value violates unique constraint \\"countries_pkey\\""
//   },
//   "status": 409,
//   "statusText": "Conflict"
// }

// For an UPDATE query:
// {
//   "data": [
//     { "id": 1, "name": "piano" }
//   ],
//   "status": 200,
//   "statusText": "OK"
// }

// For an UPSERT query:
// {
//   "data": [
//     { "id": 1, "name": "piano" },
//     { "id": 2, "name": "harp" }
//   ],
//   "status": 201,
//   "statusText": "Created"
// }

// Requirements:
// 1. Generate at least three test categories (for example, "RLS Testing", "Authentication Testing", and "SQL Injection Testing").
// 2. Each test category must include at least 10 unique test cases.
// 3. All SQL queries must be executable with only public access (i.e. using only the public URL and anon key).
// 4. The "query" property in each test case must be a Supabase TypeScript code snippet exactly in the format shown above.
// 5. The "expected" property must be a JSON object exactly matching one of the response formats provided.
// 6. Output MUST be strictly valid JSON. Do not include any extra text, commentary, markdown formatting, or extra keys.
// 7. Do NOT truncate your output; generate every single test case necessary to thoroughly assess the schema and RLS policies.
// 8. You are acting as a malicious actor trying to break into the database. Your queries must attempt to bypass RLS policies, exploit SQL injections, perform unauthorized updates/inserts, and cover every potential edge case for infiltration.

// Generate the JSON output strictly following these instructions.
// `;
// }

// export async function POST(req: Request): Promise<Response> {
//   try {
//     const { schema, rlsPolicies, additionalContext } = await req.json();

//     if (!schema || !rlsPolicies) {
//       return new Response(
//         JSON.stringify({ error: "Schema or RLS policies are missing" }),
//         { status: 400, headers: { "Content-Type": "application/json" } }
//       );
//     }

//     // For each test suite, generate a test suite JSON output via OpenAI.
//     const results = await Promise.all(
//       testSuites.map(async (testSuite) => {
//         try {
//           // Build our prompt with dynamic inputs
//           const prompt = generateLLMPrompt(schema, rlsPolicies, additionalContext || "", testSuite);

//           const completion = await openai.chat.completions.create({
//             model: "gpt-4",
//             messages: [
//               {
//                 role: "system",
//                 content:
//                   "You are a malicious database penetration tester. Follow the instructions exactly to generate a strict JSON object as described in the prompt. Do not output any extra text.",
//               },
//               {
//                 role: "user",
//                 content: prompt,
//               },
//             ],
//             max_tokens: 4000,
//           });

//           const content = completion.choices[0]?.message?.content;
//           if (!content) {
//             throw new Error("No content received from OpenAI");
//           }

//           let result;
//           try {
//             result = JSON.parse(content);
//           } catch (parseError) {
//             console.error("Error parsing OpenAI response:", parseError);
//             console.error("Response content:", content);
//             throw new Error("Invalid response format from OpenAI");
//           }

//           return { testSuite, results: result };
//         } catch (error) {
//           console.error(`Error in test suite ${testSuite}:`, error);
//           return {
//             testSuite,
//             results: [
//               {
//                 testName: "API Error",
//                 status: "failed",
//                 message: error instanceof Error ? error.message : "Unknown error",
//               },
//             ],
//           };
//         }
//       })
//     );

//     return new Response(JSON.stringify({ results }), {
//       status: 200,
//       headers: { "Content-Type": "application/json" },
//     });
//   } catch (error) {
//     console.error("Error in test runner:", error);
//     return new Response(
//       JSON.stringify({
//         error: "Error processing request",
//         details: error instanceof Error ? error.message : "Unknown error",
//       }),
//       {
//         status: 500,
//         headers: { "Content-Type": "application/json" },
//       }
//     );
//   }
// }

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

/**
 * Generates a single prompt that references all test suites at once.
 */
/**
 * Generates a prompt that instructs the LLM to output a strict JSON test suite.
 *
 * @param schema - The database schema as a string.
 * @param rls - The RLS policies as a string.
 * @param additionalContext - A user-supplied description outlining what should be tested.
 * @param testSuites - An array of test suite topics.
 * @returns A string containing the prompt to send to the LLM.
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
Using the provided information, generate a JSON object that defines a comprehensive suite of tests for the user's database. You must act as a malicious actor whose goal is to infiltrate the database by finding every possible vulnerability in the schema and RLS policies. The generated tests will later be executed via a Supabase client that uses only the public URL and anon key. Therefore, the queries you generate must be written in Supabase TypeScript format.

IMPORTANT:  
Every query must include a return statement at the end that returns a JSON‑serializable object. For example, if your query code snippet is:
  
  const { data, error } = await supabase.from("table_name").select("*").limit(1);
  
then you must add at the end:
  
  return { data, error };
  
This ensures that the evaluated code produces a value that is valid JSON.

The JSON object must have a property "test_categories" (an array). Each test category must include:
  - "id": A unique identifier string for the test category.
  - "name": The name of the test category.
  - "description": A brief description of what this category tests.
  - "tests": An array of test case objects.

Each test case object must have these properties:
  - "id": A unique identifier string for the test case.
  - "name": The name of the test.
  - "description": A detailed explanation of what the test verifies.
  - "query": A Supabase TypeScript code snippet that executes a query using the Supabase client. For example:
  
    const { data, error } = await supabase.from("table_name").select("*").limit(1);
    return { data, error };
  
  The query must be designed to test the database for vulnerabilities (e.g. bypassing RLS policies, SQL injection, unauthorized updates/inserts, etc.) and must be executable using only the public URL and anon key.
  
  - "expected": A JSON object representing the expected output from Supabase when executing the query. The expected output must follow one of these formats:

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
1. Generate at least three test categories (for example, "RLS Testing", "Authentication Testing", and "SQL Injection Testing").
2. Each test category must include at least 5 unique test cases.
3. All SQL queries must be executable with only public access (i.e. using only the public URL and anon key).
4. The "query" property in each test case must be a Supabase TypeScript code snippet exactly in the format shown above, including the required return statement.
5. The "expected" property must be a JSON object exactly matching one of the response formats provided.
6. Output MUST be strictly valid JSON. Do not include any extra text, commentary, markdown formatting, or extra keys.
7. Do NOT truncate your output; generate every single test case necessary to thoroughly assess the schema and RLS policies.
8. You are acting as a malicious actor trying to break into the database. Your queries must attempt to bypass RLS policies, exploit SQL injections, perform unauthorized updates/inserts, and cover every potential edge case for infiltration.

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
          content:
            "You are a malicious database penetration tester. Follow the instructions exactly to generate a strict JSON object. Do not output any extra text.",
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

    // Preprocess the content to escape special characters
    const escapedContent = content.replace(/(?<!\\)\\'/g, '\\\\\'');

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
