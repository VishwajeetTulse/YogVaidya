"use client";

import { useEffect, useState } from "react";
import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";

/**
 * Swagger UI Documentation Page
 * Interactive API documentation available at /api-docs
 */
export default function ApiDocsPage() {
  const [spec, setSpec] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSpec = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/docs/openapi.json");
        if (!response.ok) {
          throw new Error(`Failed to fetch OpenAPI spec: ${response.status}`);
        }
        const data = await response.json();
        setSpec(data);
        setError(null);
      } catch (err) {
        setError(`Failed to load API specification: ${String(err)}`);
        console.error("Error loading spec:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSpec();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center", fontFamily: "sans-serif" }}>
        <h2>Loading API Documentation...</h2>
        <p>Fetching OpenAPI specification...</p>
      </div>
    );
  }

  if (error || !spec) {
    return (
      <div style={{ padding: "20px", color: "red", fontFamily: "monospace" }}>
        <h2>Error Loading API Documentation</h2>
        <p>{error || "No specification loaded"}</p>
        <hr />
        <h3>Alternatives:</h3>
        <ul>
          <li>
            <a href="/api/docs/openapi.json" target="_blank" rel="noopener noreferrer">
              View OpenAPI JSON Spec
            </a>
          </li>
          <li>
            <a href="/api/docs/postman-collection.json" target="_blank" rel="noopener noreferrer">
              Download Postman Collection
            </a>
          </li>
        </ul>
      </div>
    );
  }

  return (
    <div style={{ padding: 0, margin: 0 }}>
      <SwaggerUI spec={spec} persistAuthorization={true} />
    </div>
  );
}
