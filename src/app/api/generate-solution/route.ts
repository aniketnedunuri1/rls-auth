import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(request: Request) {
  try {
    const { test, dbSchema, currentRLS } = await request.json();

    // Validate the request data
    if (!test || !dbSchema) {
      return NextResponse.json(
        { success: false, error: "Missing required data" },
        { status: 400 }
      );
    }

    // Define the system instructions
    const systemPrompt = "You are a database security expert specializing in Supabase Row Level Security. Your task is to analyze a failed test and generate a solution that fixes the issue. Return ONLY a JSON object with 'description' and 'query' fields.";

    // Create the user prompt with test details
    const userPrompt = `
Database Schema:
${dbSchema}

Current RLS Policies:
${currentRLS || 'No current RLS policies'}

Test Details:
- Name: ${test.name}
- Description: ${test.description}
- Failed Query: ${test.query}
- Error: ${JSON.stringify(test.result?.error)}

Requirements:
1. Analyze the test failure and current RLS policies
2. Generate a solution that fixes the specific issue
3. Return a JSON object with:
   - description: A clear explanation of the fix
   - query: The SQL query to implement the fix

Important: Return ONLY the JSON object with no additional text, markdown, or formatting.`;

    // Initialize Anthropic client
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!
    });

    const msg = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1000,
      temperature: 0.7,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: userPrompt
            }
          ]
        }
      ]
    });

    // Fix: Safely extract text from the response
    const content = msg.content[0];
    if (!('text' in content)) {
      throw new Error('Unexpected response format from Claude');
    }
    
    try {
      const solution = JSON.parse(content.text);
      return NextResponse.json({ success: true, solution });
    } catch (parseError) {
      console.error('Error parsing solution:', parseError);
      return NextResponse.json(
        { success: false, error: "Invalid solution format" },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error generating solution:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to generate solution" 
      },
      { status: 500 }
    );
  }
}