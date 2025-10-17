#!/usr/bin/env python3
"""
Remove unused imports from integrated routes
"""
import re
from pathlib import Path

def clean_unused_imports(content: str) -> str:
    """Remove unused imports intelligently"""
    
    # List of imports that can be removed if not used
    unused_patterns = [
        (r'AuthenticationError', 'throw new AuthenticationError'),
        (r'AuthorizationError', 'throw new AuthorizationError'),
        (r'ValidationError', 'throw new ValidationError'),
        (r'NotFoundError', 'throw new NotFoundError'),
        (r'ConflictError', 'throw new ConflictError'),
        (r'RateLimitError', 'throw new RateLimitError'),
        (r'DatabaseError', 'throw new DatabaseError'),
        (r'ExternalServiceError', 'throw new ExternalServiceError'),
        (r'InternalServerError', 'throw new InternalServerError'),
        (r'successResponse', 'successResponse'),
        (r'errorResponse', 'errorResponse'),
        (r'createdResponse', 'createdResponse'),
        (r'noContentResponse', 'noContentResponse'),
    ]
    
    # Find which imports are actually used
    used_imports = set()
    for import_name, usage_pattern in unused_patterns:
        if usage_pattern in content or f'return {import_name}' in content:
            used_imports.add(import_name)
    
    # Build new imports line
    imports_to_keep = []
    error_classes = []
    response_functions = []
    
    for name in used_imports:
        if name in ['AuthenticationError', 'AuthorizationError', 'ValidationError', 
                   'NotFoundError', 'ConflictError', 'RateLimitError', 'DatabaseError',
                   'ExternalServiceError', 'InternalServerError']:
            error_classes.append(name)
        else:
            response_functions.append(name)
    
    # Update error-handler import
    if error_classes:
        error_import = f"import {{ {', '.join(sorted(error_classes))} }} from \"@/lib/utils/error-handler\";"
        content = re.sub(
            r'import\s*{[^}]*}\s*from\s*["\']@/lib/utils/error-handler["\'];?',
            error_import,
            content
        )
    else:
        # Remove import line if no error classes used
        content = re.sub(
            r'import\s*{[^}]*}\s*from\s*["\']@/lib/utils/error-handler["\'];?\s*\n',
            '',
            content
        )
    
    # Update response-handler import
    if response_functions:
        response_import = f"import {{ {', '.join(sorted(response_functions))} }} from \"@/lib/utils/response-handler\";"
        content = re.sub(
            r'import\s*{[^}]*}\s*from\s*["\']@/lib/utils/response-handler["\'];?',
            response_import,
            content
        )
    else:
        # Remove import line if no response functions used
        content = re.sub(
            r'import\s*{[^}]*}\s*from\s*["\']@/lib/utils/response-handler["\'];?\s*\n',
            '',
            content
        )
    
    return content

def main():
    base = Path(__file__).parent / "src" / "app" / "api"
    routes = list(base.rglob('route.ts'))
    
    print(f"Cleaning {len(routes)} routes...\n")
    
    cleaned = 0
    for route in routes:
        try:
            with open(route, 'r', encoding='utf-8') as f:
                original = f.read()
            
            # Skip if not integrated
            if "@/lib/utils/error-handler" not in original:
                continue
            
            modified = clean_unused_imports(original)
            
            if modified != original:
                with open(route, 'w', encoding='utf-8') as f:
                    f.write(modified)
                cleaned += 1
                rel_path = route.relative_to(Path(__file__).parent)
                print(f"[CLEAN] {rel_path}")
        except Exception as e:
            print(f"[ERROR] {route}: {str(e)}")
    
    print(f"\n[DONE] Cleaned {cleaned} files")

if __name__ == "__main__":
    main()
