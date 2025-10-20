/**
 * Postman Collection Generator
 * Converts OpenAPI spec to Postman Collection format
 * Download from /api/docs/postman-collection.json
 */

import { openApiSpec } from "./spec";

interface PostmanCollection {
  info: {
    name: string;
    description: string;
    schema: string;
  };
  item: PostmanRequest[];
  variable: Array<{ key: string; value: string }>;
}

interface PostmanRequest {
  name: string;
  request: {
    method: string;
    header: Array<{ key: string; value: string }>;
    body?: { mode: string; raw: string };
    url: { raw: string; protocol: string; host: string[]; path: string[] };
    auth?: { type: string; bearer: Array<{ key: string; value: string }> };
  };
}

export function generatePostmanCollection(): PostmanCollection {
  const baseUrl =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

  const requests: PostmanRequest[] = [];

  // Generate requests from OpenAPI paths
  Object.entries(openApiSpec.paths).forEach(([path, methods]) => {
    Object.entries(methods).forEach(([method, operation]) => {
      if (method === "parameters" || typeof operation !== "object") return;

      const httpMethod = method.toUpperCase();
      const operationData = operation as Record<string, unknown>;
      const operationId = (operationData.operationId as string) || `${httpMethod} ${path}`;

      const request: PostmanRequest = {
        name: (operationData.summary as string) || operationId,
        request: {
          method: httpMethod,
          header: [
            {
              key: "Content-Type",
              value: "application/json",
            },
            {
              key: "Accept",
              value: "application/json",
            },
          ],
          url: {
            raw: `${baseUrl}${path}`,
            protocol: "http",
            host: [baseUrl.replace("http://", "").split("/")[0].split(":")[0]],
            path: path.split("/").filter((p) => p),
          },
        },
      };

      // Add request body if present
      if (operationData.requestBody) {
        const reqBody = operationData.requestBody as Record<string, unknown>;
        const content = reqBody.content as Record<string, unknown>;
        const jsonContent = content["application/json"] as Record<string, unknown>;
        request.request.body = {
          mode: "raw",
          raw: JSON.stringify(jsonContent?.example || {}, null, 2),
        };
      }

      // Add authentication if required
      if (operationData.security || openApiSpec.security) {
        request.request.auth = {
          type: "bearer",
          bearer: [
            {
              key: "token",
              value: "YOUR_JWT_TOKEN_HERE",
            },
          ],
        };
      }

      requests.push(request);
    });
  });

  return {
    info: {
      name: "YogVaidya API",
      description: openApiSpec.info.description,
      schema:
        "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
    },
    item: requests,
    variable: [
      {
        key: "baseUrl",
        value: baseUrl,
      },
      {
        key: "token",
        value: "YOUR_JWT_TOKEN",
      },
    ],
  };
}
