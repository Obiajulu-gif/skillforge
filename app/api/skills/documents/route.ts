import { NextRequest, NextResponse } from "next/server";

import { listSkillDocuments, saveSkillDocument, toSummary } from "@/app/lib/skill-documents/server";
import type { SkillDocumentCreateInput } from "@/app/lib/skill-documents/types";

export async function GET(req: NextRequest) {
  try {
    const owner = req.nextUrl.searchParams.get("owner")?.trim() || undefined;
    const documents = await listSkillDocuments(owner);

    return NextResponse.json({ documents });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Unable to load SKILL.md documents",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json()) as SkillDocumentCreateInput;
    const document = await saveSkillDocument(payload);

    return NextResponse.json({
      success: true,
      document: toSummary(document),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Unable to store SKILL.md in Supabase",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
