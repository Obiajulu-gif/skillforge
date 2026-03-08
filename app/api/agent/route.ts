import { NextRequest, NextResponse } from "next/server";

import { decrypt } from "@/app/lib/crypto";
import { getStacksConfig } from "@/app/lib/stacks/env";
import { readHasAccess, readListing } from "@/app/lib/stacks/server";

type ExecutePayload = {
  skillId: number;
  buyer?: string;
  input?: string;
  transactionId?: string;
};

async function loadInstructions(metadataUri: string) {
  const { ipfsGateway } = getStacksConfig();
  const metadataUrl = metadataUri.startsWith("ipfs://")
    ? `${ipfsGateway}${metadataUri.replace("ipfs://", "")}`
    : metadataUri;

  const response = await fetch(metadataUrl, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Unable to load listing metadata");
  }

  const metadata = (await response.json()) as Record<string, unknown>;
  const encrypted = metadata.encryptedInstructions;
  const iv = metadata.iv;
  const authTag = metadata.authTag;

  if (typeof encrypted === "string" && typeof iv === "string" && typeof authTag === "string") {
    return decrypt(encrypted, iv, authTag);
  }

  if (typeof metadata.description === "string") {
    return metadata.description;
  }

  return "You are a helpful AI skill.";
}

export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json()) as ExecutePayload;
    const { skillId, buyer, input, transactionId } = payload;

    if (!skillId || !Number.isFinite(skillId)) {
      return NextResponse.json({ error: "Missing required field: skillId" }, { status: 400 });
    }

    if (!buyer) {
      return NextResponse.json({ error: "A buyer principal is required for skill execution" }, { status: 403 });
    }

    const hasAccess = await readHasAccess(skillId, buyer);
    if (!hasAccess) {
      return NextResponse.json({ error: "Buyer does not have access to this listing" }, { status: 403 });
    }

    const listing = await readListing(skillId);
    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    const instructions = await loadInstructions(listing.metadataUri);

    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      return NextResponse.json({
        success: true,
        message: "Executed in simulation mode (GEMINI_API_KEY not set)",
        data: {
          output: `[SIMULATED OUTPUT]\nSkill: ${listing.name}\nInput: ${input ?? ""}\nInstructions: ${instructions.slice(0, 280)}`,
          listingId: skillId,
          transactionId: transactionId ?? null,
          buyer: buyer ?? null,
        },
      });
    }

    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `Execute this purchased skill.\n\nSkill instructions:\n${instructions}\n\nUser input:\n${input ?? ""}\n\nReturn only the skill output.`;
    const result = await model.generateContent(prompt);

    return NextResponse.json({
      success: true,
      message: `Skill #${skillId} executed`,
      data: {
        output: result.response.text().trim(),
        listingId: skillId,
        transactionId: transactionId ?? null,
        buyer: buyer ?? null,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to execute agent",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: "SkillForge Agent API Ready (Stacks)" });
}
