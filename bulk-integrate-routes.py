#!/usr/bin/env python3
"""
Bulk file replacement script - replace files with converted versions
"""
import os
import re
from pathlib import Path

# Files to integrate and their full content replacements
routes_to_fix = [
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

def fix_file_content(content: str) -> str:
    """Apply transformations to file content"""
    
    # 1. Fix imports
    content = re.sub(
        r'import\s*{\s*NextResponse,\s*type\s*NextRequest\s*}\s*from\s*["\']next/server["\'];?\s*\n',
        'import { type NextRequest } from "next/server";\n',
        content
    )
    content = re.sub(
        r'import\s*{\s*NextResponse\s*}\s*from\s*["\']next/server["\'];?\s*\n',
        '',
        content
    )
    
    # 2. Add error handlers after last import
    if "@/lib/utils/error-handler" not in content:
        lines = content.split('\n')
        last_import_idx = -1
        for i, line in enumerate(lines):
            if line.strip().startswith('import '):
                last_import_idx = i
        
        if last_import_idx >= 0:
            new_imports = [
                '',
                'import { AuthenticationError, AuthorizationError, ValidationError, NotFoundError, ConflictError, DatabaseError, ExternalServiceError, InternalServerError } from "@/lib/utils/error-handler";',
                'import { successResponse, errorResponse, createdResponse, noContentResponse } from "@/lib/utils/response-handler";'
            ]
            for imp in reversed(new_imports):
                lines.insert(last_import_idx + 1, imp)
            content = '\n'.join(lines)
    
    # 3. Replace common error patterns
    # Auth errors
    content = re.sub(
        r'if\s*\(\s*!session\?\.user\?\.id\s*\)\s*{\s*\n\s*return\s+NextResponse\.json\([^)]*status:\s*401[^)]*\);',
        'if (!session?.user?.id) {\n      throw new AuthenticationError("User session not found");',
        content,
        flags=re.MULTILINE
    )
    
    # Simple NextResponse to error throws
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
        r'return\s+NextResponse\.json\(\s*{\s*success:\s*true,\s*data:\s*(\w+)\s*}\s*(?:,\s*{\s*status:\s*200\s*})?\s*\);?',
        r'return successResponse(\1);',
        content
    )
    
    content = re.sub(
        r'return\s+NextResponse\.json\(\s*(\w+)\s*,\s*{\s*status:\s*201\s*}\s*\);?',
        r'return createdResponse(\1);',
        content
    )
    
    # Replace multi-line catch blocks with simple version
    content = re.sub(
        r'}\s*catch\s*\(\s*error\s*\)\s*{[^}]*return\s+NextResponse\.json\([^;]*;[^}]*}',
        '} catch (error) {\n    return errorResponse(error);\n  }',
        content,
        flags=re.DOTALL
    )
    
    return content

def main():
    base_path = Path(__file__).parent
    
    for route in routes_to_fix:
        file_path = base_path / route
        
        if not file_path.exists():
            print(f"[SKIP] {route} - not found")
            continue
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Skip if already integrated
            if "@/lib/utils/error-handler" in content:
                print(f"[SKIP] {route} - already integrated")
                continue
            
            new_content = fix_file_content(content)
            
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            
            print(f"[OK] {route}")
        except Exception as e:
            print(f"[ERROR] {route}: {str(e)}")

if __name__ == "__main__":
    main()
