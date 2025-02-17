import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma"; // Adjust the path as needed

export async function POST(request: Request) {
  try {
    const {
      projectId,
      failedTests,
      passedTests,
      dbSchema,
      currentRLS,
      projectDescription
    } = await request.json();

    // Define the system instructions
    const systemPrompt = "You are a database security expert specializing in Supabase Row Level Security. Your task is to generate a complete, working set of RLS policies in valid SQL that fixes all issues while maintaining existing functionality. Each policy must be a separate SQL statement with a single action in the FOR clause. For INSERT policies, do NOT include a USING clause; include only a WITH CHECK clause. Do NOT include any inline comments. Do NOT use the role \"anonymous\"; use \"anon\" for policies targeting unauthenticated access. Return ONLY the JSON object with no additional text, markdown, or formatting.";

    // Compose the user message with project context and test details.
    const userPrompt = `
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
   - Include ENABLE ROW LEVEL SECURITY statements where needed.
   - Provide policies for SELECT, INSERT, UPDATE, and DELETE operations.
   - For INSERT policies, do NOT include a USING clause; include only a WITH CHECK clause.
   - Ensure that for any policy, the FOR clause only mentions a single operation; if the same table requires policies for multiple operations (e.g., UPDATE and DELETE), generate separate SQL statements for each.
   - Do NOT include any inline comments.
   - DO NOT use the role "anonymous"; use "anon" instead for unauthenticated access.
   - Return ONLY a JSON object with exactly two keys: "description" and "schema".
   - "description" should provide a brief explanation for the changes made.
   - "schema" should contain a complete SQL script with individual RLS policy statements to fix all the failed tests.
   - Do not include any extra text or markdown.

Important: Return ONLY the JSON object with no additional text, markdown, or formatting.`;


const finalPrompt = `Human: You are a database security expert specializing in Supabase Row Level Security.
Your task is to generate a complete, working set of RLS policies in valid SQL that fixes all issues while maintaining existing functionality.
Each policy must be a separate SQL statement with a single action in the FOR clause.
For INSERT policies, do NOT include a USING clause; include only a WITH CHECK clause.
Do NOT include any inline comments.
DO NOT use the role "anonymous"; use "anon" for policies targeting unauthenticated access.
Important: Return ONLY the JSON object with no additional text, markdown, or formatting.${userPrompt}`;

    // Initialize the Anthropic client with your API key.
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
    const msg = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 2000,
      temperature: 0.7,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: finalPrompt
            }
          ]
        }
      ]
    });

    console.log("Anthropic API response:", msg);
    
    // Extract the completion text from msg.content array.
    const completionText = msg.content && msg.content[0] ? msg.content[0].text : "";
    if (!completionText || !completionText.trim()) {
      throw new Error("No solution generated");
    }

    let solution: { description: string; schema: string };
    try {
      const parsed = JSON.parse(completionText);
      // We're expecting either a "schema" or a "sql" key along with "description"
      if (!parsed.description || (!parsed.schema && !parsed.sql)) {
        if (parsed.policies && Array.isArray(parsed.policies)) {
          solution = {
            description: "Generated RLS policies based on the tests.",
            schema: parsed.policies.join("\n")
          };
        } else {
          throw new Error("Invalid solution format");
        }
      } else {
        solution = {
          description: parsed.description,
          schema: parsed.schema || parsed.sql
        };
      }
    } catch (e) {
      console.error("Error parsing solution:", e, "Content:", completionText);
      throw new Error("Failed to generate valid solution");
    }

    // Automatically update the project's RLS policy in the database using Prisma.
    if (projectId) {
      const updatedProject = await prisma.project.update({
        where: { id: projectId },
        data: { rlsSchema: solution.schema }
      });
      console.log("Updated project with new RLS policy:", updatedProject);
    }

    return NextResponse.json({
      success: true,
      solution: solution.schema,
      description: solution.description
    });
    
  } catch (error) {
    console.error("Error in /api/fix-all-tests:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fix tests"
      },
      { status: 500 }
    );
  }
}