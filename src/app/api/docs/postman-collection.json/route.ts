import { NextResponse } from "next/server";
import { generatePostmanCollection } from "@/lib/openapi/postman-generator";

/**
 * GET /api/docs/postman-collection.json
 * Returns Postman collection JSON
 * Import into Postman for interactive testing
 */
export async function GET() {
  const collection = generatePostmanCollection();

  return NextResponse.json(collection, {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": "attachment; filename=yogvaidya-api.postman_collection.json",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
