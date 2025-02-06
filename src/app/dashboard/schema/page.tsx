
// src/pages/SchemaPage.tsx
"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Info, ChevronDown, ChevronUp, Play, Loader2 } from "lucide-react";
import ReactFlow, { Controls, Background, useNodesState, useEdgesState } from "reactflow";
import "reactflow/dist/style.css";
import { useDispatch, useSelector } from "react-redux";
import { setSchema, setRLSPolicies, setAdditionalContext, setSupabaseConfig } from "@/lib/schemaSlice";
import { setTestCategories, updateTestCaseResult } from "@/lib/testsSlice";
import type { RootState } from "@/lib/store";
import Image from "next/image";


interface ExpectedOutcome {
  data?: any;
  status?: number;
  statusText?: string;
  error?: any;
}

interface TestCase {
  id: string
  name: string
  description: string
  query?: string
  expected?: ExpectedOutcome
}

interface TestCategory {
  id: string
  name: string
  description: string
  tests: TestCase[]
}

interface DatabaseProvider {
  id: string
  name: string
  logo: string
}

const databaseProviders: DatabaseProvider[] = [
  { id: "supabase", name: "Supabase", logo: "/placeholder.svg?height=24&width=24" },
  { id: "firebase", name: "Firebase", logo: "/placeholder.svg?height=24&width=24" },
  { id: "aws", name: "AWS", logo: "/placeholder.svg?height=24&width=24" },
  { id: "azure", name: "Azure", logo: "/placeholder.svg?height=24&width=24" },
]

// Mock test data

