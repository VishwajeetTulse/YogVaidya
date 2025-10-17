#!/usr/bin/env python3
"""
Smart API Route Integration Script
Converts remaining routes to use error-handler and response-handler
"""

import os
import re
import sys
from pathlib import Path
from typing import Tuple, Optional

class RouteIntegrator:
    def __init__(self, dry_run=False):
        self.dry_run = dry_run
        self.processed = 0
        self.changed = 0
        self.failed = 0
        self.skipped = 0

    def is_already_integrated(self, content: str) -> bool:
        """Check if route already uses error handlers"""
        return '@/lib/utils/error-handler' in content

    def needs_integration(self, content: str) -> bool:
        """Check if route needs integration"""
        return 'NextResponse' in content and not self.is_already_integrated(content)

    def add_imports(self, content: str) -> str:
        """Add error and response handler imports"""
        # If already has imports, skip
        if '@/lib/utils/error-handler' in content:
            return content

        # Remove NextResponse import
        content = re.sub(
            r'import\s*{\s*NextResponse,\s*type\s*NextRequest\s*}\s*from\s*["\']next/server["\'];?',
            'import { type NextRequest } from "next/server";',
            content
        )
        
        # Remove standalone NextResponse import
        content = re.sub(
            r'import\s*{\s*NextResponse\s*}\s*from\s*["\']next/server["\'];?\s*\n',
            '',
            content
        )

        # Find the last import statement
        lines = content.split('\n')
        last_import_idx = -1
        for i, line in enumerate(lines):
            if line.startswith('import '):
                last_import_idx = i

        if last_import_idx >= 0:
            # Insert new imports after last import
            new_imports = [
                'import { AuthenticationError, AuthorizationError, ValidationError, NotFoundError, ConflictError, DatabaseError, ExternalServiceError, InternalServerError } from "@/lib/utils/error-handler";',
                'import { successResponse, errorResponse, createdResponse } from "@/lib/utils/response-handler";'
            ]
            lines.insert(last_import_idx + 1, '')
            for imp in reversed(new_imports):
                lines.insert(last_import_idx + 1, imp)
            content = '\n'.join(lines)

        return content

    def convert_responses(self, content: str) -> str:
        """Convert NextResponse patterns to new handlers"""
        
        # Pattern 1: NextResponse.json({ success: true, data: X }, { status: 200 })
        content = re.sub(
            r'NextResponse\.json\(\s*{\s*(?:success:\s*true,\s*)?data:\s*(\w+)\s*}\s*(?:,\s*{\s*status:\s*200\s*})?\s*\)',
            r'successResponse(\1)',
            content
        )

        # Pattern 2: NextResponse.json({ data: X })
        content = re.sub(
            r'NextResponse\.json\(\s*{\s*data:\s*(\w+)\s*}\s*\)',
            r'successResponse(\1)',
            content
        )

        # Pattern 3: NextResponse.json(X, { status: 201 })
        content = re.sub(
            r'NextResponse\.json\(\s*(\w+)\s*,\s*{\s*status:\s*201\s*}\s*\)',
            r'createdResponse(\1)',
            content
        )

        # Pattern 4: throw new errors instead of returning errors
        content = re.sub(
            r'return\s+NextResponse\.json\(\s*{[^}]*error[^}]*}\s*,\s*{\s*status:\s*40[134]\s*}\s*\);?',
            'throw new AuthenticationError("Unauthorized");',
            content
        )

        return content

    def simplify_catch_blocks(self, content: str) -> str:
        """Simplify catch blocks to use errorResponse"""
        # Replace complex catch blocks with simple errorResponse
        pattern = r'catch\s*\(\s*error\s*\)\s*{[^}]*return\s+NextResponse\.json\([^)]*\);?\s*}'
        replacement = 'catch (error) {\n    return errorResponse(error);\n  }'
        content = re.sub(pattern, replacement, content, flags=re.DOTALL)
        return content

    def process_file(self, file_path: str) -> Tuple[bool, Optional[str]]:
        """Process a single file, return (changed, error_msg)"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                original = f.read()

            if self.is_already_integrated(original):
                self.skipped += 1
                return False, None

            if not self.needs_integration(original):
                self.skipped += 1
                return False, None

            content = original
            content = self.add_imports(content)
            content = self.convert_responses(content)
            content = self.simplify_catch_blocks(content)

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
        
        print(f"\n[SEARCH] Found {len(routes)} total routes")
        
        to_process = [r for r in routes if self.needs_integration(open(r, encoding='utf-8').read())]
        print(f"[PROCESS] Processing {len(to_process)} routes that need integration\n")

        for route in to_process:
            try:
                changed, error = self.process_file(route)
                rel_path = os.path.relpath(route)
                
                if error:
                    print(f"[ERROR] {rel_path}: {error}")
                elif changed:
                    status = "[DRY RUN]" if self.dry_run else ""
                    print(f"[OK] {status} {rel_path}")
                
                self.processed += 1
            except Exception as e:
                print(f"[ERROR] Error: {e}")
                self.failed += 1

        print(f"\n[SUMMARY]")
        print(f"  Total processed: {self.processed}")
        print(f"  Changed: {self.changed}")
        print(f"  Skipped: {self.skipped}")
        print(f"  Failed: {self.failed}")
        
        if self.dry_run:
            print(f"\n[INFO] Run with --apply to make changes")

if __name__ == "__main__":
    dry_run = "--dry-run" in sys.argv
    apply_mode = "--apply" in sys.argv
    
    root = Path(__file__).parent / "src" / "app" / "api"
    
    integrator = RouteIntegrator(dry_run=dry_run and not apply_mode)
    integrator.run(str(root))
