import { NextResponse } from "next/server";
import { openApiSpec } from "@/lib/openapi/spec";

/**
 * GET /api/docs/openapi.json
 * Returns OpenAPI 3.0 specification JSON
 * Used by Swagger UI and other API documentation tools
 */
export async function GET() {
  return NextResponse.json(openApiSpec, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