const mockTestCategories: TestCategory[] = [
  {
    "id": "rls-testing",
    "name": "RLS Testing",
    "description": "Tests that verify row-level security (RLS) policies are correctly enforced.",
    "tests": [
      {
        "id": "rls-1",
        "name": "Document Access by Owner",
        "description": "Ensures that users can only access documents they own or if they are admins.",
        "query": "SELECT * FROM documents WHERE owner_id = current_setting('app.current_user_id')::int;",
        "expected": {
          "data": [],
          "status": 200,
          "statusText": "OK"
        }
      },
      {
        "id": "rls-2",
        "name": "Cross-User Document Access Attempt",
        "description": "Attempts to access another user's documents without admin privileges.",
        "query": "SELECT * FROM documents WHERE owner_id != current_setting('app.current_user_id')::int;",
        "expected": {
          "data": [],
          "status": 200,
          "statusText": "OK"
        }
      },
      {
        "id": "rls-3",
        "name": "Restricted Update on Other Users' Documents",
        "description": "Attempts to update a document owned by another user.",
        "query": "UPDATE documents SET title = 'Hacked Title' WHERE owner_id != current_setting('app.current_user_id')::int;",
        "expected": {
          "error": {
            "code": "42501",
            "message": "permission denied for relation documents"
          },
          "status": 403,
          "statusText": "Forbidden"
        }
      },
      {
        "id": "rls-4",
        "name": "Comment Access via Document Ownership",
        "description": "Verifies that users can only access comments linked to documents they own or have admin access to.",
        "query": "SELECT * FROM comments WHERE document_id IN (SELECT id FROM documents WHERE owner_id = current_setting('app.current_user_id')::int);",
        "expected": {
          "data": [],
          "status": 200,
          "statusText": "OK"
        }
      },
      {
        "id": "rls-5",
        "name": "Prevent Unauthorized Comment Updates",
        "description": "Ensures that users cannot update comments posted by others.",
        "query": "UPDATE comments SET comment = 'Hacked Comment' WHERE user_id != current_setting('app.current_user_id')::int;",
        "expected": {
          "error": {
            "code": "42501",
            "message": "permission denied for relation comments"
          },
          "status": 403,
          "statusText": "Forbidden"
        }
      },
      {
        "id": "rls-6",
        "name": "Prevent Access to Inactive Users",
        "description": "Verifies that inactive users cannot access any documents.",
        "query": "SELECT * FROM documents WHERE owner_id = current_setting('app.current_user_id')::int AND (SELECT is_active FROM users WHERE id = current_setting('app.current_user_id')::int) = FALSE;",
        "expected": {
          "data": [],
          "status": 200,
          "statusText": "OK"
        }
      },
      {
        "id": "rls-7",
        "name": "Insert Comment as Another User",
        "description": "Attempts to insert a comment while impersonating another user.",
        "query": "INSERT INTO comments (document_id, user_id, comment) VALUES (1, 2, 'Malicious Comment');",
        "expected": {
          "error": {
            "code": "23514",
            "message": "new row violates row-level security policy for table \"comments\""
          },
          "status": 403,
          "statusText": "Forbidden"
        }
      },
      {
        "id": "rls-8",
        "name": "Document Ownership Modification Attempt",
        "description": "Attempts to change the ownership of a document to another user.",
        "query": "UPDATE documents SET owner_id = 2 WHERE id = 1;",
        "expected": {
          "error": {
            "code": "42501",
            "message": "permission denied for relation documents"
          },
          "status": 403,
          "statusText": "Forbidden"
        }
      },
      {
        "id": "rls-9",
        "name": "Access Other Users' Emails",
        "description": "Attempts to select emails from the users table without admin privileges.",
        "query": "SELECT email FROM users;",
        "expected": {
          "error": {
            "code": "42501",
            "message": "permission denied for relation users"
          },
          "status": 403,
          "statusText": "Forbidden"
        }
      },
      {
        "id": "rls-10",
        "name": "Insert Document for Another User",
        "description": "Attempts to insert a document with another user's owner_id.",
        "query": "INSERT INTO documents (owner_id, title, content) VALUES (2, 'Malicious Document', 'Hacked Content');",
        "expected": {
          "error": {
            "code": "23514",
            "message": "new row violates row-level security policy for table \"documents\""
          },
          "status": 403,
          "statusText": "Forbidden"
        }
      }
    ]
  },
  {
    "id": "auth-testing",
    "name": "Authentication Testing",
    "description": "Tests to ensure that unauthorized access or actions are blocked.",
    "tests": [
      {
        "id": "auth-1",
        "name": "Access Without Authentication",
        "description": "Tries to access a protected table without being authenticated.",
        "query": "SELECT * FROM documents;",
        "expected": {
          "error": {
            "code": "42501",
            "message": "permission denied for relation documents"
          },
          "status": 403,
          "statusText": "Forbidden"
        }
      },
      {
        "id": "auth-2",
        "name": "Prevent Unauthorized User Creation",
        "description": "Attempts to create a user without admin privileges.",
        "query": "INSERT INTO users (username, role, email, is_active) VALUES ('hacker', 'admin', 'hacker@example.com', TRUE);",
        "expected": {
          "error": {
            "code": "42501",
            "message": "permission denied for relation users"
          },
          "status": 403,
          "statusText": "Forbidden"
        }
      },
      {
        "id": "auth-3",
        "name": "Prevent Role Modification",
        "description": "Attempts to change their own role to 'admin'.",
        "query": "UPDATE users SET role = 'admin' WHERE id = current_setting('app.current_user_id')::int;",
        "expected": {
          "error": {
            "code": "42501",
            "message": "permission denied for relation users"
          },
          "status": 403,
          "statusText": "Forbidden"
        }
      },
      {
        "id": "auth-4",
        "name": "Insert Document as Anonymous User",
        "description": "Attempts to insert a document without being authenticated.",
        "query": "INSERT INTO documents (owner_id, title, content) VALUES (1, 'Anonymous Document', 'Test Content');",
        "expected": {
          "error": {
            "code": "42501",
            "message": "permission denied for relation documents"
          },
          "status": 403,
          "statusText": "Forbidden"
        }
      },
      {
        "id": "auth-5",
        "name": "Access Other Users' Roles",
        "description": "Attempts to select roles from the users table without admin privileges.",
        "query": "SELECT role FROM users;",
        "expected": {
          "error": {
            "code": "42501",
            "message": "permission denied for relation users"
          },
          "status": 403,
          "statusText": "Forbidden"
        }
      }
    ]
  }
]
