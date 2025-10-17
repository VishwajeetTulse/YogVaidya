#!/usr/bin/env python3
"""
Complete final integration - ALL remaining routes
"""
import os
import re
from pathlib import Path

class CompleteIntegrator:
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
        content = re.sub(
            r'import\s*{\s*NextResponse,\s*type\s*NextRequest\s*}\s*from\s*["\']next/server["\'];?',
            'import { type NextRequest } from "next/server";',
            content
        )
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
        
        # Replace error patterns
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
        
        # Catch blocks
        def fix_catch_block(match):
            return '} catch (error) {\n    return errorResponse(error);\n  }'
        
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

    def find_all_routes(self) -> list:
        """Find all remaining route.ts files that need integration"""
        base = Path(__file__).parent / "src" / "app" / "api"
        routes = []
        for path in base.rglob('route.ts'):
            routes.append(path)
        return sorted(routes)

    def run(self):
        routes = self.find_all_routes()
        
        # Filter only those that need integration
        routes_to_process = []
        for route in routes:
            try:
                with open(route, 'r', encoding='utf-8') as f:
                    content = f.read()
                if not self.is_integrated(content) and "NextResponse" in content:
                    routes_to_process.append(route)
            except:
                pass
        
        print(f"Processing {len(routes_to_process)} remaining routes...\n")
        
        for route in routes_to_process:
            if self.process_file(str(route)):
                rel_path = os.path.relpath(route)
                print(f"[OK] {rel_path}")
        
        print(f"\n[COMPLETE] OK: {self.stats['ok']}, Skipped: {self.stats['skip']}, Failed: {self.stats['fail']}")

if __name__ == "__main__":
    integrator = CompleteIntegrator()
    integrator.run()
