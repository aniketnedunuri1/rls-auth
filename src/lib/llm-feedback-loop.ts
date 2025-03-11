import Anthropic from "@anthropic-ai/sdk";
import { OpenAI } from "openai";

// Initialize API clients
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

interface FeedbackLoopOptions {
  primaryModel?: string;
  judgeModel?: string;
  maxAttempts?: number;
  qualityThreshold?: number;
  taskName: string;
  schema: string;
  rlsPolicies: string;
  additionalContext?: string;
}

interface ValidationResult {
  isValid: boolean;
  score: number;
  feedback: string;
  duplicateCount?: number; // Optional field for test validation
  categoryIssues?: string; // Optional field for category issues
}

export async function llmWithFeedbackLoop<T>(
  generatePrompt: (feedback?: string) => string,
  validatePrompt: (result: any) => string,
  options: FeedbackLoopOptions
): Promise<{
  result: T;
  attempts: number;
  isValid: boolean;
  feedbackHistory: string[];
}> {
  const {
    primaryModel = "claude-3-5-sonnet-20241022",
    judgeModel = "claude-3-5-sonnet-20241022",
    maxAttempts = 3,
    qualityThreshold = 70,
    taskName,
  } = options;

  let attempts = 0;
  let isValid = false;
  let result: any = null;
  let feedbackHistory: string[] = [];

  while (!isValid && attempts < maxAttempts) {
    attempts++;
    console.log(`${taskName}: Attempt ${attempts} of ${maxAttempts}`);

    try {
      // Step 1: Generate content with the primary model
      const generationPromptText = generatePrompt(
        feedbackHistory.length > 0 ? feedbackHistory[feedbackHistory.length - 1] : undefined
      );
      
      console.log(`${taskName}: Generating content with ${primaryModel}`);
      
      let generationResult;
      
      // Check if we're using Claude or OpenAI
      if (primaryModel.startsWith("claude")) {
        // Use Anthropic API
        generationResult = await anthropic.messages.create({
          model: primaryModel,
          max_tokens: 4000,
          temperature: 0.2,
          system: "You are an expert at SQL, PostgreSQL, and Row Level Security policies. Your task is to generate high-quality, accurate test cases or solutions.",
          messages: [
            { role: "user", content: generationPromptText }
          ],
        });
        
        result = await extractJSONFromResponse(generationResult.content);
        
      } else {
        // Use OpenAI API
        generationResult = await openai.chat.completions.create({
          model: primaryModel,
          temperature: 0.2,
          messages: [
            { 
              role: "system", 
              content: "You are an expert at SQL, PostgreSQL, and Row Level Security policies. Your task is to generate high-quality, accurate test cases or solutions." 
            },
            { role: "user", content: generationPromptText }
          ],
        });
        
        const content = generationResult.choices[0]?.message.content || "";
        result = await extractJSONFromResponse(content);
      }
      
      console.log(`${taskName}: Generated content, now validating...`);
      
      // Step 2: Validate the generated content with the judge model
      const validationPromptText = validatePrompt(result);
      
      let validationResult: ValidationResult;
      
      // Check if we're using Claude or OpenAI for validation
      if (judgeModel.startsWith("claude")) {
        // Use Anthropic API for validation
        const validation = await anthropic.messages.create({
          model: judgeModel,
          max_tokens: 1500,
          temperature: 0.1,
          system: "You are a validator checking if the output meets quality standards and has no duplicates. Respond with JSON only.",
          messages: [
            { role: "user", content: validationPromptText }
          ],
        });
        
        const validationContent = extractTextContent(validation.content);
        
        try {
          validationResult = JSON.parse(validationContent) as ValidationResult;
          
          // Extra check for duplicate tests specific to test generation
          if (taskName.includes("Test Generation")) {
            if (validationResult.duplicateCount && validationResult.duplicateCount > 0) {
              validationResult.isValid = false;
              validationResult.feedback = `Found ${validationResult.duplicateCount} duplicate tests. ${validationResult.feedback}`;
            }
            
            // Handle category issues
            if (validationResult.categoryIssues) {
              validationResult.isValid = false;
              validationResult.feedback = `Category organization issues: ${validationResult.categoryIssues}. ${validationResult.feedback}`;
            }
          }
          
        } catch (e) {
          console.error("Failed to parse validation response:", e);
          // If validation parsing fails, continue with current result but mark as invalid
          validationResult = { 
            isValid: false, 
            score: 0, 
            feedback: "Failed to parse validation response. Please ensure your response format is correct and try again."
          };
        }
      } else {
        // Use OpenAI model for validation
        const validation = await openai.chat.completions.create({
          model: judgeModel,
          messages: [
            {
              role: "system",
              content: "You are a validator checking if the output meets quality standards and has no duplicates. Respond with JSON only."
            },
            { role: "user", content: validationPromptText }
          ],
          temperature: 0.1,
        });
        
        const validationContent = validation.choices[0]?.message?.content || "";
        
        try {
          validationResult = JSON.parse(validationContent) as ValidationResult;
          
          // Extra check for duplicate tests specific to test generation
          if (taskName.includes("Test Generation")) {
            if (validationResult.duplicateCount && validationResult.duplicateCount > 0) {
              validationResult.isValid = false;
              validationResult.feedback = `Found ${validationResult.duplicateCount} duplicate tests. ${validationResult.feedback}`;
            }
            
            // Handle category issues
            if (validationResult.categoryIssues) {
              validationResult.isValid = false;
              validationResult.feedback = `Category organization issues: ${validationResult.categoryIssues}. ${validationResult.feedback}`;
            }
          }
          
        } catch (e) {
          console.error("Failed to parse validation response:", e);
          validationResult = { 
            isValid: false, 
            score: 0, 
            feedback: "Failed to parse validation response. Please ensure your response format is correct and try again."
          };
        }
      }
      
      console.log(`Validation result: Valid=${validationResult.isValid}, Score=${validationResult.score}`);
      if (validationResult.duplicateCount) {
        console.log(`Duplicate tests found: ${validationResult.duplicateCount}`);
      }
      
      if (validationResult.isValid && validationResult.score >= qualityThreshold) {
        isValid = true;
      } else {
        feedbackHistory.push(validationResult.feedback);
      }
      
    } catch (error) {
      console.error(`Error in ${taskName} attempt ${attempts}:`, error);
      feedbackHistory.push(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  return {
    result: result as T,
    attempts,
    isValid,
    feedbackHistory
  };
}

// Helper function to extract JSON from string response - modified to handle bad control characters
async function extractJSONFromResponse(content: any): Promise<any> {
  if (!content) return null;
  
  let textContent = '';
  
  // Handle Anthropic array content
  if (Array.isArray(content)) {
    textContent = content.map(item => {
      if (typeof item === 'object' && item.type === 'text') {
        return item.text;
      }
      return '';
    }).join('');
  } else {
    textContent = content;
  }
  
  // Sanitize the string to remove invalid control characters
  const sanitizedText = sanitizeJsonString(textContent);
  
  try {
    // Try to parse the entire response as JSON
    return JSON.parse(sanitizedText);
  } catch (e) {
    // If that fails, try to extract JSON from the string
    const jsonMatch = sanitizedText.match(/```(?:json)?\s*({[\s\S]*?})\s*```/) || 
                     sanitizedText.match(/{[\s\S]*"test_categories"[\s\S]*}/) ||
                     sanitizedText.match(/{[\s\S]*"description"[\s\S]*}/) ||
                     sanitizedText.match(/{[\s\S]*"solution"[\s\S]*}/);
    
    if (jsonMatch && jsonMatch[1]) {
      try {
        return JSON.parse(jsonMatch[1]);
      } catch (e) {
        console.error("Failed to parse extracted JSON:", e);
        
        // Attempt another cleanup pass on the extracted JSON
        try {
          const cleanedJson = sanitizeJsonString(jsonMatch[1]);
          return JSON.parse(cleanedJson);
        } catch (e2) {
          console.error("Failed to parse cleaned JSON:", e2);
        }
      }
    }
    
    // As a last resort, try to find anything that looks like JSON
    const lastResortMatch = sanitizedText.match(/{[\s\S]*}/);
    if (lastResortMatch) {
      try {
        const cleanedJson = sanitizeJsonString(lastResortMatch[0]);
        return JSON.parse(cleanedJson);
      } catch (e) {
        console.error("Failed to parse last resort JSON:", e);
        
        // Attempt manual parsing as a final fallback for fix-all-tests
        if (sanitizedText.includes("description") && sanitizedText.includes("solution")) {
          try {
            return manualJsonParse(sanitizedText);
          } catch (e2) {
            console.error("Failed manual JSON parsing:", e2);
          }
        }
      }
    }
    
    console.error("Could not extract JSON from response:", textContent);
    return null;
  }
}

// Function to sanitize JSON strings and remove invalid control characters
function sanitizeJsonString(str: string): string {
  if (!str) return '';
  
  // Replace all control characters that aren't allowed in JSON strings
  return str
    // Replace invalid control characters (0x00-0x1F except allowed ones)
    .replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F]/g, '')
    // Replace backspace with escaped backspace
    .replace(/\u0008/g, '\\b')
    // Replace form feed with escaped form feed
    .replace(/\u000C/g, '\\f')
    // Replace newline with escaped newline
    .replace(/\n/g, '\\n')
    // Replace carriage return with escaped carriage return
    .replace(/\r/g, '\\r')
    // Replace tab with escaped tab
    .replace(/\t/g, '\\t')
    // Replace backslash with escaped backslash
    .replace(/\\/g, '\\\\')
    // Replace double quotes with escaped quotes
    .replace(/"/g, '\\"');
}

// Manual JSON parser for fix-all-tests responses as a last resort
function manualJsonParse(text: string): any {
  // Try to extract description
  const descMatch = text.match(/"description":\s*"([^"]+)"/);
  const description = descMatch ? descMatch[1].trim() : "";
  
  // Try to extract solution
  const solMatch = text.match(/"solution":\s*"([^"]+)"/);
  const solution = solMatch ? solMatch[1].trim() : "";
  
  if (description || solution) {
    return {
      description: description,
      solution: solution
    };
  }
  
  // More aggressive pattern matching for multiline strings
  const descStartIndex = text.indexOf('"description":') + 14;
  const descEndIndex = text.indexOf('"solution":');
  
  const solStartIndex = text.indexOf('"solution":') + 11;
  const solEndIndex = text.length - 1;
  
  if (descStartIndex > 14 && solStartIndex > 11) {
    return {
      description: text.substring(descStartIndex, descEndIndex).trim().replace(/^"|"$/g, ''),
      solution: text.substring(solStartIndex, solEndIndex).trim().replace(/^"|"$/g, '')
    };
  }
  
  throw new Error("Could not manually parse JSON");
}

// Helper function to extract text content from Anthropic response
function extractTextContent(content: any): string {
  if (!content) return '';
  
  // Handle Anthropic array content
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