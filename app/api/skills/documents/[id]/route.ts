import { NextRequest, NextResponse } from "next/server";

import { getSkillDocumentById, toSkillDocumentResponse } from "@/app/lib/skill-documents/server";
import { readHasAccess } from "@/app/lib/stacks/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const owner = req.nextUrl.searchParams.get("owner")?.trim();
    const buyer = req.nextUrl.searchParams.get("buyer")?.trim();
    const listingId = Number(req.nextUrl.searchParams.get("listingId"));
    const document = await getSkillDocumentById(id);

    const isOwner = Boolean(owner && owner === document.ownerWallet);
    const isTemplate = document.template;
    const hasPurchasedAccess =
      Boolean(buyer && Number.isFinite(listingId) && listingId > 0) && (await readHasAccess(listingId, buyer as string));
    const hasFullAccess = isTemplate || isOwner || hasPurchasedAccess;

    return NextResponse.json({
      document: toSkillDocumentResponse(document, {
        locked: !hasFullAccess,
        requiresPurchase: !isTemplate && !isOwner,
      }),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Unable to retrieve SKILL.md document",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
