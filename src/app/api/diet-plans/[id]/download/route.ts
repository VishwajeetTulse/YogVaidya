import { NextResponse } from "next/server";
import { prisma } from "@/lib/config/prisma";
import { auth } from "@/lib/config/auth";
import { headers } from "next/headers";

import { AuthenticationError, AuthorizationError, NotFoundError } from "@/lib/utils/error-handler";

// TipTap JSON node types
interface TipTapMark {
  type: string;
  attrs?: Record<string, unknown>;
}

interface TipTapNode {
  type: string;
  text?: string;
  marks?: TipTapMark[];
  content?: TipTapNode[];
  attrs?: Record<string, unknown>;
}

// Helper function to convert TipTap JSON to HTML
function tiptapJsonToHtml(content: TipTapNode | null | undefined): string {
  if (!content) return "";

  const processNode = (node: TipTapNode | null | undefined): string => {
    if (!node) return "";

    // Handle text nodes
    if (node.type === "text") {
      let text = node.text || "";

      // Apply marks (bold, italic, etc.)
      if (node.marks) {
        node.marks.forEach((mark) => {
          if (mark.type === "bold") text = `<strong>${text}</strong>`;
          if (mark.type === "italic") text = `<em>${text}</em>`;
          if (mark.type === "code") text = `<code>${text}</code>`;
        });
      }

      return text;
    }

    // Process child nodes
    const content = node.content?.map((child) => processNode(child)).join("") || "";

    // Handle different node types
    switch (node.type) {
      case "doc":
        return content;
      case "paragraph":
        return `<p>${content}</p>`;
      case "heading":
        const level = node.attrs?.level || 1;
        return `<h${level}>${content}</h${level}>`;
      case "bulletList":
        return `<ul>${content}</ul>`;
      case "orderedList":
        return `<ol>${content}</ol>`;
      case "listItem":
        return `<li>${content}</li>`;
      case "table":
        return `<table border="1" style="border-collapse: collapse; width: 100%;">${content}</table>`;
      case "tableRow":
        return `<tr>${content}</tr>`;
      case "tableCell":
        return `<td style="border: 1px solid #ddd; padding: 8px;">${content}</td>`;
      case "tableHeader":
        return `<th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2;">${content}</th>`;
      case "image":
        return `<img src="${node.attrs?.src}" alt="${node.attrs?.alt || ""}" style="max-width: 100%;" />`;
      case "hardBreak":
        return "<br />";
      default:
        return content;
    }
  };

  return processNode(content);
}

// GET - Download diet plan as PDF (HTML for now, can be converted to PDF on client)
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      throw new AuthenticationError("Unauthorized");
    }

    const { id } = await params;
    const dietPlan = await prisma.dietPlan.findUnique({
      where: { id },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        mentor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!dietPlan) {
      throw new NotFoundError("Diet plan not found");
    }

    // Check authorization
    if (dietPlan.mentorId !== session.user.id && dietPlan.studentId !== session.user.id) {
      throw new AuthorizationError("Unauthorized");
    }

    // Convert TipTap JSON to HTML
    const htmlContent = tiptapJsonToHtml(dietPlan.content as unknown as TipTapNode);

    // Handle tags - could be string, array, or null
    let tagsString = "";
    if (dietPlan.tags) {
      if (typeof dietPlan.tags === "string") {
        tagsString = dietPlan.tags;
      } else if (Array.isArray(dietPlan.tags)) {
        tagsString = dietPlan.tags.join(", ");
      }
    }

    // Create a styled HTML document
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${dietPlan.title}</title>
  <style>
    body {
      font-family: 'Arial', sans-serif;
      line-height: 1.6;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      color: #333;
    }
    h1 {
      color: #2c3e50;
      border-bottom: 3px solid #876aff;
      padding-bottom: 10px;
    }
    h2 {
      color: #876aff;
      margin-top: 30px;
    }
    h3 {
      color: #555;
    }
    .header {
      background: linear-gradient(135deg, #876aff 0%, #a792fb 100%);
      color: white;
      padding: 30px;
      border-radius: 10px;
      margin-bottom: 30px;
    }
    .header h1 {
      margin: 0;
      color: white;
      border: none;
    }
    .meta {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 5px;
      margin-bottom: 20px;
      font-size: 14px;
    }
    .meta strong {
      color: #876aff;
    }
    .content {
      background: white;
    }
    ul, ol {
      padding-left: 25px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    table th, table td {
      border: 1px solid #ddd;
      padding: 12px;
      text-align: left;
    }
    table th {
      background-color: #876aff;
      color: white;
    }
    table tr:nth-child(even) {
      background-color: #f9f9f9;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      text-align: center;
      color: #666;
      font-size: 12px;
    }
    @media print {
      body {
        padding: 0;
      }
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${dietPlan.title}</h1>
    ${dietPlan.description ? `<p>${dietPlan.description}</p>` : ""}
  </div>

  <div class="meta">
    <p><strong>Mentor:</strong> ${dietPlan.mentor.name}</p>
    <p><strong>For:</strong> ${dietPlan.student.name} (${dietPlan.student.email})</p>
    <p><strong>Created:</strong> ${new Date(dietPlan.createdAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })}</p>
    ${tagsString ? `<p><strong>Tags:</strong> ${tagsString}</p>` : ""}
  </div>

  <div class="content">
    ${htmlContent}
  </div>

  <div class="footer">
    <p>Generated by YogVaidya Diet Plan System</p>
    <p>${new Date().toLocaleDateString()}</p>
  </div>

  <script>
    // Auto-print when opened
    window.onload = function() {
      // Small delay to ensure page is fully loaded
      setTimeout(function() {
        window.print();
      }, 500);
    };

    // Close window after printing (optional)
    window.onafterprint = function() {
      // User can manually close the window
    };
  </script>
</body>
</html>
    `;

    // Return HTML that will trigger print dialog
    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("Error generating download:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate download" },
      { status: 500 }
    );
  }
}
