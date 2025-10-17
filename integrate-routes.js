#!/usr/bin/env node

/**
 * Automated Route Integration Script
 * Converts all remaining API routes to use error-handler and response-handler
 * 
 * Usage: node integrate-routes.js [--dry-run] [--file <path>]
 */

const fs = require("fs");
const path = require("path");

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const specificFile = args.find((arg, i) => args[i - 1] === "--file");

const INTEGRATION_PATTERNS = [
  {
    name: "Remove NextResponse import",
    find: /import\s*{\s*NextResponse,\s*type\s*NextRequest\s*}\s*from\s*["']next\/server["'];?/,
    replace: 'import { type NextRequest } from "next/server";',
  },
  {
    name: "Remove standalone NextResponse import",
    find: /import\s*{\s*NextResponse\s*}\s*from\s*["']next\/server["'];?/,
    replace: "",
  },
  {
    name: "Add error handler imports (if not present)",
    find: /^(import\s+{.*?}\s+from\s+["']@\/lib\/config\/auth["'];)/m,
    replace:
      '$1\nimport { AuthenticationError, AuthorizationError, ValidationError, NotFoundError, ConflictError, DatabaseError, ExternalServiceError, InternalServerError } from "@/lib/utils/error-handler";\nimport { successResponse, errorResponse, createdResponse } from "@/lib/utils/response-handler";',
  },
  {
    name: "Convert NextResponse.json() errors to thrown errors",
    find: /return\s+NextResponse\.json\(\s*{.*?error:.*?},\s*{?\s*status:\s*401\s*}\s*\);?/gs,
    replace: 'throw new AuthenticationError("Unauthorized");',
  },
  {
    name: "Convert NextResponse.json() with success to successResponse",
    find: /return\s+NextResponse\.json\(\s*{\s*success:\s*true,\s*data:\s*([^}]+)}\s*(?:,\s*{.*?status.*?})?\s*\);?/g,
    replace: "return successResponse($1);",
  },
  {
    name: "Convert catch block NextResponse errors",
    find: /catch\s*\(\s*error\s*\)\s*{\s*(?:console\.error\([^)]*\);)?\s*return\s+NextResponse\.json\([^)]*\);?\s*}/gs,
    replace: "catch (error) {\n    return errorResponse(error);\n  }",
  },
];

function shouldProcessFile(filePath) {
  // Skip if already integrated
  const content = fs.readFileSync(filePath, "utf-8");
  if (
    content.includes(
      'from "@/lib/utils/error-handler"'
    )
  ) {
    return false;
  }
  return content.includes("NextResponse");
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, "utf-8");
  const originalContent = content;

  // Step 1: Fix imports
  if (!content.includes('from "@/lib/utils/error-handler"')) {
    // Remove NextResponse import
    content = content.replace(
      /import\s*{\s*NextResponse,\s*type\s*NextRequest\s*}\s*from\s*["']next\/server["'];?/,
      'import { type NextRequest } from "next/server";'
    );

    // If still has NextResponse, remove it
    content = content.replace(
      /import\s*{\s*NextResponse\s*}\s*from\s*["']next\/server["'];?/,
      ""
    );

    // Add error/response handlers after auth import
    if (content.includes('from "@/lib/config/auth"')) {
      content = content.replace(
        /(import.*?from\s*["']@\/lib\/config\/auth["'];)/,
        '$1\nimport { AuthenticationError, AuthorizationError, ValidationError, NotFoundError, ConflictError, DatabaseError, ExternalServiceError, InternalServerError } from "@/lib/utils/error-handler";\nimport { successResponse, errorResponse, createdResponse } from "@/lib/utils/response-handler";'
      );
    } else {
      // Add at top of file after all imports
      const lastImportMatch = content.lastIndexOf("import ");
      const lastImportEnd = content.indexOf(";", lastImportMatch) + 1;
      content =
        content.slice(0, lastImportEnd) +
        '\nimport { AuthenticationError, AuthorizationError, ValidationError, NotFoundError, ConflictError, DatabaseError, ExternalServiceError, InternalServerError } from "@/lib/utils/error-handler";\nimport { successResponse, errorResponse, createdResponse } from "@/lib/utils/response-handler";' +
        content.slice(lastImportEnd);
    }
  }

  // Step 2: Replace NextResponse.json() patterns with new handlers
  // This is complex - do simple replacements
  content = content.replace(
    /return\s+NextResponse\.json\(\s*{\s*(?:success:\s*true,\s*)?data:\s*([^}]+)\s*}\s*(?:,\s*{\s*status:\s*200\s*})?\s*\);?/g,
    "return successResponse($1);"
  );

  content = content.replace(
    /return\s+NextResponse\.json\(\s*{[^}]*success:\s*true[^}]*data:\s*([^}]+)[^}]*}\s*\);?/g,
    "return successResponse($1);"
  );

  content = content.replace(
    /return\s+NextResponse\.json\(\s*([^,}]+(?:{[^}]*})?)[^)]*,\s*{\s*status:\s*201\s*}\s*\);?/g,
    "return createdResponse($1);"
  );

  // Replace error responses
  content = content.replace(
    /return\s+NextResponse\.json\(\s*{[^}]*(?:error|message):[^}]*}\s*,\s*{\s*status:\s*40[134]\s*}\s*\);?/g,
    "throw new AuthenticationError('Unauthorized');"
  );

  // Simplify catch blocks
  content = content.replace(
    /catch\s*\(\s*error\s*\)\s*{\s*(?:console\.error\([^)]*\);)?\s*return\s+NextResponse\.json\([^;]*;\s*}/gs,
    "catch (error) {\n    return errorResponse(error);\n  }"
  );

  return { originalContent, newContent: content, changed: content !== originalContent };
}

function findRoutes(dir) {
  let routes = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });

  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      routes = routes.concat(findRoutes(fullPath));
    } else if (item.name === "route.ts") {
      routes.push(fullPath);
    }
  }

  return routes;
}

// Main execution
const apiDir = path.join(__dirname, "src", "app", "api");
let allRoutes = findRoutes(apiDir);

// Filter routes that need integration
allRoutes = allRoutes.filter(
  (route) => shouldProcessFile(route) && (!specificFile || route === specificFile)
);

console.log(
  `\n🔍 Found ${allRoutes.length} routes that need integration\n`
);

let processedCount = 0;
let changedCount = 0;
let failedCount = 0;

allRoutes.forEach((routePath) => {
  try {
    const result = processFile(routePath);

    if (result.changed) {
      changedCount++;
      const relativePath = path.relative(process.cwd(), routePath);

      if (dryRun) {
        console.log(`✓ [DRY RUN] Would update: ${relativePath}`);
      } else {
        fs.writeFileSync(routePath, result.newContent, "utf-8");
        console.log(`✓ Updated: ${relativePath}`);
      }
    }

    processedCount++;
  } catch (error) {
    failedCount++;
    console.error(`✗ Error processing ${routePath}: ${error.message}`);
  }
});

console.log(`\n📊 Summary:`);
console.log(`  Total processed: ${processedCount}`);
console.log(`  Changed: ${changedCount}`);
console.log(`  Failed: ${failedCount}`);

if (dryRun) {
  console.log(`\n💡 Run without --dry-run to apply changes`);
}
