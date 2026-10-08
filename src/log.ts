import { appendFile } from "node:fs/promises";
import type { AnnounceLogEntry } from "./announce.js";

export async function logAnnounce(path: string, record: AnnounceLogEntry): Promise<void> {
  await appendFile(path, JSON.stringify(record) + "\n", "utf8");
}
