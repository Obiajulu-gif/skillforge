import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const METADATA_DIR = path.join(process.cwd(), ".cache", "metadata");

function getMetadataPath(id: string) {
  const safeId = id.replace(/[^a-zA-Z0-9-_]/g, "");
  return path.join(METADATA_DIR, `${safeId}.json`);
}

export async function saveMetadataLocally(metadata: unknown) {
  await mkdir(METADATA_DIR, { recursive: true });
  const id = randomUUID();
  await writeFile(getMetadataPath(id), JSON.stringify(metadata, null, 2), "utf8");
  return id;
}

export async function readMetadataLocally(id: string) {
  const raw = await readFile(getMetadataPath(id), "utf8");
  return JSON.parse(raw) as Record<string, unknown>;
}
