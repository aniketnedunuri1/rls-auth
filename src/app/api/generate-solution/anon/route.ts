import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { test, dbSchema, currentRLS } = await request.json();

    const prompt = `
As a database security expert, analyze this failed security test and provide a specific RLS policy solution.

Test Details:
- Name: ${test.name}
- Description: ${test.description}
- Failed Query: ${test.query}
- Error: ${JSON.stringify(test.result?.error)}

Current Database Context:
- Schema: ${dbSchema}
- Current RLS Policy: ${currentRLS}

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

    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a database security expert. Respond only with valid JSON containing 'description' and 'query' fields."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "gpt-4o-mini-2024-07-18",
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const content = completion.choices[0]?.message?.content;
    let parsedResponse;
    
    try {
      parsedResponse = JSON.parse(content || "");
    } catch (e) {
      console.error("Failed to parse LLM response:", e);
      throw new Error("Invalid response format");
    }

    return NextResponse.json({ 
      success: true, 
      solution: parsedResponse // Frontend will handle extracting query vs description
    });

  } catch (error) {
    console.error('Error generating solution:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to generate solution' 
      },
      { status: 500 }
    );
  }
} 