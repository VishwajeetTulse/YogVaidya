#!/usr/bin/env python3
"""
Bulletproof Route Integration Script - Handles all remaining API routes
Uses careful, incremental replacements to avoid breaking code
"""

import os
import re
from pathlib import Path
from typing import Tuple, Optional

class SafeRouteIntegrator:
    def __init__(self, dry_run=False, verbose=False):
        self.dry_run = dry_run
        self.verbose = verbose
        self.stats = {"processed": 0, "changed": 0, "skipped": 0, "failed": 0}

    def is_integrated(self, content: str) -> bool:
        """Check if already integrated"""
        return "@/lib/utils/error-handler" in content

    def needs_integration(self, content: str) -> bool:
        """Check if needs integration"""
        return "NextResponse" in content and not self.is_integrated(content)

    def step1_fix_imports(self, content: str) -> str:
        """Step 1: Fix imports safely"""
        # Remove NextResponse from imports, keep NextRequest if present
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
        
        # Add error/response handlers after last import
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
        
        return content

    def step2_fix_auth_errors(self, content: str) -> str:
        """Step 2: Replace auth error returns with throws"""
        # Pattern: if (!session...user...id) { return NextResponse.json({...error...}, {status: 401})
        content = re.sub(
            r"if\s*\(\s*!session\?\.user\?\.id\s*\)\s*{\s*return\s+NextResponse\.json\([^)]*status:\s*401[^)]*\);?\s*}",
            'if (!session?.user?.id) {\n      throw new AuthenticationError("User session not found");\n    }',
            content
        )
        
        # Similar patterns for authorization
        content = re.sub(
            r'return\s+NextResponse\.json\([^}]*error[^}]*}\s*,\s*{\s*status:\s*401\s*}\)',
            'throw new AuthenticationError("Unauthorized")',
            content
        )
        content = re.sub(
            r'return\s+NextResponse\.json\([^}]*error[^}]*}\s*,\s*{\s*status:\s*403\s*}\)',
            'throw new AuthorizationError("Forbidden")',
            content
        )
        
        return content

    def step3_fix_not_found(self, content: str) -> str:
        """Step 3: Replace not found errors"""
        content = re.sub(
            r'return\s+NextResponse\.json\([^}]*error[^}]*}\s*,\s*{\s*status:\s*404\s*}\)',
            'throw new NotFoundError("Not found")',
            content
        )
        return content

    def step4_fix_validation_errors(self, content: str) -> str:
        """Step 4: Replace validation errors"""
        content = re.sub(
            r'return\s+NextResponse\.json\([^}]*error[^}]*}\s*,\s*{\s*status:\s*400\s*}\)',
            'throw new ValidationError("Validation failed")',
            content
        )
        return content

    def step5_fix_success_responses(self, content: str) -> str:
        """Step 5: Replace success responses"""
        # NextResponse.json({ success: true, data: X }) with status 200
        content = re.sub(
            r'return\s+NextResponse\.json\(\s*{\s*success:\s*true,\s*data:\s*(\w+)\s*}\s*(?:,\s*{\s*status:\s*200\s*})?\s*\);?',
            r'return successResponse(\1);',
            content
        )
        
        # NextResponse.json({ data: X })
        content = re.sub(
            r'return\s+NextResponse\.json\(\s*{\s*data:\s*(\w+)\s*}\s*\);?',
            r'return successResponse(\1);',
            content
        )
        
        # NextResponse.json(X) with status 201
        content = re.sub(
            r'return\s+NextResponse\.json\(\s*(\w+)\s*,\s*{\s*status:\s*201\s*}\s*\);?',
            r'return createdResponse(\1);',
            content
        )
        
        # NextResponse.json with status 200
        content = re.sub(
            r'return\s+NextResponse\.json\(\s*(\w+)\s*(?:,\s*{\s*status:\s*200\s*})?\s*\);?',
            r'return successResponse(\1);',
            content
        )
        
        return content

    def step6_fix_catch_blocks(self, content: str) -> str:
        """Step 6: Simplify catch blocks"""
        # Match catch blocks with NextResponse.json
        pattern = r'}\s*catch\s*\(\s*error\s*\)\s*{[^}]*return\s+NextResponse\.json\([^)]*\);[^}]*}'
        if re.search(pattern, content, re.DOTALL):
            content = re.sub(
                pattern,
                '} catch (error) {\n    return errorResponse(error);\n  }',
                content,
                flags=re.DOTALL
            )
        
        # Also handle simpler format
        content = re.sub(
            r'catch\s*\(\s*error\s*\)\s*{\s*return\s+NextResponse\.json\([^)]*\);?\s*}',
            'catch (error) {\n    return errorResponse(error);\n  }',
            content
        )
        
        return content

    def process_file(self, file_path: str) -> Tuple[bool, Optional[str]]:
        """Process a single file"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                original = f.read()

            if self.is_integrated(original):
                self.stats["skipped"] += 1
                return False, None

            if not self.needs_integration(original):
                self.stats["skipped"] += 1
                return False, None

            content = original
            content = self.step1_fix_imports(content)
            content = self.step2_fix_auth_errors(content)
            content = self.step3_fix_not_found(content)
            content = self.step4_fix_validation_errors(content)
            content = self.step5_fix_success_responses(content)
            content = self.step6_fix_catch_blocks(content)

            if content != original:
                if not self.dry_run:
                    with open(file_path, 'w', encoding='utf-8') as f:
                        f.write(content)
                self.stats["changed"] += 1
                self.stats["processed"] += 1
                return True, None
            else:
                self.stats["skipped"] += 1
                return False, None

        except Exception as e:
            self.stats["failed"] += 1
            return False, str(e)

    def find_routes(self, root: str) -> list:
        """Find all route.ts files"""
        routes = []
        for path in Path(root).rglob('route.ts'):
            routes.append(str(path))
        return sorted(routes)

    def run(self, root_dir: str):
        """Run integration"""
        routes = self.find_routes(root_dir)
        
        print(f"\n[START] Found {len(routes)} total routes")
        
        to_process = []
        for r in routes:
            try:
                with open(r, 'r', encoding='utf-8') as f:
                    if self.needs_integration(f.read()):
                        to_process.append(r)
            except:
                pass
        
        print(f"[PROCESS] Integrating {len(to_process)} routes\n")
        
        for route in to_process:
            changed, error = self.process_file(route)
            rel_path = os.path.relpath(route)
            
            if error:
                print(f"[ERROR] {rel_path}: {error}")
            elif changed:
                status = "[DRY]" if self.dry_run else "[OK]"
                print(f"{status} {rel_path}")
        
        print(f"\n[RESULT]")
        print(f"  Processed: {self.stats['processed']}")
        print(f"  Changed: {self.stats['changed']}")
        print(f"  Skipped: {self.stats['skipped']}")
        print(f"  Failed: {self.stats['failed']}")

if __name__ == "__main__":
    import sys
    dry_run = "--dry-run" in sys.argv
    verbose = "--verbose" in sys.argv
    
    root = Path(__file__).parent / "src" / "app" / "api"
    integrator = SafeRouteIntegrator(dry_run=dry_run, verbose=verbose)
    integrator.run(str(root))
