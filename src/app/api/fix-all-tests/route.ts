import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(request: Request) {
  try {
    const { 
      failedTests, 
      passedTests, 
      dbSchema, 
      currentRLS, 
      projectDescription 
    } = await request.json();

    // Define the system instructions
    const systemPrompt = "You are a database security expert specializing in Supabase Row Level Security. Your task is to generate a complete, working set of RLS policies in valid SQL that fixes all issues while maintaining existing functionality. Each policy must be a separate SQL statement with a single action in the FOR clause. For INSERT policies, do NOT include a USING clause; include only a WITH CHECK clause. Do NOT include any inline comments. Do NOT use the role \"anonymous\"; use \"anon\" for policies targeting unauthenticated access. Return ONLY the JSON object with no additional text, markdown, or formatting.";

    // Compose the user message with project context and test details.
    const userMessage = `
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
   - Fix all failed tests
   - Maintain functionality of all passed tests
   - Follow security best practices
   - Use proper Supabase RLS syntax

2. The solution must:
   - Include ENABLE ROW LEVEL SECURITY statements for all tables that are needed. Ensure you generate an entire RLS suite that satisfies the requirements of solving the failed tests and maintaining the passed tests, and fixing the rls schema.
   - Provide policies for SELECT, INSERT, UPDATE, and DELETE operations.
   - For INSERT policies, do NOT include a USING clause; include only a WITH CHECK clause.
   - Ensure that for any policy, the FOR clause only mentions a single operation; if the same table requires policies for multiple operations (e.g., UPDATE and DELETE), generate separate SQL statements for each.
   - Do NOT include any inline comments.
   - DO NOT use the role "anonymous"; use "anon" instead for unauthenticated access.

3. Format the response as a JSON object exactly as follows:
{
  "description": "Detailed explanation of all changes and their impact.",
  "schema": "Complete SQL statements for all RLS policies."
}

Important: Return ONLY the JSON object with no additional text, markdown, or formatting.`;

    // Anthropic requires a "\n\nHuman:" turn after the optional system prompt.
    const userContent = "\n\nHuman:" + userMessage;

    // Initialize the Anthropic client with your API key.
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
    const msg = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1500,
      temperature: 0.7,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: userContent
            }
          ]
        }
      ]
    });

    console.log("Anthropic API response:", msg);
    
    // Extract the completion text from msg.content array.
    const completionText = msg.content && msg.content[0] ? msg.content[0].text : "";
    if (!completionText || completionText.trim().length === 0) {
      console.log("Completion content is empty:", msg);
      throw new Error("No solution generated");
    }

    let solution;
    try {
      solution = JSON.parse(completionText);
      if (!solution.description || !solution.schema) {
        throw new Error("Invalid solution format");
      }
    } catch (e) {
      console.error("Error parsing solution:", e, "Content:", completionText);
      throw new Error("Failed to generate valid solution");
    }

    return NextResponse.json({
      success: true,
      solution: solution.schema,
      description: solution.description
    });

  } catch (error) {
    console.error("Error generating comprehensive solution:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate solution"
      },
      { status: 500 }
    );
  }
} 