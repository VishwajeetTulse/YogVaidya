#!/usr/bin/env python3
"""
Safe Route Integration - Conservative approach
Only does exact pattern replacements that are guaranteed safe
"""

import os
import re
from pathlib import Path
from typing import Tuple, Optional

class SafeRouteIntegrator:
    def __init__(self, dry_run=False):
        self.dry_run = dry_run
        self.processed = 0
        self.changed = 0
        self.failed = 0
        self.skipped = 0

    def is_already_integrated(self, content: str) -> bool:
        """Check if route already uses error handlers"""
        return '@/lib/utils/error-handler' in content or '@/lib/utils/response-handler' in content

    def needs_integration(self, content: str) -> bool:
        """Check if route needs integration"""
        return 'NextResponse' in content and not self.is_already_integrated(content)

    def safe_replace_imports(self, content: str) -> str:
        """Replace imports - ONLY standard patterns"""
        
        # Pattern 1: { NextResponse, type NextRequest } from "next/server"
        content = re.sub(
            r'import\s*{\s*NextResponse,\s*type\s*NextRequest\s*}\s*from\s*["\']next/server["\']',
            'import { type NextRequest } from "next/server"',
            content
        )
        
        # Pattern 2: { NextResponse } from "next/server" (single import)
        content = re.sub(
            r'import\s*{\s*NextResponse\s*}\s*from\s*["\']next/server["\'];?\n',
            '',
            content
        )

        # Add error/response imports if not present
        if '@/lib/utils/error-handler' not in content:
            # Find last import line
            lines = content.split('\n')
            last_import_idx = -1
            
            for i, line in enumerate(lines):
                if line.startswith('import '):
                    last_import_idx = i

            if last_import_idx >= 0 and last_import_idx < len(lines) - 1:
                # Insert error handler imports after last import
                error_import = 'import { AuthenticationError, ValidationError, NotFoundError, ConflictError, DatabaseError, ExternalServiceError, InternalServerError, AuthorizationError, RateLimitError } from "@/lib/utils/error-handler";'
                response_import = 'import { successResponse, errorResponse, createdResponse, noContentResponse } from "@/lib/utils/response-handler";'
                
                # Check if there's a blank line after the last import
                if lines[last_import_idx + 1].strip() == '':
                    lines.insert(last_import_idx + 2, error_import)
                    lines.insert(last_import_idx + 3, response_import)
                else:
                    lines.insert(last_import_idx + 1, error_import)
                    lines.insert(last_import_idx + 2, response_import)
                
                content = '\n'.join(lines)

        return content

    def safe_replace_error_responses(self, content: str) -> str:
        """Replace error responses - ONLY exact patterns"""
        
        # Pattern 1: return NextResponse.json({ ..., error: ... }, { status: 401 })
        content = re.sub(
            r'return\s+NextResponse\.json\(\s*{\s*[^}]*error[^}]*}\s*,\s*{\s*status:\s*401\s*}\s*\);',
            'throw new AuthenticationError("Unauthorized");',
            content
        )
        
        # Pattern 2: return NextResponse.json({ ..., error: ... }, { status: 403 })
        content = re.sub(
            r'return\s+NextResponse\.json\(\s*{\s*[^}]*error[^}]*}\s*,\s*{\s*status:\s*403\s*}\s*\);',
            'throw new AuthorizationError("Forbidden");',
            content
        )
        
        # Pattern 3: return NextResponse.json({ ..., error: ... }, { status: 404 })
        content = re.sub(
            r'return\s+NextResponse\.json\(\s*{\s*[^}]*error[^}]*}\s*,\s*{\s*status:\s*404\s*}\s*\);',
            'throw new NotFoundError("Not found");',
            content
        )
        
        # Pattern 4: return NextResponse.json({ ..., error: ... }, { status: 409 })
        content = re.sub(
            r'return\s+NextResponse\.json\(\s*{\s*[^}]*error[^}]*}\s*,\s*{\s*status:\s*409\s*}\s*\);',
            'throw new ConflictError("Conflict");',
            content
        )

        return content

    def safe_replace_success_responses(self, content: str) -> str:
        """Replace success responses - ONLY common patterns"""
        
        # Pattern 1: return NextResponse.json({ success: true, data: VARIABLE });
        content = re.sub(
            r'return\s+NextResponse\.json\(\s*{\s*success:\s*true,\s*data:\s*(\w+)\s*}\s*\);',
            r'return successResponse(\1);',
            content
        )
        
        # Pattern 2: return NextResponse.json({ data: VARIABLE }, { status: 200 });
        content = re.sub(
            r'return\s+NextResponse\.json\(\s*{\s*data:\s*(\w+)\s*}\s*,\s*{\s*status:\s*200\s*}\s*\);',
            r'return successResponse(\1);',
            content
        )
        
        # Pattern 3: return NextResponse.json(VARIABLE, { status: 201 });
        content = re.sub(
            r'return\s+NextResponse\.json\(\s*(\w+)\s*,\s*{\s*status:\s*201\s*}\s*\);',
            r'return createdResponse(\1);',
            content
        )

        return content

    def safe_simplify_catch_blocks(self, content: str) -> str:
        """Simplify catch blocks - ONLY replace the entire catch body"""
        
        # Only replace if catch block has standard error handling
        pattern = r'catch\s*\(\s*error\s*\)\s*{\s*(?:console\.error\([^)]*\);)?\s*(?:if\s*\([^)]*instanceof[^)]*ZodError[^)]*\)\s*{[^}]*}\s*)?return\s+NextResponse\.json\([^)]*\);?\s*}'
        
        if re.search(pattern, content, re.DOTALL):
            content = re.sub(
                pattern,
                'catch (error) {\n    return errorResponse(error);\n  }',
                content,
                flags=re.DOTALL
            )

        return content

    def process_file(self, file_path: str) -> Tuple[bool, Optional[str]]:
        """Process a single file"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                original = f.read()

            if self.is_already_integrated(original):
                return False, None

            if not self.needs_integration(original):
                return False, None

            content = original
            content = self.safe_replace_imports(content)
            content = self.safe_replace_error_responses(content)
            content = self.safe_replace_success_responses(content)
            content = self.safe_simplify_catch_blocks(content)

            if content != original:
                if not self.dry_run:
                    with open(file_path, 'w', encoding='utf-8') as f:
                        f.write(content)
                self.changed += 1
                return True, None
            
            return False, None

        except Exception as e:
            self.failed += 1
            return False, str(e)

    def find_routes(self, root_dir: str) -> list:
        """Find all route.ts files"""
        routes = []
        for path in Path(root_dir).rglob('route.ts'):
            routes.append(str(path))
        return sorted(routes)

    def run(self, root_dir: str):
        """Run integration on all routes"""
        routes = self.find_routes(root_dir)
        
        print(f"\n[INFO] Found {len(routes)} total routes")
        
        to_process = []
        for r in routes:
            try:
                with open(r, encoding='utf-8') as f:
                    if self.needs_integration(f.read()):
                        to_process.append(r)
            except:
                pass
        
        print(f"[INFO] Processing {len(to_process)} routes that need integration\n")

        for route in to_process:
            try:
                changed, error = self.process_file(route)
                rel_path = os.path.relpath(route)
                
                if error:
                    print(f"[FAIL] {rel_path}: {error}")
                elif changed:
                    status = "[DRY]" if self.dry_run else "[DONE]"
                    print(f"{status} {rel_path}")
                
                self.processed += 1
            except Exception as e:
                print(f"[ERROR] {e}")
                self.failed += 1

        print(f"\n[RESULT]")
        print(f"  Processed: {self.processed}")
        print(f"  Changed: {self.changed}")
        print(f"  Failed: {self.failed}")
        print(f"  Skipped: {self.skipped}")

if __name__ == "__main__":
    import sys
    
    dry_run = "--dry-run" in sys.argv
    
    root = Path(__file__).parent / "src" / "app" / "api"
    
    integrator = SafeRouteIntegrator(dry_run=dry_run)
    integrator.run(str(root))
