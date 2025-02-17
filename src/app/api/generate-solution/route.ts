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
As a database security expert, analyze this failed security test and provide a specific RLS policy solution.

Test Details:
- Name: ${test.name}
- Description: ${test.description}
- Failed Query: ${test.query}
- Error: ${JSON.stringify(test.result?.error)}

Current Database Context:
- Schema: ${dbSchema}
- Current RLS Policy: ${currentRLS}
- Project Description: ${projectDescription}

Requirements:
1. Respond ONLY with a valid JSON object in this exact format:
{
  "description": "A clear explanation of the error and recommended fix",
  "query": "The complete SQL RLS policy statement"
}

2. The description should explain:
   - Why the query failed
   - How the recommended fix addresses the issue
   - A brief explanation of RLS policies

3. The query must be:
   - A complete, ready-to-use SQL RLS policy
   - Compatible with the current schema
   - Include inline comments explaining its purpose

Important: Ensure the response is ONLY the JSON object, with no additional text or markdown.`;

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