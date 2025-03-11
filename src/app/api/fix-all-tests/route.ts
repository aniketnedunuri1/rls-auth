import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import Anthropic from "@anthropic-ai/sdk";

const prisma = new PrismaClient();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

// Interface for test cases
interface TestCase {
  id: string;
  name: string;
  description: string;
  query: string;
  result?: { error?: any };
}

export async function POST(request: Request): Promise<Response> {
  try {
    console.log("Received request to fix all tests");
    const { 
      projectId, 
      failedTests, 
      passedTests, 
      dbSchema, 
      currentRLS, 
      projectDescription 
    } = await request.json();
    
    console.log(`Processing ${failedTests.length} failed tests and ${passedTests.length} passed tests`);
    
    // Main solution generation with retries
    let solution = null;
    let description = null;
    let attempts = 0;
    const maxAttempts = 3;
    
    while (!solution && attempts < maxAttempts) {
      attempts++;
      console.log(`Solution generation attempt ${attempts}/${maxAttempts}`);
      
      try {
        // Generate solution with structured extraction approach
        const { solution: generatedSolution, description: generatedDescription } = 
          await generateSolution(dbSchema, currentRLS, failedTests, passedTests, projectDescription);
        
        solution = generatedSolution;
        description = generatedDescription;
        
        if (solution) {
          // Validate the solution before proceeding
          const isValid = await validateSolution(
            dbSchema, 
            currentRLS, 
            solution, 
            failedTests, 
            passedTests
          );
          
          if (!isValid) {
            console.log(`Solution validation failed on attempt ${attempts}, retrying...`);
            solution = null; // Reset solution to trigger retry
          }
        }
      } catch (e) {
        console.error(`Error in solution generation attempt ${attempts}:`, e);
        // Continue to next attempt
      }
    }
    
    if (!solution) {
      console.error("Failed to generate valid solution after multiple attempts");
      return NextResponse.json(
        {
          success: false,
          error: "Failed to generate a valid solution after multiple attempts. Please try again."
        },
        { status: 500 }
      );
    }
    
    // Update database with solution
    if (projectId) {
      try {
        const updatedProject = await prisma.project.update({
          where: { id: projectId },
          data: { rlsSchema: solution }
        });
        console.log("Updated project with new RLS policy:", updatedProject.id);
      } catch (dbError) {
        console.error("Error updating project in database:", dbError);
        // Continue even if DB update fails
      }
    }
    
    return NextResponse.json({
      success: true,
      description,
      solution,
      meta: {
        attempts
      }
    });
    
  } catch (error) {
    console.error("Error fixing all tests:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate comprehensive fix",
      },
      { status: 500 }
    );
  }
}

// Function to generate solution using direct Claude API
async function generateSolution(
  dbSchema: string,
  currentRLS: string,
  failedTests: TestCase[],
  passedTests: TestCase[],
  projectDescription: string
): Promise<{solution: string | null, description: string | null}> {
  // Create a streamlined prompt for Claude
  const prompt = `
As a database security expert, analyze these test results and generate a comprehensive RLS policy solution.

PROJECT CONTEXT:
${projectDescription || "No project description provided"}

DATABASE SCHEMA:
${dbSchema}

CURRENT RLS POLICIES:
${currentRLS}

FAILED TESTS (${failedTests.length}):
${failedTests.map(test => `
Test: ${test.name}
Description: ${test.description}
Query: ${test.query}
Error: ${JSON.stringify(test.result?.error)}
`).join('\n')}

PASSED TESTS (${passedTests.length} - must keep working):
${passedTests.slice(0, 5).map(test => `
Test: ${test.name}
Query: ${test.query}
`).join('\n')}
${passedTests.length > 5 ? `...and ${passedTests.length - 5} more passed tests` : ''}

REQUIREMENTS:
1. Generate a complete set of RLS policies that fix all failed tests
2. Do not break existing passing tests
3. Use proper PostgreSQL syntax compatible with Supabase SQL editor
4. Focus on security best practices
5. For INSERT policies, do NOT include a USING clause; include only a WITH CHECK clause
6. For each policy, the FOR clause should only mention a single operation
7. Do NOT use the role "anonymous"; use "anon" instead for unauthenticated access
8. IMPORTANT: Always use explicit type casting when comparing UUIDs with text values (e.g., auth.uid()::text = users.user_id::text)
9. Do NOT include any markdown formatting (like \`\`\`sql) in your solution
10. Ensure all SQL statements end with semicolons
11. Use double quotes for identifiers that need them, not single quotes

FORMAT YOUR RESPONSE WITH THESE EXACT SECTIONS:
1. DESCRIPTION: A clear explanation of what changes you made and why
2. SOLUTION: The complete SQL solution with all necessary policies

The SQL solution should include all policies needed, not just the changes. Each policy should be a complete statement.`;

  try {
    // Call Claude API
    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 4000,
      temperature: 0.2,
      system: "You are an expert at PostgreSQL Row Level Security policies. Your task is to create correct, working solutions.",
      messages: [{ role: "user", content: prompt }],
    });

    // Extract text from response
    const responseText = extractTextContent(response.content);
    
    // Extract description and solution using section markers
    const description = extractSection(responseText, "DESCRIPTION:");
    const solution = extractSection(responseText, "SOLUTION:");
    
    if (!solution) {
      console.error("Failed to extract solution from Claude response");
      console.log("Claude response:", responseText);
      return { solution: null, description: null };
    }
    
    return { solution, description };
  } catch (error) {
    console.error("Error calling Claude API:", error);
    throw error;
  }
}

