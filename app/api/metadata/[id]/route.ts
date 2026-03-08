import { NextResponse } from "next/server";

import { readMetadataLocally } from "@/app/lib/metadata-store";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const metadata = await readMetadataLocally(id);
    return NextResponse.json(metadata);
  } catch (error) {
    return NextResponse.json(
      {
        error: "Metadata not found",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 404 },
    );
  }
}
