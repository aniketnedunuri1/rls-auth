import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { 
      failedTests, 
      passedTests, 
      dbSchema, 
      currentRLS, 
      projectDescription 
    } = await request.json();

    const prompt = `
As a database security expert, analyze these test results and generate a comprehensive RLS policy solution.

Project Context:
${projectDescription}

Database Schema:
${dbSchema}

Current RLS Policies:
${currentRLS}

Failed Tests (Need fixing):
${failedTests.map(test => `
Test: ${test.name}
Description: ${test.description}
Query: ${test.query}
Error: ${JSON.stringify(test.result?.error)}
`).join('\n')}

Passed Tests (Must remain working):
${passedTests.map(test => `
Test: ${test.name}
Query: ${test.query}
`).join('\n')}

Requirements:
1. Generate a complete set of RLS policies that:
   - Fixes all failed tests
   - Maintains functionality of passed tests
   - Follows security best practices
   - Uses proper Supabase RLS syntax

2. The solution must:
   - Include ENABLE ROW LEVEL SECURITY statements where needed
   - Provide policies for all necessary operations (SELECT, INSERT, UPDATE, DELETE)
   - Include comments explaining each policy's purpose
   - Handle both authenticated and anonymous access appropriately
   - You must specify insert policies with the with check clause. The with check expression ensures that any new row data adheres to the policy constraints.
   - Ensure the sql you generate for the rls is fully ready to be copy pasted into a supabase sql editor.
   - The final rls policies must fully solve all the failed tests and maintain the functionality of all the passed tests. The most imporatant part is to solve the failed tests.
   - All policies must be supaase accepted, meaning,only WITH CHECK expression allowed for INSERT, and FOR clause in a policy only allows a single action at a time, meaning you must split these up into two seperate queries. (example, do not do this: CREATE POLICY "deny_anonymous_update_delete_creators" ON public.creators FOR UPDATE, DELETE TO anonymous USING (false); )(example: do not do this: CREATE POLICY "creators_insert_messages" ON public.chat_messages FOR INSERT TO authenticated USING (true) WITH CHECK (creatorId IN (SELECT id FROM creators WHERE authId = auth.uid())); )

3. Format the response as a JSON object:
{
  "description": "Detailed explanation of all changes and their impact",
  "schema": "Complete SQL statements for all RLS policies. No markdown, only sql which satisfies the requirements of solving the failed tests and maintaining the passed tests, and fixing the rls schema. "
}

Important: Return ONLY a valid JSON object with no additional text or formatting, and return a RLS policy set that satisfies the requirements of solving the failed tests and maintaining the passed tests, and fixing the rls schema. In addition, you must comply to this: only WITH CHECK expression allowed for INSERT`;

    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are a database security expert specializing in Supabase Row Level Security.
Your task is to generate a complete, working RLS policy set that fixes all security issues while maintaining existing functionality.
Respond only with valid JSON containing 'description' and 'schema' fields.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "gpt-4o-mini-2024-07-18",
      temperature: 0.7
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No solution generated");
    }

    let solution;
    try {
      solution = JSON.parse(content);
      
      // Validate solution format
      if (!solution.description || !solution.schema) {
        throw new Error("Invalid solution format");
      }
    } catch (e) {
      console.error("Error parsing solution:", e);
      throw new Error("Failed to generate valid solution");
    }

    return NextResponse.json({
      success: true,
      solution: solution.schema,  // Return just the SQL schema for updating the database
      description: solution.description  // Optional: Frontend can display this to explain changes
    });

  } catch (error) {
    console.error('Error generating comprehensive solution:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate solution'
      },
      { status: 500 }
    );
  }
} 