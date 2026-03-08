import { NextRequest, NextResponse } from "next/server";

import { encrypt } from "@/app/lib/crypto";
import { saveMetadataLocally } from "@/app/lib/metadata-store";
import { getStacksConfig } from "@/app/lib/stacks/env";

type SkillMetadataInput = {
  name?: string;
  description?: string;
  instructions?: string;
  category?: string;
  tags?: string[];
};

async function uploadToPinata(metadata: Record<string, unknown>) {
  const jwt = process.env.PINATA_JWT;
  const apiKey = process.env.PINATA_API_KEY;
  const secret = process.env.PINATA_SECRET_API_KEY;

  if (!jwt && !(apiKey && secret)) {
    return null;
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (jwt) {
    headers.Authorization = `Bearer ${jwt}`;
  } else if (apiKey && secret) {
    headers.pinata_api_key = apiKey;
    headers.pinata_secret_api_key = secret;
  }

  const response = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
    method: "POST",
    headers,
    body: JSON.stringify({
      pinataContent: metadata,
      pinataMetadata: {
        name: `${metadata.name ?? "skillforge-listing"}-metadata`,
      },
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Failed to upload metadata to Pinata: ${details}`);
  }

  const body = (await response.json()) as { IpfsHash: string };
  return body.IpfsHash;
}

export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json()) as SkillMetadataInput;
    const { name, description, instructions, category, tags } = payload;

    if (!name || !description || !instructions) {
      return NextResponse.json(
        { error: "Name, description, and instructions are required" },
        { status: 400 },
      );
    }

    const encrypted = encrypt(instructions);
    const metadata = {
      name,
      description,
      encryptedInstructions: encrypted.encryptedData,
      iv: encrypted.iv,
      authTag: encrypted.authTag,
      category: category || "General",
      tags: Array.isArray(tags) ? tags : [],
      version: "1.0.0",
      createdAt: new Date().toISOString(),
    };

    const ipfsHash = await uploadToPinata(metadata);
    if (ipfsHash) {
      const { ipfsGateway } = getStacksConfig();
      return NextResponse.json({
        success: true,
        storage: "ipfs",
        ipfsHash,
        ipfsUrl: `ipfs://${ipfsHash}`,
        gatewayUrl: `${ipfsGateway}${ipfsHash}`,
        metadata,
      });
    }

    const id = await saveMetadataLocally(metadata);
    const localUrl = `${req.nextUrl.origin}/api/metadata/${id}`;

    return NextResponse.json({
      success: true,
      storage: "local",
      ipfsUrl: localUrl,
      gatewayUrl: localUrl,
      metadata,
      warning: "Pinata credentials are not configured. Metadata was stored locally for development only.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
