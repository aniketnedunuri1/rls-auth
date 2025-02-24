type RLSRole = {
  name: string;
  conditions: string[];
  tables: Set<string>;
};

type AnalysisResult = {
  roles: RLSRole[];
  hasOrgPolicies: boolean;
  hasCustomClaims: boolean;
  tableAccess: Map<string, Set<string>>;  // table -> roles with access
};

export class RLSAnalyzer {
  private static readonly ROLE_PATTERNS = [
    /auth\.role\(\)\s*=\s*['"](\w+)['"]/g,
    /auth\.hasRole\(['"](\w+)['"]\)/g,
    /is_(\w+)\s*=\s*true/g
  ];

  private static readonly ORG_PATTERNS = [
    /org_id/i,
    /organization_id/i,
    /tenant_id/i
  ];

  static analyze(rlsPolicies: string): AnalysisResult {
    const roles: RLSRole[] = [];
    const tableAccess = new Map<string, Set<string>>();
    
    // Split policies into individual statements
    const policies = rlsPolicies
      .split(';')
      .filter(policy => policy.trim().length > 0);

    let hasOrgPolicies = false;
    let hasCustomClaims = false;

    for (const policy of policies) {
      // Extract table name
      const tableMatch = policy.match(/ON\s+(\w+)/i);
      const tableName = tableMatch?.[1];
      
      if (!tableName) continue;

      // Detect roles
      for (const pattern of RLSAnalyzer.ROLE_PATTERNS) {
        const matches = [...policy.matchAll(pattern)];
        for (const match of matches) {
          const roleName = match[1];
          const existingRole = roles.find(r => r.name === roleName);
          
          if (existingRole) {
            existingRole.tables.add(tableName);
          } else {
            roles.push({
              name: roleName,
              conditions: [policy.trim()],
              tables: new Set([tableName])
            });
          }

          // Update table access map
          if (!tableAccess.has(tableName)) {
            tableAccess.set(tableName, new Set());
          }
          tableAccess.get(tableName)?.add(roleName);
        }
      }

      // Check for organization policies
      if (!hasOrgPolicies) {
        hasOrgPolicies = RLSAnalyzer.ORG_PATTERNS.some(pattern => 
          pattern.test(policy)
        );
      }

      // Check for custom claims
      if (!hasCustomClaims && policy.includes('auth.jwt')) {
        hasCustomClaims = true;
      }
    }

    return {
      roles,
      hasOrgPolicies,
      hasCustomClaims,
      tableAccess
    };
  }
} 