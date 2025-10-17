#!/usr/bin/env python3
"""
Final safe integration - handles complex multi-line catch blocks correctly
"""
import os
import re
from pathlib import Path
from typing import Optional

class FinalIntegrator:
    def __init__(self):
        self.stats = {"ok": 0, "skip": 0, "fail": 0}

    def is_integrated(self, content: str) -> bool:
        return "@/lib/utils/error-handler" in content

    def add_imports(self, content: str) -> str:
        """Add error/response imports after last import"""
        if "@/lib/utils/error-handler" in content:
            return content
        
        lines = content.split('\n')
        last_import = -1
        for i, line in enumerate(lines):
            if line.strip().startswith('import '):
                last_import = i
        
        if last_import >= 0:
            imports = [
                '',
                'import { AuthenticationError, AuthorizationError, ValidationError, NotFoundError, ConflictError, DatabaseError, ExternalServiceError, InternalServerError } from "@/lib/utils/error-handler";',
                'import { successResponse, errorResponse, createdResponse, noContentResponse } from "@/lib/utils/response-handler";'
            ]
            for imp in reversed(imports):
                lines.insert(last_import + 1, imp)
        
        return '\n'.join(lines)

    def remove_next_response_import(self, content: str) -> str:
        """Remove NextResponse from imports"""
        # NextResponse, type NextRequest -> type NextRequest
        content = re.sub(
            r'import\s*{\s*NextResponse,\s*type\s*NextRequest\s*}\s*from\s*["\']next/server["\'];?',
            'import { type NextRequest } from "next/server";',
            content
        )
        # Just NextResponse -> remove
        content = re.sub(
            r'import\s*{\s*NextResponse\s*}\s*from\s*["\']next/server["\'];?\s*\n',
            '',
            content
        )
        return content

    def fix_content(self, content: str) -> str:
        """Apply all fixes"""
        content = self.remove_next_response_import(content)
        content = self.add_imports(content)
        
        # Replace simple error patterns
        content = re.sub(
            r'return\s+NextResponse\.json\(\s*{\s*success:\s*false,\s*error:\s*"([^"]+)"\s*}\s*,\s*{\s*status:\s*401\s*}\s*\);?',
            r'throw new AuthenticationError("\1");',
            content
        )
        content = re.sub(
            r'return\s+NextResponse\.json\(\s*{\s*success:\s*false,\s*error:\s*"([^"]+)"\s*}\s*,\s*{\s*status:\s*403\s*}\s*\);?',
            r'throw new AuthorizationError("\1");',
            content
        )
        content = re.sub(
            r'return\s+NextResponse\.json\(\s*{\s*success:\s*false,\s*error:\s*"([^"]+)"\s*}\s*,\s*{\s*status:\s*404\s*}\s*\);?',
            r'throw new NotFoundError("\1");',
            content
        )
        content = re.sub(
            r'return\s+NextResponse\.json\(\s*{\s*success:\s*false,\s*error:\s*"([^"]+)"\s*}\s*,\s*{\s*status:\s*400\s*}\s*\);?',
            r'throw new ValidationError("\1");',
            content
        )
        content = re.sub(
            r'return\s+NextResponse\.json\(\s*{\s*success:\s*false,\s*error:\s*"([^"]+)"\s*}\s*,\s*{\s*status:\s*409\s*}\s*\);?',
            r'throw new ConflictError("\1");',
            content
        )
        
        # Success responses
        content = re.sub(
            r'return\s+NextResponse\.json\(\s*{\s*success:\s*true,\s*data:\s*(\w+)\s*}\s*\);',
            r'return successResponse(\1);',
            content
        )
        content = re.sub(
            r'return\s+NextResponse\.json\(\s*(\w+)\s*,\s*{\s*status:\s*201\s*}\s*\);',
            r'return createdResponse(\1);',
            content
        )
        
        # Now fix catch blocks - find whole blocks and replace
        # Pattern: } catch (error) { ... return NextResponse.json(...); }
        # Match entire catch block content and replace with simple version
        def fix_catch_block(match):
            return '} catch (error) {\n    return errorResponse(error);\n  }'
        
        # Find catch blocks with NextResponse
        pattern = r'}\s*catch\s*\(\s*error\s*\)\s*{[^}]*?return\s+NextResponse\.json\([^}]*?\);[^}]*?}'
        content = re.sub(pattern, fix_catch_block, content, flags=re.DOTALL)
        
        return content

    def process_file(self, path: str) -> bool:
        try:
            with open(path, 'r', encoding='utf-8') as f:
                original = f.read()
            
            if self.is_integrated(original):
                self.stats["skip"] += 1
                return False
            
            if "NextResponse" not in original:
                self.stats["skip"] += 1
                return False
            
            modified = self.fix_content(original)
            
            with open(path, 'w', encoding='utf-8') as f:
                f.write(modified)
            
            self.stats["ok"] += 1
            return True
        except Exception as e:
            print(f"  ERROR: {str(e)}")
            self.stats["fail"] += 1
            return False

    def run(self, routes: list):
        print(f"Processing {len(routes)} routes...\n")
        for route in routes:
            full_path = Path(__file__).parent / route
            if full_path.exists():
                status = "OK" if self.process_file(str(full_path)) else "SK"
                print(f"[{status}] {route}")
            else:
                print(f"[XX] {route} - not found")
        
        print(f"\nStats: {self.stats['ok']} OK, {self.stats['skip']} skipped, {self.stats['fail']} failed")

if __name__ == "__main__":
    routes = [
        "src/app/api/mentor/book-session/route.ts",
        "src/app/api/mentor/subscription-sessions/route.ts",
        "src/app/api/analytics/route.ts",
        "src/app/api/cron/complete-sessions/route.ts",
        "src/app/api/cron/update-subscriptions/route.ts",
        "src/app/api/users/update-phone/route.ts",
        "src/app/api/users/update-trial-status/route.ts",
        "src/app/api/mentor/timeslots/route.ts",
        "src/app/api/mentor/availability/route.ts",
        "src/app/api/sessions/[sessionId]/complete/route.ts",
        "src/app/api/sessions/[sessionId]/start/route.ts",
        "src/app/api/tickets/route.ts",
        "src/app/api/debug/sessions/route.ts",
    ]
    
    integrator = FinalIntegrator()
    integrator.run(routes)
