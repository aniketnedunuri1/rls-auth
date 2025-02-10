import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { test, dbSchema, currentRLS } = await request.json();

    const prompt = `
As a database security expert, analyze this failed security test and provide a specific RLS policy solution:

Test Details:
- Name: ${test.name}
- Description: ${test.description}
- Failed Query: ${test.query}
- Error: ${JSON.stringify(test.result?.error)}

Current Database Context:
- Schema: ${dbSchema}
- Current RLS Policy: ${currentRLS}

Requirements:
1. Provide a complete, ready-to-use RLS policy that would prevent this security issue
2. Include brief comments explaining how the policy works
3. Focus on preventing similar security vulnerabilities
4. Format the response as a SQL policy statement with comments

Example format:
-- Description of what this policy does
-- Additional security considerations
CREATE POLICY policy_name ON table_name
  FOR operation_type
  TO role_type
  USING (security_condition);
`;

    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a database security expert specializing in Supabase Row Level Security policies."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "gpt-4o-mini-2024-07-18",
      temperature: 0.7,
    });

    const solution = completion.choices[0]?.message?.content;

    return NextResponse.json({ 
      success: true, 
      solution 
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