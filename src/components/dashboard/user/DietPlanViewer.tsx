"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { Image } from "@tiptap/extension-image";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, User } from "lucide-react";

interface DietPlanViewerProps {
  title: string;
  description?: string;
  content: any; // TipTap JSON
  createdAt: Date;
  mentorName: string;
  tags?: string[];
}

export function DietPlanViewer({
  title,
  description,
  content,
  createdAt,
  mentorName,
  tags = [],
}: DietPlanViewerProps) {
  // Read-only editor
  const editor = useEditor({
    immediatelyRender: false, // Fix SSR hydration mismatch
    extensions: [StarterKit, Table, TableRow, TableHeader, TableCell, Image],
    content,
    editable: false, // Students can't edit
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none p-4 bg-gray-50",
      },
    },
  });

  if (!editor) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <p className="text-sm text-muted-foreground mt-2">{description}</p>}
        <div className="flex flex-wrap gap-2 mt-3">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
        <div className="flex gap-4 text-sm text-muted-foreground mt-3">
          <span className="flex items-center gap-1">
            <User className="h-4 w-4" />
            {mentorName}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {new Date(createdAt).toLocaleDateString()}
          </span>
        </div>
      </CardHeader>
      <CardContent className="bg-gray-50">
        <EditorContent
          editor={editor}
          className="[&_.ProseMirror]:bg-gray-50 [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-6 [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-6 [&_.ProseMirror_li]:text-gray-900 [&_.ProseMirror]:text-gray-900 [&_.ProseMirror_table]:border-collapse [&_.ProseMirror_table]:w-full [&_.ProseMirror_td]:border [&_.ProseMirror_td]:border-gray-300 [&_.ProseMirror_td]:p-2 [&_.ProseMirror_th]:border [&_.ProseMirror_th]:border-gray-300 [&_.ProseMirror_th]:p-2 [&_.ProseMirror_th]:bg-gray-200 [&_.ProseMirror_th]:font-semibold"
        />
      </CardContent>
    </Card>
  );
}
