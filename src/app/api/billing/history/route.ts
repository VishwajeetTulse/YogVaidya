import { type NextRequest } from "next/server";
import { getBillingHistoryAction } from "@/lib/actions/billing-actions";
import { InternalServerError, ValidationError } from "@/lib/utils/error-handler";
import { errorResponse, successResponse } from "@/lib/utils/response-handler";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      throw new ValidationError("Email parameter is required");
    }

    const result = await getBillingHistoryAction(email);

    if (!result.success) {
      throw new InternalServerError(result.error || "Failed to fetch billing history");
    }

    return successResponse(
      {
        history: result.history,
        count: result.history?.length || 0,
      },
      200,
      "Billing history retrieved successfully"
    );
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      throw new ValidationError("Email is required in request body");
    }

    const result = await getBillingHistoryAction(email);

    if (!result.success) {
      throw new InternalServerError(result.error || "Failed to fetch billing history");
    }

    return successResponse(
      {
        history: result.history,
        count: result.history?.length || 0,
      },
      200,
      "Billing history retrieved successfully"
    );
  } catch (error) {
    return errorResponse(error);
  }
}
