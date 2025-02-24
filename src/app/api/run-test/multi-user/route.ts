import { NextResponse } from "next/server";
import { MultiUserTestExecutor } from "@/lib/services/multi-user-test-executor";
import { RLSAnalyzer } from "@/lib/services/rls-analyzer";

export async function POST(request: Request) {
  try {
    const { query, url, serviceRoleKey, rlsPolicies } = await request.json();

    // Validate required parameters
    if (!query || !url || !serviceRoleKey || !rlsPolicies) {
      return NextResponse.json(
        { success: false, error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // First analyze the RLS policies
    const analysis = RLSAnalyzer.analyze(rlsPolicies);

    // If no roles detected, return early
    if (analysis.roles.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No user roles detected in RLS policies",
        analysis
      }, { status: 400 });
    }

    // Initialize the test executor
    const testExecutor = new MultiUserTestExecutor(url, serviceRoleKey);

    // Run tests with all detected roles
    const results = await testExecutor.runMultiUserTest(rlsPolicies, query);

    return NextResponse.json({
      success: true,
      results,
      analysis,
      metadata: {
        rolesDetected: analysis.roles.length,
        hasOrgPolicies: analysis.hasOrgPolicies,
        hasCustomClaims: analysis.hasCustomClaims
      }
    });

  } catch (error) {
    console.error("Error in multi-user test:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
} 