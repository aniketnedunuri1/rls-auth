"use client";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Check, ChevronDown } from "lucide-react";

type RoleSelectorProps = {
  role: 'ANONYMOUS' | 'AUTHENTICATED' | 'MULTI_USER';
  setRole: (role: 'ANONYMOUS' | 'AUTHENTICATED' | 'MULTI_USER') => void;
};

const roles = [
  { 
    id: 'ANONYMOUS' as const, 
    name: 'anon', 
    description: "For anonymous access. Respects Row Level Security (RLS) policies." 
  },
  { 
    id: 'AUTHENTICATED' as const, 
    name: 'authenticated', 
    description: "For logged-in users with standard permissions." 
  },
  { 
    id: 'MULTI_USER' as const, 
    name: 'multi-user', 
    description: "For testing across multiple user roles and permissions." 
  }
];

export default function RoleSelector({ role, setRole }: RoleSelectorProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-48 flex justify-between px-4 py-2">
          <span className="text-muted-foreground">Role:</span> 
          <span>{roles.find((r) => r.id === role)?.name}</span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 bg-background border border-border p-4 rounded-lg">
        <h4 className="text-sm font-semibold mb-2">Database Role Settings</h4>
        <div className="space-y-2">
          {roles.map((r) => (
            <button
              key={r.id}
              className={cn(
                "flex items-center justify-between w-full p-3 rounded-lg border cursor-pointer transition-all",
                role === r.id ? "border-primary bg-muted" : "border-transparent hover:bg-muted/50"
              )}
              onClick={() => setRole(r.id)}
            >
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border rounded-full flex items-center justify-center">
                  {role === r.id && <Check className="w-3 h-3 text-primary" />}
                </div>
                <span className="text-sm">{r.name}</span>
              </div>
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {roles.find((r) => r.id === role)?.description}
        </p>
      </PopoverContent>
    </Popover>
  );
}
