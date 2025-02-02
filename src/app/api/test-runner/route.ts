// import { NextResponse } from "next/server"
// import OpenAI from "openai"

// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// })

// const testSuites = [
//   "authentication-privilege-tests",
//   "rls-security",
//   "sql-injection",
//   "row-based-access",
//   "fuzzing",
//   "performance-load",
// ]

// export async function POST(req: Request) {
//   try {
//     const { schema, rlsPolicies } = await req.json()

//     if (!schema || !rlsPolicies) {
//       return NextResponse.json({ error: "Schema or RLS policies are missing" }, { status: 400 })
//     }

//     const results = await Promise.all(
//       testSuites.map(async (testSuite) => {
//         try {
//           const completion = await openai.chat.completions.create({
//             model: "gpt-4",
//             messages: [
//               {
//                 role: "system",
//                 content:
//                   "You are a database security expert. Analyze the given schema and RLS policies, then run the specified test suite. Provide results in a JSON format with 'testName', 'status' (passed/failed/warning), and 'message' fields.",
//               },
//               {
//                 role: "user",
//                 content: `Schema: ${schema}\n\nRLS Policies: ${rlsPolicies}\n\nRun the ${testSuite} test suite.`,
//               },
//             ],
//             max_tokens: 2000,
//           })

//           const content = completion.choices[0].message.content
//           if (!content) {
//             throw new Error("No content received from OpenAI")
//           }

//           let result
//           try {
//             result = JSON.parse(content)
//           } catch (parseError) {
//             console.error("Error parsing OpenAI response:", parseError)
//             throw new Error("Invalid response format from OpenAI")
//           }

//           return { testSuite, results: result }
//         } catch (error) {
//           console.error(`Error in test suite ${testSuite}:`, error)
//           return {
//             testSuite,
//             results: [
//               {
//                 testName: "API Error",
//                 status: "failed",
//                 message: error instanceof Error ? error.message : "Unknown error",
//               },
//             ],
//           }
//         }
//       }),
//     )

//     return NextResponse.json({ results })
//   } catch (error) {
//     console.error("Error in test runner:", error)
//     return NextResponse.json(
//       { error: "Error processing request", details: error instanceof Error ? error.message : "Unknown error" },
//       { status: 500 },
//     )
//   }
// }

import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const testSuites = [
  "authentication-privilege-tests",
  "rls-security",
  "sql-injection",
  "row-based-access",
  "fuzzing",
  "performance-load",
];

export async function POST(req: Request): Promise<Response> {
  try {
    const { schema, rlsPolicies } = await req.json();

    if (!schema || !rlsPolicies) {
      return new Response(
        JSON.stringify({ error: "Schema or RLS policies are missing" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const results = await Promise.all(
      testSuites.map(async (testSuite) => {
        try {
          const completion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
              {
                role: "system",
                content:
                  "You are a database security expert. Analyze the given schema and RLS policies, then run the specified test suite. Provide results in a JSON format with 'testName', 'status' (passed/failed/warning), and 'message' fields.",
              },
              {
                role: "user",
                content: `Schema: ${schema}\n\nRLS Policies: ${rlsPolicies}\n\nRun the ${testSuite} test suite.`,
              },
            ],
            max_tokens: 2000,
          });

          const content = completion.choices[0]?.message?.content;
          if (!content) {
            throw new Error("No content received from OpenAI");
          }

          let result;
          try {
            result = JSON.parse(content);
          } catch (parseError) {
            console.error("Error parsing OpenAI response:", parseError);
            throw new Error("Invalid response format from OpenAI");
          }

          return { testSuite, results: result };
        } catch (error) {
          console.error(`Error in test suite ${testSuite}:`, error);
          return {
            testSuite,
            results: [
              {
                testName: "API Error",
                status: "failed",
                message: error instanceof Error ? error.message : "Unknown error",
              },
            ],
          };
        }
      })
    );

    return new Response(JSON.stringify({ results }), {
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