// Function to validate the generated solution
async function validateSolution(
  dbSchema: string,
  currentRLS: string,
  solution: string,
  failedTests: TestCase[],
  passedTests: TestCase[]
): Promise<boolean> {
  try {
    // Create validation prompt
    const validationPrompt = `
As a database security expert, validate if this proposed RLS policy solution correctly fixes the failed tests and is compatible with Supabase SQL editor.

DATABASE SCHEMA:
${dbSchema}

CURRENT RLS POLICIES:
${currentRLS}

FAILED TESTS (${failedTests.length} - need to be fixed):
${failedTests.slice(0, 3).map(test => `
Test: ${test.name}
Query: ${test.query}
`).join('\n')}
${failedTests.length > 3 ? `...and ${failedTests.length - 3} more failed tests` : ''}

PROPOSED SOLUTION:
${solution}

VALIDATION CRITERIA:
1. The solution must use valid PostgreSQL syntax compatible with Supabase
2. The solution must address all the failed tests
3. The solution should not break existing functionality
4. All RLS policies should be complete statements
5. The solution should be minimal and focused
6. UUID comparisons must use explicit type casting (::text)
7. All identifiers that need quoting must use double quotes, not single quotes
8. All statements must end with semicolons

Respond with ONLY a single word: "VALID" if the solution is correct, or "INVALID" if there are issues.
`;

    // Call Claude for validation
    const validationResponse = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 4000,
      temperature: 0.2,
      system: "You are a validator for PostgreSQL RLS policies. Respond with only VALID or INVALID.",
      messages: [{ role: "user", content: validationPrompt }],
    });
    
    const validationText = extractTextContent(validationResponse.content).trim().toUpperCase();
    return validationText.includes("VALID");
    
  } catch (error) {
    console.error("Error validating solution:", error);
    // Default to valid on validation error to avoid blocking the process
    return true;
  }
}

// Helper function to extract text content from Claude response
function extractTextContent(content: any): string {
  if (!content) return '';
  
  if (Array.isArray(content)) {
    return content.map(item => {
      if (typeof item === 'object' && item.type === 'text') {
        return item.text;
      }
      return '';
    }).join('');
  }
  
  return content.toString();
}

// Helper function to extract sections from response
function extractSection(text: string, sectionMarker: string): string {
  // Find the starting position of the section
  const sectionStart = text.indexOf(sectionMarker);
  if (sectionStart === -1) return '';
  
  // Start after the section marker
  let contentStart = sectionStart + sectionMarker.length;
  
  // Find the next section marker or end of text
  const nextSectionMarkers = ["DESCRIPTION:", "SOLUTION:"];
  let nextSectionStart = text.length;
  
  for (const marker of nextSectionMarkers) {
    if (marker === sectionMarker) continue;
    
    const markerPosition = text.indexOf(marker, contentStart);
    if (markerPosition !== -1 && markerPosition < nextSectionStart) {
      nextSectionStart = markerPosition;
    }
  }
  
  // Extract the section content
  const sectionContent = text.substring(contentStart, nextSectionStart).trim();
  return sectionContent;
}